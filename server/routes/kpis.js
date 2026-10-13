const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const router = express.Router();
const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance();

function sanitizeJsonStrings(s) {
  let inString = false, escaped = false, result = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\') { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString && (ch === '\n' || ch === '\r')) { result += '\\n'; continue; }
    if (inString && ch === '\t') { result += '\\t'; continue; }
    result += ch;
  }
  return result;
}

function tryParseJson(s) {
  try { return JSON.parse(s); } catch {}
  try {
    let depth = 0, start = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '{') { if (depth === 0) start = i; depth++; }
      else if (s[i] === '}') { depth--; if (depth === 0 && start !== -1) return JSON.parse(s.slice(start, i + 1)); }
    }
  } catch {}
  try {
    let inStr = false, esc = false;
    const stack = [];
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (esc) { esc = false; continue; }
      if (c === '\\' && inStr) { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') stack.push('}');
      else if (c === '[') stack.push(']');
      else if (c === '}' || c === ']') stack.pop();
    }
    if (stack.length > 0) {
      const trimmed = s.replace(/,?\s*"[^"]*$/, '').replace(/,\s*$/, '');
      return JSON.parse(trimmed + stack.reverse().join(''));
    }
  } catch {}
  return null;
}

const MODEL_CONFIGS = {
  haiku:  { id: 'claude-haiku-4-5-20251001', maxTokens: 4096 },
  sonnet: { id: 'claude-sonnet-4-6',          maxTokens: 6000 },
  opus:   { id: 'claude-opus-4-7',             maxTokens: 6000 },
};

function fmtDollar(v) {
  if (v == null) return null;
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  return `${sign}$${(abs / 1e6).toFixed(0)}M`;
}

function toNum(v) {
  if (v == null) return null;
  if (typeof v === 'object' && 'raw' in v) return v.raw;
  return typeof v === 'number' ? v : null;
}

function fmtQuarter(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} '${String(d.getFullYear()).slice(2)}`;
}

function withQoQ(values) {
  return values.map((v, i) => ({
    ...v,
    qoq: i > 0 && values[i - 1].value != null && values[i - 1].value !== 0
      ? ((v.value - values[i - 1].value) / Math.abs(values[i - 1].value)) * 100
      : null,
  }));
}

