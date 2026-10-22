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
 if(!['segments','circles','segment-circle'].includes(kind)||!revisionOK(revision)||
    !Array.isArray(arcStrokes)||arcStrokes.length>64)
  throw new TypeError('valid fillet mode, revision and bounded student arcs required');
 const opts={branchId,revision};
 const guide=gradeStudentAuxiliaries(kind,args,auxiliaries,opts);
 const center=centerMark===null?{status:'incomplete',proofScope:'student-center-not-marked'}:
  snapChosenFilletCenter(kind,args,centerMark,{...opts,toleranceMm});
 const contacts=gradeStudentTangentPoints(kind,args,tangentMarks,{...opts,toleranceMm});
 let arc;
 // The composed proof must use the student's explicitly chosen branch.
 // Do not let a prefilled args.branchId silently bypass empty/mismatched UI selection.
 if(typeof branchId!=='string'||!branchId||args?.branchId!==branchId)
  arc={status:'not-verified',gradeScope:'one-directed-arc-only',
   reason:'未明确选择与当前题目一致的真实圆心分支，禁止把独立圆弧判分计为通过'};
 else if(contacts.status==='invalid-branch')
  arc={status:'not-verified',gradeScope:'one-directed-arc-only',
   reason:'原候选分支因新几何输入或有限已知圆弧截取而无效，不得沿用旧的圆弧判分'};
 else if(arcStrokes.length>1)
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
 const finiteSourceArcCount=kind==='circles'
  ?Number(args?.first?.arc!==undefined)+Number(args?.second?.arc!==undefined):
  kind==='segment-circle'?Number(args?.circle?.arc!==undefined):0;
 // A completed *student* four-stage proof includes source-arc membership
 // only if explicit finite given arcs exist and BOTH source contacts and
 // the independently verified G1 arc were scored from the same chosen branch.
 // It does not certify dimensions, remaining contour, textbook or full answer.
 const finiteSourceArcsVerified=finiteSourceArcCount>0&&
  verifiedCount===4&&contacts.contactLocationsVerified===true&&
  arc.sourceProofVerified===true&&arc.geometryValidated===true&&
  (kind!=='segment-circle'||(
    contacts.sourceBoundsVerified===true&&arc.sourceBoundsVerified===true));
 return {kind,revision,selectedBranchId:branchId||null,
  status:verifiedCount===4?'all-supported-stages-verified':'in-progress',
  supportedStageCount:4,verifiedCount,stages,
  verification:{auxiliaries:guide,center,contacts,arc},
  proofScope:'four-supported-student-fillet-constructions-only',
  fullProblemVerified:false,
  finiteSourceArcCount,sourceFiniteCircularArcsVerified:finiteSourceArcsVerified,
  reason:verifiedCount===4
   ?(finiteSourceArcsVerified
      ?'已验证四项学生数学构造及给定有限圆弧的切点范围；完整教材题的尺寸、其他线段与未建模条件仍待验证'
      :'已验证当前题型支持的四项学生构造；未证明完整教材题或其他未建模条件')
   :'根据分项状态继续检查辅助轨迹、圆心、两个切点和连接弧；有限圆弧范围和未完成步骤不能冒充已证明'};
}
module.exports={assessFilletStudentProgress};
