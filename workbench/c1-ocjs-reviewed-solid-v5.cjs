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
const {auditC1RealOcctVisibleContourSourceParity,
 exactOriginalModelVertexProjectedEdge}=
 require('./c1-real-occt-m5-visible-contour-parity.cjs');
const {VIEWS,project}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexVertices}=
 require('../core/numeric/m0-convex-vertex-completeness.cjs');
const {positiveCollinearOverlap}=
 require('./c1-ocjs-paper-collinear-overlap.cjs');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
// Positive original-M0 boundedness and extreme-vertex proof for the CURRENT
// reviewed source. Never accept a caller-supplied status or CAD projection
// as a substitute for an independent 3D halfspace/recession certificate.
function auditC1M0ExtremeVertexCompleteness(geometry){
 const hull=verifiedConvexMeshHalfspaces(geometry);
 const proof=certifyConvexVertices({solid:{
  id:geometry.id,halfspaces:hull.halfspaces,
  vertices:Object.values(geometry.data.points)
 },toleranceMm:Math.max(1e-7,hull.toleranceMm)});
 if(proof.solidId!==geometry.id||
    proof.completeSceneVerified!==false||
    proof.officialLineStyleVerified!==false)
  throw new RangeError('independent M0 extreme vertex proof drift');
 return proof;
}
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
// Read-only C1 proof-gap coverage: compare the SAME original 3D edge
// parameter interval, not paper distances. The old paper intervalCoverage
// remains a geometric display helper, never an exact source certificate.
// One ULP of missing native parameter range must remain visible as a gap.
function exactC1NativeSourceIntervalCoverage({
 geometry,view,sourceEdgeId,real3DFrom,real3DTo,strokes,
 projectedFromModelMm,projectedToModelMm,
 independentlyM5SourceAndJunctionsProven=false
}={}){
 if(!VIEWS.includes(view)||typeof sourceEdgeId!=='string'||
    !Array.isArray(geometry?.data?.edges)||!geometry?.data?.points||
    !Array.isArray(strokes))
  throw new TypeError('current V/H/W original 3D source and native HLR required');
 const edges=geometry.data.edges.filter(e=>Array.isArray(e)&&
  geometry.id+'::'+[...e].sort().join('|')===sourceEdgeId);
 if(edges.length!==1)throw new RangeError('missing or duplicated original C1 source');
 const [id0,id1]=edges[0],a=geometry.data.points[id0],
  b=geometry.data.points[id1];
 const exact3=(p,q)=>p&&q&&['x','y','z'].every(k=>
  Number.isFinite(p[k])&&p[k]===q[k]);
 if(!a||!b||!['x','y','z'].every(k=>
    Number.isFinite(a[k])&&Number.isFinite(b[k])))
  throw new RangeError('nonfinite original 3D source endpoints');
 const axes=['x','y','z'].sort((u,v)=>
  Math.abs(b[v]-a[v])-Math.abs(b[u]-a[u]));
 const axis=axes[0],delta=b[axis]-a[axis];
 if(!Number.isFinite(delta)||delta===0)
  throw new RangeError('collapsed original 3D source');
 const sourceParameter=p=>{
  if(exact3(p,a))return 0;
  if(exact3(p,b))return 1;
  if(!p||!['x','y','z'].every(k=>Number.isFinite(p[k])))
   return null;
  const t=(p[axis]-a[axis])/delta;
  if(!Number.isFinite(t)||!(t>0&&t<1))return null;
  const reconstructed={x:a.x+(b.x-a.x)*t,
   y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};
  // If binary64 cannot reconstruct the original M5 3D point, hold it
  // instead of rounding an unknown source fraction onto a native range.
  return exact3(reconstructed,p)?t:null;
 };
 const t0=sourceParameter(real3DFrom),t1=sourceParameter(real3DTo);
 // Match the existing strict native contour theorem: when independent
 // M5 has proved this physical source AND its 3D endpoint junctions,
 // exact paper projections of both ORIGINAL M0 vertices recover [0,1]
 // even if an interpolated display XYZ rounded by one binary64 ULP.
 // Never snap an arbitrary paper point or infer a TopoDS history link.
 const literal=independentlyM5SourceAndJunctionsProven===true&&
  projectedFromModelMm&&projectedToModelMm?
  exactOriginalModelVertexProjectedEdge({
   a,b,view,from:projectedFromModelMm,to:projectedToModelMm
  }):null;
 if(!literal&&(t0===null||t1===null||t0===t1))
  return {sourceEdgeId,view,originalSourceParameterRange:null,
   entireOriginalParameterIntervalCovered:false,
   positiveLengthUncoveredIntervals:[],
   status:'unreconstructable-original-3d-source-parameter',
   engineeringLineStyle:'undetermined',signedV5Action:false};
 const range=literal?[...literal.range]:
  [Math.min(t0,t1),Math.max(t0,t1)],candidates=[];
 for(const stroke of strokes){
  if(!Array.isArray(stroke?.sourceCandidate3DLifts))
   throw new RangeError('unverified actual native HLR candidate lift list');
  for(const lift of stroke.sourceCandidate3DLifts){
   if(lift?.sourceEdgeId===sourceEdgeId){
    if(lift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
       lift.originalOCCTSourceLineCurveVerified!==true||
       lift.v5Authorized!==false)
     throw new RangeError('unverified original native BRep source lift');
    candidates.push(lift.originalSourceParameterRange);
   }
  }
 }
 const proof=exactCandidateIntervalCoverage(range,candidates);
 return {sourceEdgeId,view,originalSourceParameterRange:range,
  entireOriginalParameterIntervalCovered:
   proof.entireOriginalParameterIntervalCovered,
  positiveLengthUncoveredIntervals:
   proof.positiveLengthUncoveredIntervals,
  status:proof.entireOriginalParameterIntervalCovered?
   'exact-original-3d-native-source-covered':
   'exact-original-3d-native-source-positive-gap',
  engineeringLineStyle:'undetermined',signedV5Action:false};
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
    // The candidate XYZ must be the actual affine point on the reviewed
    // ORIGINAL M0 edge, not merely a caller-supplied source label or flag.
    // This is exact source-topology consistency, not a TopoDS history claim.
    const a=edge&&geometry.data.points[edge[0]],
     b=edge&&geometry.data.points[edge[1]];
    const modelXYZ=t=>({x:a.x+(b.x-a.x)*t,
     y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
    const exactXYZ=(p,q)=>p&&q&&['x','y','z'].every(k=>
     Number.isFinite(p[k])&&p[k]===q[k]);
    const fromPaper=edge&&Number.isFinite(t0)&&project(modelXYZ(t0))[view],
     toPaper=edge&&Number.isFinite(t1)&&project(modelXYZ(t1))[view],
     nearPaper=(p,q)=>p&&q&&
      Number.isFinite(p.u)&&Number.isFinite(p.v)&&
      Math.hypot(p.u-q.u,p.v-q.v)<=1e-6;
    // Independently rebind the measured ORIGINAL native BRep edge, not
    // merely the projected candidate's own affine XYZ or a boolean flag.
    // The OCCT source curve is a unit-speed 3D line in model millimetres.
    const measuredFrom=lift?.actualOriginalOCCTBRepFrom3D,
     measuredTo=lift?.actualOriginalOCCTBRepTo3D,
     measuredRange=lift?.originalOCCTCurveParameterRange,
     originalLength=a&&b&&Math.hypot(
      b.x-a.x,b.y-a.y,b.z-a.z),
     nativeEnds=edge&&(
      exactXYZ(measuredFrom,a)&&exactXYZ(measuredTo,b)||
      exactXYZ(measuredFrom,b)&&exactXYZ(measuredTo,a)),
     nativeSpan=Array.isArray(measuredRange)&&measuredRange.length===2&&
      measuredRange.every(Number.isFinite)&&
      measuredRange[1]>measuredRange[0]?
      measuredRange[1]-measuredRange[0]:NaN,
     nativeCurveBound=nativeEnds&&
      lift.originalOCCTSourceCurveType==='line'&&
      Number.isFinite(originalLength)&&originalLength>1e-8&&
      Number.isFinite(nativeSpan)&&
      Math.abs(nativeSpan-originalLength)<=
       1e-6*Math.max(1,originalLength);
    if(!edge||seen.has(id)||!nativeCurveBound||
       !nearPaper(fromPaper,stroke.from)||
       !nearPaper(toPaper,stroke.to)||
       !Array.isArray(lift.originalVertexIds)||
       lift.originalVertexIds.join('|')!==edge.join('|')||
       !Number.isFinite(t0)||!Number.isFinite(t1)||
       !(t0>=0&&t0<=1&&t1>=0&&t1<=1&&t0!==t1)||
       !Array.isArray(range)||range.length!==2||
       range[0]!==Math.min(t0,t1)||range[1]!==Math.max(t0,t1)||
       !exactXYZ(lift.fromCandidate3D,modelXYZ(t0))||
       !exactXYZ(lift.toCandidate3D,modelXYZ(t1))||
       lift.originalXYZReprojectsToHLR!==true||
       lift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
       lift.originalOCCTSourceLineCurveVerified!==true||
       lift.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
       lift.v5Authorized!==false)
     throw new RangeError('real C1 HLR physical source lift missing, duplicated or stale');
    seen.add(id);
   }
   // IsSame must have compared the complete current ORIGINAL TopoDS
   // inventory, including sources which do not project onto this stroke.
   // A partial probe can otherwise masquerade as a unique native source.
   const compared=stroke.originalPhysicalOCCTSourceIdsCompared,
    expected=[...originals.keys()].sort(),
    direct=stroke.directlySameOriginalOCCTBRepSourceEdgeIds,
    unique=stroke.directlySameUniqueOriginalOCCTBRepSourceEdgeId;
   if(seen.size!==ids.length||
      ids.some(id=>!seen.has(id))||
      stroke.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared!==true||
      !Array.isArray(compared)||compared.length!==expected.length||
      compared.some((id,i)=>id!==expected[i])||
      stroke.actualDistinctOriginalOCCTBRepSourceCount!==expected.length||
      !Number.isSafeInteger(stroke.actualOriginalOCCTBRepEdgeOccurrencesCompared)||
      stroke.actualOriginalOCCTBRepEdgeOccurrencesCompared<expected.length||
      !Array.isArray(direct)||direct.length>1||
      direct.some(id=>!seen.has(id))||
      (direct.length===1?unique!==direct[0]:unique!==null)||
      stroke.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven!==
       (direct.length===1))
    throw new RangeError('real HLR original BRep IsSame and physical source candidates disagree');
  }
 }
 return true;
}
// Conservative positive-length intersection test: CAD-visible interior creases
// must not be treated as false exterior hull omissions. A visible CAD segment
// that actually intersects a signed hull stroke needs authentic source IDs;
// unrelated visible interior lines remain unsigned M5 candidates.
// Rebind only an independently checked native HLR candidate inventory to the
// SAME canonical M3 drawing and existing V5 action IDs. This pure boundary
// rejects stale/mismatched revisions, duplicated actions and unsigned edges
// that were accidentally promoted; it never signs a new native stroke.
function bindC1NativeThirdViewEvidence({canonical,cad,revision,geometryId}={}){
 const drawing=canonical?.thirdViewDrawing,view=drawing?.view;
 const native=VIEWS.includes(view)&&cad?.views?.[view];
 const signed=canonical?.certifiedVisibleContourLineBindings;
 if(!VIEWS.includes(view)||drawing.revision!==revision||
    drawing.geometryId!==geometryId||
    cad?.revision!==revision||cad.sourceGeometryId!==geometryId||
    cad.lineStyleCertified!==false||cad.v5Authorized!==false||
    !Array.isArray(native)||native.length===0||
    !Array.isArray(signed)||!Array.isArray(drawing.certifiedVisibleContour)||
    !Array.isArray(drawing.unresolvedPhysicalEdges)||
    drawing.completeDrawingCertified!==false||
    canonical.wholeSolidV5Ready!==false)
  throw new RangeError('native OCCT and canonical M3 missing-view mismatch');
 const expected=signed.filter(x=>x.view===view);
 const visible=drawing.certifiedVisibleContour;
 const allPhysical=canonical.certifiedPhysicalLineBindings??[];
 const physical=drawing.certifiedPhysicalFeatures??[];
 if(!Array.isArray(allPhysical)||!Array.isArray(physical))
  throw new RangeError('native C1 missing canonical signed physical source inventory');
 const expectedPhysical=allPhysical.filter(x=>x.view===view);
 const actionIds=drawing.drawingLayers?.officialV5StrokeActionIds;
 const bindings=new Map(expected.map(x=>[x.actionId,x]));
 const physicalBindings=new Map(expectedPhysical.map(x=>[x.actionId,x]));
 const expectedIds=new Set([...bindings.keys(),...physicalBindings.keys()]);
 const sameRange=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
  a.length===2&&b.length===2&&a[0]===b[0]&&a[1]===b[1];
 if(!Array.isArray(actionIds)||expected.length!==visible.length||
    bindings.size!==expected.length||
    physicalBindings.size!==expectedPhysical.length||
    expectedIds.size!==expected.length+expectedPhysical.length||
    physical.length!==expectedPhysical.length||
    actionIds.length!==expectedIds.size||
    new Set(actionIds).size!==actionIds.length||
    new Set(visible.map(x=>x.v5ActionId)).size!==visible.length||
    new Set(physical.map(x=>x.v5ActionId)).size!==physical.length||
    visible.some(x=>!bindings.has(x.v5ActionId)||
     bindings.get(x.v5ActionId).sourceEdgeId!==x.sourceEdgeId||
     x.standardLineStyle!=='gb-t-4457.4-continuous-wide-visible-outline')||
    physical.some(x=>!physicalBindings.has(x.v5ActionId)||
     physicalBindings.get(x.v5ActionId).sourceEdgeId!==x.sourceEdgeId||
     physicalBindings.get(x.v5ActionId).standardLineStyle!==x.standardLineStyle||
     !sameRange(physicalBindings.get(x.v5ActionId).originalParameterRange,
      x.originalParameterRange)||
     !['gb-t-4457.4-continuous-wide-visible-outline',
       'gb-t-4457.4-thin-dashed-hidden-edge'].includes(x.standardLineStyle))||
    actionIds.some(id=>!expectedIds.has(id))||
    drawing.unresolvedPhysicalEdges.some(x=>
     x.standardLineStyle!=='undetermined'||x.v5ActionId!==null))
  throw new RangeError('native C1 cannot rebind noncanonical V5 contour or physical strokes');
 const segments=native.map(segment=>{
  const ids=segment?.projectedOriginalEdgeCandidates;
  const validPoint=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
  if(!validPoint(segment?.from)||!validPoint(segment?.to)||
     !Array.isArray(ids)||ids.length===0||
     ids.some(id=>typeof id!=='string'||!id)||
     new Set(ids).size!==ids.length)
   throw new RangeError('invalid native C1 missing-view physical candidate');
  return Object.freeze({
   from:Object.freeze({...segment.from}),
   to:Object.freeze({...segment.to}),
   original3DSourceCandidates:Object.freeze([...ids]),
   engineeringLineStyle:'undetermined',v5ActionId:null
  });
 });
 return Object.freeze({
  schema:'draftai-c1-native-missing-view-evidence/1',
  view,revision,geometryId,
  realHLRVisibleSegments:Object.freeze(segments),
  // Native HLR remains unsigned: these IDs are EXISTING canonical M5/V5.
  canonicalCertifiedVisibleV5ActionIds:Object.freeze(expected.map(x=>x.actionId)),
  canonicalCertifiedPhysicalV5ActionIds:Object.freeze(
   expectedPhysical.map(x=>x.actionId)),
  canonicalOfficialV5StrokeActionIds:Object.freeze([...actionIds]),
  unresolvedPhysicalSourceCount:drawing.unresolvedPhysicalEdges.length,
  generatedTopoDSHistoryComplete:false,
  allPhysicalEdgesEngineeringStylesSigned:false,
  completeDrawingCertified:false,
  newV5ActionsFromNativeHLR:0
 });
}

