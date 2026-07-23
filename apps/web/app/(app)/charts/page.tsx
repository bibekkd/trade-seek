import { getCandles } from "@/lib/api";
import type { Candle } from "@/lib/api";
import { recentMarketWindow } from "../../market-universe";
import ChartsClient from "./charts-client";

export const dynamic = "force-dynamic";

type ChartsPageProps = {
  searchParams?: {
    symbol?: string;
  };
};

export default async function ChartsPage({ searchParams }: ChartsPageProps) {
  const requestedSymbol = searchParams?.symbol ?? "RELIANCE";
  const { start, end } = recentMarketWindow();
  let candles: Candle[] = [];
  try {
    candles = await getCandles({ symbol: requestedSymbol, provider: "fyers", start, end });
  } catch (error) {
    console.error(`Unable to load candles for ${requestedSymbol}`, error);
  }

  return <ChartsClient requestedSymbol={requestedSymbol} initialCandles={candles} start={start} end={end} />;
}
