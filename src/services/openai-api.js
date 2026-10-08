import { OPENAI_CONFIG } from '../config/constants';
import { exponentialBackoffFetch, formatChatHistory, getSystemPrompt } from '../utils/helpers';

const buildFallbackResponse = (messages = [], overrideText) => {
  const lastUserEntry = [...messages].reverse().find((msg) => msg?.sender === 'user');
  const lastUserText = lastUserEntry?.text?.trim();
  const text =
    overrideText ??
    (lastUserText
      ? `I can't reach the AI service right now, but I hear you saying "${lastUserText}". Take a breath and let me know what you need next.`
      : "I can't reach the AI service right now, but I'm here with you. Let's take this moment together.");

  return {
    choices: [
      {
        message: { role: 'assistant', content: text },
      },
    ],
  };
};


const resolveModel = (modelKey) => {
  const map = OPENAI_CONFIG.MODELS || {};
  return map[modelKey] || OPENAI_CONFIG.DEFAULT_MODEL || 'gpt-4o-mini';
};

const toTemperature = (creativity = 50) => {
  const normalized = Number.isFinite(creativity) ? creativity : 50;
  return Math.min(1, Math.max(0, normalized / 100));
};

const buildChatPayload = (messages, preferences = {}) => ({
  model: resolveModel(preferences.model),
  messages: [
    { role: 'system', content: getSystemPrompt(preferences) },
    ...formatChatHistory(messages),
  ],
  temperature: toTemperature(preferences.creativity),
  max_tokens: 512,
  stream: false,
});

const OpenAIService = {
  sendChatMessage: async (messages, preferences = {}) => {

    const payload = buildChatPayload(messages, preferences);

    try {
      const response = await exponentialBackoffFetch(OPENAI_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return response;
    } catch (err) {
      console.error('OpenAI chat error:', err);
      return buildFallbackResponse(messages);
    }
  },

  callTool: async (userPrompt, systemPrompt = 'You are Aura, a supportive assistant.', preferences = {}) => {
    if (!userPrompt) {
      throw new Error('userPrompt is required');
    }


    const payload = {
      model: resolveModel(preferences.model),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: toTemperature(preferences.creativity),
      max_tokens: 512,
      stream: false,
    };

    try {
      return await exponentialBackoffFetch(OPENAI_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('OpenAI tool error:', err);
      return buildFallbackResponse([{ sender: 'user', text: userPrompt }]);
    }
  },
};

export default OpenAIService;
