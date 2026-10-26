'use strict';
/**
 * Independent CAD cross-check for existing M5 globally signed exterior
 * silhouette claims. A mathematically released original convex 3D contour
 * is NOT thereby guaranteed to have identical real native OCCT HLR line
 * coverage. Compare each genuine physical 3D original-source parameter
 * interval against actual VCompound generated edges and 3D BRep lifts.
 *
 * This is a necessary read-only corroboration, NOT a new independent M5
 * signer, generated TopoDS->original TopoDS history nor V5 action.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {auditC1GlobalVisibleContourProof}=
 require('./m5-c1-global-visible-contour-proof.cjs');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
const eq3=(a,b)=>!!a&&!!b&&['x','y','z'].every(k=>
 Number.isFinite(a[k])&&Number.isFinite(b[k])&&a[k]===b[k]);
const eq2=(a,b)=>!!a&&!!b&&a.u===b.u&&a.v===b.v;
const edgeKey=(g,e)=>g.id+'::'+[...e].sort().join('|');
const param=(a,b,p)=>{
 const axis=['x','y','z'].sort((x,y)=>
  Math.abs(b[y]-a[y])-Math.abs(b[x]-a[x]))[0];
 const delta=b[axis]-a[axis];
 if(!Number.isFinite(delta)||delta===0)return null;
 const t=(p[axis]-a[axis])/delta;
 if(!Number.isFinite(t)||t<0||t>1)return null;
 const value={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
  z:a.z+(b.z-a.z)*t};
 return eq3(value,p)?t:null;
};
function auditC1RealOcctVisibleContourSourceParity({
 geometry,revision,cad,nativeProof
}={}){
 if(!geometry?.data?.points||!Array.isArray(geometry.data.edges)||
    !Number.isSafeInteger(revision)||revision<1||
    cad?.sourceGeometryId!==geometry.id||cad.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||
    cad.v5Authorized!==false||
    !VIEWS.every(v=>Array.isArray(cad.views?.[v]))||
    nativeProof?.schema!==
     'draftai-c1-ocjs-native-generated-topods-original-3d-vertex-concordance/1'||
    nativeProof.sourceGeometryId!==geometry.id||
    nativeProof.revision!==revision||
    nativeProof.actualGeneratedHLREdgeToOriginalTopoDSEdgeHistoryComplete!==false||
    nativeProof.signedV5ActionCount!==0||
    !Array.isArray(nativeProof.independentlyM5AuthenticatedVisibleNativeGeneratedEdges))
  throw new TypeError('current true native OCCT HLR and source-verified M5 provenance required');
 const original=new Map();
 for(const e of geometry.data.edges){
  const key=edgeKey(geometry,e);
  if(original.has(key)||e.length!==2)throw new RangeError('duplicate original source');
  original.set(key,e);
 }
 const contour=auditC1GlobalVisibleContourProof({geometry,revision});
 if(contour.sourceGeometryId!==geometry.id||contour.revision!==revision||
    contour.nonExteriorInternalEdgesSigned!==false||
    contour.canonicalV5ActionParityVerified!==false)
  throw new RangeError('genuine recomputed original M5 3D contour missing');
 const nativeByKey=new Map();
 let matchedNative=0;
 for(const witness of nativeProof.independentlyM5AuthenticatedVisibleNativeGeneratedEdges){
  const {view,sourceEdgeId,originalSourceParameterRange:span,
   nativeVisibleHLREdgeOrdinal:ordinal}=witness,
   e=original.get(sourceEdgeId),seg=cad.views?.[view]?.[ordinal];
  if(!VIEWS.includes(view)||!e||!seg||
     !Number.isSafeInteger(ordinal)||ordinal<0||
     !Array.isArray(span)||span.length!==2||
     !span.every(Number.isFinite)||span[0]<0||span[1]>1||
     !(span[0]<span[1])||
     witness.uniquePhysicalM5FrontOriginalSourceFromActualBRep!==true||
     witness.fullOriginalPhysicalSourceM5ClosedRayClear!==true||
     witness.generatedEdgeOriginalTopoDSHistoryRecovered!==false||
     witness.engineeringLineCertified!==false||
     witness.signedV5Action!==false||
     seg.occtHLRVisibilityClass!=='visible-sharp'||
     seg.actualOCCTHLRFlattenedBRepLineVerified!==true||
     seg.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared!==true||
     seg.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false)
   throw new RangeError('forged or stale current genuine visible HLR source witness');
  const candidates=seg.sourceCandidate3DLifts.filter(c=>
   c.sourceEdgeId===sourceEdgeId&&
   c.originalSourceParameterRange?.[0]===span[0]&&
   c.originalSourceParameterRange?.[1]===span[1]);
  if(candidates.length!==1)throw new RangeError('ambiguous or absent real OCCT physical source lift');
  const lift=candidates[0],a=geometry.data.points[e[0]],
   b=geometry.data.points[e[1]],t0=lift.sourceParameterAtProjectedFrom,
   t1=lift.sourceParameterAtProjectedTo;
  const xyz=t=>({x:a.x+(b.x-a.x)*t,
   y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
  const ends=(eq3(a,lift.actualOriginalOCCTBRepFrom3D)&&
   eq3(b,lift.actualOriginalOCCTBRepTo3D))||
   (eq3(b,lift.actualOriginalOCCTBRepFrom3D)&&
    eq3(a,lift.actualOriginalOCCTBRepTo3D));
  if(!ends||lift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
     lift.originalOCCTSourceLineCurveVerified!==true||
     lift.originalXYZReprojectsToHLR!==true||lift.v5Authorized!==false||
     lift.originalVertexIds?.join('|')!==e.join('|')||
     !Number.isFinite(t0)||!Number.isFinite(t1)||
     span[0]!==Math.min(t0,t1)||span[1]!==Math.max(t0,t1)||
     !eq3(lift.fromCandidate3D,xyz(t0))||
     !eq3(lift.toCandidate3D,xyz(t1))||
     !eq2(project(xyz(t0))[view],seg.from)||
     !eq2(project(xyz(t1))[view],seg.to))
   throw new RangeError('genuine native HLR source lift contradicts original 3D model or paper');
  const key=view+'@'+sourceEdgeId;
  if(!nativeByKey.has(key))nativeByKey.set(key,[]);
  const all=nativeByKey.get(key);
  if(all.some(x=>x.ordinal===ordinal))
   throw new RangeError('duplicate actual HLR generated native edge ordinal');
  all.push({ordinal,span:[...span]});
  matchedNative++;
 }
 const rows=[];
 for(const v of contour.views){
  if(!VIEWS.includes(v.view)||
     !Array.isArray(v.candidateIntervals))
   throw new RangeError('genuine V/H/W contour missing');
  for(const [i,line] of v.candidateIntervals.entries()){
   const signed=v.globalSingleConvexClosedVisibleContourVerified===true&&
    line.v5ActionAuthorized===true&&
    line.signedOfficialLineStyle===
     'gb-t-4457.4-continuous-wide-visible-outline';
   if(!signed&&
      (line.v5ActionAuthorized!==false||
       line.signedOfficialLineStyle!=='undetermined'))
    throw new RangeError('unproven original contour was signed');
   let reason=null,complete=false,overlap=false,
    claimRange=null,uncovered=[],covering=[];
   if(signed){
    const e=original.get(line.sourceEdgeId),
     a=e&&geometry.data.points[e[0]],
     b=e&&geometry.data.points[e[1]];
    if(!a||!b)throw new RangeError('original full-hull certified source edge absent');
    const t0=param(a,b,line.real3DFrom),t1=param(a,b,line.real3DTo);
    if(t0===null||t1===null||t0===t1||
       !eq2(project(line.real3DFrom)[v.view],line.projectedFromModelMm)||
       !eq2(project(line.real3DTo)[v.view],line.projectedToModelMm))
     reason='cannot-exactly-normalize-original-signed-contour-3d-source';
    else{
     claimRange=[Math.min(t0,t1),Math.max(t0,t1)];
     const raw=nativeByKey.get(v.view+'@'+line.sourceEdgeId)??[];
     covering=raw.map(n=>({
      ordinal:n.ordinal,
      interval:[Math.max(n.span[0],claimRange[0]),
       Math.min(n.span[1],claimRange[1])]
     })).filter(n=>n.interval[1]>n.interval[0])
      .sort((x,y)=>x.interval[0]-y.interval[0]||
       x.interval[1]-y.interval[1]);
     let right=claimRange[0];
     for(const n of covering){
      if(n.interval[0]<right)overlap=true;
      right=Math.max(right,n.interval[1]);
     }
     const r=exactCandidateIntervalCoverage(claimRange,
      covering.map(n=>n.interval));
     uncovered=r.positiveLengthUncoveredIntervals;
     complete=covering.length>0&&!overlap&&
      r.entireOriginalParameterIntervalCovered===true;
     if(!complete)reason=overlap?
      'true-occt-generated-contour-physical-source-overlap':
      'true-occt-generated-contour-source-parameter-gap';
    }
   }else reason='whole-original-m5-contour-ring-not-signed';
   rows.push({
    view:v.view,canonicalHullIntervalOrdinal:i,
    originalPhysical3DSourceEdgeId:line.sourceEdgeId,
    originalM5WholeExteriorContourCertified:signed,
    signedOriginalContourEngineeringStyle:signed?
     'gb-t-4457.4-continuous-wide-visible-outline':'undetermined',
    originalSourceParameterRange:claimRange,
    trueNativeOCCTGeneratedLineOrdinals:covering.map(x=>x.ordinal),
    positiveLengthNativeSourceGaps:uncovered,
    nativeGeneratedOriginalSourceOverlap:overlap,
    realOCCTOriginal3DSourceCompleteContourParity:complete,
    heldReason:reason,
    generatedToOriginalTopoDSHistoricalIdentityRecovered:false,
    constructionIntentDAGV5NativeParityAuthorized:false,
    signedV5Action:false
   });
  }
 }
 const signed=rows.filter(x=>x.originalM5WholeExteriorContourCertified),
  positive=rows.filter(x=>x.realOCCTOriginal3DSourceCompleteContourParity);
 return freeze({
  schema:'draftai-c1-real-native-occt-vcompound-m5-visible-contour-parity/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  realNativeOCCTVisible3DSourceFragmentsAudited:matchedNative,
  entireOriginalM5ContourProofRecomputed:true,
  originalGloballySignedM5ContourStrokeCount:signed.length,
  originalGloballySignedM5ContoursWithExactNativeOriginal3DSourceCoverage:
   positive.length,
  nativeCADCorroboratesEveryOriginalGloballySignedExteriorContour:
   signed.length>0&&signed.length===positive.length,
  originalGloballySignedM5ContoursStillHeldForNativeProof:
   signed.length-positive.length,
  viewsWithOriginalM5GlobalContourSignature:contour.acceptedFirstAngleViews,
  rows,
  fullGeneratedTopoDSEdgeToOriginalTopoDSHistoryProven:false,
  wholeOpaqueMultiBodyAndAllInternalLineStylesCertified:false,
  constructionIntentDAGUniqueV5ParityProven:false,
  signedV5ActionCount:0
 });
}
module.exports={auditC1RealOcctVisibleContourSourceParity};
