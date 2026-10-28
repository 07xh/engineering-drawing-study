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
const paperSame=(a,b,tol=1e-6)=>
 Math.hypot(a.u-b.u,a.v-b.v)<=tol;
function auditC1ScopedHLRGeneratedEdgeMatch({
 view,hlrClass,sourceEdgeId,globalSegments,globalNativeEdges,
 scopedSegment,scopedNativeEdge
}={}){
 if(!VIEWS.includes(view)||!['visible-sharp','hidden-sharp'].includes(hlrClass)||
    typeof sourceEdgeId!=='string'||!sourceEdgeId||
    !Array.isArray(globalSegments)||!Array.isArray(globalNativeEdges)||
    globalSegments.length!==globalNativeEdges.length||!globalSegments.length||
    !valid(scopedSegment?.from)||!valid(scopedSegment?.to)||
    typeof scopedNativeEdge?.IsSame!=='function'||scopedNativeEdge.IsNull?.()===true||
    scopedNativeEdge.IsSame(scopedNativeEdge)!==true)
  throw new TypeError('genuine source-scoped and whole-solid OCCT HLR edges required');
 const paper=[],same=[],partner=[],partnerPaper=[];
 let partnerRelationSupported=typeof scopedNativeEdge.IsPartner==='function',
  partnerRelationComparisons=0;
 for(let i=0;i<globalSegments.length;i++){
  const seg=globalSegments[i],native=globalNativeEdges[i];
  if(!valid(seg?.from)||!valid(seg?.to)||typeof native?.IsSame!=='function'||
     native.IsNull?.()===true||native.IsSame(native)!==true)
   throw new TypeError('complete native whole-solid HLR edge inventory required');
  const forward=scopedNativeEdge.IsSame(native),reverse=native.IsSame(scopedNativeEdge);
  if(typeof forward!=='boolean'||typeof reverse!=='boolean'||forward!==reverse)
   throw new RangeError('asymmetric native scoped/global TopoDS IsSame');
  const samePaper=paperSame(seg.from,scopedSegment.from)&&paperSame(seg.to,scopedSegment.to)||
   paperSame(seg.from,scopedSegment.to)&&paperSame(seg.to,scopedSegment.from);
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
module.exports={auditC1ScopedHLRGeneratedEdgeMatch};
