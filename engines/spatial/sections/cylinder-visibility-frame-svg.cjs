'use strict';
/**
 * 04 independent full-sheet SVG frame composer for validated cylinder cut.
 *
 * Reuses the EXISTING V5 timeline's per-action progress; result strokes go
 * through the 04 visibility-aware SVG renderer, never the legacy solid-line
 * renderer. Static givens and model-derived auxiliary steps are separated.
 * This is an internal SVG artifact generator, not production browser wiring.
 */
const {cylinderVisibilityV5Preview,renderVisibilityActionSvg}=
 require('./cylinder-visibility-v5-svg.cjs');
const Timeline=require('../../../workbench/teaching-timeline-v5.js');
const Motion=require('../../../workbench/teaching-motion-v5.js');

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const safeId=s=>typeof s==='string'&&/^[A-Za-z][A-Za-z0-9_+-]{0,79}$/.test(s);
const number=n=>{
 if(!finite(n)||Math.abs(n)>1e9)throw new RangeError('invalid SVG coordinate');
 return String(Number(n.toFixed(6)));
};
const escape=s=>String(s).replace(/[&<>"']/g,ch=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'
})[ch]);
function plainShape(action,progress,layer){
 if(!action||!safeId(action.id)||!['given','guide'].includes(layer))
  throw new TypeError('only verified source and guide actions can be drawn');
 const a=Motion.actionShapeAttrs(action,progress);
 const common=' data-action="'+escape(action.id)+'" data-layer="'+layer+'"';
 const stroke=layer==='given'?'#313b49':'#8794a5';
 const weight=layer==='given'?'1.75':'1.1';
 if(action.kind==='line')
  return '<line x1="'+number(a.x1)+'" y1="'+number(a.y1)+
   '" x2="'+number(a.x2)+'" y2="'+number(a.y2)+
   '" stroke="'+stroke+'" stroke-width="'+weight+
   '" stroke-dasharray="'+(layer==='guide'?'4 4':'none')+
   '" fill="none"'+common+'/>';
 if(action.kind==='circle'){
  const dash=a['stroke-dasharray'];
  if(typeof dash!=='string'||(dash!=='none'&&!/^[0-9.+eE -]+$/.test(dash)))
   throw new RangeError('unsafe V5 progressive circle stroke');
  return '<circle cx="'+number(a.cx)+'" cy="'+number(a.cy)+
   '" r="'+number(a.r)+'" stroke="'+stroke+'" stroke-width="'+weight+
   '" stroke-dasharray="'+dash+'" fill="none"'+common+'/>';
 }
 if(action.kind==='point')
  return '<circle cx="'+number(a.cx)+'" cy="'+number(a.cy)+
   '" r="'+number(a.r)+'" fill="'+stroke+
   '" opacity="'+number(a.opacity)+'"'+common+'/>';
 throw new TypeError('unsupported static section primitive');
}
function createCylinderVisibilitySvgScene(cylinder,plane,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))
  throw new TypeError('explicit trusted visibility options required');
 const {revision,retainedHalfspace,observerDirections,samplesPerTurn=64}=options;
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current model revision required for SVG frame export');
 const plan=cylinderVisibilityV5Preview(cylinder,plane,{
  retainedHalfspace,observerDirections,samplesPerTurn
 });
 if(plan.status!=='ready'||plan.mathematicalPerimeterVerified!==true||
    plan.v5PreviewReady!==true||!plan.independentVisibilitySvgRendererReady)
  return Object.freeze({status:'blocked',reason:plan.reason||'math proof incomplete',
   renderFrame(){throw new RangeError('no verified SVG timeline available');},
   revision,globallyUnique:null});
 const inputSignature=JSON.stringify({cylinder,plane,retainedHalfspace,
  observerDirections,samplesPerTurn});
 if(typeof inputSignature!=='string'||inputSignature.length>100000)
  throw new RangeError('unbounded input snapshot');
 const {timing,steps,givens,sheet}=plan;
 if(sheet.width!==960||sheet.height!==680||!Array.isArray(steps)||!givens.length)
  throw new RangeError('unsupported original 04 sheet contract');
 const ids=new Set();
 for(const step of steps)for(const action of step.actions){
  if(!safeId(action.id)||ids.has(action.id))
   throw new TypeError('invalid or duplicate verified action ID');
  ids.add(action.id);
  if(step.role==='result'&&!['visible','hidden','undetermined'].includes(action.visibility))
   throw new TypeError('result lacks independent mathematical visibility evidence');
 }
 function renderFrame({elapsedMs,expectedRevision}={}){
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision!==revision)
   throw new RangeError('stale or missing geometry revision');
  const currentSignature=JSON.stringify({cylinder,plane,retainedHalfspace,
   observerDirections,samplesPerTurn});
  if(currentSignature!==inputSignature)
   throw new RangeError('geometry or observer inputs changed; rebuild verified scene');
  if(!finite(elapsedMs)||elapsedMs<0||elapsedMs>timing.totalMs)
   throw new RangeError('elapsedMs must be inside verified V5 timeline');
  const current=Timeline.frame(timing,elapsedMs);
  const base=givens.map(a=>plainShape(a,1,'given'));
  const guides=[],results=[];
  const rendered={given:base.length,guide:0,visible:0,hidden:0,undetermined:0};
  for(const step of steps){
   for(const action of step.actions){
    const fraction=current.actionFractions[action.id];
    if(!finite(fraction)||fraction<=0)continue;
    if(step.role==='guide'){
     guides.push(plainShape(action,fraction,'guide'));
     rendered.guide++;
    }else if(step.role==='result'){
     const shape=renderVisibilityActionSvg(action,fraction);
     results.push(shape);
     rendered[action.visibility]++;
    }else throw new TypeError('unexpected mathematical step role');
   }
  }
  const svg='<svg xmlns="http://www.w3.org/2000/svg"'+
   ' width="960" height="680" viewBox="0 0 960 680" role="img">'+
   '<title>DraftAI V3.8 截切圆柱分步工程图预览</title>'+
   '<desc>仅已确认的圆柱、斜截平面、保留实体侧及观察方向；未审定正式第一角法虚实线标准。</desc>'+
   '<rect x="0" y="0" width="960" height="680" fill="white"/>'+
   '<g id="source-cylinder">'+base.join('')+'</g>'+
   '<g id="construction-guides">'+guides.join('')+'</g>'+
   '<g id="verified-section-strokes">'+results.join('')+'</g>'+
   '</svg>';
  return Object.freeze({
   svg,elapsedMs:current.elapsedMs,totalMs:timing.totalMs,
   revision,activeStepIndex:current.activeStepIndex,
   activeStepId:current.activeStepId,activeActionId:current.activeActionId,
   completedActionCount:current.completedIds.length,done:current.done,
   rendered:Object.freeze(rendered),
   firstAngleObserverConventionsSignedOff:false,
   completeEngineeringDrawingVerified:false,globallyUnique:null
  });
 }
 return Object.freeze({
  status:'ready',revision,totalMs:timing.totalMs,
  stepCount:steps.length,visibilityLineStylesFullyVerified:
   plan.visibilityLineStylesFullyVerified,
  productionUiIntegrated:false,
  firstAngleObserverConventionsSignedOff:false,
  renderFrame
 });
}
module.exports={createCylinderVisibilitySvgScene};
