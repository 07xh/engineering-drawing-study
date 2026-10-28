'use strict';
/**
 * Unsigned C1 forensic mapping from an ACTUAL original OCCT BRepAdaptor_Curve
 * parameter interval to the independently reviewed M0 physical edge t=[0,1].
 * This is NOT a generated HLR edge -> original TopoDS history API.
 *
 * BRepAdaptor Value(FirstParameter/LastParameter) endpoints, not
 * TopExp_Explorer traversal order, determine the original curve direction.
 * Exact binary64 dyadics retain positive native-curve tails when evaluating
 * first + length*t rounds both endpoints to the same Number.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {dyadic,difference,product,sum,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const finite3=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const value of Object.values(x))freeze(value);
  Object.freeze(x);
 }
 return x;
};
function auditC1OriginalOcctCurveParameterGapWitness({
 geometry,view,sourceEdgeId,originalBRepSource,uncoveredIntervals
}={}){
 if(!geometry||typeof geometry.id!=='string'||!geometry.id||
    !VIEWS.includes(view)||typeof sourceEdgeId!=='string'||
    !Array.isArray(geometry.data?.edges)||!geometry.data?.points||
    !Array.isArray(uncoveredIntervals)||uncoveredIntervals.length>128)
  throw new TypeError('reviewed C1 M0 source, view and bounded native gaps required');
 const matching=geometry.data.edges.filter(edge=>
  Array.isArray(edge)&&edge.length===2&&edge[0]!==edge[1]&&
  edge.every(id=>typeof id==='string'&&Object.hasOwn(geometry.data.points,id))&&
  geometry.id+'::'+[...edge].sort().join('|')===sourceEdgeId);
 if(matching.length!==1)
  throw new RangeError('original physical M0 source must be unique');
 const [aId,bId]=matching[0],[a,b]=[aId,bId].map(id=>geometry.data.points[id]);
 const original=originalBRepSource;
 const range=original?.occtSourceCurveParameterRange;
 const firstPoint=original?.occtSourceCurveFirstPoint3D,
  lastPoint=original?.occtSourceCurveLastPoint3D;
 if(!finite3(a)||!finite3(b)||!finite3(firstPoint)||!finite3(lastPoint)||
    original?.sourceEdgeId!==sourceEdgeId||
    original?.originalOCCTBRepVertexXYZMatched!==true||
    original?.occtCurveTypeIndependentlyVerified!==true||
    original?.occtSourceCurve3DEndpointsAndMidpointVerified!==true||
    original?.occtSourceCurveType!=='line'||
    !Array.isArray(range)||range.length!==2||
    !range.every(Number.isFinite)||!(range[1]>range[0]))
  throw new TypeError('actual original OCCT line BRepAdaptor endpoint/parameter evidence required');
 const physicalLength=dist(a,b),parameterSpan=range[1]-range[0];
 if(!Number.isFinite(physicalLength)||!(physicalLength>1e-8)||
    !Number.isFinite(parameterSpan)||!(parameterSpan>0)||
    Math.abs(parameterSpan-physicalLength)>1e-6*Math.max(1,physicalLength))
  throw new RangeError('native OCCT line curve parameters contradict M0 3D length');
 const tol=Math.min(1e-7,physicalLength/8);
 const direct=dist(firstPoint,a)<=tol&&dist(lastPoint,b)<=tol;
 const reverse=dist(firstPoint,b)<=tol&&dist(lastPoint,a)<=tol;
 if(direct===reverse)
  throw new RangeError('original OCCT curve direction missing or ambiguous against M0');
 const delta=difference(dyadic(range[1]),dyadic(range[0]));
 const exactAt=t=>{
  const scaled=product(delta,dyadic(t));
  return direct?sum(dyadic(range[0]),scaled):
   difference(dyadic(range[1]),scaled);
 };
 const roundedAt=t=>direct?
  range[0]+parameterSpan*t:range[1]-parameterSpan*t;
 let previous=0;
 const rows=uncoveredIntervals.map((gap,index)=>{
  if(!Array.isArray(gap)||gap.length!==2||
     !gap.every(x=>typeof x==='number'&&Number.isFinite(x))||
     gap[0]<0||gap[1]>1||!(gap[1]>gap[0])||
     (index>0&&gap[0]<previous))
   throw new RangeError('ordered positive native original-source parameter gaps required');
  previous=gap[1];
  const exactFrom=exactAt(gap[0]),exactTo=exactAt(gap[1]);
  const exactDirection=sign(difference(exactTo,exactFrom));
  if(exactDirection!==(direct?1:-1))
   throw new RangeError('positive M0 gap lost in exact OCCT source curve');
  const roundedFrom=roundedAt(gap[0]),roundedTo=roundedAt(gap[1]);
  return {
   gapOrdinal:index,originalM0SourceParameterGap:[...gap],
   originalM0FromVertexId:gap[0]===0?aId:null,
   originalM0ToVertexId:gap[1]===1?bId:null,
   originalOcctCurveParameterGapRounded:[roundedFrom,roundedTo],
   exactOriginalOcctCurveParameterGapHasPositiveLength:true,
   exactOriginalOcctCurveParameterGapDirection:exactDirection,
   roundedOriginalOcctCurveParameterGapCollapsed:
    roundedFrom===roundedTo,
   actualOriginalBRepCurveParametersOnly:true,
   generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
   continuousOcclusionCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  };
 });
 return freeze({
  schema:'draftai-c1-original-occt-curve-parameter-gap-witness/1',
  view,sourceEdgeId,originalM0SourceVertexIds:[aId,bId],
  originalOcctCurveFirstParameterVertexId:direct?aId:bId,
  originalOcctCurveLastParameterVertexId:direct?bId:aId,
  originalOcctCurveParameterIncreasesWithM0SourceParameter:direct,
  actualOriginalOcctCurveParameterRange:[...range],
  actualOriginalOcctCurveFirstPoint3D:{...firstPoint},
  actualOriginalOcctCurveLastPoint3D:{...lastPoint},
  gapsExamined:rows.length,rows,
  roundedCollapsedButExactPositiveNativeCurveGaps:
   rows.filter(x=>x.roundedOriginalOcctCurveParameterGapCollapsed).length,
  generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1OriginalOcctCurveParameterGapWitness};
