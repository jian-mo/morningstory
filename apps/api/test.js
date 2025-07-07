const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Morning Story API - Test', status: 'running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test API running on port ${PORT}`);
});

module.exports = app;