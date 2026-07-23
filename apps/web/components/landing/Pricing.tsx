"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Zap, Shield, Crown } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "₹0",
      period: "forever free",
      desc: "Perfect for learning paper trading & testing basic strategies.",
      badge: "Free Access",
      features: [
        "1 Active AI Strategy",
        "Unlimited Paper Trading",
        "100 Backtests per month",
        "Basic NIFTY & Equity data",
        "Community Support",
      ],
      popular: false,
      cta: "Join Waitlist Free",
    },
    {
      name: "Pro Trader",
      price: "₹1,499",
      period: "/ month",
      desc: "Designed for active Indian options & derivatives traders.",
      badge: "Early Access Free",
      features: [
        "10 Active AI Strategies",
        "Zerodha, Dhan & Fyers Webhooks",
        "Unlimited Tick-by-Tick Backtests",
        "Voice AI Portfolio Insights",
        "Max Drawdown Risk Guard",
        "Sub-20ms Execution Speed",
        "Priority VIP Support",
      ],
      popular: true,
      cta: "Claim Free Pro Access",
    },
    {
      name: "Quant Fund",
      price: "Custom",
      period: "/ institutional",
      desc: "For HNIs, family offices & proprietary desk traders.",
      badge: "Enterprise",
      features: [
        "Unlimited AI Copilots",
        "Custom Python / C++ Webhooks",
        "Dedicated Co-located Server",
        "Multi-Broker Account Sync",
        "SEBI Audit Log Export",
        "Dedicated Quant Engineer",
      ],
      popular: false,
      cta: "Contact Enterprise",
    },
  ];

  const scrollToWaitlist = () => {
    const el = document.querySelector("#waitlist");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="pricing" className="py-[96px] md:py-[128px] relative z-10 bg-[#11151C]/60 border-y border-white/[0.06]">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px]">
        
        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-[64px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#171B22] border border-white/10 text-xs text-[#B8D957] mb-[16px]"
          >
            <Sparkles className="w-[14px] h-[14px]" />
            <span>Early Access Pricing Guarantee</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-[20px]"
          >
            Simple, transparent pricing.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#98A2B3]"
          >
            Join the waitlist today and get <strong className="text-[#B8D957]">6 months of Pro Trader tier completely free</strong> upon launch.
          </motion.p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px] items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`rounded-[28px] bg-[#171B22] p-[32px] border transition-all duration-300 flex flex-col justify-between relative ${
                plan.popular
                  ? "border-[#B8D957] shadow-2xl shadow-[#B8D957]/10 scale-[1.02]"
                  : "border-white/[0.06] hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-[14px] left-[4px]/2 -translate-x-[4px]/2 px-[16px] py-[4px] rounded-full bg-[#B8D957] text-[#0B0D10] text-xs font-bold uppercase tracking-wider flex items-center gap-[6px] shadow-md">
                  <Crown className="w-[14px] h-[14px]" />
                  Most Popular for Traders
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-[16px]">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <span className="text-xs px-[10px] py-[4px] rounded-full bg-white/[0.04] border border-white/10 text-[#98A2B3] font-mono">
                    {plan.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-[4px] mb-[12px]">
                  <span className="text-4xl font-extrabold text-white font-mono">{plan.price}</span>
                  <span className="text-xs text-[#98A2B3] font-medium">{plan.period}</span>
                </div>

                <p className="text-xs text-[#98A2B3] leading-relaxed mb-[24px] border-b border-white/[0.06] pb-[24px]">
                  {plan.desc}
                </p>

                <ul className="space-y-[12px] text-xs text-white/90 mb-[32px]">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-[10px]">
                      <Check className="w-[16px] h-[16px] text-[#B8D957] flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={scrollToWaitlist}
                className={`w-full py-[14px] rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center gap-[8px] group ${
                  plan.popular
                    ? "bg-[#B8D957] text-[#0B0D10] hover:bg-[#c6e865] shadow-lg shadow-[#B8D957]/20"
                    : "bg-[#11151C] text-white border border-white/10 hover:bg-[#1F2631]"
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-[16px] h-[16px] transition-transform group-hover:translate-x-[4px]" />
              </button>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
