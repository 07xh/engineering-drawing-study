'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {verifiedPolygonIntentTimeline:run}=
 require('../../workbench/verified-polygon-intent-v1.cjs');
const {regularPolygonInCircle:solve}=
 require('../../engines/planar/inscribed-regular-polygon.cjs');
const {validateConstructionIntentDAG,CONSTRUCTION_INTENT_VERSION:VERSION}=
 require('../../core/contracts/construction-intent.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const paper={origin:{x:320,y:220},scale:6};
const P=(x,y)=>({x,y});
const input=(n=6,direction='ccw',revision=5)=>({
 unit:'mm',center:P(12,-8),radiusMm:30,sideCount:n,
 firstVertexAngleDeg:27,direction,revision,sourceConfirmed:true
});
const near=(a,b,tol=1e-8)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),a+' != '+b);
for(const n of [3,6])for(const direction of ['cw','ccw']){
 test('02 M3 -> Intent DAG -> one V5 replays true '+n+'-gon '+direction,()=>{
  const data=input(n,direction),before=JSON.stringify(data);
  const out=run(data,paper);
  const source={...data};delete source.sourceConfirmed;
  const actual=solve(source);
  assert.equal(actual.status,'ready');
  assert.equal(out.status,'ready');
  assert.equal(out.canonicalVerified,true);
  assert.equal(out.mathematicallyVerified,true);
  assert.equal(out.schema,VERSION);
  assert.equal(out.sourceConfirmation,'caller-reviewed-parameters');
  assert.equal(out.publicWorkbenchConnected,false);
  assert.equal(out.selectedBranchId,null);
  assert.equal(out.constructionIntents.length,1+2*n);
  assert.equal(out.steps.length,1+2*n);
  assert.equal(out.timing.steps.length,1+2*n);
  assert.equal(out.timing.segments.length,1+2*n);
  assert.equal(validateConstructionIntentDAG(out.constructionIntents).ok,true);
  assert.equal(JSON.stringify(data),before);
  assert.deepEqual(out.modelEdges,actual.edges);
  assert.deepEqual(out.modelVertices,actual.vertices);
  const sign=direction==='ccw'?1:-1;
  for(let i=0;i<n;i++){
   const theta=(27+sign*i*360/n)*Math.PI/180;
   const a=P(data.center.x+30*Math.cos(theta),data.center.y+30*Math.sin(theta));
   const bTheta=(27+sign*(i+1)*360/n)*Math.PI/180;
   const b=P(data.center.x+30*Math.cos(bTheta),data.center.y+30*Math.sin(bTheta));
   const intent=out.constructionIntents[1+n+i];
   assert.deepEqual(intent.inputEntityIds,[
    'polygon-point-'+(i+1),'polygon-point-'+((i+1)%n+1)]);
   assert.equal(intent.operations[0].kind,'line');
   const actualModel=intent.operations[0].geometry;
   near(actualModel.from.x,a.x);near(actualModel.from.y,a.y);
   near(actualModel.to.x,b.x);near(actualModel.to.y,b.y);
   const edgeAction=out.steps[1+n+i].actions[0];
   assert.equal(edgeAction.kind,'line');
   near(edgeAction.geometry.from.x,paper.origin.x+paper.scale*a.x);
   near(edgeAction.geometry.from.y,paper.origin.y-paper.scale*a.y);
   near(edgeAction.geometry.to.x,paper.origin.x+paper.scale*b.x);
   near(edgeAction.geometry.to.y,paper.origin.y-paper.scale*b.y);
   const partial=Motion.actionShapeAttrs(edgeAction,0.25);
   const halfway=Motion.actionShapeAttrs(edgeAction,0.5);
   const final=Motion.actionShapeAttrs(edgeAction,1);
   near(partial.x2,partial.x1+0.25*(final.x2-final.x1));
   near(halfway.y2,halfway.y1+0.5*(final.y2-final.y1));
   near(final.x2,edgeAction.geometry.to.x);
   const segment=out.timing.segments[1+n+i];
   near(Timeline.frame(out.timing,segment.startMs+segment.durationMs/2)
    .actionFractions[edgeAction.id],0.5);
  }
  const ring=out.steps[0].actions[0];
  assert.equal(ring.kind,'circle');
  assert.ok(Motion.actionShapeAttrs(ring,0.5)['stroke-dasharray']!=='none');
  assert.equal(Motion.actionShapeAttrs(ring,1)['stroke-dasharray'],'none');
  assert.equal(Timeline.frame(out.timing,out.timing.totalMs).done,true);
 });
 });
}
test('polygon source input must be manually confirmed; no input proof claim injection',()=>{
 const data=input();
 const denied=run({...data,sourceConfirmed:false},paper);
 assert.equal(denied.status,'not-verified');
 assert.deepEqual(denied.constructionIntents,[]);
 assert.deepEqual(denied.steps,[]);
 assert.equal(denied.mathematicallyVerified,false);
 assert.throws(()=>run({...data,verified:true},paper),/unknown/);
 assert.throws(()=>run({...data,unit:'px'},paper),/model-mm|confirmed mm/);
});
test('missing angle or branch is not a unique construction or animation',()=>{
 for(const key of ['firstVertexAngleDeg','direction']){
  const data=input();delete data[key];
  const out=run(data,paper);
  assert.equal(out.status,'not-verified');
  assert.equal(out.canonicalVerified,undefined);
  assert.deepEqual(out.steps,[]);
  assert.equal(out.timing,null);
 }
});
test('under-resolved sheet-px must not claim a drawable V5 figure',()=>{
 const denied=run(input(),{origin:P(0,0),scale:0.001});
 assert.equal(denied.status,'not-verified');
 assert.match(denied.reason,/under-resolved/);
 assert.deepEqual(denied.constructionIntents,[]);
 assert.throws(()=>run(input(),{origin:P(0,0),scale:0}),/mapping/);
});
test('pathological source precision fails closed before producing semantic or V5 geometry',()=>{
 const data={...input(6),center:P(1e6,1e6),radiusMm:1.01e-6};
 const denied=run(data,{origin:P(0,0),scale:1e7});
 assert.equal(denied.status,'not-verified');
 assert.deepEqual(denied.constructionIntents,[]);
 assert.deepEqual(denied.steps,[]);
});
test('sheet transform changes render pixels but not mathematical DAG',()=>{
 const data=input(3);
 const a=run(data,paper),b=run(data,{origin:P(60,90),scale:10});
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.deepEqual(a.constructionIntents,b.constructionIntents);
 assert.deepEqual(a.modelVertices,b.modelVertices);
 assert.notDeepEqual(a.steps.at(-1).actions[0].geometry,
  b.steps.at(-1).actions[0].geometry);
});
test('fresh revisions invalidate existing V5 player, and speed/seek/rollback still work',()=>{
 const first=run(input(6,'ccw',30),paper);
 const player=Timeline.createPlayer(first.timing,{revision:30});
 assert.equal(player.canRender(30),true);
 const start=player.play(1000);
 assert.equal(start.playing,true);
 const faster=player.setSpeed(2,1010);
 assert.equal(faster.speed,2);
 const seek=player.seekStep(first.steps.length-1,1020);
 assert.equal(seek.activeStepId,first.steps.at(-1).id);
 const invalid=player.invalidate(31,1030);
 assert.equal(invalid.invalid,true);
 assert.equal(player.canRender(30),false);
 const revised=run(input(6,'cw',31),paper);
 assert.equal(revised.status,'ready');
 assert.equal(revised.revision,31);
 assert.notDeepEqual(revised.modelVertices,first.modelVertices);
 assert.equal(revised.constructionIntents[0].source.revision,31);
 assert.equal(player.reset(31,1040).invalid,false);
 assert.equal(player.canRender(31),true);
});
