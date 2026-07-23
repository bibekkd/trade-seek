"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import HeroBackground from "@/components/landing/HeroBackground";
import Hero from "@/components/landing/Hero";
import SocialProof from "@/components/landing/SocialProof";
import ProblemSection from "@/components/landing/ProblemSection";
import FeaturesBentoGrid from "@/components/landing/FeaturesBentoGrid";
import AIDemoSection from "@/components/landing/AIDemoSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Integrations from "@/components/landing/Integrations";
import Timeline from "@/components/landing/Timeline";
import Testimonials from "@/components/landing/Testimonials";
import Metrics from "@/components/landing/Metrics";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import WaitlistSection from "@/components/landing/WaitlistSection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#0B0D10] overflow-x-hidden">
      {/* Dynamic Background Glows & Particles */}
      <HeroBackground />

      {/* Sticky Blur Navbar */}
      <Navbar />

      {/* Hero Section with 3D Terminal Mockup */}
      <Hero />

      {/* Social Proof Strip */}
      <SocialProof />

      {/* Problem & Solution Contrast Section */}
      <ProblemSection />

      {/* 12-Column Bento Grid Capabilities */}
      <FeaturesBentoGrid />

      {/* ChatGPT + TradingView Interactive AI Terminal Simulation */}
      <AIDemoSection />

      {/* Live Interactive Feature Showcase */}
      <DashboardPreview />

      {/* Indian Broker & Exchange Integrations Grid */}
      <Integrations />

      {/* 6-Step Workflow Journey Timeline */}
      <Timeline />

      {/* Trader Testimonials & Metrics */}
      <Testimonials />

      {/* Animated Key Platform Metrics */}
      <Metrics />

      {/* Pricing & Free Access Perks */}
      <Pricing />

      {/* Expandable FAQ Accordion */}
      <FAQ />

      {/* VIP Waitlist Conversion Card */}
      <WaitlistSection />

      {/* Footer & SEBI Disclaimers */}
      <Footer />
    </main>
  );
}
