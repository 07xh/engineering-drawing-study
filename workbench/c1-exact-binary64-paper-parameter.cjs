'use strict';
/**
 * Exact binary64 PAPER-parameter bounds and ordering for a candidate original
 * 3D edge and two actual source-filtered HLR projected endpoints.
 *
 * Reuse M0's dyadic arithmetic rather than dividing rounded paper coordinates.
 * This detects one-ULP outside-domain endpoints and positive intervals whose
 * floating-point inverse parameters both round to the same Number.
 *
 * The result is only a diagnostic for the RECEIVED binary64 paper coordinates:
 * it does not recover generated-to-original TopoDS history, exact OCCT curve
 * parameters, continuous all-face occlusion, GB line style or V5 authority.
 */
const {dyadic,difference,sign}=require('../core/numeric/binary64-dyadic.cjs');
function auditExactBinary64PaperParameterPair({
 sourceFrom,sourceTo,measuredFrom,measuredTo
}={}){
 const valid=p=>p&&typeof p.u==='number'&&Number.isFinite(p.u)&&
  typeof p.v==='number'&&Number.isFinite(p.v);
 if(![sourceFrom,sourceTo,measuredFrom,measuredTo].every(valid))
  throw new TypeError('finite original and native HLR paper endpoints required');
 // Use the same dominant projected coordinate as the existing source-scoped
 // consumer, but compare it as exact dyadic integers rather than rounded t.
 const axis=Math.abs(sourceTo.u-sourceFrom.u)>=
  Math.abs(sourceTo.v-sourceFrom.v)?'u':'v';
 const a=dyadic(sourceFrom[axis]),b=dyadic(sourceTo[axis]);
 const delta=difference(b,a),direction=sign(delta);
 if(direction===0)
  throw new RangeError('original projected source has no invertible paper axis');
 const n0=difference(dyadic(measuredFrom[axis]),a);
 const n1=difference(dyadic(measuredTo[axis]),a);
 const within=n=>sign(n)*direction>=0&&
  sign(difference(delta,n))*direction>=0;
 const order=sign(difference(n1,n0))*direction;
 return Object.freeze({
  dominantOriginalProjectionAxis:axis,
  nativeFromWithinExactBinary64OriginalParameterDomain:within(n0),
  nativeToWithinExactBinary64OriginalParameterDomain:within(n1),
  exactBinary64OriginalSourceParameterOrder:order,
  nativePaperSourceParameterPairHasExactPositiveSpan:order!==0,
  exactForReceivedBinary64PaperCoordinates:true,
  generatedToOriginalTopoDSHistoryCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}
module.exports={auditExactBinary64PaperParameterPair};
