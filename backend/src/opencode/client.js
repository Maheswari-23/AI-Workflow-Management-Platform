const axios = require('axios');
const { dbGet } = require('../database/db');

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

  let apiKey = process.env.GROQ_API_KEY || '';
  let baseUrl = 'https://api.groq.com/openai/v1';
  let modelName = 'llama-3.3-70b-versatile';

  if (providerDetails) {
    apiKey = providerDetails.api_key || apiKey;
    baseUrl = providerDetails.base_url || baseUrl;
    modelName = providerDetails.model || modelName;
  }

  return new OpenCodeClient(apiKey, baseUrl, modelName);
}

module.exports = { getOpenCodeClient };
