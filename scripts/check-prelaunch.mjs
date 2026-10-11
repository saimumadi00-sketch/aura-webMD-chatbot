// Local CDP checks. Start Vite and a separate Edge debugging profile on port 9223.
import { writeFile } from 'node:fs/promises';
const app = process.env.UI_BASE_URL || 'http://127.0.0.1:5173/';
const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const ws = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
const analyticsRequests = [];
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Network.requestWillBeSent' && /google-analytics|googletagmanager|analytics\.google/.test(message.params.request.url)) analyticsRequests.push(message.params.request.url);
  if (!message.id) return;
  const callback = pending.get(message.id); pending.delete(message.id);
  if (message.error) callback.reject(Error(JSON.stringify(message.error))); else callback.resolve(message.result);
};
const send = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); ws.send(JSON.stringify({ id: next, method, params })); });
const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
const wait = () => new Promise(resolve => setTimeout(resolve, 350));
const until = async expression => { for (let i = 0; i < 50; i++) { if (await evaluate(expression)) return; await wait(); } throw Error(`Timed out: ${expression}`); };
const check = async (label, expression) => { if (!await evaluate(expression)) throw Error(label); console.log('PASS', label); };
try {
  await send('Page.enable'); await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['*firestore.googleapis.com*', '*identitytoolkit.googleapis.com*', '*/api/openai/*', '*google-analytics.com*', '*googletagmanager.com*', '*analytics.google.com*'] });
  await send('Page.navigate', { url: app }); await until('!!document.querySelector(".landing")');
  await evaluate('localStorage.removeItem("aura-analytics-consent")');
  await send('Page.reload'); await wait(); await until('!!document.querySelector(".landing .analytics-consent")');
  await check('analytics defaults to off', 'document.querySelector(".analytics-consent [role=status]").textContent.includes("off")');
  if (analyticsRequests.length) throw Error('Analytics attempted before consent');
  await check('public landing does not fetch Firebase or PDF code', '!performance.getEntriesByType("resource").some(entry=>/firebase|jspdf/.test(entry.name))');
  await evaluate('window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})');
  await check('landing is scrolled before navigation', 'scrollY>100');
  await evaluate('[...document.querySelectorAll(".landing-footer a")].find(anchor=>anchor.pathname==="/privacy").click()');
  await until('!!document.querySelector(".public-info h1")');
  await check('navigation immediately resets page scroll', 'scrollY===0');
  for (const path of ['privacy', 'terms', 'contact']) {
    await send('Page.navigate', { url: app + path }); await wait(); await until('!!document.querySelector(".public-info h1")');
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 844, deviceScaleFactor: 1, mobile: false });
    await check(`${path} fits mobile`, 'document.documentElement.scrollWidth<=innerWidth');
    await check(`${path} has route metadata`, `document.title.toLowerCase().includes(${JSON.stringify(path === 'terms' ? 'usage' : path)})`);
  }
  await send('Page.navigate', { url: app + 'privacy' }); await wait(); await until('!!document.querySelector(".public-info .analytics-consent")');
  await evaluate('document.querySelector(".analytics-consent").open=true;document.querySelectorAll(".analytics-consent button")[1].click()');
  await check('consent opt-in persists', 'localStorage.getItem("aura-analytics-consent")==="granted"');
  await evaluate('document.querySelector(".analytics-consent button").click()');
  await check('withdrawal persists', 'localStorage.getItem("aura-analytics-consent")==="denied"');
  await send('Page.navigate', { url: app + '#/welcome' }); await until('!!document.querySelector(".guest-btn")');
  await check('old hash bookmark becomes a normal path', 'location.pathname==="/welcome" && !location.hash');
  await evaluate('document.querySelector(".guest-btn").click()'); await until('!!document.querySelector(".chat-active textarea")');
  if (analyticsRequests.length) throw Error('Analytics attempted without consent in the session');
  const attach = `async function(){const canvas=document.createElement('canvas');canvas.width=2000;canvas.height=1000;const context=canvas.getContext('2d');context.fillStyle='#005dcc';context.fillRect(0,0,2000,1000);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));const file=new File([blob],'test-image.png',{type:'image/png'});const transfer=new DataTransfer();transfer.items.add(file);const input=document.querySelector('input[type=file]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));}`;
  await evaluate(`(${attach})()`); await until('!!document.querySelector(".attachment-thumb img")');
  await check('upload is re-encoded and resized with reserved dimensions', 'document.querySelector(".attachment-thumb img").src.startsWith("data:image/webp;") && document.querySelector(".attachment-thumb img").getAttribute("width")==="1600" && document.querySelector(".attachment-thumb img").getAttribute("height")==="800"');
  await evaluate('document.querySelector(".attachment-remove").click()');
  await evaluate(`(()=>{const input=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'Can I talk to a human?');input.dispatchEvent(new Event('input',{bubbles:true}));})()`); await wait();
  await evaluate('document.querySelector(".tool-btn.primary").click()'); await until('!!document.querySelector(".message-bubble.bot")');
  await evaluate('window.originalDecode=createImageBitmap;window.createImageBitmap=file=>new Promise(resolve=>{window.finishDecode=()=>window.originalDecode(file).then(resolve)});');
  await evaluate(`(${attach})()`); await until('typeof window.finishDecode==="function"');
  await evaluate('document.querySelector(".new-chat-btn").click()'); await until('!document.querySelector(".message-bubble")');
  await evaluate('window.finishDecode()'); await wait();
  await check('pending upload cannot reappear after clearing a chat', '!document.querySelector(".attachment-thumb img")');
  await evaluate('window.createImageBitmap=window.originalDecode');
  await send('Page.navigate', { url: app + 'unknown-audit-page' }); await until('document.querySelector("#root").textContent.includes("Page not found")');
  await check('unknown route is excluded from search', 'document.querySelector("meta[name=robots]").content.startsWith("noindex")');
  // Render the code-native SVG card once into the committed social PNG asset.
  if (process.argv.includes('--render-card')) {
    await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: app + 'social-card.svg' }); await wait();
    const screenshot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
    await writeFile('public/social-card.png', Buffer.from(screenshot.data, 'base64'));
    console.log('Rendered social-card.png from the SVG source.');
  }
  console.log('Prelaunch browser checks passed.');
} finally { await send('Network.setBlockedURLs', { urls: [] }); ws.close(); }
