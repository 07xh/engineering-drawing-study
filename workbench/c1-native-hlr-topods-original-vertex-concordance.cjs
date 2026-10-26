'use strict';
/**
 * A generated HLR native TopoDS vertex may connect two generated edges.
 * It is a GENUINE SOURCE 3D physical junction ONLY when independent
 * OCCT original BRep source geometry, original M0 closed face fan and
 * M5-pruned unique hidden 3D source endpoints agree on the SAME original
 * 3D vertex ID. Paper coincidence alone NEVER satisfies either test.
 *
 * Generated HLR TopoDS shape history to ORIGINAL TopoDS edge, whole
 * drawing topology, GB line style and ConstructionIntent/V5 stay unsigned.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {exactCandidateIntervalCoverage}=require('./c1-original-source-interval-coverage.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
const equal=(p,q)=>p&&q&&p.u===q.u&&p.v===q.v;
function auditC1NativeHLRGeneratedToOriginalVertexConcordance({
 geometry,revision,cad,originalNativeVertexProof,originalClosedRayM5
}={}){
 const graph=cad?.nativeGeneratedVertexGraph;
 if(!geometry?.data?.points||!Number.isSafeInteger(revision)||revision<1||
    cad.sourceGeometryId!==geometry.id||cad.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||cad.v5Authorized!==false||
    graph?.schema!=='draftai-ocjs-genuine-hlr-generated-topods-issame-vertex-graph/1'||
    graph.realOCCTIsSameComparedBeforeNativeObjectDeletion!==true||
    graph.actualGeneratedToOriginalTopoDSHistoryRecovered!==false||
    graph.signedV5ActionCount!==0||
    originalNativeVertexProof?.sourceGeometryId!==geometry.id||
    originalNativeVertexProof.revision!==revision||
    originalNativeVertexProof.signedV5ActionCount!==0||
    !Array.isArray(originalNativeVertexProof.rows)||
    (originalClosedRayM5!==undefined&&(
     originalClosedRayM5?.schema!==
      'draftai-c1-m5-exact-closed-original-edge-ray-and-cut-continuity/1'||
     originalClosedRayM5.sourceGeometryId!==geometry.id||
     originalClosedRayM5.revision!==revision||
     originalClosedRayM5.signedV5ActionCount!==0||
     !Array.isArray(originalClosedRayM5.rows))))
  throw new TypeError('real OCCT native graph and original 3D endpoint proof for same geometry/revision required');
 const base=new Map(),byGlobal=[];
 let global=0;
 for(const view of VIEWS){
  const visible=cad.views?.[view],hidden=cad.hiddenSharpViews?.[view],
   v=graph.views?.[view];
  if(!Array.isArray(visible)||!Array.isArray(hidden)||!v||
     v.view!==view||
     v.realNativeSharpEdgeCount!==visible.length+hidden.length||
     !Array.isArray(v.sameActualGeneratedOCCTTopoDSVertexPairs)||
     !Array.isArray(v.paperCoincidentButDifferentTopoDSVertexPairs))
   throw new RangeError('genuine V/H/W native graph incomplete');
  base.set(view,{visible,hidden,globalStart:global});
  for(let i=0;i<hidden.length;i++){
   const proof=originalNativeVertexProof.rows[global++];
   if(proof?.view!==view||proof.nativeHiddenSharpEdgeOrdinal!==global-1||
      proof.sourceGeometryId!==geometry.id||proof.revision!==revision||
      proof.OCCTGeneratedTopoDSNativeEdgeAdjacencyCertified!==false||
      proof.signedV5Action!==false)
    throw new RangeError('reordered or forged original physical hidden endpoint proof');
   byGlobal.push(proof);
  }
 }
 if(global!==originalNativeVertexProof.rows.length)
  throw new RangeError('incomplete hidden native endpoint proof count');
 const counts={actualNativeIsSamePairs:0,
  exactPaperCoincidentButDistinctNativeTopoDSPairsHeld:0,
  IsSameHiddenToHiddenNativeEndpointPairs:0,
  IsSameHiddenToHiddenMatchingOriginal3DPhysicalVertices:0,
  IsSameHLRNodesButOriginalSource3DVertexNotCertified:0,
  IsSameNativeVisibleAndHiddenSourceHistoryStillUnknown:0,
  nativeMixedVisibleHiddenWithAuthenticatedOriginalM0VertexAndM5ClearRay:0,
  distinctNativeTopoDSButSameIndependentlyProvenOriginal3DVertexPairs:0,
  paperCoincidentNativePairsWithoutIndependent3DPhysicalJunction:0,
  actualOriginal3DPhysicalSourceJunctionPairsVerified:0,
  genuineCompleteGeneratedHLRJunctionComponentsAudited:0,
  completeGeneratedHLRJunctionComponentsWithIndependentOriginal3DVertex:0,
  completeGeneratedHLRJunctionComponentsHeldOnUnmappedPhysicalSource:0,
  generatedNativeJunctionComponentsWithExactOriginal3DSourceInteriorSplit:0,
  generatedTopoDSEdgeOriginalSourceHistoryCertified:0,
  engineeringGBLineJunctionsSigned:0,signedV5Actions:0
 };
 const rows=[],aliases=[];
 // The original physical edge ledger is an identity contract, not an
 // arbitrary string label. Duplicated/reversed or invalid modeled edges
 // cannot support an independent native 3D junction witness.
 const sourceEdges=new Map();
 for(const edge of geometry.data.edges??[]){
  if(!Array.isArray(edge)||edge.length!==2||
     edge.some(id=>typeof id!=='string'||
      !Object.hasOwn(geometry.data.points,id))||edge[0]===edge[1])
   throw new RangeError('invalid original modeled 3D source edge');
  const key=geometry.id+'::'+[...edge].sort().join('|');
  if(sourceEdges.has(key))
   throw new RangeError('duplicate original modeled 3D source edge');
  sourceEdges.set(key,edge);
 }
 // A same-revision CLOSED front-ray witness must be unique per original
 // physical source edge and view. Map(last-write-wins) could otherwise let
 // contradictory/duplicated M5 rows silently certify a visible HLR endpoint.
 const outwardM5=new Map();
 for(const row of originalClosedRayM5?.rows??[]){
  if(!row||typeof row.originalPhysicalSourceEdgeId!=='string'||
     !VIEWS.includes(row.view))
   throw new RangeError('invalid original M5 closed-ray source/view witness');
  const key=row.originalPhysicalSourceEdgeId+'@'+row.view;
  if(outwardM5.has(key))
   throw new RangeError('duplicate original M5 closed-ray source/view witness');
  outwardM5.set(key,row);
 }
 // One physical source must win by independently proven M5 whole-front rays,
 // even when several real 3D edges co-project on the same HLR stroke.
 // Shared by original M0 endpoint and generated interior split checks.
 function uniqueM5FrontLift(lifts,view){
  if(!Array.isArray(lifts)||!originalClosedRayM5)return null;
  const accepted=lifts.filter(candidate=>{
    const physical=sourceEdges.get(candidate.sourceEdgeId),
     m5=outwardM5.get(candidate.sourceEdgeId+'@'+view);
    return physical&&m5?.fullProjectedVisibleSourceLineProven===true&&
     m5.completeSourceOriginal3DRayClosedIntervalClear===true&&
     m5.originalPhysicalCreaseProven===true&&
     m5.signedV5Action===false&&
     m5.officialEngineeringLineStyle==='undetermined'&&
     candidate.actualOriginalOCCTBRepEdge3DEndpointsVerified===true&&
     candidate.originalOCCTSourceLineCurveVerified===true&&
     candidate.originalXYZReprojectsToHLR===true&&
     candidate.v5Authorized===false&&
     Array.isArray(candidate.originalVertexIds)&&
     candidate.originalVertexIds.join('|')===physical.join('|');
   });
  return accepted.length===1?accepted[0]:null;
 }
 const xyzEq=(a,b)=>a&&b&&['x','y','z'].every(k=>
  Number.isFinite(a[k])&&Number.isFinite(b[k])&&a[k]===b[k]);
 function locate(ref,view){
  const v=base.get(view);
  if(!ref||!['visible-sharp','hidden-sharp'].includes(ref.hlrClass)||
     !['from','to'].includes(ref.side)||!Number.isSafeInteger(ref.nativeHLREdgeOrdinal))
   throw new RangeError('untrusted actual OCCT HLR vertex pair reference');
  const isHidden=ref.hlrClass==='hidden-sharp',
   list=isHidden?v.hidden:v.visible;
  const seg=list[ref.nativeHLREdgeOrdinal];
  const point=ref.side==='from'?seg?.from:seg?.to;
  if(!seg||seg.occtHLRVisibilityClass!==ref.hlrClass||
     seg.actualOCCTHLRFlattenedBRepLineVerified!==true||
     !equal(point,ref.nativePaperPoint))
   throw new RangeError('native true OCCT TopoDS vertex reference not in current HLR stroke');
  if(!isHidden){
   // A true HLR VCompound native segment can be tied to a MODELED original
   // M0 endpoint only if exactly ONE independently OCCT-measured original
   // straight 3D source candidate survives, its TRUE source endpoint
   // projects to the literal native generated paper vertex, and an
   // independent SAME-REVISION M5 closed ray clears the whole front edge.
   // This does not imply generated HLR edge -> original TopoDS history.
   const lift=uniqueM5FrontLift(seg.sourceCandidate3DLifts,view);
   if(!lift)return {source:null,vertex:null,nativeHidden:false};
   const edge=sourceEdges.get(lift.sourceEdgeId);
   const row=outwardM5.get(lift.sourceEdgeId+'@'+view);
   if(!edge||!row||
      row.fullProjectedVisibleSourceLineProven!==true||
      row.completeSourceOriginal3DRayClosedIntervalClear!==true||
      row.originalPhysicalCreaseProven!==true||
      row.signedV5Action!==false||
      row.officialEngineeringLineStyle!=='undetermined'||
      lift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
      lift.originalOCCTSourceLineCurveVerified!==true||
      lift.originalXYZReprojectsToHLR!==true||
      lift.v5Authorized!==false||
      !Array.isArray(lift.originalVertexIds)||
      lift.originalVertexIds.join('|')!==edge.join('|'))
    return {source:null,vertex:null,nativeHidden:false};
   // One native endpoint cannot be certified from a lift whose OTHER
   // endpoint contradicts the same original 3D source edge or HLR stroke.
   // Check the complete source interval before granting either endpoint.
   const tFrom=lift.sourceParameterAtProjectedFrom,
    tTo=lift.sourceParameterAtProjectedTo;
   const original=[geometry.data.points[edge[0]],geometry.data.points[edge[1]]];
   const actualA=lift.actualOriginalOCCTBRepFrom3D,
    actualB=lift.actualOriginalOCCTBRepTo3D;
   const inSourceRange=t=>Number.isFinite(t)&&t>=0&&t<=1;
   // HLR is a projected candidate, not proof of 3D depth. Reconstruct
   // BOTH lifted endpoints from the ORIGINAL normalized source parameter;
   // an interior paper-coincident point at the wrong depth must not certify
   // even the opposite, otherwise authentic, native vertex.
   const sourcePoint=t=>({
    x:original[0].x+(original[1].x-original[0].x)*t,
    y:original[0].y+(original[1].y-original[0].y)*t,
    z:original[0].z+(original[1].z-original[0].z)*t
   });
   const range=lift.originalSourceParameterRange;
   const completeSourceRange=Array.isArray(range)&&range.length===2&&
    range[0]===Math.min(tFrom,tTo)&&range[1]===Math.max(tFrom,tTo);
   if(!inSourceRange(tFrom)||!inSourceRange(tTo)||tFrom===tTo||
      !completeSourceRange||
      !((xyzEq(original[0],actualA)&&xyzEq(original[1],actualB))||
        (xyzEq(original[0],actualB)&&xyzEq(original[1],actualA)))||
      !xyzEq(lift.fromCandidate3D,lift.fromCandidate3D)||
      !xyzEq(lift.toCandidate3D,lift.toCandidate3D)||
      !xyzEq(lift.fromCandidate3D,sourcePoint(tFrom))||
      !xyzEq(lift.toCandidate3D,sourcePoint(tTo))||
      !equal(project(lift.fromCandidate3D)[view],seg.from)||
      !equal(project(lift.toCandidate3D)[view],seg.to))
    return {source:null,vertex:null,nativeHidden:false};
   const isFrom=ref.side==='from',t=isFrom?tFrom:tTo;
   const id=t===0?edge[0]:t===1?edge[1]:null;
   const acceptedSourceInterval={sourceEdgeId:lift.sourceEdgeId,
    originalSourceParameterRange:[...range]};
   if(id===null)return {source:null,vertex:null,nativeHidden:false,
    acceptedSourceInterval};
   const xyz=geometry.data.points[id],measured=isFrom?
    lift.fromCandidate3D:lift.toCandidate3D;
   if(!xyzEq(xyz,measured)||!equal(project(xyz)[view],point))
    return {source:null,vertex:null,nativeHidden:false};
   return {source:lift.sourceEdgeId,vertex:id,nativeHidden:false,
    acceptedSourceInterval,
    independentlyOriginalVisibleM0AndM5FullClearSourceVertex:true};
  }
  const original=byGlobal[v.globalStart+ref.nativeHLREdgeOrdinal];
  if(original.nativeSource3DVertexEndpointRows.length!==1)return {
   source:null,vertex:null,nativeHidden:true};
  const src=original.nativeSource3DVertexEndpointRows[0],
   w=src.endpointWitnesses[ref.side==='from'?0:1];
  if(!w||w.originalModel3DSourceVertexId===undefined)
   throw new RangeError('original M0 3D endpoint ledger missing');
  // A closed-face-fan flag alone does not bind a hidden HLR endpoint to
  // the claimed modeled 3D edge. Require the exact same-revision source
  // edge to exist, and the independently proven vertex to be its endpoint.
  // No generated-to-original TopoDS edge history is inferred here.
  const modeledEdge=sourceEdges.get(src.originalPhysicalSourceEdgeId);
  const vertexId=w.originalModel3DSourceVertexId;
  const genuineModeledEndpoint=modeledEdge&&typeof vertexId==='string'&&
   modeledEdge.includes(vertexId)&&
   Object.hasOwn(geometry.data.points,vertexId);
  // A native HLR endpoint can only be attributed to a modeled 3D vertex
  // if the actual original XYZ reprojects to that exact paper endpoint.
  // This is local concordance, NOT generated-to-original TopoDS history.
  const originalXYZ=genuineModeledEndpoint?geometry.data.points[vertexId]:null;
  const projectedOriginalEndpointMatchesNativePaper=
   xyzEq(originalXYZ,originalXYZ)&&equal(project(originalXYZ)[view],point);
  return {source:modeledEdge?src.originalPhysicalSourceEdgeId:null,
   vertex:genuineModeledEndpoint&&projectedOriginalEndpointMatchesNativePaper&&
    (w.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified===true||
     w.existingM4OriginalSourceEndpointVerified===true)?
     vertexId:null,
   nativeHidden:true};
 }
 // A genuine generated OCCT IsSame junction may split a SINGLE original
 // straight 3D edge in the interior: it is a real spatial continuity
 // point, NOT an original M0 vertex or a new generated->original history.
 // Verify full source 3D BRep, entire candidate line and both exact native
 // paper endpoints. Hidden candidates must also survive the existing M5
 // unique physical source gate; visible must pass M5 whole-front clearance.
 function originalSourceInteriorPoint(ref,view){
  const v=base.get(view),hidden=ref.hlrClass==='hidden-sharp',
   seg=(hidden?v.hidden:v.visible)[ref.nativeHLREdgeOrdinal],
   side=ref.side;
  if(!seg||!['from','to'].includes(side)||
     !Array.isArray(seg.sourceCandidate3DLifts))return null;
  let source;
  if(hidden){
   const row=byGlobal[v.globalStart+ref.nativeHLREdgeOrdinal];
   if(row?.nativeSource3DVertexEndpointRows?.length!==1)return null;
   source=row.nativeSource3DVertexEndpointRows[0]?.originalPhysicalSourceEdgeId;
  }else{
   // A back co-projected candidate must not hide a uniquely proven M5 front
   // source. Two eligible front sources still fail closed.
   const selected=uniqueM5FrontLift(seg.sourceCandidate3DLifts,view);
   if(!selected)return null;
   source=selected.sourceEdgeId;
  }
  const lifts=seg.sourceCandidate3DLifts.filter(x=>x.sourceEdgeId===source);
  if(lifts.length!==1)return null;
  const lift=lifts[0],edge=sourceEdges.get(source);
  if(!edge||lift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
     lift.originalOCCTSourceLineCurveVerified!==true||
     lift.originalXYZReprojectsToHLR!==true||lift.v5Authorized!==false||
     !Array.isArray(lift.originalVertexIds)||
     lift.originalVertexIds.join('|')!==edge.join('|'))return null;
  const a=geometry.data.points[edge[0]],b=geometry.data.points[edge[1]];
  const actualA=lift.actualOriginalOCCTBRepFrom3D,
   actualB=lift.actualOriginalOCCTBRepTo3D;
  if(!((xyzEq(a,actualA)&&xyzEq(b,actualB))||
       (xyzEq(a,actualB)&&xyzEq(b,actualA))))return null;
  const ts=[lift.sourceParameterAtProjectedFrom,lift.sourceParameterAtProjectedTo],
   range=lift.originalSourceParameterRange;
  if(!ts.every(t=>Number.isFinite(t)&&t>=0&&t<=1)||
     ts[0]===ts[1]||!Array.isArray(range)||range.length!==2||
     range[0]!==Math.min(...ts)||range[1]!==Math.max(...ts))return null;
  const lerp=t=>({
   x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t
  });
  // Checking the OTHER end too forbids a correct-looking junction
  // attached to a forged generated HLR segment with false 3D ancestry.
  if(![0,1].every(i=>{
   const q=lerp(ts[i]),candidate=i===0?
    lift.fromCandidate3D:lift.toCandidate3D;
   const paper=i===0?seg.from:seg.to;
   return xyzEq(q,candidate)&&equal(project(q)[view],paper);
  }))return null;
  const i=side==='from'?0:1,t=ts[i];
  if(!(t>0&&t<1))return null;
  const xyz=lerp(t);
  if(!equal(project(xyz)[view],ref.nativePaperPoint))return null;
  return {sourceEdgeId:source,originalSourceParameter:t,original3DPoint:xyz};
 }
 const verifiedPhysical3DPair=(a,b)=>
  (a.nativeHidden||a.independentlyOriginalVisibleM0AndM5FullClearSourceVertex===true)&&
  (b.nativeHidden||b.independentlyOriginalVisibleM0AndM5FullClearSourceVertex===true)&&
  a.source!==null&&b.source!==null&&a.source!==b.source&&
  a.vertex!==null&&a.vertex===b.vertex;
 // Every compared endpoint pair has exactly one native IsSame truth value.
 // Reject contradictory or duplicated rows even before a complete-star claim:
 // otherwise pairwise M0 junction counts can be inflated or contradictory.
 const endpointKey=ref=>ref.hlrClass+'@'+ref.nativeHLREdgeOrdinal+'@'+ref.side;
 const nativePairKey=pair=>[endpointKey(pair.a),endpointKey(pair.b)].sort().join('|');
 for(const view of VIEWS){
  const data=graph.views[view],seenNativePairTruth=new Map();
  for(const pair of data.sameActualGeneratedOCCTTopoDSVertexPairs){
   if(pair.view!==view||pair.nativeGeneratedOCCTTopoDSVertexIsSame!==true||
      pair.original3DSourceTopoDSVertexIdentityRecovered!==false||
      pair.actualNativeHLRStrokeJoinMeetsGlobalEngineeringRules!==false||
      pair.signedV5Action!==false||
      !equal(pair.a?.nativePaperPoint,pair.b?.nativePaperPoint))
    throw new RangeError('native OCCT shared vertex lacks real IsSame proof or is prematurely signed');
   const key=nativePairKey(pair);
   if(endpointKey(pair.a)===endpointKey(pair.b))
    throw new RangeError('self-paired native OCCT IsSame endpoint');
   if(seenNativePairTruth.has(key))
    throw new RangeError('duplicate actual OCCT IsSame pair');
   seenNativePairTruth.set(key,true);
   const a=locate(pair.a,view),b=locate(pair.b,view);
   const both=a.nativeHidden&&b.nativeHidden;
   const verified=verifiedPhysical3DPair(a,b);
   if(verified)counts.actualOriginal3DPhysicalSourceJunctionPairsVerified++;
   counts.actualNativeIsSamePairs++;
   if(both){
    counts.IsSameHiddenToHiddenNativeEndpointPairs++;
    if(verified)
     counts.IsSameHiddenToHiddenMatchingOriginal3DPhysicalVertices++;
    else counts.IsSameHLRNodesButOriginalSource3DVertexNotCertified++;
   }else{
    if(verified)
     counts.nativeMixedVisibleHiddenWithAuthenticatedOriginalM0VertexAndM5ClearRay++;
    else counts.IsSameNativeVisibleAndHiddenSourceHistoryStillUnknown++;
   }
   rows.push({view,a:{...pair.a},b:{...pair.b},
    original3DVertexIdAgreedFromTwoIndependentHiddenSources:
     verified&&both?a.vertex:null,
    original3DVertexIdAgreedBetweenAuthenticVisibleAndHiddenM0Sources:
     verified&&!both?a.vertex:null,
    actualOCCTHLRGeneratedTopoDSVertexIsSame:true,
    independentlyRealOriginal3DSourceJunctionAlsoProven:verified,
    originalGeneratedHLRTopoDSToSourceTopoDSEdgeHistoryCertified:false,
    globalJunctionAndGBEngineeringLineStyleCertified:false,
    signedV5Action:false
   });
  }
  for(const pair of data.paperCoincidentButDifferentTopoDSVertexPairs){
   if(pair.view!==view||
      pair.nativeGeneratedOCCTTopoDSVertexIsSame!==false||
      pair.signedV5Action!==false||
      !equal(pair.a?.nativePaperPoint,pair.b?.nativePaperPoint))
    throw new RangeError('paper-only alias cannot be considered a native vertex');
   const key=nativePairKey(pair);
   if(endpointKey(pair.a)===endpointKey(pair.b))
    throw new RangeError('self-paired paper-distinct native OCCT endpoint');
   if(seenNativePairTruth.has(key))
    throw new RangeError(seenNativePairTruth.get(key)?
     'conflicting native OCCT IsSame and paper-distinct pair':
     'duplicate paper-distinct native OCCT pair');
   seenNativePairTruth.set(key,false);
   const a=locate(pair.a,view),b=locate(pair.b,view);
   const originalPhysical=verifiedPhysical3DPair(a,b);
   counts.exactPaperCoincidentButDistinctNativeTopoDSPairsHeld++;
   if(originalPhysical){
    counts.distinctNativeTopoDSButSameIndependentlyProvenOriginal3DVertexPairs++;
    counts.actualOriginal3DPhysicalSourceJunctionPairsVerified++;
   }else counts.paperCoincidentNativePairsWithoutIndependent3DPhysicalJunction++;
   aliases.push({view,a:{...pair.a},b:{...pair.b},
    nativeTopoDSVertexShared:false,
    independentlyRealOriginal3DSourceJunctionPositivelyProven:originalPhysical,
    verifiedOriginal3DVertexId:originalPhysical?a.vertex:null,
    actualNativeGeneratedHLRSharedTopoDSVertexCertified:false,
    globalGBLineJoinStillNotCertified:true,signedV5Action:false});
  }
 }
 // Consume the *whole* actual OCCT IsSame equivalence-class star, not
 // one paper-coincident native edge pair at a time. A complete native star
 // is a proven original 3D physical shared vertex only if EVERY endpoint
 // independently traces to the SAME M0 source vertex and distinct genuine
 // M5-original 3D edges. A visible edge with unknown original provenance
 // holds the entire component; no invented native->original TopoDS history.
 const completeNativeJunctionStars=[];
 if(graph.allVHWGeneratedNativeTopologyPairsComparedWithoutPaperBucketing===true){
  const keyed=n=>n.hlrClass+'@'+n.nativeHLREdgeOrdinal+'@'+n.side;
  for(const view of VIEWS){
   const data=graph.views[view],stars=data.generatedOCCTSharedNativeJunctionComponents;
   if(data.allNativeGeneratedEndpointPairsIndependentlyCompared!==true||
      !Array.isArray(stars))
    throw new RangeError('exhaustive generated native HLR junction components missing');
   const actualPairIds=new Set(data.sameActualGeneratedOCCTTopoDSVertexPairs
    .map(p=>[keyed(p.a),keyed(p.b)].sort().join('|')));
   // A claimed exhaustive native star graph must consume EACH genuine IsSame
   // pair exactly once. Merely checking that every star pair exists is not
   // sufficient: an omitted third endpoint could silently certify a partial
   // original 3D fan as the complete physical junction.
   if(actualPairIds.size!==data.sameActualGeneratedOCCTTopoDSVertexPairs.length)
    throw new RangeError('duplicate actual OCCT IsSame pair in exhaustive graph');
   const consumedActualPairIds=new Set(),globallySeen=new Set();
   for(const group of stars){
    if(group.view!==view||
       group.actualGeneratedOCCTTopoDSVertexPairwiseIsSame!==true||
       group.originalGeneratedTopoDSHistoryRecovered!==false||
       group.engineeringLineJoinCertified!==false||
       group.signedV5Action!==false||
       !Array.isArray(group.generatedSharpEdgeEndpoints)||
       group.generatedSharpEdgeEndpoints.length<2)
     throw new RangeError('invalid genuine OCCT full generated vertex junction star');
    const members=group.generatedSharpEdgeEndpoints;
    const paper=group.exactNativePaperCoordinatesForEntireComponent;
    const names=new Set();
    for(const item of members){
     const id=keyed(item);
     if(names.has(id)||globallySeen.has(id)||!equal(item.nativePaperPoint,paper))
      throw new RangeError('overlapping or paper-misaligned native TopoDS junction stars');
     names.add(id);globallySeen.add(id);
    }
    for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
     const pairId=[keyed(members[i]),keyed(members[j])].sort().join('|');
     if(!actualPairIds.has(pairId))
      throw new RangeError('native junction component missing actual OCCT IsSame pair witness');
     if(consumedActualPairIds.has(pairId))
      throw new RangeError('duplicate native junction component OCCT IsSame pair');
     consumedActualPairIds.add(pairId);
    }
    const physical=members.map(member=>locate(member,view));
    const allSourceMapped=physical.every(x=>
     (x.nativeHidden||x.independentlyOriginalVisibleM0AndM5FullClearSourceVertex===true)&&
     typeof x.source==='string'&&x.vertex!==null&&x.vertex!==undefined);
    const vertices=new Set(physical.map(x=>x.vertex));
    const distinctSources=new Set(physical.map(x=>x.source));
    // A complete original physical fan cannot count the same modeled 3D
    // edge twice as two independent HLR endpoints. Split/generated native
    // strokes are not additional original source edges; hold the star until
    // every member has its own independently attributed physical edge.
    const fullyCertified=allSourceMapped&&vertices.size===1&&
     distinctSources.size===members.length;
    const interior=members.map(x=>originalSourceInteriorPoint(x,view)),
     sourceFirst=interior[0];
    const sourceInteriorSplit=interior.every(x=>
     x!==null&&sourceFirst!==null&&
     x.sourceEdgeId===sourceFirst.sourceEdgeId&&
     x.originalSourceParameter===sourceFirst.originalSourceParameter&&
     xyzEq(x.original3DPoint,sourceFirst.original3DPoint))&&
     !fullyCertified;
    if(sourceInteriorSplit)
     counts.generatedNativeJunctionComponentsWithExactOriginal3DSourceInteriorSplit++;
    counts.genuineCompleteGeneratedHLRJunctionComponentsAudited++;
    if(fullyCertified)
     counts.completeGeneratedHLRJunctionComponentsWithIndependentOriginal3DVertex++;
    else counts.completeGeneratedHLRJunctionComponentsHeldOnUnmappedPhysicalSource++;
    completeNativeJunctionStars.push({
     view,genuineNativeGeneratedOCCTVertexPairwiseIsSame:true,
     exactNativePaperPoint:{...paper},
     generatedHLREndpoints:members.map(x=>({...x,nativePaperPoint:{...x.nativePaperPoint}})),
     allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex:fullyCertified,
     actualOCCTGeneratedHLRSourceEdgeInteriorSplit3DProven:sourceInteriorSplit,
     source3DEdgeInteriorOriginalEdgeId:
      sourceInteriorSplit?sourceFirst.sourceEdgeId:null,
     source3DEdgeInteriorParameter:
      sourceInteriorSplit?sourceFirst.originalSourceParameter:null,
     source3DEdgeInterior3DPoint:
      sourceInteriorSplit?{...sourceFirst.original3DPoint}:null,
     independentlyVerifiedOriginalM03DVertexId:
      fullyCertified?physical[0].vertex:null,
     includesActualVisibleHLRWithIndependentM5WholeOriginalClearRay:
      fullyCertified&&physical.some(x=>!x.nativeHidden),
     independentlyTracedOriginal3DSourceEdges:
      fullyCertified?[...distinctSources].sort():[],
     originalOCCTGeneratedToSourceTopoDSEdgeHistoryRecovered:false,
     wholeSceneAndEngineeringGBJunctionCertified:false,
     signedV5Action:false
    });
   }
   if(consumedActualPairIds.size!==actualPairIds.size)
    throw new RangeError('exhaustive native junction stars omit genuine OCCT IsSame endpoint pairs');
  }
  if(counts.genuineCompleteGeneratedHLRJunctionComponentsAudited!==
      graph.counts.genuinelySharedNativeJunctionComponents)
   throw new RangeError('generated native junction component count disagrees with OCCT graph');
 }
 if(counts.actualNativeIsSamePairs!==
    graph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs||
    counts.exactPaperCoincidentButDistinctNativeTopoDSPairsHeld!==
    graph.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs)
  throw new RangeError('native OCCT generated vertex graph pair count mismatch');
 // Exact union of independently accepted native visible HLR lifts per
 // original source/view. This is a necessary coverage diagnostic, NOT proof
 // of complete generated TopoDS history or that every source must be visible.
 const acceptedNativeVisibleSourceCoverage=[];
 const independentlyM5AuthenticatedVisibleNativeGeneratedEdges=[];
 for(const view of VIEWS){
  const intervalsBySource=new Map(),visible=base.get(view).visible;
  for(let i=0;i<visible.length;i++){
   const seg=visible[i],at=side=>locate({
    hlrClass:'visible-sharp',nativeHLREdgeOrdinal:i,side,
    nativePaperPoint:seg[side]
   },view).acceptedSourceInterval;
   const from=at('from'),to=at('to');
   if(!from||!to||from.sourceEdgeId!==to.sourceEdgeId||
      from.originalSourceParameterRange[0]!==to.originalSourceParameterRange[0]||
      from.originalSourceParameterRange[1]!==to.originalSourceParameterRange[1])
    continue;
   independentlyM5AuthenticatedVisibleNativeGeneratedEdges.push({
    view,nativeVisibleHLREdgeOrdinal:i,
    sourceEdgeId:from.sourceEdgeId,
    originalSourceParameterRange:[...from.originalSourceParameterRange],
    originalNativeGeneratedCandidateCount:
     Array.isArray(seg.sourceCandidate3DLifts)?
      seg.sourceCandidate3DLifts.length:null,
    uniquePhysicalM5FrontOriginalSourceFromActualBRep:true,
    fullOriginalPhysicalSourceM5ClosedRayClear:true,
    generatedEdgeOriginalTopoDSHistoryRecovered:false,
    engineeringLineCertified:false,signedV5Action:false
   });
   if(!intervalsBySource.has(from.sourceEdgeId))
    intervalsBySource.set(from.sourceEdgeId,[]);
   intervalsBySource.get(from.sourceEdgeId).push(from.originalSourceParameterRange);
  }
  for(const sourceEdgeId of [...sourceEdges.keys()].sort()){
   const accepted=intervalsBySource.get(sourceEdgeId)??[];
   acceptedNativeVisibleSourceCoverage.push({
    view,sourceEdgeId,
    ...exactCandidateIntervalCoverage([0,1],accepted),
    independentlyAcceptedNativeVisibleHLRLiftsOnly:true,
    originalEdgeMustBeVisibleInThisView:false,
    completeGeneratedToOriginalTopoDSEdgeHistoryCertified:false,
    wholeSceneOcclusionAndEngineeringLineStyleCertified:false,
    signedV5Action:false
   });
  }
 }
 return frozen({schema:'draftai-c1-ocjs-native-generated-topods-original-3d-vertex-concordance/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,paperOnlyProjectedVertexAliases:aliases,
  acceptedNativeVisibleSourceCoverage,
  independentlyM5AuthenticatedVisibleNativeGeneratedEdges,
  completeGenuineNativeHLRJunctionStars:completeNativeJunctionStars,
  allPerViewActualNativeGeneratedJunctionComponentsConsumed:
   graph.allVHWGeneratedNativeTopologyPairsComparedWithoutPaperBucketing===true,
  nativeGeneratedTopoDSVertexAndOriginal3DPhysicalJunctionIndependentEvidence:true,
  actualGeneratedHLREdgeToOriginalTopoDSEdgeHistoryComplete:false,
  entireHLRGraphAndAllProjectedJunctionsCertified:false,
  GBEngineeringLineRulesSatisfied:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1NativeHLRGeneratedToOriginalVertexConcordance};
