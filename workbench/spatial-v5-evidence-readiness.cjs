'use strict';
/**
 * M5 -> canonical ConstructionIntent/DAG/V5 independent READINESS report.
 *
 * This is NOT a signing authority. It receives the already recomputed M5
 * evidence, reports which proof obligations remain, and ALWAYS denies V5.
 * A later signer must independently recompute each missing positive witness.
 * Never infer signed line styles from open-interior clearance, an individual
 * convex silhouette, a screen coincidence or any manually toggled flag.
 */
const VIEWS=['V','H','W'];
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function fail(s){throw new TypeError('spatial V5 evidence readiness: '+s);}
function inspectSpatialV5Readiness({sceneDepthEvidence,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('current project math revision required');
 const proof=sceneDepthEvidence;
 if(!proof||proof.schema!=='draftai-reviewed-mesh-scene-ray-audit/1'||
    proof.revision!==revision)
  fail('source-revision-matched shared M5 scene proof required');
 if(proof.v5Ready!==false||proof.officialLineStylesVerified!==false||
    proof.fullSceneVerified!==false||proof.constructionIntentReady!==false)
  fail('forged global line style or ConstructionIntent certification forbidden');
 const partitions=proof.projectedStrokePartitions,
   union=proof.projectedUnionOutlines,
   joins=proof.projectedVertexJoins;
 const all=partitions?.segments||[],u=union?.segments||[];
 if(!Array.isArray(all)||!Array.isArray(u))
  fail('unbounded or invalid spatial evidence partition');
 if(all.length>5000||u.length>5000)
  fail('evidence partition exceeds bounded audit limit');
 const summary={};
 for(const view of VIEWS){
  const strokes=all.filter(x=>x.view===view),out=u.filter(x=>x.view===view);
  const by={visible:0,hidden:0,undetermined:0};
  for(const stroke of strokes){
   if(!['visible','hidden','undetermined'].includes(stroke.openInteriorVisibility))
    fail('unrecognized interval visibility claim');
   if(stroke.officialLineStyleVerified!==false||
      stroke.v5ActionApproved!==false||stroke.joinVisibilityVerified!==false)
    fail('unreviewed V5 line or endpoint proof promotion');
   by[stroke.openInteriorVisibility]++;
  }
  let unknownUnion=0,external=0,covered=0;
  for(const segment of out){
   if(!['undetermined','open-projected-union-boundary',
     'strictly-inside-other-projection'].includes(segment.status))
    fail('unknown projected union segment label');
   if(segment.officialLineStyleVerified!==false||
      segment.multiBodyDepthVisibilityVerified!==false)
    fail('projected set union may not assert actual 3D visibility');
   if(segment.status==='undetermined')unknownUnion++;
   if(segment.status==='open-projected-union-boundary')external++;
   if(segment.status==='strictly-inside-other-projection')covered++;
  }
  summary[view]={projectedStrokeCount:strokes.length,
   scopedOpenVisibleCount:by.visible,scopedOpenHiddenCount:by.hidden,
   unprovedStrokeCount:by.undetermined,
   projectedUnionOpenBoundaryCount:external,
   projectedUnionCoveredCount:covered,projectedUnionUndeterminedCount:unknownUnion,
   endpointJoinCertified:false,fullViewLineStyleVerified:false};
 }
 const needs=[];
 const missing=(id,details)=>needs.push({id,details});
 if(proof.status!=='scoped-face-probes-only')
  missing('reviewed-convex-source','trusted source 3D mesh is not covered');
 if(proof.projectedOutlines?.allIndividualConvexProjectedBoundariesVerified!==true)
  missing('individual-projected-outlines','some single-body V/H/W silhouettes lack a full source edge proof');
 if(union?.status!=='open-boundary-geometry-only')
  missing('projected-multibody-union','multi-object projected union geometry is unavailable');
 else if(Object.values(summary).some(v=>v.projectedUnionUndeterminedCount>0))
  missing('projected-intersection-boundaries','touching/overlap/near-parallel intervals remain undetermined');
 if(partitions?.status!=='preview-partition-evidence-only')
  missing('continuous-3d-visibility','all source edge visibility intervals were not partitioned');
 else if(Object.values(summary).some(v=>v.unprovedStrokeCount>0))
  missing('positive-visible-or-hidden-proof','some open stroke interiors still lack exact forward-ray proofs');
 if(!joins||joins.endpointVisibilityVerified!==true||
    joins.officialLineStylesVerified!==true)
  missing('all-projected-endpoint-joins','3D source vertex and paper junction do not prove final visible line joins');
 if(proof.completeContourVerified!==true)
  missing('combined-visible-contour','projection union is not the complete depth-sorted visible 3D contour');
 if(proof.officialLineStylesVerified!==true)
  missing('official-solid-dashed-style','standard closed-segment visible/hidden line certification missing');
 missing('canonical-construction-intent','M3-to-final-lines canonical Intent has not been independently proved');
 missing('dag-v5-action-parity','complete approved ConstructionStep DAG and unique V5 action parity have not been proved');
 return freeze({schema:'draftai-m5-spatial-v5-readiness/1',revision,
  sceneSourceGeometryIds:[...(proof.sourceGeometryIds||[])],
  status:'blocked-evidence-incomplete',
  views:summary,missingEvidence:needs,missingCount:needs.length,
  scopedRayEvidencePresent:partitions?.status==='preview-partition-evidence-only',
  geometricUnionEvidencePresent:union?.status==='open-boundary-geometry-only',
  fullSourceMathVerified:false,
  allProjectedEndpointJoinsVerified:false,allOfficialLineStylesVerified:false,
  canonicalIntentVerified:false,constructionStepDAGVerified:false,
  singleV5TimelineCanBeSigned:false,v5Ready:false});
}
module.exports={inspectSpatialV5Readiness};
