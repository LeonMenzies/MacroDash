const express = require('express');
const supabase = require('../supabase');
const router = express.Router();

router.get('/', async (req, res) => {
  const { industry } = req.query;
  let query = supabase.from('industry_saves').select('*').order('saved_at', { ascending: false });
  if (industry) query = query.ilike('industry', industry);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { industry, data } = req.body;
  if (!industry || !data) return res.status(400).json({ error: 'industry and data are required' });
  const { data: row, error } = await supabase
    .from('industry_saves')
    .insert({ industry, data, saved_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(row);
});

router.delete('/:id', async (req, res) => {
  const { error, count } = await supabase
    .from('industry_saves')
    .delete({ count: 'exact' })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  if (count === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

module.exports = router;
