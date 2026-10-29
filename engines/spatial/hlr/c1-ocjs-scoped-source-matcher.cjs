'use strict';
/**
 * Match REAL OCCT source-scoped HLR output to the independently extracted
 * whole-solid HLR output. HLRBRep_HLRToShape.VCompound(S)/HCompound(S)
 * filters by the ORIGINAL TopoDS source shape S. The returned 2D edges are
 * generated shapes: only native, symmetric IsSame can establish identity
 * with a whole-solid generated edge. Paper coincidence is NOT identity.
 *
 * The filter is a useful original-edge provenance witness, not a complete
 * visibility/line-style proof or permission to issue a V5 stroke.
 */
const {VIEWS}=require('../../../core/projection/conventions.js');
const valid=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
// A fixed 1e-6 mm paper tolerance would identify unrelated, disjoint
// sub-micrometre HLR fragments as the same generated edge. Scale the
// comparison by the shorter measured segment: A-end tails must not borrow
// another whole-solid edge's original TopoDS source label.
const paperSame=(a,b,spanA,spanB)=>
 Math.hypot(a.u-b.u,a.v-b.v)<=
  Math.min(1e-6,Math.min(spanA,spanB)*1e-6);
const nativeScopedPaperSegmentsSame=(a,b)=>{
 if(!valid(a?.from)||!valid(a?.to)||!valid(b?.from)||!valid(b?.to))return false;
 const spanA=Math.hypot(a.to.u-a.from.u,a.to.v-a.from.v);
 const spanB=Math.hypot(b.to.u-b.from.u,b.to.v-b.from.v);
 if(!(spanA>0)||!(spanB>0))return false;
 return paperSame(a.from,b.from,spanA,spanB)&&
  paperSame(a.to,b.to,spanA,spanB)||
  paperSame(a.from,b.to,spanA,spanB)&&
  paperSame(a.to,b.from,spanA,spanB);
};
function auditC1ScopedHLRGeneratedEdgeMatch({
 view,hlrClass,sourceEdgeId,globalSegments,globalNativeEdges,
 scopedSegment,scopedNativeEdge
}={}){
 if(!VIEWS.includes(view)||!['visible-sharp','hidden-sharp'].includes(hlrClass)||
    typeof sourceEdgeId!=='string'||!sourceEdgeId||
    !Array.isArray(globalSegments)||!Array.isArray(globalNativeEdges)||
    globalSegments.length!==globalNativeEdges.length||!globalSegments.length||
    !valid(scopedSegment?.from)||!valid(scopedSegment?.to)||
    (scopedSegment.from.u===scopedSegment.to.u&&
     scopedSegment.from.v===scopedSegment.to.v)||
    typeof scopedNativeEdge?.IsSame!=='function'||scopedNativeEdge.IsNull?.()===true||
    scopedNativeEdge.IsSame(scopedNativeEdge)!==true)
  throw new TypeError('genuine source-scoped and whole-solid OCCT HLR edges required');
 const paper=[],same=[],partner=[],partnerPaper=[];
 let partnerRelationSupported=typeof scopedNativeEdge.IsPartner==='function',
  partnerRelationComparisons=0;
 for(let i=0;i<globalSegments.length;i++){
  const seg=globalSegments[i],native=globalNativeEdges[i];
  if(!valid(seg?.from)||!valid(seg?.to)||
     (seg.from.u===seg.to.u&&seg.from.v===seg.to.v)||
     typeof native?.IsSame!=='function'||
     native.IsNull?.()===true||native.IsSame(native)!==true)
   throw new TypeError('complete native whole-solid HLR edge inventory required');
  const forward=scopedNativeEdge.IsSame(native),reverse=native.IsSame(scopedNativeEdge);
  if(typeof forward!=='boolean'||typeof reverse!=='boolean'||forward!==reverse)
   throw new RangeError('asymmetric native scoped/global TopoDS IsSame');
  const samePaper=nativeScopedPaperSegmentsSame(seg,scopedSegment);
  if(samePaper)paper.push(i);
  if(forward){if(!samePaper)throw new RangeError('native IsSame generated HLR edge has inconsistent paper endpoints');same.push(i);}
  if(typeof scopedNativeEdge.IsPartner!=='function'||typeof native.IsPartner!=='function')
   partnerRelationSupported=false;
  else{
   const pf=scopedNativeEdge.IsPartner(native),pr=native.IsPartner(scopedNativeEdge);
   if(typeof pf!=='boolean'||typeof pr!=='boolean'||pf!==pr)
    throw new RangeError('asymmetric native scoped/global TopoDS IsPartner');
   partnerRelationComparisons++;
   if(forward&&!pf)throw new RangeError('native IsSame generated HLR edge contradicts IsPartner');
   if(pf){partner.push(i);if(samePaper)partnerPaper.push(i);}
  }
 }
 if(!paper.length)throw new RangeError('source-scoped native HLR edge absent from whole-solid output');
 if(same.length>1)throw new RangeError('one scoped HLR edge matches multiple whole-solid native identities');
 const partnerOrdinals=partnerRelationSupported?partner:[];
 const partnerPaperOrdinals=partnerRelationSupported?partnerPaper:[];
 return Object.freeze({
  view,hlrClass,originalPhysicalSourceEdgeId:sourceEdgeId,
  globalPaperCandidateOrdinals:Object.freeze(paper),
  globalDirectSameGeneratedTopoDSOrdinals:Object.freeze(same),
  actualNativeScopedToGlobalGeneratedEdgeIsSameProven:same.length===1,
  nativeIsPartnerRelationSupported:partnerRelationSupported,
  nativePartnerRelationComparisons:partnerRelationComparisons,
  globalPartnerGeneratedTopoDSOrdinals:Object.freeze(partnerOrdinals),
  globalPartnerAndPaperCandidateOrdinals:Object.freeze(partnerPaperOrdinals),
  uniqueGlobalPartnerAndPaperCandidateOrdinal:partnerPaperOrdinals.length===1?partnerPaperOrdinals[0]:null,
  nativePartnerOnlyCandidate:partnerPaperOrdinals.length===1&&same.length===0,
  partnerCandidateDoesNotProveOriginalSourceHistory:true,
  paperCoincidenceAloneIsNotOriginalTopoDSHistory:true,
  fullOriginalSourceParameterCoverageProven:false,
  globalContinuousOcclusionProven:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}
/**
 * Join multiple genuine source-scoped native HLR audits without allowing
 * two different ORIGINAL edges to claim one whole-solid generated TopoDS
 * identity. Paper and IsPartner candidates are diagnostics, not provenance.
 */
function auditC1ScopedHLRSourceIdentityConflicts({matches}={}){
 if(!Array.isArray(matches)||!matches.length||matches.length>1024)
  throw new TypeError('nonempty genuine scoped HLR match inventory required');
 const claimed=new Map(),seen=new Set(),rows=[];
 for(const match of matches){
  const view=match?.view,hlrClass=match?.hlrClass;
  const sourceEdgeId=match?.originalPhysicalSourceEdgeId;
  const ordinals=match?.globalDirectSameGeneratedTopoDSOrdinals;
  if(!VIEWS.includes(view)||!['visible-sharp','hidden-sharp'].includes(hlrClass)||
     typeof sourceEdgeId!=='string'||!sourceEdgeId||
     !Array.isArray(ordinals)||ordinals.length>1||
     match.actualNativeScopedToGlobalGeneratedEdgeIsSameProven!==(ordinals.length===1)||
     match.fullOriginalSourceParameterCoverageProven!==false||
     match.globalContinuousOcclusionProven!==false||
     match.signedV5Action!==false||
     ordinals.some(n=>!Number.isSafeInteger(n)||n<0))
   throw new TypeError('unsigned actual native scoped match required');
  if(!ordinals.length)continue;
  const ordinal=ordinals[0],key=view+'|'+hlrClass+'|'+ordinal;
  const pair=key+'|'+sourceEdgeId;
  if(seen.has(pair))throw new RangeError('duplicate native scoped source claim');
  seen.add(pair);
  const previous=claimed.get(key);
  if(previous!==undefined&&previous!==sourceEdgeId)
   throw new RangeError('conflicting original TopoDS sources claim one generated HLR edge');
  claimed.set(key,sourceEdgeId);
  rows.push({view,hlrClass,nativeWholeSolidEdgeOrdinal:ordinal,
   originalPhysicalSourceEdgeId:sourceEdgeId,
   nativeScopedGeneratedEdgeIsSame:true,
   completeOriginalSourceHistoryCertified:false,
   globalContinuousOcclusionCertified:false,signedV5Action:false});
 }
 return Object.freeze({schema:'draftai-c1-native-scoped-source-identity-conflicts/1',
  uniqueNativeClaims:rows.length,
  rows:Object.freeze(rows.map(r=>Object.freeze(r))),
  conflictingSourceClaimsRejected:true,
  fullOriginalSourceHistoryCertified:false,
  globalContinuousOcclusionCertified:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0});
}
module.exports={auditC1ScopedHLRGeneratedEdgeMatch,nativeScopedPaperSegmentsSame,
 auditC1ScopedHLRSourceIdentityConflicts};
