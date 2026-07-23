"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play, CheckCircle2, ShieldCheck, Users, TrendingUp } from "lucide-react";
import HeroDashboard from "./HeroDashboard";

export default function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "Retail Trader", source: "landing-hero" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "We could not save your signup right now. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("We could not save your signup right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative pt-[128px] pb-[80px] md:pt-[160px] md:pb-[128px] overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[48px] lg:gap-[32px] items-center">
          
          {/* Left Column: Headline, Form & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col items-start text-left"
          >
            {/* Top AI Badge */}
            <div className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#171B22] border border-white/10 text-xs text-white mb-[24px] shadow-md">
              <span className="flex h-[8px] w-[8px] rounded-full bg-[#B8D957] animate-pulse" />
              <Sparkles className="w-[14px] h-[14px] text-[#B8D957]" />
              <span className="font-medium">The Future of AI Trading for India</span>
              <span className="text-[#98A2B3]">• NSE & BSE Ready</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-extrabold tracking-tight text-white leading-[1.05] font-sans mb-[24px]">
              Trade Smarter. <br />
              <span className="bg-gradient-to-r from-white via-white to-[#B8D957] bg-clip-text text-transparent">
                Not Harder.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#98A2B3] max-w-[540px] leading-relaxed mb-[32px] font-normal">
              TradeSeek is an AI-powered copilot for Indian retail traders. Describe your strategy in plain English—our engine builds, backtests, and deploys it live to Zerodha, Dhan, or Fyers with microsecond execution.
            </p>

            {/* Waitlist Form */}
            <div className="w-full max-w-[500px] mb-[32px]">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-[10px]">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      className="w-full px-[20px] py-[14px] rounded-full bg-[#171B22]/90 border border-white/10 text-white placeholder-[#98A2B3] text-sm focus:outline-none focus:border-[#B8D957] focus:ring-1 focus:ring-[#B8D957] transition-all shadow-inner"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-[24px] py-[14px] rounded-full bg-[#B8D957] text-[#0B0D10] font-bold text-sm hover:bg-[#c6e865] transition-all duration-300 shadow-lg shadow-[#B8D957]/20 flex items-center justify-center gap-[8px] group whitespace-nowrap active:scale-[0.98]"
                  >
                    <span>{isSubmitting ? "Saving..." : "Join Waitlist"}</span>
                    <ArrowRight className="w-[16px] h-[16px] transition-transform group-hover:translate-x-[4px]" />
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-[16px] rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] flex items-center gap-[12px] text-sm"
                >
                  <CheckCircle2 className="w-[20px] h-[20px] flex-shrink-0" />
                  <div>
                    <span className="font-bold block">You&apos;re on the VIP Waitlist!</span>
                    <span className="text-xs text-[#22C55E]/80">You are position #1,482. We&apos;ll notify you when early access opens.</span>
                  </div>
                </motion.div>
              )}

              {error && <p className="text-xs text-[#FF5C5C] mt-[8px] ml-[16px]">{error}</p>}
            </div>

            {/* Secondary Action & Trust Badges */}
            <div className="flex flex-wrap items-center gap-[24px] text-xs text-[#98A2B3]">
              <button
                onClick={() => scrollToSection("#ai-demo")}
                className="flex items-center gap-[8px] text-white font-medium hover:text-[#B8D957] transition-colors group"
              >
                <div className="w-[32px] h-[32px] rounded-full bg-[#171B22] border border-white/10 flex items-center justify-center group-hover:border-[#B8D957]/50 transition-colors">
                  <Play className="w-[14px] h-[14px] text-[#B8D957] fill-[#B8D957] ml-[2px]" />
                </div>
                <span>Watch AI Terminal Demo</span>
              </button>

              <div className="h-[16px] w-px bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-[8px]">
                <ShieldCheck className="w-[16px] h-[16px] text-[#66A7FF]" />
                <span>SEBI Compliant Sandbox</span>
              </div>
            </div>

            {/* Social Proof Avatars */}
            <div className="mt-[40px] pt-[24px] border-t border-white/[0.06] flex items-center gap-[16px]">
              <div className="flex -space-x-[10px] overflow-hidden">
                <div className="inline-block h-[32px] w-[32px] rounded-full ring-2 ring-[#0B0D10] bg-gradient-to-tr from-purple-500 to-indigo-500 text-[10px] font-bold flex items-center justify-center text-white">AK</div>
                <div className="inline-block h-[32px] w-[32px] rounded-full ring-2 ring-[#0B0D10] bg-gradient-to-tr from-[#B8D957] to-emerald-600 text-[10px] font-bold flex items-center justify-center text-[#0B0D10]">RG</div>
                <div className="inline-block h-[32px] w-[32px] rounded-full ring-2 ring-[#0B0D10] bg-gradient-to-tr from-blue-500 to-cyan-500 text-[10px] font-bold flex items-center justify-center text-white">PS</div>
                <div className="inline-block h-[32px] w-[32px] rounded-full ring-2 ring-[#0B0D10] bg-[#171B22] border border-white/10 text-[10px] font-bold flex items-center justify-center text-[#B8D957]">+1k</div>
              </div>
              <p className="text-xs text-[#98A2B3]">
                Joined by <strong className="text-white">1,480+ Indian traders</strong> from Zerodha, Dhan, & Fyers.
              </p>
            </div>
          </motion.div>

          {/* Right Column: Floating 3D Dashboard Mockup */}
          <div className="lg:col-span-6 w-full">
            <HeroDashboard />
          </div>

        </div>
      </div>
    </section>
  );
}
