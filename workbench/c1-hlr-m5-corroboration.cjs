'use strict';
/** Compare external HLR hints against existing M5 positive open-ray evidence.
 * Never promote CAD classification to a certified drawing line or V5 action.
 */
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
function corroborateC1HlrWithM5({hlrEvidence,m5Evidence}={}){
 if(!hlrEvidence||hlrEvidence.schema!=='draftai-c1-hlr-candidate-evidence/1'||
    hlrEvidence.status!=='unverified-cad-candidates'||hlrEvidence.v5Ready!==false||
    !Array.isArray(hlrEvidence.candidates)||!Number.isSafeInteger(hlrEvidence.revision)||
    !m5Evidence||m5Evidence.revision!==hlrEvidence.revision||
    !Array.isArray(m5Evidence.segments))
  throw TypeError('C1 HLR and M5 same-revision evidence required');
 const findings=[];
 for(const hint of hlrEvidence.candidates){
  if(!hint||!['V','H','W'].includes(hint.view)||typeof hint.sourceEdgeId!=='string'||
     !['visible','hidden'].includes(hint.hlrClass)||
     hint.officialLineStyle!=='undetermined'||hint.v5Ready!==false)
   throw TypeError('C1 HLR hint cannot carry certified line style');
  const matching=m5Evidence.segments.filter(s=>s.view===hint.view&&s.sourceEdgeId===hint.sourceEdgeId);
  const supported=matching.length>0&&matching.every(s=>
   s.openInteriorVisibility===hint.hlrClass&&
   Array.isArray(s.sourceParameterRange)&&s.sourceParameterRange.length===2&&
   s.sourceParameterRange.every(Number.isFinite));
  const conflicting=matching.some(s=>
   ['visible','hidden'].includes(s.openInteriorVisibility)&&
   s.openInteriorVisibility!==hint.hlrClass);
  findings.push({view:hint.view,sourceEdgeId:hint.sourceEdgeId,
   hlrClass:hint.hlrClass,m5Status:conflicting?'conflict':supported?'corroborated-open-interior':'insufficient',
   officialLineStyle:'undetermined',v5Ready:false});
 }
 return freeze({schema:'draftai-c1-hlr-m5-corroboration/1',revision:hlrEvidence.revision,
  status:'diagnostic-only',findings,officialLineStylesVerified:false,
  constructionIntentSigned:false,v5Ready:false});
}
module.exports={corroborateC1HlrWithM5};
