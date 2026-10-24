'use strict';
/**
 * Shared M5 -> M4 first-angle projected edge-event provenance.
 * The SAME approved 3D source mesh edges must generate every crossing,
 * overlap, swap and endpoint event. Untrusted published audit arrays may
 * not introduce/delete paper cuts before ConstructionIntent/V5 consumption.
 *
 * Caller validates the closed convex Geometry meshes independently.
 * This helper is pure math evidence, NOT a renderer or V5 style authority.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {inspectProjectedEdgeDepth}=
 require('../core/numeric/projected-edge-depth-events.cjs');
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const y of Object.values(x))freeze(y);
  Object.freeze(x);
 }
 return x;
};
function recomputeReviewedProjectedEdgeEvents(allEdges){
 if(!Array.isArray(allEdges)||allEdges.length>40)
  throw new TypeError('at most 40 independently reviewed source edges required');
 const ids=new Set();
 for(const item of allEdges){
  if(!item||typeof item.sourceEdgeId!=='string'||
     typeof item.sourceGeometryId!=='string'||
     ids.has(item.sourceEdgeId)||!item.edge)
   throw new TypeError('unique source mesh edge identity required');
  ids.add(item.sourceEdgeId);
 }
 let pairCount=0;const events=[];
 for(let i=0;i<allEdges.length;i++)for(let j=i+1;j<allEdges.length;j++){
  const first=allEdges[i],second=allEdges[j];
  for(const view of VIEWS){
   const witness=inspectProjectedEdgeDepth({
    first:first.edge,second:second.edge,view
   });
   pairCount++;
   if(!['crossing','collinear-overlap',
     'endpoint-touch-undetermined'].includes(witness.status))continue;
   events.push({
    view,firstSourceGeometryId:first.sourceGeometryId,
    firstSourceEdgeId:first.sourceEdgeId,
    secondSourceGeometryId:second.sourceGeometryId,
    secondSourceEdgeId:second.sourceEdgeId,
    relation:witness.status,
    events:witness.events,ranges:witness.ranges,
    completeOcclusionVerified:false,officialLineStyleVerified:false
   });
  }
 }
 return freeze({status:'pairwise-depth-events-only',pairCount,events,
  completeContourVerified:false});
}
module.exports={recomputeReviewedProjectedEdgeEvents};
