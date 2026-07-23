"use client";

import Link from "next/link";
import React from "react";
import { TrendingUp, TrendingDown, Volume2, LayoutGrid, Layers, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Candle, Instrument } from "@/lib/api";

const MotionLink = motion(Link);

export type EquitySnapshot = {
  instrument: Instrument;
  latest: Candle | null;
  previous: Candle | null;
  error: string | null;
};

type Props = {
  snapshots: EquitySnapshot[];
  indexSnapshots?: EquitySnapshot[];
  selectedSymbol: string;
  title?: string;
  eyebrow?: string;
  showMoreHref?: string;
  showTable?: boolean;
};

export default function PopularEquitiesDashboard({
  snapshots,
  indexSnapshots = [],
  selectedSymbol,
  title = "Popular NSE equities",
  eyebrow = "FYERS Market Data",
  showMoreHref,
  showTable = true,
}: Props) {
  const available = snapshots.filter((snapshot) => snapshot.latest);
  const topMover = [...available].sort(
    (left, right) => Math.abs(changePct(right)) - Math.abs(changePct(left))
  )[0];
  const strongestVolume = [...available].sort(
    (left, right) => Number(right.latest?.volume ?? 0) - Number(left.latest?.volume ?? 0)
  )[0];

  return (
    <section className="mb-10 text-white" aria-labelledby="market-heading">
      <div className="flex justify-between items-end mb-6">
        <div>
          <span className="text-[12px] font-semibold text-[#8A5CF6] uppercase tracking-wider block mb-1">
            {eyebrow}
          </span>
          <h2 id="market-heading" className="text-[26px] font-bold text-white tracking-tight">
            {title}
          </h2>
        </div>
        {showMoreHref ? (
          <Link
            className="px-4 py-2 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-full text-[13px] font-semibold text-white transition-all hover:bg-[#202631]"
            href={showMoreHref}
          >
            Show more
          </Link>
        ) : (
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/[0.04] text-[#A3A8B3] border border-white/[0.05]">
            Daily OHLCV
          </span>
        )}
      </div>

      {indexSnapshots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-16 mb-6" aria-label="Market indices">
          {indexSnapshots.map((snapshot) => (
            <MotionLink
              href={`/charts?symbol=${encodeURIComponent(snapshot.instrument.symbol)}`}
              className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 flex flex-col justify-between shadow-subtle hover:bg-[#202631]"
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              key={snapshot.instrument.symbol}
            >
              <span className="text-[12px] text-[#6F7787] font-semibold uppercase tracking-wider">
                {snapshot.instrument.name}
              </span>
              {snapshot.latest ? (
                <div className="flex justify-between items-baseline mt-1.5">
                  <strong className="text-[20px] font-bold text-white font-variant-numeric: tabular-nums">
                    ₹{formatPrice(snapshot.latest.close)}
                  </strong>
                  <small
                    className={`text-[12px] font-semibold font-variant-numeric: tabular-nums ${changePct(snapshot) >= 0 ? "text-[#58D68D]" : "text-[#FF6B6B]"
                      }`}
                  >
                    {formatSignedPct(changePct(snapshot))}
                  </small>
                </div>
              ) : (
                <div className="flex justify-between items-baseline mt-1.5">
                  <strong className="text-[16px] font-bold text-[#6F7787]">Unavailable</strong>
                  <small className="text-[11px] text-[#6F7787]">
                    {snapshot.error ?? "No recent quote"}
                  </small>
                </div>
              )}
            </MotionLink>
          ))}
        </div>
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-16 mb-6">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-20 flex items-center gap-3 shadow-subtle"
        >
          <div className="p-3 bg-[#60A5FA]/10 border border-[#60A5FA]/20 rounded-xl text-[#60A5FA]">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] text-[#6F7787] font-semibold uppercase tracking-wider block">
              Tracked Securities
            </span>
            <strong className="text-[20px] font-bold font-variant-numeric: tabular-nums">
              {available.length}
            </strong>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-20 flex items-center gap-3 shadow-subtle"
        >
          <div className="p-3 bg-[#B7D65C]/10 border border-[#B7D65C]/20 rounded-xl text-[#B7D65C]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[12px] text-[#6F7787] font-semibold uppercase tracking-wider block">
              Largest Move
            </span>
            <strong className="text-[16px] font-bold truncate block font-variant-numeric: tabular-nums">
              {topMover
                ? `${topMover.instrument.symbol.replace("NSE:", "")} (${formatSignedPct(changePct(topMover))})`
                : "No data"}
            </strong>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-20 flex items-center gap-3 shadow-subtle"
        >
          <div className="p-3 bg-[#8A5CF6]/10 border border-[#8A5CF6]/20 rounded-xl text-[#8A5CF6]">
            <Volume2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[12px] text-[#6F7787] font-semibold uppercase tracking-wider block">
              Highest Volume
            </span>
            <strong className="text-[16px] font-bold truncate block">
              {strongestVolume
                ? strongestVolume.instrument.symbol.replace("NSE:", "")
                : "No data"}
            </strong>
          </div>
        </motion.div>
      </div>

      {/* Equity List Layout */}
      <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] overflow-hidden shadow-subtle divide-y divide-white/[0.04]">
        {snapshots.map((snapshot) => {
          const isSelected = snapshot.instrument.symbol === selectedSymbol;
          const isUp = changePct(snapshot) >= 0;
          return (
            <MotionLink
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex items-center justify-between p-16 md:p-20 hover:bg-[#202631]/40 transition-colors ${isSelected ? "bg-[#202631]/60" : ""
                }`}
              href={`/charts?symbol=${encodeURIComponent(snapshot.instrument.symbol)}`}
              key={snapshot.instrument.symbol}
            >
              {/* Symbol & Name */}
              <div className="flex items-center gap-16 min-w-[200px] max-w-[280px]">
                <div className="min-w-0">
                  <strong className="text-[14px] font-bold text-white block">
                    {snapshot.instrument.symbol.replace("NSE:", "")}
                  </strong>
                  <span className="text-[11px] text-[#6F7787] truncate block mt-0.5">
                    {snapshot.instrument.name}
                  </span>
                </div>
              </div>

              {/* Sparkline trend */}
              <div className="hidden sm:block flex-1 max-w-[120px] mx-8">
                {snapshot.latest ? (
                  <svg className="w-25 h-20 flex-shrink-0" viewBox="0 0 100 30">
                    <polyline
                      fill="none"
                      stroke={isUp ? "#58D68D" : "#FF6B6B"}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={isUp ? "0,25 20,20 40,24 60,14 80,18 100,5" : "0,5 20,12 40,8 60,20 80,18 100,25"}
                    />
                  </svg>
                ) : null}
              </div>

              {/* Volume / Activity Info */}
              <div className="hidden md:flex flex-col items-end min-w-[100px]">
                <span className="text-[11px] text-[#6F7787] uppercase tracking-wider">Volume</span>
                <span className="text-[13px] text-[#A3A8B3] mt-0.5 font-variant-numeric: tabular-nums">
                  {snapshot.latest ? Number(snapshot.latest.volume).toLocaleString("en-IN") : "—"}
                </span>
              </div>

              {/* Price & Change */}
              <div className="text-right min-w-[120px] flex items-center justify-end gap-16">
                <div className="text-right">
                  {snapshot.latest ? (
                    <>
                      <strong className="text-[15px] font-bold text-white font-variant-numeric: tabular-nums block">
                        ₹{formatPrice(snapshot.latest.close)}
                      </strong>
                      <div className={`text-[12px] font-semibold mt-0.5 font-variant-numeric: tabular-nums ${isUp ? "text-[#58D68D]" : "text-[#FF6B6B]"
                        }`}>
                        {formatSignedPct(changePct(snapshot))}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] text-[#6F7787] font-semibold block">Unavailable</span>
                      <div className="text-[11px] text-[#6F7787] truncate max-w-[100px] mt-0.5">
                        {snapshot.error ?? "No candles"}
                      </div>
                    </>
                  )}
                </div>
                <ArrowUpRight className="w-5 h-5 text-[#6F7787]" />
              </div>
            </MotionLink>
          );
        })}
      </div>

      {showTable && (
        <div className="mt-4">
          <MarketComparisonTable snapshots={snapshots} />
        </div>
      )}
    </section>
  );
}

export function MarketComparisonCard({
  snapshots,
  title = "Stock comparison",
  eyebrow = "FYERS Comparison",
  showMoreHref,
}: {
  snapshots: EquitySnapshot[];
  title?: string;
  eyebrow?: string;
  showMoreHref?: string;
}) {
  return (
    <section className="mb-10 text-white" aria-labelledby="comparison-heading">
      <div className="flex justify-between items-end mb-6">
        <div>
          <span className="text-[12px] font-semibold text-[#8A5CF6] uppercase tracking-wider block mb-1">
            {eyebrow}
          </span>
          <h2 id="comparison-heading" className="text-[26px] font-bold text-white tracking-tight">
            {title}
          </h2>
        </div>
        {showMoreHref ? (
          <Link
            className="px-4 py-2 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-full text-[13px] font-semibold text-white transition-all hover:bg-[#202631]"
            href={showMoreHref}
          >
            Show more
          </Link>
        ) : (
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/[0.04] text-[#A3A8B3] border border-white/[0.05]">
            Quotes
          </span>
        )}
      </div>

      <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 shadow-subtle mb-6">
        <div className="mb-4">
          <strong className="text-[15px] font-bold text-white">Daily move comparison</strong>
          <p className="text-[12px] text-[#6F7787] mt-0.5">Positive and negative movers</p>
        </div>
        <ComparisonBarChart snapshots={snapshots} />
      </div>

      <MarketComparisonTable snapshots={snapshots} />
    </section>
  );
}

function ComparisonBarChart({ snapshots }: { snapshots: EquitySnapshot[] }) {
  const rows = snapshots
    .filter((snapshot) => snapshot.latest && snapshot.previous)
    .map((snapshot) => ({ symbol: snapshot.instrument.symbol, value: changePct(snapshot) }))
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
    .slice(0, 8);
  const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1);

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-[#6F7787] text-[13px]">
        Comparison data unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-label="Daily stock move comparison chart">
      {rows.map((row) => {
        const positive = row.value >= 0;
        return (
          <div className="flex items-center gap-4" key={row.symbol}>
            <span className="text-[13px] font-semibold text-white w-80">
              {row.symbol.replace("NSE:", "")}
            </span>
            <div className="flex-1 h-3 bg-white/[0.03] rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-350 ${positive ? "bg-[#58D68D]" : "bg-[#FF6B6B]"
                  }`}
                style={{ width: `${Math.max((Math.abs(row.value) / max) * 100, 3)}%` }}
              />
            </div>
            <strong
              className={`text-[13px] font-semibold w-64 text-right font-variant-numeric: tabular-nums ${positive ? "text-[#58D68D]" : "text-[#FF6B6B]"
                }`}
            >
              {row.value >= 0 ? "+" : ""}
              {row.value.toFixed(2)}%
            </strong>
          </div>
        );
      })}
    </div>
  );
}

export function MarketComparisonTable({ snapshots }: { snapshots: EquitySnapshot[] }) {
  return (
    <div className="w-full bg-[#1A1F27] border border-white/[0.06] rounded-[24px] overflow-hidden shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] text-[#6F7787] font-semibold uppercase text-[11px] tracking-wider bg-white/[0.01]">
              <th className="py-4 px-6">Symbol</th>
              <th className="py-4 px-6">Latest date</th>
              <th className="py-4 px-6 text-right">Open</th>
              <th className="py-4 px-6 text-right">High</th>
              <th className="py-4 px-6 text-right">Low</th>
              <th className="py-4 px-6 text-right">Close</th>
              <th className="py-4 px-6 text-right">Move</th>
              <th className="py-4 px-6 text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((snapshot) => (
              <tr
                key={`row-${snapshot.instrument.symbol}`}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors h-[72px]"
              >
                <td className="py-4.5 px-6 font-semibold text-white">
                  {snapshot.instrument.symbol.replace("NSE:", "")}
                </td>
                {snapshot.latest ? (
                  <>
                    <td className="py-4.5 px-6 text-[#A3A8B3]">
                      {formatDate(snapshot.latest.timestamp)}
                    </td>
                    <td className="py-4.5 px-6 text-right font-mono text-[#A3A8B3] font-variant-numeric: tabular-nums">
                      ₹{formatPrice(snapshot.latest.open)}
                    </td>
                    <td className="py-4.5 px-6 text-right font-mono text-[#A3A8B3] font-variant-numeric: tabular-nums">
                      ₹{formatPrice(snapshot.latest.high)}
                    </td>
                    <td className="py-4.5 px-6 text-right font-mono text-[#A3A8B3] font-variant-numeric: tabular-nums">
                      ₹{formatPrice(snapshot.latest.low)}
                    </td>
                    <td className="py-4.5 px-6 text-right font-semibold font-mono text-white font-variant-numeric: tabular-nums">
                      ₹{formatPrice(snapshot.latest.close)}
                    </td>
                    <td
                      className={`py-4.5 px-6 text-right font-semibold font-mono font-variant-numeric: tabular-nums ${changePct(snapshot) >= 0 ? "text-[#58D68D]" : "text-[#FF6B6B]"
                        }`}
                    >
                      {formatSignedPct(changePct(snapshot))}
                    </td>
                    <td className="py-4.5 px-6 text-right font-mono text-[#A3A8B3] font-variant-numeric: tabular-nums">
                      {Number(snapshot.latest.volume).toLocaleString("en-IN")}
                    </td>
                  </>
                ) : (
                  <td colSpan={7} className="py-4.5 px-6 text-center text-[#6F7787]">
                    {snapshot.error ?? "No quote available"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function changeValue(snapshot: EquitySnapshot): number {
  if (!snapshot.latest || !snapshot.previous) return 0;
  return Number(snapshot.latest.close) - Number(snapshot.previous.close);
}

function changePct(snapshot: EquitySnapshot): number {
  if (!snapshot.latest || !snapshot.previous) return 0;
  const previousClose = Number(snapshot.previous.close);
  if (previousClose === 0) return 0;
  return (changeValue(snapshot) / previousClose) * 100;
}

function formatPrice(value: string): string {
  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function formatSignedPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
