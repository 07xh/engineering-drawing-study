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
const {VIEWS}=require('../core/projection/conventions.js');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))frozen(x);Object.freeze(o);
}return o;};
const requiredGlobal=[
 'original3DSourceIdentity','completeIntervalVisibility',
 'endpointAndProjectionTopology','engineeringLineStandard',
 'soleConstructionIntentDAGV5'
];
function reviewC1NativeHiddenFinalM5Strokes({
 geometry,revision,gapProof,dualProof,endpointFans,globalM5Review
}={}){
 if(!geometry?.data?.points||!Number.isSafeInteger(revision)||revision<1||
    gapProof?.sourceGeometryId!==geometry.id||gapProof.revision!==revision||
    gapProof.signedV5ActionCount!==0||
    gapProof.actualNativeGeneratedHLRPaperCoverageAndOriginalModelProofNotConflated!==true||
    dualProof?.sourceGeometryId!==geometry.id||dualProof.revision!==revision||
    dualProof.signedV5ActionCount!==0||
    endpointFans?.sourceGeometryId!==geometry.id||
    endpointFans.revision!==revision||
    endpointFans.nativeGeneratedTopoDSEdgeEndpointIdentityProven!==false||
    endpointFans.signedV5ActionCount!==0||
    globalM5Review?.sourceGeometryId!==geometry.id||
    globalM5Review.revision!==revision||
    globalM5Review.schema!=='draftai-c1-m5-final-source-obligation-review/1'||
    globalM5Review.signedV5ActionCount!==0||
    globalM5Review.fullyCertifiedCount!==0||
    !Array.isArray(globalM5Review.rows)||!Array.isArray(gapProof.rows)||
    !Array.isArray(dualProof.rows)||!Array.isArray(endpointFans.rows)||
    gapProof.rows.length!==dualProof.rows.length||
    gapProof.rows.length!==endpointFans.rows.length)
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
 // A global stroke cannot be certified against overlapping or repeated
 // original source intervals. Validate the entire canonical partition,
 // including source/view groups not referenced by the current HLR stroke.
 for(const sourceRows of byKey.values()){
  const ordered=[...sourceRows].sort((a,b)=>
   a.originalSourceParameterRange[0]-b.originalSourceParameterRange[0]);
  for(let i=1;i<ordered.length;i++){
   if(ordered[i-1].originalSourceParameterRange[1]>
      ordered[i].originalSourceParameterRange[0])
    throw new RangeError('overlapping canonical original M5 source intervals');
  }
 }
 const sourcePartitionCoverage=new Map();
 for(const [key,sourceRows] of byKey){
  const ordered=[...sourceRows].sort((a,b)=>
   a.originalSourceParameterRange[0]-b.originalSourceParameterRange[0]);
  const gaps=[];
  let cursor=0;
  for(const row of ordered){
   const [begin,end]=row.originalSourceParameterRange;
   if(begin>cursor)gaps.push([cursor,begin]);
   cursor=end;
  }
  if(cursor<1)gaps.push([cursor,1]);
  sourcePartitionCoverage.set(key,frozen({
   complete:gaps.length===0,gaps,
   intervals:ordered.map(row=>[...row.originalSourceParameterRange])
  }));
 }
 const counts={genuineHiddenHLRStrokesReviewed:0,
  wholeRealNativeHiddenPaperOpenIntervalsLocallyProven:0,
  originalM0ModelPhysicalOpenRayEvidenceWithoutCompleteRealNativeHLR:0,
  missingLocalNativeOrModelOpenProofHeld:0,
  original3DEndpointFanProofIncompleteStrokes:0,
  incompleteCanonicalOriginalSourcePartitions:0,
  realGeneratedHLRToOriginalTopoDSProven:0,
  entireGlobalJunctionAndSceneTopologyCertified:0,
  officialStandardSolidOrDashedLineSigned:0,
  formalConstructionIntentDAGV5ActionsSigned:0};
 const rows=[];
 for(let i=0;i<gapProof.rows.length;i++){
  const gap=gapProof.rows[i],dual=dualProof.rows[i],
   fans=endpointFans.rows[i];
  if(!VIEWS.includes(gap.view)||dual.view!==gap.view||
     fans.view!==gap.view||gap.nativeHiddenSharpEdgeOrdinal!==i||
     dual.nativeHiddenSharpEdgeOrdinal!==i||
     fans.nativeHiddenSharpEdgeOrdinal!==i||
     gap.signedV5Action!==false||dual.signedV5Action!==false||
     fans.signedV5Action!==false||
     gap.nativeHLRGeneratedSourceTopoDSLinksAndAllJunctionsProven!==false||
     dual.fullGBDashedLineOrVisibleLineAssignmentSigned!==false||
     fans.nativeHLREdgeJunctionsCertified!==false)
   throw new RangeError('real native HLR original source or physical 3D fan evidence drift');
  const edge=dual.originalHiddenSourceEdgeId;
  const unique=dual.remainingOriginal3DPhysicalSourceUnique===true&&
   gap.survivingOriginal3DSourceUnique===true;
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
  const sourceCoverage=unique?sourcePartitionCoverage.get(gap.view+'@'+edge):null;
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
  if(sourceCoverage?.complete!==true)counts.incompleteCanonicalOriginalSourcePartitions++;
  counts.genuineHiddenHLRStrokesReviewed++;
  rows.push({
   view:gap.view,revision,sourceGeometryId:geometry.id,
   nativeHiddenSharpEdgeOrdinal:i,
   originalPhysical3DSourceEdgeId:unique?edge:null,
   entireRealOCCTHiddenPaperOpenIntervalLocallyVerified:localNative,
   fullOriginalPhysicalOpen3DSourceRayLocallyVerified:localModel,
   originalSourceM4AndClosed3DVertexFanIncompleteEndpointCount:endGaps,
   nativeGeneratedHLREdgesHaveAllPhysical3DJunctionsCertified:false,
   originalGlobalSourceM5StrokeRowsReviewed:originalGlobal.length,
   canonicalOriginalSourceParameterPartitionComplete:sourceCoverage?.complete===true,
   canonicalOriginalSourceParameterGaps:sourceCoverage?.gaps??null,
   jointPositiveM5Prerequisites:{
    completeSourceParameterCoverage:sourceCoverage?.complete===true,
    original3DEndpointAndM4FanTopology:endGaps===0,
    continuousOriginalModelAndRealNativeHLROcclusion:localNative&&localModel
   },
   jointPositiveM5PrerequisitesSatisfied:
    sourceCoverage?.complete===true&&endGaps===0&&localNative&&localModel,
   additionalCanonicalM5GlobalBlockers:allGlobalBlockers,
   actualOCCTGeneratedEdgeToOriginalTopoDSIdentityCertified:false,
   engineeringGBSolidOrDashedLineStandardFullyCertified:false,
   officialEngineeringLineStyle:'undetermined',
   authorizedConstructionIntent:false,
   signedConstructionStepDAGOrSoleV5Action:false,
   signedV5Action:false
  });
 }
 if(counts.genuineHiddenHLRStrokesReviewed!==gapProof.rows.length||
    counts.realGeneratedHLRToOriginalTopoDSProven!==0||
    counts.officialStandardSolidOrDashedLineSigned!==0||
    counts.formalConstructionIntentDAGV5ActionsSigned!==0)
  throw new RangeError('incomplete genuine OCCT HLR to canonical M5 global style gate');
 return frozen({
  schema:'draftai-c1-real-native-hlr-complete-open-interval-final-m5-signoff-gate/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,
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
module.exports={reviewC1NativeHiddenFinalM5Strokes};
