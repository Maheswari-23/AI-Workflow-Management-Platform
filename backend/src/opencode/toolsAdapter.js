const axios = require('axios');
const { dbAll } = require('../database/db');

// ─── Parameter schema map for all known tools ─────────────────────────────────
const TOOL_SCHEMAS = {
  // Utility
  get_current_time:  { props: {}, req: [], desc: 'Get the current date, time, timezone and unix timestamp.' },
  generate_uuid:     { props: {}, req: [], desc: 'Generate a random UUID v4.' },
  calculator:        { props: { expression: { type:'string', description:'Math expression e.g. "2 * (5 + 3)"' } }, req: ['expression'], desc: 'Evaluate a math expression.' },
  log:               { props: { message: { type:'string', description:'Message to log' } }, req: ['message'], desc: 'Log a message to workflow output.' },
  random_number:     { props: { min: { type:'number', description:'Min value (default 1)' }, max: { type:'number', description:'Max value (default 100)' } }, req: [], desc: 'Generate a random integer between min and max.' },
  format_date:       { props: { date: { type:'string', description:'Date string to format. Leave empty for now.' } }, req: [], desc: 'Format a date or get current date in multiple formats.' },
  count_words:       { props: { text: { type:'string', description:'Text to analyze' } }, req: ['text'], desc: 'Count words, characters and sentences in text.' },
  base64_encode:     { props: { text: { type:'string', description:'Text to encode' } }, req: ['text'], desc: 'Encode text to base64.' },
  base64_decode:     { props: { encoded: { type:'string', description:'Base64 string to decode' } }, req: ['encoded'], desc: 'Decode a base64 string to text.' },
  string_replace:    { props: { text: { type:'string', description:'Original text' }, find: { type:'string', description:'Substring to find' }, replace_with: { type:'string', description:'Replacement string' } }, req: ['text','find','replace_with'], desc: 'Replace all occurrences of a substring in text.' },
  string_upper:      { props: { text: { type:'string', description:'Text to uppercase' } }, req: ['text'], desc: 'Convert text to uppercase.' },
  string_lower:      { props: { text: { type:'string', description:'Text to lowercase' } }, req: ['text'], desc: 'Convert text to lowercase.' },
  parse_json:        { props: { json_string: { type:'string', description:'JSON string to parse' }, field: { type:'string', description:'Optional dot-notation field e.g. "user.name"' } }, req: ['json_string'], desc: 'Parse a JSON string and optionally extract a field.' },

  // File system
  read_file:         { props: { filepath: { type:'string', description:'Path to file' } }, req: ['filepath'], desc: 'Read the contents of a file.' },
  write_file:        { props: { filepath: { type:'string', description:'Path to file' }, content: { type:'string', description:'Content to write' } }, req: ['filepath','content'], desc: 'Write content to a file.' },
  list_directory:    { props: { dirpath: { type:'string', description:'Directory path' } }, req: ['dirpath'], desc: 'List files in a directory.' },
  run_shell_command: { props: { command: { type:'string', description:'Shell command to run e.g. "ls -la" or "echo hello"' } }, req: ['command'], desc: 'Execute a shell command and return stdout.' },

  // Web & Browser
  web_search:        { props: { query: { type:'string', description:'Search query' }, max_results: { type:'number', description:'Max results to return (default 5)' } }, req: ['query'], desc: 'Search the web using DuckDuckGo and return top results with titles, URLs and snippets.' },
  fetch_webpage:     { props: { url: { type:'string', description:'Full URL to fetch e.g. https://example.com' }, extract_text: { type:'boolean', description:'If true, strips HTML and returns plain text only' } }, req: ['url'], desc: 'Fetch the content of any webpage. Returns HTML or plain text.' },
  scrape_links:      { props: { url: { type:'string', description:'URL to scrape links from' } }, req: ['url'], desc: 'Extract all hyperlinks from a webpage.' },
  http_request:      { props: { url: { type:'string', description:'Full URL' }, method: { type:'string', description:'GET, POST, PUT, DELETE' }, headers: { type:'string', description:'JSON string of headers' }, body: { type:'string', description:'JSON string of request body' } }, req: ['url'], desc: 'Make a custom HTTP request to any API endpoint.' },

  // Data & Finance
  get_weather:       { props: { city: { type:'string', description:'City name e.g. "Chennai" or "London"' } }, req: ['city'], desc: 'Get current weather for a city.' },
  get_ip_info:       { props: { ip: { type:'string', description:'IP address (leave empty for server IP)' } }, req: [], desc: 'Get geolocation and ISP info for an IP address.' },
  fetch_stock_price: { props: { symbol: { type:'string', description:'Ticker symbol e.g. "AAPL" or "RELIANCE.NS"' }, days_history: { type:'number', description:'Days of historical data (optional)' } }, req: ['symbol'], desc: 'Fetch real-time or historical stock price data.' },
  get_crypto_price:  { props: { coin: { type:'string', description:'Coin id e.g. "bitcoin", "ethereum", "solana"' }, currency: { type:'string', description:'Currency to convert to e.g. "usd", "inr" (default usd)' } }, req: ['coin'], desc: 'Get current cryptocurrency price from CoinGecko (no API key needed).' },
  get_exchange_rate: { props: { from: { type:'string', description:'Source currency code e.g. "USD"' }, to: { type:'string', description:'Target currency code e.g. "INR"' }, amount: { type:'number', description:'Amount to convert (default 1)' } }, req: ['from','to'], desc: 'Get live currency exchange rates and convert amounts.' },
  get_news:          { props: { topic: { type:'string', description:'Topic or keyword to search news for e.g. "AI", "India"' }, max_results: { type:'number', description:'Max articles (default 5)' } }, req: ['topic'], desc: 'Fetch latest news headlines for a topic using GNews API.' },
  get_public_holidays: { props: { country: { type:'string', description:'2-letter country code e.g. "IN", "US", "GB"' }, year: { type:'number', description:'Year (default current year)' } }, req: ['country'], desc: 'Get public holidays for a country and year.' },

  // AI / LLM powered
  summarize_text:    { props: { text: { type:'string', description:'Text to summarize' }, max_words: { type:'number', description:'Target summary length in words (default 100)' } }, req: ['text'], desc: 'Summarize a long piece of text using the configured LLM.' },
  extract_keywords:  { props: { text: { type:'string', description:'Text to extract keywords from' }, count: { type:'number', description:'Number of keywords to extract (default 10)' } }, req: ['text'], desc: 'Extract the most important keywords from text using LLM.' },
  translate_text:    { props: { text: { type:'string', description:'Text to translate' }, target_language: { type:'string', description:'Target language e.g. "Spanish", "French", "Tamil"' } }, req: ['text','target_language'], desc: 'Translate text to another language using the configured LLM.' },
  ask_llm:           { props: { prompt: { type:'string', description:'Question or instruction for the LLM' } }, req: ['prompt'], desc: 'Ask the configured LLM a question and get a response.' },
};

