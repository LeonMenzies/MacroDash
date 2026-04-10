require('dotenv').config();
const express = require('express');
const cors = require('cors');

const macroRoutes = require('./routes/macro');
const execSummaryRoutes = require('./routes/execSummary');
const catalystRoutes = require('./routes/catalyst');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4000' }));
app.use(express.json());

app.use('/api/macro', macroRoutes);
app.use('/api/exec-summary', execSummaryRoutes);
app.use('/api/catalyst', catalystRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
