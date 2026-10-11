import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createServer, request as httpRequest } from 'node:http';
import { openAIProxy as createProxy } from '../server/openai-proxy.js';
const openAIProxy = options => createProxy({ ...options, usageGuard: async () => {}, logger: () => {} });
import { validImageDataURL } from '../server/image-validation.js';

function request(proxy, body, options = {}) {
  const req = Readable.from(options.chunks || [JSON.stringify(body)]);
  req.url = options.url || '/api/openai/chat/completions';
  req.method = options.method || 'POST';
  req.headers = { origin: options.origin || 'http://local', 'content-type': 'application/json' };
  const res = { writeHead(status) { this.status = status; }, end(value) { this.body = JSON.parse(value); } };
  return proxy(req, res).then(() => res);
}
const valid = { model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Hello' }] };

test('proxy forwards legitimate Unicode without exposing credentials and enforces output caps', async () => {
  const content = 'বাংলা';
  const data = { ...valid, messages: [{ role: 'user', content }], max_tokens: 999999 };
  const raw = Buffer.from(JSON.stringify(data));
  const split = raw.indexOf(Buffer.from(content)) + 1;
  const proxy = openAIProxy({ env: { OPENAI_API_KEY: 'private-secret', APP_ORIGIN: 'http://local' }, fetchImpl: async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(init.headers.Authorization, 'Bearer private-secret');
    assert.equal(JSON.parse(init.body).max_tokens, 512);
    assert.equal(JSON.parse(init.body).messages.at(-1).content, content);
    assert.equal(JSON.parse(init.body).messages[0].role, 'system');
    assert.equal(JSON.parse(init.body).store, false);
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

test('proxy rejects fake/mismatched images and accepts a legitimate image attachment', async () => {
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMZkAAAAASUVORK5CYII=';
  let calls = 0;
  const proxy = openAIProxy({ env: { OPENAI_API_KEY: 'test-only', APP_ORIGIN: 'http://local' }, fetchImpl: async () => {
    calls++; return { ok: true, json: async () => ({ choices: [] }) };
  } });
  const image = url => ({ ...valid, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url } }] }] });
  for (const url of ['data:image/png;base64,SGVsbG8=', `data:image/jpeg;base64,${png}`, `data:image/png;base64,${png}==`]) {
    assert.equal((await request(proxy, image(url))).status, 400);
  }
  assert.equal(calls, 0);
  assert.equal((await request(proxy, image(`data:image/png;base64,${png}`))).status, 200);
  assert.equal(calls, 1);
  const oversizedDimensions = Buffer.from(png, 'base64');
  oversizedDimensions.writeUInt32BE(100000, 16);
  assert.equal(validImageDataURL(`data:image/png;base64,${oversizedDimensions.toString('base64')}`), false);
  assert.equal(validImageDataURL(`data:image/gif;base64,${Buffer.alloc(512 * 1024 + 1).toString('base64')}`), false);
  assert.equal(validImageDataURL('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), true);
  const invalidMagic = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  for (let i = 0; i < 6; i++) invalidMagic[i] |= 0x80;
  assert.equal(validImageDataURL(`data:image/gif;base64,${invalidMagic.toString('base64')}`), false);
  assert.equal(validImageDataURL('data:image/webp;base64,SGVsbG8='), false);
});

test('slow request bodies receive 408 and release every concurrency slot', async () => {
  let upstreamCalls = 0;
  const server = createServer(openAIProxy({ bodyTimeoutMs: 150, env: { OPENAI_API_KEY: 'test-only', APP_ORIGIN: 'http://local' }, fetchImpl: async () => {
    upstreamCalls++; return { ok: true, json: async () => ({ choices: [] }) };
  } }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const pendingClients = [];
  const send = slow => new Promise((resolve, reject) => {
    const client = httpRequest({ host: '127.0.0.1', port: server.address().port, path: '/api/openai/chat/completions', method: 'POST', headers: { Origin: 'http://local', 'Content-Type': 'application/json' } }, response => {
      let body = '';
      response.on('data', data => { body += data; });
      response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(body), connection: response.headers.connection }));
    });
    pendingClients.push(client);
    client.on('error', reject);
    if (slow) client.write('{"model":');
    else client.end(JSON.stringify(valid));
  });
  try {
    const slowResponses = await Promise.all(Array.from({ length: 4 }, () => send(true)));
    for (const response of slowResponses) {
      assert.equal(response.status, 408);
      assert.equal(response.connection, 'close');
      assert.equal(response.body.error, 'Upload timed out');
    }
    assert.equal(upstreamCalls, 0);
    assert.equal((await send(false)).status, 200);
    assert.equal(upstreamCalls, 1);
  } finally {
    pendingClients.forEach(client => client.destroy());
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
