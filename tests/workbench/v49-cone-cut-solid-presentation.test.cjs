'use strict';
/* Independent presentational mesh checks: NEVER promote sampled triangles
 * to continuous occlusion or exact conic proof. */
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSpatialV5Preview}=require('../../workbench/cone-spatial-v5-preview.cjs');
const {coneCutSolidPresentation:solid}=
 require('../../workbench/cone-cut-solid-presentation.cjs');
const {coneLinkedSpatialScene:scene}=
 require('../../workbench/cone-linked-spatial-view.cjs');
const fs=require('node:fs');
const path=require('node:path');
const P=(x,y,z)=>({x,y,z});
const cone={baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane=z=>({point:P(0,0,z),normal:P(1,0,3),modelUnit:'mm'});
const source=(kind='full-ellipse',z=6,revision=22,samples=64)=>
 coneSpatialV5Preview(cone,plane(z),{kind,revision,samples,
  sourceConfirmed:true,presentationMode:'split-sheet',provenGuideDag:true
 });
const close=(a,b,tol=1e-7)=>assert.ok(
 Number.isFinite(a)&&Math.abs(a-b)<tol*Math.max(1,Math.abs(a),Math.abs(b)),
 String(a)+' != '+String(b));
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
function verifyMesh(m,side){
 assert.equal(m.status,'sampled-closed-cut-mesh');
 assert.equal(m.retainedPiece,side);
 assert.equal(m.meshEdgesTwoIncidentTriangles,true);
 assert.equal(m.sectionOnSourcePlaneVerified,true);
 assert.equal(m.actualHalfspaceApplied,true);
 assert.equal(m.sourceMathVerified,true);
 assert.equal(m.exactConicFaceVerified,false);
 assert.equal(m.completeSolidVisibilityVerified,false);
 assert.equal(m.standardLineStyleVerified,false);
 assert.equal(m.noSecondSolverOrPlayer,true);
 const n=P(1,0,3),p=P(0,0,6);
 const sign=m.retainedHalfspace==='positive'?1:-1;
 for(const v of m.vertices){
  assert.ok(['analytic-section-sample','section-interior-presentation',
   'apex','base-rim','base-center'].includes(v.role));
  const distance=dot(P(v.world.x-p.x,v.world.y-p.y,v.world.z-p.z),n);
  assert.ok(sign*distance>=-1e-5,'retained cut-side invariant violated');
 }
 const edgeCounts=new Map();
 for(const face of m.triangles){
  assert.equal(face.indices.length,3);
  for(const id of face.indices)assert.ok(m.vertices[id]);
  for(let i=0;i<3;i++){
   const a=face.indices[i],b=face.indices[(i+1)%3];
   const key=[a,b].sort((x,y)=>x-y).join('/');
   edgeCounts.set(key,(edgeCounts.get(key)||0)+1);
  }
 }
 assert.ok([...edgeCounts.values()].every(x=>x===2));
}
test('04/07 full finite cone: both halfspaces give closed triangle surface from SAME verified section',()=>{
 const p=source(),proof=p.spatialIntent;
 const original=JSON.stringify(proof);
 const upper=solid(proof,{retainedHalfspace:'positive'});
 const lower=solid(proof,{retainedHalfspace:'negative'});
 verifyMesh(upper,'apex');verifyMesh(lower,'base');
 assert.equal(upper.triangles.length,128);
 assert.equal(lower.triangles.length,256);
 assert.equal(upper.triangles.filter(x=>x.kind==='cut-face').length,64);
 assert.equal(lower.triangles.filter(x=>x.kind==='base').length,64);
 assert.equal(upper.vertices.filter(x=>x.role==='base-rim').length,0);
 assert.equal(lower.vertices.filter(x=>x.role==='base-rim').length,64);
 assert.equal(JSON.stringify(proof),original);
 assert.equal(p.player.canRender(22),true);
 assert.equal(p.steps.filter(s=>s.role==='result').length,3);
});
test('07 3D camera rotates ONE cut solid, all spatial source IDs and V5 actions remain identical',()=>{
 const p=source(),intent=p.spatialIntent;
 const a=scene(intent,{retainedHalfspace:'positive',azimuthDeg:10,elevationDeg:30});
 const b=scene(intent,{retainedHalfspace:'positive',azimuthDeg:90,elevationDeg:70});
 assert.equal(a.cutSolid.status,'sampled-closed-cut-mesh');
 assert.equal(a.cutSolid.triangles.length,128);
 assert.equal(a.segments.length,64);
 assert.equal(a.sourceSpatialIntentId,b.sourceSpatialIntentId);
 assert.deepEqual(a.segments.map(s=>s.sourceActionId),
  b.segments.map(s=>s.sourceActionId));
 assert.deepEqual(a.sourcePoints.map(x=>x.world),b.sourcePoints.map(x=>x.world));
 assert.notDeepEqual(a.cutSolid.triangles[0].points,b.cutSolid.triangles[0].points);
 assert.ok(a.cutSolid.triangles.every(t=>t.points.length===3&&
  Number.isFinite(t.averageDepth)&&t.points.every(q=>
   Number.isFinite(q.x)&&Number.isFinite(q.y))));
 assert.ok(a.cutSolid.triangles.slice(1).every((t,i)=>
  t.averageDepth>=a.cutSolid.triangles[i].averageDepth));
 assert.equal(a.visibilityVerified,false);
 const legacy=scene(intent);
 assert.equal(legacy.cutSolid,null);
 assert.deepEqual(legacy.segments.map(s=>s.sourceActionId),
  a.segments.map(s=>s.sourceActionId));
});
test('09 declined, missing kept-side, unproven clipped solid always fail closed',()=>{
 const clipped=source('clipped-ellipse',1).spatialIntent;
 const out=solid(clipped,{retainedHalfspace:'positive'});
 assert.equal(out.status,'not-supported');
 assert.deepEqual(out.triangles,[]);
 assert.equal(out.completeSolidVisibilityVerified,false);
 assert.equal(scene(clipped,{retainedHalfspace:'positive'}).cutSolid.status,
  'not-supported');
 assert.throws(()=>solid(source().spatialIntent),/halfspace/);
 assert.throws(()=>solid(source().spatialIntent,{retainedHalfspace:'outside'}),/halfspace/);
 const intent=source().spatialIntent;
 assert.throws(()=>solid({...intent,revision:999},{retainedHalfspace:'positive'}),
  /validated/);
 assert.throws(()=>solid({...intent,source:{
  ...intent.source,visibilityVerified:true}},{retainedHalfspace:'positive'}),
  /validated/);
 const declined=coneSpatialV5Preview(cone,plane(6),{
  kind:'full-ellipse',revision:3,sourceConfirmed:false,
  presentationMode:'split-sheet',provenGuideDag:true});
 assert.equal(declined.status,'not-verified');
 assert.throws(()=>solid(declined.spatialIntent,{retainedHalfspace:'positive'}),/validated/);
});
test('07 presentational cut mesh uses public cone page with no second player or remote input',()=>{
 const root=path.resolve(__dirname,'../..');
 const entry=fs.readFileSync(path.join(root,'labs/cone-cut-live-entry.cjs'),'utf8');
 const mod=fs.readFileSync(path.join(root,'workbench/cone-cut-solid-presentation.cjs'),'utf8');
 assert.match(entry,/retainedHalfspace:\$\('coneKept'\)\.value\|\|null/);
 assert.match(entry,/data-cone-solid-face/);
 assert.match(entry,/paintSpatial\(frame\)/);
 assert.doesNotMatch(mod,/createPlayer|compileTimeline|requestAnimationFrame|fetch\s*\(/);
 assert.doesNotMatch(entry,/innerHTML|localStorage|WebSocket|sendBeacon|fetch\s*\(/);
});
