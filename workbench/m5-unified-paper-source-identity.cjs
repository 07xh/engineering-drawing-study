'use strict';
/**
 * M5 C2: group ORIGINAL+GENERATED reviewed union-feature OPEN intervals by
 * actual first-angle projected paper stroke, retaining REAL 3D provenance.
 *
 * Scope is the audited subset of source features from #630. The 2D event
 * graph has already split line crossings and positive collinear overlaps.
 * Equal paper strokes may be the SAME physical 3D feature, distinct lines
 * at strictly different observer depths, or unresolved depth ties.
 *
 * A unique FRONTMOST listed SOURCE LINE does not prove absence of another
 * body's intervening FACE, final source feature completeness, engineering
 * standards, endpoint joins, or an official V5 step.
 */
const {FIRST_ANGLE_OBSERVER_RAYS,project,VIEWS}=
 require('../core/projection/conventions.js');
const {auditUnifiedProjectedFeatureEvents}=
 require('./m5-unified-projected-feature-events.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const p=(q)=>({u:q.u,v:q.v});
const exact2=(a,b)=>a.u===b.u&&a.v===b.v;
const same3=(a,b)=>['x','y','z'].every(k=>a[k]===b[k]);
const dp=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
const compare=(a,b)=>a.u-b.u||a.v-b.v;
const depth=(pt,ray)=>pt.x*ray.x+pt.y*ray.y+pt.z*ray.z;
const fail=x=>{throw new TypeError('M5 unified paper source identity: '+x);};
function auditUnifiedPaperSourceIdentity({geometry,revision,
 projectedStrokePartitions,generatedSubspanRayEvidence,
 unifiedProjectedFeatureEventEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('reviewed source revision required');
 const fresh=auditUnifiedProjectedFeatureEvents({geometry,revision,
  projectedStrokePartitions,generatedSubspanRayEvidence});
 if(fresh.status!=='reviewed-original-and-generated-paper-event-candidates'||
    JSON.stringify(fresh)!==JSON.stringify(unifiedProjectedFeatureEventEvidence)||
    fresh.officialLineStylesVerified!==false||
    fresh.signedV5LineActions!==0||fresh.v5Ready!==false)
  fail('current original/new unified source event proof required');
 const candidate=new Map(fresh.candidates.map(x=>[x.id,x]));
 const groupMap=new Map();
 for(const piece of fresh.subspans){
  const source=candidate.get(piece.sourceCandidateId);
  if(!source||source.view!==piece.view||
     piece.authorizedEngineeringLineStyle!=='undetermined'||
     piece.canonicalIntentStepAndV5Approved!==false||
     !VIEWS.includes(piece.view))
   fail('unsigned, authentic projected source subspan required');
  const a=piece.projectedFromModelMm,b=piece.projectedToModelMm;
  if(dp(a,b)<=1e-8)fail('source line collapsed in 2D paper');
  const reverse=compare(a,b)>0,lo=reverse?b:a,hi=reverse?a:b;
  const from3D=reverse?piece.source3DTo:piece.source3DFrom,
   to3D=reverse?piece.source3DFrom:piece.source3DTo;
  if(!exact2(project(from3D)[piece.view],lo)||
     !exact2(project(to3D)[piece.view],hi))
   fail('source identity diverged from its V/H/W projection');
  const k=piece.view+':'+lo.u+','+lo.v+':'+hi.u+','+hi.v;
  if(!groupMap.has(k))groupMap.set(k,[]);
  groupMap.get(k).push({originalUnifiedSourceId:source.id,
   sourceSubspanId:piece.id,kind:source.kind,
   sourceGeometryIds:[...source.sourceGeometryIds],
   from3D:{...from3D},to3D:{...to3D},
   sourceObserverRayScope:source.observerRayEvidenceScope,
   originalSourceFeatureId:
    source.sourceEdgeId??source.generatedSourceFeatureId,
   source3DAndFirstAnglePaperCoordinatesVerified:true});
 }
 if(groupMap.size>1500)fail('bounded first-angle paper source registry budget');
 const groups=[],ids=new Set();
 for(const [key,items] of groupMap){
  if(items.length>150)fail('too many co-projected source features in one paper interval');
  const first=fresh.subspans.find(x=>x.id===items[0].sourceSubspanId);
  const a=first.projectedFromModelMm,b=first.projectedToModelMm,
   lo=compare(a,b)>0?b:a,hi=compare(a,b)>0?a:b,
   view=first.view,ray=FIRST_ANGLE_OBSERVER_RAYS[view];
  if(ids.has(key))fail('duplicate canonical paper interval');
  ids.add(key);
  const pairs=[];
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
   const A=items[i],B=items[j];
   const same=same3(A.from3D,B.from3D)&&same3(A.to3D,B.to3D);
   const d0=depth(A.from3D,ray)-depth(B.from3D,ray),
    d1=depth(A.to3D,ray)-depth(B.to3D,ray);
   const tol=1e-8;
   const frontA=d0>tol&&d1>tol,frontB=d0< -tol&&d1< -tol;
   pairs.push({sourceSubspanIds:[A.sourceSubspanId,B.sourceSubspanId],
    real3DPhysicalSourceIdentical:same,
    wholePairRelativeDepthStatus:same?'duplicate-same-3d-source':
     frontA?'source-A-strictly-front-across-whole-paper-interval':
     frontB?'source-B-strictly-front-across-whole-paper-interval':
     'undetermined-depth-tie-or-transition',
    observerDepthDifferenceAtEndsMm:[d0,d1],
    authentic3DSourceCoordinatesVerified:true,
    sourceLineDedupAndWholeOpaqueFaceOcclusionVerified:false,
    approvedEngineeringStyle:false});
  }
  const allFront=items.filter((x,i)=>items.every((y,j)=>{
   if(i===j)return true;
   const pair=pairs.find(p=>p.sourceSubspanIds.includes(x.sourceSubspanId)&&
    p.sourceSubspanIds.includes(y.sourceSubspanId));
   if(!pair||pair.real3DPhysicalSourceIdentical)return false;
   const isA=pair.sourceSubspanIds[0]===x.sourceSubspanId;
   return isA?pair.wholePairRelativeDepthStatus===
     'source-A-strictly-front-across-whole-paper-interval':
     pair.wholePairRelativeDepthStatus===
      'source-B-strictly-front-across-whole-paper-interval';
  }));
  const singleton=items.length===1;
  const ahead=items.length>1&&allFront.length===1;
  const localWinner=singleton?items[0].sourceSubspanId:
   ahead?allFront[0].sourceSubspanId:null;
  const forwardRayClearForWinner=localWinner?items.some(x=>
   x.sourceSubspanId===localWinner&&(
    x.sourceObserverRayScope==='visible'||
    x.sourceObserverRayScope==='certified-whole-open-subspan-forward-rays-clear')):false;
  groups.push({id:'M5Paper'+groups.length,revision,view,
   projectedFromModelMm:p(lo),projectedToModelMm:p(hi),
   sourceSubspans:items,physical3DPairwiseDepthAndDuplicates:pairs,
   sourceMultiplicity:items.length,
   onlyOneListedSourceFeature:singleton,
   relativeNearestListed3DSourceLineVerified:singleton||ahead,
   nearestListed3DSourceSubspanId:localWinner,
   nearestListedSourceFullObserverRayClearVerified:forwardRayClearForWinner,
   repeatedIdenticalReal3DSourceFeature:
    pairs.some(x=>x.real3DPhysicalSourceIdentical),
   unresolvedListedSourceDepthOrDuplicate:
    !singleton&&!ahead,
   exactPaperLineCandidateGroupVerified:true,
   ALLReviewedFinalContourSourcesEnumerated:false,
   completeOccluderFaceAndProjectedJunctionProofVerified:false,
   soleFinalDrawingSourceForThisPaperSegmentCertified:false,
   applicableEngineeringLineStyle:'undetermined',
   formalConstructionIntentDAGAndV5Approved:false});
 }
 return freeze({schema:'draftai-m5-unified-paper-source-identity/1',
  revision,status:'source-traced-canonical-projected-open-interval-registry',
  sourceGeometryIds:geometry.map(g=>g.id),groups,
  paperIntervalCount:groups.length,
  coProjectedMultiSourceIntervalCount:groups.filter(x=>
   x.sourceMultiplicity>1).length,
  physicallyDuplicatedSourceIntervalCount:groups.filter(x=>
   x.repeatedIdenticalReal3DSourceFeature).length,
  uniquelyFrontListedSourceIntervalCount:groups.filter(x=>
   x.relativeNearestListed3DSourceLineVerified).length,
  unresolvedRelativeSourceIntervalCount:groups.filter(x=>
   x.unresolvedListedSourceDepthOrDuplicate).length,
  inputEventPartitionedCandidateCount:fresh.subspans.length,
  allCandidatePiecesRetained:groups.reduce((sum,g)=>
   sum+g.sourceMultiplicity,0)===fresh.subspans.length,
  fullGlobalProjectedUnionAndOpaqueFaceCompletenessVerified:false,
  fullEngineeringStandardLineRuleVerified:false,
  officialLineStylesVerified:false,signedV5LineActions:0,v5Ready:false});
}
module.exports={auditUnifiedPaperSourceIdentity};
