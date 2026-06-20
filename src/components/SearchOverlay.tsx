"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { buildSearchIndex, searchIndex } from "@/lib/search-index";

const QUICK_FILTERS = ["VNINDEX", "Ngân hàng", "Dầu khí", "FPT", "Lạm phát", "CPI Mỹ", "Vàng", "Cổ phiếu"];

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!text || terms.length === 0) return <>{text}</>;

  const escaped = terms
    .filter((term) => term.length > 1)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (escaped.length === 0) return <>{text}</>;

  const splitRegex = new RegExp(`(${escaped.join("|")})`, "gi");
  const exactRegex = new RegExp(`^(${escaped.join("|")})$`, "i");

  return (
    <>
      {text.split(splitRegex).map((part, index) =>
        exactRegex.test(part) ? (
          <mark key={index} className="rounded bg-gold-500/30 px-0.5 text-gold-300">
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export function SearchOverlay({
  data,
  open,
  onClose,
  onNavigate,
}: {
  data: DashboardData;
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: number) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo(() => buildSearchIndex(data), [data]);
  const results = useMemo(() => searchIndex(index, query), [index, query]);
  const highlightTerms = useMemo(() => query.replace(/[\[\]]/g, " ").split(/\s+/).filter((w) => w.length > 1), [query]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center lg:items-center">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-[101] flex h-full w-full max-w-[1180px] flex-col px-0 lg:h-[88vh] lg:px-4">
        <div className="glass-card-gold m-3 rounded-2xl p-3 lg:p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg text-gold-500">🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="[Thông tin] ngày 09/06/2026"
              className="flex-1 bg-transparent text-sm text-silver-100 outline-none placeholder:text-silver-400/70"
            />
            {query && (
              <button onClick={() => setQuery("")} className="px-1 text-xs text-silver-400 hover:text-silver-100" aria-label="Xóa">
                ✕
              </button>
            )}
            <button onClick={onClose} className="rounded-lg bg-gold-500 px-3 py-1.5 text-[11px] font-semibold text-navy-900 hover:bg-gold-400">
              Đóng
            </button>
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {QUICK_FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                className="whitespace-nowrap rounded-full bg-navy-700/50 px-2.5 py-1 text-[10px] font-medium text-silver-300 hover:bg-navy-600 hover:text-silver-100"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6">
          {query.trim() === "" ? (
            <div className="mx-auto mt-12 max-w-xl px-6 text-center">
              <div className="mb-3 text-4xl">🔎</div>
              <p className="mb-2 text-sm font-medium text-silver-300">Tìm kiếm nhanh trong toàn bộ dashboard</p>
              <p className="text-xs leading-relaxed text-silver-400">
                Hỗ trợ từ khóa, mã cổ phiếu, thị trường, ngành, hàng hóa và cú pháp:
                <br />
                <span className="font-mono text-gold-400">[Thông tin] ngày xx/xx/xxxx</span>
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="mt-12 text-center">
              <div className="mb-2 text-3xl">😕</div>
              <p className="text-sm text-silver-300">Không tìm thấy kết quả cho</p>
              <p className="mt-1 text-sm font-medium text-gold-400">“{query}”</p>
            </div>
          ) : (
            <>
              <div className="mb-2 px-1 text-[11px] text-silver-400">
                Tìm thấy <span className="font-bold text-gold-400">{results.length}</span> kết quả
              </div>
              <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
                {results.map((item, index) => (
                  <button
                    key={`${item.title}-${index}`}
                    onClick={() => {
                      onNavigate(item.tab);
                      onClose();
                    }}
                    className="glass-card w-full rounded-2xl p-3 text-left transition-all hover:border-gold-500/50"
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-xs">{item.categoryIcon}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gold-500">{item.category}</span>
                    </div>
                    <div className="text-sm font-semibold leading-tight text-silver-100">
                      <Highlight text={item.title} terms={highlightTerms} />
                    </div>
                    {item.subtitle && (
                      <div className="mt-0.5 text-[11px] text-silver-300">
                        <Highlight text={item.subtitle} terms={highlightTerms} />
                      </div>
                    )}
                    {item.detail && (
                      <div className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-silver-400">
                        <Highlight text={item.detail} terms={highlightTerms} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
