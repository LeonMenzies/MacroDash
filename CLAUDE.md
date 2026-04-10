# MacroDash / Trading Research Hub — Claude Code Context

## What This Repo Is

A Trading Research Hub for a small L/S equity options desk (2 users).

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 (Vite), TypeScript, Recharts |
| Backend | Express (Node.js), `@anthropic-ai/sdk` |
| AI | Claude Sonnet 4 (`claude-sonnet-4-20250514`) |
| File parsing | mammoth (docx) + pdf-parse (pdf) — server-side only |
| Data | FRED API (free key) |
| Deployment | Docker Compose |

**Ports (Docker):** Frontend → 4002, Server → 4001

**API base:** All server routes prefixed `/api/`. Frontend uses `VITE_API_BASE` env var (set to `/api` in Docker; set to `http://localhost:4001/api` in direct dev).

---

## Running & Deploying

### Local dev (without Docker)
```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

### Docker (local or server)
```bash
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and FRED_API_KEY
docker compose up -d --build
```

Frontend: http://localhost:4002
Server API: http://localhost:4001

### Deploying changes to the server

After pushing to GitHub, SSH to the server and run:

```bash
ssh leon@172.234.196.74
cd ~/MacroDash          # adjust path if different
git pull origin master
docker compose up -d --build
```

The server runs all apps on a shared Docker host. MacroDash containers are `macrodash-frontend-1` (port 4002) and `macrodash-server-1` (port 4001).

To check logs:
```bash
docker logs macrodash-server-1 --tail 50
docker logs macrodash-frontend-1 --tail 20
```

---

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
FRED_API_KEY=...
CORS_ORIGIN=http://localhost:4000   # or the server's public URL
```

---

## Build Plan — Four Stages

| Stage | Module | Status |
|---|---|---|
| 1 | Exec Summary Engine | Done |
| 2 | Catalyst Brain (4 epics) | Done |
| 3 | Macro Dashboard | Done |
| 4 | Portfolio Tracker | Next |

### Stage 1 — Exec Summary Engine (`/exec-summary`)
- Upload `.docx`/`.pdf` → parse server-side → Claude JSON summary → render + export markdown

### Stage 2 — Catalyst Brain (`/catalyst-brain`, `/catalyst-brain/:ticker`)
- 4 tabs per ticker: Latent, Definitive, Horizon, Macro Overlay
- All Claude calls use `web_search` tool

### Stage 3 — Macro Dashboard (`/`)
- FRED indicators: STLFSI4, UNRATE, CPIAUCSL, DGS10, BAMLH0A0HYM2, FEDFUNDS
- Yield curve chart (Recharts), paste-and-summarise macro regime (Claude)

### Stage 4 — Portfolio Tracker
- Manual position entry, options fields (strike/expiry/premium)
- Expiry countdown, P&L display, thesis tagging

---

## Key Technical Rules

- All Anthropic API calls are **server-side only** (Express routes)
- `pdf-parse` and `mammoth` are never imported in React components
- Always wrap `JSON.parse()` in try/catch; fall back to raw text on failure
- FRED requests: use `Promise.allSettled` (not `Promise.all`) — FRED rate-limits burst requests

---

## Users & Context

- 2 users: small L/S equity options desk
- Trading horizon: 1–4 months
- Watchlist: 5–20 names (RF, CCL, EPAM, CENX are the test tickers)
- No auth required (personal tool)

---

*Updated April 2026*
