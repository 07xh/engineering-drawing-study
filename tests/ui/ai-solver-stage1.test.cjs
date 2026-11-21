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
 assert.match(html,/id="ai-solve-fill-point"/);
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
   tool:'projection',pointCandidate:{x:10,y:20,z:30,unit:'mm',evidenceText:'原题 P(10,20,30) mm'},verified:true,diagrams:{twoD:'pretend',threeD:'pretend'}
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
  assert.deepEqual(data.candidate.pointCandidate,{x:10,y:20,z:30,unit:'mm',evidenceText:'原题 P(10,20,30) mm'});
 }finally{globalThis.fetch=previous;}
});

test('AI point candidate requires explicit millimeter coordinate and cannot assert proof',async()=>{
 const {publicCandidate}=await entry;
 const valid={tool:'projection',answer:'候选',pointCandidate:{
  x:0,y:-10,z:12.5,unit:'mm',evidenceText:'题图已知 P(0,-10,12.5) mm'}};
 const reviewed=publicCandidate(valid);
 assert.deepEqual(reviewed.pointCandidate,{x:0,y:-10,z:12.5,unit:'mm',
  evidenceText:'题图已知 P(0,-10,12.5) mm'});
 assert.equal(reviewed.verified,undefined);
 for(const pointCandidate of [
  {x:NaN,y:2,z:3,unit:'mm',evidenceText:'原题输入'},
  {x:100001,y:2,z:3,unit:'mm',evidenceText:'原题输入'},
  {x:1,y:2,z:3,unit:'px',evidenceText:'原题输入'},
  {x:1,y:2,z:3,unit:'mm',evidenceText:''},
  {x:1,y:2,unit:'mm',evidenceText:'缺失 Z'}
 ]){
  assert.equal(publicCandidate({...valid,pointCandidate}).pointCandidate,null);
 }
 assert.equal(publicCandidate({...valid,tool:'section'}).pointCandidate,null,
  'do not inject point coordinates into a different project task');
});
test('AI point handoff never clicks confirm or solve and uses existing input invalidation',()=>{
 const js=fs.readFileSync(path.join(__dirname,'../../ui-next/ai-solve.js'),'utf8');
 assert.ok(js.includes("task.value!=='projection'"));
 assert.ok(js.includes("field.dispatchEvent(new Event('input'"));
 assert.ok(js.includes("$('v7-task')"));
 assert.ok(!js.includes("$('v7-confirm').click("));
 assert.ok(!js.includes("$('v7-solve').click("));
 assert.match(js,/原题/);
});

test('AI planar candidate is a reviewed draft, not a new verified solver',async()=>{
 const {publicCandidate}=await entry;
 const good={
  tool:'planar',filletCandidate:{unit:'mm',
   first:[[-20,0],[20,0]],second:[[0,-20],[0,20]],radius:8,
   branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'reverse',
   evidenceText:'原题给出两条线段端点、连接半径和行进分支'}};
 const c=publicCandidate(good);
 assert.deepEqual(c.filletCandidate,good.filletCandidate);
 assert.equal(c.verified,undefined);
 for(const altered of [
  {...good.filletCandidate,unit:'px'},
  {...good.filletCandidate,radius:0},
  {...good.filletCandidate,radius:-2},
  {...good.filletCandidate,first:[[1,2],[1,2]]},
  {...good.filletCandidate,first:[[1,2],[100001,2]]},
  {...good.filletCandidate,direction:'clockwise'},
  {...good.filletCandidate,branchId:'unknown'},
  {...good.filletCandidate,evidenceText:''}
 ]) assert.equal(publicCandidate({...good,filletCandidate:altered}).filletCandidate,null);
 assert.equal(publicCandidate({...good,tool:'intersection'}).filletCandidate,null);
});
test('C1 eight-view rows require all 8 unique vertices and consistent first-angle axes',async()=>{
 const {publicCandidate}=await entry;
 const ids=['V000','V001','V010','V011','V100','V101','V110','V111'];
 const rows=ids.map(id=>{
  const x=Number(id[1])*12,y=Number(id[2])*9,z=Number(id[3])*7;
  return {id,coords:[x,z,x,y]};
 });
 const input={tool:'third_view',thirdViewCandidate:{pair:'VH',unit:'mm',
  evidenceText:'题目逐个列出八个角点及主俯两视图',rows}};
 const valid=publicCandidate(input).thirdViewCandidate;
 assert.equal(valid.rows.length,8);
 assert.equal(valid.pair,'VH');
 assert.equal(valid.rows[0].id,'V000');
 assert.equal(valid.verified,undefined);
 for(const wrong of [
  {...input.thirdViewCandidate,unit:'px'},
  {...input.thirdViewCandidate,pair:'invalid'},
  {...input.thirdViewCandidate,rows:rows.slice(0,7)},
  {...input.thirdViewCandidate,rows:[rows[0],...rows.slice(0,7)]},
  {...input.thirdViewCandidate,rows:rows.map((r,i)=>i===3?{...r,coords:[0,0,1,0]}:r)},
  {...input.thirdViewCandidate,rows:rows.map((r,i)=>i===4?{...r,coords:rows[0].coords}:r)},
  {...input.thirdViewCandidate,evidenceText:''}
 ]) assert.equal(publicCandidate({...input,thirdViewCandidate:wrong}).thirdViewCandidate,null);
 assert.equal(publicCandidate({...input,tool:'planar'}).thirdViewCandidate,null);
 for(const [pair,format] of [
  ['VW',(x,y,z)=>[x,z,y,z]],['HW',(x,y,z)=>[x,y,y,z]]
 ]){
  const other=rows.map(r=>{
   const x=Number(r.id[1])*12,y=Number(r.id[2])*9,z=Number(r.id[3])*7;
   return {id:r.id,coords:format(x,y,z)};
  });
  assert.equal(publicCandidate({...input,thirdViewCandidate:{...input.thirdViewCandidate,pair,rows:other}}).thirdViewCandidate.rows.length,8);
 }
});
test('editable AI planar and C1 panels preserve the original solver review boundary',()=>{
 const html=homeHTML();
 for(const name of ['ai-solve-fillet','ai-solve-fill-fillet',
  'ai-solve-third-view','ai-solve-fill-third-view','ai-c1-pair','ai-c1-rows'])
  assert.match(html,new RegExp('id="'+name+'"'));
 const js=fs.readFileSync(path.join(__dirname,'../../ui-next/ai-solve.js'),'utf8');
 assert.ok(js.includes("deliverToExistingTask('planar'"));
 assert.ok(js.includes("'labs/auto-fillet-live.html'"),'recognized fillet candidate must link to fillet solver, not polygon');
 assert.ok(js.includes("deliverToExistingTask('c1-third-view'"));
 assert.ok(js.includes("task.value!==taskName"));
 assert.ok(js.includes("Math.hypot"));
 assert.ok(js.includes("checkedC1Rows"));
 assert.ok(js.includes("$('v8-c1-topology').checked=false"));
 assert.ok(js.includes("field.dispatchEvent(new Event("));
 assert.ok(!js.includes("coordinator.confirmCondition"));
 assert.ok(!js.includes("session.solve("));
 new vm.Script(js);
});

