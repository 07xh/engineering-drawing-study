'use strict';
/**
 * Bridge current genuine OCJS native HCompound physical source proof to
 * authoritative C1 ORIGINAL M5 complete-stroke obligations (#765/#767).
 *
 * A full native PAPER OPEN-interval proof is a real positive mathematical
 * result, but does not prove:
 *  - actual generated OCCT TopoDS edge -> original source edge history,
 *  - every adjacent native HLR edge has the same physical original 3D vertex,
 *  - all opaque faces / projected junctions / engineering GB style, or
 *  - existence of an approved ConstructionIntent, DAG and sole V5 stroke.
 *
 * This is a read-only M5 gate and NEVER introduces a second signer.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {exactOriginalM4TransverseCrossingDepth}=
 require('./c1-m4-exact-original-crossing-depth.cjs');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const {auditC1SingleConvexSourceSubspanRays}=
 require('./m5-c1-source-subspan-opaque-rays.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))frozen(x);Object.freeze(o);
}return o;};
const requiredGlobal=[
 'original3DSourceIdentity','completeIntervalVisibility',
 'endpointAndProjectionTopology','engineeringLineStandard',
 'soleConstructionIntentDAGV5'
];
// Mathematical partition checker ONLY. The final native HLR gate gives it
// freshly recomputed actual all-original-opaque-face ray subspans, never
// user-supplied rays. Source cover without gaps AND without any overlap is
// a necessary V/H/W topology condition; it is not an engineering line.
function certifyExactOriginalRaySourceParameterPartition({
 sourceViewKey,spans,projectionCollapsedExactly
}={}){
 if(typeof sourceViewKey!=='string'||!sourceViewKey.includes('@')||
    !Array.isArray(spans)||typeof projectionCollapsedExactly!=='boolean')
  throw new TypeError('current original M4 ray source partition required');
 const ranges=spans.map(item=>{
  const r=item?.originalSourceParameterRange;
  if(!Array.isArray(r)||r.length!==2||
     !r.every(Number.isFinite)||r[0]<0||r[1]>1||!(r[0]<r[1]))
   throw new RangeError('nonfinite or empty canonical original ray source parameter cut');
  return [...r];
 }).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 let overlapped=false,cursor=0;
 for(const [a,b] of ranges){
  if(a<cursor)overlapped=true;
  cursor=Math.max(cursor,b);
 }
 const coverage=exactCandidateIntervalCoverage([0,1],ranges);
 return frozen({
  sourceViewKey,projectionCollapsedExactly,
  canonicalOriginalRayM4SpanCount:spans.length,
  disjointCanonicalM4OriginalRayIntervals:!overlapped,
  fullOriginalParameterRayPartitionCoverage:
   !overlapped&&coverage.entireOriginalParameterIntervalCovered&&
   spans.length>0,
  originalParameterUncoveredIntervals:
   coverage.positiveLengthUncoveredIntervals,
  physicalLineDrawableInThisFirstAngleView:
   !projectionCollapsedExactly,
  originalFaceRayAndGeneratedHLRTopologyComplete:false,
  nationalEngineeringLineStyleSigned:false,
  signedV5Action:false
 });
}
// An exact union alone cannot certify a 1:1 native-generated edge topology:
// overlapping original M0 parameter fragments must stay independently held.
function certifyExactNativeGeneratedSourceTiling({sourceViewKey,intervals}={}){
 if(typeof sourceViewKey!=='string'||!sourceViewKey.includes('@')||
    !Array.isArray(intervals))
  throw new TypeError('actual native source-view intervals required');
 const ordered=intervals.map(r=>{
  if(!Array.isArray(r)||r.length!==2||!r.every(Number.isFinite)||
     r[0]<0||r[1]>1||r[0]>=r[1])
   throw new RangeError('invalid generated OCCT original source interval');
  return [...r];
 }).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 let cursor=0;
 const overlaps=[];
 for(const [a,b] of ordered){
  if(a<cursor)overlaps.push([a,Math.min(b,cursor)]);
  cursor=Math.max(cursor,b);
 }
 const union=exactCandidateIntervalCoverage([0,1],ordered);
 return frozen({
  sourceViewKey,actualNativeGeneratedSourceFragments:ordered.length,
  originalNativeSourceIntervals:ordered,
  positiveSameOriginal3DSourceGeneratedEdgeOverlaps:overlaps,
  actualNativeOriginalSourceUnion:union.positiveLengthCoveredIntervals,
  originalSourceParameterGaps:union.positiveLengthUncoveredIntervals,
  disjointExactCompleteOriginalSourceGeneratedEdgeTiling:
   ordered.length>0&&overlaps.length===0&&
   union.entireOriginalParameterIntervalCovered===true,
  fullGeneratedOCCTToOriginalTopoDSHistoryCertified:false,
  officialGBLineStyleSigned:false,signedV5Action:false
 });
}
function reviewC1NativeHiddenFinalM5Strokes({
 geometry,revision,gapProof,dualProof,endpointFans,
 nativeVertexProof,projectedEncounters,globalM5Review,nativeHLRJunctionConcordance,
 nativeSourceAudit,cad
}={}){
 if(!geometry?.data?.points||!Number.isSafeInteger(revision)||revision<1||
    nativeSourceAudit?.schema!==
     'draftai-c1-ocjs-real-hidden-sharp-m5-original-source-audit/1'||
    nativeSourceAudit.sourceGeometryId!==geometry.id||
    nativeSourceAudit.revision!==revision||
    !Array.isArray(nativeSourceAudit.rows)||
    nativeSourceAudit.counts?.sourceViewIntervalsChecked!==
     nativeSourceAudit.rows.length||
    nativeSourceAudit.signedV5ActionCount!==0||
    nativeSourceAudit.nativeHLRVertexConcordance!==nativeHLRJunctionConcordance||
    nativeSourceAudit.nativeHidden3DEndpointFans!==endpointFans||
    nativeSourceAudit.nativeHiddenOriginalVertexEndpointProof!==nativeVertexProof||
    nativeSourceAudit.nativeHLRAllM4ProjectedEncounters!==projectedEncounters||
    nativeSourceAudit.nativeHiddenDualOpenIntervalProof!==dualProof||
    nativeSourceAudit.nativeHiddenExactOriginalFrontGap!==gapProof||
    nativeSourceAudit.nativeHiddenFrontVisibleMask?.signedV5ActionCount!==0||
    nativeSourceAudit.nativeHiddenExactModelFrontMask?.signedV5ActionCount!==0||
    nativeSourceAudit.nativeHiddenFrontVisibleMask?.sourceGeometryId!==geometry.id||
    nativeSourceAudit.nativeHiddenExactModelFrontMask?.sourceGeometryId!==geometry.id||
    nativeSourceAudit.nativeHiddenFrontVisibleMask?.revision!==revision||
    nativeSourceAudit.nativeHiddenExactModelFrontMask?.revision!==revision||
    gapProof?.sourceGeometryId!==geometry.id||gapProof.revision!==revision||
    gapProof.signedV5ActionCount!==0||
    gapProof.actualNativeGeneratedHLRPaperCoverageAndOriginalModelProofNotConflated!==true||
    dualProof?.sourceGeometryId!==geometry.id||dualProof.revision!==revision||
    dualProof.signedV5ActionCount!==0||
    endpointFans?.sourceGeometryId!==geometry.id||
    endpointFans.revision!==revision||
    endpointFans.nativeGeneratedTopoDSEdgeEndpointIdentityProven!==false||
    endpointFans.signedV5ActionCount!==0||
    nativeVertexProof?.sourceGeometryId!==geometry.id||
    nativeVertexProof.revision!==revision||
    nativeVertexProof.M4SourceCutGapsStillReportedIndependently!==true||
    nativeVertexProof.allGlobalOCCTHLREdgeJoinsVerified!==false||
    nativeVertexProof.signedV5ActionCount!==0||
    projectedEncounters?.sourceGeometryId!==geometry.id||
    projectedEncounters.revision!==revision||
    projectedEncounters.entireReviewedNativeHiddenSourceM4EventLedgerAudited!==true||
    projectedEncounters.signedV5ActionCount!==0||
    projectedEncounters.wholeSceneProjectedJunctionAndOcclusionCertified!==false||
    !Array.isArray(projectedEncounters.rows)||
    nativeHLRJunctionConcordance?.schema!==
     'draftai-c1-ocjs-native-generated-topods-original-3d-vertex-concordance/1'||
    nativeHLRJunctionConcordance.sourceGeometryId!==geometry.id||
    nativeHLRJunctionConcordance.revision!==revision||
    nativeHLRJunctionConcordance.signedV5ActionCount!==0||
    nativeHLRJunctionConcordance.actualGeneratedHLREdgeToOriginalTopoDSEdgeHistoryComplete!==false||
    nativeHLRJunctionConcordance.allPerViewActualNativeGeneratedJunctionComponentsConsumed!==true||
    !Array.isArray(nativeHLRJunctionConcordance.completeGenuineNativeHLRJunctionStars)||
    globalM5Review?.sourceGeometryId!==geometry.id||
    globalM5Review.revision!==revision||
    globalM5Review.schema!=='draftai-c1-m5-final-source-obligation-review/1'||
    globalM5Review.signedV5ActionCount!==0||
    globalM5Review.fullyCertifiedCount!==0||
    !Array.isArray(globalM5Review.rows)||!Array.isArray(gapProof.rows)||
    !Array.isArray(dualProof.rows)||!Array.isArray(endpointFans.rows)||
    gapProof.rows.length!==dualProof.rows.length||
    gapProof.rows.length!==endpointFans.rows.length||
    !Array.isArray(nativeVertexProof.rows)||
    gapProof.rows.length!==nativeVertexProof.rows.length||
    gapProof.rows.length!==projectedEncounters.rows.length)
  throw new TypeError('current original M5 global unsigned review and real native HLR M0/endpoint proof required');
 const byKey=new Map();
 for(const row of globalM5Review.rows){
  if(!VIEWS.includes(row.view)||typeof row.sourceEdgeId!=='string'||
     row.formalLineStyle!=='undetermined'||
     row.constructionIntentAuthorized!==false||row.signedV5Action!==false||
     !row.independentGlobalProofGaps||
     requiredGlobal.some(k=>typeof row.independentGlobalProofGaps[k]!=='boolean')||
     row.independentGlobalProofGaps.engineeringLineStandard!==true||
     row.independentGlobalProofGaps.soleConstructionIntentDAGV5!==true)
   throw new RangeError('prematurely signed or untrusted canonical M5 stroke review');
  const interval=row.originalSourceParameterRange;
  if(!Array.isArray(interval)||interval.length!==2||
     !interval.every(Number.isFinite)||interval[0]<0||
     interval[1]>1||interval[0]>=interval[1])
   throw new RangeError('canonical original M5 source interval is not a finite positive partition');
  const key=row.view+'@'+row.sourceEdgeId;
  if(!byKey.has(key))byKey.set(key,[]);
  byKey.get(key).push(row);
 }
 // A single real OCCT run must deliver all six proof branches on the SAME
 // 3D source/view identity. Never infer this from independent success flags.
 // The per-source proof is issued upstream by native OCCT. Before this
 // FINAL M5 consumer accepts even its local source-ready state, rebuild
 // exact binary64 coverage from its actual positive intervals. A stale
 // full/empty-gap flag or a forged unique source subset is not a proof.
 const intervalsMatch=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const recheck=proof=>{
  if(!proof||!Array.isArray(proof.originalParameterRange)||
     proof.originalParameterRange.length!==2||
     proof.originalParameterRange[0]!==0||
     proof.originalParameterRange[1]!==1||
     !Array.isArray(proof.positiveLengthCoveredIntervals)||
     !Array.isArray(proof.positiveLengthUncoveredIntervals))
   throw new RangeError('missing exact same-run M4/M5/native HLR source interval ledger');
  const checked=exactCandidateIntervalCoverage([0,1],
   proof.positiveLengthCoveredIntervals);
  if(!intervalsMatch(checked.positiveLengthCoveredIntervals,
      proof.positiveLengthCoveredIntervals)||
     !intervalsMatch(checked.positiveLengthUncoveredIntervals,
      proof.positiveLengthUncoveredIntervals)||
     checked.entireOriginalParameterIntervalCovered!==
      proof.entireOriginalParameterIntervalCovered)
   throw new RangeError('contradictory exact native M4/M5 source parameter intervals');
  return checked;
 };
 const jointSourceByKey=new Map();
 for(const row of nativeSourceAudit.rows){
  const joint=row.canonicalM4M5NativeHLRJointSourceIntervalEvidence;
  const key=row.view+'@'+row.sourceEdgeId;
  const checkedM4=recheck(joint?.canonicalM4ParameterCoverage),
   checkedPaper=recheck(joint?.genuineNativeHiddenHLRCandidateParameterCoverage),
   checkedUnique=recheck(joint?.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage);
  // Each physical identity interval MUST be included in genuine real-HLR
  // projected source candidate evidence; unique M5 pruning can only
  // remove alternatives, never invent paper coverage.
  for(const interval of checkedUnique.positiveLengthCoveredIntervals)
   if(!exactCandidateIntervalCoverage(interval,
     checkedPaper.positiveLengthCoveredIntervals).entireOriginalParameterIntervalCovered)
    throw new RangeError('unique original 3D source proof exceeds actual native HLR paper coverage');
  if(joint.originalM4Full3DSourceIntervalProven===true&&
      !checkedM4.entireOriginalParameterIntervalCovered||
     joint.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage!==
      checkedPaper.entireOriginalParameterIntervalCovered||
     joint.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage!==
      checkedUnique.entireOriginalParameterIntervalCovered)
   throw new RangeError('native OCCT physical-source full-coverage flags contradict independent exact intervals');
  if(!VIEWS.includes(row.view)||typeof row.sourceEdgeId!=='string'||
     row.sourceGeometryId!==geometry.id||row.revision!==revision||
     row.signedV5Action!==false||row.officialEngineeringStyle!=='undetermined'||
     !joint||joint.view!==row.view||
     joint.sourceEdgeId!==row.sourceEdgeId||
     joint.canonicalM4Original3DAndM5RayCutUnionRecomputed!==true||
     joint.engineeringLineStyle!=='undetermined'||
     joint.constructionIntentAuthorized!==false||
     joint.signedV5Action!==false||
     joint.allActualGeneratedTopoDSSourceHistoryAndSceneOcclusionProven!==false||
     joint.full3DEndpointAndEngineeringLineStyleProven!==false||
     !joint.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage||
     joint.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage!==
      joint.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage.
       entireOriginalParameterIntervalCovered||
     (joint.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage===true&&
      joint.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage!==true)||
     joint.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete!==(
      joint.originalM4Full3DSourceIntervalProven===true&&
      joint.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage===true)||
     jointSourceByKey.has(key))
   throw new RangeError('stale, duplicate or forged M4/M5/native OCCT 3D source-view join');
  jointSourceByKey.set(key,joint);
 }
 // Only an actual reviewed M0 mesh carries the complete V/H/W edge
 // universe. Focused unit fixtures deliberately supply partial source
 // graphs to test independently held crossings and junctions.
 if(geometry.kind==='mesh'&&geometry.space==='model-3d'&&
    geometry.unit==='mm'&&Array.isArray(geometry.data.edges)&&
    (jointSourceByKey.size!==geometry.data.edges.length*VIEWS.length||
     geometry.data.edges.some(ids=>VIEWS.some(view=>
      !jointSourceByKey.has(view+'@'+geometry.id+'::'+[...ids].sort().join('|'))))))
  throw new RangeError('C1 native HLR/M4/M5 incomplete original source-view universe');
 const sourcePartitionCoverage=new Map();
 for(const [key,sourceRows] of byKey){
  const ordered=[...sourceRows].sort((a,b)=>
   a.originalSourceParameterRange[0]-b.originalSourceParameterRange[0]);
  const gaps=[];
  let cursor=0;
  for(const row of ordered){
   const [begin,end]=row.originalSourceParameterRange;
   if(begin<cursor)throw new RangeError('overlapping canonical original M5 source intervals');
   if(begin>cursor)gaps.push([cursor,begin]);
   cursor=end;
  }
  if(cursor<1)gaps.push([cursor,1]);
  sourcePartitionCoverage.set(key,frozen({complete:gaps.length===0,gaps}));
 }
 // Reconcile every original M0 physical edge across all first-angle views.
 // A perfect local native hidden interval cannot certify a scene with an
 // omitted physical edge/view. This is source COVERAGE only, not visibility.
 const originalEdges=geometry.data.edges;
 let canonicalOriginalM5SourceInventory;
 if(!Array.isArray(originalEdges)){
  canonicalOriginalM5SourceInventory=frozen({
   originalM0EdgeInventoryAvailable:false,
   expectedOriginalSourceViewCount:null,
   completeOriginalSourceViewCount:0,
   missingOriginalSourceViews:[],
   incompleteOriginalSourceViewPartitions:[],
   missingOriginalSourceViewProjectionEvidence:[],
   incompleteOriginalSourceViewProjectionEvidence:[],
   allOriginalSourceViewsHaveCompleteParameterPartitions:false,
   signedV5Action:false
  });
 }else{
  const expected=new Set(),projectedBySourceView=new Map();
  for(const edge of originalEdges){
   if(!Array.isArray(edge)||edge.length!==2||
      !edge.every(v=>typeof v==='string'&&
       Object.prototype.hasOwnProperty.call(geometry.data.points,v))||
      edge[0]===edge[1])
    throw new RangeError('invalid original M0 physical edge inventory');
   const sourceId=geometry.id+'::'+[...edge].sort().join('|');
   // Reuse the single authoritative first-angle projection kernel.
   // Classify actual M0 endpoints; do not infer degeneracy from a missing
   // HLR line or forgive even one binary64 ULP of missing M5 coverage.
   const from=project(geometry.data.points[edge[0]]);
   const to=project(geometry.data.points[edge[1]]);
   for(const view of VIEWS){
    const key=view+'@'+sourceId;
    if(expected.has(key))
     throw new RangeError('duplicate original M0 physical edge in source inventory');
    expected.add(key);
    projectedBySourceView.set(key,frozen({
     sourceViewKey:key,original3DEndpointIds:[...edge],
     projectedFrom:from[view],projectedTo:to[view],
     projectionCollapsedExactly:from[view].u===to[view].u&&
      from[view].v===to[view].v,
     completeM5ParameterCoverageCertified:false,
     signedV5Action:false
    }));
   }
  }
  if([...byKey.keys()].some(key=>!expected.has(key)))
   throw new RangeError('canonical M5 source ledger references unknown original M0 edge/view');
  const missing=[...expected].filter(key=>!byKey.has(key));
  const incomplete=[...expected].filter(key=>
   byKey.has(key)&&sourcePartitionCoverage.get(key)?.complete!==true);
  canonicalOriginalM5SourceInventory=frozen({
   originalM0EdgeInventoryAvailable:true,
   expectedOriginalSourceViewCount:expected.size,
   completeOriginalSourceViewCount:expected.size-missing.length-incomplete.length,
   missingOriginalSourceViews:missing,
   missingOriginalSourceViewProjectionEvidence:missing.map(key=>
    projectedBySourceView.get(key)),
   incompleteOriginalSourceViewProjectionEvidence:incomplete.map(key=>
    projectedBySourceView.get(key)),
   incompleteOriginalSourceViewPartitions:incomplete.map(key=>({
    sourceViewKey:key,
    positiveLengthParameterGaps:sourcePartitionCoverage.get(key).gaps
   })),
   allOriginalSourceViewsHaveCompleteParameterPartitions:
    expected.size>0&&missing.length===0&&incomplete.length===0,
   signedV5Action:false
  });
 }
 // Reconcile the real original, pre-HLR OCCT TopoDS BRep 3D inventory
 // against EVERY independently modeled M0 physical edge before claiming any
 // global original-source provenance. HLR-created TopoDS edges are different
 // entities: even a complete original BRep inventory does not establish
 // generated-to-original shape history, whole-scene visibility or GB/V5.
 // No CAD input is UNAVAILABLE (not an empty vacuously successful proof).
 let originalOCCTBRepSourceInventory=frozen({
  available:false,completeOriginal3DSourceCorrespondence:false,
  matchedOriginalPhysicalSourceEdges:0,
  expectedOriginalPhysicalSourceEdges:Array.isArray(originalEdges)?
   originalEdges.length:null,
  generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
  original3DSourceFanAndGlobalOcclusionCertified:false,
  signedV5Action:false
 });
 if(cad!==undefined){
  if(!Array.isArray(originalEdges)||originalEdges.length===0||
     cad?.sourceGeometryId!==geometry.id||cad.revision!==revision||
     cad.hiddenHLROutputFromActualOCCT!==true||
     cad.completeSourceTopology3DEndpointCorrespondence!==true||
     cad.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
     cad.v5Authorized!==false||
     !Array.isArray(cad.originalBRepSourceEdges))
   throw new TypeError('current real OCCT original BRep source inventory required');
  const originalById=new Map(originalEdges.map(edge=>[
   geometry.id+'::'+[...edge].sort().join('|'),edge
  ]));
  if(originalById.size!==originalEdges.length)
   throw new RangeError('duplicate original M0 source in real OCCT BRep inventory');
  const seen=new Set();
  const finite3=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
  const near=(p,q)=>['x','y','z'].every(k=>
   Math.abs(p[k]-q[k])<=1e-6);
  for(const original of cad.originalBRepSourceEdges){
   const edge=originalById.get(original?.sourceEdgeId);
   if(!edge||seen.has(original.sourceEdgeId)||
      !Array.isArray(original.originalVertexIds)||
      original.originalVertexIds.length!==2||
      [...original.originalVertexIds].sort().join('|')!==
       [...edge].sort().join('|')||
      !finite3(original.fromOCCT3D)||!finite3(original.toOCCT3D)||
      original.originalOCCTBRepVertexXYZMatched!==true||
      original.occtCurveTypeIndependentlyVerified!==true||
      original.occtSourceCurveType!=='line'||
      original.occtSourceCurve3DEndpointsAndMidpointVerified!==true||
      original.generatedHLREdgeTopoDSIdentityMatched!==false||
      original.v5Authorized!==false||
      !Array.isArray(original.occtSourceCurveParameterRange)||
      original.occtSourceCurveParameterRange.length!==2||
      !original.occtSourceCurveParameterRange.every(Number.isFinite)||
      !(original.occtSourceCurveParameterRange[1]>
        original.occtSourceCurveParameterRange[0]))
    throw new RangeError('untrusted real OCCT original BRep source geometry and identity');
   const a=geometry.data.points[edge[0]],b=geometry.data.points[edge[1]];
   if(!finite3(a)||!finite3(b))
    throw new RangeError('nonfinite original M0 source XYZ cannot match real OCCT');
   const forward=near(original.fromOCCT3D,a)&&near(original.toOCCT3D,b),
    reverse=near(original.fromOCCT3D,b)&&near(original.toOCCT3D,a);
   if(!forward&&!reverse||
      original.occtEdgeOrientation!==(forward?'forward':'reverse'))
    throw new RangeError('real OCCT original BRep endpoints disagree with M0 XYZ');
   const length=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),
    span=original.occtSourceCurveParameterRange[1]-
     original.occtSourceCurveParameterRange[0];
   // The native adaptor is a Geom_Line with unit-speed 3D parameter.
   // A wrong parametric span would corrupt later [0,1] native source cuts
   // even if the two sampled end-points happen to match.
   if(!(length>1e-8)||Math.abs(span-length)>
       1e-6*Math.max(1,length))
    throw new RangeError('real original OCCT 3D line parameter span disagrees with M0 physical length');
   seen.add(original.sourceEdgeId);
  }
  if(seen.size!==originalById.size)
   throw new RangeError('real OCCT original BRep inventory is missing modeled M0 source edges');
  originalOCCTBRepSourceInventory=frozen({
   available:true,completeOriginal3DSourceCorrespondence:true,
   matchedOriginalPhysicalSourceEdges:seen.size,
   expectedOriginalPhysicalSourceEdges:originalById.size,
   generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
   original3DSourceFanAndGlobalOcclusionCertified:false,
   signedV5Action:false
  });
 }
 // All REAL OCCT visible VCompound and hidden HCompound physical-source
 // parameter intervals now meet in ONE V/H/W original M0 3D source graph.
 // Accepted visible intervals already require a measured original OCCT
 // 3D source lift AND an independently CLOSED M5 outward front ray.
 // Hidden intervals already require unique M5 physical-source pruning.
 // Neither branch can invent a gap-free line from a paper-only alias.
 const realNativeVisibleHiddenOriginalSourceViewCoverage=[];
 let realNativeVisibleHiddenSourceViewGraphAvailable=false;
 const claimedVisible=nativeHLRJunctionConcordance.acceptedNativeVisibleSourceCoverage;
 if(cad!==undefined&&Array.isArray(originalEdges)&&
    Array.isArray(claimedVisible)){
  const expectedIds=new Map(originalEdges.map(edge=>[
   geometry.id+'::'+[...edge].sort().join('|'),edge
  ]));
  const seen=new Map();
  for(const row of claimedVisible){
   if(!VIEWS.includes(row.view)||!expectedIds.has(row.sourceEdgeId)||
      row.independentlyAcceptedNativeVisibleHLRLiftsOnly!==true||
      row.completeGeneratedToOriginalTopoDSEdgeHistoryCertified!==false||
      row.wholeSceneOcclusionAndEngineeringLineStyleCertified!==false||
      row.signedV5Action!==false)
    throw new RangeError('untrusted actual native visible original 3D M5 source-view coverage');
   const key=row.view+'@'+row.sourceEdgeId;
   if(seen.has(key))throw new RangeError('duplicate native visible source-view proof');
   // Never trust all-true full-coverage or missing-gap flags from a
   // source-graph fragment: independently union its actual binary64 spans.
   seen.set(key,recheck(row));
  }
  if(seen.size!==expectedIds.size*VIEWS.length||
     [...expectedIds.keys()].some(id=>VIEWS.some(view=>
      !seen.has(view+'@'+id))))
   throw new RangeError('native visible HLR source inventory omits original M0 edge/view');
  for(const [sourceEdgeId,edge] of [...expectedIds].sort((a,b)=>a[0].localeCompare(b[0]))){
   for(const view of VIEWS){
    const key=view+'@'+sourceEdgeId,
     visible=seen.get(key),
     hiddenSource=jointSourceByKey.get(key),
     hidden=hiddenSource?
      recheck(hiddenSource.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage):
      exactCandidateIntervalCoverage([0,1],[]);
    const union=exactCandidateIntervalCoverage([0,1],[
     ...visible.positiveLengthCoveredIntervals,
     ...hidden.positiveLengthCoveredIntervals
    ]);
    const overlap=[];
    for(const [a,b] of visible.positiveLengthCoveredIntervals)
     for(const [c,d] of hidden.positiveLengthCoveredIntervals){
      const lo=Math.max(a,c),hi=Math.min(b,d);
      if(hi>lo)overlap.push([lo,hi]);
     }
    const first=project(geometry.data.points[edge[0]])[view],
     last=project(geometry.data.points[edge[1]])[view],
     collapsed=first.u===last.u&&first.v===last.v;
    const originalPartitionComplete=
     sourcePartitionCoverage.get(key)?.complete===true;
    const positiveLineSourceCoverage=
     originalOCCTBRepSourceInventory.completeOriginal3DSourceCorrespondence===true&&
     originalPartitionComplete&&!collapsed&&
     union.entireOriginalParameterIntervalCovered===true&&
     overlap.length===0;
    realNativeVisibleHiddenOriginalSourceViewCoverage.push({
     sourceViewKey:key,view,originalPhysical3DSourceEdgeId:sourceEdgeId,
     projectionCollapsedExactly:collapsed,
     originalRealOCCTBRep3DSourceInventoryVerified:
      originalOCCTBRepSourceInventory.completeOriginal3DSourceCorrespondence===true,
     originalM4M5SourceParameterPartitionComplete:originalPartitionComplete,
     visibleNativeOCCTMeasuredM5FullFrontSourceIntervals:
      visible.positiveLengthCoveredIntervals,
     hiddenNativeOCCTUniqueM5PhysicalSourceIntervals:
      hidden.positiveLengthCoveredIntervals,
     positiveLengthVisibleHiddenOriginalSourceOverlap:overlap,
     physicallyAccountedOriginalSourceParameterCoverage:
      union.positiveLengthCoveredIntervals,
     outstandingOriginalSourceParameterGaps:
      union.positiveLengthUncoveredIntervals,
     originalSourceParameterLineCoverageNecessarilyComplete:
      positiveLineSourceCoverage,
     everyActualOpaqueFaceAndGeneratedTopoDSHistoryProven:false,
     wholeSceneGBLineStyleCertified:false,
     constructionIntentAuthorized:false,signedV5Action:false
    });
   }
  }
  realNativeVisibleHiddenSourceViewGraphAvailable=true;
 }
 const realNativeVisibleHiddenSourceGraph=frozen({
  available:realNativeVisibleHiddenSourceViewGraphAvailable,
  originalM0SourceViewCountExpected:
   Array.isArray(originalEdges)?originalEdges.length*VIEWS.length:null,
  auditedOriginalSourceViews:
   realNativeVisibleHiddenOriginalSourceViewCoverage.length,
  genuineNoncollapsedSourceViewsWithNecessaryM5VisibleOrHiddenCoverage:
   realNativeVisibleHiddenOriginalSourceViewCoverage.filter(x=>
    x.originalSourceParameterLineCoverageNecessarilyComplete).length,
  collapsedOriginalSourceViewsHeldAsPaperPoints:
   realNativeVisibleHiddenOriginalSourceViewCoverage.filter(x=>
    x.projectionCollapsedExactly).length,
  sourceViewsWithNonzeroPositiveVisibilityGaps:
   realNativeVisibleHiddenOriginalSourceViewCoverage.filter(x=>
    !x.projectionCollapsedExactly&&
    x.outstandingOriginalSourceParameterGaps.length>0).length,
  sourceViewsWithVisibleAndHiddenPhysicalAttributionCollision:
   realNativeVisibleHiddenOriginalSourceViewCoverage.filter(x=>
    x.positiveLengthVisibleHiddenOriginalSourceOverlap.length>0).length,
  completeNecessaryRealVHWSourceAttribution:
   realNativeVisibleHiddenSourceViewGraphAvailable&&
   realNativeVisibleHiddenOriginalSourceViewCoverage.length>0&&
   realNativeVisibleHiddenOriginalSourceViewCoverage.every(x=>
    x.projectionCollapsedExactly||
    x.originalSourceParameterLineCoverageNecessarilyComplete),
  rows:realNativeVisibleHiddenOriginalSourceViewCoverage,
  allOpaqueFaceContinuousVisibilityAndGlobalJunctionsCertified:false,
  fullHLRGeneratedTopoDSHistoryCertified:false,
  officialEngineeringLineStylesCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
 // Recompute every reviewed C1 M4 physical source subspan against
 // ALL faces of the one independently verified CLOSED CONVEX original
 // solid; compare the true continuous single-solid ray status with the
 // actual native OCCT VCompound+HCompound source-attributed coverage.
 // A source crossing a projection-only event does not manufacture an M0
 // vertex, and an unsigned contour M5 status is NEVER a solid/dashed line.
 // No request-provided face-ray certificate enters this final consumer.
 // Reconsume EVERY actual OCCT VCompound edge as a separate generated
 // fragment; interval UNION erases duplicate native edges and cannot by
 // itself establish a unique source/view stroke topology.
 const nativeVisibleFragments=new Map();
 let unmatchedNativeVisibleFragments=0,actualNativeVisibleFragments=0;
 const nativeVisibleRawAvailable=realNativeVisibleHiddenSourceViewGraphAvailable&&
  VIEWS.every(v=>Array.isArray(cad?.views?.[v]));
 if(nativeVisibleRawAvailable){
  const originals=new Map(originalEdges.map(edge=>[
   geometry.id+'::'+[...edge].sort().join('|'),edge]));
  const eq3=(a,b)=>!!a&&!!b&&['x','y','z'].every(k=>
   Number.isFinite(a[k])&&Number.isFinite(b[k])&&a[k]===b[k]);
  const eq2=(a,b)=>!!a&&!!b&&a.u===b.u&&a.v===b.v;
  for(const view of VIEWS)for(const edge of cad.views[view]){
   actualNativeVisibleFragments++;
   if(edge?.occtHLRVisibilityClass!=='visible-sharp'||
      edge.actualOCCTHLRFlattenedBRepLineVerified!==true||
      edge.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared!==true||
      edge.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false)
    throw new RangeError('not genuine OCCT VCompound native source evidence');
   const lifts=edge.sourceCandidate3DLifts;
   if(!Array.isArray(lifts)||lifts.length!==1){
    unmatchedNativeVisibleFragments++;continue;
   }
   const lift=lifts[0],ends=originals.get(lift.sourceEdgeId),
    range=lift.originalSourceParameterRange,
    a=ends&&geometry.data.points[ends[0]],
    b=ends&&geometry.data.points[ends[1]],
    t0=lift.sourceParameterAtProjectedFrom,
    t1=lift.sourceParameterAtProjectedTo;
   if(!ends||!Array.isArray(range)||range.length!==2||
      ![t0,t1].every(t=>Number.isFinite(t)&&t>=0&&t<=1)||
      range[0]!==Math.min(t0,t1)||
      range[1]!==Math.max(t0,t1)||range[0]>=range[1]||
      lift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
      lift.originalOCCTSourceLineCurveVerified!==true||
      lift.originalXYZReprojectsToHLR!==true||
      lift.v5Authorized!==false||
      lift.originalVertexIds?.join('|')!==ends.join('|'))
    throw new RangeError('actual native visible edge has untrusted original 3D source');
   const p=t=>({x:a.x+(b.x-a.x)*t,
    y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
   const actual=(eq3(lift.actualOriginalOCCTBRepFrom3D,a)&&
     eq3(lift.actualOriginalOCCTBRepTo3D,b))||
     (eq3(lift.actualOriginalOCCTBRepFrom3D,b)&&
      eq3(lift.actualOriginalOCCTBRepTo3D,a));
   if(!actual||!eq3(lift.fromCandidate3D,p(t0))||
      !eq3(lift.toCandidate3D,p(t1))||
      !eq2(project(p(t0))[view],edge.from)||
      !eq2(project(p(t1))[view],edge.to)){
    unmatchedNativeVisibleFragments++;continue;
   }
   const direct=edge.directlySameUniqueOriginalOCCTBRepSourceEdgeId;
   if(direct!==null&&direct!==lift.sourceEdgeId)
    throw new RangeError('actual native IsSame contradicts OCCT original edge');
   const key=view+'@'+lift.sourceEdgeId;
   if(!nativeVisibleFragments.has(key))nativeVisibleFragments.set(key,[]);
   nativeVisibleFragments.get(key).push([...range]);
  }
 }
 const nativeVisibleTilingRows=[];
 if(nativeVisibleRawAvailable){
  for(const viewRow of realNativeVisibleHiddenOriginalSourceViewCoverage){
   const tiling=certifyExactNativeGeneratedSourceTiling({
    sourceViewKey:viewRow.sourceViewKey,
    intervals:nativeVisibleFragments.get(viewRow.sourceViewKey)??[]
   });
   // If some generated edges are unresolved, keep a diagnostic only.
   // All accepted true-source intervals must come from this genuine
   // raw HLR population, never a source-view summary in isolation.
   if(unmatchedNativeVisibleFragments===0&&
      !intervalsMatch(tiling.actualNativeOriginalSourceUnion,
       viewRow.visibleNativeOCCTMeasuredM5FullFrontSourceIntervals))
    throw new RangeError('native generated VCompound source fragments contradict M5 accepted union');
   nativeVisibleTilingRows.push(tiling);
  }
 }
 const nativeVisibleHLRSourceTiling=frozen({
  available:nativeVisibleRawAvailable&&unmatchedNativeVisibleFragments===0,
  trueGeneratedOCCTVisibleSegmentsInspected:actualNativeVisibleFragments,
  unverifiedGeneratedOCCTVisibleSegments:unmatchedNativeVisibleFragments,
  sourceViewsAudited:nativeVisibleTilingRows.length,
  originalSourceViewsWithDuplicateGeneratedHLRIntervals:
   nativeVisibleTilingRows.filter(x=>
    x.positiveSameOriginal3DSourceGeneratedEdgeOverlaps.length>0).length,
  originalSourceViewsCompletelyCoveredWithoutGeneratedDuplication:
   nativeVisibleTilingRows.filter(x=>
    x.disjointExactCompleteOriginalSourceGeneratedEdgeTiling).length,
  rows:nativeVisibleTilingRows,
  allGeneratedEdgeToOriginalTopoDSHistoryCertified:false,
  allOpaqueSceneAndOfficialGBLineStylesCertified:false,
  signedV5ActionCount:0
 });
 const nativeSourceFaceRaySubspans=[];
 let nativeSourceWholeOpaqueFaceRayReconciliationAvailable=false;
 if(realNativeVisibleHiddenSourceViewGraphAvailable&&
    geometry.kind==='mesh'&&geometry.space==='model-3d'&&
    geometry.unit==='mm'){
  const actualSingleSolidRay=auditC1SingleConvexSourceSubspanRays({
   geometry,revision
  });
  if(actualSingleSolidRay.sourceGeometryId!==geometry.id||
     actualSingleSolidRay.revision!==revision||
     actualSingleSolidRay.signedV5ActionCount!==0||
     actualSingleSolidRay.onlyOneReviewedConvexOpaqueSolidChecked!==true||
     actualSingleSolidRay.sourceSubspanCount!==actualSingleSolidRay.subspans.length||
     actualSingleSolidRay.sourceEventCount<0)
   throw new RangeError('current unsigned all-original-face C1 ray review missing');
  const nativeBySourceView=new Map(
   realNativeVisibleHiddenOriginalSourceViewCoverage.map(row=>
    [row.sourceViewKey,row]));
  for(const subspan of actualSingleSolidRay.subspans){
   const key=subspan.view+'@'+subspan.sourceEdgeId,
    native=nativeBySourceView.get(key),range=subspan.originalParameterRange;
   if(!native||subspan.sourceGeometryId!==geometry.id||
      subspan.revision!==revision||
      subspan.engineeringLineStyleAuthorized!==false||
      subspan.signedLineStyle!=='undetermined'||
      subspan.signedV5Action!==false||
      !Array.isArray(range)||range.length!==2||
      !range.every(Number.isFinite)||range[0]<0||range[1]>1||
      !(range[0]<range[1]))
    throw new RangeError('all-face original source M4 segment cannot join real native HLR');
   const clip=(intervals)=>intervals.map(([a,b])=>[
    Math.max(a,range[0]),Math.min(b,range[1])
   ]).filter(([a,b])=>b>a);
   const visible=exactCandidateIntervalCoverage(range,
    clip(native.visibleNativeOCCTMeasuredM5FullFrontSourceIntervals)),
    hidden=exactCandidateIntervalCoverage(range,
     clip(native.hiddenNativeOCCTUniqueM5PhysicalSourceIntervals)),
    combined=exactCandidateIntervalCoverage(range,[
     ...visible.positiveLengthCoveredIntervals,
     ...hidden.positiveLengthCoveredIntervals
    ]);
   const rayClear=subspan.status==='single-opaque-solid-whole-open-ray-clear',
    rayInside=subspan.status==='single-opaque-solid-whole-open-ray-strictly-hidden',
    rayContour=subspan.status==='exterior-contour-held-by-original-m5',
    rayUndetermined=subspan.status==='undetermined';
   if(Number(rayClear)+Number(rayInside)+Number(rayContour)+
      Number(rayUndetermined)!==1)
    throw new RangeError('unsupported original all-opaque-face ray status');
   const positiveOverlap=(left,right)=>left.some(([a,b])=>
    right.some(([c,d])=>Math.min(b,d)>Math.max(a,c)));
   const clearVsNativeContradiction=rayClear&&positiveOverlap(
    hidden.positiveLengthCoveredIntervals,[[...range]]);
   const hiddenVsNativeContradiction=rayInside&&positiveOverlap(
    visible.positiveLengthCoveredIntervals,[[...range]]);
   const fullyAligned=(rayClear&&visible.entireOriginalParameterIntervalCovered&&
    !clearVsNativeContradiction)||
    (rayInside&&hidden.entireOriginalParameterIntervalCovered&&
     !hiddenVsNativeContradiction);
   nativeSourceFaceRaySubspans.push({
    sourceViewKey:key,sourceEdgeId:subspan.sourceEdgeId,view:subspan.view,
    originalSourceParameterRange:[...range],
    currentWholeReviewedConvexSolidFaceRayStatus:subspan.status,
    originalM4ExteriorContourStillOwnsLineStyle:rayContour,
    originalRayStillMathematicallyUndetermined:rayUndetermined,
    nativeVisibleSourceCoveredIntervals:
     visible.positiveLengthCoveredIntervals,
    nativeHiddenSourceCoveredIntervals:
     hidden.positiveLengthCoveredIntervals,
    nativeCombinedSourceUncoveredIntervals:
     combined.positiveLengthUncoveredIntervals,
    singleSolidRayAndTrueOCCTNativeOriginalSourceProvenCompatible:
     fullyAligned,
    positiveOriginalFaceRayVsRealNativeHLROcclusionContradiction:
     clearVsNativeContradiction||hiddenVsNativeContradiction,
    allSeparateOpaqueSceneBodiesAndGeneratedEdgeHistoryCertified:false,
    completeProjectedJunctionAndGBLineStyleCertified:false,
    constructionIntentAuthorized:false,signedV5Action:false
   });
  }
  if(nativeSourceFaceRaySubspans.length!==
     actualSingleSolidRay.sourceSubspanCount)
   throw new RangeError('some original M4 all-opaque-face source subspans omitted');
  nativeSourceWholeOpaqueFaceRayReconciliationAvailable=true;
 }
 const nativeVHWFaceRayAndHLRReconciliation=frozen({
  available:nativeSourceWholeOpaqueFaceRayReconciliationAvailable,
  scope:'single-independent-current-closed-convex-solid-all-original-faces',
  sourceRaySubspansAudited:nativeSourceFaceRaySubspans.length,
  singleSolidFaceRaysAndActualHLRPhysicalSourceIntervalsPositivelyCompatible:
   nativeSourceFaceRaySubspans.filter(x=>
    x.singleSolidRayAndTrueOCCTNativeOriginalSourceProvenCompatible).length,
  original3DSourceSubspansWithNativeVisibilityContradiction:
   nativeSourceFaceRaySubspans.filter(x=>
    x.positiveOriginalFaceRayVsRealNativeHLROcclusionContradiction).length,
  original3DSourceSubspansStillOwnedByOriginalM5ExteriorContour:
   nativeSourceFaceRaySubspans.filter(x=>
    x.originalM4ExteriorContourStillOwnsLineStyle).length,
  original3DSourceSubspansWithUnresolvedSingleSolidFaceRay:
   nativeSourceFaceRaySubspans.filter(x=>
    x.originalRayStillMathematicallyUndetermined).length,
  rows:nativeSourceFaceRaySubspans,
  otherOccludingSolidsAndGeneratedOCCTTopoDSEdgeHistoryCertified:false,
  allSceneGlobalEngineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
 const sourceViewRayParametricClosure=[];
 if(nativeSourceWholeOpaqueFaceRayReconciliationAvailable){
  const bySourceView=new Map();
  for(const ray of nativeSourceFaceRaySubspans){
   if(!bySourceView.has(ray.sourceViewKey))
    bySourceView.set(ray.sourceViewKey,[]);
   bySourceView.get(ray.sourceViewKey).push(ray);
  }
  for(const native of realNativeVisibleHiddenOriginalSourceViewCoverage){
   const spans=bySourceView.get(native.sourceViewKey)??[];
   const partition=certifyExactOriginalRaySourceParameterPartition({
    sourceViewKey:native.sourceViewKey,spans,
    projectionCollapsedExactly:native.projectionCollapsedExactly
   });
   // A genuinely 3D source can collapse to a PAPER POINT in an
   // orthographic view; it may have NO drawable M4 ray subspans.
   // Also hold any missing noncollapsed source instead of manufacturing
   // [0,1] coverage. The exact empty-set union reports the full gap.
   const originalSourcePhysicalRayClassificationFullyReconciled=
    partition.fullOriginalParameterRayPartitionCoverage&&
    partition.physicalLineDrawableInThisFirstAngleView&&
    spans.every(x=>
     x.singleSolidRayAndTrueOCCTNativeOriginalSourceProvenCompatible===true)&&
    native.originalM4M5SourceParameterPartitionComplete===true&&
    native.originalRealOCCTBRep3DSourceInventoryVerified===true&&
    (!nativeVisibleHLRSourceTiling.available||
     !nativeVisibleTilingRows.some(x=>
      x.sourceViewKey===native.sourceViewKey&&
      x.positiveSameOriginal3DSourceGeneratedEdgeOverlaps.length>0));
   sourceViewRayParametricClosure.push({
    ...partition,
    realOCCTNativeOriginalPhysicalSourceCompleteRayReconciliation:
     originalSourcePhysicalRayClassificationFullyReconciled,
    originalAllOpaqueFacesAndNativeSourceClassContradictions:
     spans.filter(x=>
      x.positiveOriginalFaceRayVsRealNativeHLROcclusionContradiction).length,
    canonicalRaySubspanStillHeldByUnsignedExteriorContour:
     spans.filter(x=>x.originalM4ExteriorContourStillOwnsLineStyle).length,
    canonicalRaySubspanMathematicallyUndetermined:
     spans.filter(x=>x.originalRayStillMathematicallyUndetermined).length,
    entireFinalGeneratedOCCTEdgeTopologyAndGBLineRulesCertified:false,
    signedV5Action:false
   });
  }
  if(sourceViewRayParametricClosure.length!==
     realNativeVisibleHiddenOriginalSourceViewCoverage.length)
   throw new RangeError('incomplete all-original-faces native C1 source/view ray ledger');
 }
 const fullSourceVHWFaceRayAndActualHLRClosure=frozen({
  available:nativeSourceWholeOpaqueFaceRayReconciliationAvailable,
  auditedOriginalPhysicalSourceViews:sourceViewRayParametricClosure.length,
  M4RayPartitionsWithExactPositiveNoOverlapFullSourceCoverage:
   sourceViewRayParametricClosure.filter(x=>
    x.fullOriginalParameterRayPartitionCoverage).length,
  noncollapsedOriginalSourceViewsFullyMatchedToActualOCCTAndAllOriginalOpaqueFaceRays:
   sourceViewRayParametricClosure.filter(x=>
    x.realOCCTNativeOriginalPhysicalSourceCompleteRayReconciliation).length,
  originalSourceViewsWithPositiveRayParameterGapsOrOverlaps:
   sourceViewRayParametricClosure.filter(x=>
    !x.fullOriginalParameterRayPartitionCoverage).length,
  originalSourceViewsWithNoOriginalM4RaySubspanEvidence:
   sourceViewRayParametricClosure.filter(x=>
    x.canonicalOriginalRayM4SpanCount===0).length,
  originalSourceViewsStillHoldingContourOrUnprovedFaceRays:
   sourceViewRayParametricClosure.filter(x=>
    x.canonicalRaySubspanStillHeldByUnsignedExteriorContour>0||
    x.canonicalRaySubspanMathematicallyUndetermined>0).length,
  rows:sourceViewRayParametricClosure,
  wholeGlobalOpaqueSceneAndGeneratedTopoDSHistoryCertified:false,
  engineeringGBLineStyleCertified:false,
  signedConstructionIntentDAGOrV5ActionCount:0
 });
 const counts={genuineHiddenHLRStrokesReviewed:0,
  jointM4M5NativeHLROriginal3DSourceViewsConsumed:jointSourceByKey.size,
  nativeHiddenStrokesWithFullM4M5AndHLRSourceCoverage:0,
  nativeHiddenStrokesWithUnprovenJointPhysicalSourceCoverage:0,
  realNativeHiddenOpenIntervalsWithIndependentlyRecomputedM5Occlusion:0,
  realNativeHiddenOpenIntervalsWithUnprovenM5Occlusion:0,
  nativeHLRLocallyCompleteSourceOcclusionAndActual3DVertexStars:0,
  wholeRealNativeHiddenPaperOpenIntervalsLocallyProven:0,
  originalM0ModelPhysicalOpenRayEvidenceWithoutCompleteRealNativeHLR:0,
  missingLocalNativeOrModelOpenProofHeld:0,
  original3DEndpointFanProofIncompleteStrokes:0,
  incompleteCanonicalOriginalSourcePartitions:0,
  missingM4OriginalVertexEndpointsIndependentNativeM0ProofRecovered:0,
  genuineOriginalPhysical3DVertexEndpointIdentityStillUnproven:0,
  originalM4PaperEncounterEventsCrosscheckedAgainstActualHLR:0,
  nativeHLRInteriorProjectedEncounterEventsNotGloballyResolved:0,
  nativeHLRUnprovenExactPaperEventAlignment:0,
  nativeM4CollinearInteriorEventsWithExactFullFrontDepthNoSwitchProof:0,
  nativeM4TransverseCrossingsWithIndependentExactM0AndNativeAnchor:0,
  originalHLRHiddenEndpointsWithGenuineNativeIsSameAndFullyVerifiedOriginal3DStar:0,
  originalHLRHiddenEndpointsAtSharedIsSameButOriginalSourceFanHeld:0,
  nativeHLRHiddenEdgesWithBothNativeIsSameEndpointStarsOriginal3DVerified:0,
  actualHiddenNativeEndpointsWithExactOriginal3DInteriorSplit:0,
  actualHiddenNativeStrokesWithBothSourceJunctionsPhysicallyVerified:0,
  actualHiddenNativeStrokesWithLocallyFullM5VisibilityAndPhysicalJunctions:0,
  originalM4ProjectedEventsWithVerifiedLocal3DSpatialDisposition:0,
  originalM4ProjectedEventsStillMissingExactLocal3DSpatialDisposition:0,
  nativeHLRSourceStrokesWithCompleteLocal3DEventClassification:0,
  nativeM4TransverseDepthAtTruePaperCrossingButM4CutNotAnchored:0,
  nativeM4InteriorCollinearEventsWithoutPositiveFullFrontNoSwitchProof:0,
  nativePaperMisalignmentWithIndependentAuthenticOriginal3DVertex:0,
  exactOriginal3DSharedVertexWithTwoAuthenticBRepSources:0,
  exactSource3DSharedVertexButNativeGeneratedPaperStillMisaligned:0,
  realGeneratedHLRToOriginalTopoDSProven:0,
  entireGlobalJunctionAndSceneTopologyCertified:0,
  officialStandardSolidOrDashedLineSigned:0,
  formalConstructionIntentDAGV5ActionsSigned:0};
 // Reuse the already-verified global OCCT genuine native vertex stars;
 // no inference from paper coincidence. A connected native generated
 // junction is locally physical only when all its HLR edges pass the
 // independent same-revision original M0/M5 complete source fan proof.
 const nativeStarByEndpoint=new Map();
 for(const star of nativeHLRJunctionConcordance.completeGenuineNativeHLRJunctionStars){
  if(!VIEWS.includes(star.view)||!Array.isArray(star.generatedHLREndpoints)||
     star.generatedHLREndpoints.length<2||
     star.genuineNativeGeneratedOCCTVertexPairwiseIsSame!==true||
     star.originalOCCTGeneratedToSourceTopoDSEdgeHistoryRecovered!==false||
     star.wholeSceneAndEngineeringGBJunctionCertified!==false||
     star.signedV5Action!==false)
   throw new RangeError('untrusted complete generated HLR TopoDS original source star');
  for(const member of star.generatedHLREndpoints){
   if(member.hlrClass!=='hidden-sharp')continue;
   const key=star.view+'@'+member.nativeHLREdgeOrdinal+'@'+member.side;
   if(!['from','to'].includes(member.side)||nativeStarByEndpoint.has(key))
    throw new RangeError('duplicate generated native HLR junction endpoint');
   nativeStarByEndpoint.set(key,star);
  }
 }
 const perViewNativeOrdinal=new Map(VIEWS.map(view=>[view,0]));
 const rows=[];
 for(let i=0;i<gapProof.rows.length;i++){
  const gap=gapProof.rows[i],dual=dualProof.rows[i],
   fans=endpointFans.rows[i],nativeVertex=nativeVertexProof.rows[i],
   m4Native=projectedEncounters.rows[i];
  if(!VIEWS.includes(gap.view)||dual.view!==gap.view||
     fans.view!==gap.view||gap.nativeHiddenSharpEdgeOrdinal!==i||
     dual.nativeHiddenSharpEdgeOrdinal!==i||
     fans.nativeHiddenSharpEdgeOrdinal!==i||
     gap.signedV5Action!==false||dual.signedV5Action!==false||
     fans.signedV5Action!==false||
     nativeVertex.nativeHiddenSharpEdgeOrdinal!==i||
     nativeVertex.view!==gap.view||nativeVertex.revision!==revision||
     nativeVertex.signedV5Action!==false||
     m4Native.sourceGeometryId!==geometry.id||
     m4Native.revision!==revision||m4Native.view!==gap.view||
     m4Native.nativeHiddenSharpEdgeOrdinal!==i||
     m4Native.allEncountersReviewedAgainstCurrentSourceInterval!==true||
     m4Native.completeGlobalProjectedJunctionAndOcclusionCertified!==false||
     m4Native.signedV5Action!==false||
     nativeVertex.OCCTGeneratedTopoDSNativeEdgeAdjacencyCertified!==false||
     gap.nativeHLRGeneratedSourceTopoDSLinksAndAllJunctionsProven!==false||
     dual.fullGBDashedLineOrVisibleLineAssignmentSigned!==false||
     fans.nativeHLREdgeJunctionsCertified!==false)
   throw new RangeError('real native HLR original source or physical 3D fan evidence drift');
  const edge=dual.originalHiddenSourceEdgeId;
  const unique=dual.remainingOriginal3DPhysicalSourceUnique===true&&
   gap.survivingOriginal3DSourceUnique===true;
  if(m4Native.uniqueOriginalPhysical3DSourceEdgeId!==
      (unique?edge:null))
   throw new RangeError('genuine HLR canonical M4 projected source changed after exact source pruning');
  const originalGlobal=unique?(byKey.get(gap.view+'@'+edge)??[]):[];
  if(unique&&(!edge||originalGlobal.length===0))
   throw new RangeError('genuine native hidden 3D source has no canonical original M5 global stroke review');
  const fanSources=fans.survivingOriginal3DEdgesWithEndpointFans;
  if(!Array.isArray(fanSources))
   throw new TypeError('missing original closed face fan and paper endpoint evidence');
  const sourceFan=fanSources.find(x=>x.originalPhysicalSourceEdgeId===edge);
  if(unique&&(!sourceFan||!Array.isArray(sourceFan.endpointWitnesses)||
     sourceFan.endpointWitnesses.length!==2))
   throw new RangeError('original hidden 3D source lacks authenticated M4 source end fan');
  const endGaps=unique?sourceFan.endpointWitnesses.filter(x=>
   x.originalSource3DVertexId!==null&&
   x.original3DSourceVertexPlusM4AndFanVerified!==true).length:2;
  const realNativeSource=unique?nativeVertex.nativeSource3DVertexEndpointRows
   .find(x=>x.originalPhysicalSourceEdgeId===edge):null;
  if(unique&&(!realNativeSource||
     !Array.isArray(realNativeSource.endpointWitnesses)||
     realNativeSource.endpointWitnesses.length!==2))
   throw new RangeError('native original 3D endpoint positive proof missing');
  const alternativeNative3D=unique?realNativeSource.endpointWitnesses.filter(x=>
   x.originalM4SourceParameterGapRemainsUnrepaired===true&&
   x.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified===true).length:0;
  const remainingTrueOriginal3DVertexGaps=unique?realNativeSource.endpointWitnesses
   .filter(x=>x.originalModel3DSourceVertexId!==null&&
    x.originalM4SourceParameterGapRemainsUnrepaired===true&&
    x.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified!==true).length:2;
  if(alternativeNative3D>endGaps)
   throw new RangeError('original M4 endpoint proof identity budget mismatch');
  counts.missingM4OriginalVertexEndpointsIndependentNativeM0ProofRecovered+=
   alternativeNative3D;
  counts.genuineOriginalPhysical3DVertexEndpointIdentityStillUnproven+=
   remainingTrueOriginal3DVertexGaps;
  const directNativeEdge= nativeSourceAudit.nativeHiddenSourceRefinements?.[i]?.
   actualGeneratedOCCTTopoDSDirectOriginalBRepIsSameEvidence;
  if(directNativeEdge?.nativeGeneratedEdgeDirectOriginalIsSameCompared!==true||
     directNativeEdge.allM0OriginalPhysicalOCCTSourceEdgesCompared!==true||
     directNativeEdge.fullGeneratedTopoDSOriginalBRepEdgeHistoryRecovered!==false||
     directNativeEdge.signedV5Action!==false)
   throw new RangeError('global C1 M5 native generated edge direct OCCT source IsSame witness missing');
  const directlySameOriginal=directNativeEdge.
   directlySameUniqueOriginalOCCTBRepSourceEdgeId;
  if(directlySameOriginal!==null&&
     (!unique||directlySameOriginal!==edge))
   throw new RangeError('native generated TopoDS IsSame original source contradicts M5 hidden physical source identity');
  const sourceCoverage=unique?sourcePartitionCoverage.get(gap.view+'@'+edge):null;
  const nativeJoined=unique?jointSourceByKey.get(gap.view+'@'+edge):null;
  if(unique&&(!nativeJoined||sourceCoverage?.complete===true&&
       nativeJoined.originalM4Full3DSourceIntervalProven!==true))
   throw new RangeError('canonical M5 complete source contradicts actual M4 original 3D source proof');
  const sourceAndNativeComplete=sourceCoverage?.complete===true&&
   nativeJoined?.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete===true;
  if(sourceAndNativeComplete)
   counts.nativeHiddenStrokesWithFullM4M5AndHLRSourceCoverage++;
  else counts.nativeHiddenStrokesWithUnprovenJointPhysicalSourceCoverage++;
  // Recalculate continuous ORIGINAL 3D ray occlusion from the two real
  // same-run positive proof interval types. A source edge may project to
  // more than one genuine HLR segment: use this exact segment's parameter
  // range rather than confusing source-[0,1] with one generated TopoDS edge.
  let exactNativeIntervalM5Occlusion=null;
  if(unique){
   const claimed=dual.independentOpenIntervalRayAndFrontVisibleUnion,
    range=m4Native.genuineNativeHLROriginalSourceParameterRange;
   if(!claimed||!Array.isArray(range)||range.length!==2||
      !range.every(Number.isFinite)||range[0]<0||range[1]>1||
      range[0]>=range[1]||
      claimed.originalSourceParameterRange?.[0]!==range[0]||
      claimed.originalSourceParameterRange?.[1]!==range[1]||
      dual.originalHiddenSourceEdgeId!==edge||
      dual.locallyExplainedNativeHiddenOpenPaperInterval!==
       claimed.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor||
      claimed.globallyFinalStandardLineStyleCertified!==false||
      claimed.completeOCCTGeneratedBRepEdgeOriginalTopoDSHistory!==false||
      claimed.signedV5Action!==false)
    throw new RangeError('real native generated HLR interval lacks same-source M5 continuous observer-ray evidence');
   const inside=exactCandidateIntervalCoverage(range,
     claimed.strictInteriorIndependentlyVerifiedIntervals),
    visible=exactCandidateIntervalCoverage(range,
     claimed.realVisibleFrontSourceDepthMaskVerifiedIntervals),
    union=exactCandidateIntervalCoverage(range,[
     ...inside.positiveLengthCoveredIntervals,
     ...visible.positiveLengthCoveredIntervals]);
   if(!intervalsMatch(inside.positiveLengthCoveredIntervals,
        claimed.strictInteriorIndependentlyVerifiedIntervals)||
      !intervalsMatch(visible.positiveLengthCoveredIntervals,
        claimed.realVisibleFrontSourceDepthMaskVerifiedIntervals)||
      !intervalsMatch(union.positiveLengthCoveredIntervals,
        claimed.onlyLocallyVerifiedHiddenOrFrontMaskIntervals)||
      !intervalsMatch(union.positiveLengthUncoveredIntervals,
        claimed.outstandingUnprovedOriginalParameterIntervals)||
      union.entireOriginalParameterIntervalCovered!==
       claimed.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor||
      inside.entireOriginalParameterIntervalCovered!==
       claimed.strictInwardSourceEntireOpenIntervalProven||
      visible.entireOriginalParameterIntervalCovered!==
       claimed.independentFrontVisibleSourceMaskEntireOpenIntervalProven)
    throw new RangeError('native generated TopoDS original-source M5 ray coverage contradicts independently exact interval union');
   exactNativeIntervalM5Occlusion=union;
  }else if(dual.independentOpenIntervalRayAndFrontVisibleUnion!==null&&
            dual.independentOpenIntervalRayAndFrontVisibleUnion!==undefined)
   throw new RangeError('nonunique generated HLR edge cannot own original M5 source interval proof');
  if(exactNativeIntervalM5Occlusion?.entireOriginalParameterIntervalCovered)
   counts.realNativeHiddenOpenIntervalsWithIndependentlyRecomputedM5Occlusion++;
  else counts.realNativeHiddenOpenIntervalsWithUnprovenM5Occlusion++;
  const thisNativeOrdinal=perViewNativeOrdinal.get(gap.view);
  perViewNativeOrdinal.set(gap.view,thisNativeOrdinal+1);
  // Both sides are independently checked against the real current native
  // source endpoint M0 vertex ID. The true generated OCCT IsSame star and
  // its original physical vertex ID must coincide, without name/position
  // guessing or tolerance.
  const nativeEndpointStars=['from','to'].map((side,n)=>{
   const star=nativeStarByEndpoint.get(
    gap.view+'@'+thisNativeOrdinal+'@'+side);
   const actualOriginalVertex=unique?
    realNativeSource.endpointWitnesses[n]?.originalModel3DSourceVertexId:null;

   // A genuine IsSame shared node in the INTERIOR of the same original 3D
   // edge is not an M0 vertex. #798 proves both generated native HLR
   // endpoint lifts on an unambiguous measured OCCT source BRep line.
   // At the FINAL M5 consumer check its source ID, exact 3D source t,
   // native-source interval endpoint and literal first-angle paper point
   // independently; this cannot mint a TopoDS edge history or GB line.
   const interiorClaim=star?.actualOCCTGeneratedHLRSourceEdgeInteriorSplit3DProven===true;
   let interiorProof=false;
   if(interiorClaim){
    const t=star.source3DEdgeInteriorParameter,
     range=m4Native.genuineNativeHLROriginalSourceParameterRange,
     points=geometry.data.points,
     src=geometry.data.edges?.find(e=>Array.isArray(e)&&e.length===2&&
      geometry.id+'::'+[...e].sort().join('|')===edge);
    const a=src&&points[src[0]],b=src&&points[src[1]];
    const xyz=a&&b&&Number.isFinite(t)?{
     x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
     z:a.z+(b.z-a.z)*t
    }:null;
    const matchesXYZ=xyz&&star.source3DEdgeInterior3DPoint&&
     ['x','y','z'].every(k=>Number.isFinite(xyz[k])&&
      xyz[k]===star.source3DEdgeInterior3DPoint[k]);
    const paper=xyz&&project(xyz)[gap.view],nativePaper=star.exactNativePaperPoint;
    interiorProof=unique&&
     star.allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex===false&&
     star.independentlyVerifiedOriginalM03DVertexId===null&&
     star.originalOCCTGeneratedToSourceTopoDSEdgeHistoryRecovered===false&&
     star.source3DEdgeInteriorOriginalEdgeId===edge&&
     Array.isArray(star.independentlyTracedOriginal3DSourceEdges)&&
     star.independentlyTracedOriginal3DSourceEdges.length===0&&
     Number.isFinite(t)&&t>0&&t<1&&
     Array.isArray(range)&&range.length===2&&
     (t===range[0]||t===range[1])&&
     matchesXYZ===true&&nativePaper&&paper&&
     paper.u===nativePaper.u&&paper.v===nativePaper.v&&
     star.generatedHLREndpoints.some(x=>x.hlrClass==='hidden-sharp'&&
      x.nativeHLREdgeOrdinal===thisNativeOrdinal&&x.side===side&&
      x.nativePaperPoint?.u===nativePaper.u&&
      x.nativePaperPoint?.v===nativePaper.v);
    if(!interiorProof)
     throw new RangeError('forged native HLR split interior 3D source or endpoint parameter');
   }
   if(interiorProof)
    counts.actualHiddenNativeEndpointsWithExactOriginal3DInteriorSplit++;
   const verified=!!star&&
    star.allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex===true&&
    star.independentlyVerifiedOriginalM03DVertexId!==null&&
    star.independentlyVerifiedOriginalM03DVertexId===actualOriginalVertex&&
    star.independentlyTracedOriginal3DSourceEdges?.includes(edge)===true&&
    (realNativeSource.endpointWitnesses[n]?.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified===true||
     realNativeSource.endpointWitnesses[n]?.existingM4OriginalSourceEndpointVerified===true);
   if(star&&star.allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex===true&&
      !verified)
    throw new RangeError('genuine native IsSame star conflicts with original hidden 3D endpoint source fan');
   if(verified)
    counts.originalHLRHiddenEndpointsWithGenuineNativeIsSameAndFullyVerifiedOriginal3DStar++;
   else if(star&&!interiorProof)
    counts.originalHLRHiddenEndpointsAtSharedIsSameButOriginalSourceFanHeld++;
   return {
    nativeHLREndpointSide:side,
    actualGeneratedOCCTVertexIsSameJunctionPresent:!!star,
    independentOriginal3DVertexAndFullHLRJunctionProven:verified,
    actualNativeOCCTIsSameOriginal3DEdgeInteriorSplitProven:interiorProof,
    actualNativeJunctionHasPositiveOriginal3DPhysicalContinuity:
     verified||interiorProof,
    exactOriginal3DSourceInteriorParameter:
     interiorProof?star.source3DEdgeInteriorParameter:null,
    exactOriginal3DSourceInteriorPoint:
     interiorProof?{...star.source3DEdgeInterior3DPoint}:null,
    independentlyVerifiedOriginalM03DVertexId:
     verified?actualOriginalVertex:null,
    nativeGeneratedToOriginalTopoDSEdgeHistoryStillNotProven:true,
    globalOpaqueSceneAndEngineeringLineStyleCertified:false,
    signedV5Action:false
   };
  });
  if(nativeEndpointStars.every(x=>
   x.independentOriginal3DVertexAndFullHLRJunctionProven))
   counts.nativeHLRHiddenEdgesWithBothNativeIsSameEndpointStarsOriginal3DVerified++;
  const bothLocallyPhysical=nativeEndpointStars.every(x=>
   x.actualNativeJunctionHasPositiveOriginal3DPhysicalContinuity);
  if(bothLocallyPhysical)
   counts.actualHiddenNativeStrokesWithBothSourceJunctionsPhysicallyVerified++;
  const localSourceOcclusionAndPhysicalJunctions=sourceAndNativeComplete&&
   exactNativeIntervalM5Occlusion?.entireOriginalParameterIntervalCovered===true&&
   bothLocallyPhysical;
  if(localSourceOcclusionAndPhysicalJunctions)
   counts.actualHiddenNativeStrokesWithLocallyFullM5VisibilityAndPhysicalJunctions++;
  const localSourceOcclusionAndTopoDSVertices=sourceAndNativeComplete&&
   exactNativeIntervalM5Occlusion?.entireOriginalParameterIntervalCovered===true&&
   nativeEndpointStars.every(x=>
    x.independentOriginal3DVertexAndFullHLRJunctionProven);
  if(localSourceOcclusionAndTopoDSVertices)
   counts.nativeHLRLocallyCompleteSourceOcclusionAndActual3DVertexStars++;
  if(sourceCoverage?.complete!==true)counts.incompleteCanonicalOriginalSourcePartitions++;
  const allGlobalBlockers=requiredGlobal.filter(k=>
   originalGlobal.some(row=>row.independentGlobalProofGaps[k]===true));
  const localNative=gap.realNativeHLRHiddenPaperLineLocallyExplainedByTrueHLRAndM0FullFront===true;
  const localModel=gap.wholeOriginalModelOpenIntervalLocallyAccountedByRayMaskOrM0Source===true;
  if(localNative&&!localModel)
   throw new RangeError('native hidden true HLR paper mask cannot exist without M0 physical proof');
  if(localNative)
   counts.wholeRealNativeHiddenPaperOpenIntervalsLocallyProven++;
  else if(localModel)
   counts.originalM0ModelPhysicalOpenRayEvidenceWithoutCompleteRealNativeHLR++;
  else counts.missingLocalNativeOrModelOpenProofHeld++;
  if(endGaps>0)counts.original3DEndpointFanProofIncompleteStrokes++;
  const projected=m4Native.originalM4ProjectedEncountersOnNativeSource;
  if(!Array.isArray(projected)||projected.some(e=>
    e.originalPhysical3DSourceEdgeId!==edge||
    e.view!==gap.view||
    e.fullGlobalProjectedJunctionAndDepthSwitchCertified!==false||
    e.signedV5Action!==false))
   throw new RangeError('incomplete genuine native original-source M4 projected graph');
  counts.originalM4PaperEncounterEventsCrosscheckedAgainstActualHLR+=projected.length;
  counts.nativeHLRInteriorProjectedEncounterEventsNotGloballyResolved+=
   projected.filter(e=>e.originalSourceParameter>
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[0]??0)&&
    e.originalSourceParameter<
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[1]??1)).length;
  counts.nativeHLRUnprovenExactPaperEventAlignment+=projected.filter(e=>
   e.actualNativeGeneratedBRepPaperRelation?.
    originalEventOnSameNativePaperLineExactly!==true).length;
  // Only claim a native stroke's local transverse crossing depth when
  // canonical M4's stored cut equals the EXACT rational source crossing.
  // Independent recomputation prevents a forged downstream ledger from
  // upgrading a rounded diagnostic event to an M5 proof.
  const anchoredTransverse=[];
  for(const event of projected){
   if(event.canonicalM4ProjectedEncounterKind!=='crossing')continue;
   const claimed=event.nativeHLRActualM4EventLocallyAnchoredStrictDepth===true;
   const status=event.exactOriginalM4CrossingObserverDepthEvidence;
   if(!claimed){
    if(status?.strictOriginal3DObserverDepthOrderAtPaperCrossingProven===true&&
       event.canonicalM4EventExactRationalSourceParameterMatch!==true)
     counts.nativeM4TransverseDepthAtTruePaperCrossingButM4CutNotAnchored++;
    continue;
   }
   const edgeMap=new Map((geometry.data.edges??[]).map(ids=>
    [geometry.id+'::'+[...ids].sort().join('|'),ids]));
   const original=edgeMap.get(event.originalPhysical3DSourceEdgeId),
    other=edgeMap.get(event.otherOriginal3DSourceEdgeId),
    nativeRange=m4Native.genuineNativeHLROriginalSourceParameterRange;
   if(!original||!other||!Array.isArray(nativeRange)||
      event.originalM4RoundedForDiagnostic!==false||
      event.canonicalM4EventExactRationalSourceParameterMatch!==true||
      event.actualNativeGeneratedBRepPaperRelation?.
       originalEventOnSameNativePaperLineExactly!==true||
      event.actualNativeGeneratedBRepPaperRelation?.
       originalEventWithinNativePaperEndpointsNumerically!==true||
      event.originalSourceParameter<=nativeRange[0]||
      event.originalSourceParameter>=nativeRange[1])
    throw new RangeError('native transverse crossing claims unauthenticated original M4/OCCT identity');
   const independent=exactOriginalM4TransverseCrossingDepth({
    geometry,view:gap.view,firstEdge:original,secondEdge:other,
    nativeFirstOriginalParameterRange:nativeRange,
    originalM4SourceParameter:event.originalSourceParameter
   });
   const front=independent.exactOriginalSourceAtCrossingFront==='first'?
    event.originalPhysical3DSourceEdgeId:event.otherOriginal3DSourceEdgeId;
   if(!independent.strictOriginal3DObserverDepthOrderAtPaperCrossingProven||
      !independent.originalM4SourceParameterExactlyMatchesRationalCrossing||
      event.exactOriginal3DFrontSourceAtTransversePaperCrossing!==front)
    throw new RangeError('forged canonical M4 rational crossing or incorrect exact M0 observer depth');
   anchoredTransverse.push({
    originalHiddenSourceEdgeId:event.originalPhysical3DSourceEdgeId,
    crossingOtherOriginalSourceEdgeId:event.otherOriginal3DSourceEdgeId,
    localExactObserverFrontSourceEdgeId:front,
    exactOriginalM4ParameterAndRealNativePaperBothAligned:true,
    globalOcclusionTopologyCertified:false,
    engineeringLineStyleCertified:false,signedV5Action:false
   });
  }
  counts.nativeM4TransverseCrossingsWithIndependentExactM0AndNativeAnchor+=
   anchoredTransverse.length;
  // M4's near-endpoint collinear overlap is NOT necessarily an actual
  // visibility switch. Positively reject such a switch only when the
  // already independent full-original M0 exact front depth, current M5
  // CLOSED ray clear, and ACTUAL native VCompound/HCompound full paper
  // witness certifies the SAME two source edges at that parameter.
  const positiveFrontNoSwitch=projected.filter(event=>
   event.canonicalM4ProjectedEncounterKind==='collinear-overlap'&&
   event.originalM4RoundedForDiagnostic===false&&
   event.positivelySameOriginal3DPhysicalSourceVertex===null&&
   event.actualNativeGeneratedBRepPaperRelation?.
    originalEventOnSameNativePaperLineExactly===true&&
   event.originalSourceParameter>
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[0]??0)&&
   event.originalSourceParameter<
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[1]??1)&&
   (gap.originalM4OrNativePaperPositiveGapWitnesses??[]).some(w=>
    w.originalHiddenSourceParameterRange?.[0]<=event.originalSourceParameter&&
    w.originalHiddenSourceParameterRange?.[1]>=event.originalSourceParameter&&
    w.gapOpenIntervalLocallyCoveredByIndependentM0FrontGeometry===true&&
    w.nativeTrueVisibleAndHiddenHLROpenPaperLineCoverageProven===true&&
    w.exactFullOriginal3DPhysicalFrontSourceWitnesses?.some(p=>
     p.originalFront3DSourceEdgeId===event.otherOriginal3DSourceEdgeId&&
     p.exactlyCoincidentFullOriginalM0PaperEndpoints===true&&
     p.exactDyadicStrictOriginal3DWholeOpenFrontDepth===true&&
     p.independentlyM5ClosedFrontOriginal3DRayClear===true&&
     p.realOCCTOriginalSourceBRep3DCurveVerified===true&&
     p.realVisibleVCompoundAndHiddenHCompoundFullOpenPaperMaskProven===true)
   ));
  const interiorCollinear=projected.filter(e=>
   e.canonicalM4ProjectedEncounterKind==='collinear-overlap'&&
   e.originalSourceParameter>
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[0]??0)&&
   e.originalSourceParameter<
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[1]??1));
  counts.nativeM4CollinearInteriorEventsWithExactFullFrontDepthNoSwitchProof+=
   positiveFrontNoSwitch.length;
  counts.nativeM4InteriorCollinearEventsWithoutPositiveFullFrontNoSwitchProof+=
   interiorCollinear.length-positiveFrontNoSwitch.length;
  // Materially useful positive M5 *original 3D* event graph. This only
  // settles the physical spatial meaning of known canonical M4 encounters;
  // OCCT-generated TopoDS adjacency, whole-scene opaque-face topology,
  // standard GB line styles and ConstructionIntent/V5 remain separate.
  // Mutually exclusive local mathematical outcomes:
  // (a) authenticated same-original-3D-vertex from both OCCT BRep curves;
  // (b) exact projected transverse crossing at DIFFERENT original depths;
  // (c) genuine front original source masking a collinear paper encounter.
  const anchoredByEvent=new Set(anchoredTransverse.map(x=>
   x.originalHiddenSourceEdgeId+'@'+x.crossingOtherOriginalSourceEdgeId));
  const noSwitch=new Set(positiveFrontNoSwitch);
  const locallyClassified=projected.map(event=>{
   const realVertex=event.positivelySameOriginal3DPhysicalSourceVertex!==null&&
    event.original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven===true&&
    event.exactOriginalM4VertexOtherSourceDepthEvidence?.
     exactOriginalVertexDepthRelativeOtherSourceSign===0;
   const crossing=event.canonicalM4ProjectedEncounterKind==='crossing'&&
    event.nativeHLRActualM4EventLocallyAnchoredStrictDepth===true&&
    anchoredByEvent.has(
     event.originalPhysical3DSourceEdgeId+'@'+event.otherOriginal3DSourceEdgeId);
   const masked=event.canonicalM4ProjectedEncounterKind==='collinear-overlap'&&
    noSwitch.has(event);
   const matches=Number(realVertex)+Number(crossing)+Number(masked);
   if(matches>1)
    throw new RangeError('contradictory original 3D physical event classifications');
   const classification=realVertex?
    'shared-authenticated-original-3d-vertex':
    crossing?'transverse-paper-only-distinct-original-3d-depth':
    masked?'collinear-visible-front-original-3d-depth-mask':
    'undetermined';
   return {
    view:gap.view,originalSourceEdgeId:event.originalPhysical3DSourceEdgeId,
    otherOriginalSourceEdgeId:event.otherOriginal3DSourceEdgeId??null,
    originalM4SourceParameter:event.originalSourceParameter,
    original3DSpatialEventClass:classification,
    original3DSpatialMeaningProven:matches===1,
    actualNativeHLRGeneratedEdgeTopoDSJunctionCertified:false,
    wholeSceneOcclusionCertified:false,
    officialEngineeringLineStyle:'undetermined',
    signedV5Action:false
   };
  });
  const localResolved=locallyClassified.filter(x=>x.original3DSpatialMeaningProven).length;
  counts.originalM4ProjectedEventsWithVerifiedLocal3DSpatialDisposition+=localResolved;
  counts.originalM4ProjectedEventsStillMissingExactLocal3DSpatialDisposition+=
   locallyClassified.length-localResolved;
  if(localResolved===locallyClassified.length&&localResolved>0)
   counts.nativeHLRSourceStrokesWithCompleteLocal3DEventClassification++;
  const physicalVertexPaperDrift=projected.filter(e=>
   e.positivelySameOriginal3DPhysicalSourceVertex!==null&&
   e.actualNativeGeneratedBRepPaperRelation?.
    originalEventOnSameNativePaperLineExactly===false&&
   realNativeSource?.endpointWitnesses.some(w=>
    w.originalModel3DSourceVertexId===
      e.positivelySameOriginal3DPhysicalSourceVertex&&
    (w.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified===true||
     w.existingM4OriginalSourceEndpointVerified===true)));
  counts.nativePaperMisalignmentWithIndependentAuthenticOriginal3DVertex+=
   physicalVertexPaperDrift.length;
  counts.exactOriginal3DSharedVertexWithTwoAuthenticBRepSources+=
   projected.filter(e=>
    e.original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven===true).length;
  counts.exactSource3DSharedVertexButNativeGeneratedPaperStillMisaligned+=
   projected.filter(e=>
    e.original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven===true&&
    e.originalHLRGeneratedPaperMismatchRemains===true).length;
  counts.genuineHiddenHLRStrokesReviewed++;
  rows.push({
   view:gap.view,revision,sourceGeometryId:geometry.id,
   nativeHiddenSharpEdgeOrdinal:i,
   originalPhysical3DSourceEdgeId:unique?edge:null,
   entireRealOCCTHiddenPaperOpenIntervalLocallyVerified:localNative,
   fullOriginalPhysicalOpen3DSourceRayLocallyVerified:localModel,
   originalSourceM4AndClosed3DVertexFanIncompleteEndpointCount:endGaps,
   originalNative3DVertexEndpointsIndependentlyCorroboratedWithoutM4Cut:
    alternativeNative3D,
   originalNativePhysical3DVertexIdentityStillUnproven:
    remainingTrueOriginal3DVertexGaps,
   nativeGeneratedHLREdgesHaveAllPhysical3DJunctionsCertified:false,
   independentlyVerifiedOCCTNativeIsSameOriginal3DEndpointStars:nativeEndpointStars,
   actualGeneratedHiddenNativeStrokeBoth3DEndpointsLocallyPhysical:
    bothLocallyPhysical,
   localOriginal3DSourceExactM5OcclusionAndTruePhysicalHLRJunctions:
    localSourceOcclusionAndPhysicalJunctions,
   bothRealNativeHLREndpointGeneratedJunctionStarsHaveOriginal3DSourceProof:
    nativeEndpointStars.every(x=>
     x.independentOriginal3DVertexAndFullHLRJunctionProven),
   originalGlobalSourceM5StrokeRowsReviewed:originalGlobal.length,
   canonicalOriginalSourceParameterPartitionComplete:sourceCoverage?.complete===true,
   canonicalOriginalSourceParameterGaps:sourceCoverage?.gaps??null,
   sameRunCanonicalM4M5NativeHLRJointPhysicalSourceCoverage:
    sourceAndNativeComplete,
   genuineGeneratedTopoDSEdgeDirectOriginalSourceIsSameWitness:
    directNativeEdge,
   generatedTopoDSEdgePhysicallySameAsM5OriginalBRepSource:
    directlySameOriginal!==null&&directlySameOriginal===edge,
   independentlyRecomputedCanonicalM4M5NativeSourceEvidence:
    nativeJoined??null,
   actualNativeTopodsOpenIntervalContinuousM5CoverageIndependentlyRecomputed:
    exactNativeIntervalM5Occlusion??null,
   localOriginal3DSourceExactM5OcclusionAndNativeIsSameEndpointConjunction:
    localSourceOcclusionAndTopoDSVertices,
   generatedTopoDSEdgeOriginalTopoDSEdgeHistoryStillMissing:true,
   jointPositiveM5Prerequisites:{
    completeSourceParameterCoverage:sourceAndNativeComplete,
    original3DEndpointAndM4FanTopology:remainingTrueOriginal3DVertexGaps===0&&
     nativeEndpointStars.every(x=>x.independentOriginal3DVertexAndFullHLRJunctionProven),
    continuousOriginalModelAndRealNativeHLROcclusion:localNative&&localModel&&
     exactNativeIntervalM5Occlusion?.entireOriginalParameterIntervalCovered===true
   },
   jointPositiveM5PrerequisitesSatisfied:
    sourceAndNativeComplete&&remainingTrueOriginal3DVertexGaps===0&&
    nativeEndpointStars.every(x=>x.independentOriginal3DVertexAndFullHLRJunctionProven)&&
    localNative&&localModel&&
    exactNativeIntervalM5Occlusion?.entireOriginalParameterIntervalCovered===true,
   additionalCanonicalM5GlobalBlockers:allGlobalBlockers,
   canonicalOriginalM4ProjectedEncountersAudited:projected.length,
   currentOriginalM4SourceSpatialEventClassifications:locallyClassified,
   allCurrentOriginalM4SourceEncountersLocally3DClassified:
    locallyClassified.length>0&&localResolved===locallyClassified.length,
   nativeGeneratedHLRAndAllOpaqueFacesStillNeedGlobalProof:true,
   nativeM4TransverseExactLocalDepthAndNativeHLRAnchors:anchoredTransverse,
   collinearNativeInteriorEventsWithIndependentFullFrontNoDepthSwitchProof:
    positiveFrontNoSwitch.map(e=>({
     originalSourceParameter:e.originalSourceParameter,
     originalHidden3DEdgeId:e.originalPhysical3DSourceEdgeId,
     originalFront3DEdgeId:e.otherOriginal3DSourceEdgeId,
     completeSource3DDepthAndRealOCCTHLRPaperProof:true,
     generatedHLREdgeTopoDSIdentityAndGBLineCertified:false,
     signedV5Action:false
    })),
   exactModelSpace3DSharedSourceVerticesWithVerifiedOriginalBRep:
    projected.filter(e=>
     e.original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven===true)
    .map(e=>({
     originalVertexId:e.positivelySameOriginal3DPhysicalSourceVertex,
     twoGenuineOriginalOCCT3DSourceCurvesVerified:true,
     M0ExactDyadicOriginalObserverDepthTie:
      e.exactOriginalM4VertexOtherSourceDepthEvidence?.
       exactOriginalVertexDepthRelativeOtherSourceSign===0,
     nativeHLRGeneratedPaperAlignmentProven:
      e.originalHLRGeneratedPaperMismatchRemains===false&&
      e.actualNativeGeneratedBRepPaperRelation?.
       originalEventOnSameNativePaperLineExactly===true,
     generatedHLRToOriginalTopoDSHistoryStillUnverified:true,
     globalEngineeringLineStyleSigned:false,signedV5Action:false
    })),
   nativePaperDriftAtIndependentlyProvenOriginal3DVertices:
    physicalVertexPaperDrift.map(e=>({
     originalVertexId:e.positivelySameOriginal3DPhysicalSourceVertex,
     originalSourceParameter:e.originalSourceParameter,
     original3DPhysicalJunctionAlreadyPositivelyProven:true,
     exactNativeHLRGeneratedPaperPointEqual:false,
     globalEngineeringJunctionLineStyleCertified:false,
     signedV5Action:false
    })),
   canonicalNativeHLRInteriorProjectedEventsStillNeedGlobalReview:
    projected.filter(e=>e.originalSourceParameter>
     (m4Native.genuineNativeHLROriginalSourceParameterRange?.[0]??0)&&
     e.originalSourceParameter<
     (m4Native.genuineNativeHLROriginalSourceParameterRange?.[1]??1)).length,
   allProjectedEncountersAndDepthSwitchesResolved:false,
   actualOCCTGeneratedEdgeToOriginalTopoDSIdentityCertified:false,
   engineeringGBSolidOrDashedLineStandardFullyCertified:false,
   officialEngineeringLineStyle:'undetermined',
   authorizedConstructionIntent:false,
   signedConstructionStepDAGOrSoleV5Action:false,
   signedV5Action:false
  });
 }
 if(counts.originalHLRHiddenEndpointsWithGenuineNativeIsSameAndFullyVerifiedOriginal3DStar+
    counts.originalHLRHiddenEndpointsAtSharedIsSameButOriginalSourceFanHeld+
    counts.actualHiddenNativeEndpointsWithExactOriginal3DInteriorSplit>
    counts.genuineHiddenHLRStrokesReviewed*2||
    counts.actualHiddenNativeStrokesWithBothSourceJunctionsPhysicallyVerified>
     counts.genuineHiddenHLRStrokesReviewed||
    counts.actualHiddenNativeStrokesWithLocallyFullM5VisibilityAndPhysicalJunctions>
     counts.realNativeHiddenOpenIntervalsWithIndependentlyRecomputedM5Occlusion||
    counts.nativeHLRHiddenEdgesWithBothNativeIsSameEndpointStarsOriginal3DVerified>
    counts.genuineHiddenHLRStrokesReviewed)
  throw new RangeError('native whole junction M5 endpoint certification coverage mismatch');
 if(counts.originalM4ProjectedEventsWithVerifiedLocal3DSpatialDisposition+
    counts.originalM4ProjectedEventsStillMissingExactLocal3DSpatialDisposition!==
    counts.originalM4PaperEncounterEventsCrosscheckedAgainstActualHLR||
    counts.nativeHLRSourceStrokesWithCompleteLocal3DEventClassification>
    counts.genuineHiddenHLRStrokesReviewed)
  throw new RangeError('incomplete mathematical classification of C1 native source paper encounters');
 if(counts.realNativeHiddenOpenIntervalsWithIndependentlyRecomputedM5Occlusion+
     counts.realNativeHiddenOpenIntervalsWithUnprovenM5Occlusion!==
      counts.genuineHiddenHLRStrokesReviewed||
    counts.nativeHLRLocallyCompleteSourceOcclusionAndActual3DVertexStars>
     counts.realNativeHiddenOpenIntervalsWithIndependentlyRecomputedM5Occlusion||
    counts.nativeHiddenStrokesWithFullM4M5AndHLRSourceCoverage+
     counts.nativeHiddenStrokesWithUnprovenJointPhysicalSourceCoverage!==
      counts.genuineHiddenHLRStrokesReviewed||
    counts.genuineHiddenHLRStrokesReviewed!==gapProof.rows.length||
    counts.realGeneratedHLRToOriginalTopoDSProven!==0||
    counts.officialStandardSolidOrDashedLineSigned!==0||
    counts.formalConstructionIntentDAGV5ActionsSigned!==0)
  throw new RangeError('incomplete genuine OCCT HLR to canonical M5 global style gate');
 return frozen({
  schema:'draftai-c1-real-native-hlr-complete-open-interval-final-m5-signoff-gate/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,canonicalOriginalM5SourceInventory,
  originalOCCTBRepSourceInventory,
  realNativeVisibleHiddenSourceGraph,
  nativeVisibleHLRSourceTiling,
  nativeVHWFaceRayAndHLRReconciliation,
  fullSourceVHWFaceRayAndActualHLRClosure,
  allSameRunCanonicalM4M5AndNativeHLRSourceViewsJoined:true,
  independentOriginalM0ModelAndNativeOCCTPositiveEvidenceUsed:true,
  originalClosedVertexStarAndGlobalM5ScopeConsumed:true,
  actualHLRGeneratedBRepEdgeTopoDSHistoryComplete:false,
  completeGloballySigned3DAndProjectedStrokeJunctionGraph:false,
  officialEngineeringGBLineRulesCertified:false,
  constructionIntentAuthorized:false,
  signedConstructionStepDAGActions:0,signedV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={reviewC1NativeHiddenFinalM5Strokes,
 certifyExactOriginalRaySourceParameterPartition,
 certifyExactNativeGeneratedSourceTiling};
