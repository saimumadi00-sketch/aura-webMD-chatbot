/*
 * Responses convenience adapter. Despite the historical filename, no browser SDK or private key is used.
 */

import { OPENAI_CONFIG } from '../config/constants';
import { exponentialBackoffFetch } from '../utils/helpers';

// Keep the Responses helper API while routing all requests through our server.
export const createResponse = async ({
  model = OPENAI_CONFIG.MODELS.balanced,
  input,
  store = false,
} = {}) => {
  try {
    return await exponentialBackoffFetch('/api/openai/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input, store }),
    });
  } catch {
    return { output_text: "Sorry, I couldn't reach the AI service right now." };
  }
};

export const createHaikuAboutAI = async (prompt = 'write a haiku about ai') => {
  const result = await createResponse({ model: OPENAI_CONFIG.MODELS.fast, input: prompt });
  return { text: result.output_text || result.output?.[0]?.content?.[0]?.text || 'No output returned.', raw: result };
};

export default { createResponse, createHaikuAboutAI };
