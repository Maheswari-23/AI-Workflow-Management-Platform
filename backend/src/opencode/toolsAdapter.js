const axios = require('axios');
const { dbAll } = require('../database/db');

/**
 * Dynamically queries the tools table and converts active tools
 * into Native OpenCode Tool Schemas.
 */
async function getDynamicTools() {
  const toolsList = [];
  try {
    const dbTools = await dbAll('SELECT * FROM tools WHERE status = ?', ['active']);

    for (const tool of dbTools) {
      // Build named parameter schemas for specific tools
      let parameters = {
        type: 'object',
        properties: {
          requestBody: { type: 'string', description: 'JSON string of any required request body' },
        },
        required: []
      };

      if (tool.name === 'get_weather') {
        parameters = {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'Name of the city to fetch weather for. Example: "Chennai" or "London"' }
          },
          required: ['city']
        };
      } else if (tool.name === 'get_ip_info') {
        parameters = {
          type: 'object',
          properties: {
            ip: { type: 'string', description: 'Optional IP address to look up. Leave empty to use server IP.' }
          },
          required: []
        };
      } else if (tool.name === 'calculator') {
        parameters = {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Math expression to evaluate. Example: "2 * (5 + 3)"' }
          },
          required: ['expression']
        };
      } else if (tool.name === 'log') {
        parameters = {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'The message string to log to the workflow output.' }
          },
          required: ['message']
        };
      } else if (tool.name === 'read_file') {
        parameters = {
          type: 'object',
          properties: {
            filepath: { type: 'string', description: 'Absolute path or relative path to the file to read' }
          },
          required: ['filepath']
        };
      } else if (tool.name === 'write_file') {
        parameters = {
          type: 'object',
          properties: {
            filepath: { type: 'string', description: 'Absolute or relative path to the file' },
            content: { type: 'string', description: 'Content to write to the file' }
          },
          required: ['filepath', 'content']
        };
      } else if (tool.name === 'list_directory') {
        parameters = {
          type: 'object',
          properties: {
            dirpath: { type: 'string', description: 'Path to the directory to list' }
          },
          required: ['dirpath']
        };
      } else if (tool.name === 'fetch_stock_price' || tool.name === 'get_stock_price') {
        parameters = {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Ticker symbol (e.g., "AAPL"). For Indian stocks append ".NS" (e.g., "TEJASNET.NS")' },
            days_history: { type: 'number', description: 'Optional. Number of past days of historical data to fetch.' }
          },
          required: ['symbol']
        };
      }

      let finalDescription = tool.description || `Tool: ${tool.name}`;
      if (tool.name === 'fetch_stock_price' || tool.name === 'get_stock_price') {
         finalDescription = "Fetches real stock data (current price or historical) for a given ticker symbol.";
      }

      toolsList.push({
        type: 'function',
        function: {
          name: tool.name.replace(/\s+/g, '_').toLowerCase(),
          description: finalDescription,
          parameters
        },
        executionMeta: {
          originalType: tool.type || 'api',
          endpoint: tool.endpoint || '',
          method: tool.method || 'GET',
          headers: tool.headers || '{}'
        }
      });
    }
  } catch (err) {
    console.error('Error fetching dynamic tools:', err);
  }
  return toolsList;
}

/**
 * Execute the tool based on its type and name
 */
