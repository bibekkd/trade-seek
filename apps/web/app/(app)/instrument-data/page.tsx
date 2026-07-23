import { getCandles } from "@/lib/api";
import type { Candle } from "@/lib/api";
import {
  broadEquities,
  headlineIndices,
  recentMarketWindow,
} from "../../market-universe";
import InstrumentDataClient from "./instrument-data-client";

export const dynamic = "force-dynamic";

type InstrumentDataProps = {
  searchParams?: {
    symbol?: string;
  };
};

export default async function InstrumentDataPage({ searchParams }: InstrumentDataProps) {
  const provider = "fyers";
  const instruments = [...broadEquities, ...headlineIndices];
  const stocks = broadEquities;
  const indices = headlineIndices;
  const selectedSymbol = searchParams?.symbol ?? instruments[0]?.symbol ?? "RELIANCE";
  const selectedInstrument =
    instruments.find((instrument) => instrument.symbol === selectedSymbol) ?? instruments[0];
  const { start, end } = recentMarketWindow();
  let candles: Candle[] = [];
  let dataError: string | null = null;

  try {
    candles = selectedInstrument
      ? await getCandles({ symbol: selectedInstrument.symbol, provider, start, end })
      : [];
  } catch (error) {
    dataError = error instanceof Error ? error.message : "Market data request failed";
  }
  return (
    <InstrumentDataClient
      selectedSymbol={selectedSymbol}
      initialCandles={candles}
      initialError={dataError}
      start={start}
      end={end}
    />
  );
}
