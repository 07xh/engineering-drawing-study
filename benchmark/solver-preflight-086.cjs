'use strict';
/**
 * #380: executable, metadata-only capability preflight for self-authored
 * structured drills. This is NOT an ingestion, OCR, answer, or completion
 * registry for the user's 86-page copyrighted exercise book.
 *
 * Recomputes actual M3 specialists via the already merged R1 -> V5 bridge.
 * Does not create an alternate solver, SolveResult, Intent or V5 timeline.
 */
const {filletTimeline,pointTimeline}=
 require('../workbench/verified-plan-v5-bridge.cjs');
const Timeline=require('../workbench/teaching-timeline-v5.js');

const SHEET=Object.freeze({origin:{x:360,y:220},scale:8});
const REVISION=23;
const SAMPLES=Object.freeze([
 {id:'self-authored-two-segments',family:'segments',topic:'二维有限线段圆弧连接',
  input:{first:{a:{x:-20,y:0},b:{x:20,y:0}},
   second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10,
   branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'}},
 {id:'self-authored-two-circles',family:'circles',topic:'二维两圆圆弧连接',
  input:{first:{center:{x:0,y:0},radius:5},
   second:{center:{x:20,y:0},radius:5},filletRadius:10,
   firstMode:'external',secondMode:'external',branchId:'center-1',
   direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'}},
 {id:'self-authored-segment-circle',family:'segment-circle',topic:'有限线段与圆连接',
  input:{segment:{a:{x:-15,y:0},b:{x:15,y:0}},
   circle:{center:{x:0,y:5},radius:8},filletRadius:3,side:1,
   branchId:'candidate-1',direction:'ccw',lineTravel:'forward',
   knownCircleTravel:'cw'}},
 {id:'self-authored-point-projection',family:'point-projection',topic:'两已知视图补第三投影',
  input:{knownViews:{V:[15,12],H:[15,10]}}}
]);
const finite=x=>typeof x==='number'&&Number.isFinite(x);

function inspectPlayback(sample,p,revision=REVISION){
 const faults=[];
 const requireTrue=(condition,message)=>{if(!condition)faults.push(message);};
 requireTrue(p&&p.status==='ready','not-ready');
 requireTrue(p?.mathematicallyVerified===true,'math-unverified');
 requireTrue(p?.originalLesson?.proof?.verified===true,'missing-solver-proof');
 requireTrue(p?.revision===revision,'stale-revision');
 const result=p?.originalLesson?.result;
 if(sample.family==='point-projection'){
  requireTrue(result?.globallyUnique===true&&result?.status==='unique',
   'point-not-uniquely-determined');
  requireTrue(finite(result?.maxResidual)&&result.maxResidual<=1e-8,
   'point-residual-unverified');
 }else{
  requireTrue(p?.selectedBranchId===sample.input.branchId,'unselected-branch');
  requireTrue(result?.g1Verified===true,'missing-directed-g1');
  requireTrue(finite(result?.maxResidual)&&result.maxResidual<=1e-7,
   'fillet-residual-unverified');
  requireTrue(finite(result?.maxG1Mismatch)&&result.maxG1Mismatch<=1e-7,
   'g1-residual-unverified');
  requireTrue(result?.arc?.direction===sample.input.direction,
   'missing-directed-arc');
  requireTrue(p?.sourceBounds?.contactArcMembershipVerified!==false,
   'source-arc-out-of-range');
  requireTrue(p?.sourceBounds?.finiteSegmentContactVerified!==false,
   'source-segment-out-of-range');
 }
 const steps=p?.steps;
 requireTrue(Array.isArray(steps)&&steps.length>=3,'missing-construction-steps');
 if(Array.isArray(steps)){
  const prior=new Set(),entities=new Set();
  for(const step of steps){
   requireTrue(typeof step.id==='string'&&!!step.id&&!prior.has(step.id),
    'duplicate-step-id');
   requireTrue(Array.isArray(step.dependsOn)&&
    step.dependsOn.every(id=>prior.has(id)),'invalid-dag-dependency');
   requireTrue(Array.isArray(step.actions)&&step.actions.length>0,
    'empty-construction-step');
   for(const action of step.actions||[]){
    requireTrue(typeof action.id==='string'&&!!action.id&&!entities.has(action.id),
     'invalid-or-duplicate-v5-action');
    entities.add(action.id);
   }
   prior.add(step.id);
  }
  const last=steps.at(-1)?.actions||[];
  requireTrue(last.some(a=>a.kind===(sample.family==='point-projection'?'point':'arc')),
   'missing-final-drawn-geometry');
 }
 requireTrue(finite(p?.timing?.totalMs)&&p.timing.totalMs>0,
  'missing-v5-timeline');
 if(p?.timing&&finite(p.timing.totalMs)&&p.timing.totalMs>0){
  try{
   requireTrue(Timeline.frame(p.timing,p.timing.totalMs).done===true,
    'v5-does-not-complete');
  }catch(_error){faults.push('invalid-v5-timeline');}
 }
 return {id:sample.id,family:sample.family,topic:sample.topic,
  scope:'self-authored-structured-input',passed:faults.length===0,
  faults,stepCount:Array.isArray(steps)?steps.length:0,
  branchId:p?.selectedBranchId??null,revision,
  // Both the animation and residual are derived from the same recomputed solver.
  // These values do not constitute independent original-textbook acceptance.
  mathEvidence:result?.proofLevel??p?.proofScope??null};
}

function runPreflight(){
 const cases=SAMPLES.map(sample=>{
  try{
   const p=sample.family==='point-projection'
    ?pointTimeline(sample.input,REVISION)
    :filletTimeline(sample.family,sample.input,SHEET,REVISION);
   return inspectPlayback(sample,p);
  }catch(error){
   return {id:sample.id,family:sample.family,topic:sample.topic,
    scope:'self-authored-structured-input',passed:false,
    faults:['solver-or-adapter-threw:'+String(error?.message||error).slice(0,120)],
    stepCount:0,branchId:null,revision:REVISION,mathEvidence:null};
  }
 });
 return Object.freeze({
  format:'draftai-bench086-solver-preflight/1',
  scope:'synthetic-only-not-original-exercise-coverage',
  candidateOriginalExercisesSolved:0,
  originalBookPagesIndexedByThisTool:0,
  syntheticCases:cases.length,passed:cases.filter(x=>x.passed).length,
  failed:cases.filter(x=>!x.passed).length,cases
 });
}
function asMarkdown(r){
 return ['# DraftAI 配套习题求解能力预检（仅原创结构化题）','',
  '- 自编测试题通过：'+r.passed+'/'+r.syntheticCases,
  '- 原书习题端到端通过新增数：0（本工具不读取原书）',
  '- 识图、真实题图盲测、Android 和线上发布：本次未验收','',
  ...r.cases.map(x=>'- '+(x.passed?'PASS':'FAIL')+' '+x.topic+
   (x.passed?' · 专业数学与现有 V5 步骤可消费':' · '+x.faults.join(', '))),
  '',
  '**本预检不能当作 86 页习题的解题覆盖率或正式 ConstructionIntent 签收。**'
 ].join('\n');
}
module.exports={SAMPLES,SHEET,REVISION,inspectPlayback,runPreflight,asMarkdown};