async function getDynamicTools() {
  const toolsList = [];
  try {
    const dbTools = await dbAll('SELECT * FROM tools WHERE status = ?', ['active']);
    for (const tool of dbTools) {
      const schema = TOOL_SCHEMAS[tool.name];
      const parameters = schema
        ? { type: 'object', properties: schema.props, required: schema.req }
        : { type: 'object', properties: { requestBody: { type: 'string', description: 'JSON request body' } }, required: [] };

      toolsList.push({
        type: 'function',
        function: {
          name: tool.name.replace(/\s+/g, '_').toLowerCase(),
          description: schema?.desc || tool.description || `Tool: ${tool.name}`,
          parameters,
        },
        executionMeta: {
          originalType: tool.type || 'api',
          endpoint: tool.endpoint || '',
          method: tool.method || 'GET',
          headers: tool.headers || '{}',
        },
      });
    }
  } catch (err) {
    console.error('Error fetching dynamic tools:', err);
  }
  return toolsList;
}

// ─── Tool Execution ───────────────────────────────────────────────────────────
async function executeTool(toolName, args, dynamicToolsList) {
  try {
    const toolDef = dynamicToolsList.find(t => t.function.name === toolName);
    if (!toolDef) return `Error: Tool "${toolName}" not found in active registry.`;

    // ── Utility tools ─────────────────────────────────────────────────────────
    if (toolName === 'get_current_time') {
      return JSON.stringify({ time: new Date().toISOString(), local_time: new Date().toLocaleString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, unix_timestamp: Math.floor(Date.now() / 1000) });
    }
    if (toolName === 'generate_uuid') {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); });
      return JSON.stringify({ uuid });
    }
    if (toolName === 'calculator') {
      try { return JSON.stringify({ expression: args.expression, result: new Function(`return (${args.expression})`)() }); }
      catch(e) { return JSON.stringify({ error: 'Invalid expression: ' + e.message }); }
    }
    if (toolName === 'log') {
      const msg = args.message || JSON.stringify(args);
      console.log('[Tool:log]', msg);
      return JSON.stringify({ logged: true, message: msg });
    }
    if (toolName === 'random_number') {
      const min = Number(args.min ?? 1), max = Number(args.max ?? 100);
      return JSON.stringify({ value: Math.floor(Math.random() * (max - min + 1)) + min, min, max });
    }
    if (toolName === 'format_date') {
      const d = args.date ? new Date(args.date) : new Date();
      return JSON.stringify({ iso: d.toISOString(), local: d.toLocaleString(), date_only: d.toISOString().split('T')[0], time_only: d.toTimeString().split(' ')[0], unix: Math.floor(d.getTime()/1000), day_of_week: d.toLocaleDateString('en-US',{weekday:'long'}) });
    }
    if (toolName === 'count_words') {
      const t = args.text || '';
      return JSON.stringify({ word_count: t.trim().split(/\s+/).filter(Boolean).length, char_count: t.length, char_no_spaces: t.replace(/\s/g,'').length, sentences: (t.match(/[.!?]+/g)||[]).length });
    }
    if (toolName === 'base64_encode') return JSON.stringify({ encoded: Buffer.from(args.text||'').toString('base64') });
    if (toolName === 'base64_decode') {
      try { return JSON.stringify({ decoded: Buffer.from(args.encoded||'','base64').toString('utf-8') }); }
      catch(e) { return JSON.stringify({ error: 'Invalid base64' }); }
    }
    if (toolName === 'string_replace') return JSON.stringify({ result: (args.text||'').split(args.find||'').join(args.replace_with||'') });
    if (toolName === 'string_upper') return JSON.stringify({ result: (args.text||'').toUpperCase() });
    if (toolName === 'string_lower') return JSON.stringify({ result: (args.text||'').toLowerCase() });
    if (toolName === 'parse_json') {
      try {
        const obj = typeof args.json_string === 'string' ? JSON.parse(args.json_string) : args.json_string;
        if (args.field) { const val = args.field.split('.').reduce((o,k)=>o?.[k], obj); return JSON.stringify({ field: args.field, value: val }); }
        return JSON.stringify({ parsed: obj });
      } catch(e) { return JSON.stringify({ error: 'Invalid JSON: ' + e.message }); }
    }

    // ── File system tools ─────────────────────────────────────────────────────
    if (toolName === 'read_file') {
      try { return JSON.stringify({ content: require('fs').readFileSync(args.filepath, 'utf-8') }); }
      catch(e) { return JSON.stringify({ error: e.message }); }
    }
    if (toolName === 'write_file') {
      try { require('fs').writeFileSync(args.filepath, args.content, 'utf-8'); return JSON.stringify({ success: true }); }
      catch(e) { return JSON.stringify({ error: e.message }); }
    }
    if (toolName === 'list_directory') {
      try { return JSON.stringify({ files: require('fs').readdirSync(args.dirpath) }); }
      catch(e) { return JSON.stringify({ error: e.message }); }
    }
    if (toolName === 'run_shell_command') {
      try {
        const { execSync } = require('child_process');
        const output = execSync(args.command, { timeout: 10000, encoding: 'utf-8' });
        return JSON.stringify({ output: output.trim() });
      } catch(e) { return JSON.stringify({ error: e.message, stderr: e.stderr?.toString() }); }
    }

    // ── Web & Browser tools ───────────────────────────────────────────────────
    if (toolName === 'web_search') {
      try {
        const query = encodeURIComponent(args.query);
        const max = args.max_results || 5;
        // DuckDuckGo instant answer API (no key needed)
        const res = await axios.get(`https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`, { timeout: 8000 });
        const results = [];
        if (res.data.AbstractText) results.push({ title: res.data.Heading, url: res.data.AbstractURL, snippet: res.data.AbstractText });
        (res.data.RelatedTopics || []).slice(0, max - results.length).forEach(t => {
          if (t.Text && t.FirstURL) results.push({ title: t.Text.split(' - ')[0], url: t.FirstURL, snippet: t.Text });
        });
        // Fallback: use DuckDuckGo HTML search scrape
        if (results.length === 0) {
          const html = await axios.get(`https://html.duckduckgo.com/html/?q=${query}`, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
          const matches = [...html.data.matchAll(/<a class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>/g)];
          matches.slice(0, max).forEach(m => results.push({ url: m[1], title: m[2], snippet: '' }));
        }
        return JSON.stringify({ query: args.query, results: results.slice(0, max) });
      } catch(e) { return JSON.stringify({ error: 'Search failed: ' + e.message }); }
    }

    if (toolName === 'fetch_webpage') {
      try {
        const res = await axios.get(args.url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' }, maxContentLength: 500000 });
        let content = res.data;
        if (args.extract_text !== false) {
          // Strip HTML tags and clean up whitespace
          content = String(content)
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 8000); // limit to 8k chars
        }
        return JSON.stringify({ url: args.url, content, length: content.length });
      } catch(e) { return JSON.stringify({ error: 'Failed to fetch: ' + e.message }); }
    }

    if (toolName === 'scrape_links') {
      try {
        const res = await axios.get(args.url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const links = [...String(res.data).matchAll(/href=["']([^"']+)["']/g)]
          .map(m => m[1])
          .filter(l => l.startsWith('http'))
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 50);
        return JSON.stringify({ url: args.url, links, count: links.length });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    }

    if (toolName === 'http_request') {
      try {
        const res = await axios({ method: (args.method||'GET').toUpperCase(), url: args.url, headers: args.headers ? JSON.parse(args.headers) : {}, data: args.body ? JSON.parse(args.body) : undefined, timeout: 10000 });
        return JSON.stringify({ status: res.status, data: res.data });
      } catch(e) { return JSON.stringify({ error: e.response?.data || e.message }); }
    }

    // ── Data & Finance tools ──────────────────────────────────────────────────
    if (toolName === 'get_weather') {
      try {
        const city = encodeURIComponent(args.city || 'London');
        const res = await axios.get(`https://wttr.in/${city}?format=j1`, { timeout: 6000 });
        const c = res.data.current_condition?.[0];
        const a = res.data.nearest_area?.[0];
        return JSON.stringify({ city: a?.areaName?.[0]?.value || args.city, country: a?.country?.[0]?.value, temperature_c: c?.temp_C, feels_like_c: c?.FeelsLikeC, humidity_pct: c?.humidity, description: c?.weatherDesc?.[0]?.value, wind_kmph: c?.windspeedKmph });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    }

    if (toolName === 'get_ip_info') {
      try {
        const ip = args.ip ? `/${args.ip}` : '';
        const res = await axios.get(`https://ipapi.co${ip}/json/`, { timeout: 6000 });
        return JSON.stringify({ ip: res.data.ip, city: res.data.city, region: res.data.region, country: res.data.country_name, timezone: res.data.timezone, org: res.data.org });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    }

    if (toolName === 'fetch_stock_price' || toolName === 'get_stock_price') {
      try {
        const yahooFinance = require('yahoo-finance2').default;
        const symbol = args.symbol || 'AAPL';
        if (args.days_history) {
          const pastDate = new Date(); pastDate.setDate(pastDate.getDate() - (parseInt(args.days_history) + 2));
          const result = await yahooFinance.historical(symbol, { period1: pastDate });
          return JSON.stringify(result.slice(-args.days_history));
        }
        const result = await yahooFinance.quote(symbol);
        return JSON.stringify({ symbol: result.symbol, name: result.shortName, price: result.regularMarketPrice, change: result.regularMarketChange, change_pct: result.regularMarketChangePercent, currency: result.currency });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    }

    if (toolName === 'get_crypto_price') {
      try {
        const coin = (args.coin || 'bitcoin').toLowerCase();
        const currency = (args.currency || 'usd').toLowerCase();
        const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${currency}&include_24hr_change=true`, { timeout: 8000 });
        const data = res.data[coin];
        if (!data) return JSON.stringify({ error: `Coin "${coin}" not found` });
        return JSON.stringify({ coin, currency, price: data[currency], change_24h: data[`${currency}_24h_change`] });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    }

    if (toolName === 'get_exchange_rate') {
      try {
        const from = (args.from || 'USD').toUpperCase();
        const to = (args.to || 'INR').toUpperCase();
        const amount = Number(args.amount || 1);
        const res = await axios.get(`https://open.er-api.com/v6/latest/${from}`, { timeout: 8000 });
        const rate = res.data.rates?.[to];
        if (!rate) return JSON.stringify({ error: `Currency "${to}" not found` });
        return JSON.stringify({ from, to, rate, amount, converted: (amount * rate).toFixed(4), updated: res.data.time_last_update_utc });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    }

    if (toolName === 'get_news') {
      try {
        const topic = encodeURIComponent(args.topic || 'technology');
        const max = args.max_results || 5;
        // GNews free API (no key needed for basic use)
        const res = await axios.get(`https://gnews.io/api/v4/search?q=${topic}&lang=en&max=${max}&apikey=free`, { timeout: 8000 });
        if (res.data.articles) {
          return JSON.stringify({ topic: args.topic, articles: res.data.articles.map(a => ({ title: a.title, source: a.source?.name, url: a.url, published: a.publishedAt, description: a.description })) });
        }
        // Fallback: DuckDuckGo news
        const ddg = await axios.get(`https://api.duckduckgo.com/?q=${topic}+news&format=json&no_html=1`, { timeout: 8000 });
        const items = (ddg.data.RelatedTopics || []).slice(0, max).map(t => ({ title: t.Text, url: t.FirstURL }));
        return JSON.stringify({ topic: args.topic, articles: items });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    }

    if (toolName === 'get_public_holidays') {
      try {
        const country = (args.country || 'US').toUpperCase();
        const year = args.year || new Date().getFullYear();
        const res = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`, { timeout: 8000 });
        return JSON.stringify({ country, year, holidays: res.data.map(h => ({ date: h.date, name: h.name, type: h.types?.[0] })) });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    }

    // ── AI / LLM-powered tools ────────────────────────────────────────────────
    if (toolName === 'summarize_text' || toolName === 'extract_keywords' || toolName === 'translate_text' || toolName === 'ask_llm') {
      try {
        const { getOpenCodeClient } = require('./client');
        const llm = await getOpenCodeClient();
        let prompt = '';
        if (toolName === 'summarize_text') prompt = `Summarize the following text in about ${args.max_words || 100} words:\n\n${args.text}`;
        else if (toolName === 'extract_keywords') prompt = `Extract the ${args.count || 10} most important keywords from this text. Return as a comma-separated list:\n\n${args.text}`;
        else if (toolName === 'translate_text') prompt = `Translate the following text to ${args.target_language}. Return only the translation:\n\n${args.text}`;
        else if (toolName === 'ask_llm') prompt = args.prompt;
        const res = await llm.generate([{ role: 'user', content: prompt }]);
        return JSON.stringify({ result: res.choices[0].message.content });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    }

    // ── Generic API tool (user-defined endpoint) ──────────────────────────────
    const { endpoint, method, headers } = toolDef.executionMeta;
    const url = String(endpoint);
    if (!url.startsWith('http')) return `Error: Endpoint must start with http/https. Got: "${url}"`;
    let parsedHeaders = {};
    try { parsedHeaders = JSON.parse(headers); } catch(e) {}
    let data;
    if (args.requestBody) { try { data = JSON.parse(args.requestBody); } catch(e) { data = args.requestBody; } }
    try {
      const res = await axios({ method: method === 'EXEC' ? 'GET' : method, url, data, headers: parsedHeaders, timeout: 8000 });
      return typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data);
    } catch(e) {
      return JSON.stringify({ error: e.response?.data || e.message });
    }

  } catch (error) {
    return 'Tool Execution Fault: ' + error.message;
  }
}

module.exports = { getDynamicTools, executeTool };
