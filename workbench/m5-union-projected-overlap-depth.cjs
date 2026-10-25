'use strict';
/**
 * M5 C2 first-angle SOURCE FEATURE co-projection and entire-interval
 * exact depth-order proof for reviewed orthogonal cuboid unions.
 *
 * Two legitimate 3D crease segments can have the SAME projected 2D line
 * but different depths. Compare their actual 3D affine parameterizations
 * on the FULL closed positive-length overlap, using the canonical observer
 * direction. No sampled midpoint, no screenshot-derived frontmost claims.
 *
 * A positive source-edge depth order is only relative to ANOTHER LISTED
 * source feature. Other opaque source faces, endpoints, global silhouette,
 * standard engineering line styles and V5 are deliberately held.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {auditUnionPhysicalFeatureJunctions}=
 require('./m5-union-physical-feature-junctions.cjs');
const {analyzeSegmentTopology}=
 require('../core/geometry/segment-topology2d.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const AXES=['x','y','z'];
const diff=(a,b)=>({u:a.u-b.u,v:a.v-b.v});
const dot=(a,b)=>a.u*b.u+a.v*b.v;
const dist=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
/**
 * This is a TOPOLOGICAL, not metric-tolerance, predicate. Two different
 * real source edges separated by 2^-35 mm are NOT the same projected paper
 * line. The existing M0 filtered/exact dyadic orientation + M1 full segment
 * topology are the only authority for an overlap of positive length.
 * Point contact/crossings must be handled by the separate M5 event graph.
 */
function exactPositivePaperSourceOverlap(a,b,c,d){
 const asLine=(from,to)=>({frame:'model-mm-2d',unit:'mm',
  from:{x:from.u,y:from.v},to:{x:to.u,y:to.v}});
 const relation=analyzeSegmentTopology({
  first:asLine(a,b),second:asLine(c,d)}).relation;
 return relation==='collinear-overlap'||relation==='coincident';
}
const at=(a,b,t)=>Object.fromEntries(AXES.map(k=>
 [k,a[k]+t*(b[k]-a[k])]));
