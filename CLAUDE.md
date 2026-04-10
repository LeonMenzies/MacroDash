# MacroDash / Trading Research Hub — Claude Code Context

## What This Repo Is

Originally MacroDash — a customisable macro data dashboard.
**Now being rebuilt as a Trading Research Hub** for a small L/S equity options desk (2 users).

---

## Current Stack (MacroDash — do not break)

| Layer | Tech |
|---|---|
| Frontend | React 18 (Create React App), TypeScript, MUI v6, Recoil, Plotly.js |
| Backend | Flask 3, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-SocketIO |
| Database | MySQL 8 |
| State | Recoil + recoil-persist |
| Real-time | Socket.IO |

**Ports:** Frontend → 4000, Backend → 4001

**API base:** All backend routes are prefixed `/api/`. Frontend uses `REACT_APP_URL_BASE` env var (set to `/api` in Docker; full URL like `http://host:4001/api` in direct dev).

**Auth:** JWT stored in HTTP-only cookies. `withCredentials: true` on all axios requests.

---

## Running Locally with Docker

```bash
cp .env.example .env
# Edit .env with real values
docker compose up --build
```

Frontend: http://localhost:4000
Backend API: http://localhost:4001

---

## Target Stack (Trading Research Hub — build this next)

| Layer | Tech |
|---|---|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS + shadcn/ui |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) — Claude Sonnet 4 (`claude-sonnet-4-20250514`) |
| File parsing | mammoth (docx) + pdf-parse (pdf) — server-side only |
| State | Zustand |
| Storage | localStorage + JSON (no DB in v1) |
| Charts | Recharts |
| Free data APIs | FRED API, Trading Economics (free tier) |

**Design:** Dark terminal-meets-Bloomberg. Background `#0a0a0f`, text `#e8e8e0`, bull green `#00d084`, bear red `#ff4444`, data blue `#4a9eff`. Monospace (`Geist Mono`) for tickers/numbers, sans-serif (`Geist Sans`) for prose. Dense tables over cards.

---

## Build Plan — Four Stages

| Stage | Module | Status |
|---|---|---|
| 1 | Exec Summary Engine | Next |
| 2 | Catalyst Brain (4 epics) | Core product |
| 3 | Macro Dashboard | High value |
| 4 | Portfolio Tracker | Later |

### Stage 1 — Exec Summary Engine
- Route: `/exec-summary`
- Upload `.docx`/`.pdf` → parse server-side → Claude JSON summary → render + export markdown
- Model: `claude-sonnet-4-20250514`, max_tokens: 2000
- Components: `UploadZone`, `SummaryCard`, `ScenarioTable`, `ExportButton`

### Stage 2 — Catalyst Brain
- Routes: `/catalyst-brain`, `/catalyst-brain/[ticker]`
- 4 parallel API calls per ticker (4 tabs):
  - **Epic 1 Latent** — last 6 months idiosyncratic events, price reactions, estimate revisions
  - **Epic 2 Definitive** — hard-date calendar, earnings history, implied vs actual move
  - **Epic 3 Horizon** — soft-date pipeline, CONFIRMED/EXPECTED/RUMORED confidence scoring
  - **Epic 4 Macro Overlay** — ticker-specific macro sensitivities + Market View toggle
- All Claude calls use `web_search` tool

### Stage 3 — Macro Dashboard
- FRED API integration (free key at fred.stlouisfed.org)
- Key series: STLFSI4, UNRATE, CPIAUCSL, DGS10, BAMLH0A0HYM2, FEDFUNDS
- Yield curve chart (Recharts), paste-and-summarise macro regime

### Stage 4 — Portfolio Tracker
- Manual position entry, options fields (strike/expiry/premium)
- Expiry countdown, P&L display, thesis tagging

---

## Key Technical Rules

- All Anthropic API calls are **server-side only** (Next.js API routes / Route Handlers)
- `pdf-parse` and `mammoth` are **never imported in `'use client'` components**
- Use `Promise.all()` for the 4 parallel Catalyst Brain API calls
- Always wrap `JSON.parse()` in try/catch; fall back to raw text on failure
- Zustand catalyst store: cache per ticker, invalidate after 30 minutes
- Set `next.config.ts` body size limit to 10MB for PDF uploads
- Use `mammoth.extractRawText({ buffer })`, not `convertToHtml`

---

## Environment Variables (Trading Research Hub)

```bash
ANTHROPIC_API_KEY=sk-ant-...
FRED_API_KEY=...
# Future:
# CAPITAL_IQ_API_KEY=
# POLYGON_API_KEY=
# IEX_CLOUD_KEY=
```

---

## Users & Context

- 2 users: small L/S equity options desk
- Trading horizon: 1–4 months
- Watchlist: 5–20 names (RF, CCL, EPAM, CENX are the test tickers)
- No auth required in v1 (personal tool)

---

*Plan v2.0 — April 2026*
