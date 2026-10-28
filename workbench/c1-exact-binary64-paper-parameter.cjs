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

/**
 * Independently union the EXACT rational inverse parameters of RECEIVED
 * binary64 native HLR paper endpoints. Unlike Number division, this detects
 * an interior endpoint rounded to t=0/1 and gaps between two separately
 * rounded source-filtered fragments. It is forensic PAPER evidence only:
 * no TopoDS history, all-face ray proof, engineering style or V5 signoff.
 */
function auditExactBinary64PaperCandidateCoverage({
 sourceFrom,sourceTo,segments
}={}){
 const valid=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
 if(!valid(sourceFrom)||!valid(sourceTo)||
    !Array.isArray(segments)||segments.length>512)
  throw new TypeError('finite original paper source and bounded native segments required');
 const axis=Math.abs(sourceTo.u-sourceFrom.u)>=
  Math.abs(sourceTo.v-sourceFrom.v)?'u':'v';
 const a=dyadic(sourceFrom[axis]);
 const delta=difference(dyadic(sourceTo[axis]),a);
 if(sign(delta)===0)
  throw new RangeError('original projected source has no invertible paper axis');
 const zero={n:0n,d:1n},one={n:1n,d:1n};
 const gcd=(a,b)=>{
  while(b!==0n){const r=a%b;a=b;b=r;}
  return a;
 };
 const ratio=point=>{
  const offset=difference(dyadic(point[axis]),a);
  const e=Math.min(offset.e,delta.e);
  let n=offset.n<<BigInt(offset.e-e);
  let d=delta.n<<BigInt(delta.e-e);
  if(d<0n){n=-n;d=-d;}
  const factor=gcd(n<0n?-n:n,d);
  return {n:n/factor,d:d/factor};
 };
 const compare=(x,y)=>{
  const v=x.n*y.d-y.n*x.d;
  return v<0n?-1:v>0n?1:0;
 };
 const printable=x=>x.d===1n?String(x.n):String(x.n)+'/'+String(x.d);
 const parts=[];let zeroLength=0;
 for(const segment of segments){
  if(!valid(segment?.from)||!valid(segment?.to))
   throw new TypeError('finite native paper segment required');
  const x=ratio(segment.from),y=ratio(segment.to);
  if(compare(x,zero)<0||compare(x,one)>0||
     compare(y,zero)<0||compare(y,one)>0)
   throw new RangeError('native paper candidate outside exact original source domain');
  const order=compare(x,y);
  if(order===0){zeroLength++;continue;}
  parts.push(order<0?[x,y]:[y,x]);
 }
 parts.sort((a,b)=>compare(a[0],b[0])||compare(a[1],b[1]));
 const gaps=[],covered=[];let reach=zero;
 for(const [start,end] of parts){
  if(compare(start,reach)>0)gaps.push([reach,start]);
  if(compare(end,reach)>0){
   if(covered.length&&compare(start,covered.at(-1)[1])<=0)
    covered.at(-1)[1]=end;
   else covered.push([start,end]);
   reach=end;
  }
 }
 if(compare(reach,one)<0)gaps.push([reach,one]);
 const serialize=rows=>rows.map(pair=>pair.map(printable));
 const result={
  dominantOriginalProjectionAxis:axis,
  exactBinary64PaperCandidateCoverageComplete:gaps.length===0,
  exactBinary64PaperPositiveLengthUncoveredIntervals:serialize(gaps),
  exactBinary64PaperPositiveLengthCoveredIntervals:serialize(covered),
  nativePaperSegmentsExamined:segments.length,
  exactPositiveLengthPaperSegments:parts.length,
  exactZeroLengthDominantAxisSegments:zeroLength,
  exactForReceivedBinary64PaperCoordinates:true,
  generatedToOriginalTopoDSHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 };
 for(const row of [...result.exactBinary64PaperPositiveLengthUncoveredIntervals,
                    ...result.exactBinary64PaperPositiveLengthCoveredIntervals])
  Object.freeze(row);
 Object.freeze(result.exactBinary64PaperPositiveLengthUncoveredIntervals);
 Object.freeze(result.exactBinary64PaperPositiveLengthCoveredIntervals);
 return Object.freeze(result);
}

module.exports={auditExactBinary64PaperParameterPair,auditExactBinary64PaperCandidateCoverage};
