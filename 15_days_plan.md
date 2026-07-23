# 15-Day MVP Plan — Current Status And Next Work

This plan is updated against the current repository. The MVP goal is a safe India-equities workflow:

`real FYERS data → LLM market analysis → 2-3 strategy proposals → compare and approve one → realistic backtest → paper trading`

Live trading is not part of this MVP. Oracle Cloud scheduling and deployment come after this local paper-trading loop is reliable.

Status: `[x]` completed, `[~]` partially completed, `[ ]` pending.

## Completed foundation

### Day 1: Project foundation — [x]

- FastAPI backend and Next.js frontend monorepo
- Docker Compose for PostgreSQL and Redis
- Environment configuration and development scripts
- Health endpoint and local startup workflow

### Day 2: Backend core — [x]

- FastAPI settings and structured logging
- Request ID middleware
- PostgreSQL and Redis dependency checks
- Backend test framework

### Day 3: Database models and migrations — [x]

- Instruments and OHLCV candles
- Strategy definitions
- Backtest runs and results
- Research runs and AI request logs
- Alembic migrations and model tests

### Day 4: Market-data adapter layer — [x]

- Market-data adapter contract
- Deterministic CSV fixture provider
- NSE Bhavcopy provider
- FYERS historical/quote adapter
- Safe provider errors when credentials are missing or invalid

### Day 5: Market-data API and explorer — [x]

- Instrument and candle API endpoints
- Provider selection
- FYERS-backed market dashboard
- Full stock and index instrument explorer
- OHLCV table, price chart, volume chart, and instrument metrics

### Day 6: Backtesting core — [x]

- Moving-average crossover strategy schema
- Deterministic backtest runner boundary
- Train/test split
- Out-of-sample metrics
- Equity curve and trade output
- Validation for invalid parameters and insufficient data

### Day 7: Backtesting API — [x]

- `POST /backtests`
- `GET /backtests/{id}`
- Strategy, run, and result persistence
- Stored status and failure messages

### Day 8: Async backtest jobs — [x]

- Celery and Redis integration
- Queued → running → completed/failed lifecycle
- Worker task for fixture and FYERS data providers

### Day 9: Backtest frontend — [x]

- Strategy form
- Symbol/date/provider inputs
- Backtest polling
- Metrics and result states
- Equity curve/trade result presentation

### Day 10: LLM router skeleton — [x]

- Provider-neutral LLM interface
- Task routing, retries, and fallbacks
- Mock Qwen, DeepSeek, GLM, reasoning, report, and local routes
- No broker execution access from the AI layer

The routing architecture is complete, but the model adapters are still mocked.

### Day 11: AI strategy research API — [x]

- Strategy research request endpoint
- Research-run persistence
- OpenRouter-backed strategy proposal with mock fallback
- Validation gate before backtest creation
- AI request/response logging

Completed in the first Day 11 slice:

- Research requests now fetch the selected provider's candle history before calling the LLM.
- Bounded market context includes period return, high/low, average volume, volatility, and recent candles.
- The provider, symbol, timeframe, and date window are included in the LLM context and persisted prompt.
- Missing market data rejects the research run instead of producing an ungrounded strategy.

Completed:

- One OpenRouter OpenAI-compatible adapter for all model roles.
- Configurable OpenRouter key, endpoint, model names, timeout, and auto/mock mode.
- Real providers are selected automatically when the OpenRouter key is configured.
- Role-specific free models are configured for intent, strategy reasoning, risk checks,
  backtest interpretation, reports, and fallback routing.
- Structured JSON model responses are parsed and passed through the existing validation gate.
- Provider failures still use the safe router fallback behavior.

### Day 12: Research frontend workflow — [x]

- Research prompt UI
- Strategy proposal preview
- Approval and backtest flow
- Research/backtest status and result display

Completed:

