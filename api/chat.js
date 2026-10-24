// Stateless proxy: forwards one request to the Anthropic API and returns the text.
// Nothing is written to disk, a database, or logs.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server is not configured' });

  const { system, messages } = req.body || {};
  if (typeof system !== 'string' || system.length > 70000 ||
      !Array.isArray(messages) || messages.length === 0 || messages.length > 60) {
    return res.status(400).json({ error: 'Bad request' });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 1500,
        system,
        messages
      })
    });
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: 'Upstream error' });
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: 'Upstream error' });
  }
};
