// Browser interaction checks for chat motion and pricing. Use the same Vite/CDP setup as test:ui.
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

try {
 await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['*firestore.googleapis.com*','*identitytoolkit.googleapis.com*','*/api/openai/*']});
 await send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:appUrl+'#/billing'});
 for(let n=0;n<40;n++){if(await evaluate('!!document.querySelector(".billing-back")'))break;await wait();}
 await click('document.querySelector(".billing-back")');
 await check('direct public billing back returns home without an auth redirect','location.hash==="#/" && !!document.querySelector(".landing")');
 await click('document.querySelector(".nav-login")');
 await click('document.querySelector(".auth-link")');
 await check('registration is shown','location.hash==="#/register"');
 await click('document.querySelector(".auth-logo")');
 await check('register back returns to the originating login page','location.hash==="#/login"');
 await click('document.querySelector(".auth-logo")');
 await check('login back returns to landing','location.hash==="#/"');
 await click('document.querySelector(".primary-btn")');
 await click('document.querySelector("#backBtn")');
 await check('welcome back returns to landing','location.hash==="#/"');
 await click('document.querySelector(".primary-btn")');
 await click('document.querySelector(".guest-btn")');
 const openPreferences=async()=>click('[...document.querySelectorAll(".nav-item")].find(e=>e.textContent.includes("Preferences"))');
 await openPreferences();
 await check('preferences has its own history entry','location.hash==="#/preferences" && !!document.querySelector(".preferences-page")');
 await evaluate('history.back()');await wait();
 await check('browser back from preferences returns to chat','location.hash==="#/chat" && !!document.querySelector(".chat-active")');
 await evaluate('history.forward()');await wait();
 await check('browser forward restores preferences','location.hash==="#/preferences" && !!document.querySelector(".preferences-page")');
 await click('document.querySelector(".preferences-back")');
 await check('preferences back button returns to chat','location.hash==="#/chat" && !!document.querySelector(".chat-active")');
 await openPreferences();
 await click('document.querySelector(".preferences-header-actions .preference-button")');
 await click('document.querySelector(".auth-logo")');
 await check('login back restores the preferences page and guest session','location.hash==="#/preferences" && !!document.querySelector(".preferences-page")');
 await click('document.querySelector(".preferences-back")');
 await click('document.querySelector(".signout-btn")');
 await click('document.querySelector(".billing-back")');
 await check('billing back preserves the guest chat session','location.hash==="#/chat" && !!document.querySelector(".chat-active")');
 await send('Page.navigate',{url:appUrl+'#/register'});await wait();
 await click('document.querySelector(".auth-logo")');
 await check('direct registration back has a home fallback','location.hash==="#/"');
 console.log('Navigation checks passed.');
}finally{await send('Network.setBlockedURLs',{urls:[]});ws.close();}
