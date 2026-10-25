'use strict';
/**
 * One reviewed closed convex solid: an ORIGINAL 3D source edge whose whole
 * CLOSED forward observer ray is independently exact-M5 clear CANNOT
 * generate a hidden native HLR sharp edge. Pruning is only a physical
 * possibility filter, not OCCT-generated TopoDS provenance or GB line style.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
function pruneHiddenSharpPaperAliasesUsingExactM5({
 view,candidates,closedOriginalSourceByKey
}={}){
 if(!VIEWS.includes(view)||!Array.isArray(candidates)||
    candidates.length>128||!(closedOriginalSourceByKey instanceof Map))
  throw new TypeError('native hidden 3D source candidates and exact original M5 rays required');
 const seen=new Set(),eliminated=[],remaining=[];
 for(const c of candidates){
  const id=c?.sourceEdgeId;
  if(typeof id!=='string'||!id||seen.has(id)||
     c.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
     c.originalOCCTSourceLineCurveVerified!==true||
     c.originalXYZReprojectsToHLR!==true||
     c.v5Authorized!==false)
   throw new TypeError('untrusted native OCCT 3D original source candidate');
  seen.add(id);
  const m5=closedOriginalSourceByKey.get(id+'@'+view);
  if(!m5||m5.originalPhysicalSourceEdgeId!==id||
     m5.view!==view||
     m5.officialEngineeringLineStyle!=='undetermined'||
     m5.signedV5Action!==false)
   throw new TypeError('missing current unsigned M5 closed original source ray');
  const exactlyClear=m5.completeSourceOriginal3DRayClosedIntervalClear===true;
  if(exactlyClear&&m5.originalOpenEdgeStrictInteriorOcclusionProven===true)
   throw new RangeError('contradictory exact original source M5 ray evidence');
  if(exactlyClear)eliminated.push({
   sourceEdgeId:id,
   reason:'exact-whole-closed-original-3d-forward-observer-ray-clear',
   genuineHLRToOriginalTopoDSIdentityVerified:false,
   officialEngineeringLineStyle:'undetermined',signedV5Action:false
  });
  else remaining.push({
   sourceEdgeId:id,
   strictInwardOriginalOpenRayProven:
    m5.originalOpenEdgeStrictInteriorOcclusionProven===true,
   genuineHLRToOriginalTopoDSIdentityVerified:false,
   officialEngineeringLineStyle:'undetermined',signedV5Action:false
  });
 }
 return frozen({
  originalPaperCandidateCount:candidates.length,
  originalSourcesExcludedByExactClosedRay:eliminated,
  exactClosedRayExclusionCount:eliminated.length,
  remainingPhysicalSourcePossibilities:remaining,
  remainingPossibleOriginal3DSourceCount:remaining.length,
  uniqueRemainingOriginalSourceCandidateAfterNegativeProof:
   remaining.length===1,
  // A unique surviving paper candidate is NOT a recovered HLR TopoDS
  // source edge or certification under engineering drawing standards.
  nativeHLRToSourceTopoDSIdentityRecovered:false,
  formalEngineeringLineStyle:'undetermined',
  constructionIntentAuthorized:false,signedV5Action:false
 });
}
module.exports={pruneHiddenSharpPaperAliasesUsingExactM5};
