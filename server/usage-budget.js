import { mkdir, readFile, writeFile, rename, rm, rmdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHmac, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';

const rejected = (status, message) => Object.assign(new Error(message), { status, publicMessage: message });
function canonicalAddress(address) {
  if (isIP(address) === 4) return address;
  const host = new URL(`http://[${address}]`).hostname.slice(1, -1);
  if (host.startsWith('::ffff:')) {
    const tail = host.slice(7).split(':').map(value => Number.parseInt(value, 16));
    return [tail[0] >> 8, tail[0] & 255, tail[1] >> 8, tail[1] & 255].join('.');
  }
  return host;
}

export function createUsageGuard(env) {
  // Reserve a conservative full-context request, including output, before sending it.
  // Review these amounts when provider pricing/models change; never refund failed attempts.
  const reservations = { 'gpt-4o': 350000, 'gpt-4o-mini': 25000 }; // millionths of USD
  const budget = Math.floor(Number(env.AI_DAILY_BUDGET_USD) * 1000000);
  const secret = env.AI_QUOTA_SECRET?.trim();
  const path = resolve(env.AI_USAGE_FILE || 'private/ai-usage.json');
  const lock = `${path}.lock`;
  return async (req, model) => {
    if (!Number.isSafeInteger(budget) || budget <= 0 || !secret || secret.length < 32) {
      throw rejected(503, 'AI is paused until a daily budget and quota secret are configured.');
    }
    let address = req.socket?.remoteAddress;
    // Trust only a single address overwritten by an explicitly configured loopback proxy.
    if (env.AI_TRUST_LOOPBACK_PROXY === 'true' && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) address = req.headers['x-real-ip'];
    if (typeof address !== 'string' || !isIP(address)) throw rejected(503, 'AI client verification unavailable.');
    try { address = canonicalAddress(address); }
    catch { throw rejected(503, 'AI client verification unavailable.'); }
    const identity = createHmac('sha256', secret).update(address).digest('hex');
    const now = Date.now();
    const date = new Date(now).toISOString().slice(0, 10);
    let acquired = false;
    try {
      await mkdir(dirname(path), { recursive: true });
      // Atomic lock works across processes sharing the same filesystem. Stale locks fail closed.
      for (let attempt = 0; attempt < 20; attempt++) {
        try { await mkdir(lock); acquired = true; break; }
        catch (error) {
          if (error.code !== 'EEXIST') throw error;
          await new Promise(resolve => setTimeout(resolve, 25));
        }
      }
      if (!acquired) throw rejected(503, 'AI usage storage temporarily unavailable.');
      let ledger;
      try { ledger = JSON.parse(await readFile(path, 'utf8')); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      // Check even an old ledger before resetting: corruption must never reset the spending cap.
      if (ledger && (ledger.version !== 1 || typeof ledger.date !== 'string' || !Number.isSafeInteger(ledger.reserved) || ledger.reserved < 0 || !ledger.clients || typeof ledger.clients !== 'object' || Array.isArray(ledger.clients))) throw new Error('Invalid ledger');
      if (!ledger || ledger.date !== date) ledger = { version: 1, date, reserved: 0, clients: {} };
      const entry = ledger.clients[identity] || { daily: 0, window: now, minute: 0 };
      if (![entry.daily, entry.window, entry.minute].every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error('Invalid quota');
      if (now - entry.window >= 60000) { entry.window = now; entry.minute = 0; }
      if (entry.daily >= 10 || entry.minute >= 3) throw rejected(429, 'Guest limit reached. Try later; the daily limit resets at midnight UTC.');
      const cost = reservations[model];
      if (!cost || ledger.reserved + cost > budget) throw rejected(429, 'The daily AI budget has been reached. Please try tomorrow.');
      if (!ledger.clients[identity] && Object.keys(ledger.clients).length >= 10000) throw rejected(429, 'Daily AI capacity reached.');
      entry.daily++; entry.minute++;
      ledger.clients[identity] = entry;
      ledger.reserved += cost;
      const temporary = `${path}.${randomUUID()}.tmp`;
      try { await writeFile(temporary, JSON.stringify(ledger), { mode: 0o600, flag: 'wx' }); await rename(temporary, path); }
      finally { await rm(temporary, { force: true }); }
      return identity;
    } catch (error) {
      if (error.publicMessage) throw error;
      throw rejected(503, 'AI usage storage temporarily unavailable.');
    } finally { if (acquired) await rmdir(lock).catch(() => {}); }
  };
}
