const express = require('express');
const supabase = require('../supabase');
const yf = require('yahoo-finance2').default;

const router = express.Router();

router.get('/', async (req, res) => {
  const { ticker, epic, sector } = req.query;
  let query = supabase.from('catalyst_saves').select('*').order('saved_at', { ascending: false });
  if (ticker) query = query.ilike('ticker', ticker);
  if (epic) query = query.eq('epic', epic);
  if (sector) query = query.ilike('sector', sector);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Upsert on (ticker, epic) — auto-fetches Yahoo Finance metadata if not yet set
router.post('/', async (req, res) => {
  const { ticker, epic, data } = req.body;
  if (!ticker || !epic || !data) return res.status(400).json({ error: 'ticker, epic, and data are required' });

  const upperTicker = ticker.toUpperCase();

  // Check if metadata already exists for this ticker (any epic)
  const { data: existing } = await supabase
    .from('catalyst_saves')
    .select('sector, industry, market_cap')
    .eq('ticker', upperTicker)
    .not('sector', 'is', null)
    .limit(1)
    .maybeSingle();

  const upsertData = { ticker: upperTicker, epic, data, saved_at: new Date().toISOString() };

  if (!existing) {
    try {
      const result = await yf.quoteSummary(upperTicker, { modules: ['assetProfile', 'price'] });
      const profile = result.assetProfile || {};
      const price = result.price || {};
      const cap = price.marketCap;
      let market_cap = null;
      if (cap) {
        if (cap >= 10e9) market_cap = 'Large Cap';
        else if (cap >= 2e9) market_cap = 'Mid Cap';
        else if (cap >= 300e6) market_cap = 'Small Cap';
        else market_cap = 'Micro Cap';
      }
      if (profile.sector) upsertData.sector = profile.sector;
      if (profile.industry) upsertData.industry = profile.industry;
      if (market_cap) upsertData.market_cap = market_cap;
    } catch (e) {
      console.warn(`Yahoo Finance fetch failed for ${upperTicker}:`, e.message);
    }
  }

  const { data: row, error } = await supabase
    .from('catalyst_saves')
    .upsert(upsertData, { onConflict: 'ticker,epic', ignoreDuplicates: false })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(row);
});

// Update metadata only
router.patch('/:id', async (req, res) => {
  const { sector, industry, market_cap } = req.body;
  const { data, error } = await supabase
    .from('catalyst_saves')
    .update({ sector: sector ?? null, industry: industry ?? null, market_cap: market_cap ?? null })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error, count } = await supabase
    .from('catalyst_saves')
    .delete({ count: 'exact' })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  if (count === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

module.exports = router;
