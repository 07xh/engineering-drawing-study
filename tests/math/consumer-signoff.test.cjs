'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../../core/contracts');
const P=require('../../core/projection/conventions.js');
const A=require('../../core/adapters');
const renderer=require('../../knowledge/drawing-action-renderer.js');
const near=(a,b,e=1e-8)=>Math.abs(a-b)<=e;
const geo=(id,kind,data)=>({id,kind,space:'drawing-2d',unit:'mm',data});
function inc(scope,type,data,id){return {id,scope,type,data,targetIds:['P'],source:'given'};}
test('02: Line2D/Circle2D produces real line-circle zero/one/two outputs',()=>{
 const line=(y)=>geo('line'+String(y).replace('.','_'),'line',{point:{x:0,y},direction:{x:1,y:0}});
 const circle=geo('circle1','circle',{center:{x:0,y:0},radius:5});
 for(const [y,status,count] of [[0,'multiple',2],[5,'unique',1],[6,'none',0]]){
  const cc=[A.toIntersectionConstraint(line(y),'P'),A.toIntersectionConstraint(circle,'P')];
  const r=A.solve({scope:'point-2d-intersection',constraints:cc});
  assert.equal(r.status,status);assert.equal(r.solutionCount,count);
  assert.equal(r.solutions.length,count);
  for(const p of r.solutions)assert(near(Math.hypot(p.x,p.y),5)&&near(p.y,y));
  if(count)assert(r.maxResidual<1e-8);
 }
});
test('02: Circle2D pair has two discrete candidate branches, not a unique answer',()=>{
 const c1=geo('c1','circle',{center:{x:0,y:0},radius:5});
 const c2=geo('c2','circle',{center:{x:8,y:0},radius:5});
 const r=A.solve({scope:'point-2d-intersection',constraints:[
  A.toIntersectionConstraint(c1,'P'),A.toIntersectionConstraint(c2,'P')]});
 assert.equal(r.status,'multiple');assert.equal(r.solutionCount,2);
 assert(r.solutions.some(p=>near(p.x,4)&&near(p.y,3)));
 assert(r.solutions.some(p=>near(p.x,4)&&near(p.y,-3)));
 assert.equal(r.globallyUnique,false);assert(r.maxResidual<1e-8);
});
test('02: Arc2D cw/ccw are math degrees and cannot be silently passed to legacy SVG',()=>{
 const ccw=geo('arcCCW','arc',{center:{x:2,y:3},radius:5,startAngle:0,endAngle:90,direction:'ccw'});
 const cw=geo('arcCW','arc',{center:{x:2,y:3},radius:5,startAngle:90,endAngle:0,direction:'cw'});
 assert.equal(C.validateGeometry(ccw).ok,true);
 assert.equal(C.validateGeometry(cw).ok,true);
 const opts={origin:{x:100,y:100},scale:2};
 const a=A.toLegacySvgArc(ccw,opts),b=A.toLegacySvgArc(cw,opts);
 for(const rendered of [a,b]){
  assert.equal(renderer.validAction(rendered.action),true);
  assert.equal(C.validAction(rendered.action),true);
  assert.deepEqual(rendered.action.geometry,{cx:104,cy:94,r:10,startAngle:-90,endAngle:0});
 }
 assert.equal(a.orientationPreserved,false);
 assert.equal(b.orientationPreserved,true);
 assert.match(a.warning,/端点顺序已反转/);
 assert.throws(()=>A.toIntersectionConstraint(ccw,'P'),/尚未实现/);
 assert.equal(C.validateGeometry({...ccw,data:{...ccw.data,direction:'cw'}}).ok,false);
});
test('03: A(15,10,12) is first-angle orthographic and pixel scale independent',()=>{
 const point={x:15,y:10,z:12},model=P.project(point);
 assert.deepEqual(model,{V:{u:15,v:12},H:{u:15,v:10},W:{u:10,v:12}});
 const opts={origin:{x:100,y:100},scale:2},sheet=P.sheetPoint(point,opts);
 assert.deepEqual(sheet,{V:{x:70,y:76},H:{x:70,y:120},W:{x:120,y:76},M:{x:120,y:120}});
 for(const name of P.VIEWS)assert.deepEqual(P.fromSheet(name,sheet[name],opts),model[name]);
 assert.deepEqual(P.project(point),model);
 assert.deepEqual(P.aligned(model),{sameX:true,sameHeight:true,sameDepth:true});
 const other=P.sheetPoint(point,{origin:{x:50,y:80},scale:10});
 assert.notDeepEqual(other.V,sheet.V);
 assert.deepEqual(P.project(point),model);
});
test('03: single view underconstrained; V+H, V+W, H+W unique; mismatch none',()=>{
 const scope='point-3d-linear';
 const cs={
  V:inc(scope,'projection',{plane:'V',value:[15,12]},'v'),
  H:inc(scope,'projection',{plane:'H',value:[15,10]},'h'),
  W:inc(scope,'projection',{plane:'W',value:[10,12]},'w')
 };
 for(const key of ['V','H','W']){
  const r=A.solve({scope,constraints:[cs[key]]});
  assert.equal(r.status,'continuous');assert.equal(r.degrees,1);
 }
 for(const pair of [['V','H'],['V','W'],['H','W']]){
  const r=A.solve({scope,constraints:pair.map(k=>cs[k])});
  assert.equal(r.status,'unique');assert.deepEqual(r.solutions,[{x:15,y:10,z:12}]);
 }
 const bad=A.solve({scope,constraints:[cs.V,{...cs.H,id:'wrongH',data:{plane:'H',value:[16,10]}}]});
 assert.equal(bad.status,'none');assert.equal(bad.solutionCount,0);
 const blank=A.solve({scope,constraints:[]});
 assert.equal(blank.status,'continuous');assert.equal(blank.degrees,3);
});
test('07: two-step consumer fixture links objects, constraints, steps and results',()=>{
 const scope='point-3d-linear';
 const H=inc(scope,'projection',{plane:'H',value:[15,10]},'h');
 const V=inc(scope,'projection',{plane:'V',value:[15,12]},'v');
 const first={...A.solve({scope,constraints:[H]}),id:'r1'};
 const last={...A.solve({scope,constraints:[H,V]}),id:'r2'};
 const point={id:'P',kind:'point',space:'model-3d',unit:'mm',data:{x:15,y:10,z:12}};
 const screen=P.sheetPoint(point.data,{origin:{x:100,y:100},scale:2});
 const steps=[
  {id:'step1',explanation:'显示题给水平投影',constraintIds:['h'],targetIds:['P'],
   actions:[{kind:'point',style:'given',geometry:screen.H,label:'a'}],solveResultRef:'r1',
   reason:'H(x,y) 只确定空间点的两个坐标'},
  {id:'step2',explanation:'加入正面投影并验证侧面位置',dependsOn:['step1'],
   constraintIds:['v'],targetIds:['P'],solveResultRef:'r2',
   actions:[{kind:'point',style:'result',geometry:screen.W,label:'a″'}],
   reason:'V(x,z) 与 H(x,y) 独立组合确定空间点'}
 ];
 const problem={schemaVersion:C.SCHEMA_VERSION,id:'demo07',title:'Synthetic first-angle example',
  type:'point-projection',source:{kind:'generated',generatorId:'DA01'},
  status:'source-verified',givens:[],geometry:[point],constraints:[H,V],solveResults:[first,last],
  steps,renderMode:'constraint-engine'};
 assert.deepEqual(C.validateProblem(problem),{ok:true,errors:[]});
 assert.equal(A.consumeStep(problem,'step1',{inputRevision:1,resultRevision:1}).status,'unproven');
 assert.equal(A.consumeStep(problem,'step2',{inputRevision:1,resultRevision:1}).status,'computed-candidate');
 assert.equal(A.consumeStep(problem,'step2',{inputRevision:2,resultRevision:1}).status,'stale');
 assert.equal(A.consumeStep(problem,'step2',{inputRevision:2,resultRevision:1}).showComputedPoint,false);
 const changed={...problem,constraints:[H,{...V,data:{plane:'V',value:[15,13]}}]};
 // Revision invalidation happens before any stale result may be rendered.
 assert.equal(A.consumeStep(changed,'step2',{inputRevision:2,resultRevision:1}).status,'stale');
 assert.equal(C.validateProblem({...problem,steps:[steps[1],steps[0]]}).ok,false);
 assert.equal(problem.source.kind,'generated','must not pretend textbook-source verification');
 for(const s of steps)for(const a of s.actions)assert.equal(renderer.validAction(a),true);
});
test('09: limits and negative boundaries remain visible to consumers',()=>{
 const scope='point-2d-intersection';
 const r=A.solve({scope,constraints:[
  A.toIntersectionConstraint(geo('lin','line',{point:{x:0,y:5},direction:{x:1,y:0}}),'P'),
  A.toIntersectionConstraint(geo('cir','circle',{center:{x:0,y:0},radius:5}),'P')
 ]});
 assert.equal(r.status,'unique');assert(r.maxResidual<1e-8);
 assert.equal(C.validateGeometry(geo('x','line',{point:{x:0,y:0},direction:{x:0,y:0}})).ok,false);
 assert.equal(C.validateGeometry(geo('z','circle',{center:{x:0,y:0},radius:0})).ok,false);
 const a=geo('small','arc',{center:{x:0,y:0},radius:1,startAngle:0,endAngle:1e-12,direction:'ccw'});
 assert.equal(C.validateGeometry(a).ok,false,'near-zero span should not pass as valid arc');
 assert.equal(C.validateGeometry(geo('nan','point',{x:NaN,y:0})).ok,false);
});
