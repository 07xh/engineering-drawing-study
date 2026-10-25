'use strict';
/**
 * C1 M5: physical original-source 2D overlap ledger, using ONLY current
 * M0 convex reviewed geometry, the SAME M4 cut graph and the already
 * proven C1 original-source affine depth oracle.
 *
 * Exact 3D locus duplicates and merely coincident PAPER projections
 * are never conflated. Positive pairwise depth precedence does not
 * prove whole-scene face occlusion, a GB standard line style or V5.
 */
const {auditC1ReviewedProjectedSourceEventGraph}=
 require('./c1-reviewed-projected-source-event-graph.cjs');
const {auditC1ProjectedSourcePairDepth}=
 require('./c1-projected-source-pair-affine-depth.cjs');
const {auditReviewedConvexSourceCreases}=
 require('./m5-reviewed-convex-source-creases.cjs');
const {positiveCollinearOverlap,intervalCoverage}=
 require('./c1-ocjs-reviewed-solid-v5.cjs');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))freeze(v);
  Object.freeze(o);
 }return o;
};
const same3=(a,b)=>a.x===b.x&&a.y===b.y&&a.z===b.z;
const sameLocus=(a,b)=>
 (same3(a.from3D,b.from3D)&&same3(a.to3D,b.to3D))||
 (same3(a.from3D,b.to3D)&&same3(a.to3D,b.from3D));
const covers=(a,b)=>intervalCoverage(a.fromModelMm,a.toModelMm,
 [{from:b.fromModelMm,to:b.toModelMm}],1e-8);
const sourceIntervalKey=s=>s.sourceEdgeId+'@'+s.view+'@'+
 s.originalParameterRange.join(':');
