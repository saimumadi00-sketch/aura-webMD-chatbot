import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMessageBlocks } from '../src/utils/message-format.js';
import { getPlanPrice } from '../src/utils/plan-price.js';

test('annual prices disclose the total and each plan’s actual discount', () => {
  assert.deepEqual(getPlanPrice({ monthly: 15, yearly: 12 }, 'yearly'), { amount: 12, total: 144, savings: 20 });
  assert.deepEqual(getPlanPrice({ monthly: 100, yearly: 85 }, 'yearly'), { amount: 85, total: 1020, savings: 15 });
  assert.deepEqual(getPlanPrice({ monthly: 199, yearly: 169 }, 'yearly'), { amount: 169, total: 2028, savings: 15 });
  assert.deepEqual(getPlanPrice({ monthly: 100, yearly: 85 }, 'monthly'), { amount: 100, total: null, savings: 0 });
  assert.deepEqual(getPlanPrice({ monthly: 0, yearly: 0 }, 'yearly'), { amount: 0, total: null, savings: 0 });
  assert.deepEqual(getPlanPrice({ monthly: 'Custom', yearly: 'Custom' }, 'yearly'), { amount: 'Custom', total: null, savings: 0 });
});

test('assistant formatting separates paragraphs, lists, and literal code', () => {
  const blocks = parseMessageBlocks('## Next steps\r\nTake your time.\r\n\r\n- Breathe\r\n- Rest\r\n\r\n1. First\r\n2. Second\r\n\r\n```html\r\n<script>alert(1)</script>\r\n```');
  assert.deepEqual(blocks, [
    { type: 'heading', text: 'Next steps' },
    { type: 'paragraph', text: 'Take your time.' },
    { type: 'list', items: ['Breathe', 'Rest'] },
    { type: 'ordered', items: ['First', 'Second'] },
    { type: 'code', language: 'html', text: '<script>alert(1)</script>' },
  ]);
  assert.deepEqual(parseMessageBlocks('```js\nconst unfinished = true;'), [{ type: 'code', language: 'js', text: 'const unfinished = true;' }]);
  assert.deepEqual(parseMessageBlocks(''), []);
});
