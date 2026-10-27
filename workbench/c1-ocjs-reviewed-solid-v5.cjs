'use strict';
/**
 * Opt-in C1 runtime consumer: REAL OpenCascade.js HLR projected strokes are
 * an indispensable geometric input, while authoritative topology / real 3D
 * source / continuous ray / GB line style stays with existing M0-M5.
 *
 * Without actual OCJS computed geometry (or with disagreement) this entry
 * fails closed. The original compileReviewedSolidVertexV5 remains unchanged
 * as the safe fallback and sole ConstructionIntent->DAG->V5 source.
 */
const {compileReviewedSolidVertexV5}=
 require('./reviewed-solid-vertex-v5.cjs');
const {computeC1OcjsVisibleSegments}=
 require('../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const {auditC1NativeHiddenSharpVsM5}=
 require('./c1-ocjs-hidden-sharp-m5-corroboration.cjs');
const {auditC1RealOcctVisibleContourSourceParity}=
 require('./c1-real-occt-m5-visible-contour-parity.cjs');
const {VIEWS}=require('../core/projection/conventions.js');
const {positiveCollinearOverlap}=
 require('./c1-ocjs-paper-collinear-overlap.cjs');
function intervalCoverage(a,b,segments,tol=1e-6){
 const dx=b.u-a.u,dy=b.v-a.v,den=dx*dx+dy*dy,len=Math.sqrt(den);
 if(!(len>1e-9))return false;
 const spans=[];
 const coordinate=p=>{
  const cross=dx*(p.v-a.v)-dy*(p.u-a.u);
  if(!Number.isFinite(p.u)||!Number.isFinite(p.v)||
     !Number.isFinite(cross)||Math.abs(cross)>tol*len)return null;
  const parameter=((p.u-a.u)*dx+(p.v-a.v)*dy)/den;
  return Number.isFinite(parameter)?parameter:null;
 };
 for(const s of segments){
  const x=coordinate(s.from),y=coordinate(s.to);
  if(x===null||y===null)continue;
  const [lo,hi]=[x,y].sort((a,b)=>a-b);
  if(lo>1+tol||hi< -tol)continue;
  spans.push([Math.max(0,lo),Math.min(1,hi)]);
 }
 spans.sort((a,b)=>a[0]-b[0]);
 let cursor=0;
 for(const [lo,hi] of spans){
  if(lo>cursor+tol)return false;
  cursor=Math.max(cursor,hi);
 }
 return cursor>=1-tol;
}
// A projected HLR candidate is not a TopoDS history match. Even unsigned
// interior creases must carry a one-to-one, current-M0 physical source ledger
// before they can participate in reverse coverage or an M5 gap report.
// Validate against the ACTUAL reviewed edge inventory, not a geometry-ID
// prefix (which also accepts fabricated same-geometry source names).
function validateC1RealHLRSourceCandidates({geometry,cad}={}){
 if(typeof geometry?.id!=='string'||!geometry.id||
    !Array.isArray(geometry.data?.edges)||!geometry.data?.points)
  throw new TypeError('current reviewed M0 source edge inventory required');
 const originals=new Map();
 for(const edge of geometry.data.edges){
  if(!Array.isArray(edge)||edge.length!==2||
     edge.some(id=>!Object.hasOwn(geometry.data.points,id)))
   throw new RangeError('invalid original M0 physical source edge');
  const id=geometry.id+'::'+[...edge].sort().join('|');
  if(originals.has(id))throw new RangeError('duplicate original M0 source');
  originals.set(id,edge);
 }
 for(const view of VIEWS){
  const strokes=cad?.views?.[view];
  if(!Array.isArray(strokes)||strokes.length===0)
   throw new RangeError('real HLR V/H/W source candidates missing');
  for(const stroke of strokes){
   const ids=stroke?.projectedOriginalEdgeCandidates,
    lifts=stroke?.sourceCandidate3DLifts;
   if(!Array.isArray(ids)||ids.length===0||
      !Array.isArray(lifts)||lifts.length!==ids.length||
      new Set(ids).size!==ids.length||
      ids.some(id=>typeof id!=='string'||!originals.has(id)))
    throw new RangeError('real C1 HLR generated stroke has invalid original physical source candidates');
   const seen=new Set();
   for(const lift of lifts){
    const id=lift?.sourceEdgeId,edge=originals.get(id),
     t0=lift?.sourceParameterAtProjectedFrom,
     t1=lift?.sourceParameterAtProjectedTo,
     range=lift?.originalSourceParameterRange;
    if(!edge||seen.has(id)||
       !Array.isArray(lift.originalVertexIds)||
       lift.originalVertexIds.join('|')!==edge.join('|')||
       !Number.isFinite(t0)||!Number.isFinite(t1)||
       !(t0>=0&&t0<=1&&t1>=0&&t1<=1&&t0!==t1)||
       !Array.isArray(range)||range.length!==2||
       range[0]!==Math.min(t0,t1)||range[1]!==Math.max(t0,t1)||
       lift.originalXYZReprojectsToHLR!==true||
       lift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
       lift.originalOCCTSourceLineCurveVerified!==true||
       lift.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
       lift.v5Authorized!==false)
     throw new RangeError('real C1 HLR physical source lift missing, duplicated or stale');
    seen.add(id);
   }
   if(seen.size!==ids.length||
      ids.some(id=>!seen.has(id))||
      stroke.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared!==true||
      (stroke.directlySameUniqueOriginalOCCTBRepSourceEdgeId!=null&&
       !seen.has(stroke.directlySameUniqueOriginalOCCTBRepSourceEdgeId)))
    throw new RangeError('real HLR original BRep IsSame and physical source candidates disagree');
  }
 }
 return true;
}
// Conservative positive-length intersection test: CAD-visible interior creases
// must not be treated as false exterior hull omissions. A visible CAD segment
// that actually intersects a signed hull stroke needs authentic source IDs;
// unrelated visible interior lines remain unsigned M5 candidates.
function compileC1WithOcjsHLR({input,sheetTransform,oc}={}){
 if(!oc||typeof oc!=='object')
  throw new TypeError('initialized real OpenCascade.js kernel required');
 // Recompute ORIGINAL source and M0–M5/V5 once, then reconcile the independent
 // B-Rep HLR in the same revision. Caller cannot supply verification booleans.
 const canonical=compileReviewedSolidVertexV5({input,sheetTransform});
 const g=canonical.sceneResult.geometry,rev=canonical.revision;
 const cad=computeC1OcjsVisibleSegments({oc,geometry:g,revision:rev});
 if(cad.revision!==rev||cad.sourceGeometryId!==g.id||
    !canonical.globalVisibleContourProof.allThreeViewsGlobalContourCertified||
    !canonical.verifiedLineIntentAndOriginalSingleV5Parity||
    canonical.wholeSolidV5Ready!==false||
    cad.lineStyleCertified!==false||cad.v5Authorized!==false)
  throw new RangeError('current authoritative C1 scoped M5/V5 not available: '+
   canonical.globalVisibleContourProof.views.map(v=>v.view+':'+
    v.allContourLinesVerified+'/'+v.blockedAtomicIntervalCount).join(',')+
   '; canonicalV5='+canonical.verifiedLineIntentAndOriginalSingleV5Parity);
 // The original C1 sole V5 consumer already signed this narrow M5
 // visible-hull scope. Paper-only source names and tolerant projected
 // overlap are NOT enough to bind those commands to the TRUE generated
 // OCCT HLR 3D physical source edges; recompute the full existing
 // original M0/M5 closed-ray source and native IsSame concordance, then
 // check EVERY signed 3D contour interval against independently measured
 // native visible BRep original source parameter fragments.
 const nativeSource=auditC1NativeHiddenSharpVsM5({
  oc,geometry:g,revision:rev
 });
 const strictNativeContour=auditC1RealOcctVisibleContourSourceParity({
  geometry:g,revision:rev,cad,
  nativeProof:nativeSource.nativeHLRVertexConcordance
 });
 if(strictNativeContour.sourceGeometryId!==g.id||
    strictNativeContour.revision!==rev||
    strictNativeContour.nativeCADCorroboratesEveryOriginalGloballySignedExteriorContour!==true||
    strictNativeContour.
      originalGloballySignedM5ContourStrokeCount!==
     canonical.certifiedVisibleContourLineBindings.length||
    strictNativeContour.
      originalGloballySignedM5ContoursStillHeldForNativeProof!==0||
    strictNativeContour.fullGeneratedTopoDSEdgeToOriginalTopoDSHistoryProven!==false||
    strictNativeContour.constructionIntentDAGUniqueV5ParityProven!==false||
    strictNativeContour.signedV5ActionCount!==0)
  throw new RangeError('true OCCT original 3D source interval fails entire signed M5 contour CAD parity: '+
   strictNativeContour.originalGloballySignedM5ContoursWithExactNativeOriginal3DSourceCoverage+
   '/'+strictNativeContour.originalGloballySignedM5ContourStrokeCount);
 validateC1RealHLRSourceCandidates({geometry:g,cad});
 const resolved=canonical.certifiedVisibleContourLineBindings;
 const out={};
 for(const view of VIEWS){
  const signed=resolved.filter(x=>x.view===view),
   generated=cad.views[view];
  let unsignedInteriorCadLines=0;
  if(signed.length<3||!Array.isArray(generated)||generated.length<3)
   throw new RangeError('complete original signed V/H/W contour absent');
  for(const bind of signed){
   if(bind.revision!==rev||bind.sourceGeometryId!==g.id||
      bind.signedFormalLineV5!==true||
      bind.standardLineStyle!=='gb-t-4457.4-continuous-wide-visible-outline')
    throw new RangeError('unsigned M5 source cannot be promoted');
   const genuine=generated.filter(x=>
    x.projectedOriginalEdgeCandidates.includes(bind.sourceEdgeId));
   if(!intervalCoverage(bind.fromModelMm,bind.toModelMm,genuine))
    throw new RangeError('actual OCJS HLR does not cover certified C1 source '+bind.actionId);
  }
  // Source-aware *reverse* coverage on the SIGNED contour only. The CAD
  // engine can rightly see other physical creases on an oblique convex
  // surface: those remain undetermined, NEVER minted as V5 strokes.
  for(const seg of generated){
   const overlapping=signed.filter(bind=>positiveCollinearOverlap(
    bind.fromModelMm,bind.toModelMm,seg.from,seg.to));
   if(!overlapping.length){
    unsignedInteriorCadLines++;
    continue;
   }
   // Projected overlap alone can alias front and rear 3D sources. Only
   // canonical M5 may prove which ORIGINAL source generated an action.
   const matching=overlapping.filter(bind=>
    seg.projectedOriginalEdgeCandidates.includes(bind.sourceEdgeId));
   if(!matching.length||!intervalCoverage(seg.from,seg.to,
     matching.map(b=>({from:b.fromModelMm,to:b.toModelMm}))))
    throw new RangeError('real C1 HLR projected alias disagrees with signed M5 source');
  }
  out[view]={cadVisibleSegments:generated.length,
   m5SignedVisibleIntervals:signed.length,
   unsignedInteriorCadLines,sourceAndCoverageAgreement:true};
 }
 return Object.freeze({...canonical,
  c1CadRuntime:{
   schema:'draftai-c1-ocjs-m5-gated-runtime/1',
   compute:'real OpenCascade.js HLR visible B-Rep geometry',
   engine:'opencascade.js',revision:rev,geometryId:g.id,
   supportedScope:cad.proofScope,
   perView:out,sourceIdsMappedByExistingM5:true,
   independentCadComputedSegments:cad,
   everyM5SignedContourReboundToRealNativeOCCTOriginal3DSource:true,
   fullyNative3DSourceVerifiedExteriorM5ContourStrokes:
    strictNativeContour.
      originalGloballySignedM5ContoursWithExactNativeOriginal3DSourceCoverage,
   originalM5SignedExteriorContourStrokes:
    strictNativeContour.originalGloballySignedM5ContourStrokeCount,
   sourceProofFromIndependentClosedRayAndActualNativeHLR:true,
   originalGeneratedTopoDSEdgeHistoryNotClaimed:true,
   nonContourCADDrawingActionsSigned:0,
   // The old proof remains the ONLY formal certification authority.
   newOfficialLineStyleSigner:false,secondV5:false
  }});
}
/**
 * Strict general-convex C1 proof-gap ledger. Unlike the full-signoff entry,
 * this audits EVERY original M5 hull interval against the computed REAL HLR
 * source candidates even when an oblique convex ring lacks a global M5 proof.
 *
 * No caller-supplied proof booleans, no CAD-to-V5 promotion, no duplicate
 * solver/scene/player. Local M5 corroboration is UNSIGNED by design.
 */
function auditC1OcjsM5ProofGaps({input,sheetTransform,oc}={}){
 if(!oc||typeof oc!=='object')
  throw new TypeError('initialized real OpenCascade.js kernel required');
 const original=compileReviewedSolidVertexV5({input,sheetTransform});
 const g=original.sceneResult.geometry,revision=original.revision;
 const cad=computeC1OcjsVisibleSegments({oc,geometry:g,revision});
 const proof=original.globalVisibleContourProof;
 const ledger=original.wholeSourceEdgeRayEvidence;
 const ledgerIds=new Set(ledger.edges.map(x=>x.sourceEdgeId));
 validateC1RealHLRSourceCandidates({geometry:g,cad});
 if(cad.revision!==revision||cad.sourceGeometryId!==g.id||
    cad.lineStyleCertified!==false||cad.v5Authorized!==false||
    !Array.isArray(proof.views)||proof.views.length!==3)
  throw new RangeError('unaligned original C1 M5 and genuine real HLR');
 const views={},totals={m5AtomicIntervals:0,locallyPositive:0,
  cadAndM5Corroborated:0,positiveM5CadConflicts:0,unresolved:0,
  sharedPhysicalEndpointDepthCertificates:0,
  missing3DSourceCoverage:0,missingPhysicalJunctionProof:0,
  missingContinuousFrontRayProof:0};
 for(const view of VIEWS){
  const pv=proof.views.find(x=>x.view===view);
  const rayView=proof.continuousFrontmostSourceRays.views.find(x=>x.view===view);
  const strokes=cad.views[view];
  if(!pv||!Array.isArray(strokes)||!strokes.length)
   throw new RangeError('C1 original M5 and real HLR V/H/W missing');
  if(!rayView||rayView.intervals.length!==pv.candidateIntervals.length)
   throw new RangeError('M5 ray-source intervals do not match projected hull');
  const intervals=pv.candidateIntervals.map((x,index)=>{
   if(x.revision!==revision||x.sourceGeometryId!==g.id||x.view!==view)
    throw new RangeError('stale cross-revision M5 interval');
   const validSource=typeof x.sourceEdgeId==='string'&&
    ledgerIds.has(x.sourceEdgeId);
   const projected=strokes.filter(st=>
    validSource&&st.projectedOriginalEdgeCandidates.includes(x.sourceEdgeId));
   const covered=validSource&&intervalCoverage(
    x.projectedFromModelMm,x.projectedToModelMm,projected);
   const local=x.locallyCompleteVisibleHullSegmentProven===true;
   const status=local?(covered?'local-m5-cad-corrob-unsigned':
    'positive-m5-vs-cad-conflict'):'undetermined';
   totals.m5AtomicIntervals++;
   if(local)totals.locallyPositive++;
   if(local&&covered)totals.cadAndM5Corroborated++;
   if(local&&!covered)totals.positiveM5CadConflicts++;
   if(!local)totals.unresolved++;
   const ray=rayView.intervals[index];
   const physicalBoundaryComparisons=ray.relativeSourceDepthComparisons.filter(
    v=>v.strictOpenIntervalSharedPhysicalEndpointProven);
   totals.sharedPhysicalEndpointDepthCertificates+=physicalBoundaryComparisons.length;
   if(!x.sourceContourCoverageVerified)totals.missing3DSourceCoverage++;
   if(!x.genuineFrontSourceEndpointJoinsVerified)totals.missingPhysicalJunctionProof++;
   if(!x.continuouslyFrontRayClearVerified)totals.missingContinuousFrontRayProof++;
   return {view,sourceEdgeId:validSource?x.sourceEdgeId:null,
    fromModelMm:{...x.projectedFromModelMm},
    toModelMm:{...x.projectedToModelMm},
    status,m5LocalPositive:local,realCadCovered:covered,
    blockers:{
     sourceContourCoverageMissing:!x.sourceContourCoverageVerified,
     genuine3DJunctionMissing:!x.genuineFrontSourceEndpointJoinsVerified,
     continuousFrontRayMissing:!x.continuouslyFrontRayClearVerified,
     unresolvedSourceDepthSwitchOrTie:ray.unresolvedDepthSwitchOrTie
    },
    exactPhysicalSharedEndpointOpenDepthCertificates:
     physicalBoundaryComparisons.length,
    engineeringLineStyle:'undetermined',signedV5:false};
  });
  views[view]={cadVisibleSegmentCount:strokes.length,
   m5GlobalViewProof:pv.allContourLinesVerified,
   m5BlockedAtomicIntervalCount:pv.blockedAtomicIntervalCount,
   intervals};
 }
 return Object.freeze({
  schema:'draftai-c1-ocjs-m5-convex-proof-gap-ledger/1',
  revision,sourceGeometryId:g.id,unit:'mm',
  engine:'opencascade.js',proofScope:cad.proofScope,
  allThreeViewsGlobalM5Certified:proof.allThreeViewsGlobalContourCertified,
  counts:totals,views,
  globalOfficialV5GateUnchanged:true,
  officialLineStylesVerified:false,signedV5ActionCount:0,
  hiddenOrInternalEdgesSigned:false,wholeSolidV5Ready:false,
  realCadSourceCandidateOnly:true
 });
}
module.exports={compileC1WithOcjsHLR,auditC1OcjsM5ProofGaps,
 intervalCoverage,positiveCollinearOverlap,validateC1RealHLRSourceCandidates};
