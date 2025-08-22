// save as server.js
const express = require('express');
const bodyParser = require('body-parser');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const app = express();
app.use(express.static('public')); // serve the index.html above from public/
app.use(bodyParser.json());

// Simple in-memory store (production: use DB)
const subscribers = new Set();

app.post('/save-subscriber', (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });
  subscribers.add(playerId);
  console.log('Subscriber added:', playerId);
  res.json({ ok: true, count: subscribers.size });
});

app.post('/remove-subscriber', (req, res) => {
  const { playerId } = req.body;
  subscribers.delete(playerId);
  console.log('Subscriber removed:', playerId);
  res.json({ ok: true, count: subscribers.size });
});

// Admin endpoint: send notification to all stored subscribers
// NOTE: Protect this route with real auth in production.
app.post('/admin/send', async (req, res) => {
  const { heading = 'Hello', content = 'This is a test notification', url = 'https://example.com' } = req.body;
  const include_player_ids = Array.from(subscribers);
  if (include_player_ids.length === 0) {
    return res.status(400).json({ error: 'No subscribers' });
  }

  const body = {
    app_id: "d4bb5ed9-aede-4005-9385-cbda5eb5223b",      // <-- OneSignal app id
    include_player_ids,
    headings: { en: heading },
    contents: { en: content },
    url // clicking opens this url
  };

  try {
    const resp = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': 'syskoddrgem7n6chuujuxgi4d' // <-- REST API Key (keep secret!)
      },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    console.log('OneSignal response:', data);
    res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on port', PORT));
