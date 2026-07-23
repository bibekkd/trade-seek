import { getQuotes } from "@/lib/api";
import type { Candle, Instrument, Quote } from "@/lib/api";
import type { EquitySnapshot } from "./popular-equities-dashboard";

export const headlineIndices: Instrument[] = [
  marketInstrument("NSE:NIFTY50-INDEX", "Nifty 50", "index"),
  marketInstrument("NSE:NIFTYBANK-INDEX", "Nifty Bank", "index"),
  marketInstrument("NSE:FINNIFTY-INDEX", "Nifty Financial Services", "index"),
  marketInstrument("NSE:NIFTYIT-INDEX", "Nifty IT", "index"),
  marketInstrument("NSE:NIFTYMIDCAP50-INDEX", "Nifty Midcap 50", "index"),
];

export const popularEquities: Instrument[] = [
  marketInstrument("RELIANCE", "Reliance Industries", "energy"),
  marketInstrument("HDFCBANK", "HDFC Bank", "financials"),
  marketInstrument("ICICIBANK", "ICICI Bank", "financials"),
  marketInstrument("TCS", "Tata Consultancy Services", "information_technology"),
  marketInstrument("INFY", "Infosys", "information_technology"),
  marketInstrument("SBIN", "State Bank of India", "financials"),
  marketInstrument("BHARTIARTL", "Bharti Airtel", "telecom"),
  marketInstrument("ITC", "ITC", "fmcg"),
  marketInstrument("LT", "Larsen & Toubro", "capital_goods"),
  marketInstrument("AXISBANK", "Axis Bank", "financials"),
];

