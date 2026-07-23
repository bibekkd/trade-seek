# Incremental Build Plan: AI Trading Platform MVP

## Summary
Build the platform in small, testable slices. The first usable version will support India equities research and backtesting only, with no live trading. It will use a pluggable broker/data adapter design, a mockable open-source LLM router, deterministic test fixtures, and `vectorbt` as the only backtesting engine.

Default stack:
- Frontend: Next.js, TypeScript, Tailwind, shadcn/ui, Zustand, React Query
- Backend: FastAPI, Pydantic, PostgreSQL, Redis, Celery
- Backtesting: `vectorbt`, pandas, NumPy, pandas-ta
- AI: provider router with mock open-source providers first
- Data: CSV fixtures, NSE Bhavcopy, FYERS historical equity data, Angel One SmartAPI fallback
- Cloud: Oracle Cloud first for low-cost MVP hosting, with AWS as the later scale target
- Trading: no real orders in MVP

## Build Phases

### Phase 1: Project Foundation
Create the monorepo structure with separate frontend and backend apps.

Implement:
- `apps/web` for Next.js frontend
- `apps/api` for FastAPI backend
- shared environment config examples
- Docker Compose for PostgreSQL and Redis
- backend health endpoint
- frontend health/status page
- base CI commands for lint, typecheck, and tests

Test before moving on:
- frontend starts locally
- backend starts locally
- backend can connect to PostgreSQL and Redis
- health checks pass
- CI-style commands run cleanly

### Phase 2: Domain Models And Storage
Define the core platform entities before building workflows.

Implement:
- users as local/dev-only placeholder identity for MVP
- instruments for NSE/BSE symbols
- OHLCV candle model
- strategy definition model
- backtest run model
- backtest result metrics model
- AI request/response log model
- database migrations

Use PostgreSQL with time-series-friendly table design:
- timestamp indexes
- instrument + timeframe indexes
- schema compatible with future TimescaleDB migration

Test before moving on:
- migration up/down works
- model validation works
- repository/database tests cover create/read/query paths
- OHLCV queries are indexed by instrument and time range

### Phase 3: Market Data Adapter Layer
Build the data contract first, with deterministic fixtures and free-account broker adapters.

Implement:
- `MarketDataAdapter` interface
- fixture/CSV adapter for deterministic tests
- NSE Bhavcopy adapter for official daily EOD data
- FYERS adapter for historical equity candles after account/API setup
- Angel One SmartAPI adapter as the fallback historical candle provider
- seed dataset for a small set of India equity symbols
- API endpoints to list instruments and fetch candles

Because free broker APIs can change access windows and limits, the MVP should always keep fixture/CSV data as the deterministic fallback. During FYERS setup, verify the available historical range, including the community-reported Jan 2025 data start.

Test before moving on:
- fixture data imports successfully
- candles can be queried by symbol, timeframe, and date range
- invalid symbols/date ranges return clear errors
- adapter contract tests pass for fixture adapter
- FYERS/Angel adapters fail safely when credentials are missing

### Phase 4: Backtesting Engine MVP
Build the deterministic backtesting core.

Implement:
- `vectorbt`-based backtest runner
- strategy input schema
- basic strategy templates, such as moving-average crossover and RSI threshold
- train/test split support
- out-of-sample metrics as the primary reported result
- metrics: CAGR, Sharpe, max drawdown, win rate, total return, number of trades
- Celery task for async backtest execution
- API endpoints to submit and read backtest runs

Hard rule:
- no `backtesting.py`
- no LLM calls inside the backtest execution path

Test before moving on:
- known fixture strategy produces stable expected metrics
- train/test split is enforced
- invalid strategy parameters fail validation
- Celery backtest task completes and stores results
- API integration test covers submit → run → result

### Phase 5: Mockable AI Router
Add AI architecture without relying on paid/live providers yet.

Implement:
- `LLMProvider` interface
- `LLMRouter` with task-based routing
- mock providers for Qwen, DeepSeek, GLM, and local/open-source fallback routes
- retry/backoff wrapper for provider calls
- fallback routing behavior
- structured prompt/response schemas
- AI logs stored in PostgreSQL

Initial routing map:
- intent parsing: Qwen route
- market summary: Qwen route
- strategy reasoning: DeepSeek route
- logical/risk validation: GLM route
- backtest interpretation: DeepSeek route
- user-facing report: Qwen or DeepSeek route
- orchestration: local/open-source route

Test before moving on:
- router selects expected provider per task
- retry logic works with simulated transient failures
- fallback provider is used after retry exhaustion
- malformed provider output fails safely
- no AI route can trigger broker execution

### Phase 6: Strategy Research Workflow
Connect user intent, AI strategy proposal, backtesting, and interpretation.

