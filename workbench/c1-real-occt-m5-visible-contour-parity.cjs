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
// Every finite binary64 paper coordinate is an EXACT dyadic rational.
// Floating cross products can overflow to Infinity-Infinity (missing a
// true overlap), or underflow to 0 (inventing a false collinear overlap).
// Compare exact integer determinants instead: no tolerance, no snapping,
// no new HLR -> original TopoDS identity or V5 authority.
const paperBits=new DataView(new ArrayBuffer(8));
const dyadic=x=>{
 if(!Number.isFinite(x))throw new TypeError('finite paper coordinates required');
 paperBits.setFloat64(0,x,false);
 const hi=paperBits.getUint32(0,false),lo=paperBits.getUint32(4,false),
  exponent=(hi>>>20)&0x7ff,
  mantissa=(BigInt(hi&0xfffff)<<32n)|BigInt(lo),
  n=(hi>>>31?-1n:1n)*(exponent?((1n<<52n)|mantissa):mantissa),
  e=exponent?exponent-1075:-1074;
 return {n,e};
};
const subtractDyadic=(a,b)=>{
 const e=Math.min(a.e,b.e);
 return {n:(a.n<<BigInt(a.e-e))-(b.n<<BigInt(b.e-e)),e};
};
const multiplyDyadic=(a,b)=>({n:a.n*b.n,e:a.e+b.e});
const exactPaperOrientation=(a,b,c)=>{
 const au=dyadic(a.u),av=dyadic(a.v),
  bu=dyadic(b.u),bv=dyadic(b.v),
  cu=dyadic(c.u),cv=dyadic(c.v),
  lhs=multiplyDyadic(subtractDyadic(bu,au),subtractDyadic(cv,av)),
  rhs=multiplyDyadic(subtractDyadic(bv,av),subtractDyadic(cu,au));
 return subtractDyadic(lhs,rhs).n;
};
// Strictly positive EXACT collinear paper overlap is incompatible with
// two different independently unique frontmost physical M0 sources.
// Endpoint-only contact, transverse crossings and one-ULP gaps are not
// positive overlap. This is a necessary contradiction check only.
const exactPositiveCollinearPaperOverlap=(a,b,c,d)=>{
 if([a,b,c,d].some(p=>!p||!Number.isFinite(p.u)||!Number.isFinite(p.v)))
  throw new TypeError('finite paper endpoints required');
 if(a.u===b.u&&a.v===b.v||c.u===d.u&&c.v===d.v)return false;
 if(exactPaperOrientation(a,b,c)!==0n||
    exactPaperOrientation(a,b,d)!==0n)return false;
 const axis=Math.abs(b.u-a.u)>=Math.abs(b.v-a.v)?'u':'v';
 return Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis]))<
  Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]));
};
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
// An independently signed FULL original M5 contour hull edge can have a
// rounded 3D interpolated DISPLAY endpoint, while both literal paper
// endpoints are exactly projections of the two TRUE M0 SOURCE VERTICES.
// Recover [0,1] only from those exact original M0 vertices, never by
// rounding a floating source parameter or a paper coordinate. The
// genuine HLR BRep endpoint and actual source-view mask are checked
// separately and must match this physical original source ID.
function exactOriginalModelVertexProjectedEdge({a,b,view,from,to}={}){
 if(!VIEWS.includes(view)||!['x','y','z'].every(k=>
  Number.isFinite(a?.[k])&&Number.isFinite(b?.[k])))
  throw new TypeError('original 3D M0 endpoint pair and V/H/W view required');
 const p=project(a)[view],q=project(b)[view];
 if(eq2(p,q))return null;
 if(eq2(p,from)&&eq2(q,to))
  return {range:[0,1],from3D:{...a},to3D:{...b},
   exactOriginalPhysical3DVertexPairAndPaperBinding:true,
   orientation:'forward'};
 if(eq2(q,from)&&eq2(p,to))
  return {range:[0,1],from3D:{...b},to3D:{...a},
   exactOriginalPhysical3DVertexPairAndPaperBinding:true,
   orientation:'reversed'};
 return null;
}
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
 // One generated VCompound HLR edge ordinal identifies one actual native
 // paper edge in one view. Different original 3D sources cannot both be
 // independently unique frontmost physical owners of that SAME edge.
 // This is only a fail-closed provenance invariant, not recovered TopoDS
 // history or permission to sign an engineering line / V5 action.
 const nativeGeneratedOrdinalOwners=new Map();
 // Separate generated native ordinals can still trace the EXACT same
 // oriented/reversed paper segment. Two different original M0 edges
 // cannot BOTH be the unique M5 frontmost 3D owner of that entire
 // projected interval. This is a necessary fail-closed consistency
 // check, not a tolerance-based TopoDS history reconstruction.
 const nativeGeneratedPaperFrontOwners=new Map();
 const nativeGeneratedPaperFrontSegments=[];
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
  const generatedOrdinalKey=view+'@'+ordinal;
  const previousOwner=nativeGeneratedOrdinalOwners.get(generatedOrdinalKey);
  if(previousOwner!==undefined&&previousOwner!==sourceEdgeId)
   throw new RangeError('one generated OCCT visible HLR ordinal has conflicting original 3D sources');
  nativeGeneratedOrdinalOwners.set(generatedOrdinalKey,sourceEdgeId);
  const paperPoints=[seg.from,seg.to];
  if(!paperPoints.every(p=>p&&Number.isFinite(p.u)&&
       Number.isFinite(p.v))||eq2(seg.from,seg.to))
   throw new RangeError('nonfinite or collapsed native visible HLR front source');
  const paperEnds=paperPoints.map(p=>JSON.stringify([p.u,p.v])).sort();
  const paperKey=view+'@'+JSON.stringify(paperEnds);
  const priorPaperOwner=nativeGeneratedPaperFrontOwners.get(paperKey);
  if(priorPaperOwner!==undefined&&priorPaperOwner!==sourceEdgeId)
   throw new RangeError('coincident native visible HLR paper segment has conflicting original 3D front owners');
  nativeGeneratedPaperFrontOwners.set(paperKey,sourceEdgeId);
  for(const prior of nativeGeneratedPaperFrontSegments){
   if(prior.view!==view||prior.sourceEdgeId===sourceEdgeId)continue;
   if(exactPositiveCollinearPaperOverlap(
    seg.from,seg.to,prior.from,prior.to))
    throw new RangeError('overlapping native visible HLR paper segments have conflicting original 3D front owners');
  }
  nativeGeneratedPaperFrontSegments.push({
   view,sourceEdgeId,from:seg.from,to:seg.to});
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
    claimRange=null,uncovered=[],covering=[],
    exactOriginalPhysical3DVertexPaperBinding=false,
    originalContour3DParameterRecoveryKind='held';
   if(signed){
    const e=original.get(line.sourceEdgeId),
     a=e&&geometry.data.points[e[0]],
     b=e&&geometry.data.points[e[1]];
    if(!a||!b)throw new RangeError('original full-hull certified source edge absent');
    const t0=param(a,b,line.real3DFrom),
     t1=param(a,b,line.real3DTo),
     literalModelSourceProjectedEndpoints=exactOriginalModelVertexProjectedEdge({
      a,b,view:v.view,from:line.projectedFromModelMm,
      to:line.projectedToModelMm
     }),
     literalSignedXYZAndPaper=t0!==null&&t1!==null&&t0!==t1&&
      eq2(project(line.real3DFrom)[v.view],line.projectedFromModelMm)&&
      eq2(project(line.real3DTo)[v.view],line.projectedToModelMm);
    // Extra exact physical vertex binding is only eligible when the
    // existing signed global convex M5 ring has positive M0 source
    // coverage, true front-ray clearance and independently real 3D
    // endpoint joins. It cannot independently release any contour.
    const sourcePhysicalM5Proof=
     line.sourceContourCoverageVerified===true&&
     line.genuineFrontSourceEndpointJoinsVerified===true&&
     line.continuouslyFrontRayClearVerified===true&&
     line.locallyCompleteVisibleHullSegmentProven===true;
    // Prefer the literal original M0 vertex-pair identity whenever the
    // already-signed complete M5 contour has independently proved its
    // physical source, endpoint joins and continuous front rays. Even if
    // the interpolated display XYZ reprojects to the SAME paper point,
    // a binary64 division can return 1-ULP rather than 1 and manufacture
    // a false original-source interval gap. This is not paper snapping:
    // both projected endpoints must be EXACT original M0 vertex images.
    // Genuine positive native HLR source gaps remain independently held.
    if(sourcePhysicalM5Proof&&literalModelSourceProjectedEndpoints){
     claimRange=[...literalModelSourceProjectedEndpoints.range];
     exactOriginalPhysical3DVertexPaperBinding=true;
     originalContour3DParameterRecoveryKind='exact-original-m0-3d-vertex-projection';
    }else if(literalSignedXYZAndPaper){
     claimRange=[Math.min(t0,t1),Math.max(t0,t1)];
     originalContour3DParameterRecoveryKind='exact-original-3d-source-interpolation';
    }else reason='cannot-exactly-normalize-original-signed-contour-3d-source';
    if(claimRange){
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
    exactOriginalPhysical3DVertexPaperBinding,
    originalContour3DParameterRecoveryKind,
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
  globallySignedContoursWithExactOriginalM0VertexPaperEndpointRecovery:
   rows.filter(x=>x.exactOriginalPhysical3DVertexPaperBinding===true).length,
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
module.exports={auditC1RealOcctVisibleContourSourceParity,
 exactOriginalModelVertexProjectedEdge,exactPositiveCollinearPaperOverlap};
