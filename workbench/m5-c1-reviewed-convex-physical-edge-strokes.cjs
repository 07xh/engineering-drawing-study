'use strict';
/**
 * C1 REAL SINGLE-CONVEX-SOLID edge interval certification.
 *
 * Reuses the authoritative M0 dihedral crease proof, M4 source-event cuts,
 * M5 full-open observer rays, and already certified full V/H/W silhouette.
 * The theorem is restricted to ONE user-reviewed CLOSED CONVEX opaque mesh.
 *
 * Each returned signedCandidate has a proven original 3D source, an exact
 * positive source-parameter partition, a whole-subspan observer-ray result,
 * and no unhandled positive co-projected overlap. Crossing in paper NEVER
 * invents a physical 3D join. Neither native OCCT HLR source attribution,
 * C2 unions, C3 curves nor original textbook problem recognition is claimed.
 *
 * This proof does NOT create any V5 actions; the existing sole
 * ConstructionIntent/DAG/V5 consumer must bind signedCandidates.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {auditReviewedConvexSourceCreases}=
 require('./m5-reviewed-convex-source-creases.cjs');
const {auditC1SingleConvexSourceSubspanRays}=
 require('./m5-c1-source-subspan-opaque-rays.cjs');
const {auditC1GlobalVisibleContourProof}=
 require('./m5-c1-global-visible-contour-proof.cjs');
const {positiveCollinearOverlap}=
 require('./c1-ocjs-paper-collinear-overlap.cjs');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const {auditC1OriginalCoProjectedDepthOrder}=
 require('./c1-original-coproject-depth-order.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const sourceKey=(g,a,b)=>g+'::'+[a,b].sort().join('|');
const dist=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
const near3=(a,b)=>a&&b&&
 Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<=1e-7;
const lerp3=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const VISIBLE='gb-t-4457.4-continuous-wide-visible-outline';
const HIDDEN='gb-t-4457.4-thin-dashed-hidden-edge';
/**
 * Mask an unsigned source by a signed silhouette only when the WHOLE
 * positive 2D subspan is actually covered by verified lines. A mere
 * positive overlap of even one tiny interior piece is not a full mask.
 * No tolerance merges a positive original-source parameter gap.
 */
