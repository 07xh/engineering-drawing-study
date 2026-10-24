'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh,createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const {newProject,createCoordinator}=
 require('../../project/project-coordinator.cjs');
const {evaluateReviewedBoxContacts,boxFromConfirmedConvexMesh}=
 require('../../core/geometry/reviewed-box-contact-evidence.cjs');
const fs=require('node:fs');
const p=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const q=(x,y,z)=>({x,y,z});
const base=()=>p('A',q(0,0,0),q(10,10,10));
function pair(g){return evaluateReviewedBoxContacts({geometry:[base(),g],revision:5});}
for(const [name,min,max,expected] of [
 ['disjoint',q(12,0,0),q(20,10,10),'separated'],
 ['shared face',q(10,0,0),q(18,10,10),'face-contact'],
 ['shared edge',q(10,10,0),q(18,18,10),'edge-contact'],
 ['shared vertex',q(10,10,10),q(18,18,18),'point-contact'],
 ['volume intersection',q(8,8,8),q(18,18,18),'volumetric-overlap'],
 ['enclosed',q(2,2,2),q(8,8,8),'volumetric-overlap']
]){
 test('C2 pairwise reviewed cuboids: '+name,()=>{
  const ev=pair(p('B',min,max)),x=ev.pairs[0];
  assert.equal(ev.status,'pairwise-proven');
  assert.equal(ev.revision,5);
  assert.equal(ev.boxCount,2);
  assert.equal(ev.pairCount,1);
  assert.deepEqual(x.objectIds,['A','B']);
  assert.equal(x.relation,expected);
  assert.equal(x.visibleHiddenLineStyles,'undetermined');
  assert.equal(x.booleanUnionVerified,false);
  assert.equal(x.occlusionVerified,false);
  assert.equal(ev.officialLineStylesVerified,false);
  assert.equal(ev.v5Ready,false);
  assert.equal(ev.constructedGeometry,null);
  assert.ok(Object.isFrozen(ev.pairs));
  assert.ok(Object.isFrozen(x.axisOverlapMm));
 });
}
test('C2 edge orientation and source IDs do not alter spatial relation, but changed sizes do',()=>{
 const a=base(),b=p('B',q(10,0,0),q(20,10,10));
 b.data.edges.reverse();
 const e=evaluateReviewedBoxContacts({geometry:[b,a],revision:3});
 assert.equal(e.pairs[0].relation,'face-contact');
 assert.deepEqual(e.sourceGeometryIds,['B','A']);
 const f=evaluateReviewedBoxContacts({geometry:[a,p('B',q(11,0,0),q(20,10,10))],revision:4});
 assert.equal(f.pairs[0].relation,'separated');
 assert.equal(f.revision,4);
});
test('C2 near floating critical contact is explicitly undetermined, not guessed',()=>{
 const e=pair(p('B',q(10+1e-10,0,0),q(20,10,10)));
 assert.equal(e.pairs[0].relation,'undetermined-near-contact');
 const overlap=pair(p('B',q(10-1e-10,0,0),q(20,10,10)));
 assert.equal(overlap.pairs[0].relation,'undetermined-near-contact');
});
test('C2 general noncuboid/invalid open mesh cannot be upgraded using bounding boxes',()=>{
 const warped=base();warped.id='B';
 warped.data.points.V111.x=9; // not one of the axis-aligned bounds
 const result=evaluateReviewedBoxContacts({geometry:[base(),warped],revision:7});
 assert.equal(result.status,'scoped-only');
 assert.equal(result.boxCount,1);
 assert.equal(result.unsupportedCount,1);
 assert.equal(result.pairCount,0);
 const opened=base();opened.data.faces.pop();
 assert.equal(boxFromConfirmedConvexMesh(opened),null);
 assert.throws(()=>evaluateReviewedBoxContacts({geometry:[base(),base()],revision:1}),/duplicate/);
 assert.throws(()=>evaluateReviewedBoxContacts({geometry:[],revision:-1}),/revision/);
});
test('C2 mixed point geometry remains a source, but not a solid/contact claim',()=>{
 const point={id:'P',kind:'point',space:'model-3d',unit:'mm',data:q(3,5,7)};
 const ev=evaluateReviewedBoxContacts({geometry:[base(),point],revision:6});
 assert.equal(ev.boxCount,1);
 assert.equal(ev.pairCount,0);
 assert.equal(ev.v5Ready,false);
});
test('C2 existing V7 confirmed composition receives evidence but never math/V5 proof',()=>{
 const coord=createCoordinator(newProject({id:'CuboidComposition',task:'composition'}));
 const session=createUnifiedProjectSession();coord.attachSolver(session);
 for(const g of [base(),p('B',q(10,0,0),q(20,10,10))]){
  coord.putObject({id:g.id,kind:'solid',spatialId:g.id+'_3D',
   projections:{V:[g.id+'_V'],H:[g.id+'_H'],W:[g.id+'_W']}});
  coord.putCondition({id:'geo_'+g.id,objectId:g.id,sourceCandidateId:null,
   confirmed:false,value:{type:'manual-geometry',unit:'mm',
    imageId:coord.snapshot().source.imageId,geometry:g}});
  coord.confirmCondition('geo_'+g.id);
 }
 const result=session.solve();
 assert.equal(result.kind,'composition-evidence');
 assert.equal(result.verified,false);
 assert.equal(result.clock,null);
 assert.equal(result.plan,null);
 assert.equal(coord.canExport(),false);
 assert.equal(result.compositionContactEvidence.pairs[0].relation,'face-contact');
 const before=result.inputRevision;
 coord.deleteObject('B');
 assert.ok(coord.snapshot().revision>before);
 assert.equal(session.readSnapshot(),null);
 session.dispose();coord.dispose();
});
test('C2 UI status explicitly disclaims entity merge and formal line styles',()=>{
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 const home=require('../../ui-next/home.cjs').homeHTML();
 assert.ok(home.includes('id="v7-c-contacts"'));
 assert.match(ui,/compositionContactEvidence/);
 assert.match(ui,/不代表实体并集、完整轮廓、虚实线或正式 V5/);
});
