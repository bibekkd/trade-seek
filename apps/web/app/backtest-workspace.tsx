"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createBacktest, getBacktest } from "@/lib/api";
import type { BacktestRun, Instrument } from "@/lib/api";
import BacktestResultView from "./backtest-result-view";

const initialForm = {
  symbol: "RELIANCE",
  shortWindow: 2,
  longWindow: 3,
  initialCash: 100000,
  trainFraction: 0.5,
};

type Props = { instruments: Instrument[]; initialSymbol: string };

export default function BacktestWorkspace({ instruments, initialSymbol }: Props) {
  const [form, setForm] = useState({ ...initialForm, ...recentDateRange(), symbol: initialSymbol });
  const [run, setRun] = useState<BacktestRun | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!run || !["queued", "running"].includes(run.status)) return;
    const timer = window.setTimeout(async () => {
      try {
        setRun(await getBacktest(run.id));
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : "Could not read backtest status");
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [run]);

  function updateField(field: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setRun(null);
    if (form.longWindow <= form.shortWindow) {
      setError("Long window must be greater than short window.");
      return;
    }
    setSubmitting(true);
    try {
      const queued = await createBacktest({
        symbol: form.symbol,
        exchange: "NSE",
        timeframe: "1d",
        provider: "fyers",
        start_at: `${form.startDate}T00:00:00Z`,
        end_at: `${form.endDate}T23:59:59Z`,
        strategy: {
          strategy_type: "moving_average_crossover",
          parameters: {
            short_window: form.shortWindow,
            long_window: form.longWindow,
            initial_cash: form.initialCash,
            train_fraction: form.trainFraction,
          },
        },
      });
      setRun(queued);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit backtest");
    } finally {
      setSubmitting(false);
    }
  }

  const metrics = run?.metrics?.out_of_sample;
  const isWorking = submitting || run?.status === "queued" || run?.status === "running";

  return (
    <motion.section
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col justify-between"
      aria-labelledby="backtest-heading"
    >
      <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-3">
        <div>
          <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider block mb-0.5">Manual Engine</span>
          <h2 id="backtest-heading" className="text-[18px] font-bold text-white tracking-tight">Run Moving Average Backtest</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#B7D65C]/10 text-[#B7D65C] border border-[#B7D65C]/20">SMA Crossover</span>
      </div>

      <form className="space-y-4 sm:space-y-6" onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-[11px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1">Symbol</label>
            <select
              value={form.symbol}
              onChange={(e) => updateField("symbol", e.target.value)}
              className="w-full h-11 bg-[#171B22] border border-transparent rounded-[18px] px-3 sm:px-[18px] text-[13px] text-white focus:outline-none focus:border-[#B7D65C] transition-colors"
            >
              {instruments.map((instrument) => (
                <option key={instrument.symbol} value={instrument.symbol}>
                  {instrument.symbol.replace("NSE:", "")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
              required
              className="w-full h-11 bg-[#171B22] border border-transparent rounded-[18px] px-3 sm:px-[18px] text-[13px] text-white focus:outline-none focus:border-[#B7D65C] transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
              required
              className="w-full h-11 bg-[#171B22] border border-transparent rounded-[18px] px-3 sm:px-[18px] text-[13px] text-white focus:outline-none focus:border-[#B7D65C] transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1">Short Window</label>
            <input
              type="number"
              min="2"
              max="200"
              value={form.shortWindow}
              onChange={(e) => updateField("shortWindow", Number(e.target.value))}
              className="w-full h-11 bg-[#171B22] border border-transparent rounded-[18px] px-3 sm:px-[18px] text-[13px] text-white focus:outline-none focus:border-[#B7D65C] transition-colors font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1">Long Window</label>
            <input
              type="number"
              min="3"
              max="400"
              value={form.longWindow}
              onChange={(e) => updateField("longWindow", Number(e.target.value))}
              className="w-full h-11 bg-[#171B22] border border-transparent rounded-[18px] px-3 sm:px-[18px] text-[13px] text-white focus:outline-none focus:border-[#B7D65C] transition-colors font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1">Initial Cash</label>
            <input
              type="number"
              min="1"
              value={form.initialCash}
              onChange={(e) => updateField("initialCash", Number(e.target.value))}
              className="w-full h-11 bg-[#171B22] border border-transparent rounded-[18px] px-3 sm:px-[18px] text-[13px] text-white focus:outline-none focus:border-[#B7D65C] transition-colors font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1">Train Split</label>
            <input
              type="number"
              min="0.2"
              max="0.8"
              step="0.1"
              value={form.trainFraction}
              onChange={(e) => updateField("trainFraction", Number(e.target.value))}
              className="w-full h-11 bg-[#171B22] border border-transparent rounded-[18px] px-3 sm:px-[18px] text-[13px] text-white focus:outline-none focus:border-[#B7D65C] transition-colors font-mono mb-2"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={Boolean(isWorking)}
          className={`w-full h-11 rounded-full text-[13px] font-bold transition-all ${isWorking
            ? "bg-[#171B22] text-[#6F7787] border border-white/[0.05] cursor-not-allowed"
            : "bg-[#B7D65C] hover:bg-[#B7D65C]/90 text-[#0E1117] active:scale-[0.98]"
            }`}
        >
          {isWorking ? "Running Backtest…" : "Run Crossover Backtest"}
        </motion.button>
      </form>

      {error && (
        <div className="mt-4 text-[13px] text-[#FF6B6B] bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 px-4 py-2.5 rounded-xl" role="alert">
          {error}
        </div>
      )}
      {!run && !error && (
        <div className="py-12 mt-6 border-t-2 border-dashed border-white/[0.06] text-center text-[#6F7787] text-[13px]">
          Choose parameters and trigger the FYERS historical-data backtest engine.
        </div>
      )}
      {run && (
        <div className="mt-4 p-3 bg-[#171B22]/60 border border-white/[0.04] rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#6F7787] uppercase tracking-wider">Backtest Status</span>
            <strong className="text-[13px] text-white uppercase mt-0.5">{run.status}</strong>
          </div>
          <span className="text-[11px] font-mono text-[#6F7787]">{run.id.slice(0, 10)}...</span>
        </div>
      )}
      {run?.status === "failed" && (
        <div className="mt-4 text-[13px] text-[#FF6B6B] bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 px-4 py-2.5 rounded-xl" role="alert">
          {run.error_message ?? "The backtest failed."}
        </div>
      )}
      {metrics && run.status === "completed" && (
        <div className="mt-6 pt-6 border-t border-white/[0.05]">
          <BacktestResultView run={run} title="Moving Average Crossover Out-of-sample metrics" />
        </div>
      )}
    </motion.section>
  );
}

function recentDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);
  return { startDate: toDateInput(start), endDate: toDateInput(end) };
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}