function compileC1WithOcjsHLR({input,sheetTransform,oc}={}){
 if(!oc||typeof oc!=='object')
  throw new TypeError('initialized real OpenCascade.js kernel required');
 // Recompute ORIGINAL source and M0–M5/V5 once, then reconcile the independent
 // B-Rep HLR in the same revision. Caller cannot supply verification booleans.
 const canonical=compileReviewedSolidVertexV5({input,sheetTransform});
 const g=canonical.sceneResult.geometry,rev=canonical.revision;
 const m0ExtremeVertices=auditC1M0ExtremeVertexCompleteness(g);
 if(m0ExtremeVertices.vertexHullVerified!==true)
  throw new RangeError('C1 original M0 bounded extreme vertices unproven: '+
   m0ExtremeVertices.reason);
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
 const nativeThirdViewEvidence=bindC1NativeThirdViewEvidence({
  canonical,cad,revision:rev,geometryId:g.id
 });
 return Object.freeze({...canonical,
  c1CadRuntime:{
   schema:'draftai-c1-ocjs-m5-gated-runtime/1',
   compute:'real OpenCascade.js HLR visible B-Rep geometry',
   engine:'opencascade.js',revision:rev,geometryId:g.id,
   supportedScope:cad.proofScope,
   independentlyM0BoundedExtremeVertexSetVerified:true,
   independentlyM0ExtremeVertexProof:m0ExtremeVertices,
   perView:out,nativeThirdViewEvidence,sourceIdsMappedByExistingM5:true,
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
 const m0ExtremeVertices=auditC1M0ExtremeVertexCompleteness(g);
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
  missingContinuousFrontRayProof:0,
  exactNative3DSourceParameterCovered:0,
  exactNative3DSourceParameterGapOrUnbound:0};
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
   // Keep the historical PAPER agreement counter for existing display
   // diagnostics. Never mistake it for exact 3D provenance: the genuine
   // strict native contour/V5 gate separately requires exact source spans.
   const projected=strokes.filter(st=>
    validSource&&st.projectedOriginalEdgeCandidates.includes(x.sourceEdgeId));
   const covered=validSource&&intervalCoverage(
    x.projectedFromModelMm,x.projectedToModelMm,projected);
   const nativeCoverage=validSource?
    exactC1NativeSourceIntervalCoverage({
     geometry:g,view,sourceEdgeId:x.sourceEdgeId,
     real3DFrom:x.real3DFrom,real3DTo:x.real3DTo,
     projectedFromModelMm:x.projectedFromModelMm,
     projectedToModelMm:x.projectedToModelMm,
     independentlyM5SourceAndJunctionsProven:
      x.locallyCompleteVisibleHullSegmentProven===true&&
      x.sourceContourCoverageVerified===true&&
      x.genuineFrontSourceEndpointJoinsVerified===true&&
      x.continuouslyFrontRayClearVerified===true,
     strokes
    }):null;
   const nativeExactCovered=nativeCoverage?.
    entireOriginalParameterIntervalCovered===true;
   if(nativeExactCovered)totals.exactNative3DSourceParameterCovered++;
   else totals.exactNative3DSourceParameterGapOrUnbound++;
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
    realNativeOriginal3DSourceParameterCovered:nativeExactCovered,
    exactNativeOriginal3DSourceCoverage:nativeCoverage,
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
  independentlyM0ExtremeVertexProof:m0ExtremeVertices,
  independentlyM0BoundedExtremeVertexSetVerified:
   m0ExtremeVertices.vertexHullVerified===true,
  allThreeViewsGlobalM5Certified:proof.allThreeViewsGlobalContourCertified,
  counts:totals,views,
  globalOfficialV5GateUnchanged:true,
  officialLineStylesVerified:false,signedV5ActionCount:0,
  hiddenOrInternalEdgesSigned:false,wholeSolidV5Ready:false,
  realCadSourceCandidateOnly:true
 });
}
module.exports={compileC1WithOcjsHLR,auditC1OcjsM5ProofGaps,
 intervalCoverage,positiveCollinearOverlap,exactC1NativeSourceIntervalCoverage,
 validateC1RealHLRSourceCandidates,
 bindC1NativeThirdViewEvidence,auditC1M0ExtremeVertexCompleteness};
