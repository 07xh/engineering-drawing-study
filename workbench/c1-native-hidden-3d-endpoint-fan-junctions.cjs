'use strict';
/**
 * Reconcile genuine OCJS HCompound source-candidate 3D lifts, #760
 * independently M5-pruned source possibilities, and #759 authentic
 * CLOSED ORIGINAL VERTEX FACE FAN + M4 endpoint identities.
 *
 * The remaining unique SOURCE possibility is NOT equivalent to OCCT
 * generated TopoDS HLR edge->original source history. In particular:
 *  - an interior point of an original 3D edge can NEVER be promoted to
 *    a new original 3D vertex by a paper intersection or native HLR cut;
 *  - two different source vertices sharing a V/H/W image NEVER join;
 *  - even a real original 3D shared vertex does NOT certify native HLR
 *    generated edge adjacency, whole-view line style or V5.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const allFinite3=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const allFinite2=p=>p&&['u','v'].every(k=>Number.isFinite(p[k]));
const dist3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const dist2=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
const key=(g,a,b)=>g.id+'::'+[a,b].sort().join('|');
/**
 * Returns a PHYSICAL ORIGINAL-source vertex identity witness for one
 * native HLR PAPER endpoint and one independently M5 surviving candidate.
 * No floating tolerance is used to round the parameter to 0 or 1.
 * Tolerance checks only verify native OCCT numerical XYZ reprojection.
 */
function witnessHiddenHLRCandidateOriginal3DEndpoint({
 geometry,revision,view,sourceEdge,sourceLift,side,nativeProjected,
 vertexStarByKey
}={}){
 if(!geometry?.data?.points||!Number.isSafeInteger(revision)||revision<1||
    !VIEWS.includes(view)||!Array.isArray(sourceEdge)||
    sourceEdge.length!==2||!['from','to'].includes(side)||
    !(vertexStarByKey instanceof Map)||!allFinite2(nativeProjected))
  throw new TypeError('current original 3D source, native paper point and exact fan ledger required');
 const [aId,bId]=sourceEdge,a=geometry.data.points[aId],b=geometry.data.points[bId];
 if(!allFinite3(a)||!allFinite3(b)||
    sourceLift?.sourceEdgeId!==key(geometry,aId,bId)||
    sourceLift.originalVertexIds?.[0]!==aId||
    sourceLift.originalVertexIds?.[1]!==bId||
    sourceLift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
    sourceLift.originalOCCTSourceLineCurveVerified!==true||
    sourceLift.originalXYZReprojectsToHLR!==true||
    sourceLift.v5Authorized!==false)
  throw new TypeError('native HLR source lift is not independently original 3D OCCT geometry');
 const t=side==='from'?sourceLift.sourceParameterAtProjectedFrom:
  sourceLift.sourceParameterAtProjectedTo;
 const lifted=side==='from'?sourceLift.fromCandidate3D:sourceLift.toCandidate3D;
 if(!Number.isFinite(t)||t<0||t>1||!allFinite3(lifted)||
    dist3(mix(a,b,t),lifted)>1e-9||
    dist2(project(lifted)[view],nativeProjected)>1e-6)
  throw new RangeError('native HLR source endpoint XYZ/parameter/paper disagree');
 const id=t===0?aId:t===1?bId:null,actual=id===null?null:geometry.data.points[id];
 const modelEndpointCoincides=id!==null&&dist3(lifted,actual)<=1e-12;
 if(id!==null&&!modelEndpointCoincides)
  throw new RangeError('native source parameter claims original vertex with wrong XYZ');
 let starMatched=false,star=null,incident=null;
 if(modelEndpointCoincides){
  star=vertexStarByKey.get(view+'@'+id);
  incident=star?.incidentOriginalSourceEdges?.find(x=>
   x.originalSourceEdgeId===sourceLift.sourceEdgeId);
  if(!star||star.sourceGeometryId!==geometry.id||
     star.revision!==revision||star.view!==view||
     star.original3DVertexId!==id||
     !allFinite3(star.original3DModelPoint)||
     dist3(star.original3DModelPoint,actual)>1e-12||
     star.oneConnectedOriginal3DVertexFaceFanProven!==true||
     star.allIncidentSourceEdgesExactlyTwoOriginalFaceIncidencesProven!==true||
     star.signedV5Action!==false||!incident||
     incident.otherOriginal3DVertexId!==(id===aId?bId:aId))
   throw new RangeError('missing correct original closed 3D vertex fan incidence');
  starMatched=incident.original3DEndpointConfirmedByM4===true;
 }
 const otherVertices=Object.entries(geometry.data.points).filter(
  ([other,p])=>other!==id&&dist2(project(p)[view],nativeProjected)<=1e-6
 ).map(([vid])=>vid).sort();
 return freeze({
  view,sourceGeometryId:geometry.id,revision,
  sourceEdgeId:sourceLift.sourceEdgeId,
  nativeHLREndpointSide:side,
  nativePaperPoint:{...nativeProjected},
  originalSourceParameter:t,possibleOriginal3DPoint:{...lifted},
  exactOriginalM0ParameterIsSourceVertex:t===0||t===1,
  originalSource3DVertexId:modelEndpointCoincides?id:null,
  independentlyVerifiedOriginal3DClosedFaceFan:
   modelEndpointCoincides&&star?.oneConnectedOriginal3DVertexFaceFanProven===true,
  originalM4PaperEndpointMatchesAuthentic3DVertex:starMatched,
  original3DSourceVertexPlusM4AndFanVerified:starMatched,
  projectedOtherOriginal3DVertexIdsNotJoined:otherVertices,
  nativeHLRGeneratedTopoDSEndpointToOriginalTopoDSIdentityCertified:false,
  nativeHLRNativeEdgeToAnotherHLREdgeJoinCertified:false,
  standardEngineeringLineStyle:'undetermined',
  constructionIntentAuthorized:false,signedV5Action:false
 });
}
/**
 * Consume current genuine native HLR output and independent original M5
 * negative candidate proofs; verify every surviving native lifted source
 * endpoint against the original vertex-star ledger, including real 3D
 * source-edge incidence. No native-only paper junction creates a vertex.
 */
