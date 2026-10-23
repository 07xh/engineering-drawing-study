'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {CONSTRUCTION_INTENT_VERSION:version,validateConstructionIntent:check,
 validateConstructionIntentDAG:checkDAG}=require('../../core/contracts/construction-intent.js');
const p=(x,y)=>({x,y});
const source=(changes={})=>({solver:'engines/planar/directed-two-segment-fillet',
 revision:12,unit:'mm',proofScope:'selected-directed-fillet',
 proofLevel:'selected-directed-g1',resultId:null,branchId:'s++',
 status:'selected',evidenceSource:'engines/planar/directed-two-segment-fillet',
 ...changes});
const sample=()=>({schema:version,id:'step_1',purpose:'selected G1 fillet',
 role:'result',dependsOn:[],inputEntityIds:[],outputEntityIds:['arc_1'],
 source:source(),operations:[{id:'arc_1',kind:'directed-arc',
  coordinateSpace:'model-mm',geometry:{center:p(0,0),radius:3,
   startAngle:20,endAngle:90,direction:'ccw'}}]});
test('F2 canonical 1.0.0 model-degree directed arc and real selected candidate ID',()=>{
 const intent=sample();
 assert.equal(check(intent).ok,true,check(intent).errors.join(', '));
 assert.equal(checkDAG([intent]).ok,true);
});
test('unknown or forged schema/proof-level/fields/units are rejected, never treated as proof',()=>{
 const a=sample();
 for(const patch of [
  {schema:'draftai-r1-intent-projection/0.1'},
  {mathVerified:true},{source:{...a.source,unit:'px'}},
  {source:{...a.source,status:'unique',branchId:'s++'}},
  {source:{...a.source,proofLevel:'made-up-proof'}},
  {source:{...a.source,revision:-1}},
  {source:{...a.source,branchId:null}},
  {source:{...a.source,resultId:'../../scan'}},
  {role:'untrusted'}
 ])assert.equal(check({...a,...patch}).ok,false,JSON.stringify(patch));
});
test('SVG ambiguous angles, model/sheet mix, degenerate or nonfinite geometry fail',()=>{
 const a=sample(),op=a.operations[0];
 for(const geometry of [
  {...op.geometry,direction:'cw'},
  {...op.geometry,startAngle:90,endAngle:20},
  {...op.geometry,endAngle:380},
  {...op.geometry,endAngle:20},
  {...op.geometry,radius:0},
  {...op.geometry,radius:Infinity},
  {...op.geometry,origin:'pixel-location'}
 ]){
  assert.equal(check({...a,operations:[{...op,geometry}]}).ok,false);
 }
 assert.equal(check({...a,operations:[{...op,coordinateSpace:'sheet-px'}]}).ok,false);
 const line={id:'guide_1',kind:'line',coordinateSpace:'sheet-px',
  geometry:{from:p(1,2),to:p(9,2)}};
 assert.equal(check({...a,outputEntityIds:['guide_1'],operations:[line]}).ok,true);
 assert.equal(check({...a,outputEntityIds:['arc_1'],operations:[line]}).ok,false);
});
test('mixed revision/branch, future dependencies, duplicate IDs, fake geometry input fail',()=>{
 const a=sample(),b={...sample(),id:'step_2',dependsOn:['step_1'],
  outputEntityIds:['arc_2'],
  operations:[{...sample().operations[0],id:'arc_2'}]};
 assert.equal(checkDAG([a,b]).ok,true);
 assert.equal(checkDAG([a,{...b,source:source({revision:13})}]).ok,false);
 assert.equal(checkDAG([a,{...b,source:source({branchId:'s--'})}]).ok,false);
 assert.equal(checkDAG([b,a]).ok,false);
 assert.equal(checkDAG([a,a]).ok,false);
 assert.equal(checkDAG([a,{...b,outputEntityIds:['arc_1'],
  operations:[{...b.operations[0],id:'arc_1'}]}]).ok,false);
 assert.equal(check({...a,inputEntityIds:['step_2'],dependsOn:['step_2']}).ok,false);
});
test('03 projection guide may be explicitly sheet-px; mathematical unique needs no branch',()=>{
 const a={...sample(),source:{solver:'engines/projection/point-projection',
  revision:9,unit:'mm',proofScope:'single-point-first-angle',
  proofLevel:'linear-algebra',resultId:'result_projection',branchId:null,
  status:'unique',evidenceSource:'computed-first-angle-guides'},
  role:'auxiliary',purpose:'45 degree depth transfer',
  operations:[{id:'guide_1',kind:'line',coordinateSpace:'sheet-px',
   geometry:{from:p(10,12),to:p(30,42)}}],outputEntityIds:['guide_1']};
 assert.equal(check(a).ok,true,check(a).errors.join(', '));
 assert.equal(checkDAG([a]).ok,true);
});

