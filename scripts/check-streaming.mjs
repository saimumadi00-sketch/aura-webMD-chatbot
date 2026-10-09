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
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 const draft=async text=>{await evaluate('(()=>{const e=document.querySelector("textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(e,'+JSON.stringify(text)+');e.dispatchEvent(new Event("input",{bubbles:true}));})()');await wait();};
 const installMock = () => {
  window.streamOriginalFetch = window.fetch;
  window.fetch = (url, options) => {
   if (!String(url).includes('/api/openai/')) return window.streamOriginalFetch(url, options);
   window.sentPayload = JSON.parse(options.body); window.streamAborted = false;
   return Promise.resolve(new Response(new ReadableStream({ start(controller) {
    window.addChunk = text => controller.enqueue(new TextEncoder().encode('data: '+JSON.stringify({choices:[{delta:{content:text}}]})+'\n\n'));
    window.completeReply = () => {controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));controller.close();};
    options.signal.addEventListener('abort', () => {window.streamAborted=true;controller.error(new DOMException('Aborted','AbortError'));}, {once:true});
   }}), {headers:{'Content-Type':'text/event-stream'}}));
  };
 };
 await evaluate('('+installMock.toString()+')()');
 for(const width of [390,1366]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
  await click('document.querySelector(".new-chat-btn")');
  await draft('Help me unwind today.');await click('document.querySelector(".tool-btn.primary")');
  await check('request uses true streaming '+width,'window.sentPayload.stream===true && document.querySelector(".tool-btn.primary").getAttribute("aria-label")==="Stop response"');
  await evaluate('window.addChunk("Take a gentle breath.")');await wait();
  await check('first words appear before completion '+width,'document.querySelector(".message-bubble.is-streaming").textContent.includes("Take a gentle breath.") && !document.querySelector(".typing-indicator")');
  await draft('Next thought');
  await evaluate('window.addChunk('+JSON.stringify('\n\n'+Array.from({length:35},(_,i)=>'Reflection '+i+': Take your time and relax.').join('\n\n'))+')');await wait();
  await evaluate('(()=>{const p=document.querySelector(".chat-active-messages");p.dispatchEvent(new WheelEvent("wheel"));p.scrollTop=0;p.dispatchEvent(new Event("scroll"));})()');await wait();
  await evaluate('window.addChunk('+JSON.stringify('\n\nYou can take this slowly.')+')');await wait();
  await check('reading position stays put during generation '+width,'document.querySelector(".chat-active-messages").scrollTop===0 && !!document.querySelector(".jump-to-latest")');
  await click('document.querySelector(".tool-btn.primary")');
  await check('stop cancels the request and preserves draft and partial answer '+width,'window.streamAborted && !document.querySelector(".is-streaming") && document.querySelector(".tool-btn.primary").getAttribute("aria-label")==="Send message" && document.querySelector("textarea").value==="Next thought" && [...document.querySelectorAll(".message-bubble.bot")].at(-1).textContent.includes("You can take this slowly.")');
  await draft('A follow-up question.');await click('document.querySelector(".tool-btn.primary")');
  await evaluate('window.addChunk("Here is the next answer.");window.completeReply()');await wait();
  await check('completed stream produces one final answer '+width,'[...document.querySelectorAll(".message-bubble.bot")].filter(e=>e.textContent==="Here is the next answer.").length===1 && !document.querySelector(".is-streaming")');
  await check('streaming chat fits '+width,'document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight+1');
 }
 console.log('Streaming UI checks passed.');
}finally{await evaluate('(()=>{if(window.streamOriginalFetch)window.fetch=window.streamOriginalFetch;})()');await send('Network.setBlockedURLs',{urls:[]});ws.close();}
