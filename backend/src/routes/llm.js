const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');
const axios = require('axios');

// GET all LLM providers
router.get('/providers', async (req, res) => {
  try {
    const providers = await dbAll('SELECT * FROM llm_providers ORDER BY name');
    // Mask API keys in response
    const safe = providers.map(p => ({
      ...p,
      api_key: p.api_key ? '••••••••' + p.api_key.slice(-4) : '',
      hasKey: !!p.api_key,
    }));
    res.json({ providers: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single provider
router.get('/providers/:id', async (req, res) => {
  try {
    const provider = await dbGet('SELECT * FROM llm_providers WHERE id = ?', [req.params.id]);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    res.json({
      provider: {
        ...provider,
        api_key: provider.api_key ? '••••••••' + provider.api_key.slice(-4) : '',
        hasKey: !!provider.api_key,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save provider config
router.post('/providers', async (req, res) => {
  try {
    const { name, api_key, base_url, model, temperature = 0.7, max_tokens = 2048 } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // Check if exists
    const existing = await dbGet('SELECT id FROM llm_providers WHERE name = ?', [name]);
    if (existing) {
      await dbRun(
        `UPDATE llm_providers SET api_key = COALESCE(?, api_key), base_url = COALESCE(?, base_url),
         model = COALESCE(?, model), temperature = ?, max_tokens = ?,
         configured = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?`,
        [api_key, base_url, model, temperature, max_tokens, api_key ? 1 : 0, name]
      );
    } else {
      await dbRun(
        'INSERT INTO llm_providers (name, api_key, base_url, model, temperature, max_tokens, configured) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, api_key || '', base_url || '', model || '', temperature, max_tokens, api_key ? 1 : 0]
      );
    }

    const provider = await dbGet('SELECT * FROM llm_providers WHERE name = ?', [name]);
    res.json({
      provider: { ...provider, api_key: provider.api_key ? '••••' + provider.api_key.slice(-4) : '', hasKey: !!provider.api_key },
      message: 'Provider configuration saved',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST set a provider as default
router.post('/providers/:name/set-default', async (req, res) => {
  try {
    const { name } = req.params;
    const provider = await dbGet('SELECT id FROM llm_providers WHERE name = ?', [name]);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    // Clear all defaults, then set this one
    await dbRun('UPDATE llm_providers SET is_default = 0');
    await dbRun('UPDATE llm_providers SET is_default = 1 WHERE name = ?', [name]);

    res.json({ success: true, message: `${name} is now the default LLM provider` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST test LLM connection
router.post('/test', async (req, res) => {
  try {
    const { provider_name, api_key } = req.body;
    
    // Determine provider to use
    let provider;
    if (provider_name) {
      provider = await dbGet('SELECT * FROM llm_providers WHERE name = ?', [provider_name]);
    }
    const key = api_key || provider?.api_key || process.env.GROQ_API_KEY;
    const baseUrl = provider?.base_url || 'https://api.groq.com/openai/v1';
    const model = provider?.model || 'llama-3.3-70b-versatile';

    if (!key) return res.status(400).json({ error: 'No API key available' });

    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      { model, messages: [{ role: 'user', content: 'Reply with "Connection successful!"' }], max_tokens: 20 },
      { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true, response: response.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;