test('F2 line intent refuses finite endpoints with overflowing span',()=>{
 const a=sample(),op={
  id:'guide_1',kind:'line',coordinateSpace:'model-mm',
  geometry:{from:p(Number.MAX_VALUE,0),to:p(-Number.MAX_VALUE,0)}
 };
 assert.equal(check({...a,outputEntityIds:['guide_1'],operations:[op]}).ok,
  false,'finite endpoints must not produce an infinite line length');
 const safe={...op,geometry:{from:p(-10,0),to:p(10,0)}};
 assert.equal(check({...a,outputEntityIds:['guide_1'],operations:[safe]}).ok,true);
});

test('F2 2D coordinates reject hidden 3D or ambiguous extra fields',()=>{
 const a=sample(),arc=a.operations[0];
 for(const replacement of [
  {...arc,geometry:{...arc.geometry,center:{x:0,y:0,z:8}}},
  {...arc,geometry:{...arc.geometry,center:{x:0,y:0,frame:'sheet-px'}}},
  {id:'point_1',kind:'point',coordinateSpace:'sheet-px',
   geometry:{at:{x:0,y:0,z:3}}},
  {id:'line_1',kind:'line',coordinateSpace:'model-mm',
   geometry:{from:{x:0,y:0,z:8},to:p(5,7)}}
 ]){
  assert.equal(check({...a,outputEntityIds:[replacement.id],
   operations:[replacement]}).ok,false,
   '2D Intent must not silently accept 3D or extra coordinate metadata');
 }
});
test('F2 DAG validates prior geometry provenance, not only step IDs',()=>{
 const first=sample();
 const makeSecond=(inputEntityIds=[],id='guide_2')=>({
  ...sample(),id:'step_2',dependsOn:['step_1'],
  inputEntityIds,outputEntityIds:[id],
  operations:[{id,kind:'line',coordinateSpace:'model-mm',
   geometry:{from:p(0,0),to:p(1,0)}}]
 });
 assert.equal(checkDAG([first,makeSecond(['arc_1'])]).ok,true);
 assert.equal(checkDAG([first,makeSecond(['never_emitted'])]).ok,false);
 assert.equal(checkDAG([first,makeSecond(['step_1'])]).ok,false);
 assert.equal(checkDAG([first,makeSecond(['guide_2'])]).ok,false);
 assert.equal(checkDAG([first,makeSecond([], 'step_2')]).ok,false);
 assert.equal(checkDAG([{...first,id:'arc_1'},makeSecond()]).ok,false);
});

test('F2 DAG entity-input provenance must follow declared transitive dependencies',()=>{
 const first=sample();
 const step=(id,dependsOn,inputEntityIds,output)=>({
  ...sample(),id,dependsOn,inputEntityIds,outputEntityIds:[output],
  operations:[{id:output,kind:'point',coordinateSpace:'model-mm',
   geometry:{at:p(1,2)}}]
 });
 const middle=step('step_2',['step_1'],[],'point_2');
 const valid=step('step_3',['step_2'],['arc_1'],'point_3');
 assert.equal(checkDAG([first,middle,valid]).ok,true,
  'transitive ancestor is an allowed producer');
 const sibling=step('step_2',[],[],'point_2');
 assert.equal(checkDAG([first,sibling,step('step_3',['step_2'],['arc_1'],'point_3')]).ok,
  false,'topologically earlier sibling is not a declared dependency');
 assert.equal(checkDAG([first,step('step_2',[],['arc_1'],'point_2')]).ok,
  false,'an undeclared direct parent must not supply input geometry');
 assert.equal(checkDAG([first,step('step_2',['step_1'],['arc_1'],'point_2')]).ok,
  true,'direct declared parent may supply geometry');
});
