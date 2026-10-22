'use strict';
/**
 * DraftAI P0/02: directed exterior fillet from a FINITE straight segment
 * to a full source circle or a FINITE given circular arc.
 *
 * Uses the real bounded 02 segment-circle candidates; does not infer a
 * preference among several circle centers. Requires explicit arc traversal,
 * and claims directed G1 only if BOTH source travel directions were checked.
 * All geometry is mathematical model-space (e.g. mm), not SVG pixels.
 */
const {finiteSegmentCircleFillets}=require('./segment-circle-fillet.cjs');
const {normalizedLine}=require('./offset-tangency.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const DEG=Math.PI/180;
const ANGLE_EPS=1e-9;
const G1_TOL=1e-7;
const signedAngle=(center,point)=>{
 const a=Math.atan2(point.y-center.y,point.x-center.x)/DEG;
 return a<0?a+360:a;
};
function tangentOnCircle(center,contact,orientation){
 const x=contact.x-center.x,y=contact.y-center.y;
 const radius=Math.hypot(x,y);
 if(!finite(radius)||!(radius>0))throw new RangeError('undefined radial contact tangent');
 const sign=orientation==='ccw'?1:-1;
 return {x:-sign*y/radius,y:sign*x/radius};
}
const mismatch=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function chooseDirectedSegmentCircleFillet(args={}){
 const solved=finiteSegmentCircleFillets(args);
 if(!['multiple','unique'].includes(solved.status))
  return {status:solved.status,reason:solved.reason,
   candidateIds:[],steps:[],geometry:null,g1Verified:false,
   finiteCircleArcCount:solved.finiteCircleArcCount};
 const ids=solved.candidates.map(c=>c.id);
 if(solved.status==='multiple'&&!args.branchId)
  return {status:'branch-choice-required',candidateIds:ids,
   steps:[],geometry:null,g1Verified:false,
   reason:'多个有限相切圆心，必须明确选择候选分支'};
 if(args.branchId&&!ids.includes(args.branchId))
  throw new RangeError('selected branchId not in valid finite segment and source arc candidates');
 const chosen=solved.candidates.find(c=>c.id===(args.branchId||ids[0]));
 if(!['cw','ccw'].includes(args.direction))
  return {status:'direction-required',candidateIds:ids,selectedId:chosen.id,
   steps:[],geometry:null,g1Verified:false,
   reason:'需指定连接圆弧顺时针或逆时针旋向'};
 const first=chosen.lineContact,second=chosen.circleContact;
 if(!chosen.lineContactOnSegment||chosen.sourceArcRangeVerified!==true||
    !finite(chosen.segmentParameter)||chosen.segmentParameter<0||chosen.segmentParameter>1||
    !finite(chosen.maxResidual))
  throw new RangeError('chosen source contacts are not proven within their finite bounds');
 const a=signedAngle(chosen.center,first),b=signedAngle(chosen.center,second);
 const sweep=args.direction==='ccw'?(b-a+360)%360:-((a-b+360)%360);
 if(!finite(sweep)||Math.abs(sweep)<=ANGLE_EPS||Math.abs(sweep)>=360)
  return {status:'degenerate-arc',candidateIds:ids,selectedId:chosen.id,
   geometry:null,steps:[],g1Verified:false,reason:'切点重合或连接圆弧扫角退化'};
 const geometry={id:'segment_circle_fillet_'+chosen.id,kind:'arc',space:'drawing-2d',unit:'mm',
  data:{center:{...chosen.center},radius:args.filletRadius,
   startAngle:a,endAngle:a+sweep,direction:args.direction}};
 // As in directed-circle-fillet, both contours are traversed in the same
 // start → fillet → end sense. Pointwise tangency (G0) is not directional G1.
 const tangential=tangentOnCircle(chosen.center,first,args.direction);
 const tangentAtCircle=tangentOnCircle(chosen.center,second,args.direction);
 const checks=[];
 const {lineTravel,knownCircleTravel}=args;
 if(lineTravel!==undefined){
  if(!['forward','reverse'].includes(lineTravel))
   throw new RangeError('lineTravel must be forward or reverse');
  const unit=normalizedLine(args.segment).tangent;
  const sign=lineTravel==='forward'?1:-1;
  const known={x:unit.x*sign,y:unit.y*sign};
  checks.push({source:'segment',travel:lineTravel,
   vectorMismatch:mismatch(tangential,known)});
 }
 if(knownCircleTravel!==undefined){
  if(!['cw','ccw'].includes(knownCircleTravel))
   throw new RangeError('knownCircleTravel must be cw or ccw');
  const known=tangentOnCircle(args.circle.center,second,knownCircleTravel);
  checks.push({source:'circle',travel:knownCircleTravel,
   vectorMismatch:mismatch(tangentAtCircle,known)});
 }
 const strict=checks.length===2;
 const maxG1Mismatch=Math.max(0,...checks.map(c=>c.vectorMismatch));
 if(!finite(maxG1Mismatch)||maxG1Mismatch>G1_TOL)
  return {status:'direction-conflict',candidateIds:ids,selectedId:chosen.id,
   geometry:null,arcPreview:geometry,steps:[],g1Verified:false,
   maxG1Mismatch,directionChecks:checks,
   reason:'选定连接弧与线段或已知圆弧的有向切线不连续'};
 const steps=[
  {id:'offset-line',kind:'offset-line',role:'auxiliary',
   reason:'在指定线段法向一侧作距离为连接半径的平行辅助线',
   geometry:solved.auxiliary.offsetLine},
  {id:'concentric-locus',kind:'circle-locus',role:'auxiliary',
   reason:'以已知圆心为圆心，作半径 R+r 的辅助圆确定相切圆心轨迹',
   geometry:{center:{...solved.auxiliary.circleCenter},
    radius:solved.auxiliary.centerLocusRadius}},
  {id:'center-intersection',kind:'intersection',role:'auxiliary',
   reason:'两辅助轨迹的交点给出有限解；按题意从有效候选中选择',
   candidateIds:ids,selectedId:chosen.id,point:{...chosen.center}},
  {id:'contact-points',kind:'contact-points',role:'auxiliary',
   reason:solved.finiteCircleArcCount?
    '由已知线段的垂足及两圆心连线确定切点，并核实二者分别位于有限线段与给定圆弧内':
    '由已知线段的垂足及两圆心连线确定真实切点',
   contacts:{first:{...first},second:{...second}},
   segmentParameter:chosen.segmentParameter,
   sourceArcRangeVerified:chosen.sourceArcRangeVerified},
  {id:'directed-fillet',kind:'directed-arc',role:'result',
   reason:strict?'验证连接弧与线段、圆弧两端的有向 G1 切线一致':
    '仅证明无向相切；仍须提供线段和已知圆轮廓的两个行进方向',
   geometry}
 ];
 return {status:'selected',selectedId:chosen.id,candidateIds:ids,
  center:{...chosen.center},contacts:{first:{...first},second:{...second}},
  geometry,steps,sweepDegrees:sweep,
  maxTangencyResidual:chosen.maxResidual,
  maxG1Mismatch:strict?maxG1Mismatch:null,directionChecks:checks,
  finiteSegmentContactVerified:true,
  finiteCircleArcCount:solved.finiteCircleArcCount,
  sourceArcRangeVerified:chosen.sourceArcRangeVerified===true,
  g1Verified:strict,
  reason:strict?'真实有限切点与两端有向 G1 已数学验证':
   '尚缺完整原轮廓行进方向，不能宣称有向 G1'};
}
module.exports={chooseDirectedSegmentCircleFillet};
