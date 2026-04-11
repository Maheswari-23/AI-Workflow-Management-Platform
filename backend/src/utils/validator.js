/**
 * Light-weight Request Validator
 * Ensures incoming data matches the expected schema before touching the DB.
 */
function validateSchema(data, schema) {
  const errors = [];
  for (const [key, rules] of Object.entries(schema)) {
    const val = data[key];
    
    if (rules.required && (val === undefined || val === null || val === '')) {
      errors.push(`${key} is required`);
      continue;
    }

    if (val !== undefined && rules.type && typeof val !== rules.type) {
      errors.push(`${key} must be of type ${rules.type}`);
    }
  }
  return errors;
}

const AGENT_SCHEMA = {
  name: { required: true, type: 'string' },
  system_prompt: { type: 'string' }
};

const TASK_SCHEMA = {
  name: { required: true, type: 'string' },
  description: { type: 'string' },
  agents: { type: 'string' } // Serialized JSON string from frontend
};

const TOOL_SCHEMA = {
  name: { required: true, type: 'string' },
  type: { required: true, type: 'string' },
  endpoint: { type: 'string' }
};

module.exports = {
  validateSchema,
  schemas: {
    AGENT_SCHEMA,
    TASK_SCHEMA,
    TOOL_SCHEMA
  }
};
