'use strict';
/**
 * M5 common frontmost projected OUTER-BOUNDARY open-span evidence.
 *
 * For every independently verified closed-convex body hull side (V/H/W),
 * correlate ORIGINAL mesh source-edge candidates with the existing M4
 * per-ray continuously visible/hidden/unknown SOURCE intervals. A hull
 * segment is locally frontmost only where EXACTLY ONE reviewed source edge
 * is proven continuously clear of EVERY reviewed convex body.
 *
 * Split ALL candidate interval boundaries; never interpolate a midpoint
 * classification across a topology/depth switch. Every output is OPEN
 * interval evidence only: endpoints, tangent joins, full multi-body
 * silhouette, national drawing style, canonical Intent/DAG and V5 blocked.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {verifyConvexProjectedOutline}=
 require('../core/verification/convex-projected-outline.cjs');
const {partitionReviewedSourceEdges}=
 require('./scoped-projected-stroke-partition.cjs');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))freeze(v);
  Object.freeze(o);
 }return o;
};
const fail=s=>{throw new TypeError('M5 frontmost open contour: '+s);};
const base=(revision,status,entries=[])=>freeze({
 schema:'draftai-m5-frontmost-open-contour-spans/1',
 revision,status,entries,entryCount:entries.length,
 localVisibleOpenSpanCount:entries.reduce((sum,x)=>sum+x.openSpans.filter(
  s=>s.status==='scoped-frontmost-visible-open-interval').length,0),
 fullMultiBodySilhouetteVerified:false,allSourceEndpointJoinsVerified:false,
 officialLineStylesVerified:false,canonicalIntentVerified:false,
 constructionStepDAGVerified:false,v5Ready:false
});
const dot=(a,b)=>a.u*b.u+a.v*b.v;
const cross=(a,b)=>a.u*b.v-a.v*b.u;
const uv=(a,b,t)=>({u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t});
function correlateReviewedOpenContours({
 geometry,revision,sceneDepthEvidence,projectedStrokePartitions
}={}){
 if(!Number.isSafeInteger(revision)||revision<0)fail('source revision required');
 if(!Array.isArray(geometry)||!geometry.length||geometry.length>12||
    !sceneDepthEvidence||
    sceneDepthEvidence.revision!==revision||
    sceneDepthEvidence.status!=='scoped-face-probes-only'||
    sceneDepthEvidence.projectedOutlines?.status!==
     'individual-convex-projected-boundaries'||
    projectedStrokePartitions?.status!=='preview-partition-evidence-only'||
    projectedStrokePartitions.revision!==revision)
  return base(revision,'not-covered');
 // Strong trust boundary: recompute the source hull AND M4 intervals rather
 // than allowing forged paper segments to confer contour membership.
 const fresh=partitionReviewedSourceEdges({geometry,revision,sceneDepthEvidence});
 if(JSON.stringify(fresh)!==JSON.stringify(projectedStrokePartitions))
  fail('changed or invented visible segment interval witness');
 const sourceOutline=sceneDepthEvidence.projectedOutlines.objects;
 if(!Array.isArray(sourceOutline)||sourceOutline.length!==geometry.length)
  fail('missing original closed-convex hull proof');
 const entries=[];
 for(const [i,g] of geometry.entries()){
  const expected=verifyConvexProjectedOutline({mesh:g,revision}),
   claimed=sourceOutline[i];
  if(claimed?.sourceGeometryId!==g.id||
     claimed.status!=='projected-boundary-only'||
     JSON.stringify(claimed.evidence)!==JSON.stringify(expected))
   fail('source convex hull/face topology evidence changed');
  for(const view of VIEWS){
   for(const [sideIndex,side] of expected[view].boundarySides.entries()){
    if(!side.projectedBoundaryVerified||
       side.frontmostSourceEdgeVerified!==false||
       side.officialLineStyleVerified!==false)
     fail('invalid hull-side proof scope');
    const a=side.from,b=side.to,
     v={u:b.u-a.u,v:b.v-a.v},squared=dot(v,v),
     len=Math.sqrt(squared),tol=Math.max(1e-9,len*1e-10);
    if(!(len>tol)&&Number.isFinite(len))fail('degenerate hull side');
    const ids=new Set(side.sourceEdgeCandidates.map(x=>
     g.id+'::'+x.sourceEdgeId));
    const intervals=[];
    for(const s of fresh.segments){
     if(s.view!==view||s.sourceGeometryId!==g.id||
        !ids.has(s.sourceEdgeId)||
        s.openInteriorVisibility!=='visible')continue;
     const from=s.projectedFromModelMm,to=s.projectedToModelMm;
     const w={u:from.u-a.u,v:from.v-a.v},
      z={u:to.u-a.u,v:to.v-a.v};
     if(Math.abs(cross(v,w))>tol*len||
        Math.abs(cross(v,z))>tol*len)continue;
     const t0=dot(w,v)/squared,t1=dot(z,v)/squared;
     if(Math.min(t0,t1)< -tol/len||
        Math.max(t0,t1)>1+tol/len)continue;
     const lo=Math.max(0,Math.min(t0,t1)),
      hi=Math.min(1,Math.max(t0,t1));
     if(hi-lo<=tol/len)continue;
     intervals.push({start:lo,end:hi,sourceEdgeId:s.sourceEdgeId,
      sourceParameterRange:s.sourceParameterRange});
    }
    const cuts=[...new Set([0,1,...intervals.flatMap(x=>[x.start,x.end])])]
     .sort((x,y)=>x-y);
    if(cuts.length>128)fail('bounded open contour transition count exceeded');
    const openSpans=[];
    for(let j=0;j<cuts.length-1;j++){
     const [start,end]=[cuts[j],cuts[j+1]],mid=(start+end)/2;
     if(!(end>start))continue;
     const visible=intervals.filter(x=>x.start<=mid&&x.end>=mid);
     const candidates=[...new Set(visible.map(x=>x.sourceEdgeId))];
     const uniquelyVisible=candidates.length===1;
     openSpans.push({
      projectedFractionRange:[start,end],
      fromProjectedModelMm:uv(a,b,start),toProjectedModelMm:uv(a,b,end),
      status:uniquelyVisible?'scoped-frontmost-visible-open-interval':
       'undetermined',
      candidateSourceEdgeIds:candidates,
      frontmostSourceEdgeId:uniquelyVisible?candidates[0]:null,
      proofScope:uniquelyVisible?
       'single-proven-visible-source-edge-per-open-hull-fraction':'none',
      sourceEndpointJoinsVerified:false,
      completeMultiBodySilhouetteVerified:false,
      officialLineStyleVerified:false,v5ActionApproved:false
     });
    }
    entries.push({sourceGeometryId:g.id,view,sideIndex,
     geometricHullSideVerified:true,sourceGeometryUnit:'mm',
     hullFromProjectedModelMm:side.from,hullToProjectedModelMm:side.to,
     openSpans,allOpenContourIntervalsVerified:openSpans.length>0&&
      openSpans.every(x=>x.frontmostSourceEdgeId!==null),
     sourceJunctionsVerified:false,wholeSideStandardLineStyleVerified:false});
   }
  }
 }
 return base(revision,'scoped-frontmost-open-contour-evidence-only',entries);
}
module.exports={correlateReviewedOpenContours};
