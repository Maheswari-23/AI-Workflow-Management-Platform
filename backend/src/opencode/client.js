const axios = require('axios');
const { dbGet } = require('../database/db');
const { decrypt } = require('../utils/crypto');

/**
 * OpenCode Unified Client
 * An execution framework that standardizes API interactions 
 * dynamically based on the user's selected LLM provider.
 * 
 * Features:
 * - Round-robin key rotation across multiple API keys
 * - Automatic retry with backoff on rate limits (429)
 * - Retry on server errors (5xx)
 * - Retry on model/bad-request errors (400) with lower temperature
 * - Environment variable fallback for initial setup
 */

// Global map to store current key index for each provider/model combination
// This ensures true round-robin load balancing across multiple workflow runs
const globalKeyIndexes = new Map();

class OpenCodeClient {
  constructor(apiKeys, baseUrl, modelName, pricing = { promptCost: 0, completionCost: 0 }) {
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    this.baseUrl = baseUrl;
    this.modelName = modelName;
    this.pricing = pricing;
    
    // Unique identifier for this provider configuration
    this.configId = `${baseUrl}_${modelName}`;
    
    // Initialize global index if it doesn't exist
    if (!globalKeyIndexes.has(this.configId)) {
      globalKeyIndexes.set(this.configId, 0);
    }
  }

  get currentKeyIndex() {
    return globalKeyIndexes.get(this.configId);
  }

  set currentKeyIndex(index) {
    globalKeyIndexes.set(this.configId, index);
  }

  /**
   * Rotate to the next API key in the pool
   */
  _rotateKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return this.apiKeys[this.currentKeyIndex];
  }

  /**
   * Sleep for a given number of milliseconds
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generate(messages, tools = []) {
    const payload = {
      model: this.modelName,
      messages: messages,
      temperature: 0.3,
      max_tokens: 4096,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    let lastError = null;
    const totalAttempts = this.apiKeys.length * 2; // Try each key up to 2 times

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      const keyIndex = this.currentKeyIndex;
      const apiKey = this.apiKeys[keyIndex];
      
      try {
        console.log(`[OpenCode] Using key ${keyIndex + 1}/${this.apiKeys.length} | Model: ${this.modelName} | Attempt ${attempt + 1}/${totalAttempts}`);
        
        const response = await axios.post(
          `${this.baseUrl}/chat/completions`,
          payload,
          { 
            headers: { 
              Authorization: `Bearer ${apiKey}`, 
              'Content-Type': 'application/json' 
            },
            timeout: 120000 // 120 second timeout for local models
          }
        );
        
        // Success — advance key index for next call (round-robin)
        this._rotateKey();
        return response.data;

      } catch (error) {
        lastError = error;
        const statusCode = error.response?.status;
        const errorMsg = error.response?.data?.error?.message || error.message;
        
        console.error(`[OpenCode] Key ${keyIndex + 1} failed (HTTP ${statusCode || 'N/A'}): ${errorMsg}`);
        
        // ── Rate limit (429) — rotate key + wait before retrying ──────
        if (statusCode === 429) {
          console.log(`[OpenCode] Rate limited on key ${keyIndex + 1}. Rotating to next key...`);
          this._rotateKey();
          
          // Extract retry-after header or use progressive backoff
          // Cap retry-after to max 30 seconds to avoid long waits
          const retryAfter = error.response?.headers?.['retry-after'];
          let waitMs = Math.min(2000 * (attempt + 1), 15000); // Default: progressive backoff, max 15s
          
          if (retryAfter) {
            const retryAfterMs = parseInt(retryAfter) * 1000;
            // If retry-after is more than 30 seconds, skip this key and try next
            if (retryAfterMs > 30000) {
              console.log(`[OpenCode] Key ${keyIndex + 1} rate limited for ${parseInt(retryAfter)}s. Skipping this key.`);
              continue; // Skip the wait and try next key immediately
            }
            waitMs = Math.min(retryAfterMs, 30000); // Cap at 30 seconds
          }
          
          console.log(`[OpenCode] Waiting ${waitMs}ms before next attempt...`);
          await this._sleep(waitMs);
          continue;
        }
        
        // ── Server errors (5xx) — rotate key + short delay ────────────
        if (statusCode >= 500 && statusCode < 600) {
          console.log(`[OpenCode] Server error ${statusCode} on key ${keyIndex + 1}. Rotating...`);
          this._rotateKey();
          await this._sleep(2000);
          continue;
        }
        
        // ── Bad request / Model errors (400) — may be transient ───────
        if (statusCode === 400) {
          const errBody = error.response?.data?.error || {};
          const isModelError = errorMsg.includes('model') || 
                               errorMsg.includes('does not exist') ||
                               errorMsg.includes('not found') ||
                               errorMsg.includes('decommissioned') ||
                               errorMsg.includes('not available') ||
                               errBody.type === 'invalid_request_error';
          
          if (isModelError) {
            // Model is genuinely unavailable — no point retrying with another key
            console.error(`[OpenCode] Model "${this.modelName}" error: ${errorMsg}. This is a model issue, not a key issue.`);
            throw error;
          }
          
          // Other 400 errors (e.g. failed_generation for tool calls) — retry with same/next key
          console.log(`[OpenCode] Bad request (400) on key ${keyIndex + 1}. Rotating and retrying...`);
          this._rotateKey();
          await this._sleep(1000);
          continue;
        }
        
        // ── Auth errors (401/403) — this specific key is bad, try next ──
        if (statusCode === 401 || statusCode === 403) {
          console.log(`[OpenCode] Auth error on key ${keyIndex + 1}. Trying next key...`);
          this._rotateKey();
          continue;
        }
        
        // ── Other errors — throw immediately ──────────────────────────
        throw error;
      }
    }
    
    throw lastError || new Error('All API keys exhausted after maximum retry attempts');
  }
}

/**
 * Initializes and returns an OpenCode client dynamically configured
 * with the API parameters from the database.
 * Uses the default provider if no name is specified.
 * 
 * BYOK (Bring Your Own Key) Model:
 * - Users provide their own API keys via the UI
 * - Falls back to GROQ_API_KEY env var for initial setup
 * - Supports comma-separated keys for rotation
 * - The default provider's key is used for all task executions
 */
