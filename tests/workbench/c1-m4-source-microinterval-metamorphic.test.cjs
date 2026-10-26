'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1ReviewedProjectedSourceEventGraph}=require('../../workbench/c1-reviewed-projected-source-event-graph.cjs');
const {exactCandidateIntervalCoverage}=require('../../workbench/c1-original-source-interval-coverage.cjs');

const xyz=(x,y,z)=>({x,y,z});
function oblique(id,dx,dy,dz){
 const base=prismMesh({solid:{min:xyz(0,0,0),max:xyz(2,4,9)}});
 return {...base,id,data:{...base.data,points:Object.fromEntries(
  Object.entries(base.data.points).map(([key,p])=>
   [key,xyz(p.x+p.y/2+dx,p.y+dy,p.z+dz)]))}};
}
test('C1 M4 positive 3D parameter tails survive translated oblique solids without becoming drawable strokes',()=>{
 for(const [index,offset] of [[0,[0,0,0]],[1,[11,-7,5]],[2,[-13,8,-4]]]){
  const geometry=oblique('C1MicroMetamorphic'+index,...offset);
  const result=auditC1ReviewedProjectedSourceEventGraph({
   geometry,revision:90+index,proofMode:'m5-hull-required'});
  assert.equal(result.originalSourceEdgeViewCount,geometry.data.edges.length*3);
  assert.equal(result.rows.length,geometry.data.edges.length*3);
  assert.equal(new Set(result.rows.map(row=>row.view+'@'+row.sourceEdgeId)).size,
   geometry.data.edges.length*3);
  let micro=0;
  for(const row of result.rows){
   if(row.collapsedProjection)continue;
   const coverage=exactCandidateIntervalCoverage([0,1],
    row.spans.map(s=>s.originalParameterRange));
   assert.equal(coverage.entireOriginalParameterIntervalCovered,true,
    geometry.id+' '+row.view+' '+row.sourceEdgeId);
   for(const span of row.spans){
    assert.ok(span.originalParameterRange[1]>span.originalParameterRange[0]);
    if(span.projectedSubpixelPaperSegmentHeldAsUndrawable){
     micro++;
     assert.equal(span.source3DIntervalPreservedForFullM5RayContinuity,true);
     assert.equal(span.eligibleForNonHullCandidate,false);
     assert.equal(span.engineeringLineStyle,'undetermined');
     assert.equal(span.signedV5Action,false);
    }
   }
  }
  assert.equal(micro,result.positiveOriginal3DSourceIntervalsRetainedDespiteSubpixelPaperProjection);
  assert.equal(result.signedV5ActionCount,0);
  assert.equal(result.allPhysicalJunctionsCertified,false);
  assert.equal(result.exactSourceDepthForAllProjectedAliasesCertified,false);
 }
});

test('M4-only forensic mode never promotes projected coincidences into physical junctions or V5',()=>{
 const geometry=oblique('C1M4ForensicOnly',3,-5,7);
 const graph=auditC1ReviewedProjectedSourceEventGraph({
  geometry,revision:111,proofMode:'m4-projected-events-only'});
 assert.equal(graph.originalM5ExteriorHullRecomputedAndAvailable,false);
 assert.equal(graph.m4EventOnlyModeDoesNotAssertNonHullVisibility,true);
 assert.equal(graph.rows.length,geometry.data.edges.length*3);
 assert.equal(graph.allPhysicalJunctionsCertified,false);
 assert.equal(graph.exactSourceDepthForAllProjectedAliasesCertified,false);
 assert.equal(graph.sourceIntervalEngineeringLineStylesCertified,false);
 assert.equal(graph.signedV5ActionCount,0);
 assert.equal(graph.wholeSolidV5Ready,false);
 for(const row of graph.rows){
  assert.equal(row.officialLineStylesVerified,false);
  assert.equal(row.signedV5ActionCount,0);
  for(const span of row.spans){
   assert.equal(span.projectedExteriorHullOverlap,null);
   assert.equal(span.eligibleForNonHullCandidate,false);
   assert.equal(span.fullProjectedJunctionAndDepthOrderVerified,false);
   assert.equal(span.engineeringLineStyle,'undetermined');
   assert.equal(span.signedV5Action,false);
  }
 }
});

test('M4 source graph rejects invalid revision and proof mode rather than silently certifying V5',()=>{
 const geometry=oblique('C1InvalidProofMode',0,0,0);
 for(const revision of [0,-1,1.5,NaN]){
  assert.throws(()=>auditC1ReviewedProjectedSourceEventGraph({
   geometry,revision,proofMode:'m4-projected-events-only'}),TypeError);
 }
 assert.throws(()=>auditC1ReviewedProjectedSourceEventGraph({
  geometry,revision:112,proofMode:'v5-authorized'}),TypeError);
});

test('M4-only event partitions are complete in every noncollapsed first-angle source view',()=>{
 const geometry=oblique('C1ForensicCoverage',6,2,-3);
 const graph=auditC1ReviewedProjectedSourceEventGraph({
  geometry,revision:113,proofMode:'m4-projected-events-only'});
 for(const row of graph.rows){
  if(row.collapsedProjection)continue;
  const intervals=row.spans.map(s=>s.originalParameterRange);
  const coverage=exactCandidateIntervalCoverage([0,1],intervals);
  assert.equal(coverage.entireOriginalParameterIntervalCovered,true,
   row.view+' '+row.sourceEdgeId);
  assert.equal(coverage.positiveLengthUncoveredIntervals.length,0);
  for(const span of row.spans){
   assert.equal(span.source3DIntervalPreservedForFullM5RayContinuity,true);
   assert.equal(span.signedV5Action,false);
  }
 }
});

test('exact original source coverage rejects representable positive microgaps',()=>{
 const nextUpOneHalf=0.5000000000000001;
 const gap=exactCandidateIntervalCoverage([0,1],[
  [0,0.5],[nextUpOneHalf,1]]);
 assert.equal(gap.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(gap.positiveLengthUncoveredIntervals,
  [[0.5,nextUpOneHalf]]);
 const joined=exactCandidateIntervalCoverage([0,1],[
  [0,0.5],[0.5,1]]);
 assert.equal(joined.entireOriginalParameterIntervalCovered,true);
 assert.deepEqual(joined.positiveLengthUncoveredIntervals,[]);
});

test('source coverage rejects overlapping candidate multiplicity even when union covers all',()=>{
 const overlap=[[0,0.75],[0.5,1]];
 const coverage=exactCandidateIntervalCoverage([0,1],overlap);
 assert.equal(coverage.entireOriginalParameterIntervalCovered,true);
 assert.equal(coverage.candidateIntervalsExamined,2);
 // A complete union is not proof of unique physical provenance.
 // Native M5 contour parity must independently reject overlapping witnesses.
 const duplicateNativeIntervals=overlap.some((a,i)=>overlap.slice(i+1)
  .some(b=>Math.max(a[0],b[0])<Math.min(a[1],b[1])));
 assert.equal(duplicateNativeIntervals,true);
});
