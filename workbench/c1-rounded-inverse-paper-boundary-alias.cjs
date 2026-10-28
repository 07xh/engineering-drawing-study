'use strict';
/**
 * Fail-closed C1 check for a native HLR paper endpoint whose ordinary
 * inverse projection rounded to original source t=0 or t=1.
 *
 * An interior received binary64 paper point can have t rounded to zero
 * (e.g. Number.MIN_VALUE / 10). It is not the original M0 vertex.
 * This is PAPER evidence only; no generated TopoDS history or M5 signoff.
 */
const {dyadic,difference,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
function auditC1RoundedInversePaperBoundaryAlias({
 sourceFrom,sourceTo,measuredFrom,measuredTo,roundedInverseParameters
}={}){
 const valid=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
 if(![sourceFrom,sourceTo,measuredFrom,measuredTo].every(valid)||
    !Array.isArray(roundedInverseParameters)||
    roundedInverseParameters.length!==2||
    !roundedInverseParameters.every(t=>typeof t==='number'&&
     Number.isFinite(t)&&t>=0&&t<=1))
  throw new TypeError('finite native paper endpoints and bounded rounded inverse parameters required');
 if(sourceFrom.u===sourceTo.u&&sourceFrom.v===sourceTo.v)
  throw new RangeError('collapsed original paper source has no boundary inverse');
 const received=[measuredFrom,measuredTo];
 const rows=roundedInverseParameters.map((t,i)=>{
  const boundary=t===0?'from':t===1?'to':null;
  const original=boundary==='from'?sourceFrom:
   boundary==='to'?sourceTo:null;
  const exactDeltaSigns=original?Object.freeze({
   u:sign(difference(dyadic(received[i].u),dyadic(original.u))),
   v:sign(difference(dyadic(received[i].v),dyadic(original.v)))
  }):null;
  return Object.freeze({
   nativeEndpointSide:i===0?'from':'to',
   roundedInverseParameter:t,
   roundedInverseOriginalBoundary:boundary,
   exactBinary64PaperDeltaSigns:exactDeltaSigns,
   roundedInverseAliasesDifferentReceivedPaperPoint:
    original!==null&&(exactDeltaSigns.u!==0||exactDeltaSigns.v!==0)
  });
 });
 return Object.freeze({
  schema:'draftai-c1-rounded-inverse-paper-boundary-alias/1',
  rows:Object.freeze(rows),
  anyRoundedInverseBoundaryAlias:rows.some(r=>
   r.roundedInverseAliasesDifferentReceivedPaperPoint),
  exactForReceivedBinary64PaperCoordinates:true,
  generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
  continuousOcclusionCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}
module.exports={auditC1RoundedInversePaperBoundaryAlias};
