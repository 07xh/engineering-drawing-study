'use strict';
/**
 * Recheck an already discovered M4 original-edge crossing using EXACT
 * represented-binary64 dyadic determinants. This does NOT discover paper
 * crossings, replace M4, infer a generated OCCT TopoDS source edge or sign
 * a standard line. No epsilon, midpoint or rounded intersection sampling.
 *
 * For p(t)=P+t(R), q(u)=Q+u(S), the unique transverse paper event has
 * t = cross(Q-P,S)/cross(R,S), u=cross(Q-P,R)/cross(R,S).
 * At that same rational paper event, multiply the original signed 3D
 * observer-depth difference by the denominator; its exact sign is
 * sign(D * depth0 + tNum * depthR - uNum * depthS) * sign(D).
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {dyadic,difference:sub,product:mul,sum,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
const d=dyadic,zero=d(0);
const vec2=(a,b)=>({u:sub(d(b.u),d(a.u)),
 v:sub(d(b.v),d(a.v))});
const cross=(a,b)=>sub(mul(a.u,b.v),mul(a.v,b.u));
const diff3=(a,b)=>({x:sub(d(a.x),d(b.x)),
 y:sub(d(a.y),d(b.y)),z:sub(d(a.z),d(b.z))});
const dot=(a,r)=>['x','y','z'].reduce((x,axis)=>
 sum(x,mul(a[axis],d(r[axis]))),zero);
const strictUnitFraction=(num,den)=>{
 const s=sign(den);
 return s!==0&&sign(num)*s>0&&sign(sub(den,num))*s>0;
};
const closedUnitFraction=(num,den)=>{
 const s=sign(den);
 return s!==0&&sign(num)*s>=0&&sign(sub(den,num))*s>=0;
};
function exactOriginalM4TransverseCrossingDepth({
 geometry,view,firstEdge,secondEdge,nativeFirstOriginalParameterRange=[0,1]
}={}){
 if(!VIEWS.includes(view)||!geometry?.data?.points||
    !Array.isArray(firstEdge)||firstEdge.length!==2||
    !Array.isArray(secondEdge)||secondEdge.length!==2||
    firstEdge.some(x=>typeof x!=='string')||
    secondEdge.some(x=>typeof x!=='string')||
    !Array.isArray(nativeFirstOriginalParameterRange)||
    nativeFirstOriginalParameterRange.length!==2||
    !nativeFirstOriginalParameterRange.every(Number.isFinite)||
    nativeFirstOriginalParameterRange[0]<0||
    nativeFirstOriginalParameterRange[1]>1||
    nativeFirstOriginalParameterRange[0]>=nativeFirstOriginalParameterRange[1])
  throw new TypeError('current M0 original 3D physical edge pair and first-angle view required');
 const points=geometry.data.points;
 const [a,b,c,e]=[...firstEdge,...secondEdge].map(x=>points[x]);
 if(![a,b,c,e].every(x=>x&&['x','y','z'].every(k=>
   typeof x[k]==='number'&&Number.isFinite(x[k]))))
  throw new RangeError('missing finite original 3D source endpoint');
 const [pa,pb,pc,pd]=[a,b,c,e].map(x=>project(x)[view]);
 const R=vec2(pa,pb),S=vec2(pc,pd);
 const denom=cross(R,S),detSign=sign(denom);
 if(detSign===0)return freeze({
  exactM4TransverseProjectedLineIntersectionProven:false,
  reason:'exact-projected-lines-parallel-or-collinear',
  bothOriginalSourceOpenParameterRangesContainCrossing:false,
  strictOriginal3DObserverDepthOrderAtPaperCrossingProven:false,
  exactOriginalSourceAtCrossingFront:null,
  crossingCreatesOriginal3DPhysicalVertex:false,
  actualOCCTGeneratedHLREdgeToSourceHistoryProven:false,
  sceneCompleteOcclusionAndGlobalJoinCertified:false,
  officialEngineeringStyle:'undetermined',signedV5Action:false
 });
 const qp=vec2(pa,pc),tNumer=cross(qp,S),uNumer=cross(qp,R);
 const interiorFirst=strictUnitFraction(tNumer,denom),
  interiorSecond=strictUnitFraction(uNumer,denom),
  closedSecond=closedUnitFraction(uNumer,denom);
 const [lo,hi]=nativeFirstOriginalParameterRange;
 const sourceIsInNativeOpenRange=interiorFirst&&
  sign(sub(tNumer,mul(d(lo),denom)))*detSign>0&&
  sign(sub(mul(d(hi),denom),tNumer))*detSign>0;
 // The other ORIGINAL edge can meet this native HLR stroke at its true
 // source ENDPOINT. That is a valid LOCAL depth comparison but NOT a
 // 3D or generated HLR junction without separate topology evidence.
 const samePaperAndInterior=sourceIsInNativeOpenRange&&closedSecond;
 const ray=FIRST_ANGLE_OBSERVER_RAYS[view],
  base=dot(diff3(a,c),ray),
  firstSlope=dot(diff3(b,a),ray),
  secondSlope=dot(diff3(e,c),ray);
 const depthNum=sum(sum(mul(denom,base),mul(tNumer,firstSlope)),
  {n:-mul(uNumer,secondSlope).n,e:mul(uNumer,secondSlope).e});
 const signed=sign(depthNum)*detSign;
 return freeze({
  exactM4TransverseProjectedLineIntersectionProven:true,
  reason:samePaperAndInterior?
   signed===0?'original-sources-tie-in-observer-depth-at-exact-crossing':
    'exact-original-3d-crossing-observer-depth-order':
   'original-2d-infinite-lines-cross-outside-source-open-segment',
  firstOriginalOpenSourceContainsExactCrossing:interiorFirst,
  secondOriginalOpenSourceContainsExactCrossing:interiorSecond,
  secondOriginalClosedSourceContainsExactCrossing:closedSecond,
  otherOriginal3DEdgeEndpointAtPaperCrossing:
   samePaperAndInterior&&!interiorSecond,
  originalNativeHLRSourceIntervalContainsExactRationalCrossing:
   sourceIsInNativeOpenRange,
  bothOriginalSourceOpenParameterRangesContainCrossing:samePaperAndInterior,
  strictOriginal3DObserverDepthOrderAtPaperCrossingProven:
   samePaperAndInterior&&signed!==0,
  exactOriginalSourceAtCrossingFront:
   samePaperAndInterior&&signed!==0?(signed>0?'first':'second'):null,
  exactDepthTieAtCrossing:samePaperAndInterior&&signed===0,
  // Crossing parameters are exact dyadic RATIONALS, intentionally not
  // coerced to inaccurate JS floats or used as a new M4 event cut.
  exactFirstCrossingParameterInFullOriginalOpenSource:interiorFirst,
  currentNativeOriginalOpenIntervalContainsExactCrossing:
   sourceIsInNativeOpenRange,
  exactSecondCrossingParameterInFullOriginalOpenSource:interiorSecond,
  original3DPhysicalVertexJunctionCertified:false,
  crossingCreatesOriginal3DPhysicalVertex:false,
  thirdPartyOpaqueFaceVisibilityAndDepthSwitchProven:false,
  actualOCCTGeneratedHLREdgeToSourceHistoryProven:false,
  sceneCompleteOcclusionAndGlobalJoinCertified:false,
  officialEngineeringStyle:'undetermined',signedV5Action:false
 });
}
module.exports={exactOriginalM4TransverseCrossingDepth};