export const broadEquities: Instrument[] = [
  ...popularEquities,
  marketInstrument("KOTAKBANK", "Kotak Mahindra Bank", "financials"),
  marketInstrument("BAJFINANCE", "Bajaj Finance", "financials"),
  marketInstrument("BAJAJFINSV", "Bajaj Finserv", "financials"),
  marketInstrument("HCLTECH", "HCL Technologies", "information_technology"),
  marketInstrument("WIPRO", "Wipro", "information_technology"),
  marketInstrument("TECHM", "Tech Mahindra", "information_technology"),
  marketInstrument("HINDUNILVR", "Hindustan Unilever", "fmcg"),
  marketInstrument("NESTLEIND", "Nestle India", "fmcg"),
  marketInstrument("BRITANNIA", "Britannia Industries", "fmcg"),
  marketInstrument("TATACONSUM", "Tata Consumer Products", "fmcg"),
  marketInstrument("MARUTI", "Maruti Suzuki", "automobile"),
  marketInstrument("M&M", "Mahindra & Mahindra", "automobile"),
  marketInstrument("EICHERMOT", "Eicher Motors", "automobile"),
  marketInstrument("BAJAJ-AUTO", "Bajaj Auto", "automobile"),
  marketInstrument("HEROMOTOCO", "Hero MotoCorp", "automobile"),
  marketInstrument("TVSMOTOR", "TVS Motor", "automobile"),
  marketInstrument("SUNPHARMA", "Sun Pharmaceutical", "pharma"),
  marketInstrument("CIPLA", "Cipla", "pharma"),
  marketInstrument("DRREDDY", "Dr. Reddy's Laboratories", "pharma"),
  marketInstrument("DIVISLAB", "Divi's Laboratories", "pharma"),
  marketInstrument("APOLLOHOSP", "Apollo Hospitals", "healthcare"),
  marketInstrument("NTPC", "NTPC", "utilities"),
  marketInstrument("POWERGRID", "Power Grid Corporation", "utilities"),
  marketInstrument("ONGC", "Oil & Natural Gas Corporation", "energy"),
  marketInstrument("COALINDIA", "Coal India", "energy"),
  marketInstrument("BPCL", "Bharat Petroleum", "energy"),
  marketInstrument("IOC", "Indian Oil Corporation", "energy"),
  marketInstrument("ADANIENT", "Adani Enterprises", "conglomerate"),
  marketInstrument("ADANIPORTS", "Adani Ports", "infrastructure"),
  marketInstrument("TATASTEEL", "Tata Steel", "metals"),
  marketInstrument("JSWSTEEL", "JSW Steel", "metals"),
  marketInstrument("HINDALCO", "Hindalco Industries", "metals"),
  marketInstrument("VEDL", "Vedanta", "metals"),
  marketInstrument("GRASIM", "Grasim Industries", "materials"),
  marketInstrument("ULTRACEMCO", "UltraTech Cement", "cement"),
  marketInstrument("SHREECEM", "Shree Cement", "cement"),
  marketInstrument("AMBUJACEM", "Ambuja Cements", "cement"),
  marketInstrument("ASIANPAINT", "Asian Paints", "consumer_discretionary"),
  marketInstrument("TITAN", "Titan Company", "consumer_discretionary"),
  marketInstrument("TRENT", "Trent", "retail"),
  marketInstrument("DMART", "Avenue Supermarts", "retail"),
  marketInstrument("INDUSINDBK", "IndusInd Bank", "financials"),
  marketInstrument("BANKBARODA", "Bank of Baroda", "financials"),
  marketInstrument("PNB", "Punjab National Bank", "financials"),
  marketInstrument("CANBK", "Canara Bank", "financials"),
  marketInstrument("IDFCFIRSTB", "IDFC First Bank", "financials"),
  marketInstrument("FEDERALBNK", "Federal Bank", "financials"),
  marketInstrument("CHOLAFIN", "Cholamandalam Investment", "financials"),
  marketInstrument("MUTHOOTFIN", "Muthoot Finance", "financials"),
  marketInstrument("SBILIFE", "SBI Life Insurance", "insurance"),
  marketInstrument("HDFCLIFE", "HDFC Life Insurance", "insurance"),
  marketInstrument("ICICIPRULI", "ICICI Prudential Life", "insurance"),
  marketInstrument("ICICIGI", "ICICI Lombard", "insurance"),
  marketInstrument("MOTHERSON", "Samvardhana Motherson", "automobile"),
  marketInstrument("BOSCHLTD", "Bosch", "automobile"),
  marketInstrument("ASHOKLEY", "Ashok Leyland", "automobile"),
  marketInstrument("MRF", "MRF", "automobile"),
  marketInstrument("PIDILITIND", "Pidilite Industries", "chemicals"),
  marketInstrument("SRF", "SRF", "chemicals"),
  marketInstrument("UPL", "UPL", "chemicals"),
  marketInstrument("GODREJCP", "Godrej Consumer Products", "fmcg"),
  marketInstrument("DABUR", "Dabur India", "fmcg"),
  marketInstrument("MARICO", "Marico", "fmcg"),
  marketInstrument("COLPAL", "Colgate-Palmolive India", "fmcg"),
  marketInstrument("VBL", "Varun Beverages", "consumer"),
  marketInstrument("ETERNAL", "Eternal", "internet"),
  marketInstrument("NYKAA", "FSN E-Commerce Ventures", "internet"),
  marketInstrument("PAYTM", "One 97 Communications", "fintech"),
  marketInstrument("POLYCAB", "Polycab India", "capital_goods"),
  marketInstrument("SIEMENS", "Siemens", "capital_goods"),
  marketInstrument("ABB", "ABB India", "capital_goods"),
  marketInstrument("BEL", "Bharat Electronics", "defence"),
  marketInstrument("HAL", "Hindustan Aeronautics", "defence"),
  marketInstrument("BHEL", "Bharat Heavy Electricals", "capital_goods"),
  marketInstrument("IRCTC", "Indian Railway Catering", "services"),
  marketInstrument("INDIGO", "InterGlobe Aviation", "aviation"),
  marketInstrument("DLF", "DLF", "real_estate"),
  marketInstrument("LODHA", "Macrotech Developers", "real_estate"),
  marketInstrument("GAIL", "GAIL India", "energy"),
  marketInstrument("TATAPOWER", "Tata Power", "utilities"),
  marketInstrument("JSWENERGY", "JSW Energy", "utilities"),
  marketInstrument("NHPC", "NHPC", "utilities"),
  marketInstrument("JIOFIN", "Jio Financial Services", "financials"),
  marketInstrument("NAUKRI", "Info Edge", "internet"),
  marketInstrument("OFSS", "Oracle Financial Services Software", "information_technology"),
  marketInstrument("PERSISTENT", "Persistent Systems", "information_technology"),
  marketInstrument("COFORGE", "Coforge", "information_technology"),
  marketInstrument("MPHASIS", "Mphasis", "information_technology"),
  marketInstrument("LUPIN", "Lupin", "pharma"),
  marketInstrument("AUROPHARMA", "Aurobindo Pharma", "pharma"),
  marketInstrument("BIOCON", "Biocon", "pharma"),
  marketInstrument("TORNTPHARM", "Torrent Pharmaceuticals", "pharma"),
  marketInstrument("MAXHEALTH", "Max Healthcare Institute", "healthcare"),
].slice(0, 100);