function certifyWholeProjectedExteriorCoverage({fromModelMm:a,toModelMm:b,
 certifiedContours}={}){
 if(!a||!b||!Array.isArray(certifiedContours)||certifiedContours.length>512)
  throw new TypeError('bounded projected source and certified contour required');
 const du=b.u-a.u,dv=b.v-a.v,len2=du*du+dv*dv;
 if(![du,dv,len2].every(Number.isFinite)||len2<=1e-20)
  return false;
 const len=Math.sqrt(len2),pieces=[];
 const pos=p=>((p.u-a.u)*du+(p.v-a.v)*dv)/len2;
 const deviation=p=>Math.abs((p.u-a.u)*dv-(p.v-a.v)*du)/len;
 for(const line of certifiedContours){
  const x=line?.projectedFromModelMm,y=line?.projectedToModelMm;
  if(!x||!y||line.signedOfficialLineStyle!==VISIBLE||
     line.v5ActionAuthorized!==true||
     ![x.u,x.v,y.u,y.v].every(Number.isFinite))
   continue;
  // Geometric collinearity is checked, not inferred from an unsigned
  // paper-crossing event. Tiny parameter gaps remain exact and BLOCK.
  if(deviation(x)>1e-9||deviation(y)>1e-9)continue;
  const left=Math.max(0,Math.min(pos(x),pos(y)));
  const right=Math.min(1,Math.max(pos(x),pos(y)));
  if(right>left)pieces.push([left,right]);
 }
 return pieces.length>0&&exactCandidateIntervalCoverage([0,1],pieces)
  .entireOriginalParameterIntervalCovered===true;
}
function auditC1ReviewedConvexPhysicalEdgeStrokes({geometry,revision}={}){
 if(geometry?.kind!=='mesh'||geometry.space!=='model-3d'||
    geometry.unit!=='mm'||!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current reviewed closed convex millimetre mesh required');
 const creases=auditReviewedConvexSourceCreases({geometry,revision});
 const rays=auditC1SingleConvexSourceSubspanRays({geometry,revision});
 const contour=auditC1GlobalVisibleContourProof({geometry,revision});
 if(creases.sourceGeometryId!==geometry.id||
    rays.sourceGeometryId!==geometry.id||
    contour.sourceGeometryId!==geometry.id||
    creases.revision!==revision||rays.revision!==revision||
    contour.revision!==revision||
    rays.signedV5ActionCount!==0||
    contour.nonExteriorInternalEdgesSigned!==false)
  throw new RangeError('current original M0/M4/M5 source proofs disagree');
 const physical=new Map(creases.edges.map(e=>[e.sourceEdgeId,e]));
 if(physical.size!==geometry.data.edges.length)
  throw new RangeError('incomplete original 3D source crease inventory');
 const oriented=new Map(geometry.data.edges.map(([a,b])=>[
  sourceKey(geometry.id,a,b),[a,b]]));
 const byKey=new Map();
 for(const span of rays.subspans){
  const k=span.view+'@'+span.sourceEdgeId;
  if(!VIEWS.includes(span.view)||!physical.has(span.sourceEdgeId)||
     span.sourceGeometryId!==geometry.id||span.revision!==revision||
     span.signedV5Action!==false||
     span.engineeringLineStyleAuthorized!==false||
     span.signedLineStyle!=='undetermined')
   throw new RangeError('stale/forged original M5 source subspan');
  if(!byKey.has(k))byKey.set(k,[]);
  byKey.get(k).push(span);
 }
 const allByView=new Map(VIEWS.map(view=>[view,
  rays.subspans.filter(s=>s.view===view)]));
 const signedCandidates=[],held=[],ledger=[];
 let collapsed=0,coplanar=0,hullMasked=0,visible=0,hidden=0,
  depthSuppressedOriginalAliases=0,fullyDepthOrderedAliases=0;
 for(const [edgeId,[a,b]] of oriented){
  const crease=physical.get(edgeId);
  if(!crease||crease.originalVertexIds[0]!==a||
    crease.originalVertexIds[1]!==b||
    crease.sourceClosedConvexTopologyAndSupportPlanesVerified!==true)
   throw new RangeError('M0 physical edge and original 3D endpoint history disagree');
  const sourceFrom=geometry.data.points[a],sourceTo=geometry.data.points[b];
  for(const view of VIEWS){
   const projectedFrom=project(sourceFrom)[view],
    projectedTo=project(sourceTo)[view];
   const projectedLength=dist(projectedFrom,projectedTo);
   const spans=(byKey.get(view+'@'+edgeId)||[]).slice()
    .sort((x,y)=>x.originalParameterRange[0]-y.originalParameterRange[0]);
   if(projectedLength<=1e-8){
    if(spans.length)throw new RangeError('collapsed edge retained drawable spans');
    collapsed++;ledger.push({view,sourceEdgeId:edgeId,status:'collapsed-projection'});
    continue;
   }
   if(!spans.length)throw new RangeError('missing projected source interval partition');
   const coverage=exactCandidateIntervalCoverage([0,1],
    spans.map(s=>s.originalParameterRange));
   if(!coverage.entireOriginalParameterIntervalCovered)
    throw new RangeError('positive-length C1 original edge ray coverage gap');
   let cursor=0;
   for(const s of spans){
    const [from,to]=s.originalParameterRange;
    // Stronger than mere union coverage: no positive-overlap double counting
    // and no tolerance bridges, including an actual 1-ULP gap.
    if(from!==cursor||!(to>from)||to>1)
     throw new RangeError('non-exact original 3D M4 edge partition');
    cursor=to;
    const xyzFrom=lerp3(sourceFrom,sourceTo,from);
    const xyzTo=lerp3(sourceFrom,sourceTo,to);
    if(!near3(s.source3DFrom,xyzFrom)||!near3(s.source3DTo,xyzTo)||
       dist(s.fromModelMm,project(xyzFrom)[view])>1e-7||
       dist(s.toModelMm,project(xyzTo)[view])>1e-7||
       JSON.stringify(s.originalVertexIds)!==JSON.stringify([a,b]))
     throw new RangeError('M4 projected segment has unverified real 3D origin');
    const base={view,revision,sourceGeometryId:geometry.id,
     sourceEdgeId:edgeId,originalVertexIds:[a,b],
     originalParameterRange:[from,to],
     real3DFrom:xyzFrom,real3DTo:xyzTo,
     fromModelMm:{...s.fromModelMm},toModelMm:{...s.toModelMm}};
    if(crease.sourceIsCoplanarSubdivisionWithinSingleSolid===true){
     coplanar++;ledger.push({...base,status:'mesh-subdivision-not-a-physical-line'});
     continue;
    }
    if(crease.sourceIsPhysicalCreaseWithinSingleSolid!==true){
     held.push({...base,reason:'physical-dihedral-not-proven'});
     continue;
    }
    if(s.status==='exterior-contour-held-by-original-m5'){
     // M4's positive collinear overlap flag is ONLY a discovery hint.
     // A fully masked source interval needs actual no-gap paper coverage.
     const v=contour.views.find(x=>x.view===view);
     const fullyMasked=contour.allThreeViewsGlobalContourCertified===true&&
      certifyWholeProjectedExteriorCoverage({
       fromModelMm:s.fromModelMm,toModelMm:s.toModelMm,
       certifiedContours:v?.candidateIntervals||[]
      });
     if(!fullyMasked)
      held.push({...base,reason:'signed-hull-only-partly-covers-source-span'});
     else {hullMasked++;ledger.push({...base,status:'already-certified-exterior'});}
     continue;
    }
    if(s.projectedSubpixelPaperSegmentHeldAsUndrawable===true){
     held.push({...base,reason:'positive-3d-microspan-undrawable'});
     continue;
    }
    const clear=s.status==='single-opaque-solid-whole-open-ray-clear'&&
     (s.exactOriginalFaceWholeOpenRayClear===true||
      s.analyticConservativeWholeOpenRayClear===true);
    const obscured=s.status==='single-opaque-solid-whole-open-ray-strictly-hidden'&&
     (s.fullAnalyticStrictInteriorRayOcclusion===true||
      s.exactOriginalSourceStrictInwardOpenRayHidden===true);
    if(clear===obscured){
     held.push({...base,reason:'unproven-or-contradictory-all-face-ray-depth'});
     continue;
    }
    // Recompute ORIGINAL 3D forward observer depth over all co-projected
    // physical source intervals. An exact whole-span front ordering can
    // release a line. An exact whole-span behind-front ordering suppresses
    // its redundant hidden duplicate. Any partial overlap or depth swap
    // remains unsigned until M4 subdivides that overlap completely.
    const overlap=auditC1OriginalCoProjectedDepthOrder({
     geometry,view,sourceEdgeId:edgeId,
     originalParameterRange:[from,to],
     peers:allByView.get(view)
    });
    if(overlap.status==='suppressed-by-front-original-visible-source'){
     depthSuppressedOriginalAliases++;
     ledger.push({...base,status:'source-hidden-behind-proven-front-original',
      original3DDepthOrder:overlap.status});
     continue;
    }
    if(!overlap.wholeIntervalFrontmostCertified){
     held.push({...base,reason:overlap.status,
      aliasDepthEvidence:overlap});
     continue;
    }
    if(overlap.aliasesExamined>0)fullyDepthOrderedAliases++;
    // A paper-only transverse crossing splits source intervals in M4 but
    // never becomes a fictitious joined 3D vertex in this proof.
    const style=clear?VISIBLE:HIDDEN;
    signedCandidates.push(freeze({...base,
     status:clear?'certified-visible-open-source':'certified-hidden-open-source',
     officialEngineeringLineStyle:style,
     sourcePhysicalCreaseVerified:true,
     completeOriginalParameterPartitionVerified:true,
     source3DEndpointInterpolationVerified:true,
     wholeSubspanOpaqueFaceRayOrderVerified:true,
     noPositiveCoProjectedSourceAliasVerified:
       overlap.aliasesExamined===0,
     allCoProjectedOriginalSourceDepthSortedVerified:true,
     originalCoProjectedDepthEvidence:overlap.status,
     paperOnlyCrossingsAreNot3DJunctions:true,
     scopedSingleConvexProof:true,
     V5ActionAlreadyCreated:false}));
    if(clear)visible++;else hidden++;
   }
   if(cursor!==1)throw new RangeError('original projected source did not terminate at 1');
   ledger.push({view,sourceEdgeId:edgeId,status:'partition-accounted',
    intervalCount:spans.length,realOriginalEndpoints:[a,b]});
  }
 }
 const allReleasable=contour.allThreeViewsGlobalContourCertified===true&&
  held.length===0&&
  creases.ambiguousDihedralCount===0;
 if(signedCandidates.length+held.length+hullMasked+coplanar+
    depthSuppressedOriginalAliases+collapsed!==rays.sourceSubspanCount+collapsed)
  throw new RangeError('incomplete C1 physical source subspan accounting');
 return freeze({
  schema:'draftai-c1-single-reviewed-convex-physical-edge-stroke-proof/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  proofScope:'single-user-confirmed-closed-convex-mesh-original-M0-M4-M5',
  signedCandidates,held,ledger,
  sourceSubspanCount:rays.sourceSubspanCount,
  visiblePhysicalIntervalCount:visible,hiddenPhysicalIntervalCount:hidden,
  unsignedPhysicalIntervalCount:held.length,
  alreadyCertifiedExteriorIntervalCount:hullMasked,
  depthSuppressedOriginalAliasIntervalCount:depthSuppressedOriginalAliases,
  fully3DDepthOrderedCoProjectedIntervalCount:fullyDepthOrderedAliases,
  suppressedCoplanarSubdivisionIntervalCount:coplanar,
  collapsedProjectedSourceEdgeCount:collapsed,
  M0M4M5SingleSourceContinuityVerified:true,
  original3DSourceNotNativeOCCTGeneratedShape:true,
  allDrawablePhysicalEdgeStylesCertified:allReleasable,
  fullOriginalSourceAllViewsCovered:allReleasable,
  // The original ConstructionIntent->Step DAG->one V5 must still consume it.
  constructionIntentAuthorized:false,signedV5ActionCount:0,
  realTextbookBlindTestPassed:false,
  nonConvexOrMultiBodyScopeCovered:false
 });
}
module.exports={auditC1ReviewedConvexPhysicalEdgeStrokes,
 certifyWholeProjectedExteriorCoverage};
