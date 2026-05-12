const axios = require('axios');
const { dbGet } = require('../database/db');
const { decrypt } = require('../utils/crypto');

/**
 * OpenCode Unified Client
 * An execution framework that standardizes API interactions 
 * dynamically based on the user's selected LLM provider.
 */
class OpenCodeClient {
  constructor(apiKeys, baseUrl, modelName, pricing = { promptCost: 0, completionCost: 0 }) {
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    this.baseUrl = baseUrl;
    this.modelName = modelName;
    this.pricing = pricing;
    this.currentKeyIndex = 0;
  }

  async generate(messages, tools = []) {
    const payload = {
      model: this.modelName,
      messages: messages,
      temperature: 0.3,
      max_tokens: 1000,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    let lastError = null;
    const initialIndex = this.currentKeyIndex;

    // Try each key once starting from current index
    for (let i = 0; i < this.apiKeys.length; i++) {
      const apiKey = this.apiKeys[this.currentKeyIndex];
      try {
        const response = await axios.post(
          `${this.baseUrl}/chat/completions`,
          payload,
          { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
        );
        return response.data;
      } catch (error) {
        lastError = error;
        const statusCode = error.response?.status;
        
        // Rotate key if we hit rate limit (429) or server error (5xx)
        if (statusCode === 429 || (statusCode >= 500 && statusCode < 600)) {
          console.log(`Key ${this.currentKeyIndex} failed with ${statusCode}. Rotating to next key.`);
          this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
          
          // If we've circled back to the starting key, stop trying
          if (this.currentKeyIndex === initialIndex) break;
          
          continue;
        }
        
        // For other errors (401, 400, etc.), don't rotate, just throw
        throw error;
      }
    }
    
    throw lastError || new Error('All API keys failed or no keys available');
  }
}

/**
 * Initializes and returns an OpenCode client dynamically configured
 * with the API parameters from the database.
 * Uses the default provider if no name is specified.
 * 
 * BYOK (Bring Your Own Key) Model:
 * - Users MUST provide their own API keys via the UI
 * - No environment variable fallbacks
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

  // BYOK: Only use user-provided keys from database (no env fallbacks)
  const decryptedRaw = providerDetails.api_key ? decrypt(providerDetails.api_key) : '';
  
  // Support multiple keys separated by commas (Key Rotation)
  const apiKeys = decryptedRaw.split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  const baseUrl = providerDetails.base_url || '';
  const modelName = providerDetails.model || '';

  if (apiKeys.length === 0) {
    throw new Error(
      `No API key configured for "${providerDetails.name}". ` +
      `Please add your API key in Settings > LLM Settings and set it as default.`
    );
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

  const pricing = {
    promptCost: providerDetails.cost_per_1m_prompt || 0.0,
    completionCost: providerDetails.cost_per_1m_completion || 0.0
  };

  return new OpenCodeClient(apiKeys, baseUrl, modelName, pricing);
}

module.exports = { getOpenCodeClient };
