const axios = require('axios');
const { dbAll } = require('../database/db');

/**
 * Dynamically queries the tools table and converts active user-defined APIs 
 * into Native OpenCode Tool Schemas.
 */
async function getDynamicTools() {
  const toolsList = [];
  try {
    const dbTools = await dbAll('SELECT * FROM tools WHERE status = ?', ['active']);
    
    for (const tool of dbTools) {
      // Map the DB structure to an OpenCode compatible tool schema
      toolsList.push({
        type: 'function',
        function: {
          name: tool.name.replace(/\s+/g, '_').toLowerCase(),
          description: tool.description || `Tool exactly matching ${tool.name}. Endpoint is ${tool.method} ${tool.endpoint}.`,
          parameters: {
            type: 'object',
            properties: {
              requestBody: { type: 'string', description: 'JSON string of any required request body' },
              query_params: { type: 'string', description: 'URL encoded query parameters to append (e.g. ?q=test)' }
            },
            required: []
          }
        },
        // Store execution metadata so our runner knows how to execute it when called
        executionMeta: {
          endpoint: tool.endpoint,
          method: tool.method,
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
 * Execute the external tool using the metadata captured during initialization
 */
async function executeTool(toolName, args, dynamicToolsList) {
  try {
    const toolDef = dynamicToolsList.find(t => t.function.name === toolName);
    
    if (!toolDef) {
       // Support legacy calculate_math fallback if needed
       if (toolName === 'calculate_math') {
          return String(new Function(`return ${args.expression}`)());
       }
       return `Error: Tool ${toolName} not found in active registry.`;
    }

    const { endpoint, method, headers } = toolDef.executionMeta;
    let url = endpoint;
    if (args.query_params) {
      url += (url.includes('?') ? '&' : '?') + args.query_params;
    }

    let parsedHeaders = {};
    try { parsedHeaders = JSON.parse(headers); } catch(e){}

    let data = undefined;
    if (args.requestBody) {
      try { data = JSON.parse(args.requestBody); } catch(e){ data = args.requestBody; }
    }

    const res = await axios({ method, url, data, headers: parsedHeaders });
    return JSON.stringify(res.data);
  } catch (error) {
    return 'Tool Execution Error: ' + (error.response?.data ? JSON.stringify(error.response.data) : error.message);
  }
}

module.exports = { getDynamicTools, executeTool };
