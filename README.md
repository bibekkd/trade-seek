# TradeSeek AI

AI-assisted research and backtesting platform for India equities.

TradeSeek AI lets a user explore market data, generate validated strategy ideas,
compare generated strategies, run historical backtests, and start research-only
paper-trading simulations. The project is intentionally limited to analysis,
backtesting, and paper trading. It does not place live broker orders.

## Hackathon Notes

This repository is built for local review. The backend is not deployed, so the
expected judging flow is:

1. Clone the repo.
2. Add `.env` values from `.env.example`.
3. Start PostgreSQL and Redis with Docker Compose.
4. Run the FastAPI backend, Celery worker, and Next.js frontend locally.
5. Open the Strategy Lab and generate/backtest strategies.

This is the safest option for the current app because the backend needs Redis,
PostgreSQL, a worker process, broker/data credentials, and private API keys.
Deploying only the frontend will not be enough: the UI calls the local API at
`NEXT_PUBLIC_API_BASE_URL`.

For judges, share a short demo video plus either:

- a private repo invite and a judge-specific `.env` sent through a secure channel, or
- instructions to run in mock/fixture mode without private credentials.

The repo includes `.env.example` only. Do not commit a real `.env`; it is already
ignored by `.gitignore`. If you share real credentials for review, use temporary
free-tier LLM keys and expect the FYERS access token to require regeneration.

## How Codex And GPT-5.6 Were Used

Codex and GPT-5.6 were used as AI engineering assistants throughout the project
to speed up implementation, review design choices, and handle complex full-stack
features. They helped plan the architecture across the Next.js frontend,
FastAPI backend, PostgreSQL schema, Celery worker, Redis queue, and FYERS market
data integration.

Key areas where Codex and GPT-5.6 helped:

- Designing the strategy research flow from prompt input to validated strategy
  candidates and backtest execution.
- Implementing typed backend APIs, Pydantic schemas, SQLAlchemy models, and
  database migrations for research runs, strategies, backtests, and paper
  trading state.
- Building the async backtest workflow with Celery and Redis so longer-running
  jobs do not block the API or frontend.
- Creating the AI strategy generation pipeline, including provider routing,
  structured outputs, validation, and deterministic mock fallbacks for local
  testing without paid API keys.
- Integrating FYERS historical market data while keeping fixture-backed testing
  available for judges and local development.
- Improving the frontend dashboard, Strategy Lab, history views, comparison
  flows, loading states, and error handling.
- Reviewing edge cases around missing credentials, expired FYERS tokens,
  degraded infrastructure health, and unavailable LLM providers.

All generated or AI-assisted code was reviewed, edited, and tested in the
project context before being included.

## Features

- Next.js dashboard for markets, charts, strategy research, backtesting, and paper trading.
- FastAPI backend with health checks and typed API schemas.
- PostgreSQL persistence for instruments, candles, research runs, strategy definitions,
  backtest runs, results, and paper-trading state.
- Redis + Celery worker for async backtest execution.
- AI strategy generation with OpenRouter/Groq/Mistral/Cerebras-compatible routing and
  deterministic mock fallback.
- FYERS historical market-data integration when credentials are configured.
- Fixture data mode for deterministic local testing without broker credentials.
- Validation gate before AI-generated strategies reach the backtest engine.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic, SQLAlchemy, Alembic
- Jobs: Celery + Redis
- Database: PostgreSQL
- Package/tools: Bun, npm workspaces, uv, Docker Compose

## Prerequisites

- Python 3.12+
- uv
- Node.js 20+
- Bun
- Docker Desktop or Docker Engine

Install `uv` and `bun` if needed:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
curl -fsSL https://bun.sh/install | bash
```

## Quick Start

```bash
git clone <your-private-repo-url>
cd algo-trading-project

cp .env.example .env
uv sync --project apps/api
bun install

