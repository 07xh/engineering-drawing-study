'use strict';
/**
 * DraftAI V3.8 / 07. One pure, presentation-only compatibility edge:
 * core ConstructionStep model-mm-2d -> existing V5 Timeline/Motion sheet-px.
 * This module NEVER certifies mathematics or accepts OCR/answer provenance.
 *
 * The current core Arc action encodes a legacy positive SVG-angle interval,
 * not a directed model arc. We fail closed rather than losing orientation.
 */
const {validateConstructionStep}=require('../core/contracts/construction-step.js');
const Timeline=require('./teaching-timeline-v5.js');
const Motion=require('./teaching-motion-v5.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
function requireSheet(sheet){
 if(!record(sheet)||!record(sheet.origin)||!finite(sheet.origin.x)||
    !finite(sheet.origin.y)||!finite(sheet.scale)||sheet.scale<=0)
  throw new TypeError('finite sheet origin and positive px-per-mm scale required');
 return sheet;
}
function toSheet(x,y,sheet){
 if(!finite(x)||!finite(y))throw new TypeError('finite model-mm point required');
 const pt={x:sheet.origin.x+x*sheet.scale,y:sheet.origin.y-y*sheet.scale};
 if(!finite(pt.x)||!finite(pt.y))throw new RangeError('model-to-sheet overflow');
 return pt;
}
function convert(action,sheet,id){
 const g=action.geometry;
 let output;
 if(action.kind==='line'){
  const from=toSheet(g.x1,g.y1,sheet),to=toSheet(g.x2,g.y2,sheet);
  const len=Math.hypot(to.x-from.x,to.y-from.y);
  if(!finite(len)||len<=1e-9)
   throw new RangeError('zero-length or under-resolved model line');
  output={id,kind:'line',geometry:{from,to}};
 }else if(action.kind==='point'){
  output={id,kind:'point',geometry:{center:toSheet(g.x,g.y,sheet),radius:4}};
 }else if(action.kind==='circle'){
  const radius=g.r*sheet.scale;
  if(!finite(radius)||radius<=0)throw new RangeError('circle sheet radius overflow');
  output={id,kind:'circle',geometry:{
   center:toSheet(g.cx,g.cy,sheet),radius}};
 }else if(action.kind==='arc'){
  throw new TypeError('legacy ConstructionStep arc has no safe model direction; use a separately reviewed directed-arc contract');
 }else{
  throw new TypeError('unsupported V5 construction action: '+action.kind);
 }
 // Existing production V5 geometry renderer must be able to consume it.
 Motion.actionShapeAttrs(output,1);
 return Object.freeze({...output,sourceStyle:action.style||null});
}
function constructionStepsToV5(input){
 if(!record(input))throw new TypeError('construction presentation request required');
 const allowed=['steps','frame','unit','sheet','revision'];
 if(Object.keys(input).some(key=>!allowed.includes(key)))
  throw new TypeError('unrecognized presentation field; cannot claim proof through adapter');
 if(input.frame!=='model-mm-2d'||input.unit!=='mm')
  throw new TypeError('explicit model-mm-2d and mm inputs required; never treat image pixels as mm');
 const sheet=requireSheet(input.sheet);
 if(!Number.isSafeInteger(input.revision)||input.revision<0)
  throw new TypeError('nonnegative input revision required');
 if(!Array.isArray(input.steps)||!input.steps.length||input.steps.length>300)
  throw new TypeError('1..300 bounded ConstructionSteps required');
 const used=new Set(),converted=[];
 for(const [i,step] of input.steps.entries()){
  const verdict=validateConstructionStep(step);
  if(!verdict.ok)throw new TypeError('invalid ConstructionStep: '+verdict.errors.join('; '));
  if(used.has(step.id))throw new TypeError('duplicate ConstructionStep id');
  if((step.dependsOn||[]).some(dep=>!used.has(dep)))
   throw new TypeError('future/missing dependency in ConstructionStep');
  used.add(step.id);
  const id='v5_step_'+(i+1);
  const actions=step.actions.map((a,j)=>convert(a,sheet,'v5_action_'+(i+1)+'_'+(j+1)));
  const dependsOn=(step.dependsOn||[]).map(dep=>{
   const position=input.steps.findIndex(s=>s.id===dep);
   return 'v5_step_'+(position+1);
  });
  converted.push({id,sourceStepId:step.id,
   title:step.explanation,explanation:step.explanation,
   reason:step.reason||null,solveResultRef:step.solveResultRef||null,
   constraintIds:[...(step.constraintIds||[])],
   targetIds:[...(step.targetIds||[])],dependsOn,actions});
 }
 const timing=Timeline.compileTimeline(converted);
 return Object.freeze({
  schema:'draftai-constructionstep-v5-presentation/1',
  status:'presentation-only',frame:'sheet-px',modelUnit:'mm',
  revision:input.revision,steps:converted,timing,
  mathematicallyVerified:false,readyForStandardAnswer:false,
  requiresTrustedSolveResult:true,
  // The pure format adapter is not an answer/proof gateway.
  verificationScope:null,provenanceVerified:false
 });
}

/**
 * Exact presentation bridge for existing, independently proof-gated R1
 * teaching plans. The caller (verified-plan-v5-bridge) MUST recompute with
 * domain solvers and check plan.proof. This returns a V5 shape, not proof.
 * Consolidates previously duplicated 07 model-mm/sheet-px conversion here.
 * In contrast to legacy core/1 SVG arcs, the R1 contract carries explicit
 * mathematical startAngle/endAngle and signed cw/ccw direction.
 */
function verifiedTeachingActionToV5(a,sheet){
 requireSheet(sheet);
 if(!record(a)||typeof a.id!=='string'||!a.id||
    !['line','point','circle','arc'].includes(a.kind))
  throw new TypeError('unsupported normalized teaching action');
 const isSheet=a.coordinateSpace==='sheet-px';
 const isModel=a.coordinateSpace==='model-mm';
 if(!isSheet&&!isModel)throw new TypeError('unknown geometry coordinate space');
 let geometry;
 if(a.kind==='arc'){
  if(!isModel)throw new TypeError('a directed arc must be mathematical model geometry');
  geometry=Motion.projectArcFromVerifiedModel(a,sheet);
 }else if(a.kind==='line'){
  if(!record(a.from)||!record(a.to)||
     ![a.from.x,a.from.y,a.to.x,a.to.y].every(finite))
   throw new TypeError('invalid construction endpoints');
  const from=isSheet?{x:a.from.x,y:a.from.y}:toSheet(a.from.x,a.from.y,sheet);
  const to=isSheet?{x:a.to.x,y:a.to.y}:toSheet(a.to.x,a.to.y,sheet);
  const len=Math.hypot(from.x-to.x,from.y-to.y);
  if(!finite(len)||len<=1e-9)
   throw new RangeError('zero-length or overflowing rendered guide');
  geometry={from,to};
 }else if(a.kind==='point'){
  if(!record(a.at)||!finite(a.at.x)||!finite(a.at.y))
   throw new TypeError('point must have finite coordinates');
  // 03 first-angle projection has independently proven sheet-px transfer
  // points; explicit sheet space is consumed unchanged, never scaled twice.
  // This presentation-only converter cannot itself issue a math proof.
  geometry={center:isModel?toSheet(a.at.x,a.at.y,sheet):
   {x:a.at.x,y:a.at.y},radius:4};
 }else {
  if(!isModel||!record(a.center)||!finite(a.center.x)||
     !finite(a.center.y)||!finite(a.radius)||a.radius<=0)
   throw new TypeError('circle must be in model math units');
  const radius=a.radius*sheet.scale;
  if(!finite(radius)||radius<=0)throw new RangeError('radius conversion overflow');
  geometry={center:toSheet(a.center.x,a.center.y,sheet),radius};
 }
 const out={id:a.id,kind:a.kind,geometry};
 Motion.actionShapeAttrs(out,1);
 return out;
}

module.exports={constructionStepsToV5,verifiedTeachingActionToV5};
