'use strict';
/**
 * Bind actual M0 analytic occlusion witnesses to the contour audit.
 * This intentionally never synthesizes continuous clearance or depth order:
 * convex-segment-occlusion proves only positive-depth open interiors.
 * The result is a real-kernel diagnostic, NOT a full-scene certificate.
 */
const {certifyConvexSegmentOcclusion}=require('./convex-segment-occlusion.cjs');
const {auditMultiSolidContour}=require('./multi-solid-contour-audit.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
function auditContourWithM0Occlusion({view,edges,vertices,sources,solids,
 observerDirection,marginMm=1e-7,angularTolerance=1e-12}={}){
 if(!Array.isArray(sources)||!Array.isArray(edges)||sources.length!==edges.length||
  !Array.isArray(solids)||!solids.length||solids.length>64)
  throw new TypeError('matching source segments and explicit convex solids required');
 const solidIds=solids.map(s=>s?.id);
 if(solidIds.some(x=>typeof x!=='string')||
  new Set(solidIds).size!==solidIds.length)
  throw new TypeError('distinct solid IDs required');
 const kernelWitnesses=[];
 for(let i=0;i<edges.length;i++){
  if(sources[i]?.id!==edges[i]?.edgeId)
   throw new TypeError('source segment must match projected edge ID');
  for(const solid of solids){
   kernelWitnesses.push(certifyConvexSegmentOcclusion({
    source:sources[i],solid,observerDirection,marginMm,angularTolerance}));
  }
 }
 // Deliberately pass NO claimed complete-depth partitions: M0 positive
 // interior witnesses do not establish clear intervals, endpoint joins,
 // nearest-depth ordering or exhaustive scene inventory.
 const intervals=edges.map(e=>({edgeId:e.edgeId,view,
  continuousDepthVerified:false,allSceneSolidsIncluded:false,
  solidIds,runs:[]}));
 const gate=auditMultiSolidContour({view,edges,vertices,intervals,
  sceneSolidIds:solidIds,toleranceMm:marginMm});
 return freeze({schema:'draftai-m0-contour-kernel-binding/1',
  status:'undetermined',kernelWitnesses,gate,
  positiveOpenWitnessCount:kernelWitnesses.filter(
   w=>w.status==='certified-open-interval').length,
  continuousDepthVerified:false,completeSceneVerified:false,
  officialLineStyleVerified:false,v5VerifiedExportReady:false});
}
module.exports={auditContourWithM0Occlusion};
