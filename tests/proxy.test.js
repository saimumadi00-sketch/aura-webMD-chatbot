import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { openAIProxy } from '../server/openai-proxy.js';
import path from 'node:path';
import { shouldPackagePortalFile } from '../scripts/portal-package-filter.js';

function request(proxy, body, options = {}) {
  const req = Readable.from(options.chunks || [JSON.stringify(body)]);
  req.url = options.url || '/api/openai/chat/completions';
  req.method = options.method || 'POST';
  req.headers = { origin: options.origin || 'http://local', 'content-type': 'application/json' };
  const res = { writeHead(status) { this.status = status; }, end(value) { this.body = JSON.parse(value); } };
  return proxy(req, res).then(() => res);
}
const valid = { model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Hello' }] };

test('portal packaging excludes patient uploads and local environment files', () => {
  const root = path.resolve('doctors_portal');
  for (const relative of ['uploads', 'uploads/patient.pdf', '.env', 'admin/.env.local']) assert.equal(shouldPackagePortalFile(root, path.join(root, relative)), false);
  for (const relative of ['index.php', 'admin/chat_pdf.php', 'assets/style.css']) assert.equal(shouldPackagePortalFile(root, path.join(root, relative)), true);
});

test('proxy forwards legitimate Unicode without exposing credentials and enforces output caps', async () => {
  const content = 'বাংলা';
  const data = { ...valid, messages: [{ role: 'user', content }], max_tokens: 999999 };
  const raw = Buffer.from(JSON.stringify(data));
  const split = raw.indexOf(Buffer.from(content)) + 1;
  const proxy = openAIProxy({ env: { OPENAI_API_KEY: 'private-secret', APP_ORIGIN: 'http://local' }, fetchImpl: async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(init.headers.Authorization, 'Bearer private-secret');
    assert.equal(JSON.parse(init.body).max_tokens, 512);
    assert.equal(JSON.parse(init.body).messages[0].content, content);
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Reply' } }], secret: 'private-secret' }) };
  } });
  const result = await request(proxy, data, { chunks: [raw.subarray(0, split), raw.subarray(split)] });
  assert.equal(result.status, 200);
  assert.ok(!JSON.stringify(result.body).includes('private-secret'));
});

test('proxy rejects malformed input, untrusted origins, oversized bodies, and disallowed remote images', async () => {
  let calls = 0;
  const proxy = openAIProxy({ env: { OPENAI_API_KEY: 'private-secret', APP_ORIGIN: 'http://local' }, fetchImpl: async () => { calls++; } });
  assert.equal((await request(proxy, valid, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await request(proxy, valid, { method: 'GET' })).status, 405);
  for (const body of [{ model: 'gpt-4o-mini' }, { ...valid, messages: [] }, { ...valid, messages: [{ role: 'tool', content: 'x' }] }, { ...valid, temperature: 4 }, { ...valid, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: 'https://example.com/image.png' } }] }] }]) {
    assert.equal((await request(proxy, body)).status, 400);
  }
  assert.equal((await request(proxy, null, { chunks: [Buffer.alloc(2 * 1024 * 1024 + 1)] })).status, 413);
  assert.equal(calls, 0);
});

test('upstream error content is hidden and Responses storage is disabled', async () => {
  const env = { OPENAI_API_KEY: 'private-secret', APP_ORIGIN: 'http://local' };
  const proxy = openAIProxy({ env, fetchImpl: async (url, init) => {
    assert.equal(JSON.parse(init.body).store, false);
    return { ok: true, json: async () => ({ output_text: 'Hello', output: [] }) };
  } });
  assert.equal((await request(proxy, { model: 'gpt-4o-mini', input: 'Hello', store: true }, { url: '/api/openai/responses' })).status, 200);
  const failing = openAIProxy({ env, fetchImpl: async () => { throw new Error('private-secret'); } });
  const response = await request(failing, valid);
  assert.equal(response.status, 502);
  assert.ok(!JSON.stringify(response.body).includes('private-secret'));
});
