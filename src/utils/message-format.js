// Parse a small, predictable formatting subset. Rendering remains React text, never raw HTML.
export function parseMessageBlocks(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length;) {
    if (!lines[i].trim()) { i++; continue; }
    if (lines[i].startsWith('```')) {
      const language = lines[i++].slice(3).trim();
      const code = [];
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push({ type: 'code', language, text: code.join('\n') });
      continue;
    }
    const heading = lines[i].match(/^#{1,3}\s+(.+)/);
    if (heading) { blocks.push({ type: 'heading', text: heading[1] }); i++; continue; }
    const list = lines[i].match(/^\s*(?:([-*])|(\d+)\.)\s+(.+)/);
    if (list) {
      const ordered = !!list[2];
      const items = [];
      while (i < lines.length) {
        const item = lines[i].match(/^\s*(?:([-*])|(\d+)\.)\s+(.+)/);
        if (!item || !!item[2] !== ordered) break;
        items.push(item[3]); i++;
      }
      blocks.push({ type: ordered ? 'ordered' : 'list', items });
      continue;
    }
    const paragraph = [lines[i++]];
    while (i < lines.length && lines[i].trim() && !/^(?:```|#{1,3}\s|\s*(?:[-*]|\d+\.)\s)/.test(lines[i])) paragraph.push(lines[i++]);
    blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
  }
  return blocks;
}
