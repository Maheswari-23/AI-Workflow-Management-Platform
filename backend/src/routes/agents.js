const express = require('express');
const router = express.Router();
const axios = require('axios');

// Basic stub routes
router.get('/', (req, res) => res.json({ message: 'Agents API working' }));
router.get('/:id', (req, res) => res.json({ message: 'Get agent ' + req.params.id }));

// 1 Tool: A simple math calculator that the LLM can call
const calculateMath = (expression) => {
  try {
    // Basic safe math evaluation for the tool demo
    // WARNING: In production, never use raw eval(). Use mathjs or similar parsing.
    // For this e2e proof-of-concept, we'll cleanly return the resolved value.
    const result = new Function(`return ${expression}`)();
    return result;
  } catch (error) {
    return "Error evaluating expression: " + error.message;
  }
};

// Tool Definition Schema (OpenAI format, supported entirely by Groq)
const tools = [
  {
    type: "function",
    function: {
      name: "calculate_math",
      description: "Evaluate simple mathematical expressions (e.g., '2 + 2', '256 * 42'). ONLY pass valid JS math expressions.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The mathematical expression to evaluate stringified. e.g., '45 / 5'",
          },
        },
        required: ["expression"],
      },
    },
  }
];

// E2E EXECUTE ROUTE: 1 Agent + 1 Tool + 1 LLM (Groq) + 1 Task
router.post('/:id/execute', async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;
    
    // We explicitly use Groq here as a 100% free OpenAI-compatible API
    const GROQ_API_KEY = process.env.GROQ_API_KEY; 
    
    if (!GROQ_API_KEY) {
      return res.status(401).json({ 
        result: "ERROR: Missing GROQ_API_KEY in backend/.env file.\n\nPlease get a 100% free API key from https://console.groq.com/keys and add it to your backend/.env as:\nGROQ_API_KEY=your_key_here\n\nThen restart the server." 
      });
    }

    // Agent definition (We inject the UI's system prompt or fall back to a default)
    const agentSystemPrompt = systemPrompt || "You are an AI mathematical assistant. You must use the calculate_math tool to answer any math questions. Only provide the final answer when you have the tool result.";

    let messages = [
      { role: "system", content: agentSystemPrompt },
      { role: "user", content: prompt }
    ];

    let executionLog = "Agent started...\n";

    // Standard OpenAI API structure, pointed directly to Groq's fast Llama endpoint
    const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
    
    const resolveCompletion = async (currentMessages) => {
      return await axios.post(groqEndpoint, {
        model: "llama-3.3-70b-versatile", // Free, ultra-fast model with strong tool calling
        messages: currentMessages,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    };

    executionLog += `Sending Prompt to LLM: "${prompt}"\n`;
    
    // 1st LLM Call
    const initialResponse = await resolveCompletion(messages);
    const messageOut = initialResponse.data.choices[0].message;
    messages.push(messageOut);

    // Check if the LLM decided to call the specific 1 Tool
    if (messageOut.tool_calls && messageOut.tool_calls.length > 0) {
      executionLog += `\nLLM decided to call a tool!\n`;
      
      for (const toolCall of messageOut.tool_calls) {
        if (toolCall.function.name === 'calculate_math') {
          const args = JSON.parse(toolCall.function.arguments);
          executionLog += `Executing Tool [calculate_math] with args: ${args.expression}\n`;
          
          // Execute local tool logic
          const toolResult = calculateMath(args.expression);
          executionLog += `Tool returned: ${toolResult}\n\n`;

          // Append tool result format
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: toolCall.function.name,
            content: String(toolResult)
          });
        }
      }

      // 2nd LLM Call (Passing the tool result back so it formulates a final message)
      executionLog += "Sending Tool Result back to LLM for final answer...\n";
      const finalResponse = await resolveCompletion(messages);
      const finalMessage = finalResponse.data.choices[0].message;
      
      executionLog += `\nAgent Final Output:\n${finalMessage.content}`;
      return res.json({ result: executionLog });
    } else {
      // LLM decided no tool was needed
      executionLog += `\nAgent Final Output (No tools used):\n${messageOut.content}`;
      return res.json({ result: executionLog });
    }

  } catch (error) {
    console.error("Agent Execution Error:", error.response ? error.response.data : error.message);
    return res.status(500).json({ 
      result: `Execution failed. \n${error.response?.data?.error?.message || error.message}` 
    });
  }
});

module.exports = router;
