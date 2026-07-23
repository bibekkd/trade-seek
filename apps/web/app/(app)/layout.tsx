import React from "react";
import AppShell from "../app-shell";
import { broadEquities } from "../market-universe";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell instruments={broadEquities}>{children}</AppShell>;
}
