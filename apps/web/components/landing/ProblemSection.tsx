"use client";

import React from "react";
import { motion } from "framer-motion";
import { XCircle, CheckCircle2, Code2, AlertTriangle, Cpu, Sparkles, ArrowRight } from "lucide-react";

export default function ProblemSection() {
  const problems = [
    {
      icon: Code2,
      title: "Coding Barriers",
      problem: "Writing complex Python algorithms, backtesting scripts, and math libraries takes months of engineering.",
      solution: "TradeSeek converts plain English text into production-grade algorithm code in seconds.",
    },
    {
      icon: AlertTriangle,
      title: "Fragile Broker APIs",
      problem: "Connecting Zerodha, Dhan, or Angel One requires handling token auth, rate limits, and websockets manually.",
      solution: "Unified 1-click broker integrations with automatic retry, token refreshing, and zero latency.",
    },
    {
      icon: Cpu,
      title: "Emotional Execution",
      problem: "Retail traders suffer from FOMO, delayed stop-losses, and revenge trading during volatile market swings.",
      solution: "Autonomous AI Copilot executes rules emotionlessly 24/7 with hard risk guards and stop-loss shields.",
    },
  ];

  return (
    <section className="py-[96px] md:py-[128px] relative z-10 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px]">
        
        {/* Section Header */}
        <div className="text-center max-w-[720px] mx-auto mb-[64px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#171B22] border border-white/10 text-xs text-[#66A7FF] mb-[16px]"
          >
            <Sparkles className="w-[14px] h-[14px]" />
            <span>Built for Retail Traders</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-[20px]"
          >
            Trading shouldn&apos;t require a CS degree.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#98A2B3]"
          >
            89% of Indian retail traders lose money due to manual execution delays and emotional bias. TradeSeek gives you quant fund capabilities in a clean natural language workspace.
          </motion.p>
        </div>

        {/* 3 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          {problems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="group relative rounded-[28px] bg-[#171B22] border border-white/[0.06] p-[28px] hover:border-white/20 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-[#B8D957]/5"
              >
                <div>
                  {/* Icon */}
                  <div className="w-[48px] h-[48px] rounded-2xl bg-[#11151C] border border-white/10 flex items-center justify-center text-[#B8D957] mb-[24px] group-hover:scale-110 transition-transform">
                    <Icon className="w-[24px] h-[24px]" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-[16px]">{item.title}</h3>

                  {/* Problem Statement */}
                  <div className="p-[14px] rounded-xl bg-[#FF5C5C]/5 border border-[#FF5C5C]/20 mb-[16px] flex items-start gap-[12px]">
                    <XCircle className="w-[16px] h-[16px] text-[#FF5C5C] flex-shrink-0 mt-[2px]" />
                    <p className="text-xs text-[#FF5C5C]/90 leading-relaxed">{item.problem}</p>
                  </div>
                </div>

                {/* Solution Statement */}
                <div className="pt-[16px] border-t border-white/[0.06] p-[14px] rounded-xl bg-[#B8D957]/5 border border-[#B8D957]/20 flex items-start gap-[12px]">
                  <CheckCircle2 className="w-[16px] h-[16px] text-[#B8D957] flex-shrink-0 mt-[2px]" />
                  <p className="text-xs text-[#B8D957] font-medium leading-relaxed">{item.solution}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
