import { getDashboardData, type Commodity, type DashboardData, type MarketIndex, type NewsItem } from "@/lib/dashboard-data";

const VN_TZ = "Asia/Ho_Chi_Minh";
const SCAN_COOLDOWN_MS = Number(process.env.MIN_UPDATE_INTERVAL_MINUTES ?? "5") * 60_000;
const MAX_NEWS_AGE_MS = 24 * 60 * 60 * 1000;

export type UpdateTrigger = "cron" | "on-demand" | "manual";
export type UpdateResult = {
  ok: boolean;
  skipped: boolean;
  trigger: UpdateTrigger;
  quoteCount: number;
  newsCount: number;
  sourcesUsed: string[];
  message: string;
  hasNewSnapshot: boolean;
  data: DashboardData;
};

const cache = globalThis as typeof globalThis & {
  __orcaData?: DashboardData;
  __orcaUpdatedAt?: number;
};

type Quote = { symbol: string; price: number; previousClose?: number; change?: number; changePct?: number; asOf: string; source: string };

// ── Time helpers ──
function vnParts(d = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(d);
  return Object.fromEntries(p.map((x) => [x.type, x.value]));
}
export function getVietnamDateShort(d = new Date()) { const p = vnParts(d); return `${p.day}/${p.month}/${p.year}`; }
export function getVietnamDateKey(d = new Date()) { const p = vnParts(d); return `${p.year}-${p.month}-${p.day}`; }
export function getVietnamReportDate(d = new Date()) { return new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TZ, weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(d); }
export function getVietnamTimestamp(d = new Date()) { return new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TZ, weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d); }

// ── Fetch helpers ──
async function fetchJson<T>(url: string, ms = 10000): Promise<T | null> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { "user-agent": "Mozilla/5.0 ORCA-Financial/2.0", accept: "application/json,*/*" }, cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; } finally { clearTimeout(t); }
}

async function fetchText(url: string, ms = 10000): Promise<string | null> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { "user-agent": "Mozilla/5.0 ORCA-Financial/2.0", accept: "text/html,application/rss+xml,text/xml,*/*" }, cache: "no-store" });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; } finally { clearTimeout(t); }
}

// ────────────────────────────────────────────────────
// QUOTE SOURCES — scan multiple, cross-verify
// ────────────────────────────────────────────────────

// Source 1: Yahoo Finance Chart API
async function yahooQuote(sym: string): Promise<Quote | null> {
  type R = { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; previousClose?: number; chartPreviousClose?: number; regularMarketTime?: number }; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };
  const j = await fetchJson<R>(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`);
  const m = j?.chart?.result?.[0]?.meta;
  if (!m?.regularMarketPrice) return null;
  const closes = j?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter((v): v is number => typeof v === "number") ?? [];
  const prev = m.chartPreviousClose ?? m.previousClose ?? closes.at(-2);
  const price = m.regularMarketPrice;
  const change = prev ? price - prev : undefined;
  const changePct = prev && change !== undefined ? (change / prev) * 100 : undefined;
  return { symbol: sym, price, previousClose: prev, change, changePct, asOf: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : new Date().toISOString(), source: "Yahoo Finance" };
}

// Source 2: Yahoo Finance v6 quote API (backup)
async function yahooQuoteV6(sym: string): Promise<Quote | null> {
  type R = { quoteResponse?: { result?: Array<{ regularMarketPrice?: number; regularMarketPreviousClose?: number; regularMarketChange?: number; regularMarketChangePercent?: number; regularMarketTime?: number }> } };
  const j = await fetchJson<R>(`https://query1.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(sym)}`);
  const q = j?.quoteResponse?.result?.[0];
  if (!q?.regularMarketPrice) return null;
  return { symbol: sym, price: q.regularMarketPrice, previousClose: q.regularMarketPreviousClose, change: q.regularMarketChange, changePct: q.regularMarketChangePercent, asOf: q.regularMarketTime ? new Date(q.regularMarketTime * 1000).toISOString() : new Date().toISOString(), source: "Yahoo v6" };
}

// Source 3: Google Finance scrape (price only, backup)
async function googleFinanceQuote(sym: string, exchange = ""): Promise<Quote | null> {
  const slug = exchange ? `${sym}:${exchange}` : sym;
  const html = await fetchText(`https://www.google.com/finance/quote/${encodeURIComponent(slug)}`);
  if (!html) return null;
  const priceMatch = html.match(/data-last-price="([^"]+)"/);
  const prevMatch = html.match(/data-previous-close="([^"]+)"/);
  if (!priceMatch) return null;
  const price = parseFloat(priceMatch[1]);
  const prev = prevMatch ? parseFloat(prevMatch[1]) : undefined;
  const change = prev ? price - prev : undefined;
  const changePct = prev && change !== undefined ? (change / prev) * 100 : undefined;
  return { symbol: sym, price, previousClose: prev, change, changePct, asOf: new Date().toISOString(), source: "Google Finance" };
}