test('AI two-box candidate uses only validated 3D bounds with explicit provenance',async()=>{
 const {publicCandidate}=await entry;
 const known={tool:'composite',twoBoxCandidate:{unit:'mm',boxes:[
  {min:[0,0,0],max:[30,20,10]},
  {min:[10,0,10],max:[20,15,30]}
 ],evidenceText:'题目给出 A/B 两个长方体的十二个毫米边界'}};
 const result=publicCandidate({...known,verified:true,diagrams:{threeD:'forged'}});
 assert.deepEqual(result.twoBoxCandidate,known.twoBoxCandidate);
 assert.equal(result.verified,undefined,'model may not sign a C2 result');
 assert.equal(result.diagrams,undefined,'model may not provide claimed 2D/3D evidence');
 for(const corrupted of [
  {...known.twoBoxCandidate,unit:'cm'},
  {...known.twoBoxCandidate,boxes:known.twoBoxCandidate.boxes.slice(0,1)},
  {...known.twoBoxCandidate,boxes:[{min:[0,0,0],max:[0,12,12]},known.twoBoxCandidate.boxes[1]]},
  {...known.twoBoxCandidate,boxes:[{min:[0,0,0],max:[-1,12,12]},known.twoBoxCandidate.boxes[1]]},
  {...known.twoBoxCandidate,boxes:[{min:[0,0,0],max:[Infinity,12,12]},known.twoBoxCandidate.boxes[1]]},
  {...known.twoBoxCandidate,boxes:[{min:[0,0,0],max:[100001,12,12]},known.twoBoxCandidate.boxes[1]]},
  {...known.twoBoxCandidate,boxes:[{min:[0,0,0],max:[12,12]},known.twoBoxCandidate.boxes[1]]},
  {...known.twoBoxCandidate,evidenceText:''}
 ])assert.equal(publicCandidate({...known,twoBoxCandidate:corrupted}).twoBoxCandidate,null);
 assert.equal(publicCandidate({...known,tool:'projection'}).twoBoxCandidate,null);
});
test('AI C2 bounds are accepted by original C2 preflight without bypassing acknowledgment',async()=>{
 const {publicCandidate}=await entry;
 const {reviewC2BoxFields}=require('../../project/c2-reviewed-preflight.cjs');
 const candidate=publicCandidate({tool:'composite',twoBoxCandidate:{unit:'mm',boxes:[
  {min:[0,0,0],max:[20,20,10]},
  {min:[5,5,10],max:[15,15,20]}
 ],evidenceText:'两长方体均具有明确的轴向尺寸和位置'}}).twoBoxCandidate;
 assert.ok(candidate);
 const fields={};
 for(const [i,letter] of ['a','b'].entries())
  for(const [bound,side] of [['min','0'],['max','1']])
   for(const [j,axis] of ['x','y','z'].entries())
    fields['v8-c2-'+letter+'-'+axis+side]=String(candidate.boxes[i][bound][j]);
 assert.equal(reviewC2BoxFields(fields).ready,true);
 assert.equal(reviewC2BoxFields(fields,{occupied:true}).ready,false);
 assert.equal(reviewC2BoxFields({...fields,'v8-c2-a-y1':'-1'}).ready,false);
});
test('AI C2 editor is scoped to an empty original composition project and does not auto-confirm',()=>{
 const html=homeHTML();
 for(const id of ['ai-solve-two-box','ai-solve-fill-two-box',
  'ai-c2-a-x0','ai-c2-a-z1','ai-c2-b-x0','ai-c2-b-z1'])
  assert.match(html,new RegExp('id="'+id+'"'));
 const js=fs.readFileSync(path.join(__dirname,'../../ui-next/ai-solve.js'),'utf8');
 assert.ok(js.includes("deliverToExistingTask('composition'"));
 assert.ok(js.includes("if(field.disabled)"),'protect saved C2 projects');
 assert.ok(js.includes("task.value!==taskName"),'do not mutate other task projects');
 assert.ok(js.includes("min.some((v,i)=>v>=max[i])"),'reject reversed axes');
 assert.ok(!js.includes("$('v8-c2-ack').checked=true"));
 assert.ok(!js.includes("$('v8-c2-build').click("));
 assert.ok(!js.includes('const ids=letters.flatMap'),'do not shadow output selectors');
 new vm.Script(js);
});