function auditC1OriginalPaperSourcePrecedence({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current reviewed C1 source revision required');
 const graph=auditC1ReviewedProjectedSourceEventGraph({geometry,revision});
 const pair=auditC1ProjectedSourcePairDepth({geometry,revision});
 const creases=auditReviewedConvexSourceCreases({geometry,revision});
 if(graph.sourceGeometryId!==geometry.id||graph.revision!==revision||
    !graph.originalM5ExteriorHullRecomputedAndAvailable||
    graph.signedV5ActionCount!==0||
    pair.sourceGeometryId!==geometry.id||pair.revision!==revision||
    pair.officialV5ActionCount!==0||
    creases.sourceGeometryId!==geometry.id||
    creases.officialLineStylesVerified!==false)
  throw new RangeError('current original C1 M4/M5 scope required');
 const physical=new Map(creases.edges.map(s=>[
  s.sourceEdgeId,s.sourceIsPhysicalCreaseWithinSingleSolid]));
 if(physical.size!==creases.sourceEdgeCount)
  throw new TypeError('duplicate untrusted original physical edge');
 const byView=new Map(graph.rows.map(x=>[x.sourceEdgeId+'@'+x.view,x]));
 if(byView.size!==graph.rows.length)
  throw new TypeError('duplicate original source/view event graph');
 const all=graph.rows.flatMap(x=>x.spans.map(s=>({
  ...s,physical:physical.get(s.sourceEdgeId)===true
 })));
 const knownPairs=new Map();
 for(const witness of pair.witnesses){
  if(witness.sourceGeometryId!==geometry.id||
     witness.revision!==revision||witness.signedV5Action!==false||
     witness.standardEngineeringLineStyle!=='undetermined')
   throw new TypeError('untrusted M5 original source depth comparison');
  const key=witness.view+':'+[witness.firstSourceEdgeId,
   witness.secondSourceEdgeId].sort().join('|');
  if(!knownPairs.has(key))knownPairs.set(key,[]);
  knownPairs.get(key).push(witness);
 }
 let physicalCandidates=0,heldExterior=0,coplanarOrDegenerate=0,
  soleListedSource=0,strictFrontAmongListed=0,behindAnother=0,
  exactPhysicalDuplicates=0,unresolvedAlias=0,
  certifiedPairComparisons=0,partialPaperAlias=0;
 const result=[];
 for(const s of all){
  const exposedPhysical=s.physical===true;
  const competitors=exposedPhysical?all.filter(b=>
   b.view===s.view&&b.sourceEdgeId!==s.sourceEdgeId&&b.physical&&
   positiveCollinearOverlap(s.fromModelMm,s.toModelMm,
    b.fromModelMm,b.toModelMm)):[];
  let blocked=false,backed=false,duplicate=false,partial=false;
  const relations=[];
  for(const other of competitors){
   const peerCoversSpan=covers(s,other);
   const wholeSamePhysicalLocus=peerCoversSpan&&sameLocus(s,other);
   const key=s.view+':'+[s.sourceEdgeId,other.sourceEdgeId].
    sort().join('|');
   const matches=(knownPairs.get(key)??[]).filter(w=>
    w.exactM4PositivePaperCollinearOverlap===true&&
    w.originalSourceEndpointParametersInBounds===true&&
    w.independent3DEndpointProjectionsMatch===true&&
    intervalCoverage(s.fromModelMm,s.toModelMm,[{
     from:w.projectedFromModelMm,to:w.projectedToModelMm}],1e-8));
   const positive=matches.filter(w=>
    w.continuousAffineOpenDepthOrderProven===true);
   const winner=new Set(positive.map(w=>w.frontSourceEdgeId));
   const validWinner=winner.size===1?
    [...winner][0]:null;
   const ahead=validWinner===s.sourceEdgeId;
   const behind=validWinner===other.sourceEdgeId;
   if(wholeSamePhysicalLocus)duplicate=true;
   if(!peerCoversSpan)partial=true;
   if(behind)backed=true;
   if(!wholeSamePhysicalLocus&&(!peerCoversSpan||
       !validWinner||!ahead&&!behind))blocked=true;
   if(ahead||behind)certifiedPairComparisons++;
   relations.push({
    otherOriginalPhysicalSourceId:other.sourceEdgeId,
    otherOriginalSourceParameterRange:
     [...other.originalParameterRange],
    samePositiveLengthPaperLineVerified:true,
    currentSubspanFullyCoveredByOtherProjection:peerCoversSpan,
    exactSame3DPhysicalLineLocus:wholeSamePhysicalLocus,
    originalAffinePairwiseWholeOpenDepthVerified:
     validWinner!==null,
    strictlyFrontOriginalSourceId:validWinner,
    paperOverlapUnresolvedForFullSource:!peerCoversSpan,
    everyOpaqueFaceAndPhysicalJunctionProven:false,
    officialEngineeringLineStyle:'undetermined',
    signedV5Action:false
   });
  }
  let status;
  if(!exposedPhysical){
   coplanarOrDegenerate++;
   status='unproven-physical-source-feature-held';
  }else if(s.projectedExteriorHullOverlap===true){
   heldExterior++;
   status='existing-m5-exterior-contour-held';
  }else{
   physicalCandidates++;
   if(duplicate){exactPhysicalDuplicates++;
    status='exact-original-3d-feature-duplicate-held';
   }else if(backed){behindAnother++;
    status='behind-another-original-source-open-interval';
   }else if(partial||blocked){unresolvedAlias++;
    if(partial)partialPaperAlias++;
    status='unresolved-paper-source-competition';
   }else if(competitors.length===0){soleListedSource++;
    status='sole-listed-original-physical-source';
   }else{strictFrontAmongListed++;
    status='strict-front-among-listed-original-physical-sources';
   }
  }
  result.push({
   view:s.view,sourceGeometryId:geometry.id,revision,
   originalPhysicalSourceEdgeId:s.sourceEdgeId,
   originalSourceVertexIds:[...s.originalVertexIds],
   originalParameterRange:[...s.originalParameterRange],
   fromModelMm:{...s.fromModelMm},toModelMm:{...s.toModelMm},
   original3DFrom:{...s.from3D},original3DTo:{...s.to3D},
   originalM5ExteriorContourOverlap:s.projectedExteriorHullOverlap,
   originalPhysicalCreaseWithinSingleSolid:exposedPhysical,
   sourceIntervalId:sourceIntervalKey(s),
   sourceCompetingPhysicalEdges:relations,
   status,
   listedOriginalSourcePriorityProven:
    status==='sole-listed-original-physical-source'||
    status==='strict-front-among-listed-original-physical-sources',
   actualOpaqueFaceOcclusionAndEndpointJoinsProven:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
 }
 const counts={allOriginalSourceProjectedSubspans:result.length,
  originalPhysicalNonHullSubspans:physicalCandidates,
  existingM5ExteriorHeld:heldExterior,
  coplanarOrUnprovenFeatureHeld:coplanarOrDegenerate,
  soleListedSource,strictFrontAmongListed,behindAnother,
  exactPhysicalDuplicates,unresolvedAlias,partialPaperAlias,
  positivePairDepthComparisons:certifiedPairComparisons,
  attemptedV5Actions:0};
 if(result.length!==graph.partitionedSourceSubintervalCount||
    counts.allOriginalSourceProjectedSubspans!==
     counts.originalPhysicalNonHullSubspans+
     counts.existingM5ExteriorHeld+
     counts.coplanarOrUnprovenFeatureHeld||
    counts.originalPhysicalNonHullSubspans!==
     soleListedSource+strictFrontAmongListed+behindAnother+
     exactPhysicalDuplicates+unresolvedAlias||
    result.some(s=>s.signedV5Action!==false||
     s.engineeringLineStyle!=='undetermined'))
  throw new RangeError('projected-original-source identity budget or unsigned gate');
 return freeze({
  schema:'draftai-c1-m5-original-source-paper-priority/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  originalM4SourceGraphSchema:graph.schema,
  existingSourcePairAffineDepthSchema:pair.schema,
  counts,subspans:result,
  allOtherOpaqueFacesProvenClear:false,
  wholeSceneSourceContinuityCertified:false,
  standardEngineeringLineStylesAuthorized:false,
  signedV5ActionCount:0,wholeSolidV5Ready:false
 });
}
module.exports={auditC1OriginalPaperSourcePrecedence};
