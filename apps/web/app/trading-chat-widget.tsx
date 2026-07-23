"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import { createBacktest, createResearchStrategy, getBacktest } from "@/lib/api";
import type { BacktestRun, Instrument, StrategyProposal } from "@/lib/api";

type Props = {
  instruments: Instrument[];
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const defaultPrompt = "Generate a disciplined swing trading strategy with clear risk controls.";

export default function TradingChatWidget({ instruments }: Props) {
  const defaultInstrument = instruments[0];
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState(defaultInstrument?.symbol ?? "RELIANCE");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text:
        "I am your professional algo trading assistant. Ask about markets, risk, indicators, or tell me to generate strategies for a stock.",
    },
  ]);
  const [candidates, setCandidates] = useState<StrategyProposal[]>([]);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [activeRun, setActiveRun] = useState<BacktestRun | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const dateRange = useMemo(() => recentDateRange(), []);
  const selectedCandidate = candidates[selectedCandidateIndex] ?? null;
  const isWorking = isGenerating || isBacktesting || activeRun?.status === "queued" || activeRun?.status === "running";

  useEffect(() => {
    if (!isOpen) return;
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, candidates, activeRun, isOpen]);

  useEffect(() => {
    if (!activeRun || !["queued", "running"].includes(activeRun.status)) return;
    const timer = window.setTimeout(async () => {
      try {
        const refreshedRun = await getBacktest(activeRun.id);
        setActiveRun(refreshedRun);
        if (refreshedRun.status === "completed") {
          const metrics = refreshedRun.metrics?.out_of_sample;
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              text: metrics
                ? `Backtest complete for ${refreshedRun.symbol}: ${metrics.total_return_pct.toFixed(2)}% return, ${metrics.max_drawdown_pct.toFixed(2)}% max drawdown, ${metrics.number_of_trades} trades.`
                : `Backtest complete for ${refreshedRun.symbol}.`,
            },
          ]);
        }
        if (refreshedRun.status === "failed") {
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              text: refreshedRun.error_message ?? "The backtest failed. Try a different symbol, date range, or strategy.",
            },
          ]);
        }
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : "Could not refresh backtest status.");
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [activeRun]);

  async function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isGenerating) return;
    setInput("");
    setError(null);
    setMessages((current) => [...current, { role: "user", text: prompt }]);

    if (shouldGenerateStrategy(prompt)) {
      await generateStrategies(prompt);
      return;
    }

    setMessages((current) => [...current, { role: "assistant", text: marketAssistantReply(prompt, selectedSymbol) }]);
  }

  async function generateStrategies(prompt = defaultPrompt) {
    setIsGenerating(true);
    setError(null);
    setCandidates([]);
    setActiveRun(null);
    setSelectedCandidateIndex(0);
    try {
      const run = await createResearchStrategy({
        prompt: `${prompt}\nGenerate 2-3 ranked strategy candidates for a professional algo trader. Include concise rationale and practical risk notes.`,
        symbol: selectedSymbol,
        exchange: "NSE",
        timeframe: "1d",
        provider: "fyers",
        start_at: `${dateRange.startDate}T00:00:00Z`,
        end_at: `${dateRange.endDate}T23:59:59Z`,
        run_backtest: false,
      });
      const nextCandidates = strategyCandidates(run.strategy_proposal);
      setCandidates(nextCandidates);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            run.status === "rejected"
              ? run.error_message ?? "The strategy proposal was rejected by validation."
              : `I generated ${nextCandidates.length} strategy candidate${nextCandidates.length === 1 ? "" : "s"} for ${selectedSymbol}. Select one below and run a backtest when ready.`,
        },
      ]);
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : "Could not generate strategies.";
      setError(message);
      setMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      setIsGenerating(false);
    }
  }

  async function runBacktest(candidate = selectedCandidate) {
    if (!candidate || isWorking) return;
    setIsBacktesting(true);
    setError(null);
    setActiveRun(null);
    setMessages((current) => [
      ...current,
      { role: "user", text: `Run a backtest for ${candidate.name ?? "this strategy"} on ${selectedSymbol}.` },
    ]);
    try {
      const queuedRun = await createBacktest({
        symbol: selectedSymbol,
        exchange: "NSE",
        timeframe: "1d",
        provider: "fyers",
        start_at: `${dateRange.startDate}T00:00:00Z`,
        end_at: `${dateRange.endDate}T23:59:59Z`,
        strategy: normalizeStrategy(candidate),
      });
      setActiveRun(queuedRun);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: `Backtest started for ${queuedRun.symbol}. I will update this chat when it finishes.` },
      ]);
    } catch (backtestError) {
      const message = backtestError instanceof Error ? backtestError.message : "Could not start the backtest.";
      setError(message);
      setMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      setIsBacktesting(false);
    }
  }

  return (
    <div className="trading-chat-widget">
      {isOpen && (
        <section className="trading-chat-modal" aria-label="Algo trader chat assistant">
          <header className="trading-chat-header">
            <div>
              <span>AEGIS AI</span>
              <strong>Algo Trader Chat</strong>
            </div>
            <button type="button" aria-label="Close chat" onClick={() => setIsOpen(false)}>
              x
            </button>
          </header>

          <div className="trading-chat-controls">
            <label>
              Symbol
              <select value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value)}>
                {instruments.slice(0, 100).map((instrument) => (
                  <option key={instrument.symbol} value={instrument.symbol}>
                    {instrument.symbol}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" disabled={isGenerating} onClick={() => generateStrategies()}>
              {isGenerating ? "Generating..." : "Generate strategy"}
            </button>
          </div>

          <div className="trading-chat-transcript" ref={transcriptRef}>
            {messages.map((message, index) => (
              <div className={`trading-chat-bubble ${message.role}`} key={`${message.role}-${index}`}>
                <span>{message.role === "assistant" ? "AEGIS" : "You"}</span>
                <p>{message.text}</p>
              </div>
            ))}

            {candidates.length > 0 && (
              <div className="trading-chat-strategies" aria-label="Generated strategies">
                {candidates.map((candidate, index) => (
                  <button
                    className={index === selectedCandidateIndex ? "trading-strategy-option active" : "trading-strategy-option"}
                    key={`${candidate.name ?? "strategy"}-${index}`}
                    type="button"
                    onClick={() => setSelectedCandidateIndex(index)}
                  >
                    <span>Strategy {index + 1}</span>
                    <strong>{candidate.name ?? `Candidate ${index + 1}`}</strong>
                    <small>{candidate.description ?? "Validated strategy candidate ready for backtesting."}</small>
                    <em>{strategySummary(candidate)}</em>
                  </button>
                ))}
                <button className="trading-chat-backtest" type="button" disabled={!selectedCandidate || Boolean(isWorking)} onClick={() => runBacktest()}>
                  {isBacktesting || activeRun?.status === "queued" || activeRun?.status === "running" ? "Backtesting..." : "Run backtest"}
                </button>
              </div>
            )}

            {activeRun && (
              <div className="trading-chat-result">
                <span>Status</span>
                <strong className={`status-${activeRun.status}`}>{activeRun.status}</strong>
                {activeRun.metrics ? (
                  <p>
                    Return {activeRun.metrics.out_of_sample.total_return_pct.toFixed(2)}% · Drawdown{" "}
                    {activeRun.metrics.out_of_sample.max_drawdown_pct.toFixed(2)}%
                  </p>
                ) : (
                  <p>{activeRun.error_message ?? activeRun.id}</p>
                )}
              </div>
            )}

            {error && (
              <div className="trading-chat-error" role="alert">
                {error}
              </div>
            )}
          </div>

          <form className="trading-chat-composer" onSubmit={submitChat}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about stocks, risk, indicators, or strategy ideas..."
              aria-label="Chat message"
            />
            <button type="submit" disabled={!input.trim() || isGenerating}>
              Send
            </button>
          </form>
        </section>
      )}

      <button className="trading-chat-launcher" type="button" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
        {isOpen ? (
          <div className="flex items-center gap-2 font-semibold text-[13px] text-white">
            <X className="w-5 h-5 text-[#FF6B6B]" />
            <span>Close</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#B7D65C]/15 border border-[#B7D65C]/30 flex items-center justify-center text-[#B7D65C]">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[13px] text-white tracking-tight">AI Trader</span>
            <span className="w-2 h-2 rounded-full bg-[#58D68D] animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}

function shouldGenerateStrategy(prompt: string): boolean {
  return /\b(strategy|strategies|backtest|generate|signal|entry|exit|setup)\b/i.test(prompt);
}

function marketAssistantReply(prompt: string, symbol: string): string {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes("risk") || lowerPrompt.includes("position")) {
    return `For ${symbol}, start with risk first: define invalidation, cap risk per trade, model slippage, and avoid increasing size until a strategy survives out-of-sample testing.`;
  }
  if (lowerPrompt.includes("rsi") || lowerPrompt.includes("moving average") || lowerPrompt.includes("indicator")) {
    return "Indicators are useful only after you define market regime, entry trigger, exit logic, and risk limits. I can generate testable MA or RSI strategy candidates and backtest one from this chat.";
  }
  return `For ${symbol}, I would frame this as a testable hypothesis: market regime, entry rule, exit rule, risk per trade, and benchmark. Ask me to generate strategies when you want concrete candidates.`;
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

function strategySummary(proposal: StrategyProposal): string {
  const strategy = proposal.strategy;
  if (!strategy?.parameters) return "Missing parameters";
  if (strategy.strategy_type === "rsi_mean_reversion") {
    return `RSI ${strategy.parameters.lookback_window}, ${strategy.parameters.oversold_threshold}/${strategy.parameters.overbought_threshold}`;
  }
  return `MA ${strategy.parameters.short_window}/${strategy.parameters.long_window}`;
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
