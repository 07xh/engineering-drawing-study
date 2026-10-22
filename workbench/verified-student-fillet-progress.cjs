'use strict';
/**
 * R3 lesson progress across FOUR independently graded student constructions.
 * Only reports scope-local proofs, NEVER a completed engineering drawing.
 * Recomputes real geometry in each specialized evaluator, no UI answer oracle.
 */
const {gradeStudentAuxiliaries}=require('./verified-ruler-steps.cjs');
const {snapChosenFilletCenter}=require('./verified-ruler-tools.cjs');
const {gradeStudentTangentPoints}=require('./verified-tangent-point-drawing.cjs');
const {gradeFilletArcDrawing}=require('./verified-fillet-arc-drawing.cjs');
const revisionOK=n=>Number.isSafeInteger(n)&&n>=0;
function assessFilletStudentProgress(kind,args,{
 auxiliaries=[],centerMark=null,tangentMarks=[],arcStrokes=[]
}={},{
 branchId,revision=0,origin,scale,toleranceMm=0.75
}={}){
 if(!['segments','circles'].includes(kind)||!revisionOK(revision)||
    !Array.isArray(arcStrokes)||arcStrokes.length>64)
  throw new TypeError('valid fillet mode, revision and bounded student arcs required');
 const opts={branchId,revision};
 const guide=gradeStudentAuxiliaries(kind,args,auxiliaries,opts);
 const center=centerMark===null?{status:'incomplete',proofScope:'student-center-not-marked'}:
  snapChosenFilletCenter(kind,args,centerMark,{...opts,toleranceMm});
 const contacts=gradeStudentTangentPoints(kind,args,tangentMarks,{...opts,toleranceMm});
 let arc;
 if(arcStrokes.length>1)
  arc={status:'incorrect',gradeScope:'one-directed-arc-only',
   reason:'学生绘制了多条连接弧；请先撤销多余笔迹，不得挑一条自动算正确'};
 else
  arc=gradeFilletArcDrawing(args,arcStrokes[0]??null,{
   kind,origin,scale,revision,toleranceMm});
 const stages=[
  {id:'auxiliary-loci',status:guide.status,ok:guide.status==='correct',
   scope:guide.proofScope},
  {id:'chosen-center',status:center.status,ok:center.status==='verified-center',
   scope:center.proofScope},
  {id:'contact-points',status:contacts.status,ok:contacts.status==='correct',
   scope:contacts.gradeScope},
  {id:'directed-arc',status:arc.status,ok:arc.status==='correct',
   scope:arc.gradeScope}
 ];
 const verifiedCount=stages.filter(s=>s.ok).length;
 return {kind,revision,selectedBranchId:branchId||null,
  status:verifiedCount===4?'all-supported-stages-verified':'in-progress',
  supportedStageCount:4,verifiedCount,stages,
  verification:{auxiliaries:guide,center,contacts,arc},
  proofScope:'four-supported-student-fillet-constructions-only',
  fullProblemVerified:false,
  sourceFiniteCircularArcsVerified:false,
  reason:verifiedCount===4
   ?'已验证当前题型支持的四项学生构造；未证明完整教材题、有限已知圆弧范围或其他未建模条件'
   :'根据分项状态继续检查辅助轨迹、圆心、两个切点和连接弧，未完成步骤不能冒充已证明'};
}
module.exports={assessFilletStudentProgress};
