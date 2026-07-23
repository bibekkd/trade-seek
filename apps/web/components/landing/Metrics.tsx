"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Award, Zap, Globe } from "lucide-react";

export default function Metrics() {
  const metrics = [
    { label: "Orders Simulated", value: "10M+", sub: "Tick-by-tick NSE historical data", icon: TrendingUp, color: "text-[#B8D957]" },
    { label: "AI Strategies Generated", value: "250K+", sub: "Options, Futures & Equities", icon: Zap, color: "text-[#66A7FF]" },
    { label: "Execution Success Rate", value: "98.4%", sub: "Sub-20ms broker response", icon: Award, color: "text-[#8D63FF]" },
    { label: "Covered Markets", value: "100+", sub: "NIFTY 50, BankNIFTY, F&O stocks", icon: Globe, color: "text-[#22C55E]" },
  ];

  return (
    <section className="py-[96px] md:py-[128px] relative z-10 bg-[#0B0D10]">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[24px]">
          {metrics.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-[32px] rounded-[28px] bg-[#171B22] border border-white/[0.06] hover:border-white/20 transition-all text-center flex flex-col items-center justify-between group"
              >
                <div className={`p-[16px] rounded-2xl bg-[#11151C] border border-white/10 ${item.color} mb-[24px] group-hover:scale-110 transition-transform`}>
                  <Icon className="w-[24px] h-[24px]" />
                </div>
                <div>
                  <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight block tabular-nums mb-[8px]">
                    {item.value}
                  </span>
                  <h3 className="text-base font-bold text-white mb-[4px]">{item.label}</h3>
                  <p className="text-xs text-[#98A2B3]">{item.sub}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
