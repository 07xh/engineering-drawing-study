'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1OriginalPaperSourcePrecedence:audit}=
 require('../../workbench/c1-m5-original-paper-source-precedence.cjs');
const p=(x,y,z)=>({x,y,z});
const box=()=>{
 const g=prismMesh({solid:{min:p(-4,2,-6),max:p(21,17,30)}});
 return {...g,id:'C1PaperPriorityBox'};
};
const tetra=()=>({
 id:'C1PaperPrioritySkewTetra',kind:'mesh',
 space:'model-3d',unit:'mm',
 data:{points:{A:p(0,0,0),B:p(17,1,3),
  C:p(3,16,2),D:p(5,6,23)},
 edges:[['A','B'],['A','C'],['A','D'],
  ['B','C'],['B','D'],['C','D']],
 faces:[['A','B','C'],['A','B','D'],
  ['A','C','D'],['B','C','D']]}
});
const check=(g,revision)=>{
 const result=audit({geometry:g,revision});
 assert.equal(result.revision,revision);
 assert.equal(result.sourceGeometryId,g.id);
 assert.equal(result.signedV5ActionCount,0);
 assert.equal(result.standardEngineeringLineStylesAuthorized,false);
 assert.equal(result.wholeSolidV5Ready,false);
 const c=result.counts;
 assert.equal(c.allOriginalSourceProjectedSubspans,
  result.subspans.length);
 assert.equal(c.allOriginalSourceProjectedSubspans,
  c.originalPhysicalNonHullSubspans+
  c.existingM5ExteriorHeld+c.coplanarOrUnprovenFeatureHeld);
 assert.equal(c.originalPhysicalNonHullSubspans,
  c.soleListedSource+c.strictFrontAmongListed+c.behindAnother+
  c.exactPhysicalDuplicates+c.unresolvedAlias);
 for(const s of result.subspans){
  assert.equal(s.signedV5Action,false);
  assert.equal(s.engineeringLineStyle,'undetermined');
  assert.equal(s.actualOpaqueFaceOcclusionAndEndpointJoinsProven,false);
  assert.ok(s.sourceCompetingPhysicalEdges.every(e=>
   e.signedV5Action===false&&
   e.officialEngineeringLineStyle==='undetermined'));
 }
 assert.ok(Object.isFrozen(result));
 return result;
};
test('true cuboid paper aliases at DISTINCT 3D observer depths are not falsely deduplicated',()=>{
 const g=box(),r=check(g,18);
 assert.ok(r.counts.positivePairDepthComparisons>0,
  'actual reviewed cuboid original source aliases need depth comparison');
 // On an axis-aligned box, the front/back source pairs may BOTH
 // belong to existing formal M5 exterior-overlapping paper strokes.
 // The ledger preserves those comparisons without reminting them as
 // non-hull internal feature line winners.
 assert.ok(r.counts.existingM5ExteriorHeld>0);
 const distinct=r.subspans.flatMap(s=>s.sourceCompetingPhysicalEdges).
  filter(x=>x.originalAffinePairwiseWholeOpenDepthVerified);
 assert.ok(distinct.length>0);
 assert.ok(distinct.some(x=>x.exactSame3DPhysicalLineLocus===false));
 assert.ok(r.subspans.some(s=>s.originalM5ExteriorContourOverlap===true&&
  s.status==='existing-m5-exterior-contour-held'));
});
test('oblique convex six-face source has strict non-hull front and behind priority',()=>{
 const q=prismMesh({solid:{min:p(0,0,0),max:p(2,4,9)}});
 const g={...q,id:'C1PaperPriorityOblique',data:{
  ...q.data,points:Object.fromEntries(Object.entries(q.data.points).map(
   ([id,x])=>[id,{x:x.x+x.y/2,y:x.y,z:x.z}]))}};
 const r=check(g,32);
 assert.ok(r.counts.strictFrontAmongListed>0);
 assert.ok(r.counts.behindAnother>0);
 assert.equal(r.counts.exactPhysicalDuplicates,0);
 assert.equal(r.counts.unresolvedAlias,0);
 const best=r.subspans.filter(x=>
  x.status==='strict-front-among-listed-original-physical-sources');
 assert.ok(best.every(x=>x.sourceCompetingPhysicalEdges.length>0&&
  x.sourceCompetingPhysicalEdges.every(c=>
   c.strictlyFrontOriginalSourceId===x.originalPhysicalSourceEdgeId)));
 assert.ok(r.subspans.some(x=>
  x.status==='behind-another-original-source-open-interval'));
});
test('skew tetra geometry uses same original source-key and reports only actual positive-length aliases',()=>{
 const g=tetra(),r=check(g,9);
 assert.ok(r.counts.originalPhysicalNonHullSubspans>0);
 assert.equal(r.counts.exactPhysicalDuplicates,0);
 assert.ok(r.subspans.every(s=>s.sourceCompetingPhysicalEdges.every(other=>
  other.otherOriginalPhysicalSourceId!==s.originalPhysicalSourceEdgeId)));
});
test('nearly or paper-coincident sources cannot forge exact 3D locus identity or V5',()=>{
 const g=box(),r=check(g,13);
 for(const s of r.subspans){
  for(const other of s.sourceCompetingPhysicalEdges){
   if(other.exactSame3DPhysicalLineLocus)
    assert.equal(s.status,'exact-original-3d-feature-duplicate-held');
   assert.equal(other.everyOpaqueFaceAndPhysicalJunctionProven,false);
  }
 }
 assert.equal(r.counts.attemptedV5Actions,0);
});
test('malformed topology and source revision fail before the M4/M5 original-paper ledger',()=>{
 const g=box();
 assert.throws(()=>audit({geometry:g,revision:0}),/revision/);
 assert.throws(()=>audit({geometry:{...g,data:{...g.data,
  faces:g.data.faces.slice(1)}},revision:3}),/closed|Euler|face/);
 const malformed={...g,data:{...g.data,
  edges:[...g.data.edges,[...g.data.edges[0]]]}};
 assert.throws(()=>audit({geometry:malformed,revision:3}),
  /duplicate|declared|explicit finite|Euler/);
});
