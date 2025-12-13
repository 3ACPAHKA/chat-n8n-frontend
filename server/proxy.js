const express = require('express');
let fetchFn;
try {
  fetchFn = global.fetch || require('node-fetch');
} catch (e) {
  fetchFn = null;
}

const app = express();
app.use(express.json());

// Прокси: форвардит запрос на n8n и добавляет Authorization из env
app.post('/webhook/chat', async (req, res) => {
  if (!fetchFn) return res.status(500).json({ error: 'fetch not available. Install node-fetch (`npm i node-fetch@2`) or use Node 18+' });

  const target = process.env.N8N_WEBHOOK_URL || 'https://n8n.mup.me/webhook/chat';
  const secret = process.env.WEBHOOK_SECRET;

  try {
    const r = await fetchFn(target, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, secret ? { Authorization: 'Bearer ' + secret } : {}),
      body: JSON.stringify(req.body)
    });

    const data = await r.text();
    let parsed;
    try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
    res.status(r.status).json(parsed);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Proxy listening on port', PORT));
