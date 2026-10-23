'use strict';
/**
 * DraftAI P0 R3: DIGITAL COMPASS + RULER - mathematical primitives only.
 * Students choose source geometry, sign/radius and candidate branch themselves.
 * This code does not pretend a verified CENTER is a complete directed fillet.
 * All inputs and tolerances are in MODEL MILLIMETRES, never SVG pixels.
 */
const {normalizedLine,offsetLine,signedDistance}=require('../engines/planar/offset-tangency.cjs');
const {circleCircleFilletCenters}=require('../engines/planar/circle-circle-fillet.cjs');
const {finiteTwoSegmentFillets}=require('../engines/planar/two-segment-fillet.cjs');
const {finiteSegmentCircleFillets}=require('../engines/planar/segment-circle-fillet.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const pt=p=>!!p&&typeof p==='object'&&finite(p.x)&&finite(p.y);
const revisionCheck=n=>{
 if(!Number.isSafeInteger(n)||n<0)throw new TypeError('nonnegative input revision required');
 return n;
};
const clonePoint=p=>({x:p.x,y:p.y});
function constructParallelLine(source,signedOffsetMm,{revision=0}={}){
 revisionCheck(revision);
 if(!finite(signedOffsetMm)||signedOffsetMm===0)
  throw new RangeError('finite nonzero signed offset in millimetres required');
 const base=normalizedLine(source);
 const shifted=offsetLine(source,signedOffsetMm);
 if(!pt(shifted.a)||!pt(shifted.b))
  throw new RangeError('ruler offset coordinate overflow');
 const r=Math.max(Math.abs(signedDistance(shifted.a,source)-signedOffsetMm),
  Math.abs(signedDistance(shifted.b,source)-signedOffsetMm));
 if(!finite(r)||r>1e-7*Math.max(1,Math.abs(signedOffsetMm),base.length))
  throw new RangeError('computed parallel offset failed mathematical residual');
 return {tool:'parallel-ruler',kind:'line',coordinateSpace:'model-mm',
  revision,from:clonePoint(shifted.a),to:clonePoint(shifted.b),
  signedOffsetMm,offsetResidualMm:r,
  proofScope:'parallel-line-construction-only'};
}
function constructConcentricCircle(source,radiusMm,{revision=0}={}){
 revisionCheck(revision);
 if(!source||!pt(source.center)||!finite(source.radius)||source.radius<=0)
  throw new TypeError('valid source circle required');
 if(!finite(radiusMm)||radiusMm<=0)
  throw new RangeError('positive compass radius in millimetres required');
 return {tool:'concentric-compass',kind:'circle',coordinateSpace:'model-mm',
  revision,center:clonePoint(source.center),radius:radiusMm,
  proofScope:'concentric-circle-construction-only'};
}
function snapChosenFilletCenter(kind,args,stroke,{branchId,revision=0,toleranceMm=0.75}={}){
 revisionCheck(revision);
 if(!['circles','segments','segment-circle'].includes(kind))
  throw new TypeError('supported fillet kind required');
 if(!finite(toleranceMm)||toleranceMm<=0||toleranceMm>2)
  throw new RangeError('positive mm snapping tolerance <=2 required');
 if(!stroke||!pt(stroke)||stroke.revision!==revision)
  throw new TypeError('invalid or stale student-selected point');
 const result=kind==='circles'?circleCircleFilletCenters(args):
  kind==='segment-circle'?finiteSegmentCircleFillets(args):finiteTwoSegmentFillets(args);
 const base={kind,revision,proofScope:'selected-center-only',
  arcG1Verified:false,completeProblemVerified:false,
  sourceStatus:result.status};
 if(!['unique','multiple'].includes(result.status))
  return {...base,status:'not-gradeable',reason:
   '没有有限离散候选圆心；连续族、无解或数值不稳定不能吸附为唯一圆心'};
 if(typeof branchId!=='string'||!branchId)
  return {...base,status:'branch-required',
   reason:'请先独立选择候选分支，系统不得自动选圆心'};
 const chosen=result.candidates.find(c=>c.id===branchId);
 if(!chosen)return {...base,status:'invalid-branch',
  reason:'学生选择的分支不属于真实有限候选集合'};
 if(!pt(chosen.center)||!finite(chosen.maxResidual)||chosen.maxResidual>1e-7||
    (kind==='segment-circle'&&(
     chosen.lineContactOnSegment!==true||chosen.sourceArcRangeVerified!==true||
     chosen.sourceArcChecks?.circle!==true||!finite(chosen.segmentParameter)||
     chosen.segmentParameter<0||chosen.segmentParameter>1)))
  return {...base,status:'not-gradeable',reason:'候选圆心没有通过求解器残差验证'};
 const gap=Math.hypot(stroke.x-chosen.center.x,stroke.y-chosen.center.y);
 if(!finite(gap))throw new RangeError('distance overflow');
 if(gap>toleranceMm)return {...base,status:'incorrect',
  branchId,reason:'选定圆心位置未满足模型毫米吸附容差'};
 return {...base,status:'verified-center',branchId,
  snappedPoint:clonePoint(chosen.center),residualMm:gap,
  reason:'此候选圆心及有限接触范围通过独立求解器验证；未验证最终圆弧旋向与双侧 G1'};
}
module.exports={constructParallelLine,constructConcentricCircle,snapChosenFilletCenter};