docker compose up -d
bun run migrate:api
```

Start the backend API, Celery worker, and frontend in separate terminals:

```bash
bun run dev:api
```

```bash
bun run dev:worker
```

```bash
bun run dev:web
```

Open:

```text
Frontend: http://localhost:3000
API docs: http://localhost:8000/docs
Health:   http://localhost:8000/health
```

If port `3000` is already busy, Next.js will print the alternate local URL.

## One Command Dev Mode

You can also start everything together:

```bash
bun run dev
```

For hackathon judging, separate terminals are easier to debug because API,
worker, and web logs stay independent.

## Environment Setup

Copy `.env.example` to `.env` and fill only what you need.

### Required For Local Infrastructure

These defaults work with `docker-compose.yml`:

```bash
DATABASE_URL=postgresql://algo:algo@localhost:5432/algo_trading
REDIS_URL=redis://localhost:6379/0
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
LOG_LEVEL=INFO
```

### AI Provider Keys

The app works without AI keys by using deterministic mock providers. For a real
AI-generated strategy demo, configure at least one provider key:

```bash
LLM_MODE=auto
OPENROUTER_API_KEY=
GROQ_API_KEY=
MISTRAL_API_KEY=
CEREBRAS_API_KEY=
```

Recommended for the hackathon: use `OPENROUTER_API_KEY` first because this app
already routes several free/open models through OpenRouter. Add Groq, Mistral,
or Cerebras as fallbacks if you have keys. The provided reviewer keys, if any,
are intended for free-tier demo use and may hit provider rate limits during
checking.

How to get keys:

- OpenRouter: create an account, open the API keys page, create a key, and put it in `OPENROUTER_API_KEY`.
- Groq: create a key in the Groq Console and put it in `GROQ_API_KEY`.
- Mistral: create an API key in Mistral Studio/Admin and put it in `MISTRAL_API_KEY`.
- Cerebras: create a key in the Cerebras Inference Cloud Console and put it in `CEREBRAS_API_KEY`.

Security tip: create temporary hackathon/reviewer keys with low limits, then
revoke them after review. If these keys fail, set `LLM_MODE=mock` to continue
with deterministic local strategy proposals.

### FYERS Market Data

FYERS is needed for real NSE historical candles. Without FYERS credentials, use
fixture/database data for local smoke tests.

Important: `FYERS_ACCESS_TOKEN` is short-lived and commonly needs to be refreshed
daily. A token shared with reviewers may expire before or during checking. If
FYERS real-data pages fail with an auth/token error, regenerate the token using
the steps below and replace only `FYERS_ACCESS_TOKEN` in `.env`.

Add these values to `.env`:

```bash
FYERS_APP_ID=
FYERS_SECRET_ID=
FYERS_ACCESS_TOKEN=
FYERS_REDIRECT_URI=http://127.0.0.1:8000/fyers/callback
```

How to get FYERS values:

1. Create or log in to a FYERS account.
2. Open the FYERS API/My API dashboard.
3. Create an API app.
4. Copy the API/App ID into `FYERS_APP_ID`.
5. Copy the Secret ID into `FYERS_SECRET_ID`.
6. Make sure the redirect URI in FYERS matches `FYERS_REDIRECT_URI`.
7. Generate a login URL:

```bash
uv run python scripts/fyers_access_token.py
```

8. Open the printed URL, log in, and copy the redirected URL or `auth_code`.
9. Exchange it for an access token:

```bash
uv run python scripts/fyers_access_token.py --auth-code "<redirect-url-or-auth-code>"
```

10. Copy the printed `FYERS_ACCESS_TOKEN=...` line into `.env`.
11. Restart the API and worker after changing `.env`.

FYERS access tokens can expire daily. If real-data requests start failing,
regenerate `FYERS_ACCESS_TOKEN`; `FYERS_APP_ID` and `FYERS_SECRET_ID` usually
stay the same.

## Running The Main Demo

1. Start Docker, API, worker, and web.
2. Open `http://localhost:3000/strategy-backtest`.
3. Enter a strategy idea, choose a symbol and date range.
4. Click `Generate AI Strategies`.
5. Pick a generated strategy candidate.
6. Run a single-stock backtest or compare 2-3 stocks.
7. Reopen previous generated strategies from the history list and backtest them later.

If no AI keys are configured, generated strategies come from the mock provider.
If FYERS is not configured, prefer fixture-backed API checks or configure FYERS
before using the FYERS-heavy dashboard pages.

## Useful API Checks

Health:

```bash
curl http://localhost:8000/health
```

Fixture candles:

```bash
curl "http://localhost:8000/market-data/candles?provider=fixture&symbol=RELIANCE&exchange=NSE&timeframe=1d"
```

FYERS candles:

```bash
curl "http://localhost:8000/market-data/candles?provider=fyers&symbol=SBIN&exchange=NSE&timeframe=1d&start=2024-01-01&end=2024-03-31"
```

## Tests And Quality Checks

```bash
bun run test:api
bun run typecheck
bun run lint
```

Run backend tests directly:

```bash
uv run --project apps/api pytest
```

## Migrations

Upgrade:

```bash
bun run migrate:api
```

Rollback all local migrations:

```bash
bun run rollback:api
```

## Troubleshooting

- `Health is degraded`: check that `docker compose up -d` is running PostgreSQL and Redis.
- `Backtest stays queued`: start the Celery worker with `bun run dev:worker`.
- `FYERS_ACCESS_TOKEN missing`: fill FYERS envs or use fixture mode.
- `FYERS token expired`: regenerate `FYERS_ACCESS_TOKEN`; these tokens can need daily refresh.
- `No FYERS candles found`: refresh the FYERS token, check the symbol/date range, or use a wider date range.
- `LLM provider failed`: add another provider key or set `LLM_MODE=mock` for deterministic local proposals.
- Frontend cannot reach backend: confirm `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` and restart the web server.

## Backend Deployment Status

The backend is currently local-only. For the hackathon, that is acceptable if the
README, demo video, and `.env` guide are clear.

If deployment becomes necessary, deploy all backend pieces together:

- FastAPI API service
- Celery worker service
- PostgreSQL database
- Redis broker/result backend
- environment variables/secrets

Frontend-only deployment will show the UI but strategy generation and backtests
will fail unless `NEXT_PUBLIC_API_BASE_URL` points to a reachable backend.

## Safety

This app is for research, backtesting, and paper trading only. It does not submit
live orders. AI-generated strategies are validated before backtesting, and broker
credentials are used only for market data in the current MVP.
