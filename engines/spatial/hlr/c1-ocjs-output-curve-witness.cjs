'use strict';
/**
 * Independent witness for REAL HLR OUTPUT TopoDS curves, not original 3D edges.
 * Canonical first-angle observer frames flatten to XYZ=(paper U,paper V,0). A native
 * GeomAbs_Line is analytic across its finite parameter interval; five
 * sampled OCCT points confirm it agrees with extracted TopoDS vertices.
 * No HLR-to-original-TopoDS identity, M5 line style, or V5 authorization.
 */
const {VIEWS}=require('../../../core/projection/conventions.js');
function verifyOcjsHLRProjectedLineCurveWitness({
 view,projectedEndpoints,parameterRange,curveSamples,curveKind,
 curveIs3D
}={}){
 const valid2=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
 const valid3=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
 if(!VIEWS.includes(view)||curveKind!=='line'||
    !Array.isArray(projectedEndpoints)||projectedEndpoints.length!==2||
    !projectedEndpoints.every(valid2)||
    !Array.isArray(parameterRange)||parameterRange.length!==2||
    !parameterRange.every(Number.isFinite)||!(parameterRange[1]>parameterRange[0])||
    !Array.isArray(curveSamples)||curveSamples.length!==5||
    !curveSamples.every(valid3)||
    (curveIs3D!==undefined&&typeof curveIs3D!=='boolean'))
  throw new TypeError('finite real OCCT projected HLR line curve witness required');
 const [from,to]=projectedEndpoints;
 const difference=(p,q)=>Math.hypot(p.u-q.u,p.v-q.v);
 // A positive native HLR segment can be far shorter than 1e-8 mm.
 // Use exact received-vertex equality for collapse, and scale every
 // subsequent sample check to the actual positive span. Otherwise a
 // fabricated non-affine curve smaller than 1e-6 mm could pass the old
 // absolute tolerance while a real short source tail was discarded.
 if(from.u===to.u&&from.v===to.v)
  throw new RangeError('collapsed projected HLR BRep source cannot certify line');
 const span=difference(from,to);
 const sampleTolerance=Math.min(1e-6,span*1e-6);
 const samples=curveSamples.map(p=>{
  if(Math.abs(p.z)>1e-6)
   throw new RangeError('real OCCT HLR curve is not in flattened projection plane');
  return {u:p.x,v:p.y};
 });
 const direct=difference(samples[0],from)<=sampleTolerance&&
  difference(samples[4],to)<=sampleTolerance;
 const reverse=difference(samples[0],to)<=sampleTolerance&&
  difference(samples[4],from)<=sampleTolerance;
 if(!direct&&!reverse)
  throw new RangeError('real OCCT HLR curve endpoints disagree with projected vertices');
 for(let i=0;i<samples.length;i++){
  const t=i/4;
  const expected={
   u:samples[0].u+(samples[4].u-samples[0].u)*t,
   v:samples[0].v+(samples[4].v-samples[0].v)*t
  };
  if(difference(samples[i],expected)>sampleTolerance)
   throw new RangeError('nonaffine real OCCT HLR BRep line samples');
 }
 return {
  hlrView:view,actualOCCTHLRCurveType:'line',
  actualOCCTHLRCurveParameterRange:[...parameterRange],
  actualOCCTHLRCurveSamplesProjectedMm:samples,
  actualOCCTHLRFlattenedBRepLineVerified:true,
  actualOCCTHLRCurveOrientation:direct?'same-as-vertices':'reverse-of-vertices',
  actualOCCTHLRCurveEntireFiniteIntervalIsLine:true,
  actualOCCTHLRCurveBacking:curveIs3D===false?'surface-pcurve':
   curveIs3D===true?'native-3d':'not-specified-in-unit-test',
  originalTopoDSSourceForHLREdgeRecovered:false,
  formalStandardLineStyle:'undetermined',v5Authorized:false
 };
}
module.exports={verifyOcjsHLRProjectedLineCurveWitness};
