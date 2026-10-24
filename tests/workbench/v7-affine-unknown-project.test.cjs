'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {newProject,createCoordinator,exportProject,importProject}=
 require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const make=()=>({
 frame:'model-mm-2d',unit:'mm',points:[{id:'A'},{id:'B'}],
 constraints:[
  {id:'Anchor',kind:'fixed',point:'A',at:{x:2,y:3}},
  {id:'Shift',kind:'offset',from:'A',to:'B',delta:{x:4,y:5}}
 ]});
function setup(){
 const c=createCoordinator(newProject({id:'AffineWorkbench',task:'composition'}));
 const session=createUnifiedProjectSession();
 c.attachSolver(session);
 return {c,session};
}
test('V7 same project human-stages affine point equations; only unique M3 gets a Geometry Scene, never V5',()=>{
 const {c,session}=setup();
 c.putAffineProblem({...make(),confirmed:true});
 assert.equal(c.snapshot().affineProblem.confirmed,false);
 assert.throws(()=>session.solve(),/尚未经人工确认/);
 c.confirmAffineProblem();
 const result=session.solve();
 assert.equal(result.kind,'affine-evidence');
 assert.equal(result.status,'unique');
 assert.equal(result.verified,false);
 assert.equal(result.evidence.rank,4);
 assert.equal(result.evidence.solveResult.status,'unique');
 assert.equal(result.scene.objects.length,2);
 assert.equal(result.scene.objects.find(x=>x.id==='B').model.data.x,6);
 assert.equal(result.scene.objects.find(x=>x.id==='B').model.data.y,8);
 assert.equal(result.clock,null);
 assert.equal(result.plan,null);
 assert.equal(c.currentResult(),null);
 assert.equal(c.canExport(),false);
 c.selectSceneGeometry('B');
 assert.equal(c.selectedGeometryId(),'B');
 const rev=c.snapshot().revision;
 c.setCamera({yaw:38});
 assert.equal(c.snapshot().revision,rev);
 assert.equal(session.readSnapshot(),result);
 const restored=createCoordinator(importProject(exportProject(c.snapshot())));
 assert.equal(restored.currentResult(),null);
 assert.equal(restored.canExport(),false);
 assert.equal(restored.snapshot().affineProblem.points.length,2);
 restored.dispose();c.dispose();
});
test('V7 reports continuous/no-solution without guessing coordinates',()=>{
 const {c,session}=setup();
 c.putAffineProblem({frame:'model-mm-2d',unit:'mm',points:[{id:'P'},{id:'Q'}],
  constraints:[{id:'Same',kind:'coincident',a:'P',b:'Q'}]});
 c.confirmAffineProblem();
 const first=session.solve();
 assert.equal(first.status,'continuous');
 assert.equal(first.scene,null);assert.equal(first.verified,false);
 assert.equal(c.canExport(),false);
 c.putAffineProblem({frame:'model-mm-2d',unit:'mm',points:[{id:'P'}],
  constraints:[
   {id:'Fix',kind:'fixed',point:'P',at:{x:0,y:0}},
   {id:'Conflict',kind:'axis',point:'P',axis:'x',value:7}
  ]});
 c.confirmAffineProblem();
 const second=session.solve();
 assert.equal(second.status,'none');
 assert.equal(second.scene,null);assert.equal(second.plan,null);
 assert.equal(c.currentResult(),null);
 c.dispose();
});
test('source replacement/calibration changes revoke human approval and prior affine mathematics',()=>{
 const {c,session}=setup();
 c.putAffineProblem(make());c.confirmAffineProblem();
 const earlier=session.solve(),rev=c.snapshot().revision;
 assert.equal(earlier.evidence.status,'unique');
 c.setImage('OriginalB');
 assert.ok(c.snapshot().revision>rev);
 assert.equal(c.snapshot().affineProblem.confirmed,false);
 assert.equal(session.readSnapshot(),null);
 assert.throws(()=>c.confirmAffineProblem(),/原图或双比例尺度/);
 assert.throws(()=>session.solve(),/人工确认/);
 c.putAffineProblem(make());c.confirmAffineProblem();
 assert.equal(session.solve().status,'unique');
 c.setImageGeometry({rotationDeg:90,calibration:null});
 assert.equal(c.snapshot().affineProblem.confirmed,false);
 assert.equal(session.readSnapshot(),null);
 assert.throws(()=>c.confirmAffineProblem(),/原图或双比例尺度/);
 c.dispose();
});
test('reject accidental mixing with already confirmed multiobject Geometry and forged constraints',()=>{
 const {c,session}=setup();
 c.putObject({id:'A',kind:'point',spatialId:null,projections:{V:[],H:[],W:[]}});
 assert.throws(()=>c.putAffineProblem(make()),/已有独立手工几何/);
 c.deleteObject('A');
 assert.throws(()=>c.putAffineProblem({...make(),
  constraints:[{id:'Bad',kind:'distance',a:'A',b:'B',value:5}]}),/non-affine/);
 assert.equal(c.snapshot().affineProblem,null);
 c.putAffineProblem(make());
 assert.throws(()=>c.putAffineProblem({...make(),
  constraints:[{id:'Bad',kind:'axis',point:'A',axis:'x',value:Infinity}]}));
 assert.equal(c.snapshot().affineProblem.confirmed,false);
 c.dispose();
});

