"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Shield,
  Cpu,
  BarChart3,
  Mic,
  ArrowUpRight,
  TrendingUp,
  Terminal,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function FeaturesBentoGrid() {
  return (
    <section id="features" className="py-[96px] md:py-[128px] relative z-10 bg-[#0B0D10]">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px]">
        
        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-[64px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#171B22] border border-white/10 text-xs text-[#B8D957] mb-[16px]"
          >
            <Layers className="w-[14px] h-[14px]" />
            <span>Institutional Grade Tech</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-[20px]"
          >
            Everything you need to automate your trading.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#98A2B3]"
          >
            Built from the ground up for Indian derivatives and equity markets. Powered by LLMs trained on financial market microstructure.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[24px]">
          
          {/* Card 1: AI Strategy Generator (8 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-8 rounded-[28px] bg-[#171B22] border border-white/[0.06] p-[28px] md:p-[32px] hover:border-white/20 transition-all group overflow-hidden relative"
          >
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="w-[40px] h-[40px] rounded-xl bg-[#B8D957]/10 text-[#B8D957] border border-[#B8D957]/20 flex items-center justify-center mb-[20px]">
                  <Sparkles className="w-[20px] h-[20px]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-[12px]">AI Strategy Generator</h3>
                <p className="text-sm text-[#98A2B3] max-w-xl mb-[24px]">
                  Turn ideas like &quot;BUY NIFTY 15-min Supertrend breakout when RSI &gt; 60 and VWAP is sloping upward&quot; into tested Python code instantly.
                </p>
              </div>

              {/* Code/Terminal Illustration */}
              <div className="rounded-2xl bg-[#11151C] border border-white/10 p-[16px] font-mono text-xs text-[#98A2B3] space-y-[8px]">
                <div className="flex items-center gap-[8px] text-white/50 border-b border-white/[0.06] pb-[8px] text-[11px]">
                  <Terminal className="w-[14px] h-[14px] text-[#B8D957]" />
                  <span>Prompt: &quot;Build NIFTY 15m breakout straddle strategy&quot;</span>
                </div>
                <div className="text-[#B8D957] font-semibold">// Generated Logic Rules:</div>
                <div className="text-white/80">if nifty.close &gt; nifty.upper_band and rsi &gt; 60:</div>
                <div className="pl-[16px] text-[#66A7FF]">execute_order(symbol=&quot;NIFTY24600CE&quot;, qty=50, order_type=&quot;MARKET&quot;)</div>
                <div className="pl-[16px] text-[#8D63FF]">set_stop_loss(trigger_price=nifty.close * 0.985)</div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Microsecond Backtester (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-4 rounded-[28px] bg-[#171B22] border border-white/[0.06] p-[28px] md:p-[32px] hover:border-white/20 transition-all group relative overflow-hidden"
          >
            <div className="w-[40px] h-[40px] rounded-xl bg-[#66A7FF]/10 text-[#66A7FF] border border-[#66A7FF]/20 flex items-center justify-center mb-[20px]">
              <Zap className="w-[20px] h-[20px]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-[12px]">Institutional Backtesting</h3>
            <p className="text-sm text-[#98A2B3] mb-[24px]">
              Simulate 5 years of tick-by-tick NSE data in 3 seconds. Account for slippage, brokerage, and impact cost.
            </p>

            <div className="p-[16px] rounded-2xl bg-[#11151C] border border-white/10 space-y-[12px]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#98A2B3]">Backtest Duration:</span>
                <span className="font-mono text-white font-bold">2019 - 2024 (5 Yrs)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#98A2B3]">Win Rate:</span>
                <span className="font-mono text-[#22C55E] font-bold">78.4%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#98A2B3]">Sharpe Ratio:</span>
                <span className="font-mono text-[#B8D957] font-bold">2.84</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: One-Click Paper & Live Execution (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-4 rounded-[28px] bg-[#171B22] border border-white/[0.06] p-[28px] md:p-[32px] hover:border-white/20 transition-all group"
          >
            <div className="w-[40px] h-[40px] rounded-xl bg-[#8D63FF]/10 text-[#8D63FF] border border-[#8D63FF]/20 flex items-center justify-center mb-[20px]">
              <Cpu className="w-[20px] h-[20px]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-[12px]">Paper to Live Toggle</h3>
            <p className="text-sm text-[#98A2B3] mb-[24px]">
              Test with virtual capital first. Toggle live trading whenever you are ready with zero code changes.
            </p>

            <div className="flex items-center justify-between p-[14px] rounded-2xl bg-[#11151C] border border-white/10">
              <span className="text-xs text-white font-medium">Mode: Live Trading</span>
              <div className="w-[48px] h-[24px] rounded-full bg-[#B8D957] p-[4px] flex items-center justify-end">
                <div className="w-[16px] h-[16px] rounded-full bg-[#0B0D10] shadow-md" />
              </div>
            </div>
          </motion.div>

          {/* Card 4: Dynamic Risk Management (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="md:col-span-4 rounded-[28px] bg-[#171B22] border border-white/[0.06] p-[28px] md:p-[32px] hover:border-white/20 transition-all group"
          >
            <div className="w-[40px] h-[40px] rounded-xl bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 flex items-center justify-center mb-[20px]">
              <Shield className="w-[20px] h-[20px]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-[12px]">Risk Guard Shield</h3>
            <p className="text-sm text-[#98A2B3] mb-[24px]">
              Hard stop-loss guards prevent catastrophic losses. Automatic capital allocation and VaR monitoring.
            </p>

            <div className="p-[14px] rounded-2xl bg-[#11151C] border border-white/10 flex items-center gap-[12px]">
              <CheckCircle2 className="w-[20px] h-[20px] text-[#22C55E]" />
              <div className="text-xs">
                <span className="font-bold text-white block">Max Daily Drawdown: 1.5%</span>
                <span className="text-[#98A2B3]">Auto-kill switch enabled</span>
              </div>
            </div>
          </motion.div>

          {/* Card 5: Voice AI & Analytics (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="md:col-span-4 rounded-[28px] bg-[#171B22] border border-white/[0.06] p-[28px] md:p-[32px] hover:border-white/20 transition-all group"
          >
            <div className="w-[40px] h-[40px] rounded-xl bg-[#B8D957]/10 text-[#B8D957] border border-[#B8D957]/20 flex items-center justify-center mb-[20px]">
              <Mic className="w-[20px] h-[20px]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-[12px]">Voice AI Insights</h3>
            <p className="text-sm text-[#98A2B3] mb-[24px]">
              Ask your portfolio: &quot;What was my win rate on BankNIFTY call options this week?&quot; Get spoken audio breakdowns.
            </p>

            <div className="p-[14px] rounded-2xl bg-[#11151C] border border-white/10 flex items-center gap-[12px] text-xs text-[#B8D957]">
              <div className="w-[8px] h-[8px] rounded-full bg-[#B8D957] animate-ping" />
              <span>&quot;Voice Copilot Listening...&quot;</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
