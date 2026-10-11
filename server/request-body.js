// Bound upload time as well as bytes; the upstream timeout starts too late for uploads.
export async function readRequestBody(req, timeoutMs = 10000) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('Upload timed out'), { status: 408 })), timeoutMs);
  });
  const iterator = req[Symbol.asyncIterator]();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await Promise.race([iterator.next(), deadline]);
      if (chunk.done) return Buffer.concat(chunks).toString('utf8');
      const buffer = Buffer.isBuffer(chunk.value) ? chunk.value : Buffer.from(chunk.value);
      bytes += buffer.length;
      if (bytes > 2 * 1024 * 1024) throw Object.assign(new Error('Request too large'), { status: 413 });
      chunks.push(buffer);
    }
  } finally { clearTimeout(timer); }
}
