# Why Tasks Aren't Working - Setup Guide

## The Issue
Tasks require an LLM (Large Language Model) provider to execute. Your system has no API keys configured, so when you try to run a task, it fails with:
```
"No LLM provider configured. Please configure a provider in Settings > LLM Settings."
```

## Quick Fix (2 minutes)

### Option 1: Use Groq (Recommended - Free)
1. Go to https://console.groq.com and sign up (free)
2. Create an API key
3. Add it to `.env`:
   ```
   GROQ_API_KEY=your_actual_groq_key_here
   ```
4. Restart your backend server
5. Try running a task again

### Option 2: Configure via UI
1. Start your application
2. Go to **Settings > LLM Settings**
3. Click on "Groq" (or your preferred provider)
4. Paste your API key
5. Click "Set as Default"
6. Try running a task

### Option 3: Use OpenAI, Anthropic, or Gemini
Same process as Option 1, but use:
- `OPENAI_API_KEY` for OpenAI
- `ANTHROPIC_API_KEY` for Anthropic  
- `GEMINI_API_KEY` for Gemini

## How It Works
1. When you run a task, the system loads the **default LLM provider** from the database
2. It uses the API key to call the LLM (e.g., Groq's Llama model)
3. The LLM processes your task and returns results
4. Results are displayed in the task output

## Recommended Setup
- **For development**: Use Groq (free tier, no credit card needed)
- **For production**: Use OpenAI or Anthropic (more reliable)
- **For cost**: Use Groq (cheapest option)

## Troubleshooting
- **"Invalid API key"**: Check that you copied the key correctly
- **"Rate limited"**: You've hit the provider's rate limit. Wait a few minutes or use a different provider
- **"Model not found"**: The model name is incorrect. Check Settings > LLM Settings

## Next Steps
1. Get an API key from your chosen provider
2. Add it to `.env` or configure via UI
3. Restart the backend
4. Create a task and click "Run"
