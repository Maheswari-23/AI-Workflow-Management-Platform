const axios = require('axios');
const { dbGet } = require('../database/db');
const { decrypt } = require('../utils/crypto');

/**
 * OpenCode Unified Client
 * An execution framework that standardizes API interactions 
 * dynamically based on the user's selected LLM provider.
 */
class OpenCodeClient {
  constructor(apiKey, baseUrl, modelName) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.modelName = modelName;
  }

  async generate(messages, tools = []) {
    const payload = {
      model: this.modelName,
      messages: messages,
      temperature: 0.3,
      max_tokens: 2000,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        payload,
        { headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
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
  const apiKey = providerDetails.api_key ? decrypt(providerDetails.api_key) : '';
  const baseUrl = providerDetails.base_url || '';
  const modelName = providerDetails.model || '';

  if (!apiKey) {
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

  return new OpenCodeClient(apiKey, baseUrl, modelName);
}

module.exports = { getOpenCodeClient };
