const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const router = express.Router();
const IDEAS_FILE = path.join(__dirname, '../../ideas.json');

function readIdeas() {
  if (!fs.existsSync(IDEAS_FILE)) return [];
  return JSON.parse(fs.readFileSync(IDEAS_FILE, 'utf8'));
}

function writeIdeas(ideas) {
  fs.writeFileSync(IDEAS_FILE, JSON.stringify(ideas, null, 2));
}

router.get('/', (req, res) => {
  res.json(readIdeas());
});

router.post('/', (req, res) => {
  const { text, tag } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });
  const ideas = readIdeas();
  const idea = {
    id: randomUUID(),
    date: new Date().toISOString(),
    tag: tag || 'idea',
    text,
  };
  ideas.push(idea);
  writeIdeas(ideas);
  res.json(idea);
});

router.delete('/:id', (req, res) => {
  const ideas = readIdeas();
  const filtered = ideas.filter((i) => i.id !== req.params.id);
  if (filtered.length === ideas.length) return res.status(404).json({ error: 'not found' });
  writeIdeas(filtered);
  res.json({ ok: true });
});

module.exports = router;