function auditC1NativeHidden3DEndpointFans({
 geometry,revision,cad,refinements,vertexStars
}={}){
 if(!geometry?.data?.points||!Number.isSafeInteger(revision)||revision<1||
    cad?.sourceGeometryId!==geometry.id||cad.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||cad.v5Authorized!==false||
    cad.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
    !Array.isArray(refinements)||!Array.isArray(vertexStars?.rows)||
    vertexStars.sourceGeometryId!==geometry.id||
    vertexStars.revision!==revision||
    vertexStars.entireOriginalClosed3DVertexFanTopologyCertified!==true||
    vertexStars.signedV5ActionCount!==0)
  throw new TypeError('genuine native HLR, current M5 and original closed 3D fan ledger required');
 const original=new Map(geometry.data.edges.map(edge=>[
  key(geometry,...edge),edge]));
 const stars=new Map(vertexStars.rows.map(row=>[
  row.view+'@'+row.original3DVertexId,row]));
 const expected=Object.keys(geometry.data.points).length*VIEWS.length;
 if(original.size!==geometry.data.edges.length||stars.size!==expected||
    vertexStars.rows.length!==expected)
  throw new RangeError('duplicate original 3D edge or missing vertex-star/view');
 const rows=[],endpointsByViewAndVertex=new Map(),counts={
  nativeHiddenSharpEdgesVisited:0,
  ambiguousNativeHidden3DOriginalSourcesRemaining:0,
  uniquePhysicallyPossibleSourceEdges:0,
  nativeHiddenAllSourcePossibilitiesExcludedHeld:0,
  survivingOriginal3DSourceEndpointsReviewed:0,
  sourceEndpointsAtAuthenticOriginal3DVertices:0,
  sourceEndpointsWithOriginalM4AndClosed3DFanWitness:0,
  originalSourceInterior3DPointsNotMadeVertices:0,
  projectedOther3DVertexAliasesExplicitlyHeld:0,
  genuineOriginal3DSourceVertexJunctionPairs:0,
  nativeHLRToHLREdgePhysicalJunctionsCertified:0,
  GBLineStylesSigned:0,V5ActionsSigned:0
 };
 let i=0,globalOrdinal=0;
 for(const view of VIEWS){
  const hidden=cad.hiddenSharpViews?.[view];
  if(!Array.isArray(hidden))
   throw new TypeError('all genuine native V/H/W hidden sharp views required');
  for(const native of hidden){
   const ref=refinements[i++];
   if(!ref||ref.view!==view||
      !allFinite2(ref.projectedFrom)||!allFinite2(ref.projectedTo)||
      ref.projectedFrom.u!==native.from.u||
      ref.projectedFrom.v!==native.from.v||
      ref.projectedTo.u!==native.to.u||
      ref.projectedTo.v!==native.to.v||
      ref.originalPaperCandidateCount!==native.sourceCandidate3DLifts?.length||
      ref.nativeHLRToSourceTopoDSIdentityRecovered!==false||
      ref.signedV5Action!==false)
    throw new RangeError('native sharp edge and M5 pruning record ordering/revision mismatch');
   const survivors=ref.remainingPhysicalSourcePossibilities;
   const excluded=ref.originalSourcesExcludedByExactClosedRay;
   if(!Array.isArray(survivors)||!Array.isArray(excluded)||
      survivors.length+excluded.length!==native.sourceCandidate3DLifts.length||
      new Set([...survivors,...excluded].map(x=>x.sourceEdgeId)).size!==
       native.sourceCandidate3DLifts.length)
    throw new RangeError('native hidden paper candidate elimination is not complete');
   if(survivors.length>1)
    counts.ambiguousNativeHidden3DOriginalSourcesRemaining++;
   if(survivors.length===1)
    counts.uniquePhysicallyPossibleSourceEdges++;
   if(survivors.length===0)
    counts.nativeHiddenAllSourcePossibilitiesExcludedHeld++;
   const sourceRows=[];
   for(const possibility of survivors){
    const lift=native.sourceCandidate3DLifts.find(x=>
     x.sourceEdgeId===possibility.sourceEdgeId);
    const edge=original.get(possibility.sourceEdgeId);
    if(!edge||!lift||
       possibility.genuineHLRToOriginalTopoDSIdentityVerified!==false||
       possibility.signedV5Action!==false)
     throw new RangeError('M5 survivor lost real OCCT 3D source correspondence');
    const endpoints=[
     witnessHiddenHLRCandidateOriginal3DEndpoint({
      geometry,revision,view,sourceEdge:edge,
      sourceLift:lift,side:'from',nativeProjected:native.from,
      vertexStarByKey:stars}),
     witnessHiddenHLRCandidateOriginal3DEndpoint({
      geometry,revision,view,sourceEdge:edge,
      sourceLift:lift,side:'to',nativeProjected:native.to,
      vertexStarByKey:stars})
    ];
    for(const w of endpoints){
     counts.survivingOriginal3DSourceEndpointsReviewed++;
     if(w.originalSource3DVertexId!==null)
      counts.sourceEndpointsAtAuthenticOriginal3DVertices++;
     else counts.originalSourceInterior3DPointsNotMadeVertices++;
     if(w.original3DSourceVertexPlusM4AndFanVerified)
      counts.sourceEndpointsWithOriginalM4AndClosed3DFanWitness++;
     counts.projectedOther3DVertexAliasesExplicitlyHeld+=
      w.projectedOtherOriginal3DVertexIdsNotJoined.length;
     if(w.original3DSourceVertexPlusM4AndFanVerified){
      const k=view+'@'+w.originalSource3DVertexId;
      if(!endpointsByViewAndVertex.has(k))
       endpointsByViewAndVertex.set(k,[]);
      endpointsByViewAndVertex.get(k).push({
       nativeEdgeOrdinal:globalOrdinal,sourceEdgeId:possibility.sourceEdgeId,
       originalSource3DVertexId:w.originalSource3DVertexId
      });
     }
    }
    sourceRows.push({originalPhysicalSourceEdgeId:possibility.sourceEdgeId,
     sourceIsOnlyRemainingPhysicalPossibility:survivors.length===1,
     endpointWitnesses:endpoints,
     nativeGeneratedEdgeSourceIdentityCertified:false,
     engineeringLineStyle:'undetermined',signedV5Action:false});
   }
   rows.push({
    view,sourceGeometryId:geometry.id,revision,
    nativeHiddenSharpEdgeOrdinal:globalOrdinal,
    nativeProjectedFrom:{...native.from},nativeProjectedTo:{...native.to},
    physicallyRemainingSourceCount:survivors.length,
    survivingOriginal3DEdgesWithEndpointFans:sourceRows,
    nativeGeneratedTopoDSIdentityCertified:false,
    nativeHLREdgeJunctionsCertified:false,
    formalEngineeringLineStyle:'undetermined',signedV5Action:false
   });
   globalOrdinal++;counts.nativeHiddenSharpEdgesVisited++;
  }
 }
 if(i!==refinements.length)
  throw new RangeError('extra native hidden HLR source-refinement records');
 const genuineOriginal3DSourceVertexPairs=[];
 for(const [k,entries] of endpointsByViewAndVertex){
  const [view,id]=k.split('@'),star=stars.get(k);
  if(!star||!star.oneConnectedOriginal3DVertexFaceFanProven)
   throw new RangeError('shared original vertex lacks original source fan');
  for(let a=0;a<entries.length;a++)for(let b=a+1;b<entries.length;b++){
   const p=entries[a],q=entries[b];
   if(p.nativeEdgeOrdinal===q.nativeEdgeOrdinal||
      p.sourceEdgeId===q.sourceEdgeId)continue;
   const originalSourceIds=[p.sourceEdgeId,q.sourceEdgeId].sort();
   if(!star.true3DOriginalSourceJunctionPairs.some(x=>
    x.exactSharedOriginal3DVertexId===id&&
    x.exactReviewedPhysical3DVertexIdentity===true&&
    x.originalSourceEdgeIds[0]===originalSourceIds[0]&&
    x.originalSourceEdgeIds[1]===originalSourceIds[1]&&
    x.signedV5Action===false))
    throw new RangeError('paper-only projected join impersonates 3D physical fan');
   genuineOriginal3DSourceVertexPairs.push({
    view,original3DVertexId:id,
    originalPhysicalSourceEdgeIds:originalSourceIds,
    nativeHiddenEdgeOrdinals:[p.nativeEdgeOrdinal,q.nativeEdgeOrdinal],
    originalSource3DStarJunctionProven:true,
    nativeHLRGeneratedEdgesPhysicallyConnectedCertified:false,
    standardEngineeringLineJoinCertified:false,signedV5Action:false
   });
   counts.genuineOriginal3DSourceVertexJunctionPairs++;
  }
 }
 if(counts.survivingOriginal3DSourceEndpointsReviewed!==
     rows.reduce((n,r)=>n+r.survivingOriginal3DEdgesWithEndpointFans.length*2,0)||
    counts.nativeHiddenSharpEdgesVisited!==refinements.length||
    counts.GBLineStylesSigned!==0||counts.V5ActionsSigned!==0)
  throw new RangeError('original source 3D vertex fan ledger incomplete');
 return freeze({
  schema:'draftai-c1-ocjs-native-hidden-hlr-original-3d-endpoint-fan-joins/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  original3DVertexFanSchema:vertexStars.schema,
  genuineNativeHiddenSharpStrokeCount:rows.length,
  counts,rows,genuineOriginal3DSourceVertexPairs,
  noPaperOnlyEndpointBecame3DVertex:true,
  nativeGeneratedTopoDSEdgeEndpointIdentityProven:false,
  allFinalNativeHiddenJunctionsAndGBLineStylesSigned:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={witnessHiddenHLRCandidateOriginal3DEndpoint,
 auditC1NativeHidden3DEndpointFans};
