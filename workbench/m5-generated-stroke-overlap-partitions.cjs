'use strict';
/**
 * M5 C2. Separate FIRST-ANGLE projected source-overlap critical events from
 * drawing authorization for each NEW cuboid union face-intersection stroke.
 *
 * Reuse the existing physical endpoint ledger (#623/624) and the complete
 * exact affine co-projected SOURCE-edge pair depth proof (#626).
 * Split only at REAL pair-overlap starts, ends, and optional analytic depth
 * tie roots, never at a sampled image pixel or arbitrary midpoint. On each
 * nonempty resulting open interval, enumerate all listed co-projected 3D
 * source features and their verified relative depth. Being front of other
 * listed LINES does not prove visibility against 3D opaque FACES.
 *
 * Nothing in this module signs final endpoints, visible/hidden engineering
 * line styles, ConstructionIntent, Step DAG, or canonical V5 drawing actions.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {auditUnionPhysicalFeatureJunctions}=
 require('./m5-union-physical-feature-junctions.cjs');
const {auditProjectedSourceOverlapDepth}=
 require('./m5-union-projected-overlap-depth.cjs');
const {auditGeneratedViewEndpointIncidence}=
 require('./m5-generated-view-endpoint-incidence.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);
 Object.freeze(x);
}return x;};
const xyz=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const close=(a,b)=>Math.abs(a-b)<=1e-9;
const equal3=(a,b)=>a&&b&&['x','y','z'].every(k=>close(a[k],b[k]));
const equal2=(a,b)=>a&&b&&close(a.u,b.u)&&close(a.v,b.v);
const unavailable=(revision)=>freeze({
 schema:'draftai-m5-generated-overlap-event-partitions/1',
 revision,status:'not-covered',entries:[],generatedM4CandidateCount:0,
 openPieceCount:0,strictlyFrontRelativePieceCount:0,
 strictlyBehindRelativePieceCount:0,unresolvedPieceCount:0,
 projectedCriticalEventCount:0,allOpaqueFacesAndFinalContoursVerified:false,
 officialLineStylesVerified:false,signedV5LineActions:0,v5Ready:false
});
function auditGeneratedStrokeOverlapPartitions({geometry,revision,
 projectedStrokePartitions,physicalJunctionEvidence,
 projectedOverlapDepthEvidence,generatedProjectedEndpointEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current generated overlap revision required');
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('reviewed 3D multiple source solids required');
 const fresh=auditUnionPhysicalFeatureJunctions({geometry,revision});
 if(fresh.status!=='source-recomputed-physical-3d-feature-incidence')
  return unavailable(revision);
 if(JSON.stringify(fresh)!==JSON.stringify(physicalJunctionEvidence))
  throw new TypeError('forged or stale original/generated 3D source graph');
 const overlap=auditProjectedSourceOverlapDepth({geometry,revision,
  physicalJunctionEvidence:fresh});
 if(overlap.status!=='full-analytic-listed-source-pair-overlap-depth')
  return unavailable(revision);
 if(JSON.stringify(overlap)!==JSON.stringify(projectedOverlapDepthEvidence))
  throw new TypeError('forged or stale continuous source pair depth proof');
 const currentView=auditGeneratedViewEndpointIncidence({
  geometry,revision,projectedStrokePartitions,
  physicalJunctionEvidence:fresh});
 if(currentView.status!=='source-bound-generated-3d-to-projected-endpoints')
  return unavailable(revision);
 if(JSON.stringify(currentView)!==JSON.stringify(generatedProjectedEndpointEvidence))
  throw new TypeError('forged or stale generated M4 endpoint evidence');
 const m4=projectedStrokePartitions;
 if(m4?.revision!==revision||m4.generatedStrokeSignedCount!==0||
    m4.v5Ready!==false||m4.officialLineStylesVerified!==false)
  throw new TypeError('untrusted generated M4 source action release');
 const viewById=new Map(currentView.candidates.map(c=>[c.m4CandidateId,c]));
 if(viewById.size!==m4.generatedSegments.length)
  throw new TypeError('missing independently verified generated projected candidate');
 const sources=new Map(fresh.segments.map(s=>[s.id,s]));
 const rows=[];
 let eventTotal=0;
 for(const candidate of m4.generatedSegments){
  const endpoint=viewById.get(candidate.id);
  const sourceId='generated:'+candidate.sourceGeneratedFeatureId;
  const source=sources.get(sourceId);
  if(!endpoint||!source||source.kind!=='generated-source-face-crease'||
     candidate.officialEngineeringLineStyle!=='undetermined'||
     candidate.canonicalIntentAndV5LineStepApproved!==false||
     !VIEWS.includes(candidate.view)||
     !equal3(source.source3DFrom,candidate.source3DFrom)||
     !equal3(source.source3DTo,candidate.source3DTo))
   throw new TypeError('M4 candidate lacks authenticated generated physical source');
  const view=candidate.view;
  const relevant=overlap.overlaps.filter(p=>p.view===view&&
   (p.sourceA.id===sourceId||p.sourceB.id===sourceId));
  const witnesses=relevant.map(w=>{
   const isA=w.sourceA.id===sourceId,
    self=isA?w.sourceA:w.sourceB,
    other=isA?w.sourceB:w.sourceA;
   const [a,b]=self.sourceOpenParameterRange;
   const lo=Math.min(a,b),hi=Math.max(a,b);
   if(!Number.isFinite(lo)||!Number.isFinite(hi)||
      lo< -1e-9||hi>1+1e-9||hi-lo<=1e-10||
      !sources.has(other.id)||w.officialSolidDashedEngineeringStyle!==
       'undetermined'||w.canonicalV5ActionSigned!==false)
    throw new RangeError('source depth overlap witness not within authentic edge');
   const actualA=xyz(source.source3DFrom,source.source3DTo,lo),
    actualB=xyz(source.source3DFrom,source.source3DTo,hi);
   if(!equal2(project(actualA)[view],w.projectedFromModelMm)&&
      !equal2(project(actualA)[view],w.projectedToModelMm))
    throw new RangeError('source pair overlap endpoint diverges from first-angle projection');
   if(!equal2(project(actualB)[view],w.projectedFromModelMm)&&
      !equal2(project(actualB)[view],w.projectedToModelMm))
    throw new RangeError('source pair overlap second endpoint diverges');
   const rootA=w.analyticSourceDepthTransitionParameter;
   let rootSelf=null;
   if(rootA!==null){
    const A=w.sourceA.sourceOpenParameterRange,
     B=w.sourceB.sourceOpenParameterRange;
    rootSelf=isA?rootA:B[0]+
     (rootA-A[0])*(B[1]-B[0])/(A[1]-A[0]);
    if(!Number.isFinite(rootSelf)||rootSelf<lo-1e-9||
       rootSelf>hi+1e-9)
     throw new RangeError('analytic depth crossover outside its proven source overlap');
   }
   return {pair:w,otherSourceFeatureId:other.id,isA,
    range:[Math.max(0,lo),Math.min(1,hi)],root:rootSelf};
  });
  if(witnesses.length>256)
   throw new RangeError('projected candidate has too many listed source overlaps');
  const cuts=[0,1];
  for(const w of witnesses){
   cuts.push(...w.range);
   if(w.root!==null)cuts.push(w.root);
  }
  cuts.sort((a,b)=>a-b);
  const unique=[];
  for(const t of cuts){
   if(!Number.isFinite(t)||t< -1e-9||t>1+1e-9)
    throw new RangeError('nonphysical generated source overlap cut');
   const v=Math.max(0,Math.min(1,t));
   if(unique.length&&close(unique.at(-1),v))continue;
   unique.push(v);
  }
  if(unique.length>514||unique[0]!==0||unique.at(-1)!==1)
   throw new RangeError('incomplete bounded generated source partition');
  const pieces=[];
  for(let k=0;k<unique.length-1;k++){
   const lo=unique[k],hi=unique[k+1];
   if(!(hi-lo>1e-9))continue;
   const factors=witnesses.filter(w=>w.range[0]<=lo+1e-9&&
    w.range[1]>=hi-1e-9).map(w=>{
    const p=w.pair,front=p.frontSourceFeatureId,
     signed=p.strictlyPositiveRelativeDepthAcrossWholeOverlap;
    const relative=signed&&front===sourceId?'self-strictly-ahead':
     signed&&front===w.otherSourceFeatureId?'self-strictly-behind':
     p.status==='coincident-3d-depth-needs-union-feature-dedup'?
      'same-depth-duplicate-unknown':'undetermined-pair-transition-or-tie';
    return {otherSourceFeatureId:w.otherSourceFeatureId,
     comparisonSourcePairId:p.id,
     status:relative,independentlyVerifiedAcrossEntireOpenSubspan:signed,
     globalOccludingFaceAbsenceVerified:false};
   });
   const front=factors.length>0&&factors.every(f=>
    f.status==='self-strictly-ahead');
   const behind=factors.some(f=>f.status==='self-strictly-behind');
   const unresolved=factors.some(f=>
    f.status==='same-depth-duplicate-unknown'||
    f.status==='undetermined-pair-transition-or-tie');
   const from=xyz(source.source3DFrom,source.source3DTo,lo),
    to=xyz(source.source3DFrom,source.source3DTo,hi);
   pieces.push({id:candidate.id+':open'+k,revision,
    view,sourceGeneratedFeatureId:candidate.sourceGeneratedFeatureId,
    source3DOpenParameterRange:[lo,hi],
    physicalSource3DFrom:from,physicalSource3DTo:to,
    projectedFromModelMm:project(from)[view],
    projectedToModelMm:project(to)[view],
    listedSourceOverlapWitnesses:factors,
    sourceFrontOfEveryListedCoProjectedFeatureVerified:front,
    sourceStrictlyBehindSomeListedCoProjectedFeatureVerified:behind,
    overlappingSourceDepthAmbiguity:unresolved,
    sourceViewFullOpaqueVolumeRayClassification:
     candidate.rayClassification,
    originalWholeSourceObserverRaysUnaffectedByCut:true,
    originalAndGenerated3DEndpointsOnlyLocallyVerified:true,
    allSceneOpaqueFacesAndProjectedContourJunctionsVerified:false,
    authorizedEngineeringLineStyle:'undetermined',
    certifiedConstructionIntentDAGOrV5Line:false});
  }
  if(!pieces.length||
     pieces[0].source3DOpenParameterRange[0]!==0||
     pieces.at(-1).source3DOpenParameterRange[1]!==1||
     pieces.some((p,i)=>i&&
       Math.abs(p.source3DOpenParameterRange[0]-
        pieces[i-1].source3DOpenParameterRange[1])>1e-9))
   throw new RangeError('source M4 line piece range incomplete after listed depth events');
  eventTotal+=unique.length-2;
  rows.push({m4GeneratedCandidateId:candidate.id,view,revision,
   originalSourceMeshEdgeId:null,
   sourceGeneratedFeatureId:candidate.sourceGeneratedFeatureId,
   physical3DEndpointWitnessIds:endpoint.endpoints.map(e=>
    e.physicalSourceNodeId),
   pairwiseOverlapCount:relevant.length,
   listedDepthEventCuts:unique,
   pieces,openPieceCount:pieces.length,
   completePerListedPairDepthPartitionVerified:true,
   entireOpaqueFaceDepthAndContourVerified:false,
   officialLineStylesVerified:false,signedV5LineActions:0});
 }
 const pieces=rows.flatMap(r=>r.pieces);
 return freeze({schema:'draftai-m5-generated-overlap-event-partitions/1',
  revision,status:'source-generated-view-pair-overlap-open-partitions',
  sourceGeometryIds:geometry.map(g=>g.id),
  entries:rows,generatedM4CandidateCount:rows.length,
  openPieceCount:pieces.length,projectedCriticalEventCount:eventTotal,
  strictlyFrontRelativePieceCount:pieces.filter(p=>
   p.sourceFrontOfEveryListedCoProjectedFeatureVerified).length,
  strictlyBehindRelativePieceCount:pieces.filter(p=>
   p.sourceStrictlyBehindSomeListedCoProjectedFeatureVerified).length,
  unresolvedPieceCount:pieces.filter(p=>
   p.overlappingSourceDepthAmbiguity).length,
  allListedOverlappingSourceLineDepthsPartitioned:true,
  allOpaqueFacesAndFinalContoursVerified:false,
  officialLineStylesVerified:false,signedV5LineActions:0,v5Ready:false});
}
module.exports={auditGeneratedStrokeOverlapPartitions};