- UI works with real model output through the same research endpoint.
- Research results display the provider/model used for the proposal.
- Approval remains required before a backtest is submitted.
- Real model keys are configured through `.env`; the default `auto` mode keeps local development safe when keys are absent.

### News and sentiment grounding — [x]

- Added a normalized RSS news-provider interface.
- Added configurable `GET /news` endpoint with symbol/date filtering.
- Added transparent lexicon-based article sentiment scoring.
- Added average and dominant sentiment summaries.
- Included bounded news articles and sentiment context in LLM research prompts.
- News failures remain non-blocking for research, while market-data failures still reject ungrounded research.

## Remaining MVP work

### Day 13: LLM strategy research on real FYERS data — [ ]

Make the existing research workflow useful with real market context and open-source models.

- Add a market-analysis context builder for FYERS candles, quotes, volume, returns, volatility, drawdown, and trend features.
- Pass bounded, structured historical data to the LLM instead of an unbounded raw candle dump.
- Integrate open-source model adapters for Qwen, GLM, and DeepSeek through configurable local or hosted endpoints.
- Route tasks intentionally: Qwen for intent/summary, DeepSeek for strategy reasoning, GLM for logical/risk validation.
- Require structured JSON strategy proposals with schema validation and safe parameter limits.
- Generate 2-3 competing strategy candidates instead of a single proposal.
- Rank the candidates by risk, return potential, data fit, simplicity, and validation confidence.
- Compare candidate assumptions, expected weaknesses, and rejected alternatives before the user selects one.
- Include the data window, provider, timeframe, and computed evidence in every proposal.
- Show a plain-language explanation, assumptions, risks, and rejected alternatives before execution.
- Save the model, prompt version, data window, strategy proposal, and validation result for reproducibility.

Done when:

- A user can ask for a strategy in natural language and receive 2-3 FYERS-grounded proposals.
- Each proposal is validated before it can reach the backtest API.
- The user can compare candidates and choose one strategy to continue with.
- The system can switch between Qwen, GLM, DeepSeek, and a local fallback without changing the research API.
- No LLM can place orders or bypass strategy/risk validation.

### Day 14: LLM proposal and real-data backtesting — [~]

Turn the existing backtest path into a dependable strategy evaluation workflow.

- Confirm FYERS candle availability and date-range limits per symbol.
- Let the user approve or revise the LLM proposal before backtesting.
- Add data-quality checks for gaps, duplicate candles, invalid prices, and missing volume.
- Make fees, slippage, position sizing, and initial capital explicit inputs.
- Support the first additional validated strategy template beyond moving-average crossover.
- Expand beyond the current `moving_average_crossover`-only engine with validated templates such as RSI, breakout, mean reversion, VWAP, volatility filters, volume confirmation, stop-loss, and take-profit rules.
- Add a strategy comparison view that shows risk/return, drawdown, trade count, win rate, assumptions, and data-quality warnings side by side.
- Improve result charts for equity curve, drawdown, trades, and benchmark comparison.
- Add tests using both deterministic fixtures and mocked FYERS responses.
- Add tests for malformed model output, provider timeout, fallback routing, and stale data.

Completed in the current slice:

- Added explicit execution-cost inputs for backtests: fees, slippage, position sizing, initial cash, and train split.
- Added an RSI mean-reversion strategy template alongside moving-average crossover.
- Added data-quality reporting for duplicate timestamps, candle gaps, missing/zero volume, and invalid OHLC consistency.
- Added benchmark return and drawdown values to backtest results.
- Added worker/API support for the new strategy schema and minimum-candle validation.
- Added deterministic tests for RSI, execution costs, data quality, FYERS/fixture worker paths, and research fallback behavior.

Done when:

- An approved LLM strategy runs on real FYERS data through the worker.
- The backtest engine supports at least one additional strategy type beyond moving-average crossover.
- Fees, slippage, position sizing, benchmark comparison, and data-quality checks are visible in the result.
- Results clearly separate in-sample and out-of-sample performance.
- A failed provider/data request produces a useful, persisted error.

