// Optional browser regression check. Run Vite and a separate browser profile with
// remote debugging on loopback port 9223 before running npm run test:ui.
const appUrl = process.env.UI_BASE_URL || 'http://127.0.0.1:5173/';
const targets=await(await fetch(process.env.UI_DEBUG_URL || 'http://127.0.0.1:9223/json/list')).json();
const ws=new WebSocket(targets.find(t=>t.type==='page' && (t.url.startsWith(appUrl) || t.url==='about:blank'))?.webSocketDebuggerUrl);
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});ws.send(JSON.stringify({id:next,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const wait=()=>new Promise(r=>setTimeout(r,450));
const check=async(label,expression)=>{if(!await evaluate(expression))throw Error('FAILED: '+label);console.log('PASS',label);};
const click=async expression=>{await evaluate(expression+'.click()');await wait();};
const bounds=selector=>`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1;})()`;
// Palette changes must preserve element geometry, typography, and shadow shape.
const checkThemeParity = async label => {
 const original = await evaluate('document.documentElement.classList.contains("dark")');
 const snapshot = async dark => {
  await evaluate(`(()=>{document.documentElement.classList.toggle('dark',${dark}); document.body.classList.toggle('theme-dark',${dark}); document.body.classList.toggle('theme-light',${!dark}); document.querySelector('.welcome-page')?.classList.toggle('dark-mode',${dark}); const p=document.querySelector('.preferences-page'); if(p){p.classList.toggle('theme-dark',${dark});p.classList.toggle('theme-light',${!dark});}})()`);
  await wait();
  return evaluate(`([...document.querySelectorAll('#root *')].filter(e=>e.namespaceURI==='http://www.w3.org/1999/xhtml').map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(); const props=['display','position','fontFamily','fontSize','fontWeight','lineHeight','padding','margin','gap','borderWidth','borderStyle','borderRadius','gridTemplateColumns','flexDirection','alignItems'];return {tag:e.tagName,cls:e.className,shape:[r.x,r.y,r.width,r.height].map(v=>Math.round(v*4)/4),...Object.fromEntries(props.map(p=>[p,s[p]])),shadow:s.boxShadow.replace(/rgba?\\([^)]+\\)/g,'COLOR')};}))`);
 };
 try {
  const light=await snapshot(false),dark=await snapshot(true);
  const differences=light.map((item,i)=>({element:item.tag+'.'+item.cls,changes:Object.keys(item).filter(key=>key!=='cls'&&JSON.stringify(item[key])!==JSON.stringify(dark[i]?.[key])).map(key=>({key,light:item[key],dark:dark[i]?.[key]}))})).filter(item=>item.changes.length);
  if(differences.length)throw Error('Theme parity failed: '+label+'\n'+JSON.stringify(differences.slice(0,15),null,2));
  console.log('PASS',label+' theme geometry');
 } finally {await snapshot(original);}
};
try{
 await send('Page.enable');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Network.enable');await send('Network.setBlockedURLs',{urls:['*firestore.googleapis.com*','*identitytoolkit.googleapis.com*','*/api/openai/*']});
 await send('Page.navigate', {url: appUrl + '#/'}); await new Promise(r=>setTimeout(r,2000));
 for (let attempt = 0; attempt < 30; attempt++) {
  if (await evaluate('document.querySelector("#root")?.textContent.trim().length > 0 && (document.body.classList.contains("theme-dark") || document.body.classList.contains("theme-light"))')) break;
  await wait();
 }
 await check('frontend is ready', 'document.querySelector("#root")?.textContent.trim().length > 0');
 // The linked PHP portal writes the same device preference from another tab.
 const initialMode = await evaluate('document.documentElement.classList.contains("dark")');
 await evaluate(`window.dispatchEvent(new StorageEvent('storage',{key:'aura-theme',newValue:${JSON.stringify(initialMode ? 'light' : 'dark')}}))`); await wait();
 await check('portal theme preference updates the frontend', `document.documentElement.classList.contains('dark')===${!initialMode}`);
 await evaluate(`window.dispatchEvent(new StorageEvent('storage',{key:'aura-theme',newValue:${JSON.stringify(initialMode ? 'dark' : 'light')}}))`); await wait();
 for(const width of [320,390,768,1366]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
  for(const route of ['/','/login','/register','/welcome','/billing']){
   await evaluate(`location.hash=${JSON.stringify('#'+route)};window.scrollTo(0,0)`);await wait();
   await check(`${route} fits ${width}px`, 'document.documentElement.scrollWidth<=innerWidth && document.querySelector("#root").textContent.trim().length>0 && !document.querySelector("vite-error-overlay")');
   await checkThemeParity(`${route} ${width}px`);
   if (route !== '/welcome') {
    await check(`theme button visible ${route} ${width}px`, bounds('.theme-toggle'));
    const dark = await evaluate('document.documentElement.classList.contains("dark")');
    await click('document.querySelector(".theme-toggle")');
    await check(`theme button works ${route} ${width}px`, `document.documentElement.classList.contains('dark')===${!dark}`);
    await click('document.querySelector(".theme-toggle")');
   }
  }
  await evaluate('location.hash="#/welcome";window.scrollTo(0,0)');await wait();
  await click('document.querySelector(".register-cta")');
  await check(`welcome registration visible ${width}px`,bounds('.sign-up-container input'));
  await check(`inactive form cannot receive focus ${width}px`,'document.querySelector(".sign-in-container").inert');
  await click('document.querySelector(".register-cta")');await click('document.querySelector(".guest-btn")');
  await check(`empty-chat composer visible ${width}px`,bounds('.chat-active-composer'));
  await check(`chat theme button visible ${width}px`,bounds('.theme-toggle'));
  await check(`image upload available before first message ${width}px`, `!!document.querySelector('button[aria-label="Upload image"]')`);
  await checkThemeParity(`empty chat ${width}px`);
  await check(`chat does not scroll the page ${width}px`,'document.documentElement.scrollHeight<=innerHeight+1');
  if(width<=900){await click('document.querySelector(".mobile-menu-button")');await check(`drawer visible ${width}px`,bounds('.sidebar'));}
  await click('[...document.querySelectorAll(".nav-item")].find(e=>e.textContent.includes("Preferences"))');
  const preferenceValues = await evaluate('[...document.querySelectorAll(".preferences-page input, .preferences-page textarea")].map(e=>e.value)');
  const initialDark = await evaluate('document.documentElement.classList.contains("dark")');
  await click('document.querySelector(".preferences-page header button[aria-label]")');
  await check(`theme switch changes mode ${width}px`, `document.documentElement.classList.contains('dark')===${!initialDark}`);
  await check(`theme switch preserves settings ${width}px`, `JSON.stringify([...document.querySelectorAll('.preferences-page input, .preferences-page textarea')].map(e=>e.value))===${JSON.stringify(JSON.stringify(preferenceValues))}`);
  await click('document.querySelector(".preferences-page header button[aria-label]")');
  for(const tab of ['AI Configuration','General & Profile','Data & Privacy']){
   await click(`[...document.querySelectorAll('.preferences-sidebar-card button')].find(e=>e.textContent.includes(${JSON.stringify(tab)}))`);
   await check(`${tab} fits ${width}px`,'document.documentElement.scrollWidth<=innerWidth');
   await checkThemeParity(`${tab} ${width}px`);
  }
  await click('[...document.querySelectorAll("button")].find(e=>e.textContent==="Back to chat")');
  await evaluate('(()=>{window.initialChatComposer=document.querySelector("textarea");})()');
  await evaluate(`(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Can I talk to a human?');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await wait();
  await click('document.querySelector(".tool-btn.primary")');
  await check(`active composer visible ${width}px`,bounds('.chat-active-composer'));
  await check(`sending preserves composer and focus ${width}px`, 'document.querySelector("textarea")===window.initialChatComposer && document.activeElement===window.initialChatComposer');
  await checkThemeParity(`active chat ${width}px`);
  await check(`booking link rendered ${width}px`,'!!document.querySelector(".message-bubble a")');
  await click('document.querySelector(".pill-upgrade")');
  await check(`summary dialog fits ${width}px`,bounds('[role="dialog"]'));
  await checkThemeParity(`summary dialog ${width}px`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await wait();
  await check(`dialog Escape restores focus ${width}px`,'!document.querySelector("[role=dialog]") && document.activeElement.textContent==="Summary"');
 }
 console.log('All browser layout and interaction checks passed.');
}finally{await send('Network.setBlockedURLs',{urls:[]});ws.close();}