async function getOpenCodeClient(providerName = null) {
  let providerDetails;

  if (providerName) {
    providerDetails = await dbGet('SELECT * FROM llm_providers WHERE name = ? COLLATE NOCASE', [providerName]);
  } else {
    // Use the provider marked as default
    providerDetails = await dbGet('SELECT * FROM llm_providers WHERE is_default = 1 LIMIT 1');
    // Fallback to Groq if nothing is set as default
    if (!providerDetails) {
      providerDetails = await dbGet('SELECT * FROM llm_providers WHERE name = ? COLLATE NOCASE', ['Groq']);
    }
  }

  if (!providerDetails) {
    throw new Error('No LLM provider configured. Please configure a provider in Settings > LLM Settings.');
  }

  // BYOK: Use user-provided keys from database first
  let decryptedRaw = '';
  try {
    decryptedRaw = providerDetails.api_key ? decrypt(providerDetails.api_key) : '';
  } catch (e) {
    console.warn('[OpenCode] Failed to decrypt stored key, falling back to env var:', e.message);
  }
  
  // Support multiple keys separated by commas (Key Rotation)
  let apiKeys = decryptedRaw.split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  // Fallback: use GROQ_API_KEY env var if no keys in database
  if (apiKeys.length === 0 && providerDetails.name?.toLowerCase() === 'groq' && process.env.GROQ_API_KEY) {
    console.log('[OpenCode] No keys in DB for Groq, falling back to GROQ_API_KEY env var');
    apiKeys = process.env.GROQ_API_KEY.split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }

  const baseUrl = providerDetails.base_url || '';
  const modelName = providerDetails.model || '';

  // Allow empty API keys for local providers like Ollama
  const isLocalProvider = providerDetails.name?.toLowerCase() === 'ollama';
  if (apiKeys.length === 0 && !isLocalProvider) {
    throw new Error(
      `No API key configured for "${providerDetails.name}". ` +
      `Please add your API key in Settings > LLM Settings and set it as default.`
    );
  }
  
  // For local providers, use a dummy key if none provided
  if (apiKeys.length === 0 && isLocalProvider) {
    apiKeys = ['local-no-auth'];
  }

  if (!baseUrl) {
    throw new Error(
      `No base URL configured for "${providerDetails.name}". ` +
      `Please configure the base URL in Settings > LLM Settings.`
    );
  }

  if (!modelName) {
    throw new Error(
      `No model configured for "${providerDetails.name}". ` +
      `Please configure the model in Settings > LLM Settings.`
    );
  }

  console.log(`[OpenCode] Initialized: ${providerDetails.name} | Model: ${modelName} | Keys: ${apiKeys.length}`);

  const pricing = {
    promptCost: providerDetails.cost_per_1m_prompt || 0.0,
    completionCost: providerDetails.cost_per_1m_completion || 0.0
  };

  return new OpenCodeClient(apiKeys, baseUrl, modelName, pricing);
}

module.exports = { getOpenCodeClient };
