// Decode data-only SSE across arbitrary network/UTF-8 boundaries, including CRLF.
export async function* readSSE(body) {
  if (!body?.getReader) throw new Error('Streaming response unavailable');
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data = [];
  let ended = false;
  try {
    while (!ended) {
      const chunk = await reader.read();
      ended = chunk.done;
      buffer += decoder.decode(chunk.value, { stream: !ended });
      if (buffer.length > 131072) throw new Error('Stream event too large');
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline).replace(/\r$/, '');
        buffer = buffer.slice(newline + 1);
        if (!line) {
          if (data.length) yield data.join('\n');
          data = [];
        } else if (line.startsWith('data:')) {
          data.push(line.slice(5).replace(/^ /, ''));
          if (data.join('\n').length > 131072) throw new Error('Stream event too large');
        }
      }
    }
    if (buffer.startsWith('data:')) data.push(buffer.slice(5).trimStart());
    if (data.length) yield data.join('\n');
  } finally {
    if (!ended) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
