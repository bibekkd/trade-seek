export type ApiHealth = {
  status: string;
  service: string;
  version: string;
  mode: string;
};

export type Instrument = {
  symbol: string;
  exchange: string;
  name: string;
  isin: string | null;
  segment: string;
  currency: string;
  is_active: boolean;
};

export type Candle = {
  symbol: string;
  exchange: string;
  timeframe: string;
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  source: string;
};

export type Quote = {
  symbol: string;
  exchange: string;
  timestamp: string;
  open: string;
  high: string;
  low: string;
  last: string;
  previous_close: string;
  change: string;
  change_pct: string;
  volume: string;
  source: string;
};

export type CandleRequest = {
  symbol: string;
  provider?: string;
  exchange?: string;
  timeframe?: string;
  start?: string;
  end?: string;
};

export type BacktestMetrics = {
  start_at: string;
  end_at: string;
  initial_cash: number;
  final_equity: number;
  total_return_pct: number;
  cagr_pct: number;
  sharpe: number;
  max_drawdown_pct: number;
  benchmark_return_pct: number;
  win_rate_pct: number;
  number_of_trades: number;
};

export type BacktestExecutionSummary = {
  initial_cash: number;
  fee_bps: number;
  slippage_bps: number;
  position_size_fraction: number;
};

export type BacktestDataQuality = {
  observations: number;
  duplicate_timestamps: number;
  gap_count: number;
  missing_volume_count: number;
  warnings: string[];
};

export type BacktestRun = {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | string;
  engine: string;
  symbol: string;
  exchange: string;
  timeframe: string;
  provider: string;
  start_at: string;
  end_at: string;
  strategy_type: string;
  parameters: Record<string, number>;
  metrics: {
    strategy_type: "moving_average_crossover" | "rsi_mean_reversion" | string;
    primary_window: "out_of_sample" | string;
    in_sample: BacktestMetrics;
    out_of_sample: BacktestMetrics;
    full: BacktestMetrics;
    execution?: BacktestExecutionSummary;
    data_quality?: BacktestDataQuality;
  } | null;
  equity_curve: Array<{ timestamp: string; equity: number; close: number; position: string; drawdown_pct?: number }> | null;
  trades: Array<Record<string, string | number | boolean>> | null;
  error_message: string | null;
};

export type StrategyProposal = {
  name?: string;
  description?: string;
  rank?: number;
  score?: number;
  evidence?: unknown[];
  risk_notes?: string[];
  strategy_candidates?: StrategyProposal[];
  strategy: MovingAverageStrategy | RsiStrategy;
};

export type MovingAverageStrategy = {
    strategy_type: "moving_average_crossover";
    parameters: {
      short_window: number;
      long_window: number;
      initial_cash: number | string;
      train_fraction: number;
      fee_bps?: number | string;
      slippage_bps?: number | string;
      position_size_fraction?: number;
    };
};

export type RsiStrategy = {
  strategy_type: "rsi_mean_reversion";
  parameters: {
    lookback_window: number;
    oversold_threshold: number;
    overbought_threshold: number;
    initial_cash: number | string;
    train_fraction: number;
    fee_bps?: number | string;
    slippage_bps?: number | string;
    position_size_fraction?: number;
  };
};

export type ResearchRun = {
  id: string;
  created_at: string;
  status: "running" | "proposed" | "queued" | "rejected" | "failed" | string;
  symbol: string;
  exchange: string;
  timeframe: string;
  provider: string;
  start_at: string;
  end_at: string;
  prompt: string;
  strategy_proposal: StrategyProposal | null;
  ai_request_log_id: string | null;
  backtest_run_id: string | null;
  error_message: string | null;
  ai_provider?: string | null;
  ai_model?: string | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function getApiHealth(): Promise<ApiHealth> {
  try {
    const response = await fetch(`${apiBaseUrl}/health`, {
      next: { revalidate: 5 },
    });

    if (!response.ok) {
      throw new Error(`Health request failed: ${response.status}`);
    }

    return response.json();
  } catch {
    return {
      status: "unreachable",
      service: "algo-trading-api",
      version: "unknown",
      mode: "local",
    };
  }
}

export async function getInstruments(provider = "fixture"): Promise<Instrument[]> {
  const response = await fetch(`${apiBaseUrl}/instruments?provider=${provider}`, {
    next: { revalidate: 5 },
  });

  if (!response.ok) {
    throw new Error(`Instrument request failed: ${response.status}`);
  }

  return response.json();
}

export async function getCandles({
  symbol,
  provider = "fixture",
  exchange = "NSE",
  timeframe = "1d",
  start,
  end,
}: CandleRequest): Promise<Candle[]> {
  const params = new URLSearchParams({
    symbol,
    exchange,
    provider,
    timeframe,
  });
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const response = await fetch(
    `${apiBaseUrl}/market-data/candles?${params}`,
    provider === "fyers" ? { cache: "no-store" } : { next: { revalidate: 5 } },
  );

  if (!response.ok) {
    throw new Error(`Candle request failed: ${response.status}`);
  }

  return response.json();
}

export async function getQuotes({
  symbols,
  provider = "fyers",
  exchange = "NSE",
}: {
  symbols: string[];
  provider?: string;
  exchange?: string;
}): Promise<Quote[]> {
  const params = new URLSearchParams({
    symbols: symbols.join(","),
    exchange,
    provider,
  });
  const response = await fetch(`${apiBaseUrl}/market-data/quotes?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Quote request failed: ${response.status}`);
  }

  return response.json();
}

async function apiError(response: Response, fallback: string): Promise<never> {
  let detail = fallback;
  try {
    const body = await response.json();
    if (typeof body.detail === "string") detail = body.detail;
  } catch {
    // Keep the HTTP fallback when the response is not JSON.
  }
  throw new Error(detail);
}

export async function createBacktest(payload: {
  symbol: string;
  exchange: string;
  timeframe: string;
  provider: string;
  start_at: string;
  end_at: string;
  strategy: {
    strategy_type: "moving_average_crossover";
    parameters: MovingAverageStrategy["parameters"];
  } | RsiStrategy;
}): Promise<BacktestRun> {
  const response = await fetch(`${apiBaseUrl}/backtests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return apiError(response, `Backtest submission failed: ${response.status}`);
  return response.json();
}

export async function getBacktest(id: string): Promise<BacktestRun> {
  const response = await fetch(`${apiBaseUrl}/backtests/${id}`, { cache: "no-store" });
  if (!response.ok) return apiError(response, `Backtest request failed: ${response.status}`);
  return response.json();
}

export async function createResearchStrategy(payload: {
  prompt: string;
  symbol: string;
  exchange: string;
  timeframe: string;
  provider: string;
  start_at: string;
  end_at: string;
  run_backtest: boolean;
}): Promise<ResearchRun> {
  const response = await fetch(`${apiBaseUrl}/research/strategy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return apiError(response, `Research request failed: ${response.status}`);
  return response.json();
}

export async function getResearchRun(id: string): Promise<ResearchRun> {
  const response = await fetch(`${apiBaseUrl}/research/runs/${id}`, { cache: "no-store" });
  if (!response.ok) return apiError(response, `Research run request failed: ${response.status}`);
  return response.json();
}

export async function getResearchRuns(limit = 20): Promise<ResearchRun[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(`${apiBaseUrl}/research/runs?${params}`, { cache: "no-store" });
  if (!response.ok) return apiError(response, `Research history request failed: ${response.status}`);
  return response.json();
}
