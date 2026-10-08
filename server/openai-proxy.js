import { loadEnv } from 'vite';

// Only this server module reads credentials. Never import it from src/.
export function openAIProxy({ env = { ...loadEnv('development', process.cwd(), ''), ...process.env }, fetchImpl = fetch } = {}) {
  let requests = 0;
  let windowStart = Date.now();
  let active = 0;
  return async (req, res, next = () => { res.statusCode = 404; res.end(); }) => {
    const endpoints = {
      '/api/openai/chat/completions': 'chat/completions',
      '/api/openai/responses': 'responses',
    };
    const endpoint = endpoints[req.url];
    if (!endpoint) return next();
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(data));
    };
    if (req.method !== 'POST') return send(405, { error: 'POST required' });
    const origin = env.APP_ORIGIN || `http://${req.headers.host}`;
    if (req.headers.origin !== origin) return send(403, { error: 'Origin rejected' });
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'JSON required' });
    if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); requests = 0; }
    if (++requests > 30 || active >= 4) return send(429, { error: 'Please try again later' });
    const key = env.OPENAI_API_KEY?.trim();
    if (!key || /REPLACE_ME|YOUR_OPENAI_API_KEY|ADD_KEY_HERE/.test(key)) return send(503, { error: 'AI service not configured' });
    active++;
    try {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > 2 * 1024 * 1024) return send(413, { error: 'Request too large' });
        chunks.push(buffer);
      }
      const body = Buffer.concat(chunks).toString('utf8');
      let data;
      try { data = JSON.parse(body); } catch { return send(400, { error: 'Invalid JSON' }); }
      if (!data || !['gpt-4o', 'gpt-4o-mini'].includes(data.model)) return send(400, { error: 'Invalid model' });
      const payload = endpoint === 'responses'
        ? { model: data.model, input: data.input, store: data.store === true, max_output_tokens: 512 }
        : { model: data.model, messages: data.messages, temperature: data.temperature, max_tokens: 512, stream: false };
      const upstream = await fetchImpl(`https://api.openai.com/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', Authorization: `Bearer ${key}`,
          ...(env.OPENAI_PROJECT_ID ? { 'OpenAI-Project': env.OPENAI_PROJECT_ID } : {}),
        },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(30000),
      });
      if (!upstream.ok) return send(upstream.status === 429 ? 429 : 502, { error: 'AI service unavailable' });
      const result = await upstream.json();
      // Return only the fields consumed by the UI, never upstream headers/errors.
      return send(200, endpoint === 'responses'
        ? { output: result.output, output_text: result.output_text }
        : { choices: result.choices });
    } catch {
      return send(502, { error: 'AI service unavailable' });
    } finally { active--; }
  };
}
