'use strict';
/**
 * DA-07 V5: proof-scoped, step-bound explanations for circular fillets.
 *
 * Strictly consumes the existing R1/02 recomputed solver proof. The UI must
 * NEVER infer a unique global answer, a final arc, or a student grade here.
 */
const IDS=Object.freeze({
 circles:['auxiliary-loci','center-intersection','contact-points','directed-fillet'],
 segments:['offset-line','offset-line','intersection','perpendicular-feet',
  'finite-segment-trim','directed-arc'],
 'segment-circle':['offset-line','concentric-locus','center-intersection',
  'contact-points','directed-fillet']
});
const BASIS=Object.freeze({
 'auxiliary-loci':'由两个已知圆的内切／外切方式和连接半径，作满足圆心距离条件的两条辅助轨迹。',
 'offset-first':'第一条有限线段的连接圆心轨迹是距离该直线为指定连接半径的偏移线。',
 'offset-second':'第二条有限线段采用相同的距离约束；两条偏移线只是候选圆心的构造轨迹。',
 'intersection':'两条有效偏移线的交点形成候选圆心，仍需选择有限线段和方向合法的一支。',
 'offset-line':'连接圆心到给定直线的垂直距离应等于连接半径，候选圆心在线段的偏移线上。',
 'concentric-locus':'连接圆心到给定圆心的距离取决于内切／外切关系；由已验证模型给出对应辅助圆。',
 'center-intersection':'连接圆心必须同时满足两个已知轮廓的距离约束；交点是候选，不能在多解时自动指定唯一答案。',
 'contact-points':'两个切点须位于各自真实给定轮廓上，圆与圆的切点由圆心连线确定。',
 'perpendicular-feet':'连接圆心到两条已知直线的垂足给出候选切点；还须落在真实有限线段范围内。',
 'finite-segment-trim':'仅保留两条真实有限线段中符合已选切点与行进方向的部分，不把无限延长线算作原题轮廓。',
 'directed-fillet':'选定圆心分支、弧向及已知轮廓走向后，核验连接弧与两端轮廓的有向 G1 连续性。',
 'directed-arc':'最终圆弧必须同时满足指定半径、非退化有限扫角、两处切点及已知线段走向的有向 G1 连续性。'
});
const CHECK=Object.freeze({
 'auxiliary-loci':'已使用真实求解器给出的两条圆心辅助轨迹，尚未将它们的交点当作唯一圆心。',
 'offset-first':'已验证第一条有限线段的法向距离构造；尚未验证整条连接圆弧。',
 'offset-second':'已验证第二条有限线段的法向距离构造；尚未验证整条连接圆弧。',
 'offset-line':'已使用指定侧的有限线段偏移轨迹，尚未输出最终圆弧。',
 'concentric-locus':'已使用给定圆的合法半径关系辅助圆，尚未输出最终圆弧。',
 'center-intersection':'圆心来自求解器提供的显式候选分支；其他几何候选仍须独立保留。',
 'intersection':'圆心必须满足两条偏移直线的相交条件，且切点必须落在有限原线段内。',
 'contact-points':'切点由真实分支计算；有限原圆弧切点必须在用户给定的起止角区间内。',
 'perpendicular-feet':'垂足与两有限线段位置已验算，不能把无限直线上的垂足直接当作合法切点。',
 'finite-segment-trim':'有限截取与已知行进方向已由数学求解器核对；不是无限直线的任意延长。',
 'directed-fillet':'结果须同时通过模型切点残差与两端有向 G1 向量残差门槛。',
 'directed-arc':'结果须同时通过有限扫角、切点残差和两端有向 G1 向量残差门槛。'
});
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const message=(status,text)=>Object.freeze({
 status,title:status==='blocked'?'数学结果尚未验证':'需要明确的数学分支',
 reason:text,why:'',basis:'',check:'',scope:'',evidence:'',step:0,total:0
});
const ENDS=new Set(['directed-fillet','directed-arc']);
function build(teaching,{kind,revision}={}){
 if(!Object.hasOwn(IDS,kind)||!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('invalid fillet source kind or revision');
 if(teaching?.status!=='ready'||teaching.revision!==revision||
    teaching.mathematicallyVerified!==true||!Array.isArray(teaching.steps))
  return message('requires-choice','尚未选定通过验证的候选圆心、方向及完整轮廓走向；不会猜测连接弧。');
 const original=teaching.originalLesson;
 const result=original?.result,ids=IDS[kind];
 if(original?.readiness!=='ready'||original?.proof?.verified!==true||
    original.revision!==revision||original.kind!==kind||
    result?.status!=='selected'||result.g1Verified!==true||
    result.selectedBranch!==teaching.selectedBranchId||
    !Array.isArray(result.candidateIds)||result.candidateIds.length===0||
    !result.candidateIds.includes(result.selectedBranch)||
    !finite(result.maxResidual)||result.maxResidual<0||result.maxResidual>1e-7||
    !finite(result.maxG1Mismatch)||result.maxG1Mismatch<0||result.maxG1Mismatch>1e-7||
    teaching.steps.length!==ids.length||
    teaching.steps.some((step,index)=>
     (kind==='segments'?
       step.id!==result.selectedBranch+'-'+
        ['offset1','offset2','intersection','perpendiculars','trim','arc'][index]:
      step.id!==ids[index])||
     !Array.isArray(step.actions)||step.actions.length===0||
     !step.actions.every(action=>['line','circle','point','arc'].includes(action.kind)))||
    teaching.steps.at(-1)?.actions?.some(action=>action.kind!=='arc'))
  return message('blocked','证明链、候选分支、数值残差或实际作图动作不一致；停止结果解释。');
 if(kind==='segment-circle'&&
    (result.finiteSegmentContactVerified!==true||result.sourceArcRangeVerified!==true))
  return message('blocked','线段切点或给定圆弧范围未通过数学验证。');
 const steps=teaching.steps.map((step,i)=>{
  const concept=kind==='segments'?ids[i]:step.id;
  const why=kind==='segments'&&i===0?BASIS['offset-first']:
   kind==='segments'&&i===1?BASIS['offset-second']:BASIS[concept];
  const isFinal=ENDS.has(concept);
  return Object.freeze({id:step.id,title:step.explanation,
   why,basis:step.explanation,check:CHECK[concept],
   evidence:isFinal?
     '双侧有向 G1 验证通过；模型切点最大残差 '+result.maxResidual.toExponential(2)+
     ' mm；G1 向量最大不匹配 '+result.maxG1Mismatch.toExponential(2)+'。':
     '当前仅确认本步所用的几何关系；不会提前展示最终圆弧或终点的证明结果。',
   scope:isFinal?
    '仅证明当前所选分支的有限连接弧及支持的轮廓条件；并非完整教材题、全部尺寸或全局唯一解。':
    '仅为本步辅助构造的依据；不能由辅助轨迹或步骤计数推断整题完成。',
   role:isFinal?'result':'auxiliary',index:i});
 });
 return Object.freeze({status:'ready',revision,kind,selectedBranchId:result.selectedBranch,
  candidateCount:result.candidateIds.length,steps:Object.freeze(steps)});
}
function at(plan,{revision,stage,mode='full'}={}){
 if(mode==='hint')return message('requires-choice','逐步提示模式只按需提供当前提示，不展示完整证明链、后续切点或最终圆弧。');
 if(mode==='draw')return message('requires-choice','自主作图模式只核验学生真实笔迹，不显示预先计算的答案或最终分支证明。');
 if(mode!=='full')throw new TypeError('invalid teaching mode');
 if(plan?.status!=='ready'||plan.revision!==revision)
  return message('requires-choice','尚无与当前输入版本一致的完整有向 G1 数学证明；先选分支、弧向与轮廓走向。');
 if(!Number.isSafeInteger(stage)||stage<0||stage>plan.steps.length)
  return message('blocked','不允许使用旧版本或越界的作图步骤。');
 if(stage===0)return Object.freeze({status:'intro',title:'观察已知轮廓',
  reason:'先确认每个已知圆、给定有限圆弧或有限线段的真实边界，尚未出现连接圆弧。',
  why:'由题给几何条件开始，不将无限延长线或完整圆替代有限给定轮廓。',
  basis:'可行分支、有限轮廓、两个切点和 G1 都必须由真实数学求解器验证。',
  check:'尚未执行辅助轨迹或结果画线。',
  evidence:'没有新的独立几何条件；不能把绘图步骤数量理解成自由度降低。',
  scope:'此页是已知两个轮廓的圆弧连接教学，不证明完整教材题或全局唯一性。',
  step:0,total:plan.steps.length});
 const step=plan.steps[stage-1];
 return {...step,status:'ready',reason:'此步骤来自经校验的分支数学证明链。',
  step:stage,total:plan.steps.length};
}
module.exports={build,at};
