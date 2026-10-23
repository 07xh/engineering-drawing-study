'use strict';
// Real HTML + real bundled application in a DOM, not a browser/device substitute.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
const esbuild=require('esbuild');
const {enhancePage}=require('../../../ui-next/enhance-page.cjs');
const root=path.resolve(__dirname,'../../..');
function mount(page,{next=false,urls=URL,nativeTextDetector=null,canvasFactory=null}={}){
 const source=fs.readFileSync(path.join(root,page),'utf8');
 const {document,window}=parseHTML(next?enhancePage(source,{page}):source);
 // Optional deterministic browser-native OCR doubles for real-entry tests.
 // Default browser mount remains unchanged; no network or geometry mocks.
 if(canvasFactory){
  const nativeCreate=document.createElement.bind(document);
  document.createElement=tag=>String(tag).toLowerCase()==='canvas'?
   canvasFactory():nativeCreate(tag);
 }
 // Fill browser form reflection that linkedom deliberately does not implement.
 Object.defineProperty(window.HTMLInputElement.prototype,'valueAsNumber',{configurable:true,get(){return this.value.trim()===''?NaN:Number(this.value)}});
 Object.defineProperty(window.HTMLInputElement.prototype,'checked',{configurable:true,get(){return this.hasAttribute('checked')},set(v){this.toggleAttribute('checked',!!v)}});
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){const a=this.querySelector('option[selected]')||this.querySelector('option');return a?.value??''},set(v){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.value===String(v))}});
 let now=0,frameId=0;const frames=new Map();
 const requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId};
 const cancelAnimationFrame=id=>frames.delete(id);
 const performance={now:()=>now};
 const media=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 window.matchMedia=media;
 const context=vm.createContext({window,document,console,performance,requestAnimationFrame,cancelAnimationFrame,
  URL:urls,TextDetector:nativeTextDetector||undefined,Blob,structuredClone,TextEncoder,TextDecoder,setTimeout,clearTimeout,AbortController});
 const entry=path.join(root,page.replace('.html','-entry.cjs'));
 const code=esbuild.buildSync({entryPoints:[entry],write:false,bundle:true,platform:'browser',format:'iife',target:'es2020'}).outputFiles[0].text;
 vm.runInContext(code,context,{filename:path.basename(entry),timeout:10000});
 if(next)require('../../../ui-next/ui-next.js').initUI(document);
 const get=id=>{const n=document.getElementById(id);if(!n)throw Error('missing '+id);return n};
 function set(id,value,event='change'){get(id).value=String(value);get(id).dispatchEvent(new window.Event(event,{bubbles:true}));}
 function click(id){get(id).click();}
 function advance(ms){now+=ms;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(now);}
 return {document,get,set,click,advance,frames};
}
module.exports={mount};
