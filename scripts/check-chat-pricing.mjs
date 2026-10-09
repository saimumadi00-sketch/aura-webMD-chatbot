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
 await send('Page.enable');await send('Network.enable');
 await send('Page.navigate',{url:appUrl});
 for(let attempt=0;attempt<40;attempt++){if(await evaluate('document.querySelector("#root")?.textContent.trim().length>0'))break;await wait();}await send('Network.setBlockedURLs',{urls:['*firestore.googleapis.com*','*identitytoolkit.googleapis.com*','*/api/openai/*']});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 for(const width of [768,1366]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await evaluate('location.hash="#/billing";window.scrollTo(0,0)');await wait();
  await check('one global frequency control '+width,'document.querySelectorAll(".cycle-toggle").length===1 && !document.querySelector(".plan-card .cycle-toggle")');
  await click('[...document.querySelectorAll(".cycle-btn")].find(e=>e.textContent==="Yearly")');
  await click('[...document.querySelectorAll(".toggle-btn")].find(e=>e.textContent==="Personal")');
  await check('annual personal totals '+width,'[...document.querySelectorAll(".plan-charge")].map(e=>e.textContent).join("|")==="No payment required|$144 billed annually|$1,020 billed annually"');
  for(const category of ['Personal','Clinics & Teams']){
   await click('[...document.querySelectorAll(".toggle-btn")].find(e=>e.textContent==='+JSON.stringify(category)+')');
   const positions=await evaluate('[...document.querySelectorAll(".plan-cta")].map(e=>Math.round(e.getBoundingClientRect().top))');
   console.log('CTA positions',width,category,positions);
   if(Math.max(...positions)-Math.min(...positions)>1)throw Error('Card buttons not aligned');
  }
 }
 await evaluate('location.hash="#/chat"');await wait();
 if(await evaluate('!!document.querySelector(".guest-btn")'))await click('document.querySelector(".guest-btn")');
 await click('document.querySelector(".new-chat-btn")');
 await evaluate('(()=>{window.originalFetch=window.fetch;window.fetch=(url,options)=>String(url).includes("/api/openai/")?new Promise(resolve=>{window.finishReply=text=>resolve(new Response(JSON.stringify({choices:[{message:{content:text}}]}),{status:200,headers:{"Content-Type":"application/json"}}));}):window.originalFetch(url,options);window.firstComposer=document.querySelector("textarea");})()');
 const draft=async text=>{await evaluate('(()=>{const e=document.querySelector("textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(e,'+JSON.stringify(text)+');e.dispatchEvent(new Event("input",{bubbles:true}));})()');await wait();};
 await draft('Help me slow down today.');await click('document.querySelector(".tool-btn.primary")');
 await draft('My next thought');
 await check('pending reply keeps the draft and composer','document.querySelector("textarea")===window.firstComposer && document.querySelector("textarea").value==="My next thought" && !document.querySelector("textarea").disabled');
 const reply='## A small pause\nTake one gentle breath.\n\n- Relax your shoulders\n- Notice your surroundings\n\n'+Array.from({length:40},(_,i)=>'Reflection '+(i+1)+': Give yourself a moment to rest.').join('\n\n')+'\n\n'+String.fromCharCode(96).repeat(3)+'text\n<script>literal text</script>\n'+String.fromCharCode(96).repeat(3);
 await evaluate('window.finishReply('+JSON.stringify(reply)+')');await new Promise(r=>setTimeout(r,900));
 await check('formatted reply uses lists and literal code','!!document.querySelector(".message-content ul") && document.querySelector(".message-content pre").textContent==="<script>literal text</script>" && !document.querySelector(".message-content script")');
 await check('long reply follows to bottom','(()=>{const p=document.querySelector(".chat-active-messages");return p.scrollHeight-p.scrollTop-p.clientHeight<3;})()');
 await evaluate('(()=>{const p=document.querySelector(".chat-active-messages");p.dispatchEvent(new WheelEvent("wheel"));p.scrollTop=0;p.dispatchEvent(new Event("scroll"));})()');await wait();
 await draft('Draft while reading');
 await check('editing a draft preserves the reading position','document.querySelector(".chat-active-messages").scrollTop===0 && !!document.querySelector(".jump-to-latest")');
 await click('document.querySelector(".jump-to-latest")');await wait();
 await check('latest control reaches bottom','(()=>{const p=document.querySelector(".chat-active-messages");return p.scrollHeight-p.scrollTop-p.clientHeight<3;})()');
 console.log('Chat motion and pricing checks passed.');
} finally {await evaluate('(()=>{if(window.originalFetch)window.fetch=window.originalFetch;})()');await send('Network.setBlockedURLs',{urls:[]});ws.close();}