test('same project can stage two nonlinear distance branches without turning numeric roots into certified Geometry or V5',()=>{
 const {c,session}=setup();
 const candidate={solverKind:'nonlinear',frame:'model-mm-2d',unit:'mm',
  points:[{id:'A'},{id:'B'},{id:'P'}],
  constraints:[
   {id:'AnchorA',kind:'fixed',point:'A',at:{x:0,y:0}},
   {id:'AnchorB',kind:'fixed',point:'B',at:{x:4,y:0}},
   {id:'CircleA',kind:'distance',a:'A',b:'P',value:3},
   {id:'CircleB',kind:'distance',a:'B',b:'P',value:3}
  ],
  seeds:[
   {id:'Upper',coordinates:{A:{x:0,y:0},B:{x:4,y:0},P:{x:2,y:2}}},
   {id:'Lower',coordinates:{A:{x:0,y:0},B:{x:4,y:0},P:{x:2,y:-2}}}
  ]};
 c.putAffineProblem(candidate);
 assert.equal(c.snapshot().affineProblem.solverKind,'nonlinear');
 assert.equal(c.snapshot().affineProblem.confirmed,false);
 assert.throws(()=>session.solve(),/尚未经人工确认/);
 c.confirmAffineProblem();
 const result=session.solve();
 assert.equal(result.kind,'nonlinear-evidence');
 assert.equal(result.evidence.localCandidates.length,2);
 assert.equal(result.evidence.solveResult.status,'undetermined');
 assert.equal(result.scene,null);
 assert.equal(result.verified,false);
 assert.equal(result.plan,null);
 assert.equal(result.clock,null);
 assert.equal(c.canExport(),false);
 const backup=importProject(exportProject(c.snapshot()));
 assert.equal(backup.affineProblem.seeds.length,2);
 assert.equal(Object.hasOwn(backup,'verified'),false);
 c.setImage('ChangedSource');
 assert.equal(session.readSnapshot(),null);
 assert.equal(c.snapshot().affineProblem.confirmed,false);
 assert.throws(()=>session.solve(),/尚未经人工确认/);
 c.dispose();
});
test('do not accept forged nonlinear M3 proof in imported project or unsupported tangency under a reviewed source',()=>{
 const {c}=setup();
 const valid={solverKind:'nonlinear',frame:'model-mm-2d',unit:'mm',
  points:[{id:'A'},{id:'B'}],
  constraints:[{id:'Length',kind:'distance',a:'A',b:'B',value:10}],
  seeds:[{id:'Seed1',coordinates:{A:{x:0,y:0},B:{x:10,y:0}}}]};
 c.putAffineProblem(valid);
 const p=c.snapshot();
 assert.throws(()=>importProject(JSON.stringify({...p,
  affineProblem:{...p.affineProblem,v5Ready:true}})),/约束/);
 assert.throws(()=>c.putAffineProblem({...valid,
  constraints:[{id:'Unsafe',kind:'tangent',a:'A',b:'B'}]}),/约束/);
 assert.equal(c.snapshot().affineProblem.confirmed,false);
 c.dispose();
});
