const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance();
const fetch = require('node-fetch');

const SECTOR_MAP = {
  'Technology': 'Information Technology',
  'Financial Services': 'Financials',
  'Healthcare': 'Health Care',
  'Communication Services': 'Communication Services',
  'Consumer Cyclical': 'Consumer Discretionary',
  'Consumer Defensive': 'Consumer Staples',
  'Basic Materials': 'Materials',
  'Industrials': 'Industrials',
  'Energy': 'Energy',
  'Utilities': 'Utilities',
  'Real Estate': 'Real Estate',
};

function normalizeSector(raw) {
  if (!raw) return null;
  return SECTOR_MAP[raw] || raw;
}

function toNumber(val) {
  if (val == null) return null;
  if (typeof val === 'object' && 'raw' in val) return val.raw;
  return typeof val === 'number' ? val : null;
}

// GET /api/tickers/screener  — most-active stocks sorted by trailing P/E desc
router.get('/screener', async (req, res) => {
  try {
    const url = 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=most_actives&count=100&formatted=false&lang=en-US&region=US';
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });
    const json = await r.json();
    const quotes = json?.finance?.result?.[0]?.quotes || [];
    const stocks = quotes
      .map((q) => ({
        symbol: q.symbol,
        companyName: q.shortName || q.longName || q.symbol,
        pe: typeof q.trailingPE === 'number' ? q.trailingPE : null,
        sector: q.sector || null,
      }))
      .filter((s) => s.pe != null && s.pe > 0 && s.pe < 1000)
      .sort((a, b) => b.pe - a.pe);
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tickers
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('tickers')
    .select('*')
    .order('gics_sector', { ascending: true })
    .order('ticker', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/tickers/:ticker
router.get('/:ticker([A-Z0-9.^-]+)', async (req, res) => {
  const { data, error } = await supabase
    .from('tickers')
    .select('*')
    .eq('ticker', req.params.ticker.toUpperCase())
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'not found' });
  res.json(data);
});

// GET /api/tickers/:ticker/enrich
router.get('/:ticker([A-Z0-9.^-]+)/enrich', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  const record = {
    ticker,
    company_name: null,
    gics_sector: null,
    gics_industry: null,
    market_cap: null,
    forward_pe: null,
    last_price: null,
    beta: null,
    next_earnings_date: null,
    last_updated: new Date().toISOString(),
  };

  // Attempt Yahoo Finance — non-fatal if it fails
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await yf.quoteSummary(ticker, {
        modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics', 'calendarEvents', 'price'],
      });
      const profile = result.assetProfile || {};
      const summary = result.summaryDetail || {};
      const stats = result.defaultKeyStatistics || {};
      const calendar = result.calendarEvents || {};
      const price = result.price || {};

      record.company_name = profile.longName || null;
      record.gics_sector = normalizeSector(profile.sector);
      record.gics_industry = profile.industry || null;
      record.market_cap = toNumber(summary.marketCap);
      record.forward_pe = toNumber(stats.forwardPE);
      record.last_price = toNumber(price.regularMarketPrice);
      record.beta = toNumber(summary.beta);

      // next earnings date — calendarEvents.earnings.earningsDate is an array
      const earningsDates = calendar.earnings?.earningsDate;
      if (Array.isArray(earningsDates) && earningsDates.length > 0) {
        const d = earningsDates[0];
        record.next_earnings_date = d instanceof Date ? d.toISOString().slice(0, 10)
          : typeof d === 'string' ? d.slice(0, 10) : null;
      }
      break;
    } catch (err) {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      console.warn(`Yahoo Finance enrichment failed for ${ticker}:`, err.message);
    }
  }

  const { data, error } = await supabase
    .from('tickers')
    .upsert(record, { onConflict: 'ticker' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/tickers/:ticker — update stance
router.patch('/:ticker([A-Z0-9.^-]+)', async (req, res) => {
  const { stance } = req.body;
  const { data, error } = await supabase
    .from('tickers')
    .update({ stance: stance ?? null })
    .eq('ticker', req.params.ticker.toUpperCase())
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/tickers/:ticker — remove from watchlist
router.delete('/:ticker([A-Z0-9.^-]+)', async (req, res) => {
  const { error } = await supabase
    .from('tickers')
    .delete()
    .eq('ticker', req.params.ticker.toUpperCase());
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