### Day 15: Paper-trading MVP — [~]

Create a simulated execution layer with the same boundaries a future broker adapter will use.

- Define broker/order/position interfaces.
- Add a fake paper broker using current and candle data.
- Support market buy/sell orders, order status, positions, cash, and portfolio equity.
- Add a paper-trading account and strategy-run model.
- Add risk guards: max position size, available cash, duplicate-order protection, and kill switch.
- Add a paper-trading dashboard with orders, positions, P&L, and activity history.
- Allow a completed backtest strategy to be started in paper mode.
- Keep live order endpoints disabled by default.

Completed in the current slice:

- Added persistent paper account, order, position, and strategy-run models.
- Added Alembic migration for paper-trading state.
- Added paper-only API endpoints for account creation, account inspection, market buy/sell simulation, and starting a paper strategy from a completed backtest.
- Added paper risk guards for kill switch, available cash, insufficient position quantity, completed-backtest-only strategy starts, and duplicate active strategy runs.
- Paper orders are simulated from fixture/database/FYERS market data and do not call any live broker order API.
- Added tests for filled paper orders, rejected orders, persisted positions/cash, and completed-backtest strategy startup.

Done when:

- A user can start a strategy in paper mode, generate simulated orders, and inspect the resulting portfolio.
- Restarting the worker does not lose orders, positions, or account state.
- No code path can submit a real FYERS order.

## Future Goal: Python Bot, Cloud Deployment, And Scheduling

This is deliberately after the local paper-trading MVP, not part of the first 15-day completion gate. The current app has Docker and Celery foundations, but it does not yet have a user-facing generated Python bot, scheduler UI, cloud deployment packaging, runbook, market-hours scheduler, or Oracle/AWS deployment workflow.

### Phase 1: Cloud-ready packaging

- Docker images for web, API, Celery worker, and scheduler
- Production environment/secrets configuration
- Database migration command in deployment
- Health checks and structured application logs
- Deployment/runbook documentation for Oracle Cloud first, with AWS as a later option

### Phase 2: Generated Python bot and scheduled paper strategies

- Generate a reviewable Python strategy runner from an approved backtest/paper strategy.
- Keep generated scripts research/paper-only until live trading is separately reviewed.
- Add scheduler UI for selecting symbols, strategy, frequency, and market-session rules.
- Add job history, last-run status, failure reason, and manual pause/resume controls.

### Phase 3: Scheduled paper strategies on Oracle Cloud or AWS

- Oracle Cloud VM or Always Free compute deployment
- AWS deployment path after Oracle Cloud is working and stable
- Managed or hosted PostgreSQL/Redis decision
- Celery Beat or a dedicated scheduler for market-session jobs
- Market-hours calendar for NSE
- Scheduled data refresh and paper-strategy evaluation
- Retry, idempotency, and job-locking rules

### Phase 4: Operations and safety

- Monitoring and alerts for failed jobs and stale data
- Persistent audit log for signals, orders, and portfolio changes
- Backup and restore procedure
- Manual kill switch and strategy pause controls
- Deployment/runbook documentation

Live trading should only be considered after paper trading has been stable, audited, and separately reviewed.

## Current MVP completion definition

The MVP is complete when this flow works end to end:

1. Select a real FYERS instrument and date range.
2. Ask the LLM research workflow to analyze the market and history.
3. Review and approve a structured, risk-validated strategy proposal.
4. Run the proposal on real data in a background backtest.
5. Review out-of-sample metrics, equity curve, drawdown, and trades.
6. Start the approved strategy in paper mode.
7. Observe simulated orders, positions, cash, and P&L.

## Working rule

Every implementation slice should finish with:

- `bun run typecheck`
- `bun run build`
- relevant API tests
- local startup verification with `bun run dev:all`
- no real trading enabled
- documentation updated when behavior changes
