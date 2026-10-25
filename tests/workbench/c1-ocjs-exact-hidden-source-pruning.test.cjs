'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1ExactHiddenProjectedCandidatePruning:audit}=
 require('../../workbench/c1-ocjs-exact-hidden-source-pruning.cjs');
const p=(x,y,z)=>({x,y,z});
const convex=()=>{
 const g=prismMesh({solid:{min:p(0,0,0),max:p(2,4,9)}});
 return {...g,id:'C1ExactHiddenCandidateConvex',data:{
  ...g.data,points:Object.fromEntries(
   Object.entries(g.data.points).map(([id,q])=>[
    id,{x:q.x+q.y/2,y:q.y,z:q.z}]))}};
};
const eid=(g,a,b)=>g.id+'::'+[a,b].sort().join('|');
function witness(){
 const g=convex(),front=eid(g,'V100','V101'),
  behind=eid(g,'V010','V011');
 const from={u:2,v:0},to={u:2,v:9};
 return {g,front,behind,from,to,originalSegment:{
  view:'V',from,to,
  projectedOriginalEdgeCandidates:[behind,front].sort()
 }};
}
test('exact strict-inward back edge is removed, real front original source remains only an UNSIGNED possibility',()=>{
 const {g,front,behind,from,to,originalSegment}=witness();
 const result=audit({geometry:g,revision:71,view:'V',
  targetSourceEdgeId:front,fromModelMm:from,toModelMm:to,
  cadVisibleSegments:[originalSegment]});
 assert.equal(result.sourceTargetCoveredByRealCADProjectedSegments,true);
 assert.deepEqual(result.originalPaperCandidateEdgeIds,[behind,front].sort());
 assert.deepEqual(result.unexcludedOriginalPaperCandidateEdgeIds,[front]);
 assert.deepEqual(result.strictlyInwardOccludedCandidateExclusions.map(x=>
  x.sourceEdgeId),[behind]);
 assert.equal(result.multipleCandidatesNarrowedByExactM0,true);
 assert.equal(result.targetUniqueWithinOriginalPaperCandidatesByExactM0,true);
 assert.equal(result.actualOCCTTopoDSEdgeIdentityRecovered,false);
 assert.equal(result.officialEngineeringLineStyle,'undetermined');
 assert.equal(result.signedV5Action,false);
 assert.ok(Object.isFrozen(result));
});
test('back-facing edge cannot become a visible candidate just because front real HLR projects on same paper',()=>{
 const {g,front,behind,from,to,originalSegment}=witness();
 const result=audit({geometry:g,revision:71,view:'V',
  targetSourceEdgeId:behind,fromModelMm:from,toModelMm:to,
  cadVisibleSegments:[originalSegment]});
 assert.equal(result.targetUniqueWithinOriginalPaperCandidatesByExactM0,false);
 assert.deepEqual(result.unexcludedOriginalPaperCandidateEdgeIds,[behind,front].sort());
 assert.equal(result.signedV5Action,false);
});
test('undetermined/tangent competitors are NOT removed to make CAD falsely unique',()=>{
 const g=prismMesh({solid:{min:p(0,0,0),max:p(10,10,10)}});
 const current={...g,id:'C1TangentCandidateBox'};
 const front=eid(current,'V000','V100'),
  back=eid(current,'V010','V110'),
  seg={view:'V',from:{u:0,v:0},to:{u:10,v:0},
   projectedOriginalEdgeCandidates:[front,back]};
 const result=audit({geometry:current,revision:6,view:'V',
  targetSourceEdgeId:front,fromModelMm:seg.from,toModelMm:seg.to,
  cadVisibleSegments:[seg]});
 assert.equal(result.targetUniqueWithinOriginalPaperCandidatesByExactM0,false);
 assert.equal(result.strictlyInwardOccludedCandidateExclusions.length,0);
 assert.equal(result.survivingPhysicalSourceCandidateMultiplicity,2);
});
test('forged CAD edge candidate with unrelated original 3D paper projection is rejected',()=>{
 const {g,front,from,to}=witness();
 const impossible=eid(g,'V000','V001');
 assert.throws(()=>audit({geometry:g,revision:11,view:'V',
  targetSourceEdgeId:front,fromModelMm:from,toModelMm:to,
  cadVisibleSegments:[{view:'V',from,to,
   projectedOriginalEdgeCandidates:[front,impossible]}]
 }),/paper candidate cannot belong/);
});
test('stale revision, nonexistent edge and open convex surface cannot gain any independent identity',()=>{
 const {g,front,from,to,originalSegment}=witness();
 assert.throws(()=>audit({geometry:g,revision:0,view:'V',
  targetSourceEdgeId:front,fromModelMm:from,toModelMm:to,
  cadVisibleSegments:[originalSegment]}),/revision|real C1/);
 assert.throws(()=>audit({geometry:g,revision:2,view:'V',
  targetSourceEdgeId:'fake',fromModelMm:from,toModelMm:to,
  cadVisibleSegments:[originalSegment]}),/missing original/);
 assert.throws(()=>audit({geometry:{...g,data:{...g.data,
  faces:g.data.faces.slice(1)}},revision:2,view:'V',
  targetSourceEdgeId:front,fromModelMm:from,toModelMm:to,
  cadVisibleSegments:[originalSegment]}),/closed|face|Euler/);
});
