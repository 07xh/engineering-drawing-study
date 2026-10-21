'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {CHECKS,verifyOrigin,runProductionSmoke}=require('./production-smoke.cjs');
const ORIGIN='https://draftai.example.org',HOST='draftai.example.org';
const options={origin:ORIGIN,expectedHost:HOST};
function mockFetch(overrides={}){
 const calls=[];
 async function fn(url,config){
  calls.push({url,config});const path=new URL(url).pathname;
  const item=CHECKS.find(x=>x.path===path);
  if(!item)throw Error('unexpected path');
  const status=overrides[path]?.status??item.expect;
  const type=overrides[path]?.type??(item.html?'text/html; charset=utf-8':'text/plain');
  return {url:overrides[path]?.url??url,status,headers:{get:()=>type}};
 }
 return {calls,fn};
}
test('all eight read-only HTTP route checks pass with synthetic responses',async()=>{
 const {calls,fn}=mockFetch(),result=await runProductionSmoke({...options,fetchImpl:fn});
 assert.equal(result.ok,true);assert.equal(result.checks.length,8);assert.equal(calls.length,8);
 for(const call of calls){assert.equal(call.config.method,'GET');assert.equal(call.config.redirect,'manual');assert.equal(call.config.credentials,'omit');}
});
test('a private textbook path returning 200 blocks release',async()=>{
 const {fn}=mockFetch({'/knowledge/index.html':{status:200}});
 const result=await runProductionSmoke({...options,fetchImpl:fn});
 assert.equal(result.ok,false);assert(result.checks.some(x=>x.path==='/knowledge/index.html'&&!x.ok));
});
test('private JS leaked from allowed public static route blocks',async()=>{
 const {fn}=mockFetch({'/labs/verified-exercises.js':{status:200}});
 assert.equal((await runProductionSmoke({...options,fetchImpl:fn})).ok,false);
});
test('public page returning 404 blocks release',async()=>{
 const {fn}=mockFetch({'/public-use.html':{status:404}});
 assert.equal((await runProductionSmoke({...options,fetchImpl:fn})).ok,false);
});
test('HTML page returned as JSON or plain text blocks release',async()=>{
 const {fn}=mockFetch({'/':{type:'application/json'}});
 assert.equal((await runProductionSmoke({...options,fetchImpl:fn})).ok,false);
});
test('redirects are not followed and cannot silently pass',async()=>{
 const {fn}=mockFetch({'/':{status:302}});
 assert.equal((await runProductionSmoke({...options,fetchImpl:fn})).ok,false);
});
test('unexpected final response URL is rejected',async()=>{
 const {fn}=mockFetch({'/':{url:'https://elsewhere.example.org/'}});
 assert.equal((await runProductionSmoke({...options,fetchImpl:fn})).ok,false);
});
test('network failure is reported without accepting partial success',async()=>{
 const {fn}=mockFetch();let calls=0;
 const result=await runProductionSmoke({...options,fetchImpl:async(u,c)=>{
  calls++;if(calls===3)throw Error('socket');return fn(u,c);
 }});
 assert.equal(calls,8);assert.equal(result.ok,false);
 assert(result.checks.some(x=>x.error?.startsWith('request failed:')));
});
test('reject missing origin, HTTP, credentials, path, query, port, redirect host',()=>{
 for(const value of [undefined,'http://draftai.example.org','https://someone:pw@draftai.example.org',
  'https://draftai.example.org/path','https://draftai.example.org/?x=1',
  'https://draftai.example.org:444','https://bad.example.org'])
  assert.throws(()=>verifyOrigin(value,HOST));
});
test('private/internal hosts and IP addresses forbidden',()=>{
 for(const host of ['localhost','foo.local','machine.internal','127.0.0.1','192.168.1.4','10.1.2.3','[::1]'])
  assert.throws(()=>verifyOrigin('https://'+host,host.startsWith('[')?'['+host.slice(1):host));
});
test('bad timeouts and unknown fetch implementations are rejected',async()=>{
 for(const timeoutMs of [0,100000,-100,NaN,2.5])
  await assert.rejects(runProductionSmoke({...options,fetchImpl:async()=>{},timeoutMs}));
 await assert.rejects(runProductionSmoke({...options,fetchImpl:null}));
});
