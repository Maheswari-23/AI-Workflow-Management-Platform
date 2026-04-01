# Bring Your Own Key (BYOK) Guide

## Overview

This platform uses a **Bring Your Own Key (BYOK)** model for LLM providers. This means you must provide your own API keys to use the platform.

## Why BYOK?

- **Cost Control**: You pay directly to the LLM provider based on your usage
- **Privacy**: Your API keys and usage data stay between you and the provider
- **Flexibility**: Choose any provider and model that fits your needs
- **Security**: Keys are encrypted and stored securely in your local database

## How to Configure

### 1. Get Your API Key

First, obtain an API key from your chosen LLM provider:

- **Groq**: https://console.groq.com/keys (Free tier available)
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **Google Gemini**: https://aistudio.google.com/app/apikey

### 2. Configure in the Platform

1. Navigate to **Settings > LLM Settings**
2. Click on the provider you want to configure
3. Enter your API key (required)
4. Configure the base URL (pre-filled with defaults)
5. Select your preferred model
6. Adjust temperature and max tokens if needed
7. Click **Save Configuration**
8. Click **Test Connection** to verify it works

### 3. Set as Default

The provider marked as **Default** will be used for all task executions:

1. In the LLM Settings table, find your configured provider
2. Click **Set Default** button
3. You'll see a ★ Default badge next to the provider

## Security

- API keys are **encrypted** before storage using AES-256 encryption
- Keys are **never exposed** to the browser or frontend
- Keys are **only decrypted** on the backend when making LLM API calls
- Keys are **never logged** or included in error messages

## Recommended Providers

For getting started, we recommend:

1. **Groq** - Fast inference, generous free tier, great for testing
   - Model: `llama-3.1-8b-instant`
   - Free tier: 14,400 requests/day

2. **Google Gemini** - Good balance of cost and performance
   - Model: `gemini-1.5-flash`
   - Free tier: 15 requests/minute

3. **OpenAI** - Industry standard, most reliable
   - Model: `gpt-4o`
   - Pay-as-you-go pricing

4. **Anthropic** - Best for complex reasoning tasks
   - Model: `claude-3-5-sonnet-20241022`
   - Pay-as-you-go pricing

## Troubleshooting

### "No API key configured" Error

This means you haven't added an API key for the default provider. Go to Settings > LLM Settings and configure your key.

### "Connection failed" Error

- Verify your API key is correct
- Check that the base URL is correct
- Ensure you have credits/quota with the provider
- Check your internet connection

### Tasks Not Running

- Ensure you have a provider set as **Default** (★ badge)
- Verify the default provider has a valid API key configured
- Check the provider status shows "✓ Configured"

## Cost Management

Since you're using your own API keys:

- Monitor your usage on the provider's dashboard
- Set up billing alerts with your provider
- Use cheaper models for testing (e.g., Groq's free tier)
- Use more expensive models only for production workflows

## Support

If you need help:
1. Check the provider's documentation for API key issues
2. Use the "Test Connection" button to diagnose problems
3. Review the run history logs for detailed error messages
