'use strict';
/**
 * R3 digital-construction evaluator: checks the STUDENT's two chosen
 * signed-line / concentric-circle auxiliary loci against independently
 * solved real fillet candidates. It does not solve directed arcs, determine
 * a preferred center, or claim a whole problem is complete.
 */
const {circleCircleFilletCenters}=require('../engines/planar/circle-circle-fillet.cjs');
const {finiteTwoSegmentFillets}=require('../engines/planar/two-segment-fillet.cjs');
const {finiteSegmentCircleFillets}=require('../engines/planar/segment-circle-fillet.cjs');
const {offsetLine}=require('../engines/planar/offset-tangency.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const pt=p=>p&&typeof p==='object'&&finite(p.x)&&finite(p.y);
const errorTolerance=1e-7;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function isSameLine(a,b){
 if(!a||!pt(a.from)||!pt(a.to)||!pt(b.a)||!pt(b.b))return false;
 // Equality of full ruler segment, not just the same infinite line. Prevent
 // tiny coincident scribbles or forged screen coordinates from counting.
 const forward=Math.max(distance(a.from,b.a),distance(a.to,b.b));
 const reverse=Math.max(distance(a.from,b.b),distance(a.to,b.a));
 const eps=errorTolerance*Math.max(1,distance(b.a,b.b));
 return Math.min(forward,reverse)<=eps;
}
function gradeStudentAuxiliaries(kind,args,actions,{branchId,revision=0}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('nonnegative input revision required');
 if(!['segments','circles','segment-circle'].includes(kind))
  throw new TypeError('supported geometric kind required');
 if(!Array.isArray(actions)||actions.length>64)
  throw new TypeError('bounded student construction actions required');
 for(const [i,a] of actions.entries()){
  if(!a||a.revision!==revision||
     !['first','second'].includes(a.sourceId))
   throw new TypeError('stale or invalid student action '+i);
 }
 const solved=kind==='segments'?finiteTwoSegmentFillets(args):
  kind==='segment-circle'?finiteSegmentCircleFillets(args):circleCircleFilletCenters(args);
 const base={kind,revision,proofScope:'two-user-constructed-auxiliary-loci-only',
  arcG1Verified:false,completeProblemVerified:false,
  sourceStatus:solved.status,requiredCount:2,
  matchedCount:0,extraCount:actions.length,remainingSources:['first','second']};
 if(!['unique','multiple'].includes(solved.status))
  return {...base,status:'not-gradeable',reason:
   '没有可选择的离散有限圆心，不能对连续解族或无解生成伪标准构造'};
 if(!branchId)return {...base,status:'branch-required',reason:
  '学生必须明确选择有效分支，再验证针对该分支的辅助轨迹'};
 const selected=solved.candidates.find(c=>c.id===branchId);
 if(!selected)return {...base,status:'invalid-branch',reason:'候选分支不属于实际求解结果'};
 const matched=new Set(),diagnostics=[];
 const flag=(index,a,code)=>diagnostics.push({index,sourceId:a.sourceId,code});
 for(const [index,a] of actions.entries()){
  const lineMode=kind==='segments'||kind==='segment-circle'&&a.sourceId==='first';
  if(lineMode){
   const sign=kind==='segment-circle'?args.side:selected.sides?.[a.sourceId];
   const offset=sign*args.filletRadius;
   if(!Number.isFinite(offset)||Math.abs(offset)<1e-9){
    flag(index,a,'ungradeable');continue;
   }
   if(a.kind!=='line'||a.tool!=='parallel-ruler'){
    flag(index,a,'tool-mismatch');continue;
   }
   if(!finite(a.signedOffsetMm)){
    flag(index,a,'offset-distance');continue;
   }
   const eps=errorTolerance*Math.max(1,Math.abs(offset));
   if(Math.abs(a.signedOffsetMm-offset)>eps){
    const magnitudeOK=Math.abs(Math.abs(a.signedOffsetMm)-Math.abs(offset))<=eps;
    flag(index,a,magnitudeOK?'offset-side':'offset-distance');continue;
   }
   const expected=offsetLine(kind==='segment-circle'?args.segment:args[a.sourceId],offset);
   if(!isSameLine(a,expected)){
    flag(index,a,'offset-geometry');continue;
   }
  }else{
   const guide=kind==='segment-circle'?
    {center:solved.auxiliary?.circleCenter,radius:solved.auxiliary?.centerLocusRadius}:
    solved.auxiliary?.[a.sourceId+'Locus'];
   if(!guide||!pt(guide.center)||!finite(guide.radius)||guide.radius<=0){
    flag(index,a,'ungradeable');continue;
   }
   if(a.kind!=='circle'||a.tool!=='concentric-compass'){
    flag(index,a,'tool-mismatch');continue;
   }
   if(!pt(a.center)||distance(a.center,guide.center)>
      errorTolerance*Math.max(1,guide.radius)){
    flag(index,a,'compass-center');continue;
   }
   if(!finite(a.radius)||a.radius<=0||
      Math.abs(a.radius-guide.radius)>errorTolerance*Math.max(1,guide.radius)){
    flag(index,a,'compass-radius');continue;
   }
  }
  if(matched.has(a.sourceId)){
   flag(index,a,'duplicate');continue;
  }
  matched.add(a.sourceId);
 }
 const matchedCount=matched.size,extraCount=actions.length-matchedCount;
 return {...base,status:matchedCount===2&&extraCount===0?'correct':
   matchedCount===0?'incorrect':'partial',
  matchedCount,extraCount,remainingSources:['first','second'].filter(n=>!matched.has(n)),
  selectedBranchId:branchId,diagnostics,
  reason:matchedCount===2&&extraCount===0
   ?'两条学生自建辅助轨迹符合当前数学分支；仍须独立确定切点、弧向与有向 G1'
   :'检查学生选择的源对象、法向偏移符号、半径或重复构造'};
}
module.exports={gradeStudentAuxiliaries};
