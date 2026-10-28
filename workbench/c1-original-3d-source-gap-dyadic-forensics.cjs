'use strict';
/**
 * Forensic witness for ACTUAL unsigned original-3D-source HLR parameter gaps.
 * The native M4/M5 consumer supplies the missing t intervals; this module
 * rebinds them to the original M0 physical edge and first-angle V/H/W.
 *
 * Exact dyadic signs show whether a positive source-space tail is real even
 * when interpolating its paper endpoints rounds both to one binary64 point.
 * No native generated TopoDS history, visibility, engineering style or V5
 * authority is inferred from this diagnostic.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {dyadic,difference,product,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const value of Object.values(x))freeze(value);
  Object.freeze(x);
 }
 return x;
};
function auditC1Original3DSourceGapDyadicWitness({
 geometry,view,sourceEdgeId,uncoveredIntervals
}={}){
 if(!geometry||typeof geometry.id!=='string'||!geometry.id||
    !VIEWS.includes(view)||typeof sourceEdgeId!=='string'||
    !Array.isArray(geometry.data?.edges)||!geometry.data?.points||
    !Array.isArray(uncoveredIntervals)||uncoveredIntervals.length>128)
  throw new TypeError('reviewed M0 source and bounded native HLR gap intervals required');
 const matches=geometry.data.edges.filter(e=>
  Array.isArray(e)&&e.length===2&&e.every(id=>
   typeof id==='string'&&Object.hasOwn(geometry.data.points,id))&&
  geometry.id+'::'+[...e].sort().join('|')===sourceEdgeId);
 if(matches.length!==1||matches[0][0]===matches[0][1])
  throw new RangeError('gap source must identify one original physical M0 edge');
 const vertexIds=matches[0];
 const [a,b]=vertexIds.map(id=>geometry.data.points[id]);
 if(![a,b].every(p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k])))||
    ['x','y','z'].every(k=>a[k]===b[k]))
  throw new RangeError('finite nondegenerate original 3D source required');
 const pa=project(a)[view],pb=project(b)[view];
 const spatialAxes=['x','y','z'],paperAxes=['u','v'];
 const exactDelta=(from,to,tSpan)=>sign(product(
  difference(dyadic(to),dyadic(from)),tSpan));
 const approximatePoint=t=>{
  if(t===0)return {...a};
  if(t===1)return {...b};
  const p=Object.fromEntries(spatialAxes.map(axis=>[
   axis,a[axis]+(b[axis]-a[axis])*t]));
  return spatialAxes.every(axis=>Number.isFinite(p[axis]))?p:null;
 };
 let last=0;
 const rows=uncoveredIntervals.map((range,index)=>{
  if(!Array.isArray(range)||range.length!==2||
     !range.every(t=>typeof t==='number'&&Number.isFinite(t))||
     range[0]<0||range[1]>1||range[0]>=range[1]||
     (index>0&&range[0]<last))
   throw new RangeError('positive, ordered, nonoverlapping original 3D source gaps required');
  last=range[1];
  const span=difference(dyadic(range[1]),dyadic(range[0]));
  const sourceSigns=Object.fromEntries(spatialAxes.map(axis=>[
   axis,exactDelta(a[axis],b[axis],span)]));
  const paperSigns=Object.fromEntries(paperAxes.map(axis=>[
   axis,exactDelta(pa[axis],pb[axis],span)]));
  const from=approximatePoint(range[0]),to=approximatePoint(range[1]);
  const roundedFrom=from?project(from)[view]:null;
  const roundedTo=to?project(to)[view]:null;
  return {
   gapOrdinal:index,originalSourceParameterRange:[...range],
   originalSourceFromVertexId:range[0]===0?vertexIds[0]:null,
   originalSourceToVertexId:range[1]===1?vertexIds[1]:null,
   exactDyadicOriginal3DGapComponentSigns:sourceSigns,
   exactDyadicProjectedGapComponentSigns:paperSigns,
   exactOriginal3DGapHasPositiveLength:
    spatialAxes.some(axis=>sourceSigns[axis]!==0),
   exactFirstAngleProjectedGapHasPositiveLength:
    paperAxes.some(axis=>paperSigns[axis]!==0),
   roundedInterpolatedModelGapEndpoints:[from,to],
   roundedInterpolatedPaperGapEndpoints:[roundedFrom,roundedTo],
   roundedPaperEndpointsCoincide:roundedFrom&&roundedTo?
    roundedFrom.u===roundedTo.u&&roundedFrom.v===roundedTo.v:null,
   originalGeneratedTopoDSHistoryCertified:false,
   continuousOcclusionCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  };
 });
 return freeze({
  schema:'draftai-c1-original-3d-source-gap-dyadic-forensics/1',
  sourceGeometryId:geometry.id,view,sourceEdgeId,
  originalSourceVertexIds:[...vertexIds],
  gapsExamined:rows.length,
  exact3DPositiveLengthGaps:rows.filter(x=>
   x.exactOriginal3DGapHasPositiveLength).length,
  positiveProjectedGapsHiddenByBinary64Interpolation:rows.filter(x=>
   x.exactFirstAngleProjectedGapHasPositiveLength&&
   x.roundedPaperEndpointsCoincide===true).length,
  rows,
  originalGeneratedTopoDSHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1Original3DSourceGapDyadicWitness};
