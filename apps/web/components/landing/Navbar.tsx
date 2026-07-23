"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Menu, X, Terminal, Shield, Zap } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "AI Demo", href: "#ai-demo" },
    { name: "Brokers", href: "#integrations" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  const scrollToSection = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-[#0B0D10]/80 backdrop-blur-xl border-b border-white/[0.08] py-[14px] shadow-2xl shadow-black/50"
        : "bg-transparent py-[20px]"
        }`}
    >
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px] flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-[12px] group">
          <div className="relative flex items-center justify-center w-[40px] h-[40px] rounded-xl bg-gradient-to-br from-[#171B22] to-[#11151C] border border-white/10 group-hover:border-[#B8D957]/50 transition-all duration-300 shadow-lg">
            <div className="absolute inset-0 bg-[#B8D957]/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-[20px] h-[20px] text-[#B8D957] transition-transform group-hover:rotate-12 duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-[6px] font-sans">
              TradeSeek
              <span className="text-[10px] uppercase tracking-wider font-semibold px-[8px] py-[2px] rounded-full bg-[#B8D957]/10 text-[#B8D957] border border-[#B8D957]/20">
                AI Native
              </span>
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-[4px] bg-[#171B22]/60 border border-white/[0.06] backdrop-blur-md px-[16px] py-[6px] rounded-full">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => scrollToSection(link.href)}
              className="text-sm text-[#98A2B3] hover:text-white px-[14px] py-[6px] rounded-full hover:bg-white/[0.04] transition-all font-medium"
            >
              {link.name}
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-[12px]">
          <a
            href="/"
            className="text-sm font-medium text-[#98A2B3] hover:text-white px-[16px] py-[8px] rounded-full hover:bg-white/[0.05] transition-all flex items-center gap-[6px]"
          >
            <Terminal className="w-[16px] h-[16px] text-[#66A7FF]" />
            Live App
          </a>
          <button
            onClick={() => scrollToSection("#waitlist")}
            className="group relative inline-flex items-center gap-[8px] px-[20px] py-[10px] rounded-full bg-[#B8D957] text-[#0B0D10] font-semibold text-sm hover:bg-[#c6e865] transition-all duration-300 shadow-lg shadow-[#B8D957]/20 hover:shadow-[#B8D957]/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Join Waitlist</span>
            <ArrowRight className="w-[16px] h-[16px] transition-transform group-hover:translate-x-[4px]" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-[10px] rounded-xl bg-[#171B22] border border-white/10 text-white hover:bg-[#1F2631] transition-all"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-[20px] h-[20px]" /> : <Menu className="w-[20px] h-[20px]" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0B0D10]/95 border-b border-white/10 backdrop-blur-2xl px-[24px] py-[24px]"
          >
            <div className="flex flex-col gap-[12px]">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="text-left text-base text-[#98A2B3] hover:text-white py-[10px] border-b border-white/[0.04] font-medium"
                >
                  {link.name}
                </button>
              ))}
              <div className="pt-[16px] flex flex-col gap-[12px]">
                <a
                  href="/dashboard"
                  className="w-full text-center py-[12px] rounded-full bg-[#171B22] border border-white/10 text-white font-medium flex items-center justify-center gap-[8px]"
                >
                  <Terminal className="w-[16px] h-[16px] text-[#66A7FF]" />
                  Launch Terminal App
                </a>
                <button
                  onClick={() => scrollToSection("#waitlist")}
                  className="w-full text-center py-[12px] rounded-full bg-[#B8D957] text-[#0B0D10] font-semibold flex items-center justify-center gap-[8px]"
                >
                  Join Waitlist
                  <ArrowRight className="w-[16px] h-[16px]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
