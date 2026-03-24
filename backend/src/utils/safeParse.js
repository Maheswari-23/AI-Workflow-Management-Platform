/**
 * Safely parse JSON or return a fallback value.
 * Prevents 500 Internal Server Errors when DB contains malformed strings.
 */
function safeParse(json, fallback = []) {
  if (!json) return fallback;
  if (typeof json === 'object') return json;
  try {
    return JSON.parse(json);
  } catch (err) {
    console.error('[SafeParse] Failed to parse JSON:', json, err.message);
    return fallback;
  }
}

module.exports = safeParse;
