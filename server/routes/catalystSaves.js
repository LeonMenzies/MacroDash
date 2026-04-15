const express = require('express');
const supabase = require('../supabase');

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

// Upsert on (ticker, epic) — preserves existing sector/industry/market_cap
router.post('/', async (req, res) => {
  const { ticker, epic, data } = req.body;
  if (!ticker || !epic || !data) return res.status(400).json({ error: 'ticker, epic, and data are required' });
  const { data: row, error } = await supabase
    .from('catalyst_saves')
    .upsert(
      { ticker: ticker.toUpperCase(), epic, data, saved_at: new Date().toISOString() },
      { onConflict: 'ticker,epic', ignoreDuplicates: false }
    )
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
