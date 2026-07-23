"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createBacktest, createResearchStrategy, getBacktest, getResearchRuns } from "@/lib/api";
import type { BacktestRun, Instrument, ResearchRun, StrategyProposal } from "@/lib/api";
import BacktestResultView from "./backtest-result-view";

const initialForm = {
  prompt: "Find a simple strategy and test where it works best.",
};

type Props = { instruments: Instrument[]; initialSymbol: string };

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function ResearchWorkspace({ instruments, initialSymbol }: Props) {
  const defaultSymbols = useMemo(
    () => uniqueSymbols([initialSymbol, ...instruments.slice(0, 4).map((instrument) => instrument.symbol)]).slice(0, 3),
    [initialSymbol, instruments],
  );
  const [form, setForm] = useState({ ...initialForm, ...recentDateRange(), symbol: initialSymbol });
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(defaultSymbols);
  const [researchRun, setResearchRun] = useState<ResearchRun | null>(null);
  const [researchHistory, setResearchHistory] = useState<ResearchRun[]>([]);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [singleRun, setSingleRun] = useState<BacktestRun | null>(null);
  const [comparisonRuns, setComparisonRuns] = useState<BacktestRun[]>([]);
  const [submittingResearch, setSubmittingResearch] = useState(false);
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [submittingComparison, setSubmittingComparison] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Describe what you want to test. I will suggest strategies, then you can test one stock or compare a few stocks.",
    },
  ]);

  useEffect(() => {
    let cancelled = false;
    getResearchRuns(20)
      .then((runs) => {
        if (cancelled) return;
        setResearchHistory(runs);
        const firstUsableRun = runs.find((run) => strategyCandidates(run.strategy_proposal).length > 0) ?? null;
        if (firstUsableRun) {
          setResearchRun(firstUsableRun);
          setForm((current) => ({
            ...current,
            symbol: firstUsableRun.symbol,
            startDate: toDateInput(new Date(firstUsableRun.start_at)),
            endDate: toDateInput(new Date(firstUsableRun.end_at)),
          }));
        }
      })
      .catch((historyError) => {
        if (!cancelled) {
          setError(historyError instanceof Error ? historyError.message : "Could not load strategy history");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const activeComparisonRuns = comparisonRuns.filter((run) => ["queued", "running"].includes(run.status));
    const singleIsActive = singleRun && ["queued", "running"].includes(singleRun.status);
    if (activeComparisonRuns.length === 0 && !singleIsActive) return;
    const timer = window.setTimeout(async () => {
      try {
        if (singleIsActive) {
          setSingleRun(await getBacktest(singleRun.id));
        }
        const refreshedComparisonRuns = await Promise.all(
          comparisonRuns.map((run) => (["queued", "running"].includes(run.status) ? getBacktest(run.id) : run)),
        );
        setComparisonRuns(refreshedComparisonRuns);
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : "Could not read backtest status");
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [comparisonRuns, singleRun]);

  const candidates = useMemo(() => strategyCandidates(researchRun?.strategy_proposal), [researchRun]);
  const selectedCandidate = candidates[selectedCandidateIndex] ?? candidates[0] ?? null;
  const rankedRuns = useMemo(() => rankCompletedRuns(comparisonRuns), [comparisonRuns]);
  const isWorking =
    submittingResearch ||
    submittingSingle ||
    submittingComparison ||
    singleRun?.status === "queued" ||
    singleRun?.status === "running" ||
    comparisonRuns.some((run) => ["queued", "running"].includes(run.status));

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleSymbol(symbol: string) {
    setSelectedSymbols((current) => {
      if (current.includes(symbol)) return current.filter((item) => item !== symbol);
      if (current.length >= 3) return [current[1], current[2], symbol].filter(Boolean);
      return [...current, symbol];
    });
  }

  async function generateStrategies(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSingleRun(null);
    setComparisonRuns([]);
    setSelectedCandidateIndex(0);
    setSubmittingResearch(true);
    setMessages((current) => [...current, { role: "user", text: form.prompt }]);
    try {
      const run = await createResearchStrategy({
        prompt: `${form.prompt}\nGenerate 2-3 ranked strategy candidates and explain why each may fit the supplied market context.`,
        symbol: form.symbol,
        exchange: "NSE",
        timeframe: "1d",
        provider: "fyers",
        start_at: `${form.startDate}T00:00:00Z`,
        end_at: `${form.endDate}T23:59:59Z`,
        run_backtest: false,
      });
      setResearchRun(run);
      setResearchHistory((current) => mergeResearchHistory(run, current));
      if (run.status === "rejected") {
        const message = run.error_message ?? "The AI proposal was rejected by validation.";
        setError(message);
        setMessages((current) => [...current, { role: "assistant", text: message }]);
      } else {
        const count = strategyCandidates(run.strategy_proposal).length;
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: `I found ${count} strategy option${count === 1 ? "" : "s"}. Pick one, then choose how to test it.`,
          },
        ]);
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not generate strategies";
      setError(message);
      setMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      setSubmittingResearch(false);
    }
  }

  function selectHistoryCandidate(run: ResearchRun, candidateIndex: number) {
    setError(null);
    setResearchRun(run);
    setSelectedCandidateIndex(candidateIndex);
    setSingleRun(null);
    setComparisonRuns([]);
    setForm((current) => ({
      ...current,
      symbol: run.symbol,
      startDate: toDateInput(new Date(run.start_at)),
      endDate: toDateInput(new Date(run.end_at)),
    }));
  }

  async function runSingleStockBacktest() {
    if (!selectedCandidate) return;
    setError(null);
    setSubmittingSingle(true);
    setSingleRun(null);
    setMessages((current) => [
      ...current,
      {
        role: "user",
        text: `Test ${selectedCandidate.name ?? "selected strategy"} on ${form.symbol}.`,
      },
    ]);
    try {
      const queued = await createBacktest({
        symbol: form.symbol,
        exchange: researchRun?.exchange ?? "NSE",
        timeframe: researchRun?.timeframe ?? "1d",
        provider: researchRun?.provider ?? "fyers",
        start_at: researchRun?.start_at ?? `${form.startDate}T00:00:00Z`,
        end_at: researchRun?.end_at ?? `${form.endDate}T23:59:59Z`,
        strategy: normalizeStrategy(selectedCandidate),
      });
      setSingleRun(queued);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `Started a single-stock backtest on ${queued.symbol}.`,
        },
      ]);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not submit single-stock backtest";
      setError(message);
      setMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      setSubmittingSingle(false);
    }
  }

  async function runStockComparison() {
    if (!selectedCandidate) return;
    if (selectedSymbols.length < 2) {
      setError("Select at least two stocks to compare this strategy.");
      return;
    }
    setError(null);
    setSubmittingComparison(true);
    setComparisonRuns([]);
    setMessages((current) => [
      ...current,
      {
        role: "user",
        text: `Run ${selectedCandidate.name ?? "selected strategy"} on ${selectedSymbols.join(", ")}.`,
      },
    ]);
    try {
      const queuedRuns = await Promise.all(
        selectedSymbols.map((symbol) =>
          createBacktest({
            symbol,
            exchange: researchRun?.exchange ?? "NSE",
            timeframe: researchRun?.timeframe ?? "1d",
            provider: researchRun?.provider ?? "fyers",
            start_at: researchRun?.start_at ?? `${form.startDate}T00:00:00Z`,
            end_at: researchRun?.end_at ?? `${form.endDate}T23:59:59Z`,
            strategy: normalizeStrategy(selectedCandidate),
          }),
        ),
      );
      setComparisonRuns(queuedRuns);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `Started ${queuedRuns.length} stock tests. The best result will move to the top.`,
        },
      ]);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not submit comparison backtests";
      setError(message);
      setMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      setSubmittingComparison(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* STEP 1: DESCRIBE GOAL */}
      <motion.section
        whileHover={{ y: -2 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col justify-between"
        aria-labelledby="research-heading"
      >
        <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-3">
          <div>
            <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider block mb-0.5">Step 1</span>
            <h2 id="research-heading" className="text-[18px] font-bold text-white tracking-tight">Describe Strategy Goal</h2>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8A5CF6]/10 text-[#8A5CF6] border border-[#8A5CF6]/20">AI Guided</span>
        </div>

        {/* Chat window */}
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 mb-6 custom-scrollbar">
          {messages.map((message, index) => {
            const isAI = message.role === "assistant";
            return (
              <div
                className={`p-3 rounded-[18px] max-w-[85%] transition-all ${isAI
                  ? "bg-[#171B22]/60 border border-white/[0.04] text-white self-start"
                  : "bg-[#8A5CF6]/15 border border-[#8A5CF6]/20 text-white ml-auto"
                  }`}
                key={`${message.role}-${index}`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isAI ? "text-[#8A5CF6]" : "text-[#a78bfa]"
                  }`}>
                  {isAI ? "TradeSeek AI" : "You"}
                </span>
                <p className="text-[13px] leading-relaxed text-[#A3A8B3]">{message.text}</p>
              </div>
            );
          })}
        </div>

        {/* Form */}
        <form className="space-y-4 sm:space-y-6 pt-3 border-t border-white/[0.05]" onSubmit={generateStrategies}>
          <div>
            <label className="text-[12px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1.5">
              What strategy rules should we test?
            </label>
            <textarea
              value={form.prompt}
              onChange={(event) => updateField("prompt", event.target.value)}
              minLength={3}
              maxLength={4000}
              required
              className="w-full h-24 bg-[#171B22] border border-transparent rounded-[18px] p-3 sm:p-4 text-[13px] text-white placeholder-[#6F7787] focus:outline-none focus:border-[#B7D65C] transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="text-[12px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1.5">
                Target Stock
              </label>
              <select
                value={form.symbol}
                onChange={(event) => updateField("symbol", event.target.value)}
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
              <label className="text-[12px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
                required
                className="w-full h-11 bg-[#171B22] border border-transparent rounded-[18px] px-3 sm:px-[18px] text-[13px] text-white focus:outline-none focus:border-[#B7D65C] transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#A3A8B3] uppercase tracking-wider block mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                required
                className="w-full h-11 bg-[#171B22] border border-transparent rounded-[18px] px-3 sm:px-[18px] text-[13px] text-white focus:outline-none focus:border-[#B7D65C] transition-colors"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submittingResearch}
            className={`w-full min-h-[48px] px-6 py-3.5 rounded-full text-[14px] font-bold flex items-center justify-center gap-2 transition-all ${submittingResearch
              ? "bg-[#171B22] text-[#6F7787] border border-white/[0.05] cursor-not-allowed"
              : "bg-[#B7D65C] hover:bg-[#B7D65C]/90 text-[#0E1117] active:scale-[0.99]"
              }`}
          >
            {submittingResearch ? "Generating AI proposals..." : "Generate AI Strategies"}
          </motion.button>
        </form>

        {error && (
          <div className="mt-4 text-[13px] text-[#FF6B6B] bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 px-4 py-2.5 rounded-xl" role="alert">
            {error}
          </div>
        )}

        {/* STEP 2: PICK STRATEGY */}
        <div className="mt-6 pt-6 border-t border-white/[0.05]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider block mb-0.5">History</span>
              <h3 className="text-[16px] font-bold text-white">Generated Strategies</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.04] text-[#A3A8B3] border border-white/[0.05]">
              {loadingHistory ? "Loading" : `${countHistoryStrategies(researchHistory)} Saved`}
            </span>
          </div>
          {researchHistory.length > 0 ? (
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
              {researchHistory.flatMap((run) =>
                strategyCandidates(run.strategy_proposal).map((candidate, index) => {
                  const active = run.id === researchRun?.id && index === selectedCandidateIndex;
                  return (
                    <button
                      className={`w-full text-left p-3 rounded-[16px] border transition-all ${active
                        ? "bg-[#202631] border-[#B7D65C]"
                        : "bg-[#171B22]/50 border-white/[0.04] hover:bg-[#202631]/50 hover:border-white/[0.08]"
                        }`}
                      key={`${run.id}-${index}`}
                      onClick={() => selectHistoryCandidate(run, index)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <strong className="text-[13px] text-white block truncate">{candidate.name ?? `Candidate ${index + 1}`}</strong>
                          <span className="text-[11px] text-[#6F7787] block mt-0.5">
                            {run.symbol.replace("NSE:", "")} · {formatShortDate(run.created_at)} · Option {index + 1}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#A3A8B3] bg-white/[0.04] border border-white/[0.05] px-2 py-0.5 rounded-md shrink-0">
                          {candidate.strategy.strategy_type === "rsi_mean_reversion" ? "RSI" : "MA"}
                        </span>
                      </div>
                    </button>
                  );
                }),
              )}
            </div>
          ) : (
            <div className="py-6 border border-dashed border-white/[0.06] rounded-[16px] text-center text-[#6F7787] text-[13px]">
              Generated strategies will be saved here for later backtesting.
            </div>
          )}
        </div>

        {candidates.length > 0 ? (
          <div className="mt-6 pt-6 border-t border-white/[0.05]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider block mb-0.5">Step 2</span>
                <h3 className="text-[16px] font-bold text-white">Pick Strategy Candidate</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.04] text-[#A3A8B3] border border-white/[0.05]">
                {researchRun?.ai_provider}{researchRun?.ai_model ? ` · ${researchRun.ai_model}` : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-16">
              {candidates.map((candidate, index) => {
                const active = index === selectedCandidateIndex;
                return (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`text-left p-16 rounded-[24px] border transition-all ${active
                      ? "bg-[#202631] border-[#B7D65C]"
                      : "bg-[#171B22]/50 border-white/[0.04] hover:bg-[#202631]/50 hover:border-white/[0.08]"
                      }`}
                    key={`${candidate.name}-${index}`}
                    onClick={() => setSelectedCandidateIndex(index)}
                    type="button"
                  >
                    <span className="text-[11px] font-semibold text-[#8A5CF6] uppercase block mb-1">Option {index + 1}</span>
                    <strong className="text-[15px] font-bold text-white block">{candidate.name ?? `Candidate ${index + 1}`}</strong>
                    <p className="text-[12px] text-[#A3A8B3] mt-1.5 leading-relaxed">{candidate.description ?? "Validated candidate ready for comparison."}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-white/[0.05]">
                      {strategyParameters(candidate).map(([label, value]) => (
                        <div key={label}>
                          <span className="text-[10px] text-[#6F7787] uppercase tracking-wider block">{label}</span>
                          <strong className="text-[12px] text-white block mt-0.5 font-mono font-variant-numeric: tabular-nums">{value}</strong>
                        </div>
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 mt-6 border-t-2 border-dashed border-white/[0.06] text-center text-[#6F7787] text-[13px]">
            Describe the goal above. The app will suggest strategy options here.
          </div>
        )}
      </motion.section>

      {/* STEP 3: TEST STRATEGY */}
      <motion.section
        whileHover={{ y: -2 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col justify-between"
        aria-labelledby="test-builder-heading"
      >
        <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-3">
          <div>
            <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider block mb-0.5">Step 3</span>
            <h2 id="test-builder-heading" className="text-[18px] font-bold text-white tracking-tight">Test Strategy</h2>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20">Single or Compare</span>
        </div>

        {selectedCandidate ? (
          <div className="space-y-6">
            <div className="bg-[#171B22]/50 border border-white/[0.04] p-16 rounded-[16px]">
              <span className="text-[11px] text-[#6F7787] uppercase block mb-1">Target Engine</span>
              <strong className="text-[14px] text-white">{selectedCandidate.name ?? "AI strategy candidate"}</strong>
              <div className="text-[12px] text-[#A3A8B3] mt-1 font-mono font-variant-numeric: tabular-nums">
                {strategyParameters(selectedCandidate).map(([label, value]) => `${label}: ${value}`).join(" · ")}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-[#171B22]/40 border border-white/[0.04] rounded-[20px] p-4 sm:p-5 flex flex-col justify-between min-h-[200px]">
                <div>
                  <span className="text-[11px] text-[#6F7787] uppercase tracking-wider font-semibold block">Single Stock Test</span>
                  <h3 className="text-[15px] font-bold text-white mt-1">Backtest on {form.symbol.replace("NSE:", "")}</h3>
                  <p className="text-[12px] text-[#A3A8B3] mt-1.5 leading-relaxed">
                    Test the selected AI strategy on the target stock using historic candle metrics.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full min-h-[44px] px-5 py-2.5 rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 transition-all mt-4 ${isWorking
                    ? "bg-[#171B22] text-[#6F7787] border border-white/[0.05] cursor-not-allowed"
                    : "bg-[#B7D65C] hover:bg-[#B7D65C]/90 text-[#0E1117] active:scale-[0.98]"
                    }`}
                  type="button"
                  disabled={Boolean(isWorking)}
                  onClick={runSingleStockBacktest}
                >
                  {submittingSingle ? "Running..." : "Run Single Stock Backtest"}
                </motion.button>
              </div>

              <div className="bg-[#171B22]/40 border border-white/[0.04] rounded-[20px] p-4 sm:p-5 flex flex-col justify-between min-h-[200px]">
                <div>
                  <span className="text-[11px] text-[#6F7787] uppercase tracking-wider font-semibold block">Cross-Comparison</span>
                  <h3 className="text-[15px] font-bold text-white mt-1">Backtest 2-3 Stocks</h3>
                  <div className="flex flex-wrap gap-1 mt-2 max-h-[60px] overflow-y-auto custom-scrollbar">
                    {instruments.slice(0, 12).map((instrument) => {
                      const active = selectedSymbols.includes(instrument.symbol);
                      return (
                        <button
                          className={`px-2 py-0.5 text-[10px] font-semibold border rounded-md transition-all ${active
                            ? "bg-[#8A5CF6]/15 border-[#8A5CF6] text-white"
                            : "bg-[#171B22]/80 border-white/[0.04] text-[#6F7787] hover:text-white"
                            }`}
                          key={instrument.symbol}
                          onClick={() => toggleSymbol(instrument.symbol)}
                          type="button"
                        >
                          {instrument.symbol.replace("NSE:", "")}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full min-h-[44px] px-5 py-2.5 rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 transition-all mt-3 ${isWorking || selectedSymbols.length < 2
                    ? "bg-[#171B22] text-[#6F7787] border border-white/[0.05] cursor-not-allowed"
                    : "bg-[#B7D65C] hover:bg-[#B7D65C]/90 text-[#0E1117] active:scale-[0.98]"
                    }`}
                  type="button"
                  disabled={Boolean(isWorking) || selectedSymbols.length < 2}
                  onClick={runStockComparison}
                >
                  {submittingComparison ? "Running..." : "Compare Active Stocks"}
                </motion.button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-[#6F7787] text-[13px]">
            Pick one strategy option above to unlock the backtesting workflow.
          </div>
        )}
      </motion.section>

      {/* RESULTS GRID */}
      <motion.section
        whileHover={{ y: -2 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-24 shadow-subtle flex flex-col justify-between"
        aria-labelledby="comparison-results-heading"
      >
        <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-3">
          <div>
            <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider block mb-0.5">Results</span>
            <h2 id="comparison-results-heading" className="text-[18px] font-bold text-white tracking-tight">Backtest Outputs</h2>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/[0.04] text-[#A3A8B3] border border-white/[0.05]">
            {comparisonRuns.length > 0
              ? `${comparisonRuns.filter((run) => run.status === "completed").length}/${comparisonRuns.length} Complete`
              : singleRun?.status ?? "Waiting"}
          </span>
        </div>

        {singleRun && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-[#171B22]/40 border border-white/[0.04] rounded-[16px]">
              <div className="flex items-center gap-3">
                <span className="text-[11px] px-2 py-0.5 bg-[#B7D65C]/10 text-[#B7D65C] border border-[#B7D65C]/20 rounded-md font-semibold">Single</span>
                <strong className="text-[14px] text-white">{singleRun.symbol.replace("NSE:", "")}</strong>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-[12px] px-2 py-0.5 rounded font-semibold uppercase ${singleRun.status === "completed" ? "bg-[#58D68D]/15 text-[#58D68D]" : "bg-white/[0.05] text-[#6F7787]"
                  }`}>{singleRun.status}</span>
                <strong className="text-[14px] text-white font-mono font-variant-numeric: tabular-nums">
                  {singleRun.metrics ? `${singleRun.metrics.out_of_sample.total_return_pct.toFixed(2)}%` : "Loading..."}
                </strong>
              </div>
            </div>
            {singleRun.status === "completed" && (
              <BacktestResultView run={singleRun} title={`Single stock result · ${singleRun.symbol.replace("NSE:", "")}`} showWindows />
            )}
          </div>
        )}

        {comparisonRuns.length > 0 ? (
          <div className="space-y-4">
            <div className="divide-y divide-white/[0.04]">
              {rankedRuns.map((run, index) => (
                <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0" key={run.id}>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#6F7787] font-semibold">#{index + 1}</span>
                    <strong className="text-[14px] text-white">{run.symbol.replace("NSE:", "")}</strong>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold uppercase ${run.status === "completed" ? "bg-[#58D68D]/15 text-[#58D68D]" : "bg-white/[0.05] text-[#6F7787]"
                      }`}>{run.status}</span>
                    <span className="text-[13px] text-[#A3A8B3] font-mono font-variant-numeric: tabular-nums">
                      {run.metrics ? `${run.metrics.out_of_sample.total_return_pct.toFixed(2)}%` : "Waiting"}
                    </span>
                    <span className="text-[12px] text-[#6F7787] font-mono font-variant-numeric: tabular-nums">
                      {run.metrics ? `${run.metrics.out_of_sample.max_drawdown_pct.toFixed(2)}% DD` : run.error_message ? "Failed" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {rankedRuns[0]?.status === "completed" && (
              <div className="pt-6 border-t border-white/[0.05]">
                <BacktestResultView run={rankedRuns[0]} title={`Best Current Result · ${rankedRuns[0].symbol.replace("NSE:", "")}`} showWindows />
              </div>
            )}
          </div>
        ) : (
          !singleRun && (
            <div className="py-16 text-center text-[#6F7787] text-[13px]">
              Run a single-stock test or compare 2-3 stocks to see backtest outputs here.
            </div>
          )
        )}
      </motion.section>
    </div>
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

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(value));
}

function countHistoryStrategies(runs: ResearchRun[]): number {
  return runs.reduce((total, run) => total + strategyCandidates(run.strategy_proposal).length, 0);
}

function mergeResearchHistory(nextRun: ResearchRun, currentRuns: ResearchRun[]): ResearchRun[] {
  if (strategyCandidates(nextRun.strategy_proposal).length === 0) return currentRuns;
  return [nextRun, ...currentRuns.filter((run) => run.id !== nextRun.id)].slice(0, 20);
}

function strategyCandidates(proposal: StrategyProposal | null | undefined): StrategyProposal[] {
  if (!proposal) return [];
  if (Array.isArray(proposal.strategy_candidates) && proposal.strategy_candidates.length > 0) {
    return proposal.strategy_candidates;
  }
  return [proposal];
}

function normalizeStrategy(proposal: StrategyProposal) {
  const strategy = proposal.strategy;
  if (!strategy?.parameters) {
    throw new Error("The AI response did not include valid strategy parameters. Generate it again.");
  }
  if (strategy.strategy_type === "rsi_mean_reversion") {
    return {
      strategy_type: "rsi_mean_reversion" as const,
      parameters: {
        lookback_window: Number(strategy.parameters.lookback_window),
        oversold_threshold: Number(strategy.parameters.oversold_threshold),
        overbought_threshold: Number(strategy.parameters.overbought_threshold),
        initial_cash: Number(strategy.parameters.initial_cash),
        train_fraction: Number(strategy.parameters.train_fraction),
        fee_bps: Number(strategy.parameters.fee_bps ?? 0),
        slippage_bps: Number(strategy.parameters.slippage_bps ?? 0),
        position_size_fraction: Number(strategy.parameters.position_size_fraction ?? 1),
      },
    };
  }
  return {
    strategy_type: "moving_average_crossover" as const,
    parameters: {
      short_window: Number(strategy.parameters.short_window),
      long_window: Number(strategy.parameters.long_window),
      initial_cash: Number(strategy.parameters.initial_cash),
      train_fraction: Number(strategy.parameters.train_fraction),
      fee_bps: Number(strategy.parameters.fee_bps ?? 0),
      slippage_bps: Number(strategy.parameters.slippage_bps ?? 0),
      position_size_fraction: Number(strategy.parameters.position_size_fraction ?? 1),
    },
  };
}

function strategyParameters(proposal: StrategyProposal): Array<[string, string]> {
  const strategy = proposal.strategy;
  if (!strategy?.parameters) return [["Status", "Incomplete"]];
  if (strategy.strategy_type === "rsi_mean_reversion") {
    return [
      ["RSI", String(strategy.parameters.lookback_window)],
      ["Oversold", String(strategy.parameters.oversold_threshold)],
      ["Overbought", String(strategy.parameters.overbought_threshold)],
      ["Cash", Number(strategy.parameters.initial_cash).toLocaleString("en-IN")],
      ["Train", `${Math.round(Number(strategy.parameters.train_fraction) * 100)}%`],
    ];
  }
  return [
    ["Short MA", String(strategy.parameters.short_window)],
    ["Long MA", String(strategy.parameters.long_window)],
    ["Cash", Number(strategy.parameters.initial_cash).toLocaleString("en-IN")],
    ["Train", `${Math.round(Number(strategy.parameters.train_fraction) * 100)}%`],
  ];
}

function rankCompletedRuns(runs: BacktestRun[]): BacktestRun[] {
  return [...runs].sort((left, right) => {
    const leftReturn = left.metrics?.out_of_sample.total_return_pct ?? Number.NEGATIVE_INFINITY;
    const rightReturn = right.metrics?.out_of_sample.total_return_pct ?? Number.NEGATIVE_INFINITY;
    return rightReturn - leftReturn;
  });
}

function uniqueSymbols(symbols: string[]): string[] {
  return [...new Set(symbols.filter(Boolean))];
}
