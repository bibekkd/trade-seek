"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import TradingChatWidget from "./trading-chat-widget";
import type { Instrument } from "@/lib/api";

type Props = {
  children: React.ReactNode;
  instruments: Instrument[];
};

export default function AppShell({ children, instruments }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tradeseek_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("tradeseek_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className={`dashboard-layout ${isCollapsed ? "collapsed" : ""}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        {children}
      </div>
      <TradingChatWidget instruments={instruments} />
    </div>
  );
}

