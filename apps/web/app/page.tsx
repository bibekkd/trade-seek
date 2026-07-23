"use client";

import AIDemoSection from "@/components/landing/AIDemoSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import FAQ from "@/components/landing/FAQ";
import FeaturesBentoGrid from "@/components/landing/FeaturesBentoGrid";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import HeroBackground from "@/components/landing/HeroBackground";
import Integrations from "@/components/landing/Integrations";
import Metrics from "@/components/landing/Metrics";
import Navbar from "@/components/landing/Navbar";
import Pricing from "@/components/landing/Pricing";
import ProblemSection from "@/components/landing/ProblemSection";
import SocialProof from "@/components/landing/SocialProof";
import Testimonials from "@/components/landing/Testimonials";
import Timeline from "@/components/landing/Timeline";
import WaitlistSection from "@/components/landing/WaitlistSection";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0B0D10]">
      <HeroBackground />
      <Navbar />
      <Hero />
      <SocialProof />
      <ProblemSection />
      <FeaturesBentoGrid />
      <AIDemoSection />
      <DashboardPreview />
      <Integrations />
      <Timeline />
      <Testimonials />
      <Metrics />
      <Pricing />
      <FAQ />
      <WaitlistSection />
      <Footer />
    </main>
  );
}
