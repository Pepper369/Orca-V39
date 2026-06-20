import type { DashboardData } from "@/lib/dashboard-data";

export interface SearchItem {
  category: string;
  categoryIcon: string;
  title: string;
  subtitle: string;
  detail: string;
  tab: number;
  haystack: string;
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

function createItem(category: string, categoryIcon: string, title: string, subtitle: string, detail: string, tab: number): SearchItem {
  return {
    category,
    categoryIcon,
    title,
    subtitle,
    detail,
    tab,
    haystack: normalizeText(`${category} ${title} ${subtitle} ${detail}`),
  };
}

export function buildSearchIndex(data: DashboardData): SearchItem[] {
  const items: SearchItem[] = [];

  data.vietnamMarkets.forEach((m) => {
    items.push(
      createItem(
        "Thị trường VN",
        "🇻🇳",
        `${m.name} (${m.ticker})`,
        `${m.value.toLocaleString("en-US")} | ${m.dailyChangePct >= 0 ? "+" : ""}${m.dailyChangePct.toFixed(2)}%`,
        `1W ${m.weeklyChange.toFixed(2)}% · 1M ${m.monthlyChange.toFixed(2)}% · ${m.trend}`,
        0
      )
    );
  });

  data.globalMarkets.forEach((m) => {
    items.push(
      createItem(
        "Thị trường toàn cầu",
        "🌍",
        `${m.name} (${m.ticker})`,
        `${m.value.toLocaleString("en-US")} | ${m.dailyChangePct >= 0 ? "+" : ""}${m.dailyChangePct.toFixed(2)}%`,
        `1W ${m.weeklyChange.toFixed(2)}% · 1M ${m.monthlyChange.toFixed(2)}% · ${m.trend}`,
        0
      )
    );
  });

  data.vietnamMacro.forEach((m) => {
    items.push(createItem("Vĩ mô Việt Nam", "📊", m.name, `${m.latestValue} ${m.unit}`, `${m.impact} | Trước: ${m.previousValue}`, 1));
  });

  data.globalMacro.forEach((m) => {
    items.push(createItem("Vĩ mô toàn cầu", "🌐", m.name, `${m.latestValue} ${m.unit}`, `${m.impact} | Trước: ${m.previousValue}`, 1));
  });

  data.commodities.forEach((c) => {
    items.push(
      createItem(
        `Hàng hóa · ${c.category}`,
        "📦",
        c.name,
        `${c.price.toLocaleString("en-US")} ${c.unit} | ${c.dailyChange >= 0 ? "+" : ""}${c.dailyChange.toFixed(2)}%`,
        `${c.drivers} | ${c.vnImpact}`,
        2
      )
    );
  });

  data.globalNews.forEach((n) => items.push(createItem("Tin quốc tế", "📰", n.headline, `${n.source} · ${n.time}`, n.summary, 3)));
  data.vietnamNews.forEach((n) => items.push(createItem("Tin Việt Nam", "🇻🇳", n.headline, `${n.source} · ${n.time}`, n.summary, 3)));
  data.corporateNews.forEach((n) => items.push(createItem("Tin doanh nghiệp", "🏢", n.headline, `${n.source} · ${n.time}`, n.summary, 3)));

  data.sectors.forEach((s) => {
    items.push(
      createItem(
        "Ngành",
        "🔄",
        s.name,
        `RS ${s.relativeStrength} · MOM ${s.momentum} · TA ${s.technicalScore}`,
        `Dòng tiền ${s.capitalFlow} · Định giá ${s.valuation}`,
        4
      )
    );
  });

  (["vnindex", "vn30"] as const).forEach((key) => {
    const ta = data.technicalAnalysis[key];
    const label = key === "vnindex" ? "VNINDEX" : "VN30";
    items.push(
      createItem(
        "Kỹ thuật",
        "📈",
        `${label} — ${ta.trend}`,
        `RSI ${ta.rsi} · ADX ${ta.adx}`,
        `${ta.macd} | Hỗ trợ ${ta.supports.join(", ")} | Kháng cự ${ta.resistances.join(", ")}`,
        5
      )
    );
  });

  items.push(
    createItem(
      "Chiến lược",
      "🎯",
      data.strategy.regime,
      `CP ${data.strategy.stocksPct}% · Tiền ${data.strategy.cashPct}% · Trái phiếu ${data.strategy.bondsPct}% · Vàng ${data.strategy.goldPct}%`,
      data.strategy.riskGuidance,
      6
    )
  );

  data.strategy.tradingThemes.forEach((theme) => items.push(createItem("Chủ đề giao dịch", "🎯", theme, "Chiến lược ORCA", "", 6)));
  data.strategy.catalysts.forEach((item) => items.push(createItem("Xúc tác", "⚡", item, "Chiến lược ORCA", "", 6)));

  data.stockPicks.forEach((s) => {
    items.push(
      createItem(
        "Cổ phiếu",
        "⭐",
        `${s.ticker} — ${s.company}`,
        `${s.sector} · Mua ${s.entryZone} · SL ${s.stopLoss}`,
        `${s.thesis} | Rủi ro: ${s.risks}`,
        7
      )
    );
  });

  items.push(createItem("Tóm tắt", "📋", "Thông điệp chính", data.date, data.executiveSummary.keyMessage, 0));
  items.push(createItem("Tóm tắt", "💎", "Cơ hội lớn nhất", data.date, data.executiveSummary.biggestOpportunity, 0));
  items.push(createItem("Tóm tắt", "⚠️", "Rủi ro lớn nhất", data.date, data.executiveSummary.biggestRisk, 0));
  items.push(createItem("Tóm tắt", "🔭", "Triển vọng phiên sau", data.date, data.executiveSummary.nextDayOutlook, 0));

  return items;
}

export function searchIndex(index: SearchItem[], rawQuery: string) {
  const query = rawQuery.trim();
  if (!query) return [];

  const dateMatch = query.match(/(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?/);
  let searchPart = query.replace(/[\[\]]/g, " ");
  let dateTokens: string[] = [];

  if (dateMatch) {
    searchPart = searchPart.replace(dateMatch[0], " ");
    const dd = dateMatch[1].padStart(2, "0");
    const mm = dateMatch[2].padStart(2, "0");
    const yyyy = dateMatch[3] ?? "";
    dateTokens = [`${dd}/${mm}${yyyy ? `/${yyyy}` : ""}`, `${dateMatch[1]}/${dateMatch[2]}${yyyy ? `/${yyyy}` : ""}`].map(normalizeText);
  }

  const keywords = normalizeText(searchPart).split(" ").filter(Boolean);

  return index.filter((item) => {
    const hitKeyword = keywords.length === 0 || keywords.every((keyword) => item.haystack.includes(keyword));
    const hitDate = dateTokens.length === 0 || dateTokens.some((token) => item.haystack.includes(token));
    return hitKeyword && hitDate;
  });
}
