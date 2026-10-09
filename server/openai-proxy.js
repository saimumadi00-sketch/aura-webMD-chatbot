/*
 * Private API boundary: load server credentials, validate method/origin/model, bound requests, and forward sanitized responses.
 */

import { loadEnv } from 'vite';
import { readSSE } from '../src/utils/sse.js';

// Only this server module reads credentials. Never import it from src/.
export function openAIProxy({ env = { ...loadEnv('development', process.cwd(), ''), ...process.env }, fetchImpl = fetch } = {}) {
  // Explicit process values override private dotenv values; injections allow isolated request checks.
  let requests = 0;
  let windowStart = Date.now();
  let active = 0;
  return async (req, res, next = () => { res.statusCode = 404; res.end(); }) => {
    const endpoints = {
      '/api/openai/chat/completions': 'chat/completions',
      '/api/openai/responses': 'responses',
    };
    const endpoint = Object.hasOwn(endpoints, req.url) ? endpoints[req.url] : null;
    // Let other middleware handle unrelated paths; only these two routes can reach OpenAI.
    if (!endpoint) return next();
    const send = (status, data) => {
      if (res.destroyed || res.writableEnded) return;
      // AI replies should not be cached by browsers or intermediaries.
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(data));
    };
    if (req.method !== 'POST') return send(405, { error: 'POST required' });
    // Development infers localhost; deployments must set their exact public origin.
    const origin = env.APP_ORIGIN || `http://${req.headers.host}`;
    if (req.headers.origin !== origin) return send(403, { error: 'Origin rejected' });
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'JSON required' });
    // Shared per-process limits keep guest requests bounded without requiring an account.
    if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); requests = 0; }
    if (++requests > 30 || active >= 4) return send(429, { error: 'Please try again later' });
    const key = env.OPENAI_API_KEY?.trim();
    if (!key || /REPLACE_ME|YOUR_OPENAI_API_KEY|ADD_KEY_HERE/.test(key)) return send(503, { error: 'AI service not configured' });
    active++;
    const controller = new AbortController();
    const disconnect = () => controller.abort();
    res.on?.('close', disconnect);
    try {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > 2 * 1024 * 1024) return send(413, { error: 'Request too large' });
        chunks.push(buffer);
      }
      // Decode once: a network chunk can end in the middle of a UTF-8 character.
      const body = Buffer.concat(chunks).toString('utf8');
      let data;
      try { data = JSON.parse(body); } catch { return send(400, { error: 'Invalid JSON' }); }
      if (!data || !['gpt-4o', 'gpt-4o-mini'].includes(data.model)) return send(400, { error: 'Invalid model' });
      if (Array.isArray(data) || typeof data !== 'object') return send(400, { error: 'Invalid request' });
      const text = value => typeof value === 'string' && value.length > 0 && value.length <= 100000;
      const validMessage = message => {
        if (!message || !['system', 'user', 'assistant'].includes(message.role)) return false;
        if (text(message.content)) return true;
        return message.role === 'user' && Array.isArray(message.content) && message.content.length > 0 && message.content.length <= 4 && message.content.every(part =>
          part?.type === 'text' ? text(part.text) : part?.type === 'image_url' && typeof part.image_url?.url === 'string' && part.image_url.url.length <= 750000 && /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(part.image_url.url));
      };
      if (endpoint === 'chat/completions' && (!Array.isArray(data.messages) || data.messages.length === 0 || data.messages.length > 51 || !data.messages.every(validMessage))) return send(400, { error: 'Invalid messages' });
      if (endpoint === 'responses' && !text(data.input)) return send(400, { error: 'Responses input must be text' });
      if (data.temperature !== undefined && (!Number.isFinite(data.temperature) || data.temperature < 0 || data.temperature > 1)) return send(400, { error: 'Invalid temperature' });
      if (data.stream !== undefined && typeof data.stream !== 'boolean') return send(400, { error: 'Invalid streaming option' });
      const streaming = endpoint === 'chat/completions' && data.stream === true;
      // Rebuild an allowlisted payload; clients cannot override endpoints or token caps.
      const payload = endpoint === 'responses'
        ? { model: data.model, input: data.input, store: false, max_output_tokens: 512 }
        : { model: data.model, messages: data.messages, temperature: data.temperature, max_tokens: 512, stream: streaming };
      const upstream = await fetchImpl(`https://api.openai.com/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', Authorization: `Bearer ${key}`,
          ...(env.OPENAI_PROJECT_ID ? { 'OpenAI-Project': env.OPENAI_PROJECT_ID } : {}),
        },
        body: JSON.stringify(payload), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
      });
      if (!upstream.ok) return send(upstream.status === 429 ? 429 : 502, { error: 'AI service unavailable' });
      if (streaming) {
        res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
        res.flushHeaders?.();
        let complete = false;
        let length = 0;
        for await (const event of readSSE(upstream.body)) {
          if (controller.signal.aborted || res.destroyed) return;
          if (event === '[DONE]') { complete = true; break; }
          const chunk = JSON.parse(event);
          if (chunk.error) throw new Error('Upstream stream failed');
          const delta = chunk.choices?.[0]?.delta;
          const content = delta?.content ?? delta?.refusal;
          if (typeof content !== 'string' || !content) continue;
          length += content.length;
          if (length > 100000) throw new Error('Reply too large');
          // Forward text only, preserving the existing private API boundary.
          if (!res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`)) {
            await new Promise(resolve => {
              const ready = () => { res.off('drain', ready); res.off('close', ready); resolve(); };
              res.once('drain', ready); res.once('close', ready);
            });
          }
        }
        if (!complete) throw new Error('Incomplete stream');
        res.end('data: [DONE]\n\n');
        return;
      }
      const result = await upstream.json();
      // Return only the fields consumed by the UI, never upstream headers/errors.
      return send(200, endpoint === 'responses'
        ? { output: result.output, output_text: result.output_text }
        : { choices: result.choices });
    } catch {
      if (res.headersSent) {
        if (!res.destroyed && !res.writableEnded) res.end('data: {"error":"AI response interrupted"}\n\n');
        return;
      }
      return send(502, { error: 'AI service unavailable' });
    } finally { res.off?.('close', disconnect); controller.abort(); active--; }
  };
}
