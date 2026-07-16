# FinMatrix

A professional financial intelligence dashboard — Bloomberg Terminal meets The Matrix. Real-time market data, AI summaries, financial news, and economic calendar in a dense dark terminal interface.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port from env, proxied at `/api`)
- `pnpm --filter @workspace/finmatrix run dev` — Frontend dashboard (proxied at `/`)
- `pnpm run typecheck` — Full typecheck across all packages
- `pnpm run build` — Typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — Push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `OPENAI_API_KEY` — Enables AI-generated market summaries (falls back to rule-based)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Recharts, wouter, React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Market data: yahoo-finance2 v4 (requires `new YahooFinance()` instantiation)
- News: rss-parser (RSS feeds from Reuters, CNBC, CoinDesk, Yahoo Finance)
- Jobs: node-cron (market refresh every 5min, news every 10min, AI summaries at 08:00/22:00 UTC)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — Drizzle schema (tracked_assets, market_quotes, price_history, news_articles, news_sources, economic_events, dashboard_settings, ai_summaries)
- `artifacts/api-server/src/routes/` — API routes (market, news, calendar, ai, companies, admin)
- `artifacts/api-server/src/lib/` — Business logic (market-data, news-fetcher, ai-summary, scheduler)
- `artifacts/finmatrix/src/pages/` — Frontend pages (Dashboard, Market, SymbolDetail, News, Calendar, Admin)
- `artifacts/finmatrix/src/components/` — Shared components (Layout, Panel, Sparkline, TickerTape)

## Architecture decisions

- yahoo-finance2 v4 changed API: must use `new YahooFinance()` (not default export directly)
- `GET /market/history` uses query params for symbol (not path param) to avoid Orval TS2308 naming collision
- Background jobs run in-process via node-cron; no separate worker process needed
- AI summaries cached for 6 hours in DB; re-generated on demand if stale
- Rule-based AI summary fallback when OPENAI_API_KEY is not set

## Product

- **Main Dashboard** (`/`) — Live ticker tape, index cards with sparklines, full asset table, AI briefing, news feed, economic calendar
- **Market Terminal** (`/market`) — Tabbed browser: Indices, US Stocks, BIST, ETFs, Commodities, Crypto, Currencies
- **Company Detail** (`/market/:symbol`) — Full financials, interactive AreaChart with period selector, related news
- **News Hub** (`/news`) — Filterable news by category (auto-refreshed from RSS feeds)
- **Economic Calendar** (`/calendar`) — Upcoming events with importance levels and actual/forecast data
- **Admin Panel** (`/admin`) — CRUD for tracked assets, news sources, calendar events, and settings

## User preferences

_Populate as you build._

## Gotchas

- yahoo-finance2 v4 requires `new YahooFinance()` — do not use the default export directly
- `period2: new Date()` is required for `yahooFinance.historical()` in v4
- OpenAPI body schemas must use entity-shaped names (e.g. `TrackedAssetInput` not `CreateAdminAssetBody`) to avoid Orval TS2308 collisions
- Endpoints with BOTH path params AND query params cause Orval naming collisions — use query-only params for such endpoints

## Pointers

- See `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