const rayDepth=(p,view)=>{
 const r=FIRST_ANGLE_OBSERVER_RAYS[view];
 return p.x*r.x+p.y*r.y+p.z*r.z;
};
function auditProjectedSourceOverlapDepth({geometry,revision,physicalJunctionEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current M5 projected source depth revision required');
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('reviewed bounded multibody geometry required');
 const fresh=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const empty=()=>freeze({schema:'draftai-m5-projected-source-overlap-depth/1',
  revision,status:'not-covered',overlaps:[],overlapCount:0,
  strictlyOrderedPairCount:0,identicalDepthPairCount:0,
  ambiguousDepthCount:0,allOpaqueFacesVerified:false,
  officialLineStylesVerified:false,v5Ready:false});
 if(fresh.status!=='source-recomputed-physical-3d-feature-incidence')
  return empty();
 if(JSON.stringify(fresh)!==JSON.stringify(physicalJunctionEvidence)||
   fresh.allBoundaryJunctionsVerified!==false||
   fresh.officialV5FeatureActionsSigned!==0)
  throw new TypeError('forged or stale physical source feature graph');
 if(fresh.segments.length>256)
  return empty(); // explicit scope bound, never silently partial
 const entries=fresh.segments.flatMap(s=>VIEWS.map(view=>{
  const a=project(s.source3DFrom)[view],
   b=project(s.source3DTo)[view],length=dist(a,b);
  return {source:s,view,a,b,
   length,delta:diff(b,a)};
 })).filter(s=>s.length>1e-9);
 const overlaps=[];
 for(const view of VIEWS){
  const group=entries.filter(e=>e.view===view);
  for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){
   const A=group[i],B=group[j];
   if(A.source.id===B.source.id)
    throw new TypeError('duplicate source feature in one 2D view');
   const length2=A.length*A.length,blen2=B.length*B.length;
   const tol=Math.max(1e-9,1e-10*Math.max(A.length,B.length));
   // Fast conservative rectangle reject and exact binary64 M1 topology.
   // Never reinterpret a nonzero orientation determinant as collinear
   // merely because its numerical distance is less than a tolerance.
   if(Math.max(Math.min(A.a.u,A.b.u),Math.min(B.a.u,B.b.u))>
       Math.min(Math.max(A.a.u,A.b.u),Math.max(B.a.u,B.b.u))||
      Math.max(Math.min(A.a.v,A.b.v),Math.min(B.a.v,B.b.v))>
       Math.min(Math.max(A.a.v,A.b.v),Math.max(B.a.v,B.b.v))||
      !exactPositivePaperSourceOverlap(A.a,A.b,B.a,B.b))
    continue;
   // Both source segments are EXACTLY on the same supporting 2D line.
   // Clip the B projected interval onto original A parameter t in [0,1].
   const ba=dot(A.delta,diff(B.a,A.a))/length2,
    bb=dot(A.delta,diff(B.b,A.a))/length2;
   const lo=Math.max(0,Math.min(ba,bb)),
    hi=Math.min(1,Math.max(ba,bb));
   if(!(hi-lo>tol/A.length))continue;
   const pointA=t=>at(A.source.source3DFrom,A.source.source3DTo,t);
   const paramB=t=>{
    const projected={u:A.a.u+t*A.delta.u,v:A.a.v+t*A.delta.v};
    return dot(B.delta,diff(projected,B.a))/blen2;
   };
   const d=(t)=>rayDepth(pointA(t),view)-
    rayDepth(at(B.source.source3DFrom,B.source.source3DTo,paramB(t)),view);
   const dlo=d(lo),dhi=d(hi);
   const eps=Math.max(1e-9,1e-10*Math.max(
    1,...geometry.flatMap(g=>Object.values(g.data.points).flatMap(p=>
      [Math.abs(p.x),Math.abs(p.y),Math.abs(p.z)]))));
   const frontA=dlo>eps&&dhi>eps,
    frontB=dlo< -eps&&dhi< -eps,
    sameDepth=Math.abs(dlo)<=eps&&Math.abs(dhi)<=eps;
   let status=frontA?'strict-source-A-front-across-overlap':
    frontB?'strict-source-B-front-across-overlap':
    sameDepth?'coincident-3d-depth-needs-union-feature-dedup':
    'undetermined-depth-tie-or-interior-transition';
   // For a depth crossing, record its analytic parameter instead of
   // incorrectly assigning one source as front of the WHOLE range.
   const root=(dlo*dhi<0&&Math.abs(dhi-dlo)>eps)?
    lo-dlo*(hi-lo)/(dhi-dlo):null;
   const ua=paramB(lo),ub=paramB(hi);
   if(!Number.isFinite(ua)||!Number.isFinite(ub)||
      ua< -eps||ua>1+eps||ub< -eps||ub>1+eps)
    throw new RangeError('source projection overlap is outside real line parameters');
   const pFrom={u:A.a.u+lo*A.delta.u,v:A.a.v+lo*A.delta.v},
    pTo={u:A.a.u+hi*A.delta.u,v:A.a.v+hi*A.delta.v};
   if(dist(pFrom,pTo)<=tol)
    throw new RangeError('degenerate 2D overlap cannot prove source depth');
   overlaps.push({id:'M5SourceOverlap'+overlaps.length,view,revision,
    sourceA:{id:A.source.id,kind:A.source.kind,
     sourceGeometryIds:[...A.source.sourceGeometryIds],
     sourceOpenParameterRange:[lo,hi]},
    sourceB:{id:B.source.id,kind:B.source.kind,
     sourceGeometryIds:[...B.source.sourceGeometryIds],
     sourceOpenParameterRange:[ua,ub]},
    projectedFromModelMm:pFrom,projectedToModelMm:pTo,
    observerDirection:{...FIRST_ANGLE_OBSERVER_RAYS[view]},
    endpointSourceDepthDifferenceMm:[dlo,dhi],
    exactAffineInteriorDepthOrderVerified:frontA||frontB||sameDepth,
    strictlyPositiveRelativeDepthAcrossWholeOverlap:frontA||frontB,
    frontSourceFeatureId:frontA?A.source.id:frontB?B.source.id:null,
    analyticSourceDepthTransitionParameter:root,
    status,thirdPartyOpaqueFaceOcclusionVerified:false,
    allProjectedFeatureDuplicatesMerged:false,
    completeReal3DJunctionAndPaperDepthVerified:false,
    globalFrontmostLineStyleVerified:false,
    officialSolidDashedEngineeringStyle:'undetermined',
    canonicalV5ActionSigned:false});
   if(overlaps.length>4000)
    throw new RangeError('projected source overlap evidence budget exceeded');
  }
 }
 return freeze({schema:'draftai-m5-projected-source-overlap-depth/1',
  revision,status:'full-analytic-listed-source-pair-overlap-depth',
  sourceGeometryIds:[...fresh.sourceGeometryIds],
  overlaps,overlapCount:overlaps.length,
  strictlyOrderedPairCount:overlaps.filter(x=>
   x.strictlyPositiveRelativeDepthAcrossWholeOverlap).length,
  identicalDepthPairCount:overlaps.filter(x=>
   x.status==='coincident-3d-depth-needs-union-feature-dedup').length,
  ambiguousDepthCount:overlaps.filter(x=>
   x.status==='undetermined-depth-tie-or-interior-transition').length,
  allListedSameProjectedSourcePairsExamined:true,
  allOpaqueFacesAndFinalSourceStrokeOcclusionVerified:false,
  allProjectedFeatureDuplicatesMerged:false,
  officialLineStylesVerified:false,signedV5LineActions:0,v5Ready:false});
}
module.exports={auditProjectedSourceOverlapDepth,exactPositivePaperSourceOverlap};