router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const modelKey = MODEL_CONFIGS[req.query.model] ? req.query.model : 'haiku';
  const { id: modelId, maxTokens } = MODEL_CONFIGS[modelKey];

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function send(obj) { res.write(`data: ${JSON.stringify(obj)}\n\n`); }

  // ── Phase 1: Yahoo Finance quarterly financials ──────────────────────────────
  send({ type: 'status', message: 'Fetching quarterly financials...' });

  let financialKPIs = [];
  let ttmMetrics = null;
  try {
    const result = await yf.quoteSummary(ticker, {
      modules: ['incomeStatementHistoryQuarterly', 'earningsHistory', 'financialData', 'earningsTrend'],
    });

    // Quarterly trend KPIs (Yahoo caps at ~4 quarters for free tier)
    const income = (result.incomeStatementHistoryQuarterly?.incomeStatementHistory || [])
      .slice(0, 8).reverse();
    const earnings = (result.earningsHistory?.history || [])
      .slice(0, 8).reverse();

    const rev = withQoQ(income.map(s => ({ quarter: fmtQuarter(s.endDate), value: toNum(s.totalRevenue) })));
    const ni  = withQoQ(income.map(s => ({ quarter: fmtQuarter(s.endDate), value: toNum(s.netIncome) })));
    const eps = withQoQ(earnings.map(e => ({
      quarter: fmtQuarter(e.quarter),
      value: toNum(e.epsActual),
      estimate: toNum(e.epsEstimate),
      surprisePct: toNum(e.surprisePercent),
    })));

    // Append upcoming-quarter estimate from earningsTrend as a forward bar
    const fwdTrend = (result.earningsTrend?.trend || []).find(t => t.period === '0q');
    if (fwdTrend?.endDate) {
      const fwdQ = fmtQuarter(fwdTrend.endDate);
      const revEst  = fwdTrend.revenueEstimate?.avg != null ? toNum(fwdTrend.revenueEstimate.avg) : null;
      const epsEst  = fwdTrend.earningsEstimate?.avg != null ? toNum(fwdTrend.earningsEstimate.avg) : null;

      if (rev.length === 0 || rev[rev.length - 1].quarter !== fwdQ) {
        if (revEst != null) rev.push({ quarter: fwdQ, value: null, estimate: revEst, qoq: null, isForward: true });
      }
      if (eps.length === 0 || eps[eps.length - 1].quarter !== fwdQ) {
        if (epsEst != null) eps.push({ quarter: fwdQ, value: null, estimate: epsEst, qoq: null, isForward: true });
      }
    }

    // Only include a quarterly KPI if ≥2 quarters have real (non-zero, non-null) data
    const hasRealData = (vals) => vals.filter(v => v.value != null && v.value !== 0).length >= 2;

    const candidates = [
      { name: 'Revenue',    unit: 'dollar', values: rev, higherIsBetter: true },
      { name: 'Net Income', unit: 'dollar', values: ni,  higherIsBetter: true },
      { name: 'EPS',        unit: 'eps',    values: eps, higherIsBetter: true },
    ];
    financialKPIs = candidates.filter(k => hasRealData(k.values));

    // TTM snapshot from financialData (margins, FCF, gross profit etc.)
    const fd = result.financialData || {};
    ttmMetrics = [
      { label: 'Gross Margin',    value: fd.grossMargins != null ? `${(fd.grossMargins * 100).toFixed(1)}%` : null },
      { label: 'Operating Margin',value: fd.operatingMargins != null ? `${(fd.operatingMargins * 100).toFixed(1)}%` : null },
      { label: 'Profit Margin',   value: fd.profitMargins != null ? `${(fd.profitMargins * 100).toFixed(1)}%` : null },
      { label: 'Revenue Growth',  value: fd.revenueGrowth != null ? `${(fd.revenueGrowth * 100).toFixed(1)}%` : null },
      { label: 'Earnings Growth', value: fd.earningsGrowth != null ? `${(fd.earningsGrowth * 100).toFixed(1)}%` : null },
      { label: 'Free Cash Flow',  value: fd.freeCashflow != null ? fmtDollar(fd.freeCashflow) : null },
      { label: 'Op. Cash Flow',   value: fd.operatingCashflow != null ? fmtDollar(fd.operatingCashflow) : null },
      { label: 'EBITDA',          value: fd.ebitda != null ? fmtDollar(fd.ebitda) : null },
      { label: 'ROE',             value: fd.returnOnEquity != null ? `${(fd.returnOnEquity * 100).toFixed(1)}%` : null },
      { label: 'ROA',             value: fd.returnOnAssets != null ? `${(fd.returnOnAssets * 100).toFixed(1)}%` : null },
    ].filter(m => m.value != null);

    send({ type: 'status', message: `Got ${financialKPIs.length} quarterly KPIs + ${ttmMetrics.length} TTM metrics` });
  } catch (err) {
    console.warn('YF KPI fetch failed:', err.message);
    send({ type: 'status', message: 'Financial data unavailable, using AI search only...' });
  }

  // ── Phase 2: Claude web search for sector/business KPIs ──────────────────────
  send({ type: 'status', message: 'Scanning earnings transcripts...' });

  const client = new Anthropic({
    defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05,prompt-caching-2024-07-31' },
  });

  const prompt = `You are a sell-side analyst. For ${ticker}, search earnings call transcripts, investor presentations, and analyst reports from the last 12 months. Return ONLY this JSON (no prose outside it):
{"sectorKPIs":[{"name":"","why":"","values":[{"quarter":"Q1 '24","value":""}],"currentValue":"","trend":"improving|stable|declining|accelerating|decelerating","driverNote":"","source":""}],"businessKPIs":[{"name":"","values":[{"quarter":"","value":""}],"trend":"accelerating|decelerating|stable|declining","driverNote":"","managementQuote":"","source":""}],"analystFocus":"","managementGuidance":""}

Provide: (1) 3-5 sector/industry-specific KPIs investors track for ${ticker} (e.g. RevPAR for hotels, ARR/NRR for SaaS, LOE for energy) — for each include a 'values' array with the last 3-4 quarters of data (quarter like "Q1 '24", value as a raw numeric string like "85.40" or "75.2%" without any label prefix), plus currentValue for the most recent period, and why the metric matters; (2) 3-6 non-financial business KPIs management discusses in earnings calls — include last 4 quarters of actual values where findable; (3) 1-2 sentences on what analysts are most focused on for this name; (4) key forward KPI guidance from management. Keep driverNote and managementQuote to 1-2 sentences max.`;

  let fullText = '';
  let searchCount = 0;
  let inSearchBlock = false;
  let searchInputBuf = '';
  let sources = [];

  try {
    const stream = client.messages.stream({
      model: modelId,
      max_tokens: maxTokens,
      system: [{ type: 'text', text: 'You are a sell-side equity analyst. Return only valid JSON as specified.', cache_control: { type: 'ephemeral' } }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      messages: [{ role: 'user', content: prompt }],
    });

    stream.on('streamEvent', (event) => {
      if (event.type === 'content_block_start') {
        const block = event.content_block;
        if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
          for (const r of block.content) {
            if (r.type === 'web_search_result' && r.url) sources.push({ title: r.title || r.url, url: r.url });
          }
        }
        if (block.type === 'tool_use' && block.name === 'web_search') {
          searchCount++;
          inSearchBlock = true;
          searchInputBuf = '';
          send({ type: 'status', message: `Web search ${searchCount}/5...` });
        } else if (block.type === 'text') {
          inSearchBlock = false;
          send({ type: 'status', message: 'Compiling KPIs...' });
        }
      }
      if (event.type === 'content_block_delta' && inSearchBlock && event.delta?.type === 'input_json_delta') {
        searchInputBuf += event.delta.partial_json || '';
        try {
          const p = JSON.parse(searchInputBuf);
          if (p.query) send({ type: 'status', message: `Searching: "${p.query}"` });
        } catch {}
      }
      if (event.type === 'content_block_stop' && inSearchBlock) inSearchBlock = false;
    });

    stream.on('text', (delta) => { fullText += delta; });

    await stream.finalMessage();

    let aiData = {};
    try {
      const cleaned = fullText
        .replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, '$1')
        .replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
        .replace(/,(\s*[}\]])/g, '$1');
      const s = cleaned.indexOf('{');
      const e = cleaned.lastIndexOf('}');
      const slice = s !== -1 && e > s ? cleaned.slice(s, e + 1) : cleaned;
      aiData = tryParseJson(slice) || tryParseJson(sanitizeJsonStrings(slice)) || {};
    } catch { aiData = {}; }

    if (sources.length > 0) aiData._sources = sources;

    const data = { financialKPIs, ttmMetrics, ...aiData };
    send({ type: 'done', ticker, data });
    res.end();
  } catch (err) {
    console.error(err);
    send({ type: 'error', message: err.message });
    res.end();
  }
});

module.exports = router;
