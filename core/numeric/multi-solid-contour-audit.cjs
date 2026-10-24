'use strict';
/**
 * M0 scope gate: join proofs plus continuous multi-solid depth intervals.
 * Caller supplies independently certified coverage; no inference from
 * samples, no whole-scene certification and no official line-style output.
 */
const {auditProjectedContour}=require('./projected-contour-topology.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
function auditMultiSolidContour({view,edges,vertices,intervals,sceneSolidIds,
 toleranceMm=1e-7}={}){
 const topology=auditProjectedContour({view,edges,vertices,toleranceMm});
 if(!Array.isArray(sceneSolidIds)||!sceneSolidIds.length||
  new Set(sceneSolidIds).size!==sceneSolidIds.length||
  sceneSolidIds.some(x=>typeof x!=='string'||!x))
  throw new TypeError('explicit unique scene solid identities required');
 if(!Array.isArray(intervals)||intervals.length!==edges.length)
  throw new TypeError('one continuous-depth partition per edge required');
 const reasons=[],byEdge=[];
 for(let i=0;i<edges.length;i++){
  const edge=edges[i],proof=intervals[i];
  if(!proof||proof.edgeId!==edge.edgeId||proof.view!==view||
   !Array.isArray(proof.runs)||!proof.runs.length||
   proof.continuousDepthVerified!==true||proof.allSceneSolidsIncluded!==true||
   !Array.isArray(proof.solidIds)||
   new Set(proof.solidIds).size!==sceneSolidIds.length||
   sceneSolidIds.some(id=>!proof.solidIds.includes(id))){
   reasons.push('missing-complete-depth-proof:'+edge.edgeId);continue;
  }
  let cursor=0,valid=true;
  for(const run of proof.runs){
   if(!run||!finite(run.from)||!finite(run.to)||
    Math.abs(run.from-cursor)>toleranceMm||
    run.to<=run.from||run.to>1+toleranceMm||
    !['visible','hidden'].includes(run.visibility)||
    run.depthOrderVerified!==true){
    valid=false;break;
   }
   cursor=run.to;
  }
  if(!valid||Math.abs(cursor-1)>toleranceMm){
   reasons.push('gap-or-uncertain-depth:'+edge.edgeId);continue;
  }
  // Local join proof covers the entire open edge only when every run
  // shares its visibility. Transitions need their own vertex/junction proof.
  if(proof.runs.some(r=>r.visibility!==edge.start.openVisibility||
    r.visibility!==edge.end.openVisibility)){
   reasons.push('interior-visibility-transition:'+edge.edgeId);continue;
  }
  byEdge.push({edgeId:edge.edgeId,runCount:proof.runs.length,
   visibility:proof.runs[0].visibility});
 }
 if(!topology.localTopologyVerified)reasons.push('local-topology-unverified');
 const scoped=reasons.length===0;
 return freeze({schema:'draftai-multi-solid-contour-audit/1',view,
  status:scoped?'supplied-scene-local-proof':'undetermined',
  reasons,topology,edgeDepthEvidence:byEdge,
  suppliedSceneDepthVerified:scoped,
  // The supplied solid list is not proof that the actual CAD scene is complete.
  completeSceneVerified:false,fullContourVerified:false,
  officialLineStyleVerified:false,constructionIntentVerified:false,
  constructionStepDagVerified:false,v5VerifiedExportReady:false});
}
module.exports={auditMultiSolidContour};
