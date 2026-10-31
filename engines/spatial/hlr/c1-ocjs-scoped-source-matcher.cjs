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
/**
 * Necessary SAME-RUN global generated 3D->2D HLR paper corroboration.
 * OCCT's two extraction paths can round coordinates differently, but a
 * millimetre-scale tolerance cannot stand in for generated TopoDS history.
 * An exact match is allowed at ANY positive binary64 span (including a
 * subnormal one); otherwise every received endpoint must stay within ONE
 * binary64 ULP at the source-paper coordinate scale, additionally capped by
 * one-millionth of the actual 3D projected span. This does not certify
 * original->generated edge identity or close even a one-ULP M5 gap.
 */
const ulpWords=new DataView(new ArrayBuffer(8));
const oneUlpAtScale=x=>{
 ulpWords.setFloat64(0,x,false);
 const exponent=(ulpWords.getUint32(0,false)>>>20)&0x7ff;
 return exponent<=1?Number.MIN_VALUE:2**(exponent-1023-52);
};
function auditC1Global3D2DPaperPairEnvelope(source3DPaper,generated2DPaper){
 if(![source3DPaper,generated2DPaper].every(s=>
     valid(s?.from)&&valid(s?.to)&&
     (s.from.u!==s.to.u||s.from.v!==s.to.v)))
  throw new TypeError('two noncollapsed finite native 3D/2D HLR paper edges required');
 const same=(a,b)=>a.u===b.u&&a.v===b.v;
 const direct=same(source3DPaper.from,generated2DPaper.from)&&
  same(source3DPaper.to,generated2DPaper.to);
 const reverse=same(source3DPaper.from,generated2DPaper.to)&&
  same(source3DPaper.to,generated2DPaper.from);
 if(direct||reverse)return Object.freeze({
  compatible:true,exactBinary64Endpoints:true,
  sourceScaleOneULPBoundedRoundingOnly:false,
  originalGeneratedTopoDSHistoryCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
 const span=Math.hypot(
  source3DPaper.to.u-source3DPaper.from.u,
  source3DPaper.to.v-source3DPaper.from.v);
 // Each axis gets its OWN original segment-scale ULP. Native OCCT
 // pcurve extraction may round an endpoint at zero by one ULP of the
 // SAME-axis source extent (e.g. V=23 -> V=-(2**-48) at the origin).
 // An unrelated huge V offset must not enlarge the U budget.
 // This is a necessary unsigned paper witness, NOT a proof that a
 // positive gap is closed or that generated TopoDS history exists.
 const cap=Number.isFinite(span)&&span>0?span*1e-6:0;
 const axisBound=axis=>Math.min(oneUlpAtScale(Math.max(
  Math.abs(source3DPaper.from[axis]),Math.abs(source3DPaper.to[axis]))),cap);
 const uBudget=axisBound('u'),vBudget=axisBound('v');
 const budget=Math.max(uBudget,vBudget);
 const close=(a,b)=>Math.abs(a.u-b.u)<=uBudget&&
  Math.abs(a.v-b.v)<=vBudget;
 const compatible=budget>0&&(
  close(source3DPaper.from,generated2DPaper.from)&&
  close(source3DPaper.to,generated2DPaper.to)||
  close(source3DPaper.from,generated2DPaper.to)&&
  close(source3DPaper.to,generated2DPaper.from));
 return Object.freeze({
  compatible,exactBinary64Endpoints:false,
  sourceScaleOneULPBoundedRoundingOnly:compatible,
  absolutePaperEnvelopeMm:budget,
  originalGeneratedTopoDSHistoryCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}
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
  if(forward){
   // A tolerant discovery match must NEVER certify a native TopoDS
   // identity. The scoped and global output paths may round their paper
   // coordinates independently, but at most by one source-scale ULP.
   // This is necessary only: it cannot close a positive M5 paper gap.
   const strictPaper=auditC1Global3D2DPaperPairEnvelope(seg,scopedSegment);
   if(!samePaper||!strictPaper.compatible)
    throw new RangeError('native IsSame generated HLR edge has inconsistent paper endpoints');
   same.push(i);
  }
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
function auditC1ScopedHLRSourceIdentityConflicts({matches,wholeSolidCounts}={}){
 if(!Array.isArray(matches)||matches.length>1024)
  throw new TypeError('genuine scoped HLR match inventory required');
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
 let wholeSolidNativeGeneratedEdgeCount=null;
 let unclaimedWholeSolidGeneratedEdgeOrdinals=null;
 if(wholeSolidCounts!==undefined){
  if(new Set(matches.map(m=>m.view)).size>1)
   throw new RangeError('one whole-solid inventory must belong to one HLR view');
  if(!wholeSolidCounts||typeof wholeSolidCounts!=='object'||
     !['visible-sharp','hidden-sharp'].every(klass=>
      Number.isSafeInteger(wholeSolidCounts[klass])&&
      wholeSolidCounts[klass]>=0&&wholeSolidCounts[klass]<=128))
   throw new TypeError('actual whole-solid visible/hidden native HLR counts required');
  wholeSolidNativeGeneratedEdgeCount=
   wholeSolidCounts['visible-sharp']+wholeSolidCounts['hidden-sharp'];
  unclaimedWholeSolidGeneratedEdgeOrdinals=[];
  for(const klass of ['visible-sharp','hidden-sharp'])
   for(let ordinal=0;ordinal<wholeSolidCounts[klass];ordinal++){
    const found=rows.some(r=>r.hlrClass===klass&&
     r.nativeWholeSolidEdgeOrdinal===ordinal);
    if(!found)unclaimedWholeSolidGeneratedEdgeOrdinals.push(
     Object.freeze({hlrClass:klass,ordinal}));
   }
  // Each native generated ordinal is a distinct TopoDS object in the
  // whole-solid compound. The same ordinal cannot be consumed twice even
  // if the original source label is identical and scoped output is split.
  for(const r of rows)if(r.nativeWholeSolidEdgeOrdinal>=wholeSolidCounts[r.hlrClass])
   throw new RangeError('scoped source claims nonexistent whole-solid native HLR edge');
 }
 return Object.freeze({schema:'draftai-c1-native-scoped-source-identity-conflicts/1',
  uniqueNativeClaims:rows.length,
  wholeSolidNativeGeneratedEdgeCount,
  unclaimedWholeSolidGeneratedEdgeOrdinals:unclaimedWholeSolidGeneratedEdgeOrdinals===null?
   null:Object.freeze(unclaimedWholeSolidGeneratedEdgeOrdinals),
  everyWholeSolidGeneratedEdgeHasNativeScopedIdentityClaim:
   unclaimedWholeSolidGeneratedEdgeOrdinals!==null&&
   unclaimedWholeSolidGeneratedEdgeOrdinals.length===0,
  rows:Object.freeze(rows.map(r=>Object.freeze(r))),
  conflictingSourceClaimsRejected:true,
  fullOriginalSourceHistoryCertified:false,
  globalContinuousOcclusionCertified:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0});
}
module.exports={auditC1ScopedHLRGeneratedEdgeMatch,nativeScopedPaperSegmentsSame,
 auditC1Global3D2DPaperPairEnvelope,auditC1ScopedHLRSourceIdentityConflicts};
