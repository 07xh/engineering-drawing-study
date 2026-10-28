'use strict';
/**
 * Exact 2D affine incidence of RECEIVED binary64 HLR paper endpoints with
 * the original M0 projected source. This is a cross-axis check independent
 * of dominant-axis inverse-t coverage. It detects arbitrarily small signed
 * transverse drift without introducing a tolerance or trusting 2D aliasing
 * as original TopoDS history. OCCT projection rounding may produce nonzero
 * residuals: report them, never silently snap or authorize V5.
 */
const {dyadic,difference,product,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
function auditC1ExactBinary64PaperAffineWitness({
 sourceFrom,sourceTo,measuredFrom,measuredTo
}={}){
 const valid=p=>p&&typeof p.u==='number'&&Number.isFinite(p.u)&&
  typeof p.v==='number'&&Number.isFinite(p.v);
 if(![sourceFrom,sourceTo,measuredFrom,measuredTo].every(valid))
  throw new TypeError('finite M0 and HLR paper endpoints required');
 const aU=dyadic(sourceFrom.u),aV=dyadic(sourceFrom.v);
 const du=difference(dyadic(sourceTo.u),aU);
 const dv=difference(dyadic(sourceTo.v),aV);
 if(sign(du)===0&&sign(dv)===0)
  throw new RangeError('collapsed original M0 paper source has no affine line');
 const orientation=p=>sign(difference(
  product(difference(dyadic(p.u),aU),dv),
  product(difference(dyadic(p.v),aV),du)));
 const from=orientation(measuredFrom),to=orientation(measuredTo);
 return Object.freeze({
  exactBinary64PaperFromSignedCrossProductSign:from,
  exactBinary64PaperToSignedCrossProductSign:to,
  nativeFromExactlyOnOriginalBinary64PaperLine:from===0,
  nativeToExactlyOnOriginalBinary64PaperLine:to===0,
  bothNativeEndpointsExactlyOnOriginalBinary64PaperLine:from===0&&to===0,
  exactForReceivedBinary64PaperCoordinates:true,
  originalTopoDSHistoryCertified:false,
  original3DEndpointTopologyCertified:false,
  globalContinuousVisibilityCertified:false,
  engineeringLineStyle:'undetermined',
  signedV5Action:false
 });
}
module.exports={auditC1ExactBinary64PaperAffineWitness};