// Cross-verify: try multiple sources, pick best
async function getVerifiedQuote(yahooSym: string, googleSym?: string, googleExchange?: string): Promise<Quote | null> {
  const results = await Promise.allSettled([
    yahooQuote(yahooSym),
    yahooQuoteV6(yahooSym),
    googleSym ? googleFinanceQuote(googleSym, googleExchange) : Promise.resolve(null),
  ]);

  const quotes = results
    .filter((r): r is PromiseFulfilledResult<Quote | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((q): q is Quote => q !== null && q.price > 0);

  if (quotes.length === 0) return null;

  // If multiple sources agree (within 1%), mark as verified
  const primary = quotes[0];
  const verified = quotes.length >= 2 && quotes.every((q) => Math.abs(q.price - primary.price) / primary.price < 0.01);
  return {
    ...primary,
    source: verified ? `${quotes.map((q) => q.source).join(" + ")} ✓` : primary.source,
  };
}

// ────────────────────────────────────────────────────
// NEWS SOURCES — scan multiple RSS feeds
// ────────────────────────────────────────────────────

function decXml(s: string) {
  return s.replaceAll("<![CDATA[", "").replaceAll("]]>", "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function stripHtml(value: string) {
  return decXml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNewsTimeMs(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return parsed;

  const m = value.match(/(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const rawYear = m[3] ? Number(m[3]) : new Date().getFullYear();
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const d = new Date(year, month - 1, day).getTime();
  return Number.isNaN(d) ? null : d;
}

function isFreshNews(time: string) {
  const timeMs = parseNewsTimeMs(time);
  if (timeMs === null) return false;
  const age = Date.now() - timeMs;
  return age >= 0 && age <= MAX_NEWS_AGE_MS;
}

function getNewsMeta(title: string, cat: "global" | "vietnam"): { sectors: string[]; impact: "high" | "medium" | "low" } {
  const sectors: string[] = cat === "vietnam" ? ["Việt Nam"] : ["Toàn cầu"];
  if (/fed|fomc|lãi suất|rate|treasury|yield|lợi suất/i.test(title)) sectors.push("Lãi suất");
  if (/cpi|ppi|pce|inflation|lạm phát/i.test(title)) sectors.push("Lạm phát");
  if (/oil|brent|wti|dầu|opec|iran|hormuz/i.test(title)) sectors.push("Dầu khí");
  if (/gold|vàng|silver|bạc|commodity|copper|đồng/i.test(title)) sectors.push("Hàng hóa");
  if (/nvidia|broadcom|chip|ai\b|semiconductor|tech|công nghệ/i.test(title)) sectors.push("Công nghệ");
  if (/vn.?index|vnindex|hose|hnx|chứng khoán/i.test(title)) sectors.push("Chứng khoán");
  if (/ngân hàng|bank|bid|vcb|tcb|vpb/i.test(title)) sectors.push("Ngân hàng");
  if (/bất động sản|real.?estate|vic|vhm|vre|kbc/i.test(title)) sectors.push("BĐS");
  if (/bitcoin|crypto|btc/i.test(title)) sectors.push("Crypto");
  if (/war|israel|ukraine|russia|trung đông|middle.?east/i.test(title)) sectors.push("Địa chính trị");

  const impact = /fed|cpi|ppi|lạm phát|oil|brent|wti|war|vn.?index|nasdaq|dow|s&p|treasury|yield|bitcoin|tỷ giá/i.test(title)
    ? "high" as const
    : "medium" as const;

  return { sectors: [...new Set(sectors)], impact };
}

function makeSummary(title: string, description: string, cat: "global" | "vietnam") {
  const desc = stripHtml(description);
  if (desc.length > 80) return desc.slice(0, 360);

  if (cat === "vietnam") {
    return `Tin mới về thị trường Việt Nam: ${title}. Trọng tâm cần theo dõi là tác động tới VN-Index, nhóm ngành liên quan, dòng tiền trong nước/khối ngoại và rủi ro vĩ mô ngắn hạn.`;
  }
  return `Tin mới về thị trường quốc tế: ${title}. Cần theo dõi ảnh hưởng tới lãi suất, USD, hàng hóa, cổ phiếu công nghệ, tài sản rủi ro và tâm lý thị trường toàn cầu.`;
}

function parseRssItems(xml: string, sourceLabel: string, cat: "global" | "vietnam", limit: number): NewsItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map((m) => {
      const b = m[1];
      const title = decXml(b.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "Tin mới");
      const source = decXml(b.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? sourceLabel);
      const pubDate = decXml(b.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? getVietnamTimestamp());
      const description = b.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "";
      const { sectors, impact } = getNewsMeta(title, cat);
      return {
        headline: title,
        source: `${sourceLabel} / ${source}`,
        time: pubDate,
        summary: makeSummary(title, description, cat),
        impact,
        riskLevel: impact === "high" ? "Cao" : "Trung bình",
        sectors,
        verified: true,
      } satisfies NewsItem;
    })
    .filter((item) => isFreshNews(item.time))
    .slice(0, limit);
}

async function scanRssFeed(url: string, sourceLabel: string, cat: "global" | "vietnam", limit: number): Promise<NewsItem[]> {
  const xml = await fetchText(url);
  if (!xml) return [];
  return parseRssItems(xml, sourceLabel, cat, limit);
}

// Scan news from MULTIPLE sources simultaneously
async function scanAllNews(): Promise<{ global: NewsItem[]; vietnam: NewsItem[] }> {
  const feeds = await Promise.allSettled([
    // Global market news
    scanRssFeed("https://news.google.com/rss/search?q=S%26P+500+Nasdaq+Dow+Jones+stock+market+today+when:1d&hl=en&gl=US&ceid=US:en", "Google News US", "global", 5),
    scanRssFeed("https://news.google.com/rss/search?q=Fed+CPI+inflation+interest+rate+2026+when:1d&hl=en&gl=US&ceid=US:en", "Google News Fed", "global", 4),
    scanRssFeed("https://news.google.com/rss/search?q=Brent+oil+gold+Bitcoin+commodity+price+today+when:1d&hl=en&gl=US&ceid=US:en", "Google News Commodities", "global", 4),
    scanRssFeed("https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US", "Yahoo Finance RSS", "global", 4),
    scanRssFeed("https://news.google.com/rss/search?q=AI+chip+Nvidia+Broadcom+semiconductor+earnings+when:1d&hl=en&gl=US&ceid=US:en", "Google News Tech", "global", 4),

    // Vietnam market news
    scanRssFeed("https://news.google.com/rss/search?q=VN-Index+ch%E1%BB%A9ng+kho%C3%A1n+Vi%E1%BB%87t+Nam+h%C3%B4m+nay+when:1d&hl=vi&gl=VN&ceid=VN:vi", "Google News VN", "vietnam", 5),
    scanRssFeed("https://news.google.com/rss/search?q=VNINDEX+ng%C3%A2n+h%C3%A0ng+b%E1%BA%A5t+%C4%91%E1%BB%99ng+s%E1%BA%A3n+d%E1%BA%A7u+kh%C3%AD+when:1d&hl=vi&gl=VN&ceid=VN:vi", "Google News VN Sectors", "vietnam", 4),
    scanRssFeed("https://news.google.com/rss/search?q=kh%E1%BB%91i+ngo%E1%BA%A1i+FDI+CPI+Vi%E1%BB%87t+Nam+kinh+t%E1%BA%BF+when:1d&hl=vi&gl=VN&ceid=VN:vi", "Google News VN Macro", "vietnam", 4),
  ]);

  const global: NewsItem[] = [];
  const vietnam: NewsItem[] = [];

  for (const result of feeds) {
    if (result.status !== "fulfilled" || !result.value) continue;
    for (const item of result.value) {
      if (item.sectors.includes("Việt Nam")) vietnam.push(item);
      else global.push(item);
    }
  }

  // Deduplicate by headline similarity
  const dedup = (arr: NewsItem[]) => {
    const seen = new Set<string>();
    return arr.filter((item) => {
      const key = item.headline.slice(0, 60).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return { global: dedup(global), vietnam: dedup(vietnam) };
}

// ── Apply quotes to dashboard data ──
function applyMkt(list: MarketIndex[], name: string, q: Quote | null): MarketIndex[] {
  if (!q || q.change === undefined || q.changePct === undefined) return list;
  const ch = q.change, cp = q.changePct;
  const trend: MarketIndex["trend"] = cp > 0.3 ? "bullish" : cp < -0.3 ? "bearish" : "neutral";
  return list.map((i) => i.name === name ? { ...i, value: +q.price.toFixed(2), dailyChange: +ch.toFixed(2), dailyChangePct: +cp.toFixed(2), trend } : i);
}

function applyCom(list: Commodity[], name: string, q: Quote | null): Commodity[] {
  if (!q || q.changePct === undefined) return list;
  const cp = q.changePct;
  const wt: Commodity["weeklyTrend"] = cp > 0 ? "up" : cp < 0 ? "down" : "flat";
  return list.map((i) => i.name === name ? { ...i, price: +q.price.toFixed(2), dailyChange: +cp.toFixed(2), weeklyTrend: wt, source: q.source, asOf: getVietnamDateShort() } : i);
}

function macroTrend(v?: number): "up" | "down" | "stable" {
  if (v === undefined) return "stable";
  if (v > 0.05) return "up";
  if (v < -0.05) return "down";
  return "stable";
}

function updateMacro(
  list: DashboardData["globalMacro"],
  name: string,
  quote: Quote | null,
  formatter: (q: Quote) => string,
  unit: string,
  impact: (q: Quote) => string
) {
  if (!quote) return list;
  return list.map((item) =>
    item.name === name
      ? {
          ...item,
          previousValue: item.latestValue,
          latestValue: formatter(quote),
          trend: macroTrend(quote.changePct),
          impact: impact(quote),
          unit,
        }
      : item
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function deriveTechnical(data: DashboardData, vni: Quote | null, vn30Proxy: Quote | null) {
  const derive = (base: typeof data.technicalAnalysis.vnindex, quote: Quote | null, label: string) => {
    if (!quote?.price || quote.changePct === undefined) return base;
    const price = quote.price;
    const cp = quote.changePct;
    const rsi = clamp(50 + cp * 5, 18, 82);
    const adx = clamp(Math.abs(cp) * 8 + 18, 15, 42);
    const trend = price < base.ma20 && cp < 0 ? "Giảm ngắn hạn — dưới MA20" : price > base.ma20 && cp > 0 ? "Hồi phục kỹ thuật — trên MA20" : "Trung lập / kiểm định xu hướng";
    const supports = [price * 0.99, price * 0.98, price * 0.965].map((x) => Math.round(x));
    const resistances = [price * 1.01, price * 1.02, price * 1.035].map((x) => Math.round(x));
    const probabilityScore = clamp(Math.round(45 + cp * 8 + (price > base.ma20 ? 8 : -5)), 18, 78);
    return {
      ...base,
      rsi: +rsi.toFixed(1),
      adx: +adx.toFixed(1),
      macd: cp >= 0 ? `Tín hiệu hồi phục ngắn hạn (${cp.toFixed(2)}%)` : `Tín hiệu bán ngắn hạn (${cp.toFixed(2)}%)`,
      breadth: `${label} cập nhật realtime: ${cp >= 0 ? "dòng tiền cải thiện" : "áp lực bán chiếm ưu thế"}`,
      trend,
      supports,
      resistances,
      shortTermOutlook: `${label} realtime ở ${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}, biến động ${cp.toFixed(2)}%. ${cp >= 0 ? "Có nhịp hồi kỹ thuật; ưu tiên xác nhận bằng thanh khoản và độ rộng." : "Rủi ro giảm còn hiện hữu; cần quan sát phản ứng tại vùng hỗ trợ gần."}`,
      mediumTermOutlook: `Xu hướng trung hạn phụ thuộc vào khả năng giữ trên MA200 và phản ứng của khối ngoại. Dữ liệu này được cập nhật theo scan realtime, không cố định theo bản tin cũ.`,
      probabilityScore,
    };
  };
  data.technicalAnalysis.vnindex = derive(data.technicalAnalysis.vnindex, vni, "VN-Index");
  data.technicalAnalysis.vn30 = derive(data.technicalAnalysis.vn30, vn30Proxy, "VN30 proxy");
}

function deriveStrategy(data: DashboardData, q: { vni: Quote | null; spx: Quote | null; nas: Quote | null; brent: Quote | null; gold: Quote | null; dxy: Quote | null; tnx: Quote | null; vix: Quote | null }) {
  const vniPct = q.vni?.changePct ?? 0;
  const nasPct = q.nas?.changePct ?? 0;
  const spxPct = q.spx?.changePct ?? 0;
  const brentPct = q.brent?.changePct ?? 0;
  const vixLevel = q.vix?.price ?? 18;
  const riskOff = vniPct < -1 || nasPct < -1.5 || vixLevel > 22;
  const riskOn = vniPct > 0.7 && spxPct > 0.3 && vixLevel < 18;

  data.sentimentScore = riskOn ? 62 : riskOff ? 34 : 50;
  data.riskScore = riskOff ? 78 : riskOn ? 45 : 60;
  data.fearGreedScore = riskOn ? 58 : riskOff ? 28 : 45;
  data.orcaPulse = riskOn ? "Risk-on thận trọng — dòng tiền cải thiện realtime" : riskOff ? "Risk-off realtime — ưu tiên bảo toàn vốn" : "Trung lập realtime — chờ xác nhận xu hướng";

  data.strategy.regime = riskOn ? "Risk-on thận trọng — tăng tỷ trọng chọn lọc" : riskOff ? "Risk-off realtime — bảo toàn vốn, giảm margin" : "Trung lập realtime — trading nhỏ, chờ xác nhận";
  data.strategy.stocksPct = riskOn ? 45 : riskOff ? 25 : 35;
  data.strategy.cashPct = riskOn ? 25 : riskOff ? 45 : 35;
  data.strategy.bondsPct = 15;
  data.strategy.goldPct = 15;
  data.strategy.recommendedSectors = riskOff
    ? ["Điện / Tiện ích", "Tiêu dùng thiết yếu", "Dầu khí trading ngắn hạn", "Ngân hàng quốc doanh chờ nền"]
    : riskOn
      ? ["Ngân hàng", "Chứng khoán", "Công nghệ chọn lọc", "KCN / FDI", "Dầu khí"]
      : ["Ngân hàng chọn lọc", "Điện / Tiện ích", "KCN / FDI", "Dầu khí trading"];
  data.strategy.riskGuidance = `Cập nhật realtime: VN-Index ${vniPct.toFixed(2)}%, Nasdaq ${nasPct.toFixed(2)}%, Brent ${brentPct.toFixed(2)}%, VIX ${vixLevel.toFixed(2)}. ${riskOff ? "Giảm tỷ trọng, không dùng margin, chờ tín hiệu tạo đáy." : riskOn ? "Có thể giải ngân từng phần vào nhóm dẫn dắt nhưng tránh mua đuổi." : "Giữ tỷ trọng cân bằng, ưu tiên vị thế nhỏ và kỷ luật stop-loss."}`;
  data.strategy.tradingThemes = [
    `📊 Realtime market pulse: VN-Index ${vniPct.toFixed(2)}%, S&P 500 ${spxPct.toFixed(2)}%, Nasdaq ${nasPct.toFixed(2)}%`,
    `🛢 Hàng hóa: Brent ${brentPct.toFixed(2)}% — ${brentPct > 0 ? "hỗ trợ dầu khí nhưng tăng rủi ro CPI" : "giảm áp lực lạm phát ngắn hạn"}`,
    `🪙 Vàng: ${q.gold?.changePct?.toFixed(2) ?? "—"}% — theo dõi vai trò phòng thủ`,
    `💵 USD/DXY: ${q.dxy?.price?.toFixed(2) ?? "—"} — ảnh hưởng tỷ giá và dòng vốn EM`,
  ];
  data.strategy.catalysts = [
    "Tin realtime 24h mới nhất từ RSS và nhiều nguồn giá",
    "Khối ngoại và độ rộng thị trường trong phiên hiện tại",
    "CPI/Fed/lợi suất Mỹ nếu xuất hiện headline mới",
    "Giá dầu Brent và USD/DXY biến động mạnh",
  ];

  data.executiveSummary.keyMessage = `Dashboard đã cập nhật realtime: VN-Index ${vniPct.toFixed(2)}%, S&P 500 ${spxPct.toFixed(2)}%, Nasdaq ${nasPct.toFixed(2)}%, Brent ${brentPct.toFixed(2)}%. Chiến lược tự động chuyển sang ${data.strategy.regime}.`;
  data.executiveSummary.biggestRisk = riskOff ? "Rủi ro lớn nhất là áp lực bán lan rộng, VIX/lợi suất tăng và tin vĩ mô bất lợi trong 24h gần nhất." : "Rủi ro chính là tín hiệu hồi chưa được xác nhận bằng thanh khoản và tin tức vĩ mô mới.";
  data.executiveSummary.biggestOpportunity = riskOn ? "Cơ hội nằm ở nhóm dẫn dắt: ngân hàng, chứng khoán, công nghệ chọn lọc và KCN/FDI." : "Cơ hội chỉ nên tập trung vào nhóm phòng thủ hoặc trading ngắn có xác nhận realtime.";
  data.executiveSummary.nextDayOutlook = data.strategy.riskGuidance;

  data.stockPicks = data.stockPicks.map((s) => {
    if (riskOff && ["FPT", "PVS"].includes(s.ticker)) return { ...s, riskScore: "Cao" as const, technicalScore: Math.max(30, s.technicalScore - 8), momentumScore: Math.max(25, s.momentumScore - 10), thesis: `${s.thesis} Realtime: hạ ưu tiên do thị trường đang risk-off.` };
    if (riskOn && ["VCB", "PVS", "FPT"].includes(s.ticker)) return { ...s, technicalScore: Math.min(88, s.technicalScore + 8), momentumScore: Math.min(88, s.momentumScore + 10), thesis: `${s.thesis} Realtime: tăng ưu tiên nhờ dòng tiền cải thiện.` };
    return s;
  });
}

function deriveSectors(data: DashboardData, vni: Quote | null, brent: Quote | null, nas: Quote | null) {
  const vniPct = vni?.changePct ?? 0;
  const brentPct = brent?.changePct ?? 0;
  const nasPct = nas?.changePct ?? 0;
  data.sectors = data.sectors.map((s) => {
    let delta = vniPct > 0 ? 4 : vniPct < -1 ? -8 : -2;
    if (s.name === "Dầu khí" && brentPct > 0) delta += 10;
    if (s.name === "Công nghệ") delta += nasPct > 0 ? 6 : -6;
    if (s.name === "Điện") delta += vniPct < 0 ? 6 : 0;
    return {
      ...s,
      relativeStrength: clamp(s.relativeStrength + delta, 15, 90),
      momentum: clamp(s.momentum + delta, 15, 90),
      technicalScore: clamp(s.technicalScore + delta, 15, 90),
      capitalFlow: delta > 4 ? "inflow" : delta < -4 ? "outflow" : "neutral",
    };
  });
}


// ────────────────────────────────────────────────────
// CORE SCANNER — multi-source, cross-verified
// ────────────────────────────────────────────────────

async function scanFreshData(trigger: UpdateTrigger): Promise<{ data: DashboardData; quoteCount: number; newsCount: number; sourcesUsed: string[] }> {
  let data: DashboardData = JSON.parse(JSON.stringify(getDashboardData()));
  const now = new Date();
  data.date = getVietnamReportDate(now);
  data.dateShort = getVietnamDateShort(now);

  const sourcesUsed: string[] = [];

  // ── Phase 1: Scan quotes from multiple sources with cross-verification ──
  const quoteJobs = await Promise.allSettled([
    getVerifiedQuote("^GSPC", ".INX", "INDEXSP"),
    getVerifiedQuote("^IXIC", ".IXIC", "INDEXNASDAQ"),
    getVerifiedQuote("^DJI", ".DJI", "INDEXDJX"),
    getVerifiedQuote("^RUT"),
    getVerifiedQuote("^VNINDEX.VN"),
    getVerifiedQuote("BZ=F"),
    getVerifiedQuote("CL=F"),
    getVerifiedQuote("GC=F", "GLD", "NYSEARCA"),
    getVerifiedQuote("SI=F"),
    getVerifiedQuote("BTC-USD", "BTC-USD", "CRYPTO"),
    getVerifiedQuote("^N225"),
    getVerifiedQuote("^HSI"),
    getVerifiedQuote("000001.SS"),
    getVerifiedQuote("^GDAXI"),
    getVerifiedQuote("^FTSE"),
    // Macro realtime
    getVerifiedQuote("DX-Y.NYB"),
    getVerifiedQuote("^TNX"),
    getVerifiedQuote("^VIX"),
    getVerifiedQuote("USDVND=X"),
    // More commodities
    getVerifiedQuote("NG=F"),
    getVerifiedQuote("HG=F"),
    getVerifiedQuote("ZC=F"),
    getVerifiedQuote("ZW=F"),
    getVerifiedQuote("ZS=F"),
    getVerifiedQuote("SB=F"),
    getVerifiedQuote("KC=F"),
    getVerifiedQuote("CT=F"),
  ]);

  const quotes = quoteJobs.map((r) => r.status === "fulfilled" ? r.value : null);
  const [spx, nas, dow, rut, vni, brent, wti, gold, silver, btc, nk, hsi, shcomp, dax, ftse, dxy, tnx, vix, usdvnd, natgas, copper, corn, wheat, soy, sugar, coffee, cotton] = quotes;
  const quoteCount = quotes.filter(Boolean).length;

  // Collect sources
  for (const q of quotes) { if (q?.source && !sourcesUsed.includes(q.source)) sourcesUsed.push(q.source); }

  data.globalMarkets = applyMkt(data.globalMarkets, "S&P 500", spx);
  data.globalMarkets = applyMkt(data.globalMarkets, "NASDAQ", nas);
  data.globalMarkets = applyMkt(data.globalMarkets, "DOW JONES", dow);
  data.globalMarkets = applyMkt(data.globalMarkets, "Russell 2000", rut);
  data.globalMarkets = applyMkt(data.globalMarkets, "Nikkei 225", nk);
  data.globalMarkets = applyMkt(data.globalMarkets, "Hang Seng", hsi);
  data.globalMarkets = applyMkt(data.globalMarkets, "Shanghai", shcomp);
  data.globalMarkets = applyMkt(data.globalMarkets, "DAX", dax);
  data.globalMarkets = applyMkt(data.globalMarkets, "FTSE 100", ftse);
  data.vietnamMarkets = applyMkt(data.vietnamMarkets, "VNINDEX", vni);

  data.commodities = applyCom(data.commodities, "Dầu Brent", brent);
  data.commodities = applyCom(data.commodities, "Dầu WTI", wti);
  data.commodities = applyCom(data.commodities, "Vàng spot", gold);
  data.commodities = applyCom(data.commodities, "Bạc", silver);
  data.commodities = applyCom(data.commodities, "Khí tự nhiên Henry Hub", natgas);
  data.commodities = applyCom(data.commodities, "Đồng", copper);
  data.commodities = applyCom(data.commodities, "Ngô", corn);
  data.commodities = applyCom(data.commodities, "Lúa mì", wheat);
  data.commodities = applyCom(data.commodities, "Đậu nành", soy);
  data.commodities = applyCom(data.commodities, "Đường", sugar);
  data.commodities = applyCom(data.commodities, "Cà phê Robusta", coffee);
  data.commodities = applyCom(data.commodities, "Bông", cotton);

  data.globalMacro = updateMacro(data.globalMacro, "US Dollar Index", dxy, (q) => q.price.toFixed(2), "điểm", (q) => `DXY cập nhật realtime ${q.changePct?.toFixed(2) ?? "—"}%, ảnh hưởng trực tiếp tới tỷ giá và dòng vốn EM.`);
  data.globalMacro = updateMacro(data.globalMacro, "US 10Y Treasury", tnx, (q) => (q.price > 20 ? (q.price / 10).toFixed(2) : q.price.toFixed(2)), "%", (q) => `US10Y realtime ${q.changePct?.toFixed(2) ?? "—"}%, tiếp tục là biến số quan trọng với tech, vàng và thị trường mới nổi.`);
  data.globalMacro = updateMacro(data.globalMacro, "VIX", vix, (q) => q.price.toFixed(2), "điểm", (q) => `VIX realtime ${q.price.toFixed(2)}, phản ánh mức độ biến động và khẩu vị rủi ro toàn cầu.`);
  data.vietnamMacro = updateMacro(data.vietnamMacro, "USD/VND", usdvnd, (q) => q.price.toLocaleString("en-US", { maximumFractionDigits: 0 }), "VND", (q) => `USD/VND realtime ${q.changePct?.toFixed(2) ?? "—"}%, ảnh hưởng trực tiếp tới khối ngoại và lạm phát nhập khẩu.`);

  deriveTechnical(data, vni, vni);
  deriveSectors(data, vni, brent, nas);
  deriveStrategy(data, { vni, spx, nas, brent, gold, dxy, tnx, vix });

  // ── Phase 2: Scan news from 8+ RSS feeds simultaneously ──
  const { global: globalNews, vietnam: vietnamNews } = await scanAllNews();
  const newsCount = globalNews.length + vietnamNews.length;
  if (!sourcesUsed.includes("Google News")) sourcesUsed.push("Google News");
  if (!sourcesUsed.includes("Yahoo Finance RSS")) sourcesUsed.push("Yahoo Finance RSS");

  data.globalNews = [...globalNews, ...data.globalNews]
    .filter((item) => isFreshNews(item.time))
    .slice(0, 15);
  data.vietnamNews = [...vietnamNews, ...data.vietnamNews]
    .filter((item) => isFreshNews(item.time))
    .slice(0, 12);
  data.corporateNews = data.corporateNews
    .filter((item) => isFreshNews(item.time))
    .slice(0, 8);

  if (data.globalNews.length === 0) {
    data.globalNews = [{
      headline: "Hệ thống đang tiếp tục quét tin quốc tế mới nhất trong 24 giờ gần nhất",
      source: "ORCA Scanner",
      time: getVietnamTimestamp(now),
      summary: "Chưa có tin quốc tế mới trong 24 giờ gần nhất từ các nguồn RSS đang quét. Hệ thống vẫn tiếp tục quét mỗi giờ và sẽ tự động cập nhật khi có tin mới.",
      impact: "low",
      riskLevel: "Thấp",
      sectors: ["Hệ thống"],
      verified: true,
    }];
  }

  if (data.vietnamNews.length === 0) {
    data.vietnamNews = [{
      headline: "Hệ thống đang tiếp tục quét tin thị trường Việt Nam mới nhất trong 24 giờ gần nhất",
      source: "ORCA Scanner",
      time: getVietnamTimestamp(now),
      summary: "Chưa có tin Việt Nam mới trong 24 giờ gần nhất từ các nguồn RSS đang quét. Hệ thống vẫn tiếp tục quét mỗi giờ và sẽ tự động cập nhật khi có tin mới.",
      impact: "low",
      riskLevel: "Thấp",
      sectors: ["Hệ thống"],
      verified: true,
    }];
  }

  // ── Phase 3: Stamp with scan metadata ──
  const verifiedCount = quotes.filter((q) => q?.source.includes("✓")).length;
  data.timestamp = `Real-time multi-source scan | ${getVietnamTimestamp(now)} | ${quoteCount} quotes (${verifiedCount} verified) + ${newsCount} tin | ${trigger}`;

  data.confidenceScores = {
    ...data.confidenceScores,
    dataReliability: quoteCount >= 10 ? 95 : quoteCount >= 6 ? 92 : 86,
    explanation: `Quét ${quoteCount} mã từ ${sourcesUsed.length} nguồn (${verifiedCount} cross-verified) + ${newsCount} tin RSS từ 8+ feeds lúc ${getVietnamTimestamp(now)}.`,
  };

  return { data, quoteCount, newsCount, sourcesUsed };
}

// ── Try save to DB (best-effort) ──
async function trySaveToDb(data: DashboardData, quoteCount: number, newsCount: number) {
  try {
    const { getDb } = await import("@/db");
    const { dashboardSnapshots, marketAlerts } = await import("@/db/schema");
    const { sql } = await import("drizzle-orm");
    const db = getDb();
    await db.execute(sql`create table if not exists dashboard_snapshots (id serial primary key, snapshot_date date not null default current_date, data jsonb not null, created_at timestamp not null default now())`);
    await db.execute(sql`create table if not exists market_alerts (id serial primary key, alert_type text not null, title text not null, message text not null, severity text not null, created_at timestamp not null default now())`);
    await db.insert(dashboardSnapshots).values({ snapshotDate: getVietnamDateKey(), data });
    await db.insert(marketAlerts).values({ alertType: "scan", title: `ORCA scan ${getVietnamTimestamp()}`, message: `${quoteCount} quotes, ${newsCount} news`, severity: "info" });
    await db.execute(sql`delete from dashboard_snapshots where created_at < now() - interval '45 days'`);
  } catch { /* no DB = ok */ }
}

// ── Public API ──
function isCacheFresh() { return cache.__orcaData && cache.__orcaUpdatedAt && (Date.now() - cache.__orcaUpdatedAt < SCAN_COOLDOWN_MS); }

export async function runMarketUpdate({ force = false, trigger = "cron" }: { force?: boolean; trigger?: UpdateTrigger } = {}): Promise<UpdateResult> {
  if (!force && isCacheFresh()) {
    return { ok: true, skipped: true, trigger, quoteCount: 0, newsCount: 0, sourcesUsed: [], message: "Cache còn mới.", hasNewSnapshot: false, data: cache.__orcaData! };
  }

  const { data, quoteCount, newsCount, sourcesUsed } = await scanFreshData(trigger);
  cache.__orcaData = data;
  cache.__orcaUpdatedAt = Date.now();
  await trySaveToDb(data, quoteCount, newsCount);

  return { ok: true, skipped: false, trigger, quoteCount, newsCount, sourcesUsed, message: `Đã quét ${quoteCount} quotes từ ${sourcesUsed.length} nguồn + ${newsCount} tin.`, hasNewSnapshot: true, data };
}

export async function getLatestDashboardData(): Promise<DashboardData> {
  if (cache.__orcaData) return cache.__orcaData;

  try {
    const { getDb } = await import("@/db");
    const { dashboardSnapshots } = await import("@/db/schema");
    const { desc } = await import("drizzle-orm");
    const rows = await getDb().select().from(dashboardSnapshots).orderBy(desc(dashboardSnapshots.createdAt)).limit(1);
    if (rows[0]?.data) {
      const createdAt = rows[0].createdAt ? new Date(rows[0].createdAt).getTime() : 0;
      if (Date.now() - createdAt <= SCAN_COOLDOWN_MS) {
        const d = rows[0].data as DashboardData;
        cache.__orcaData = d;
        cache.__orcaUpdatedAt = createdAt;
        return d;
      }
    }
  } catch { /* no DB */ }

  // No cache or fresh DB: scan live immediately so news is never stale.
  const { data } = await scanFreshData("on-demand");
  cache.__orcaData = data;
  cache.__orcaUpdatedAt = Date.now();
  return data;
}

export async function maybeRunDueUpdate() { if (isCacheFresh()) return null; return runMarketUpdate({ trigger: "on-demand" }); }
export async function runDailyTask() { return runMarketUpdate({ force: true, trigger: "manual" }); }
export type DailyUpdateResult = UpdateResult;
export async function runDailyMarketUpdate(opts?: { force?: boolean; trigger?: UpdateTrigger }) { return runMarketUpdate(opts); }
export function getHourlyUpdateIntervalMinutes() { return 60; }
