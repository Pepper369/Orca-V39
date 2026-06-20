"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Commodity, DashboardData, MarketIndex, NewsItem, SectorData, StockPick } from "@/lib/dashboard-data";
import { exportToPDF, exportToPNG } from "@/lib/export-utils";
import { SearchOverlay } from "@/components/SearchOverlay";

const TABS = ["Tổng quan", "Vĩ mô", "Hàng hóa", "Tin tức", "Ngành", "Kỹ thuật", "Chiến lược", "Cổ phiếu"];

function OrcaLogo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="stickerBg" x1="16" y1="12" x2="102" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EAF6FF" />
          <stop offset="1" stopColor="#CDEBFF" />
        </linearGradient>
        <linearGradient id="whaleBody" x1="24" y1="44" x2="94" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2E78C7" />
          <stop offset="1" stopColor="#153E75" />
        </linearGradient>
        <linearGradient id="whaleBelly" x1="34" y1="70" x2="78" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDF6EC" />
          <stop offset="1" stopColor="#E8F4FF" />
        </linearGradient>
      </defs>
      <path d="M60 8C84 8 104 27 104 51V67C104 91 84 110 60 110C36 110 16 91 16 67V51C16 27 36 8 60 8Z" fill="url(#stickerBg)" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M29 63C29 46 43 36 61 36C78 36 90 44 92 56C100 57 104 64 100 70C97 75 89 77 83 75C78 83 67 87 56 87C40 87 29 77 29 63Z" fill="url(#whaleBody)" />
      <path d="M61 35C67 24 79 21 88 25C94 27 98 32 100 37C93 36 87 38 82 43L61 35Z" fill="#2A67AB" />
      <path d="M87 60C97 55 106 58 108 64C109 70 104 75 96 76L87 60Z" fill="#1D528D" />
      <path d="M45 72C50 78 57 81 64 81C70 81 76 79 81 75C77 84 67 90 55 90C46 90 39 86 34 80L45 72Z" fill="url(#whaleBelly)" />
      <ellipse cx="49" cy="57" rx="6" ry="4" fill="#FFFFFF" opacity="0.95" />
      <circle cx="47" cy="56" r="1.8" fill="#0A1929" />
      <path d="M57 67C61 70 67 70 72 66" stroke="#FDF6EC" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 46C36 38 31 33 26 31" stroke="#54B8FF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="28" r="3" fill="#7AD0FF" />
      <circle cx="31" cy="22" r="2.2" fill="#B6E8FF" />
      <circle cx="38" cy="18" r="1.8" fill="#D9F4FF" />
      <path d="M18 61C22 64 22 71 18 74" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const arrow = (n: number) => (n > 0 ? "▲" : n < 0 ? "▼" : "●");
const trendIcon = (v: string) => (v === "up" ? "↑" : v === "down" ? "↓" : "→");
const scoreColor = (v: number) => (v >= 70 ? "text-profit" : v >= 50 ? "text-warn" : "text-loss");
const changeColor = (v: number) => (v > 0 ? "text-profit" : v < 0 ? "text-loss" : "text-silver-400");
const changeBg = (v: number) => (v > 0 ? "bg-profit/10" : v < 0 ? "bg-loss/10" : "bg-silver-400/10");
const impactBg = (value: NewsItem["impact"]) =>
  value === "high" ? "bg-loss/20 border-loss/30" : value === "medium" ? "bg-warn/20 border-warn/30" : "bg-silver-400/20 border-silver-400/30";
const impactLabel = (value: NewsItem["impact"]) => (value === "high" ? "CAO" : value === "medium" ? "TRUNG BÌNH" : "THẤP");
const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

function SectionTitle({ number, title, icon }: { number: string; title: string; icon: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/20 text-sm font-bold text-gold-500">{number}</div>
      <span className="text-lg">{icon}</span>
      <h2 className="text-lg font-bold tracking-wide text-gradient-gold">{title}</h2>
    </div>
  );
}

function MetricGauge({ label, value }: { label: string; value: number }) {
  const color = value >= 66 ? "#00C853" : value >= 33 ? "#FFD600" : "#FF1744";
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (value / 100) * circumference * 0.75;

  return (
    <div className="flex flex-col items-center">
      <svg width="84" height="66" viewBox="0 0 100 80">
        <path d="M 14 68 A 36 36 0 0 1 86 68" fill="none" stroke="rgba(31,78,121,0.35)" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 14 68 A 36 36 0 0 1 86 68"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75}`}
          strokeDashoffset={dashOffset}
        />
        <text x="50" y="54" textAnchor="middle" fill={color} fontSize="20" fontWeight="800">
          {value}
        </text>
      </svg>
      <span className="mt-1 text-xs font-medium text-silver-300">{label}</span>
    </div>
  );
}

function MarketCard({ item }: { item: MarketIndex }) {
  return (
    <div className={`rounded-2xl border border-navy-700/30 p-3 ${changeBg(item.dailyChangePct)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-silver-100">{item.name}</div>
          <div className="text-[10px] text-silver-400">{item.ticker}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-silver-100">{fmt(item.value)}</div>
          <div className={`text-xs font-semibold ${changeColor(item.dailyChangePct)}`}>
            {arrow(item.dailyChangePct)} {pct(item.dailyChangePct)}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-navy-800/60 px-2 py-1.5">
          <div className="text-[10px] text-silver-400">1W</div>
          <div className={`text-xs font-bold ${changeColor(item.weeklyChange)}`}>{pct(item.weeklyChange)}</div>
        </div>
        <div className="rounded-lg bg-navy-800/60 px-2 py-1.5">
          <div className="text-[10px] text-silver-400">1M</div>
          <div className={`text-xs font-bold ${changeColor(item.monthlyChange)}`}>{pct(item.monthlyChange)}</div>
        </div>
      </div>
    </div>
  );
}

function MacroRow({ title, value, previous, impact, trend, unit }: { title: string; value: string; previous: string; impact: string; trend: string; unit: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-navy-700/30 py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-silver-200">{title}</div>
        <div className="mt-0.5 text-[11px] leading-relaxed text-silver-400">{impact}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-silver-100">
          {value} <span className="text-[10px] text-silver-400">{unit}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-silver-400">
          <span>Trước: {previous}</span>
          <span className={trend === "up" ? "text-profit" : trend === "down" ? "text-loss" : "text-silver-400"}>{trendIcon(trend)}</span>
        </div>
      </div>
    </div>
  );
}

function CommodityCard({ item }: { item: Commodity }) {
  const stat = (label: string, value?: number) => (
    <div className="rounded-lg bg-navy-800/60 px-2 py-1.5 text-center">
      <div className="text-[10px] text-silver-400">{label}</div>
      <div className={`text-xs font-bold ${value === undefined ? "text-silver-400" : changeColor(value)}`}>{value === undefined ? "—" : pct(value)}</div>
    </div>
  );

  return (
    <div className="glass-card rounded-2xl p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-silver-100">{item.name}</div>
          <div className="mt-0.5 text-[10px] text-gold-500">{item.source} • {item.asOf}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-silver-100">{fmt(item.price)}</div>
          <div className="text-[10px] text-silver-400">{item.unit}</div>
          <div className={`mt-0.5 text-xs font-semibold ${changeColor(item.dailyChange)}`}>{pct(item.dailyChange)}</div>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-4 gap-2">
        {stat("Ngày", item.dailyChange)}
        {stat("1W", item.weeklyChangePct)}
        {stat("1M", item.monthlyChangePct)}
        {stat("YTD", item.ytdChangePct)}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-silver-400">
        <span>Xu hướng:</span>
        <span className={item.weeklyTrend === "up" ? "text-profit" : item.weeklyTrend === "down" ? "text-loss" : "text-silver-400"}>1W {trendIcon(item.weeklyTrend)}</span>
        <span className={item.monthlyTrend === "up" ? "text-profit" : item.monthlyTrend === "down" ? "text-loss" : "text-silver-400"}>1M {trendIcon(item.monthlyTrend)}</span>
      </div>

      <p className="mb-1 text-[11px] leading-relaxed text-silver-300"><span className="font-medium text-gold-400">Driver:</span> {item.drivers}</p>
      <p className="text-[11px] leading-relaxed text-silver-300"><span className="font-medium text-gold-400">Tác động VN:</span> {item.vnImpact}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {item.vnSectors.map((sector) => (
          <span key={sector} className="rounded-full bg-navy-700/50 px-2 py-0.5 text-[10px] text-silver-300">
            {sector}
          </span>
        ))}
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="glass-card rounded-2xl p-3">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h4 className="flex-1 text-sm font-semibold leading-tight text-silver-100">{item.headline}</h4>
        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${impactBg(item.impact)}`}>{impactLabel(item.impact)}</span>
      </div>
      <p className="mb-2 text-xs leading-relaxed text-silver-300">{item.summary}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
        <span className="font-medium text-gold-500">{item.source}</span>
        <span className="text-silver-400">{item.time}</span>
        {item.verified && <span className="text-profit">✓ Đã xác minh</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {item.sectors.map((sector) => (
          <span key={sector} className="rounded bg-navy-700/50 px-1.5 py-0.5 text-[10px] text-silver-300">
            {sector}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectorCard({ sector }: { sector: SectorData }) {
  const score = Math.round((sector.relativeStrength + sector.momentum + sector.technicalScore) / 3);
  const color = score >= 70 ? "#00C853" : score >= 50 ? "#FFD600" : "#FF1744";
  return (
    <div className="rounded-2xl p-3 text-center" style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
      <div className="mb-1 text-sm font-semibold" style={{ color }}>{sector.name}</div>
      <div className="text-lg font-black" style={{ color }}>{score}</div>
      <div className="mt-1 text-[10px] text-silver-400">
        {sector.capitalFlow === "inflow" ? "🟢 Vào" : sector.capitalFlow === "outflow" ? "🔴 Ra" : "⚪ Trung lập"}
      </div>
    </div>
  );
}

function StockPickCard({ item }: { item: StockPick }) {
  return (
    <div className="glass-card-gold rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-black text-gold-500">{item.ticker}</div>
          <div className="text-xs text-silver-300">{item.company}</div>
        </div>
        <div className="text-sm text-gold-400">{stars(item.stars)}</div>
      </div>

      <div className="mb-2 text-[10px] text-silver-400">
        {item.sector} • Rủi ro: <span className={item.riskScore === "Thấp" ? "text-profit" : item.riskScore === "Cao" ? "text-loss" : "text-warn"}>{item.riskScore}</span>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-2">
        {(
          [
            ["FA", item.fundamentalScore],
            ["TA", item.technicalScore],
            ["MOM", item.momentumScore],
            ["VAL", item.valuationScore],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="text-center">
            <div className="text-[10px] text-silver-400">{label}</div>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-navy-700">
              <div className="h-full rounded-full" style={{ width: `${value}%`, background: value >= 70 ? "#00C853" : value >= 50 ? "#FFD600" : "#FF1744" }} />
            </div>
            <div className={`mt-0.5 text-xs font-bold ${scoreColor(value as number)}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-2 grid gap-1.5 text-xs md:grid-cols-2">
        <div><span className="text-silver-400">Vùng mua: </span><span className="font-medium text-silver-100">{item.entryZone}</span></div>
        <div><span className="text-silver-400">Mục tiêu 1: </span><span className="font-medium text-profit">{item.target1}</span></div>
        <div><span className="text-silver-400">Stop loss: </span><span className="font-medium text-loss">{item.stopLoss}</span></div>
        <div><span className="text-silver-400">Mục tiêu 2: </span><span className="font-medium text-profit">{item.target2}</span></div>
      </div>

      <div className="mb-1 text-[10px] text-silver-400"><span className="font-medium text-gold-500">Lợi nhuận kỳ vọng:</span> {item.expectedReturn}</div>
      <p className="mb-1 text-[11px] leading-relaxed text-silver-300"><span className="font-medium text-gold-500">Luận điểm:</span> {item.thesis}</p>
      <p className="text-[10px] text-silver-400"><span className="text-loss">⚠ Rủi ro:</span> {item.risks}</p>
    </div>
  );
}

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "#00C853" : value >= 60 ? "#4CAF50" : value >= 40 ? "#FFD600" : "#FF1744";
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-silver-300">{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-navy-700">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
    </div>
  );
}

export function DashboardClient({ data: initialData }: { data: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportMode, setExportMode] = useState(false);
  const [exporting, setExporting] = useState<null | "png" | "pdf">(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const initializedRef = useRef(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const fileName = useMemo(() => `ORCA_FINANCIAL_${data.dateShort.replace(/\//g, "-")}`, [data.dateShort]);

  async function notifyNewSnapshot(nextData: DashboardData) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const title = "🐋 ORCA cập nhật thông tin mới";
    const body = `${nextData.orcaPulse} • ${nextData.executiveSummary.nextDayOutlook.slice(0, 100)}`;
    const notification = new Notification(title, {
      body,
      tag: `orca-update-${nextData.dateShort}`,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  async function requestNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }

  async function refreshDashboard(force = false) {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const url = force ? "/api/dashboard?auto=1&force=1" : "/api/dashboard?auto=1";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const nextData = (force ? json.data : json) as DashboardData & { _meta?: { updated?: boolean; skipped?: boolean; message?: string | null } };
      if (!nextData?.date) throw new Error("Invalid data");
      const hadPrevious = initializedRef.current;
      const previousTimestamp = data.timestamp;
      setData(nextData);
      setLastRefresh(new Date().toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }));

      if (hadPrevious && (nextData._meta?.updated || nextData.timestamp !== previousTimestamp)) {
        await notifyNewSnapshot(nextData);
      }

      initializedRef.current = true;
    } catch (error) {
      console.error("Refresh dashboard failed", error);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshDashboard();
    const intervalId = setInterval(() => void refreshDashboard(), 60 * 60 * 1000);
    const onFocus = () => void refreshDashboard();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExport(type: "png" | "pdf") {
    if (exporting) return;
    setExporting(type);
    setExportMode(true);
    // Wait for all tabs to render into DOM
    await new Promise((resolve) => setTimeout(resolve, 1200));
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 200));
    try {
      const element = reportRef.current;
      if (!element) return;
      if (type === "png") await exportToPNG(element, fileName);
      if (type === "pdf") await exportToPDF(element, fileName);
    } catch (error) {
      console.error("Export failed", error);
      alert("Xuất file thất bại. Vui lòng thử lại.");
    } finally {
      setExportMode(false);
      setExporting(null);
    }
  }

  const commodityCategories = useMemo(
    () => [...new Set(data.commodities.map((item) => item.category))],
    [data.commodities]
  );

  return (
    <div ref={reportRef} className="relative mx-auto min-h-screen w-full max-w-[1500px] px-0 sm:px-4 lg:px-6">
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.03]">
        <OrcaLogo size={560} />
      </div>

      <header className="glass-card sticky top-0 z-50 border-b border-navy-700/50 px-3 py-3 lg:top-4 lg:rounded-2xl lg:border lg:px-5 lg:shadow-2xl lg:shadow-navy-950/30">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <OrcaLogo size={42} />
            <div>
              <h1 className="text-base font-black tracking-wider text-gradient-gold lg:text-lg">ORCA FINANCIAL</h1>
              <p className="text-[10px] tracking-[0.22em] text-gold-400">INTELLIGENT INVESTMENT DASHBOARD</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 lg:justify-end lg:min-w-[560px]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="rounded-lg border border-gold-500/30 bg-navy-700/60 px-2.5 py-1.5 text-[11px] font-semibold text-silver-200 transition-all hover:border-gold-500/50 hover:bg-navy-600 lg:px-3 lg:text-xs"
              >
                🔍 <span className="hidden sm:inline">Tìm kiếm</span>
              </button>
              <button
                onClick={() => void refreshDashboard(true)}
                disabled={refreshing}
                className="rounded-lg border border-gold-500/40 bg-gold-500/20 px-2.5 py-1.5 text-[11px] font-bold text-gold-400 transition-all hover:bg-gold-500/30 disabled:cursor-wait disabled:opacity-60 lg:px-3 lg:text-xs"
                title="Quét dữ liệu thị trường mới nhất ngay lập tức"
              >
                {refreshing ? "⏳ Đang quét..." : "⚡ Cập nhật ngay"}
              </button>
              <button
                onClick={() => void requestNotifications()}
                className="rounded-lg border border-navy-600/50 bg-navy-700/60 px-2.5 py-1.5 text-[11px] font-semibold text-silver-200 transition-all hover:border-gold-500/40 hover:bg-navy-600 lg:px-3 lg:text-xs"
                title="Bật thông báo khi có bản cập nhật dữ liệu mới"
              >
                🔔 {notificationPermission === "granted" ? "Bật" : notificationPermission === "denied" ? "Chặn" : "Thông báo"}
              </button>
            </div>
            <div className="max-w-[260px] text-right sm:max-w-none">
              <div className="text-[10px] text-silver-400">{data.timestamp}</div>
              <div className="mt-0.5 flex flex-wrap items-center justify-end gap-1 text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full bg-profit pulse-dot" />
                <span className="font-medium text-profit">LIVE</span>
                <span className="rounded border border-gold-500/30 px-1 py-0.5 text-gold-400">1h</span>
                {lastRefresh && <span className="text-silver-400">↻ {lastRefresh}</span>}
              </div>
              <div className="mt-1 text-[9px] text-silver-400">
                {notificationPermission === "granted"
                  ? "Thông báo web đang bật"
                  : notificationPermission === "denied"
                    ? "Thông báo web đang bị chặn"
                    : notificationPermission === "unsupported"
                      ? "Trình duyệt không hỗ trợ thông báo"
                      : "Bật thông báo để nhận tin mới mỗi giờ"}
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-3 grid grid-cols-2 gap-2 lg:ml-auto lg:max-w-[420px] ${exportMode ? "hidden" : ""}`}>
          <button
            onClick={() => void handleExport("pdf")}
            disabled={exporting !== null}
            className="glow-gold flex items-center justify-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-[11px] font-bold text-navy-900 transition-all hover:bg-gold-400 disabled:cursor-wait disabled:opacity-60"
          >
            {exporting === "pdf" ? "Đang tạo PDF..." : "📄 Tải PDF"}
          </button>
          <button
            onClick={() => void handleExport("png")}
            disabled={exporting !== null}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gold-500/40 bg-navy-700 px-3 py-2 text-[11px] font-bold text-silver-100 transition-all hover:bg-navy-600 disabled:cursor-wait disabled:opacity-60"
          >
            {exporting === "png" ? "Đang tạo PNG..." : "🖼️ Tải PNG"}
          </button>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className={`mt-2 flex w-full items-center gap-2 rounded-lg border border-navy-700/60 bg-navy-800/60 px-3 py-2 text-left transition-all hover:border-gold-500/40 lg:mx-auto lg:max-w-3xl ${exportMode ? "hidden" : ""}`}
        >
          <span className="text-sm text-gold-500">🔍</span>
          <span className="flex-1 text-[11px] text-silver-400">
            Tìm kiếm nhanh... <span className="font-mono text-silver-400/70">[Thông tin] ngày xx/xx/xxxx</span>
          </span>
        </button>

        <div className={`mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:justify-center lg:overflow-visible ${exportMode ? "hidden" : ""}`} style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                activeTab === index ? "bg-gold-500 text-navy-900" : "bg-navy-700/40 text-silver-300 hover:bg-navy-700/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 px-3 pb-20 pt-4 sm:px-0 lg:pt-5">
        {(activeTab === 0 || exportMode) && (
          <div className="animate-fade-in">
            <div className="mb-4 text-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gold-500">BÁO CÁO TÀI CHÍNH HÀNG NGÀY</h2>
              <p className="mt-1 text-xs text-silver-300">{data.date}</p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                {(() => {
                  const vni = data.vietnamMarkets.find((m) => m.ticker === "VNI" || m.name === "VNINDEX");
                  const above1800 = (vni?.value ?? 0) >= 1800;
                  return (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${above1800 ? "border-profit/30 bg-profit/20 text-profit" : "border-loss/30 bg-loss/20 text-loss"}`}>
                      {above1800 ? "🟢 VN-Index trên 1,800" : "🔴 VN-Index dưới 1,800"}
                    </span>
                  );
                })()}
                <span className="rounded-full border border-gold-500/30 bg-gold-500/15 px-2 py-0.5 text-[10px] font-medium text-gold-400">↻ Real-time 1h</span>
              </div>
            </div>

            <div className="glass-card-gold glow-gold mb-4 rounded-2xl p-4">
              <div className="mb-3 text-center">
                <div className="text-xs font-semibold tracking-wider text-gold-500">ORCA MARKET PULSE</div>
                <div className="mt-1 text-lg font-bold text-silver-100">{data.orcaPulse}</div>
              </div>
              <div className="flex flex-wrap items-center justify-around gap-4">
                <MetricGauge label="Tâm lý" value={data.sentimentScore} />
                <MetricGauge label="Tham lam/Sợ hãi" value={data.fearGreedScore} />
                <MetricGauge label="An toàn" value={100 - data.riskScore} />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <SectionTitle number="1" title="THỊ TRƯỜNG VIỆT NAM" icon="🇻🇳" />
                <div className="glass-card rounded-2xl p-3">
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
                    {data.vietnamMarkets.map((item) => <MarketCard key={item.ticker} item={item} />)}
                  </div>
                </div>
              </div>
              <div>
                <SectionTitle number="" title="THỊ TRƯỜNG TOÀN CẦU" icon="🌍" />
                <div className="glass-card rounded-2xl p-3">
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
                    {data.globalMarkets.map((item) => <MarketCard key={item.ticker} item={item} />)}
                  </div>
                </div>
              </div>
            </div>

            <div className="section-divider my-4" />
            <SectionTitle number="11" title="TÓM TẮT ĐIỀU HÀNH" icon="📋" />
            <div className="glass-card-gold rounded-2xl p-4">
              <div className="space-y-3">
                <div>
                  <div className="mb-1 text-[10px] font-semibold tracking-wider text-gold-500">🎯 THÔNG ĐIỆP CHÍNH</div>
                  <p className="text-xs leading-relaxed text-silver-200">{data.executiveSummary.keyMessage}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[10px] font-semibold text-profit">💎 CƠ HỘI LỚN NHẤT</div>
                    <p className="text-[11px] leading-relaxed text-silver-300">{data.executiveSummary.biggestOpportunity}</p>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-semibold text-loss">⚠️ RỦI RO LỚN NHẤT</div>
                    <p className="text-[11px] leading-relaxed text-silver-300">{data.executiveSummary.biggestRisk}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[10px] font-semibold text-gold-400">🔍 NGÀNH THEO DÕI</div>
                    <p className="text-xs font-medium text-silver-200">{data.executiveSummary.sectorToWatch}</p>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-semibold text-gold-400">⭐ CỔ PHIẾU THEO DÕI</div>
                    <p className="text-xs font-medium text-silver-200">{data.executiveSummary.stockToWatch}</p>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-semibold text-navy-500">📊 TRIỂN VỌNG PHIÊN SAU</div>
                  <p className="text-xs leading-relaxed text-silver-200">{data.executiveSummary.nextDayOutlook}</p>
                </div>
              </div>
            </div>

            <SectionTitle number="12" title="ORCA AI CONFIDENCE" icon="🤖" />
            <div className="glass-card rounded-2xl p-4">
              <ConfidenceBar label="Độ tin cậy dữ liệu" value={data.confidenceScores.dataReliability} />
              <ConfidenceBar label="Phân tích vĩ mô" value={data.confidenceScores.macroConfidence} />
              <ConfidenceBar label="Phân tích kỹ thuật" value={data.confidenceScores.technicalConfidence} />
              <ConfidenceBar label="Chiến lược" value={data.confidenceScores.strategyConfidence} />
              <div className="mt-3 border-t border-navy-700/50 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gold-500">TỔNG ĐIỂM TIN CẬY</span>
                  <span className="text-2xl font-black text-gold-400">{data.confidenceScores.overallConfidence}%</span>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-silver-400">{data.confidenceScores.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 1 || exportMode) && (
          <div className="animate-fade-in grid gap-4 xl:grid-cols-2">
            <div>
              <SectionTitle number="2" title="KINH TẾ VĨ MÔ VIỆT NAM" icon="🇻🇳" />
              <div className="glass-card rounded-2xl p-3">
                {data.vietnamMacro.map((item) => (
                  <MacroRow key={item.name} title={item.name} value={item.latestValue} previous={item.previousValue} impact={item.impact} trend={item.trend} unit={item.unit} />
                ))}
              </div>
            </div>
            <div>
              <SectionTitle number="" title="KINH TẾ VĨ MÔ TOÀN CẦU" icon="🌍" />
              <div className="glass-card rounded-2xl p-3">
                {data.globalMacro.map((item) => (
                  <MacroRow key={item.name} title={item.name} value={item.latestValue} previous={item.previousValue} impact={item.impact} trend={item.trend} unit={item.unit} />
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 2 || exportMode) && (
          <div className="animate-fade-in">
            <SectionTitle number="3" title="THEO DÕI HÀNG HÓA" icon="📦" />
            <div className="glass-card-gold mb-4 rounded-2xl p-3">
              <div className="text-xs font-semibold tracking-wider text-gold-500">COMMODITIES INTELLIGENCE</div>
              <div className="mt-1 text-[11px] text-silver-300">
                Theo dõi <span className="font-bold text-gold-400">{data.commodities.length}</span> mặt hàng, gồm năng lượng, kim loại quý, kim loại cơ bản, nguyên liệu công nghiệp và nông sản.
              </div>
            </div>

            {commodityCategories.map((category) => {
              const items = data.commodities.filter((item) => item.category === category);
              return (
                <div key={category} className="mb-4">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="text-xs font-semibold tracking-wider text-gold-500">{category.toUpperCase()}</div>
                    <div className="text-[10px] text-silver-400">{items.length} mặt hàng</div>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {items.map((item) => <CommodityCard key={item.name} item={item} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(activeTab === 3 || exportMode) && (
          <div className="animate-fade-in grid gap-4 xl:grid-cols-3">
            <div>
              <SectionTitle number="4" title="TIN VĨ MÔ QUỐC TẾ" icon="🌐" />
              <div className="space-y-2">{data.globalNews.map((item, index) => <NewsCard key={`g-${index}`} item={item} />)}</div>
            </div>
            <div>
              <SectionTitle number="5" title="TIN VĨ MÔ VIỆT NAM" icon="🇻🇳" />
              <div className="space-y-2">{data.vietnamNews.map((item, index) => <NewsCard key={`v-${index}`} item={item} />)}</div>
            </div>
            <div>
              <SectionTitle number="6" title="TIN DOANH NGHIỆP QUAN TRỌNG" icon="🏢" />
              <div className="space-y-2">{data.corporateNews.map((item, index) => <NewsCard key={`c-${index}`} item={item} />)}</div>
            </div>
          </div>
        )}

        {(activeTab === 4 || exportMode) && (
          <div className="animate-fade-in">
            <SectionTitle number="7" title="PHÂN TÍCH LUÂN CHUYỂN NGÀNH" icon="🔄" />
            <div className="glass-card mb-4 rounded-2xl p-3">
              <div className="mb-2 text-center text-[10px] font-medium text-silver-400">HEATMAP ĐIỂM SỐ TỔNG HỢP</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {data.sectors.map((sector) => <SectorCard key={sector.name} sector={sector} />)}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3">
              <div className="mb-2 text-[10px] font-medium text-silver-400">CHI TIẾT NGÀNH</div>
              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  <div className="mb-1 grid grid-cols-6 gap-2 border-b border-navy-700/30 pb-2 text-[10px] font-medium text-silver-400">
                    <span>Ngành</span>
                    <span className="text-center">RS</span>
                    <span className="text-center">Dòng tiền</span>
                    <span className="text-center">MOM</span>
                    <span className="text-center">Định giá</span>
                    <span className="text-center">TA</span>
                  </div>
                  {data.sectors.map((sector) => (
                    <div key={sector.name} className="grid grid-cols-6 gap-2 border-b border-navy-700/20 py-2 text-xs last:border-0">
                      <span className="truncate font-medium text-silver-200">{sector.name}</span>
                      <span className={`text-center font-bold ${scoreColor(sector.relativeStrength)}`}>{sector.relativeStrength}</span>
                      <span className={`text-center text-[11px] ${sector.capitalFlow === "inflow" ? "text-profit" : sector.capitalFlow === "outflow" ? "text-loss" : "text-silver-400"}`}>
                        {sector.capitalFlow === "inflow" ? "⬆ Vào" : sector.capitalFlow === "outflow" ? "⬇ Ra" : "—"}
                      </span>
                      <span className={`text-center font-bold ${scoreColor(sector.momentum)}`}>{sector.momentum}</span>
                      <span className={`text-center text-[11px] ${sector.valuation === "attractive" ? "text-profit" : sector.valuation === "expensive" ? "text-loss" : "text-warn"}`}>
                        {sector.valuation === "attractive" ? "Hấp dẫn" : sector.valuation === "expensive" ? "Đắt" : "Hợp lý"}
                      </span>
                      <span className={`text-center font-bold ${scoreColor(sector.technicalScore)}`}>{sector.technicalScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 5 || exportMode) && (
          <div className="animate-fade-in">
            <SectionTitle number="8" title="PHÂN TÍCH KỸ THUẬT" icon="📈" />
            <div className="grid gap-4 xl:grid-cols-2">
              {([
                ["VNINDEX", data.technicalAnalysis.vnindex],
                ["VN30", data.technicalAnalysis.vn30],
              ] as const).map(([label, ta]) => (
                <div key={label} className="glass-card-gold rounded-2xl p-4">
                  <h3 className="mb-3 text-base font-bold text-gold-500">{label}</h3>

                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {(
                      [
                        ["MA20", ta.ma20],
                        ["MA50", ta.ma50],
                        ["MA200", ta.ma200],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-navy-800/50 p-2 text-center">
                        <div className="text-[10px] text-silver-400">{k}</div>
                        <div className="text-xs font-bold text-silver-100">{fmt(v)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-navy-800/50 p-2">
                      <div className="text-[10px] text-silver-400">RSI</div>
                      <div className={`text-sm font-bold ${ta.rsi > 70 ? "text-loss" : ta.rsi < 30 ? "text-profit" : "text-warn"}`}>{ta.rsi}</div>
                    </div>
                    <div className="rounded-lg bg-navy-800/50 p-2">
                      <div className="text-[10px] text-silver-400">ADX</div>
                      <div className={`text-sm font-bold ${ta.adx > 25 ? "text-profit" : "text-silver-300"}`}>{ta.adx}</div>
                    </div>
                  </div>

                  <div className="mb-3 grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg bg-navy-800/50 p-2">
                      <div className="text-[10px] text-silver-400">MACD</div>
                      <div className="text-xs text-silver-200">{ta.macd}</div>
                    </div>
                    <div className="rounded-lg bg-navy-800/50 p-2">
                      <div className="text-[10px] text-silver-400">Bollinger</div>
                      <div className="text-[11px] text-silver-200">{fmt(ta.bollingerUpper)} / {fmt(ta.bollingerLower)}</div>
                    </div>
                  </div>

                  <div className="mb-3 rounded-lg bg-navy-800/50 p-2">
                    <div className="text-[10px] text-silver-400">Độ rộng thị trường</div>
                    <div className="text-xs font-medium text-silver-200">{ta.breadth}</div>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <div>
                      <div className="mb-1 text-[10px] font-semibold text-profit">HỖ TRỢ</div>
                      {ta.supports.map((value, index) => (
                        <div key={index} className="mb-0.5 text-xs text-silver-200">S{index + 1}: <span className="font-bold text-profit">{fmt(value)}</span></div>
                      ))}
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-semibold text-loss">KHÁNG CỰ</div>
                      {ta.resistances.map((value, index) => (
                        <div key={index} className="mb-0.5 text-xs text-silver-200">R{index + 1}: <span className="font-bold text-loss">{fmt(value)}</span></div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] font-semibold text-gold-500">TRIỂN VỌNG NGẮN HẠN</div>
                      <p className="text-[11px] text-silver-300">{ta.shortTermOutlook}</p>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-gold-500">TRIỂN VỌNG TRUNG HẠN</div>
                      <p className="text-[11px] text-silver-300">{ta.mediumTermOutlook}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2 border-t border-navy-700/30 pt-2">
                      <span className="text-[10px] text-silver-400">Xác suất tăng:</span>
                      <span className="text-sm font-bold text-gold-400">{ta.probabilityScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 6 || exportMode) && (
          <div className="animate-fade-in">
            <SectionTitle number="9" title="CHIẾN LƯỢC ORCA REAL-TIME" icon="🎯" />

            <div className="glass-card-gold glow-gold mb-4 rounded-2xl p-4 text-center">
              <div className="mb-1 text-[10px] font-semibold tracking-wider text-gold-500">CHẾ ĐỘ THỊ TRƯỜNG HIỆN TẠI</div>
              <div className="text-xl font-black text-gold-400">{data.strategy.regime}</div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="glass-card rounded-2xl p-4">
                  <div className="mb-3 text-xs font-semibold text-gold-500">PHÂN BỔ TÀI SẢN KHUYẾN NGHỊ</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(
                      [
                        ["📈", "Cổ phiếu", data.strategy.stocksPct, "#00C853"],
                        ["💵", "Tiền mặt", data.strategy.cashPct, "#9CA3AF"],
                        ["📄", "Trái phiếu", data.strategy.bondsPct, "#2196F3"],
                        ["🪙", "Vàng", data.strategy.goldPct, "#D4AF37"],
                      ] as const
                    ).map(([icon, label, percent, color]) => (
                      <div key={label} className="text-center">
                        <div className="mb-0.5 text-lg">{icon}</div>
                        <div className="relative mx-auto mb-1 h-14 w-14">
                          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(31,78,121,0.3)" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${percent}, 100`} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{percent}%</div>
                        </div>
                        <div className="text-[10px] font-medium text-silver-300">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-3">
                  <div className="mb-2 text-xs font-semibold text-gold-500">NGÀNH KHUYẾN NGHỊ</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.strategy.recommendedSectors.map((sector) => (
                      <span key={sector} className="rounded-full border border-profit/30 bg-profit/15 px-2.5 py-1 text-[11px] font-medium text-profit">
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-3">
                  <div className="mb-2 text-xs font-semibold text-gold-500">CHỦ ĐỀ GIAO DỊCH</div>
                  {data.strategy.tradingThemes.map((theme, index) => (
                    <div key={index} className="mb-1.5 flex items-start gap-2 last:mb-0">
                      <span className="mt-0.5 text-xs text-gold-400">▸</span>
                      <span className="text-[11px] text-silver-200">{theme}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="glass-card rounded-2xl p-3">
                  <div className="mb-2 text-xs font-semibold text-gold-500">XÚC TÁC THEO DÕI</div>
                  {data.strategy.catalysts.map((item, index) => (
                    <div key={index} className="mb-1.5 flex items-start gap-2 last:mb-0">
                      <span className="mt-0.5 text-xs text-warn">⚡</span>
                      <span className="text-[11px] text-silver-200">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="glass-card-gold rounded-2xl p-3">
                  <div className="mb-2 text-xs font-semibold text-loss">⚠️ QUẢN LÝ RỦI RO</div>
                  <p className="text-[11px] leading-relaxed text-silver-300">{data.strategy.riskGuidance}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 7 || exportMode) && (
          <div className="animate-fade-in">
            <SectionTitle number="10" title="KHUYẾN NGHỊ CỔ PHIẾU ORCA" icon="⭐" />
            <div className="mb-3 text-center text-[10px] text-silver-400">Watchlist/ý tưởng giao dịch theo chiến lược bảo toàn vốn và chọn lọc cơ hội.</div>
            <div className="grid gap-3 xl:grid-cols-2">{data.stockPicks.map((item) => <StockPickCard key={item.ticker} item={item} />)}</div>
            <div className="glass-card mt-3 rounded-2xl p-3">
              <div className="text-center text-[10px] leading-relaxed text-silver-400">
                <span className="font-medium text-loss">⚠️ KHUYẾN CÁO:</span> Thông tin mang tính tham khảo, không phải khuyến nghị mua bán bắt buộc. Nhà đầu tư cần tự đánh giá rủi ro và quản trị vị thế.
              </div>
            </div>
          </div>
        )}

        <footer className="mt-8 border-t border-navy-700/30 pt-4">
          <div className="text-center">
            <OrcaLogo size={32} />
            <p className="mt-2 text-xs font-bold text-gold-500">ORCA FINANCIAL</p>
            <p className="text-[10px] text-gold-400">Intelligent Investment</p>
            <p className="mt-2 text-[10px] text-silver-400">GitHub-ready fullstack financial dashboard</p>
            <p className="mt-1 text-[9px] leading-relaxed text-silver-400/70">Nguồn dữ liệu nền: thị trường Việt Nam, thị trường toàn cầu, hàng hóa, vĩ mô và tin tức tổng hợp. Hệ thống có thể tự quét dữ liệu mới mỗi 1 giờ.</p>
          </div>
        </footer>
      </main>

      <SearchOverlay data={data} open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={(tab) => setActiveTab(tab)} />
    </div>
  );
}
