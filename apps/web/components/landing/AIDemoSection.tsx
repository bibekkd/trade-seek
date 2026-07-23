"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, Terminal, ArrowRight, CheckCircle2, RotateCcw, TrendingUp, BarChart2, ShieldCheck } from "lucide-react";

const PRESET_PROMPTS = [
  {
    id: "nifty-breakout",
    title: "⚡ NIFTY 15m Breakout Strategy",
    prompt: "Build me a NIFTY 50 15-min candle breakout strategy buying calls when price breaks resistance with 2x volume.",
    winRate: "78.2%",
    pnl: "+₹1,84,500",
    sharpe: "2.84",
    trades: "142",
  },
  {
    id: "banknifty-straddle",
    title: "📈 BANKNIFTY Volatility Straddle",
    prompt: "Create an automated expiry day straddle strategy on BANKNIFTY with 25% stop loss per leg.",
    winRate: "82.5%",
    pnl: "+₹3,42,000",
    sharpe: "3.12",
    trades: "98",
  },
  {
    id: "reliance-vwap",
    title: "🎯 RELIANCE VWAP Mean Reversion",
    prompt: "Buy RELIANCE when stock touches lower VWAP band and RSI is below 30, exit at upper band.",
    winRate: "74.8%",
    pnl: "+₹98,400",
    sharpe: "2.45",
    trades: "210",
  },
];

