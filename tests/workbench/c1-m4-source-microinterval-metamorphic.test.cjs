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
 }
});
