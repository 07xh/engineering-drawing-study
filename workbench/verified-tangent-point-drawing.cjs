'use strict';
/**
 * R3 two source-specific STUDENT TANGENT POINT marks for a chosen fillet center.
 * Recompute DA-02 geometry; never accept UI-provided expected contacts.
 * May be checked before selecting a directed arc G1 traversal. Success is
 * proof of TWO CONTACT MARKS ONLY, not a constructed directed fillet.
 * Coordinates and tolerances are in mathematical millimetres, not SVG pixels.
 */
const {circleCircleFilletCenters}=require('../engines/planar/circle-circle-fillet.cjs');
const {finiteTwoSegmentFillets}=require('../engines/planar/two-segment-fillet.cjs');
const {finiteSegmentCircleFillets}=require('../engines/planar/segment-circle-fillet.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const pt=p=>p!==null&&typeof p==='object'&&finite(p.x)&&finite(p.y);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const SIDES=Object.freeze(['first','second']);
function gradeStudentTangentPoints(kind,args,marks,{
 branchId,revision=0,toleranceMm=0.75
}={}){
 if(!['segments','circles','segment-circle'].includes(kind))
  throw new TypeError('supported fillet type required');
 if(!Number.isSafeInteger(revision)||revision<0||
    !finite(toleranceMm)||toleranceMm<=0||toleranceMm>2)
  throw new RangeError('valid input revision and positive mm tolerance <=2 required');
 if(!Array.isArray(marks)||marks.length>64)
  throw new TypeError('bounded student tangent point marks required');
 for(const [i,mark] of marks.entries()){
  if(!mark||mark.kind!=='tangent-point'||!SIDES.includes(mark.sourceId)||
   !pt(mark.point)||mark.revision!==revision)
   throw new TypeError('invalid or stale student tangent mark '+i);
 }
 const solved=kind==='segments'?finiteTwoSegmentFillets(args):
  kind==='segment-circle'?finiteSegmentCircleFillets(args):circleCircleFilletCenters(args);
 const base={gradeScope:'two-selected-tangent-points-only',kind,revision,
  candidateStatus:solved.status,requiredCount:2,
  matchedCount:0,extraCount:marks.length,remainingSources:[...SIDES],
  contactLocationsVerified:false,arcG1Verified:false,completeProblemVerified:false};
 if(!['unique','multiple'].includes(solved.status))
  return {...base,status:'not-gradeable',reason:
   '当前没有有限离散圆心及切点，不能对无解或连续多解编造切点答案'};
 if(typeof branchId!=='string'||branchId.length===0)
  return {...base,status:'branch-required',reason:
   '先选择题目实际存在的圆心分支，再自行标注两个切点'};
 const chosen=solved.candidates.find(c=>c.id===branchId);
 if(!chosen)return {...base,status:'invalid-branch',reason:
  '指定圆心分支不属于当前真实有限解集合'};
 const contacts=kind==='segment-circle'?
  {first:chosen.lineContact,second:chosen.circleContact}:chosen.contacts;
 const mixedBounded=kind!=='segment-circle'||(
  chosen.lineContactOnSegment===true&&chosen.sourceArcRangeVerified===true&&
  finite(chosen.segmentParameter)&&chosen.segmentParameter>=0&&
  chosen.segmentParameter<=1&&
  chosen.sourceArcChecks?.circle===true);
 if(!contacts||!SIDES.every(id=>pt(contacts[id]))||
   !finite(chosen.maxResidual)||chosen.maxResidual>1e-7||!mixedBounded||
   (kind==='segments'&&(!chosen.sourceContactsOnSegments||
    !SIDES.every(id=>finite(chosen.contactSegments?.[id]?.t)&&
      chosen.contactSegments[id].t>=0&&chosen.contactSegments[id].t<=1))))
  return {...base,status:'not-gradeable',reason:
   '该圆心没有两处真实有效切点的数学证明'};
 const matched=new Map();
 let extraCount=0;
 for(const m of marks){
  const residualMm=dist(m.point,contacts[m.sourceId]);
  if(!finite(residualMm))throw new RangeError('point distance overflow');
  if(residualMm>toleranceMm||matched.has(m.sourceId)){
   extraCount++;continue;
  }
  matched.set(m.sourceId,residualMm);
 }
 const matchedCount=matched.size;
 const complete=matchedCount===2&&extraCount===0;
 const remainingSources=SIDES.filter(side=>!matched.has(side));
 return {...base,status:complete?'correct':
    matchedCount===0?(marks.length?'incorrect':'incomplete'):'partial',
  selectedBranchId:branchId,matchedCount,extraCount,
  remainingSources,
  residualsMm:Object.fromEntries(matched),
  contactLocationsVerified:complete,
  sourceBoundsVerified:kind==='segment-circle'?mixedBounded:undefined,
  reason:complete
   ?'两个学生标记切点分别满足选定分支的真实数学接触约束；还需独立验证连接弧走向、有向 G1 和整题其他步骤'
   :'按所选圆心分支、已知对象序号及模型毫米容差核对切点；重复、漏点和错对象均不合格'};
}
module.exports={gradeStudentTangentPoints};
