const express = require('express');
const router = express.Router();
const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance();
const Anthropic = require('@anthropic-ai/sdk');

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// In-memory cache for qualitative results — avoids re-running Claude on every page load
const qualCache = new Map(); // key: ticker → { data, ts }
const QUAL_TTL = 24 * 60 * 60 * 1000;

function toNum(val) {
  if (val == null) return null;
  if (typeof val === 'object' && 'raw' in val) return val.raw;
  return typeof val === 'number' ? val : null;
}

function fmtNum(val, decimals = 2, prefix = '', suffix = '') {
  if (val == null) return 'N/A';
  const f = parseFloat(val);
  if (isNaN(f)) return 'N/A';
  if (Math.abs(f) >= 1e12) return `${prefix}${(f / 1e12).toFixed(decimals)}T${suffix}`;
  if (Math.abs(f) >= 1e9) return `${prefix}${(f / 1e9).toFixed(decimals)}B${suffix}`;
  if (Math.abs(f) >= 1e6) return `${prefix}${(f / 1e6).toFixed(decimals)}M${suffix}`;
  return `${prefix}${f.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
}

function fmtPct(val) {
  if (val == null) return 'N/A';
  const f = parseFloat(val);
  if (isNaN(f)) return 'N/A';
  return `${(f * 100).toFixed(2)}%`;
}

function safe(val, decimals = 2) {
  if (val == null) return 'N/A';
  const f = parseFloat(val);
  return isNaN(f) ? String(val) : f.toFixed(decimals);
}

// GET /api/stock/:ticker/quote
router.get('/:ticker([A-Z0-9.^-]+)/quote', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    const result = await yf.quoteSummary(ticker, {
      modules: ['price', 'summaryDetail', 'financialData', 'defaultKeyStatistics', 'assetProfile'],
    });

    const p = result.price || {};
    const sd = result.summaryDetail || {};
    const fd = result.financialData || {};
    const ks = result.defaultKeyStatistics || {};
    const ap = result.assetProfile || {};

    const price = toNum(p.regularMarketPrice) || toNum(fd.currentPrice);
    const prevClose = toNum(p.regularMarketPreviousClose);
    const change = price != null && prevClose != null ? price - prevClose : null;
    const changePct = change != null && prevClose ? (change / prevClose) * 100 : null;

    const hi52 = toNum(sd.fiftyTwoWeekHigh);
    const lo52 = toNum(sd.fiftyTwoWeekLow);
    const week52Pos = hi52 && lo52 && price != null && hi52 !== lo52
      ? Math.round(((price - lo52) / (hi52 - lo52)) * 1000) / 10
      : null;

    const deRaw = toNum(fd.debtToEquity);

    const data = {
      ticker,
      name: p.longName || p.shortName || ap.longName || ticker,
      sector: ap.sector || 'N/A',
      industry: ap.industry || 'N/A',
      exchange: p.exchangeName || p.exchange || 'N/A',
      currency: p.currency || 'USD',
      website: ap.website || '',
      employees: fmtNum(ap.fullTimeEmployees, 0),

      price: fmtNum(price, 2, '$'),
      price_raw: price,
      prev_close_raw: prevClose,
      change: change != null ? (change >= 0 ? `+${fmtNum(change, 2, '$')}` : fmtNum(change, 2, '$')) : 'N/A',
      change_pct: changePct != null ? (changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`) : 'N/A',
      positive: change != null ? change >= 0 : true,

      pe_ratio: safe(toNum(sd.trailingPE)),
      pe_raw: toNum(sd.trailingPE),
      forward_pe: safe(toNum(ks.forwardPE) || toNum(sd.forwardPE)),
      peg_ratio: safe(toNum(ks.pegRatio)),
      pb_ratio: safe(toNum(ks.priceToBook)),
      ps_ratio: safe(toNum(sd.priceToSalesTrailing12Months)),
      ev_ebitda: safe(toNum(ks.enterpriseToEbitda)),
      ev: fmtNum(toNum(ks.enterpriseValue), 2, '$'),
      market_cap: fmtNum(toNum(p.marketCap) || toNum(sd.marketCap), 2, '$'),
      market_cap_raw: toNum(p.marketCap) || toNum(sd.marketCap),

      week_52_high: fmtNum(hi52, 2, '$'),
      week_52_high_raw: hi52,
      week_52_low: fmtNum(lo52, 2, '$'),
      week_52_low_raw: lo52,
      week52_pos: week52Pos,
      day_high: fmtNum(toNum(p.regularMarketDayHigh) || toNum(sd.dayHigh), 2, '$'),
      day_low: fmtNum(toNum(p.regularMarketDayLow) || toNum(sd.dayLow), 2, '$'),
      fifty_day_avg: fmtNum(toNum(sd.fiftyDayAverage), 2, '$'),
      fifty_day_avg_raw: toNum(sd.fiftyDayAverage),
      two_hundred_day_avg: fmtNum(toNum(sd.twoHundredDayAverage), 2, '$'),
      two_hundred_day_avg_raw: toNum(sd.twoHundredDayAverage),
      volume: fmtNum(toNum(p.regularMarketVolume) || toNum(sd.volume), 0),
      avg_volume: fmtNum(toNum(sd.averageVolume), 0),

      revenue: fmtNum(toNum(fd.totalRevenue), 2, '$'),
      revenue_raw: toNum(fd.totalRevenue),
      gross_profit: fmtNum(toNum(fd.grossProfits), 2, '$'),
      gross_profit_raw: toNum(fd.grossProfits),
      ebitda: fmtNum(toNum(fd.ebitda), 2, '$'),
      ebitda_raw: toNum(fd.ebitda),
      net_income: fmtNum(toNum(ks.netIncomeToCommon), 2, '$'),
      net_income_raw: toNum(ks.netIncomeToCommon),
      eps: fmtNum(toNum(ks.trailingEps), 2, '$'),
      forward_eps: fmtNum(toNum(ks.forwardEps), 2, '$'),
      total_cash: fmtNum(toNum(fd.totalCash), 2, '$'),
      total_cash_raw: toNum(fd.totalCash),
      total_debt: fmtNum(toNum(fd.totalDebt), 2, '$'),
      total_debt_raw: toNum(fd.totalDebt),
      free_cashflow: fmtNum(toNum(fd.freeCashflow), 2, '$'),
      de_ratio: deRaw != null ? (deRaw / 100).toFixed(2) : 'N/A',

      profit_margin: fmtPct(toNum(fd.profitMargins)),
      profit_margin_raw: toNum(fd.profitMargins),
      operating_margin: fmtPct(toNum(fd.operatingMargins)),
      operating_margin_raw: toNum(fd.operatingMargins),
      gross_margin: fmtPct(toNum(fd.grossMargins)),
      gross_margin_raw: toNum(fd.grossMargins),
      revenue_growth: fmtPct(toNum(fd.revenueGrowth)),
      revenue_growth_raw: toNum(fd.revenueGrowth),
      earnings_growth: fmtPct(toNum(fd.earningsGrowth)),
      earnings_growth_raw: toNum(fd.earningsGrowth),
      return_on_equity: fmtPct(toNum(fd.returnOnEquity)),
      return_on_equity_raw: toNum(fd.returnOnEquity),
      return_on_assets: fmtPct(toNum(fd.returnOnAssets)),

      dividend_yield: fmtPct(toNum(sd.dividendYield)),
      dividend_rate: fmtNum(toNum(sd.dividendRate), 2, '$'),
      payout_ratio: fmtPct(toNum(sd.payoutRatio)),
      shares_outstanding: fmtNum(toNum(ks.sharesOutstanding), 0),
      float_shares: fmtNum(toNum(ks.floatShares), 0),
      short_ratio: safe(toNum(ks.shortRatio)),
      short_pct_float: fmtPct(toNum(ks.shortPercentOfFloat)),
      short_pct_raw: toNum(ks.shortPercentOfFloat),
      beta: safe(toNum(sd.beta)),
      beta_raw: toNum(sd.beta),

      target_high: fmtNum(toNum(fd.targetHighPrice), 2, '$'),
      target_high_raw: toNum(fd.targetHighPrice),
      target_low: fmtNum(toNum(fd.targetLowPrice), 2, '$'),
      target_low_raw: toNum(fd.targetLowPrice),
      target_mean: fmtNum(toNum(fd.targetMeanPrice), 2, '$'),
      target_mean_raw: toNum(fd.targetMeanPrice),
      recommendation: (fd.recommendationKey || 'N/A').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      num_analysts: safe(toNum(fd.numberOfAnalystOpinions), 0),

      description: ap.longBusinessSummary || '',
    };

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stock/:ticker/history?period=6mo
router.get('/:ticker([A-Z0-9.^-]+)/history', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const period = req.query.period || '6mo';

  const daysMap = { '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730, '5y': 1825 };
  const days = daysMap[period] || 180;

  const period2 = new Date();
  const period1 = new Date();
  period1.setDate(period1.getDate() - days);

  try {
    const result = await yf.historical(ticker, {
      period1: period1.toISOString().split('T')[0],
      period2: period2.toISOString().split('T')[0],
      interval: '1d',
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'No history data' });
    }

    const dates = result.map((r) => r.date.toISOString().split('T')[0]);
    const closes = result.map((r) => Math.round(r.close * 100) / 100);
    const volumes = result.map((r) => Math.round(r.volume || 0));

    res.json({ dates, closes, volumes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stock/:ticker/qualitative?name=...&sector=...&industry=...&refresh=1
router.get('/:ticker([A-Z0-9.^-]+)/qualitative', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const { name = ticker, sector = '', industry = '', refresh } = req.query;

  // Return cached result if fresh and refresh not requested
  const cached = qualCache.get(ticker);
  if (cached && !refresh && Date.now() - cached.ts < QUAL_TTL) {
    return res.json({ ...cached.data, _cached: true });
  }

  const prompt = `You are a senior equity analyst. Analyze ${name} (${ticker}), a ${industry} company in the ${sector} sector.

Provide a concise but insightful analysis covering:
1. CATALYSTS (3-5 bullet points) — specific near/medium-term drivers that could push the stock higher. Be concrete.
2. HEADWINDS (3-5 bullet points) — specific risks or factors that could weigh on the stock. Be concrete.
3. QUALITATIVE MOAT (2-3 sentences) — what is their actual competitive advantage? Is it durable?
4. BULL CASE (2-3 sentences) — the optimistic scenario.
5. BEAR CASE (2-3 sentences) — the pessimistic scenario.

Return ONLY valid JSON with this exact structure, no markdown fences:
{"catalysts":["..."],"headwinds":["..."],"moat":"...","bull_case":"...","bear_case":"..."}`;

  try {
    const message = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = (message.content[0]?.text || '').trim();
    if (text.startsWith('```')) {
      text = text.split('```')[1] || '';
      if (text.startsWith('json')) text = text.slice(4);
    }
    const data = JSON.parse(text);
    qualCache.set(ticker, { data, ts: Date.now() });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
