import { readSSE } from '../utils/sse.js';

// One request per send. Never retry a partly delivered answer or silently duplicate it.
export async function fetchChatReply(url, payload, { signal, onText } = {}) {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, stream: true }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(35000)]) : AbortSignal.timeout(35000),
  });
  if (!response.ok) {
    const message = response.status === 503 ? 'AI is paused or unavailable. Please try later.' : response.status === 429 ? 'An AI quota or daily budget limit has been reached. Please try later.' : 'AI service unavailable';
    throw Object.assign(new Error(message), { publicMessage: message });
  }
  // Keep compatibility with a non-streaming development adapter.
  if (!response.headers.get('content-type')?.includes('text/event-stream')) return response.json();
  let text = '';
  let complete = false;
  for await (const event of readSSE(response.body)) {
    if (event === '[DONE]') { complete = true; break; }
    const chunk = JSON.parse(event);
    if (chunk.error) throw new Error('AI response interrupted');
    const delta = chunk.choices?.[0]?.delta?.content;
    if (typeof delta === 'string') {
      text += delta;
      if (text.length > 100000) throw new Error('Reply too large');
      onText?.(text);
    }
  }
  if (!complete || !text.trim()) throw new Error('AI response interrupted');
  return { choices: [{ message: { content: text } }] };
}