Implement:
- API workflow: research request → strategy proposal → backtest → report
- mock AI-generated strategy definitions
- validation gate before any strategy reaches backtesting
- generated report based on out-of-sample results
- frontend workflow for entering a research request
- frontend results page with metrics, chart, and report

Test before moving on:
- full workflow works using mock AI and fixture data
- rejected/invalid AI strategy never runs
- report clearly distinguishes in-sample and out-of-sample results
- frontend handles loading, error, empty, and completed states

### Phase 7: News And Sentiment Adapter Skeleton
Add current-events grounding architecture without making it critical path yet.

Implement:
- `NewsProvider` interface
- RSS/provider placeholder adapters
- article normalization schema
- summarized news context object passed into AI prompts
- mock news provider for tests

For India equities, preferred future sources:
- MoneyControl RSS
- ET Markets RSS
- NSE/BSE official feeds where available
- Tickertape or Trendlyne if paid access is chosen later

Test before moving on:
- mock news provider returns normalized articles
- duplicated articles are handled
- AI prompts receive only fetched/summarized news context
- system never asks an LLM to recall current news from training data

### Phase 8: Broker Abstraction Skeleton
Prepare for paper/live trading later, but do not enable real execution.

Implement:
- `BrokerAdapter` abstract interface with:
  - `place_order`
  - `cancel_order`
  - `get_positions`
  - `get_holdings`
- `get_live_quote`
- `get_historical_data`
- FYERS broker/data adapter stub
- Angel One SmartAPI broker/data adapter stub
- fake broker adapter for tests
- execution feature flag disabled by default

Test before moving on:
- adapter contract tests pass against fake broker
- execution endpoints are unavailable or disabled
- no AI workflow can call `place_order`
- feature flag prevents accidental live trading behavior

### Phase 9: Observability And Safety
Add operational visibility before beta-style testing.

Implement:
- structured backend logging
- request IDs
- Celery task logs
- error tracking hook for frontend and backend
- audit log for AI strategy generation and backtest runs
- clear disclaimers that results are research/backtesting only

Test before moving on:
- failed backtests produce useful logs
- AI/provider failures are traceable
- frontend displays recoverable error states
- audit log records strategy source, data range, and metrics

### Phase 10: Paper Trading Follow-Up
Only start after the research/backtest MVP is stable.

Implement later:
- deterministic signal engine
- simulated order book
- fake broker execution
- paper positions
- paper P&L
- market-hours scheduler
- Oracle Cloud deployment target for scheduled paper-trading jobs
- AWS deployment path for later scale/latency work
- no LLM in execution loop

Acceptance gate before this phase:
- backtesting MVP is reliable
- broker abstraction is tested
- compliance review plan exists
- real execution remains disabled

## Public Interfaces To Add
Backend APIs:
- `GET /health`
- `GET /instruments`
- `GET /market-data/candles`
- `POST /backtests`
- `GET /backtests/{id}`
- `POST /research/strategy`
- `GET /research/runs/{id}`

Core backend interfaces:
- `MarketDataAdapter`
- `CloudJobScheduler`
- `LLMProvider`
- `LLMRouter`
- `NewsProvider`
- `BrokerAdapter`

Frontend screens:
- system status page
- instrument/data explorer
- strategy research form
- backtest result page
- AI report view

## Test Plan
Run tests after every phase, not only at the end.

Minimum test layers:
- unit tests for schemas, adapters, routing, and metrics
- integration tests for database repositories and API endpoints
- Celery task tests for async backtest runs
- frontend component tests for key states
- end-to-end smoke test for research request → backtest → report

Required acceptance scenarios:
- fixture India equity data can be imported and queried
- FYERS/Angel historical data can be imported when credentials are configured
- a basic strategy can be backtested reproducibly
- out-of-sample metrics are shown as primary metrics
- mock AI can propose a strategy but cannot bypass validation
- provider retry and fallback behavior works
- broker execution is impossible in MVP

## Assumptions And Defaults
- First MVP is research + backtesting only.
- Market focus is India equities.
- Historical data uses fixture/CSV adapter first, then FYERS for equity historical data, then Angel One SmartAPI as fallback.
- Upstox remains a later candidate for F&O data if/when that product surface is added.
- LLM providers are mockable first; real Qwen, DeepSeek, GLM, and local/open-source credentials are added after core workflow tests pass.
- OpenAI is not placed on the critical path for MVP.
- Oracle Cloud is the first deployment target; AWS is the later production/scale option.
- `vectorbt` is the only backtesting engine.
- PostgreSQL is used for MVP, with schema choices that keep future TimescaleDB migration easy.
- SEBI/legal review is required before any real-money/live-order feature.
