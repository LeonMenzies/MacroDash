const express = require('express');
const router = express.Router();

const yf = require('yahoo-finance2').default;

router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    const result = await yf.quoteSummary(ticker, {
      modules: ['assetProfile', 'price'],
    });
    const profile = result.assetProfile || {};
    const price = result.price || {};

    let market_cap = null;
    const cap = price.marketCap;
    if (cap) {
      if (cap >= 10e9) market_cap = 'Large Cap';
      else if (cap >= 2e9) market_cap = 'Mid Cap';
      else if (cap >= 300e6) market_cap = 'Small Cap';
      else market_cap = 'Micro Cap';
    }

    res.json({
      sector: profile.sector || null,
      industry: profile.industry || null,
      market_cap,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
