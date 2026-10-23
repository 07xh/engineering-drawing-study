'use strict';
/**
 * #372 F2: 02/03 specialist-solvers -> canonical ConstructionIntent/1.0.0
 * -> V5 through the ONE existing 07 geometry and timeline implementation.
 *
 * Nothing accepts a caller-supplied "verified plan". Every use recomputes
 * the real R1 specialist solver and checks independent old-path parity.
 * The 02/03 public workbench integration is already merged in #396; subsequent changes follow #152's current-head CI and mathematical evidence requirements.
 */
const {adaptDirectedFillet,adaptPointProjection}=
 require('./verified-teaching-plan.cjs');
const {filletTimeline,pointTimeline}=require('./verified-plan-v5-bridge.cjs');
const {verifiedTeachingActionToV5}=require('./construction-step-v5-adapter.cjs');
const Timeline=require('./teaching-timeline-v5.js');
const {CONSTRUCTION_INTENT_VERSION:VERSION,
 validateConstructionIntentDAG}=require('../core/contracts/construction-intent.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const P=p=>p&&typeof p==='object'&&finite(p.x)&&finite(p.y);
const sheetOk=s=>s&&P(s.origin)&&finite(s.scale)&&s.scale>0;
const point=p=>({x:p.x,y:p.y});
const closed=(revision,reason)=>({status:'not-verified',revision,
 reason,intents:[],steps:[],timing:null,mathematicallyVerified:false});
function operation(action){
 const {id,kind,coordinateSpace}=action;
 let geometry;
 if(kind==='line')geometry={from:point(action.from),to:point(action.to)};
 else if(kind==='point')geometry={at:point(action.at)};
 else if(kind==='circle')geometry={center:point(action.center),radius:action.radius};
 else if(kind==='arc')geometry={center:point(action.center),radius:action.radius,
  startAngle:action.startAngle,endAngle:action.endAngle,direction:action.direction};
 else throw new TypeError('unsupported semantic drawing action');
 return {id,kind:kind==='arc'?'directed-arc':kind,coordinateSpace,geometry};
}
function toV5(op,sheet){
 const a={id:op.id,kind:op.kind==='directed-arc'?'arc':op.kind,
  coordinateSpace:op.coordinateSpace,...op.geometry};
 return verifiedTeachingActionToV5(a,sheet);
}
function sourceOf(plan){
 const fillet=plan.type==='directed-fillet',r=plan.result;
 return {solver:plan.solver,revision:plan.revision,unit:'mm',
  proofScope:plan.proof.scope,
  proofLevel:fillet?'selected-directed-g1':r.proofLevel,
  resultId:r.resultId??null,branchId:fillet?r.selectedBranch:null,
  status:fillet?'selected':'unique',evidenceSource:plan.solver};
}
function intent(step,source){
 const operations=step.actions.map(operation);
 return {schema:VERSION,id:step.id,purpose:step.rule||step.id,
  role:step.role,dependsOn:[...step.dependsOn],
  // Existing R1 only proves the step dependencies. It does not provide
  // fully typed source entity incidence, so NEVER invent inputEntityIds.
  inputEntityIds:[],outputEntityIds:operations.map(o=>o.id),
  operations,source:{...source}};
}
function verifiedConstructionIntentV1(kind,input,sheet,revision=0){
 if(!Number.isSafeInteger(revision)||revision<0)throw new TypeError('revision required');
 if(!['segments','circles','segment-circle','point-projection'].includes(kind))
  throw new TypeError('unsupported specialist kind');
 const projection=kind==='point-projection';
 const paper=projection?(input?.sheetTransform||
  {origin:{x:360,y:175},scale:4}):sheet;
 if(!sheetOk(paper))throw new TypeError('positive sheet transformation required');
 // This is the trust boundary: only real specialist solver results are used.
 const plan=projection?adaptPointProjection(input,{revision}):
  adaptDirectedFillet(kind,input,{revision});
 if(plan.readiness!=='ready'||plan.proof?.verified!==true||
    plan.revision!==revision||!Array.isArray(plan.steps)||!plan.steps.length)
  return closed(revision,plan.result?.reason||'mathematical proof unavailable');
 if(projection){
  if(plan.result.status!=='unique'||plan.result.globallyUnique!==true||
     !['analytic','linear-algebra'].includes(plan.result.proofLevel)||
     !finite(plan.result.maxResidual)||plan.result.maxResidual>1e-8)
   return closed(revision,'3D point proof unavailable');
 }else if(plan.result.status!=='selected'||plan.result.g1Verified!==true||
    !plan.result.selectedBranch||!finite(plan.result.maxResidual)||
    plan.result.maxResidual>1e-7||!finite(plan.result.maxG1Mismatch)||
    plan.result.maxG1Mismatch>1e-7)
  return closed(revision,'directed G1 source evidence unavailable');
 const src=sourceOf(plan),intentSteps=plan.steps.map(s=>intent(s,src));
 // A two-view point reconstruction has an independently solver-derived final
 // sheet point, not one manufactured by the animation.
 if(projection){
  const known=input?.knownViews||{};
  const views=['V','H','W'].filter(k=>Object.hasOwn(known,k));
  if(views.length===2){
   const missing=['V','H','W'].find(k=>!views.includes(k));
   const at=plan.sheet?.[missing];
   if(!P(at))return closed(revision,'missing proven third-view sheet point');
   intentSteps.push({
    schema:VERSION,id:'third-view',purpose:'project-proven-third-view',
    role:'result',dependsOn:[intentSteps.at(-1).id],
    inputEntityIds:[],outputEntityIds:['result-'+missing],
    operations:[{id:'result-'+missing,kind:'point',
     coordinateSpace:'sheet-px',geometry:{at:point(at)}}],
    source:{...src}
   });
  }
 }
 const verdict=validateConstructionIntentDAG(intentSteps);
 if(!verdict.ok)throw new TypeError('canonical intent invalid: '+verdict.errors.join('; '));
 const steps=intentSteps.map(i=>({
  id:i.id,dependsOn:[...i.dependsOn],
  title:i.id==='third-view'?'确定 '+
   i.operations[0].id.slice('result-'.length)+' 面投影':
   plan.steps.find(s=>s.id===i.id)?.explanation,
  explanation:i.id==='third-view'?
   '依据经线性约束证明的三维坐标确定第三面投影，非静态动画预测。':
   plan.steps.find(s=>s.id===i.id)?.explanation,
  role:i.role,actions:i.operations.map(op=>toV5(op,paper))
 }));
 const timing=Timeline.compileTimeline(steps);
 // Validate against the independent previously accepted 02/03 V5 path.
 const original=projection?pointTimeline(input,revision):
  filletTimeline(kind,input,paper,revision);
 if(original.status!=='ready'||original.revision!==revision||
    original.mathematicallyVerified!==true||
    JSON.stringify(steps)!==JSON.stringify(original.steps)||
    JSON.stringify(timing)!==JSON.stringify(original.timing)||
    (original.selectedBranchId??null)!==(src.branchId??null))
  throw new RangeError('canonical intent V5 parity disagrees with proven specialist path');
 return {status:'ready',revision,selectedBranchId:src.branchId,
  schema:VERSION,intents:intentSteps,steps,timing,mathematicallyVerified:true,
  source:'recomputed 02/03 specialist + canonical intent + existing V5',
  proofScope:src.proofScope};
}
module.exports={verifiedConstructionIntentV1};
