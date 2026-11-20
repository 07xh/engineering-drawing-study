'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {homeHTML}=require('../../ui-next/home.cjs');
const entry=import('../../ai/worker.mjs');
const endpoint='https://draftflow.example/api/ai/solve';
const env={
 DRAFTFLOW_AI_ENABLED:'true',DRAFTFLOW_AI_RATE_LIMIT_READY:'true',
 DRAFTFLOW_AI_KEY:'example_provider_key_not_a_real_secret',
 DRAFTFLOW_AI_ACCESS_TOKEN:'example_personal_access_token_123456',
 DRAFTFLOW_AI_MODEL:'gpt-4o-mini'
};
const outputs={answer:true,approach:true,steps:true,twoD:true,threeD:true,animation:true,verification:false};
function post(data,access=env.DRAFTFLOW_AI_ACCESS_TOKEN,origin='https://draftflow.example'){
 return new Request(endpoint,{method:'POST',headers:{
  Origin:origin,'Content-Type':'application/json','Authorization':'Bearer '+access
 },body:JSON.stringify(data)});
}
test('V11 homepage AI form coexists with the original workbench and output choices',()=>{
 const html=homeHTML();
 for(const id of ['ai-solve-form','ai-solve-question','ai-solve-run','ai-solve-consent',
  'project-workbench','v7-task','v7-solve'])assert.match(html,new RegExp(id));
 for(const option of ['answer','approach','steps','twoD','threeD','animation','verification'])
  assert.match(html,new RegExp('data-ai-output="'+option+'"'));
 assert.match(html,/平面图形作图/);
 assert.match(html,/AI 解题（待安全服务启用）/);
 new vm.Script(fs.readFileSync(path.join(__dirname,'../../ui-next/ai-solve.js'),'utf8'));
});
test('V11 build wrapper adds explicit AI assets only to the homepage',()=>{
 const {enhancePage}=require('../../ui-next/enhance-page.cjs');
 const raw=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
 const actual=enhancePage(raw,{page:'index.html',preview:true});
 assert.match(actual,/ai-solve\.js/);assert.match(actual,/ai-solve\.css/);
 assert.match(actual,/ai-solve-form/);
 assert.match(actual,/project\/unified-workbench-bundle\.js/);
});
test('AI server disabled by default, unknown API blocked, static assets preserved',async()=>{
 const worker=(await entry).default;
 const r=await worker.fetch(new Request('https://draftflow.example/api/ai/status'),{});
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{enabled:false});
 const p=await worker.fetch(post({question:'一个点的三面投影',imageDataUrl:null,outputs,detail:'standard'}),{});
 assert.equal(p.status,503);assert.equal((await p.json()).error,'个人 AI 服务尚未启用');
 const reject=await worker.fetch(new Request('https://draftflow.example/api/unrelated'),env);
 assert.equal(reject.status,404);
 const pass=await worker.fetch(new Request('https://draftflow.example/index.html'),{
  ASSETS:{fetch:async()=>new Response('public geometry tools',{status:200})}
 });
 assert.equal(await pass.text(),'public geometry tools');
});
test('AI access requires rate-limit signoff, same origin and private token',async()=>{
 const worker=(await entry).default;
 const r=await worker.fetch(new Request('https://draftflow.example/api/ai/status'),{
  ...env,DRAFTFLOW_AI_RATE_LIMIT_READY:'false'
 });
 assert.equal((await r.json()).enabled,false);
 const request={question:'点 P 的三面投影',imageDataUrl:null,outputs,detail:'standard'};
 const wrong=await worker.fetch(post(request,'incorrect_long_personal_token_012345'),env);
 assert.equal(wrong.status,401);
 const cross=await worker.fetch(post(request,env.DRAFTFLOW_AI_ACCESS_TOKEN,'https://other.example'),env);
 assert.equal(cross.status,403);
 const unselected=await worker.fetch(post({...request,outputs:Object.fromEntries(Object.keys(outputs).map(x=>[x,false]))}),env);
 assert.equal(unselected.status,400);
 const forged=await worker.fetch(post({...request,imageDataUrl:'data:image/svg+xml;base64,abcd'}),env);
 assert.equal(forged.status,400);
});
test('authenticated model reply is explicitly unverified and cannot mint diagrams',async()=>{
 const worker=(await entry).default;
 const previous=globalThis.fetch;
 globalThis.fetch=async (url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/chat/completions');
  assert.equal(options.method,'POST');
  assert.equal(options.headers.Authorization,'Bearer '+env.DRAFTFLOW_AI_KEY);
  const body=JSON.parse(options.body);
  assert.equal(body.model,env.DRAFTFLOW_AI_MODEL);
  assert.equal(body.messages[1].content[0].type,'text');
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({
   answer:'P 的正面投影为 (x,z)',approach:'先按第一角法核对坐标',
   steps:['确认 x、y、z','分别投影到 V/H/W'],uncertainties:[],
   tool:'projection',verified:true,diagrams:{twoD:'pretend',threeD:'pretend'}
  })}}]}),{status:200,headers:{'Content-Type':'application/json'}});
 };
 try{
  const res=await worker.fetch(post({question:'点 P(10,20,30) 的三面投影',imageDataUrl:null,outputs,detail:'teaching'}),env);
  assert.equal(res.status,200);
  const data=await res.json();
  assert.equal(data.verified,false);
  assert.equal(data.status,'unverified-ai-candidate');
  assert.equal(data.candidate.tool,'projection');
  assert.deepEqual(data.candidate.steps,['确认 x、y、z','分别投影到 V/H/W']);
  assert.equal(data.candidate.verified,undefined);
  assert.equal(data.diagrams.twoD,'not-generated');
  assert.equal(data.diagrams.threeD,'not-generated');
 }finally{globalThis.fetch=previous;}
});