export async function getMarketSnapshots(
  instruments: Instrument[],
  start: string,
  end: string,
): Promise<EquitySnapshot[]> {
  try {
    const quotes = await getQuotes({ symbols: instruments.map((instrument) => instrument.symbol) });
    const quotesBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
    const snapshots = instruments.map((instrument) => {
      const quote = quotesBySymbol.get(instrument.symbol);
      if (!quote) {
        return { instrument, latest: null, previous: null, error: "Quote unavailable" };
      }
      return snapshotFromQuote(instrument, quote);
    });
    if (snapshots.some((snapshot) => !snapshot.latest)) {
      const historicalSnapshots = await getHistoricalMarketSnapshots(
        instruments.filter((instrument) => !quotesBySymbol.has(instrument.symbol)),
        start,
        end,
      );
      const historicalBySymbol = new Map(
        historicalSnapshots.map((snapshot) => [snapshot.instrument.symbol, snapshot]),
      );
      return snapshots.map((snapshot) => {
        if (snapshot.latest) return snapshot;
        return historicalBySymbol.get(snapshot.instrument.symbol) ?? snapshot;
      });
    }
    return snapshots;
  } catch (error) {
    const historicalSnapshots = await getHistoricalMarketSnapshots(instruments, start, end);
    if (historicalSnapshots.some((snapshot) => snapshot.latest)) return historicalSnapshots;
    const message = error instanceof Error ? error.message : "Market data request failed";
    return historicalSnapshots.map((snapshot) => ({
      ...snapshot,
      error: snapshot.error ?? message,
    }));
  }
}

export function marketSnapshotsQueryKey(
  instruments: Instrument[],
  start: string,
  end: string,
) {
  return ["fyers", "snapshots", instruments.map((instrument) => instrument.symbol), start, end] as const;
}

function snapshotFromQuote(instrument: Instrument, quote: Quote): EquitySnapshot {
  const latest: Candle = {
    symbol: instrument.symbol,
    exchange: quote.exchange,
    timeframe: "1d",
    timestamp: quote.timestamp,
    open: quote.open,
    high: quote.high,
    low: quote.low,
    close: quote.last,
    volume: quote.volume,
    source: quote.source,
  };
  const previous: Candle = {
    ...latest,
    close: quote.previous_close,
    timestamp: quote.timestamp,
  };
  return {
    instrument,
    latest,
    previous,
    error: null,
  };
}

function snapshotFromCandles(instrument: Instrument, symbolCandles: Candle[]): EquitySnapshot {
  return {
    instrument,
    latest: symbolCandles.at(-1) ?? null,
    previous: symbolCandles.at(-2) ?? null,
    error: null,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = { status: "fulfilled", value: await mapper(items[index]) };
      } catch (error) {
        results[index] = { status: "rejected", reason: error };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

export async function getHistoricalMarketSnapshots(
  instruments: Instrument[],
  start: string,
  end: string,
): Promise<EquitySnapshot[]> {
  const { getCandles } = await import("@/lib/api");
  const results = await mapWithConcurrency(instruments, 2, async (instrument) => {
    const symbolCandles = await getCandles({
      symbol: instrument.symbol,
      provider: "fyers",
      start,
      end,
    });
    return snapshotFromCandles(instrument, symbolCandles);
  });

  return results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      instrument: instruments[index],
      latest: null,
      previous: null,
      error: result.reason instanceof Error ? result.reason.message : "Market data request failed",
    };
  });
}

export function recentMarketWindow(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 45);
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
  };
}

function marketInstrument(symbol: string, name: string, segment: string): Instrument {
  return {
    symbol,
    exchange: "NSE",
    name,
    isin: null,
    segment,
    currency: "INR",
    is_active: true,
  };
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
