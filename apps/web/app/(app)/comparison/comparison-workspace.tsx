"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getQuotes } from "@/lib/api";
import type { Candle, Instrument, Quote } from "@/lib/api";
import { MarketComparisonCard } from "../../popular-equities-dashboard";
import type { EquitySnapshot } from "../../popular-equities-dashboard";

type Props = {
  initialSnapshots: EquitySnapshot[];
  instruments: Instrument[];
  pageSize: number;
};

export default function ComparisonWorkspace({
  initialSnapshots,
  instruments,
  pageSize,
}: Props) {
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [loadedCount, setLoadedCount] = useState(initialSnapshots.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingCount = Math.max(instruments.length - loadedCount, 0);
  const nextCount = Math.min(pageSize, remainingCount);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("move");
  const analytics = useMemo(() => buildAnalytics(snapshots), [snapshots]);
  const chartRows = useMemo(
    () => buildChartRows(snapshots, chartMetric),
    [snapshots, chartMetric],
  );
  const title = useMemo(
    () => `Stock comparison - ${loadedCount} of ${instruments.length}`,
    [loadedCount, instruments.length],
  );

  async function loadMore() {
    if (loading || remainingCount === 0) return;
    setLoading(true);
    setError(null);
    const nextInstruments = instruments.slice(loadedCount, loadedCount + pageSize);
    try {
      const quotes = await getQuotes({
        symbols: nextInstruments.map((instrument) => instrument.symbol),
      });
      const quotesBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
      const nextSnapshots = nextInstruments.map((instrument) => {
        const quote = quotesBySymbol.get(instrument.symbol);
        if (!quote) return { instrument, latest: null, previous: null, error: "Quote unavailable" };
        return snapshotFromQuote(instrument, quote);
      });
      setSnapshots((current) => [...current, ...nextSnapshots]);
      setLoadedCount((current) => current + nextInstruments.length);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load more stocks");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell bg-[#0E1117] min-h-screen text-white">
      <section className="mb-8" aria-labelledby="comparison-insights-heading">
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-16 sm:p-24 md:p-32 shadow-subtle mb-6">
          <span className="text-[12px] font-semibold text-[#8A5CF6] uppercase tracking-wider block mb-1">
            Comparison Insights
          </span>
          <h1 id="comparison-insights-heading" className="text-[22px] sm:text-[28px] font-bold text-white tracking-tight">
            Stock Readout & Breadth
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#A3A8B3] mt-2 max-w-[700px] leading-relaxed">
            Analyze pricing performance, ranges, and volume levels relative to the entire loaded watch set.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:col-span-7 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col justify-between"
          >
            <div>
              <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider block mb-1">
                AI Rule Summary
              </span>
              <h3 className="text-[20px] font-bold text-white tracking-tight leading-snug">
                {analytics.title}
              </h3>
              <p className="text-[14px] text-[#A3A8B3] mt-3 leading-relaxed">
                {analytics.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-16 mt-6 pt-6 border-t border-white/[0.05]">
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-[#171B22] border border-white/[0.06] rounded-[18px] p-16 shadow-subtle transition-colors"
              >
                <span className="text-[11px] text-[#6F7787] uppercase tracking-wider font-semibold block">Best Move</span>
                <strong className="text-[15px] font-bold text-[#58D68D] block mt-1 font-variant-numeric: tabular-nums">{analytics.bestMove}</strong>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-[#171B22] border border-white/[0.06] rounded-[18px] p-16 shadow-subtle transition-colors"
              >
                <span className="text-[11px] text-[#6F7787] uppercase tracking-wider font-semibold block">Weakest Move</span>
                <strong className="text-[15px] font-bold text-[#FF6B6B] block mt-1 font-variant-numeric: tabular-nums">{analytics.weakestMove}</strong>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-[#171B22] border border-white/[0.06] rounded-[18px] p-16 shadow-subtle transition-colors"
              >
                <span className="text-[11px] text-[#6F7787] uppercase tracking-wider font-semibold block">Highest Volume</span>
                <strong className="text-[15px] font-bold text-white block mt-1 truncate">{analytics.highestVolume}</strong>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-[#171B22] border border-white/[0.06] rounded-[18px] p-16 shadow-subtle transition-colors"
              >
                <span className="text-[11px] text-[#6F7787] uppercase tracking-wider font-semibold block">Positive Breadth</span>
                <strong className="text-[15px] font-bold text-[#60A5FA] block mt-1 font-variant-numeric: tabular-nums">{analytics.positiveBreadth}</strong>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:col-span-5 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-24 shadow-subtle flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider">Metrics</span>
              <div className="flex p-0.5 bg-[#171B22] rounded-full border border-white/[0.05]" role="tablist" aria-label="Comparison chart metric">
                {chartOptions.map((option) => (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-selected={chartMetric === option.value}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${chartMetric === option.value
                      ? "bg-[#202631] text-white border border-white/[0.08] shadow"
                      : "text-[#6F7787] hover:text-white"
                      }`}
                    key={option.value}
                    onClick={() => setChartMetric(option.value)}
                    role="tab"
                    type="button"
                  >
                    {option.label.replace(" %", "")}
                  </motion.button>
                ))}
              </div>
            </div>
            <ComparisonBarChart rows={chartRows} metric={chartMetric} />
          </motion.div>
        </div>
      </section>

      <MarketComparisonCard
        snapshots={snapshots}
        eyebrow="All-sector FYERS Comparison"
        title={title}
      />

      <div className="flex flex-col items-center justify-center gap-2">
        {error && <p className="text-[13px] text-[#FF6B6B] font-medium mb-2" role="alert">{error}</p>}
        <button
          onClick={loadMore}
          disabled={loading || remainingCount === 0}
          className={`text-[13px] font-semibold transition-all hover:text-white ${loading || remainingCount === 0
            ? "text-[#6F7787] cursor-not-allowed no-underline"
            : "text-[#B7D65C] underline decoration-[#B7D65C]/40 hover:decoration-[#B7D65C] underline-offset-4"
            }`}
        >
          {loading
            ? "Loading more stocks..."
            : remainingCount === 0
              ? "All 100 stocks loaded"
              : `Load ${nextCount} more (${loadedCount} / ${instruments.length} loaded)`}
        </button>
      </div>
    </main>
  );
}

type ChartMetric = "move" | "volume" | "range";

const chartOptions: Array<{ label: string; value: ChartMetric }> = [
  { label: "Move %", value: "move" },
  { label: "Volume", value: "volume" },
  { label: "Range %", value: "range" },
];

type ChartRow = {
  label: string;
  value: number;
  formatted: string;
};

function ComparisonBarChart({ rows, metric }: { rows: ChartRow[]; metric: ChartMetric }) {
  if (rows.length === 0) {
    return <div className="py-16 text-center text-[#6F7787] text-[13px]">Load stock quotes to render the comparison chart.</div>;
  }

  const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1);

  return (
    <div className="space-y-3" aria-label={`${metric} comparison chart`}>
      {rows.map((row) => {
        const width = Math.max((Math.abs(row.value) / max) * 100, 2);
        const isNeg = metric === "move" && row.value < 0;
        return (
          <div className="flex items-center gap-3" key={row.label}>
            <span className="text-[12px] font-semibold text-white w-80">{row.label.replace("NSE:", "")}</span>
            <div className="flex-1 h-2.5 bg-white/[0.03] rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-350 ${isNeg ? "bg-[#FF6B6B]" : "bg-[#58D68D]"
                  }`}
                style={{ width: `${width}%` }}
              />
            </div>
            <strong
              className={`text-[12px] font-semibold font-variant-numeric: tabular-nums w-64 text-right ${isNeg ? "text-[#FF6B6B]" : "text-[#58D68D]"
                }`}
            >
              {row.formatted}
            </strong>
          </div>
        );
      })}
    </div>
  );
}

function buildAnalytics(snapshots: EquitySnapshot[]) {
  const usable = snapshots.filter((snapshot) => snapshot.latest && snapshot.previous);
  if (usable.length === 0) {
    return {
      title: "Waiting for comparable quotes",
      summary: "Load stock quotes to generate a comparison readout. This placeholder will later be replaced with AI-generated commentary.",
      bestMove: "No data",
      weakestMove: "No data",
      highestVolume: "No data",
      positiveBreadth: "0%",
    };
  }

  const byMove = [...usable].sort((left, right) => changePct(right) - changePct(left));
  const byVolume = [...usable].sort((left, right) => Number(right.latest?.volume ?? 0) - Number(left.latest?.volume ?? 0));
  const positives = usable.filter((snapshot) => changePct(snapshot) > 0);
  const best = byMove[0];
  const weakest = byMove.at(-1) ?? byMove[0];
  const volumeLeader = byVolume[0];

  return {
    title: "Rule-based insight draft",
    summary: `${best.instrument.symbol} is leading the loaded set at ${formatSignedPct(changePct(best))}, while ${weakest.instrument.symbol} is the weakest at ${formatSignedPct(changePct(weakest))}. Breadth is ${positives.length}/${usable.length} positive. Later, the AI layer can turn this into a fuller market narrative with sector context.`,
    bestMove: `${best.instrument.symbol} ${formatSignedPct(changePct(best))}`,
    weakestMove: `${weakest.instrument.symbol} ${formatSignedPct(changePct(weakest))}`,
    highestVolume: `${volumeLeader.instrument.symbol} ${Number(volumeLeader.latest?.volume ?? 0).toLocaleString("en-IN")}`,
    positiveBreadth: `${Math.round((positives.length / usable.length) * 100)}%`,
  };
}

function buildChartRows(snapshots: EquitySnapshot[], metric: ChartMetric): ChartRow[] {
  return snapshots
    .filter((snapshot) => snapshot.latest && snapshot.previous)
    .map((snapshot) => {
      const value = metricValue(snapshot, metric);
      return {
        label: snapshot.instrument.symbol,
        value,
        formatted: formatMetric(value, metric),
      };
    })
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
    .slice(0, 12);
}

function metricValue(snapshot: EquitySnapshot, metric: ChartMetric): number {
  if (!snapshot.latest) return 0;
  if (metric === "volume") return Number(snapshot.latest.volume);
  if (metric === "range") {
    const close = Number(snapshot.latest.close);
    if (close === 0) return 0;
    return ((Number(snapshot.latest.high) - Number(snapshot.latest.low)) / close) * 100;
  }
  return changePct(snapshot);
}

function formatMetric(value: number, metric: ChartMetric): string {
  if (metric === "volume") return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return formatSignedPct(value);
}

function changePct(snapshot: EquitySnapshot): number {
  if (!snapshot.latest || !snapshot.previous) return 0;
  const previousClose = Number(snapshot.previous.close);
  if (previousClose === 0) return 0;
  return ((Number(snapshot.latest.close) - previousClose) / previousClose) * 100;
}

function formatSignedPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function snapshotFromQuote(instrument: Instrument, quote: Quote): EquitySnapshot {
  const latest: Candle = {
    symbol: instrument.symbol,
    exchange: quote.exchange,
    timeframe: "1d",
    timestamp: quote.timestamp,
    open: quote.open,
    high: quote.high,
    low: quote.low,
    close: quote.last,
    volume: quote.volume,
    source: quote.source,
  };
  return {
    instrument,
    latest,
    previous: { ...latest, close: quote.previous_close },
    error: null,
  };
}
