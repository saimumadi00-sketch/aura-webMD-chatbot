import React from 'react';
import { parseMessageBlocks } from '../utils/message-format';

function inline(text) {
  return String(text).split(/(\[[^\]]+\]\((?:https?:\/\/|\/[A-Za-z0-9_-])[^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s<>]+|\/[A-Za-z0-9_-][^\s<>]*)/g).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    if (/^(https?:\/\/|\/[A-Za-z0-9_-])/.test(part)) {
      const url = part.replace(/[.,;!?]+$/, '');
      return <React.Fragment key={i}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a>{part.slice(url.length)}</React.Fragment>;
    }
    return part;
  });
}

export default function MessageContent({ text, plain = false }) {
  if (plain) return <div className="message-content"><p>{inline(text)}</p></div>;
  return <div className="message-content">{parseMessageBlocks(text).map((block, i) => {
    if (block.type === 'code') return <pre key={i}><code>{block.text}</code></pre>;
    if (block.type === 'heading') return <h3 key={i}>{inline(block.text)}</h3>;
    if (block.items) {
      const List = block.type === 'ordered' ? 'ol' : 'ul';
      return <List key={i}>{block.items.map((item, n) => <li key={n}>{inline(item)}</li>)}</List>;
    }
    return <p key={i}>{inline(block.text)}</p>;
  })}</div>;
}
