'use strict';
/**
 * 02-C: finite directional fillet selection, only between two CIRCLE contacts.
 * Never confuse an unoriented tangent with a directional G1 traversal.
 * Selected candidate ID and arc traversal direction MUST be explicit.
 */
const {circleCircleFilletCenters}=require('./circle-circle-fillet.cjs');
const TOL=1e-9;
const radians=Math.PI/180;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function angle(center,point){
 const degrees=Math.atan2(point.y-center.y,point.x-center.x)/radians;
 return degrees<0?degrees+360:degrees;
}
function unitTangency(circleCenter,contact,direction){
 const dx=contact.x-circleCenter.x,dy=contact.y-circleCenter.y;
 const d=Math.hypot(dx,dy);
 if(!(d>0)||!finite(d))throw new RangeError('undefined tangent at coincident centers');
 const s=direction==='ccw'?1:-1;
 return {x:-s*dy/d,y:s*dx/d};
}
function normalizedGap(x,y){return Math.hypot(x.x-y.x,x.y-y.y);}
function chooseDirectedFillet(args={}){
 const solved=circleCircleFilletCenters(args);
 if(!['unique','multiple'].includes(solved.status))
  return {status:solved.status,reason:solved.reason||'no finite center',geometry:null,
   candidateIds:[],steps:[],g1Verified:false};
 const ids=solved.candidates.map(c=>c.id);
 if(solved.status==='multiple'&&!args.branchId)
  return {status:'branch-choice-required',candidateIds:ids,geometry:null,
   steps:[],g1Verified:false,reason:'必须明确选择哪个圆心；不能偷偷选唯一答案'};
 if(args.branchId&&!ids.includes(args.branchId))
  throw new RangeError('selected branchId not in solved candidate list');
 const candidate=solved.candidates.find(c=>c.id===(args.branchId||ids[0]));
 const {direction,knownFirstTravel,knownSecondTravel}=args;
 if(!['cw','ccw'].includes(direction))
  return {status:'direction-required',candidateIds:ids,selectedId:candidate.id,
   geometry:null,steps:[],g1Verified:false,
   reason:'圆心和切点不能确定完整圆弧走向；需要 cw/ccw'};
 const a=angle(candidate.center,candidate.contacts.first);
 const b=angle(candidate.center,candidate.contacts.second);
 let sweep=direction==='ccw'?(b-a+360)%360:-((a-b+360)%360);
 if(Math.abs(sweep)<=TOL)
  return {status:'degenerate-arc',candidateIds:ids,selectedId:candidate.id,
   geometry:null,steps:[],g1Verified:false,reason:'两个切点重合，无法确定有限非零扫掠'};
 const g={id:'fillet_'+candidate.id,kind:'arc',space:'drawing-2d',unit:'mm',
  data:{center:{...candidate.center},radius:args.filletRadius,
   startAngle:a,endAngle:a+sweep,direction}};
 const directionChecks=[];
 for(const [side,orientation,original,contact] of [
  ['first',knownFirstTravel,args.first,candidate.contacts.first],
  ['second',knownSecondTravel,args.second,candidate.contacts.second]]){
  if(orientation===undefined)continue;
  if(!['cw','ccw'].includes(orientation))throw new RangeError(side+' travel orientation invalid');
  const fillet=unitTangency(candidate.center,contact,direction);
  const incoming=unitTangency(original.center,contact,orientation);
  directionChecks.push({side,orientation,vectorMismatch:normalizedGap(fillet,incoming)});
 }
 const strict=directionChecks.length===2;
 const maxG1Mismatch=Math.max(0,...directionChecks.map(v=>v.vectorMismatch));
 if(maxG1Mismatch>1e-7)
  return {status:'direction-conflict',candidateIds:ids,selectedId:candidate.id,
   geometry:null,steps:[],g1Verified:false,arcPreview:g,
   maxG1Mismatch,reason:'选定弧向与已知圆轮廓的有向切线不连续'};
 const steps=[
  {id:'auxiliary-loci',role:'auxiliary',reason:'已知两圆的外/内切条件给出辅助圆心轨迹',
   circles:[solved.auxiliary.firstLocus,solved.auxiliary.secondLocus]},
  {id:'center-intersection',role:'auxiliary',reason:'两条圆心轨迹的交点产生全部候选',
   candidateIds:ids,selectedId:candidate.id,center:{...candidate.center}},
  {id:'contact-points',role:'auxiliary',reason:'圆心连线上的半径关系确定两个切点',
   contacts:candidate.contacts,maxResidual:candidate.maxResidual},
  {id:'directed-fillet',role:'result',reason:strict?
   '显式验证连接弧与两条已知轮廓的有向 G1 连续性':
   '仅验证无向相切；未提供两条原轮廓的走向，不能宣称有向 G1 已证明',
   geometry:g}
 ];
 return {status:'selected',candidateIds:ids,selectedId:candidate.id,
  center:candidate.center,contacts:candidate.contacts,
  geometry:g,steps,sweepDegrees:sweep,
  maxTangencyResidual:candidate.maxResidual,maxG1Mismatch:strict?maxG1Mismatch:null,
  g1Verified:strict,reason:strict?'切点与两端有向 G1 均已数学检验':'尚未验证已知轮廓进入/离开方向'};
}
module.exports={chooseDirectedFillet};
