'use strict';
/**
 * R2 opt-in composition: R1 proof-backed lesson plan -> existing 07 V5 SVG
 * timeline. Inputs are recomputed by real mathematical solvers; there is no
 * public adapter accepting arbitrary/unverified user-supplied step fixtures.
 *
 * This intentionally does not replace the public pages or the existing
 * synthetic V5 preview until a separate real-browser integration PR passes.
 */
const {adaptPointProjection,adaptDirectedFillet}=
 require('./verified-teaching-plan.cjs');
const Motion=require('./teaching-motion-v5.js');
const Timeline=require('./teaching-timeline-v5.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>p!==null&&typeof p==='object'&&finite(p.x)&&finite(p.y);
const DEFAULT_SHEET=Object.freeze({origin:{x:360,y:220},scale:8});
function validateSheet(sheet){
 if(!sheet||!point(sheet.origin)||!finite(sheet.scale)||sheet.scale<=0)
  throw new TypeError('positive px-per-mm scale and finite sheet origin required');
 return sheet;
}
function toSheet(p,sheet){
 if(!point(p))throw new TypeError('non-finite model point');
 const out={x:sheet.origin.x+sheet.scale*p.x,
  y:sheet.origin.y-sheet.scale*p.y};
 if(!point(out))throw new RangeError('model-to-sheet coordinate overflow');
 return out;
}
function actionToV5(a,sheet){
 if(!a||typeof a.id!=='string'||!['line','point','circle','arc'].includes(a.kind))
  throw new TypeError('unsupported normalized teaching action');
 const isSheet=a.coordinateSpace==='sheet-px';
 const isModel=a.coordinateSpace==='model-mm';
 if(!isSheet&&!isModel)throw new TypeError('unknown geometry coordinate space');
 if(a.kind==='arc'){
  if(!isModel)throw new TypeError('a verified arc must be mathematical model geometry');
  const geometry=Motion.projectArcFromVerifiedModel(a,sheet);
  return {id:a.id,kind:'arc',geometry};
 }
 if(a.kind==='line'){
  if(!point(a.from)||!point(a.to))
   throw new TypeError('invalid construction endpoints');
  const from=isSheet?{...a.from}:toSheet(a.from,sheet);
  const to=isSheet?{...a.to}:toSheet(a.to,sheet);
  if(Math.hypot(from.x-to.x,from.y-to.y)<=1e-9)
   throw new RangeError('zero-length rendered guide');
  return {id:a.id,kind:'line',geometry:{from,to}};
 }
 if(a.kind==='point'){
  if(!isModel||!point(a.at))
   throw new TypeError('point must be in model math coordinates');
  return {id:a.id,kind:'point',geometry:{center:toSheet(a.at,sheet),radius:4}};
 }
 if(!isModel||!point(a.center)||!finite(a.radius)||a.radius<=0)
  throw new TypeError('circle must be in model math units');
 const radius=a.radius*sheet.scale;
 if(!finite(radius)||radius<=0)throw new RangeError('radius conversion overflow');
 return {id:a.id,kind:'circle',geometry:{center:toSheet(a.center,sheet),radius}};
}
function convertVerified(plan,sheet){
 if(!plan||plan.schema!=='draftai-teaching-plan/0.1'||
    plan.proof?.verified!==true||plan.readiness!=='ready'||
    !Array.isArray(plan.steps)||!plan.steps.length)
  return {status:'not-verified',revision:plan?.revision??null,
   reason:plan?.result?.reason||'no mathematical proof-backed construction',
   source:'R1 verified lesson plan',steps:[],mathematicallyVerified:false};
 const steps=plan.steps.map(step=>({
  id:step.id,dependsOn:[...step.dependsOn],
  title:step.explanation,explanation:step.explanation,
  role:step.role,
  actions:step.actions.map(a=>actionToV5(a,sheet))
 }));
 const timing=Timeline.compileTimeline(steps);
 return {status:'ready',source:'R1 verified lesson plan',
  revision:plan.revision,steps,timing,
  mathematicallyVerified:true,selectedBranchId:plan.result.selectedBranch??null,
  proofScope:plan.proof.scope,solver:plan.solver,
  residualMm:plan.result.maxResidual,
  g1Residual:plan.result.maxG1Mismatch??null,
  originalLesson:plan};
}
function pointTimeline(input={},revision=0){
 const sheet=input.sheetTransform||{origin:{x:360,y:175},scale:4};
 validateSheet(sheet);
 const normalized=adaptPointProjection(input,{revision});
 const result=convertVerified(normalized,sheet);
 if(result.status!=='ready')return result;
 const known=input.knownViews||{};
 const views=['V','H','W'].filter(k=>Object.hasOwn(known,k));
 result.givens=views.map(name=>({id:'given-'+name,kind:'point',
  geometry:{center:{...normalized.sheet[name]},radius:5},role:'given',name}));
 // Completing a third view is a genuine derived *point*, not an animation guess.
 if(views.length===2&&normalized.sheet){
  const missing=['V','H','W'].find(name=>!views.includes(name));
  const previous=result.steps.at(-1);
  result.steps.push({id:'third-view',dependsOn:[previous.id],
   title:'确定 '+missing+' 面投影',
   explanation:'依据经线性约束证明的三维坐标确定第三面投影，非静态动画预测。',
   role:'result',actions:[{id:'result-'+missing,kind:'point',
    geometry:{center:{...normalized.sheet[missing]},radius:4}}]});
  result.timing=Timeline.compileTimeline(result.steps);
 }
 return result;
}
function filletTimeline(kind,input={},sheet=DEFAULT_SHEET,revision=0){
 validateSheet(sheet);
 const plan=adaptDirectedFillet(kind,input,{revision});
 return convertVerified(plan,sheet);
}
module.exports={pointTimeline,filletTimeline};