export default function AIDemoSection() {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_PROMPTS[0]);
  const [typedText, setTypedText] = useState("");
  const [step, setStep] = useState<"idle" | "typing" | "thinking" | "completed">("completed");

  useEffect(() => {
    // Run typing simulation when preset changes
    setStep("typing");
    setTypedText("");
    let currentText = "";
    const targetText = selectedPreset.prompt;
    let i = 0;

    const interval = setInterval(() => {
      if (i < targetText.length) {
        currentText += targetText.charAt(i);
        setTypedText(currentText);
        i++;
      } else {
        clearInterval(interval);
        setStep("thinking");
        setTimeout(() => {
          setStep("completed");
        }, 1200);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [selectedPreset]);

  return (
    <section id="ai-demo" className="py-[96px] md:py-[128px] relative z-10 bg-[#11151C]/60 border-y border-white/[0.06]">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px]">
        
        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-[56px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#171B22] border border-white/10 text-xs text-[#8D63FF] mb-[16px]"
          >
            <Sparkles className="w-[14px] h-[14px]" />
            <span>ChatGPT + TradingView Studio</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-[20px]"
          >
            Test strategy generation in real-time.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#98A2B3]"
          >
            Click a sample prompt below or watch our AI compile Python logic, execute backtests, and generate live signals.
          </motion.p>
        </div>

        {/* Preset Prompt Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-[12px] mb-[40px]">
          {PRESET_PROMPTS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(preset)}
              className={`px-[16px] py-[10px] rounded-full text-xs font-semibold border transition-all duration-300 ${
                selectedPreset.id === preset.id
                  ? "bg-[#B8D957] text-[#0B0D10] border-[#B8D957] shadow-lg shadow-[#B8D957]/20 scale-[1.02]"
                  : "bg-[#171B22] text-[#98A2B3] border-white/10 hover:text-white hover:border-white/20"
              }`}
            >
              {preset.title}
            </button>
          ))}
        </div>

        {/* Interactive Terminal Window */}
        <div className="max-w-[960px] mx-auto rounded-[28px] bg-[#171B22] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl">
          
          {/* Terminal Window Header */}
          <div className="px-[24px] py-[16px] bg-[#11151C] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <div className="w-[12px] h-[12px] rounded-full bg-[#FF5C5C]" />
              <div className="w-[12px] h-[12px] rounded-full bg-[#EAB308]" />
              <div className="w-[12px] h-[12px] rounded-full bg-[#22C55E]" />
              <span className="ml-[8px] text-xs font-mono text-[#98A2B3] flex items-center gap-[8px]">
                <Terminal className="w-[14px] h-[14px] text-[#B8D957]" />
                TradeSeek AI Studio Terminal — NSE Feed
              </span>
            </div>
            <span className="text-xs font-mono text-[#22C55E] bg-[#22C55E]/10 px-[10px] py-[4px] rounded-full border border-[#22C55E]/20">
              Live Engine Active
            </span>
          </div>

          {/* Terminal Body */}
          <div className="p-[24px] md:p-[32px] space-y-[24px]">
            
            {/* Prompt Input Box Simulation */}
            <div className="p-[16px] rounded-2xl bg-[#11151C] border border-white/10 relative">
              <div className="text-[11px] font-mono text-[#98A2B3] uppercase tracking-wider mb-[8px] flex items-center gap-[8px]">
                <Sparkles className="w-[14px] h-[14px] text-[#B8D957]" />
                <span>Natural Language Input Prompt:</span>
              </div>
              <div className="font-mono text-sm sm:text-base text-white min-h-[48px] flex items-center">
                <span>{typedText}</span>
                {step === "typing" && <span className="inline-block w-[8px] h-[16px] ml-[4px] bg-[#B8D957] animate-pulse" />}
              </div>
            </div>

            {/* AI Processing Banner */}
            {step === "thinking" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-[16px] rounded-2xl bg-[#8D63FF]/10 border border-[#8D63FF]/30 text-[#8D63FF] text-xs font-mono flex items-center gap-[12px]"
              >
                <div className="w-[16px] h-[16px] rounded-full border-2 border-[#8D63FF] border-t-transparent animate-spin" />
                <span>AI Agent compiling strategy rules... Simulating 5 years tick data on NIFTY 50...</span>
              </motion.div>
            )}

            {/* Completed Results Showcase */}
            {step === "completed" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-[24px]"
              >
                {/* Backtest Key Performance Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-[12px]">
                  <div className="p-[16px] rounded-2xl bg-[#11151C] border border-white/[0.06]">
                    <span className="text-[11px] text-[#98A2B3] block font-medium">Win Rate</span>
                    <span className="text-xl font-bold font-mono text-[#22C55E] tabular-nums mt-[4px] block">
                      {selectedPreset.winRate}
                    </span>
                  </div>
                  <div className="p-[16px] rounded-2xl bg-[#11151C] border border-white/[0.06]">
                    <span className="text-[11px] text-[#98A2B3] block font-medium">Net Profit (1Y)</span>
                    <span className="text-xl font-bold font-mono text-[#B8D957] tabular-nums mt-[4px] block">
                      {selectedPreset.pnl}
                    </span>
                  </div>
                  <div className="p-[16px] rounded-2xl bg-[#11151C] border border-white/[0.06]">
                    <span className="text-[11px] text-[#98A2B3] block font-medium">Sharpe Ratio</span>
                    <span className="text-xl font-bold font-mono text-[#66A7FF] tabular-nums mt-[4px] block">
                      {selectedPreset.sharpe}
                    </span>
                  </div>
                  <div className="p-[16px] rounded-2xl bg-[#11151C] border border-white/[0.06]">
                    <span className="text-[11px] text-[#98A2B3] block font-medium">Total Orders</span>
                    <span className="text-xl font-bold font-mono text-white tabular-nums mt-[4px] block">
                      {selectedPreset.trades}
                    </span>
                  </div>
                </div>

                {/* Animated Chart Display */}
                <div className="p-[20px] rounded-2xl bg-[#11151C] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-[16px]">
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-[8px]">
                      <BarChart2 className="w-[16px] h-[16px] text-[#B8D957]" />
                      Backtest Visual Signal Curve — {selectedPreset.title}
                    </span>
                    <span className="text-xs text-[#22C55E] font-mono">Max Drawdown: 2.1%</span>
                  </div>

                  <div className="h-[140px] w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="demoChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,90 L 100,80 L 200,50 L 300,60 L 400,25 L 500,35 L 600,10 L 600,120 L 0,120 Z"
                        fill="url(#demoChartGrad)"
                      />
                      <motion.path
                        d="M 0,90 L 100,80 L 200,50 L 300,60 L 400,25 L 500,35 L 600,10"
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5 }}
                      />
                      {/* BUY Signal Markers */}
                      <circle cx="200" cy="50" r="5" fill="#B8D957" />
                      <text x="180" y="35" fill="#B8D957" fontSize="11" fontWeight="bold" fontFamily="monospace">
                        BUY 24500 CE
                      </text>
                      <circle cx="400" cy="25" r="5" fill="#66A7FF" />
                      <text x="380" y="15" fill="#66A7FF" fontSize="11" fontWeight="bold" fontFamily="monospace">
                        TARGET +35%
                      </text>
                    </svg>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>

      </div>
    </section>
  );
}
