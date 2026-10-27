'use strict';
/**
 * C2 native formal FIRST-ANGLE V/H/W static last frame from ONLY the
 * already existing canonical V5 actions (NOT a renderer-owned solver,
 * not a second animator, not a mathematical certification authority).
 *
 * The one producing authority is the fresh OCP→M0→M4→M5→Intent→DAG→V5
 * caller. This pure formatter independently recompiles the same current
 * V5 timeline, recovers EACH actual signed formal action and requires
 * exact original first-angle toSheet source coordinate correspondence.
 * Mathematically suppressed 3D back aliases have NO extra action.
 *
 * Returns an SVG for inspection/export. It does not sign a forged caller
 * object, run BRep/HLR or make arbitrary meshes/reference textbook valid.
 */
const {VIEWS,toSheet}=require('../core/projection/conventions.js');
const {validateConstructionIntentDAG}=
 require('../core/contracts/construction-intent.js');
const {assertM3ToV5Consistency}=
 require('./m3-v5-consistency-gate.cjs');
const Motion=require('./teaching-motion-v5.js');
const Timeline=require('./teaching-timeline-v5.js');
const finite=Number.isFinite;
const esc=t=>String(t).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&quot;'
})[c]);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function renderC2NativeOriginalV5FinalFrameSvg({
 certifiedV5,revision
}={}){
 if(certifiedV5?.schema!==
    'draftai-c2-trusted-native-partial-construction-intent-v5/1'||
    certifiedV5.revision!==revision||
    !Number.isSafeInteger(revision)||revision<1||
    certifiedV5.boundedTwoBoxUnionFullFormalV5Certified!==true||
    certifiedV5.allNativePhysicalSourcesSignedOrProvenSuppressed!==true||
    !Array.isArray(certifiedV5.certifiedVisibleHiddenSourceIntervals)||
    !Array.isArray(certifiedV5.suppressedNativeBackSourceIntervals)||
    certifiedV5.unsignedNativePhysicalSourceIntervals?.length!==0||
    !Array.isArray(certifiedV5.intents)||!Array.isArray(certifiedV5.steps)||
    !certifiedV5.timeline||!certifiedV5.sheetTransform)
  throw new TypeError('complete same-run two-box union original V5 result required');
 const signed=certifiedV5.certifiedVisibleHiddenSourceIntervals,
  steps=certifiedV5.steps,intents=certifiedV5.intents;
 if(!signed.length||signed.length>200||
    signed.length!==steps.length||steps.length!==intents.length)
  throw new RangeError('every certified C2 native line must have one canonical V5 step');
 const check=validateConstructionIntentDAG(intents);
 if(!check.ok)throw new RangeError('native paper SVG requires valid original Intent DAG');
 const actionById=new Map(),existingStyles=Object.create(null),
  styles=Object.create(null),views=new Map(VIEWS.map(v=>[v,[]]));
 for(const [index,step] of steps.entries()){
  if(step.id!==intents[index].id||step.actions?.length!==1||
     step.actions[0].kind!=='line')
   throw new RangeError('original V5 step/intent action identity changed');
  const action=step.actions[0];
  if(actionById.has(action.id))
   throw new RangeError('duplicate original signed native V5 action ID');
  actionById.set(action.id,action);
  styles[step.id]=action.engineeringLineStyle;
  existingStyles[step.id]=action.engineeringLineStyle;
 }
 if(actionById.size!==signed.length)
  throw new RangeError('signed sources differ from original V5 action inventory');
 const attrs=[];
 for(const binding of signed){
  const view=binding.view,
   action=actionById.get(binding.actionId);
  if(!VIEWS.includes(view)||!action||
     !Number.isSafeInteger(binding.sourceNativeResultEdgeOrdinal)||
     binding.sourceNativeResultEdgeOrdinal<1||
     binding.fullOriginalC2NativeM0M4M5ProofVerifiedInFreshRun!==true||
     binding.signedByExistingConstructionIntentDagAndSingleV5!==true||
     binding.standardEngineeringLineStyle!==action.engineeringLineStyle)
   throw new RangeError('no original M5 source for V5 official line');
  const expectedA=toSheet(view,binding.projectedFromModelMm,
    certifiedV5.sheetTransform),
   expectedB=toSheet(view,binding.projectedToModelMm,
    certifiedV5.sheetTransform);
  const line=action.geometry;
  if(!line?.from||!line.to||
     Math.hypot(line.from.x-expectedA.x,line.from.y-expectedA.y)>1e-8||
     Math.hypot(line.to.x-expectedB.x,line.to.y-expectedB.y)>1e-8)
   throw new RangeError('original V5 action has drifted from M3 first-angle source projection');
  const shape=Motion.actionShapeAttrs(action,1);
  if(!['none','6 3'].includes(shape['stroke-dasharray'])||
     ![1,2].includes(shape['stroke-width'])||
     ![shape.x1,shape.x2,shape.y1,shape.y2].every(finite))
   throw new RangeError('unsupported original formal line-renderer style');
  views.get(view).push({binding,shape});
  attrs.push({view,...shape});
 }
 assertM3ToV5Consistency({
  revision,intents,steps,timing:certifiedV5.timeline,
  sheet:certifiedV5.sheetTransform,styleByIntentId:styles
 });
 const rebuilt=Timeline.compileTimeline(steps);
 if(!same(rebuilt,certifiedV5.timeline)||
    !Timeline.createPlayer(rebuilt,{revision}).canRender(revision))
  throw new RangeError('source-paper frame not from sole original V5 timeline');
 const xs=attrs.flatMap(a=>[a.x1,a.x2]),
  ys=attrs.flatMap(a=>[a.y1,a.y2]);
 const pad=36,left=Math.min(...xs)-pad,top=Math.min(...ys)-pad,
  width=Math.max(...xs)-Math.min(...xs)+2*pad,
  height=Math.max(...ys)-Math.min(...ys)+2*pad;
 if(![left,top,width,height].every(finite)||width<=0||height<=0)
  throw new RangeError('invalid original V/H/W sheet bounds');
 const groups=VIEWS.map(view=>{
  const parts=views.get(view);
  const strokes=parts.map(({binding,shape})=>
   '<line x1="'+shape.x1+'" y1="'+shape.y1+
   '" x2="'+shape.x2+'" y2="'+shape.y2+
   '" stroke="#111827" stroke-width="'+shape['stroke-width']+
   '" stroke-dasharray="'+shape['stroke-dasharray']+
   '" data-original-topods-edge="'+
   binding.sourceNativeResultEdgeOrdinal+
   '" data-action-id="'+esc(binding.actionId)+'"/>').join('');
  const vx=parts.flatMap(x=>[x.shape.x1,x.shape.x2]),
   vy=parts.flatMap(x=>[x.shape.y1,x.shape.y2]);
  const labelX=Math.min(...vx,certifiedV5.sheetTransform.origin.x)-6,
   labelY=Math.min(...vy,certifiedV5.sheetTransform.origin.y)-10;
  const label='<text x="'+labelX+'" y="'+labelY+
   '" fill="#2563eb" font-size="11" font-family="sans-serif">'+view+'</text>';
  return '<g data-first-angle-view="'+view+'">'+strokes+label+'</g>';
 });
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+
  [left,top,width,height].join(' ')+
  '" role="img" aria-label="C2 verified native OpenCascade first-angle V H W V5 final frame">'+
  '<title>C2 original single V5 final drawing frame</title>'+
  '<desc>Every line is an existing signed canonical V5 action from the real '+
  'native two-box-union proof. Strictly hidden duplicates are not repeated.'+
  '</desc>'+groups.join('')+'</svg>';
 return Object.freeze({
  schema:'draftai-c2-only-original-v5-final-svg/1',revision,
  status:'read-only-canonical-V5-final-frame',
  svg,
  signedOriginalV5ActionCount:attrs.length,
  suppressedBehindSourceCount:
   certifiedV5.suppressedNativeBackSourceIntervals.length,
  visibleLineCount:attrs.filter(x=>x['stroke-dasharray']==='none').length,
  hiddenLineCount:attrs.filter(x=>x['stroke-dasharray']==='6 3').length,
  viewActionCounts:Object.freeze(
   Object.fromEntries(VIEWS.map(v=>[v,views.get(v).length]))),
  newV5ActionCount:0,
  independentNativeOCPExecutionVerifiedHere:false,
  thisPureRendererCannotIssueMathematicalSignoff:true
 });
}
module.exports={renderC2NativeOriginalV5FinalFrameSvg};
