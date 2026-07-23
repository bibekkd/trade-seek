"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Server, Activity, Lock } from "lucide-react";

export default function SocialProof() {
  const proofItems = [
    { label: "Early Traders Registered", value: "1,000+", icon: Activity, color: "text-[#B8D957]" },
    { label: "Strategies Backtested", value: "500,000+", icon: Zap, color: "text-[#66A7FF]" },
    { label: "Execution Uptime", value: "99.99%", icon: Server, color: "text-[#8D63FF]" },
    { label: "Broker Webhooks", value: "Native Indian", icon: ShieldCheck, color: "text-[#22C55E]" },
  ];

  return (
    <section className="py-[40px] border-y border-white/[0.06] bg-[#11151C]/50 relative z-10">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[24px] md:gap-[32px] items-center">
          {proofItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-[16px] p-[16px] rounded-2xl bg-[#171B22]/60 border border-white/[0.04] hover:border-white/10 transition-all group"
              >
                <div className={`p-[12px] rounded-xl bg-white/[0.03] border border-white/5 ${item.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-[20px] h-[20px]" />
                </div>
                <div>
                  <span className="text-xl md:text-2xl font-extrabold text-white font-mono tracking-tight block tabular-nums">
                    {item.value}
                  </span>
                  <span className="text-xs text-[#98A2B3] font-medium">{item.label}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
