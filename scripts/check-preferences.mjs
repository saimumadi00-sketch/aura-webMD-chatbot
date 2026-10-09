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
 await send('Page.navigate',{url:appUrl+'#/welcome'});
 for(let n=0;n<40;n++){if(await evaluate('!!document.querySelector(".guest-btn")'))break;await wait();}
 await click('document.querySelector(".guest-btn")');
 await send('Emulation.setDeviceMetricsOverride',{width:1366,height:1000,deviceScaleFactor:1,mobile:false});await wait();
 await click('[...document.querySelectorAll(".nav-item")].find(e=>e.textContent.includes("Preferences"))');
 await check('unchanged preferences cannot be saved','document.querySelector(".save-button").disabled');
 await evaluate('document.querySelector("input[type=range]").focus()');
 const previous=await evaluate('Number(document.querySelector("input[type=range]").value)');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:previous===100?'ArrowLeft':'ArrowRight',code:previous===100?'ArrowLeft':'ArrowRight'});await wait();
 await check('slider supports keyboard input','Number(document.querySelector("input[type=range]").value)!=='+previous+' && !document.querySelector(".save-button").disabled');
 await evaluate('(()=>{const e=document.querySelector("textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(e,"Ask one question at a time.");e.dispatchEvent(new Event("input",{bubbles:true}));})()');await wait();
 await click('[...document.querySelectorAll(".preferences-sidebar-card button")].find(e=>e.textContent.includes("General"))');
 await check('unsaved AI changes remain accessible from other tabs','!!document.querySelector(".save-button") && !document.querySelector(".save-button").disabled');
 await click('[...document.querySelectorAll(".preferences-sidebar-card button")].find(e=>e.textContent.includes("AI Configuration"))');
 await click('document.querySelector(".theme-toggle")');
 await check('tab and theme switches preserve the draft','document.querySelector("textarea").value==="Ask one question at a time."');
 await evaluate('(()=>{window.preferencesSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==="aura-guest-preferences")throw Error("Test storage failure");return window.preferencesSetItem.call(this,key,value);};})()');
 await click('document.querySelector(".save-button")');
 await check('failed save keeps changes and exposes retry','!document.querySelector(".save-button").disabled && document.querySelector(".preferences-toast").textContent.includes("Could not save") && document.querySelector("textarea").value==="Ask one question at a time."');
 await evaluate('Storage.prototype.setItem=window.preferencesSetItem');
 await click('document.querySelector(".save-button")');
 await check('successful save persists supported settings','document.querySelector(".save-button").disabled && JSON.parse(localStorage.getItem("aura-guest-preferences")).customInstructions==="Ask one question at a time." && JSON.parse(localStorage.getItem("aura-guest-preferences")).webAccess===false');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await evaluate('window.scrollTo(0,0)');await wait();
 await check('mobile preferences fit','document.documentElement.scrollWidth<=innerWidth');
 console.log('Preferences interaction checks passed.');
}finally{await evaluate('(()=>{if(window.preferencesSetItem)Storage.prototype.setItem=window.preferencesSetItem;})()');await send('Network.setBlockedURLs',{urls:[]});ws.close();}