async function executeTool(toolName, args, dynamicToolsList) {
  try {
    const toolDef = dynamicToolsList.find(t => t.function.name === toolName);

    if (!toolDef) {
      if (toolName === 'calculate_math') {
        return String(new Function(`return ${args.expression}`)());
      }
      return `Error: Tool ${toolName} not found in active registry.`;
    }

    const { originalType } = toolDef.executionMeta;

    // ─── Native local tool implementations ───────────────────────────────────
    if (originalType !== 'api') {

      if (toolName === 'get_current_time') {
        return JSON.stringify({
          time: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      }

      if (toolName === 'generate_uuid') {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return JSON.stringify({ uuid });
      }

      if (toolName === 'log') {
        const msg = args.message || args.requestBody || JSON.stringify(args);
        console.log('[Tool:log]', msg);
        return JSON.stringify({ logged: true, message: msg });
      }

      if (toolName === 'calculator') {
        try {
          const expr = args.expression || args.requestBody || '';
          const result = new Function(`return (${expr})`)();
          return JSON.stringify({ expression: expr, result });
        } catch(e) {
          return JSON.stringify({ error: 'Invalid expression: ' + e.message });
        }
      }

      if (toolName === 'read_file') {
        try {
          const fs = require('fs');
          const content = fs.readFileSync(args.filepath, 'utf-8');
          return JSON.stringify({ success: true, content });
        } catch(e) {
          return JSON.stringify({ error: 'Cannot read file: ' + e.message });
        }
      }

      if (toolName === 'write_file') {
        try {
          const fs = require('fs');
          fs.writeFileSync(args.filepath, args.content, 'utf-8');
          return JSON.stringify({ success: true, message: 'File written successfully' });
        } catch(e) {
          return JSON.stringify({ error: 'Cannot write file: ' + e.message });
        }
      }

      if (toolName === 'list_directory') {
        try {
          const fs = require('fs');
          const files = fs.readdirSync(args.dirpath);
          return JSON.stringify({ success: true, files });
        } catch(e) {
          return JSON.stringify({ error: 'Cannot list directory: ' + e.message });
        }
      }

      return `[Platform] Tool [${toolName}] acknowledged.`;
    }

    // ─── Named API tool handlers ──────────────────────────────────────────────

    if (toolName === 'get_weather') {
      const city = encodeURIComponent(args.city || 'London');
      try {
        const res = await axios.get(`https://wttr.in/${city}?format=j1`, { timeout: 6000 });
        const current = res.data.current_condition?.[0];
        const area = res.data.nearest_area?.[0];
        return JSON.stringify({
          city: area?.areaName?.[0]?.value || args.city,
          country: area?.country?.[0]?.value,
          temperature_c: current?.temp_C,
          feels_like_c: current?.FeelsLikeC,
          humidity_pct: current?.humidity,
          description: current?.weatherDesc?.[0]?.value,
          wind_kmph: current?.windspeedKmph,
        });
      } catch(e) {
        return JSON.stringify({ error: `Could not fetch weather for "${args.city}": ${e.message}` });
      }
    }

    if (toolName === 'get_ip_info') {
      const ip = args.ip ? `/${args.ip}` : '';
      try {
        const res = await axios.get(`https://ipapi.co${ip}/json/`, { timeout: 6000 });
        return JSON.stringify({
          ip: res.data.ip,
          city: res.data.city,
          region: res.data.region,
          country: res.data.country_name,
          timezone: res.data.timezone,
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          org: res.data.org,
        });
      } catch(e) {
        return JSON.stringify({ error: `Could not fetch IP info: ${e.message}` });
      }
    }

    if (toolName === 'fetch_stock_price' || toolName === 'get_stock_price') {
      const symbol = args.symbol || 'AAPL';
      try {
        const yahooFinance = require('yahoo-finance2').default;
        
        if (args.days_history) {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - (parseInt(args.days_history) + 2));
          const result = await yahooFinance.historical(symbol, { period1: pastDate });
          return JSON.stringify(result.slice(-args.days_history));
        } else {
          const result = await yahooFinance.quote(symbol);
          return JSON.stringify({
            symbol: result.symbol,
            shortName: result.shortName,
            regularMarketPrice: result.regularMarketPrice,
            regularMarketChange: result.regularMarketChange,
            regularMarketChangePercent: result.regularMarketChangePercent,
            currency: result.currency
          });
        }
      } catch(e) {
        return JSON.stringify({ error: `Could not fetch stock price for "${symbol}": ${e.message}` });
      }
    }

    // ─── Generic API Tool Execution (for user-added tools with http endpoints) ─
    const { endpoint, method, headers } = toolDef.executionMeta;
    let url = String(endpoint);
    if (!url.startsWith('http')) {
      return `Error: API endpoint must start with http/https. Got: "${url}"`;
    }

    if (args.query_params) {
      url += (url.includes('?') ? '&' : '?') + args.query_params;
    }

    let parsedHeaders = {};
    try { parsedHeaders = JSON.parse(headers); } catch(e){}

    let data = undefined;
    if (args.requestBody) {
      try { data = JSON.parse(args.requestBody); } catch(e){ data = args.requestBody; }
    }

    try {
      const applyMethod = method === 'EXEC' ? 'GET' : method;
      const res = await axios({ method: applyMethod, url, data, headers: parsedHeaders, timeout: 5000 });
      return typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data);
    } catch (networkError) {
      return JSON.stringify({
        _mocked_sandbox_response: true,
        message: `API Call to ${url} was intercepted.`,
        note: `Network restriction (${networkError.code || networkError.message}).`,
        simulated_data: { status: 'OK', value: Math.floor(Math.random() * 100000) }
      });
    }

  } catch (error) {
    return 'Tool Execution Fault: ' + error.message;
  }
}

module.exports = { getDynamicTools, executeTool };
