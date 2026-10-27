'use strict';
/**
 * M0 conservative topology audit over independently certified local joins.
 * A closed contour is only locally connected; full scene/occlusion/V5 remain
 * unverified. No sampling, geometric guesses, or official line-style promotion.
 */
const {proveProjectedJoin}=require('./projected-join-proof.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
function auditProjectedContour({view,edges,vertices,toleranceMm}={}){
 if(!['V','H','W'].includes(view)||!Array.isArray(edges)||edges.length<3||edges.length>256||
  !Array.isArray(vertices)||vertices.length!==edges.length)
  throw new TypeError('bounded contour with matching vertices required');
 const ids=new Set(),vertexIds=new Set(),joins=[];
 for(let i=0;i<edges.length;i++){
  const edge=edges[i],vertex=vertices[i];
  if(!edge||typeof edge.edgeId!=='string'||ids.has(edge.edgeId)||
   !vertex||typeof vertex.id!=='string'||vertexIds.has(vertex.id))
   throw new TypeError('unique edge and vertex identities required');
  ids.add(edge.edgeId);vertexIds.add(vertex.id);
 }
 for(let i=0;i<edges.length;i++){
  const prev=edges[(i+edges.length-1)%edges.length],next=edges[i],vertex=vertices[i];
  // Each edge must explicitly expose its ordered start and end evidence.
  if(!prev.end||!next.start)throw new TypeError('ordered edge endpoint witnesses required');
  joins.push(proveProjectedJoin({left:{...prev.end,edgeId:prev.edgeId},
   right:{...next.start,edgeId:next.edgeId},vertex,view,toleranceMm}));
 }
 const allLocal=joins.every(x=>x.localJoinVerified);
 return freeze({schema:'draftai-projected-contour-topology/1',view,
  status:allLocal?'local-topology-certified':'undetermined',
  joins,localTopologyVerified:allLocal,
  completeSceneVerified:false,continuousOcclusionVerified:false,
  fullContourVerified:false,officialLineStyleVerified:false,
  constructionIntentVerified:false,constructionStepDagVerified:false,
  v5VerifiedExportReady:false});
}
module.exports={auditProjectedContour};
