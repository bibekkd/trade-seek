"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Zap, Cpu, ArrowRight, ShieldCheck, Activity } from "lucide-react";

export default function Timeline() {
  const steps = [
    {
      num: "01",
      title: "Research & Market Scan",
      desc: "Scan NIFTY, BankNIFTY, and F&O stock movements with AI market sentiment indicators.",
      icon: Search,
      color: "text-[#B8D957]",
    },
    {
      num: "02",
      title: "Prompt Build Strategy",
      desc: "Describe your entry, exit, stop loss, and position sizing rules in plain English.",
      icon: Sparkles,
      color: "text-[#8D63FF]",
    },
    {
      num: "03",
      title: "Microsecond Backtest",
      desc: "Simulate 5+ years of tick data on Indian markets to verify win rate and Sharpe ratio.",
      icon: Zap,
      color: "text-[#66A7FF]",
    },
    {
      num: "04",
      title: "Paper Trade Validation",
      desc: "Run strategies against real live market feeds without risking actual capital.",
      icon: Cpu,
      color: "text-[#22C55E]",
    },
    {
      num: "05",
      title: "Deploy Live to Broker",
      desc: "Connect Zerodha, Dhan, or Fyers to auto-execute orders with sub-20ms latency.",
      icon: ShieldCheck,
      color: "text-[#B8D957]",
    },
    {
      num: "06",
      title: "AI Copilot Optimization",
      desc: "TradeSeek continuously analyzes execution slippage and suggests parameter tweaks.",
      icon: Activity,
      color: "text-[#8D63FF]",
    },
  ];

  return (
    <section id="how-it-works" className="py-[96px] md:py-[128px] relative z-10 bg-[#0B0D10]">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px]">
        
        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-[80px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#171B22] border border-white/10 text-xs text-[#B8D957] mb-[16px]"
          >
            <Sparkles className="w-[14px] h-[14px]" />
            <span>The 6-Step Algo Workflow</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-[20px]"
          >
            From idea to automated execution in minutes.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#98A2B3]"
          >
            A seamless journey designed for modern retail quants and active options traders.
          </motion.p>
        </div>

        {/* 6 Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-[28px] bg-[#171B22] border border-white/[0.06] p-[28px] hover:border-white/20 transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-[24px]">
                    <span className="font-mono text-2xl font-bold text-white/30 group-hover:text-[#B8D957] transition-colors">
                      {step.num}
                    </span>
                    <div className={`p-[12px] rounded-2xl bg-[#11151C] border border-white/10 ${step.color}`}>
                      <Icon className="w-[20px] h-[20px]" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-[12px]">{step.title}</h3>
                  <p className="text-sm text-[#98A2B3] leading-relaxed mb-[24px]">{step.desc}</p>
                </div>

                <div className="flex items-center gap-[8px] text-xs font-semibold text-[#B8D957] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Step Completed</span>
                  <ArrowRight className="w-[14px] h-[14px]" />
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
