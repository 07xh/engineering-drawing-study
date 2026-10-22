'use strict';
/**
 * 04 V4.0: verified prism-section V5 steps -> complete bounded SVG frame.
 *
 * The intersected polygon is an exact, mathematically verified 1D perimeter.
 * Every result stroke uses an explicitly UNCERTAIN line type: no unsupported
 * claim of national-standard visibility is allowed in the SVG.
 */
const {prismSectionV5Preview}=require('./rectangular-prism-v5-preview.cjs');
const Timeline=require('../../../workbench/teaching-timeline-v5.js');
const Motion=require('../../../workbench/teaching-motion-v5.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function number(n){
 if(!finite(n)||Math.abs(n)>1e9)throw new RangeError('unsafe SVG coordinate');
 return String(Number(n.toFixed(6)));
}
const idCheck=s=>typeof s==='string'&&/^[a-z][a-z0-9_+-]{0,79}$/i.test(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>
 ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function element(action,fraction,layer){
 if(!idCheck(action.id)||!['given','guide','result'].includes(layer))
  throw new TypeError('invalid verified prism action ID');
 const a=Motion.actionShapeAttrs(action,fraction);
 if(layer==='result'&&action.visibility!=='undetermined')
  throw new TypeError('uncertified prism visibility must remain undetermined');
 const style=layer==='given'?
  {stroke:'#344253',dash:'none',width:1.8}:
  layer==='guide'?
   {stroke:'#8195a4',dash:'4 4',width:1.2}:
   {stroke:'#b26b19',dash:'2 5',width:2};
 const mark=' data-action="'+escape(action.id)+'" data-layer="'+layer+'"';
 const hint=layer==='result'?' data-visibility="undetermined" data-source="'+
  escape(action.sourceSectionEdgeId)+'"':'';
 if(action.kind==='line'){
  return '<line x1="'+number(a.x1)+'" y1="'+number(a.y1)+
   '" x2="'+number(a.x2)+'" y2="'+number(a.y2)+
   '" stroke="'+style.stroke+'" stroke-width="'+number(style.width)+
   '" stroke-dasharray="'+style.dash+'" fill="none"'+mark+hint+'/>';
 }
 if(action.kind==='point'){
  return '<circle cx="'+number(a.cx)+'" cy="'+number(a.cy)+
   '" r="'+number(a.r)+'" fill="'+style.stroke+'" opacity="'+number(a.opacity)+
   '"'+mark+hint+'/>';
 }
 throw new TypeError('unsupported prism V5 SVG action');
}
function createPrismV5SvgScene(box,plane,{revision=0}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('nonnegative model revision required');
 const plan=prismSectionV5Preview(box,plane);
 if(plan.status!=='ready'||!plan.mathematicalPerimeterVerified||
    !plan.v5PreviewReady)
  return Object.freeze({
   status:'blocked',reason:plan.reason||'unverified prism section',
   revision,renderFrame(){throw new RangeError('no verified prism V5 frame');}
  });
 const inputSignature=JSON.stringify({box,plane});
 if(inputSignature.length>10000)throw new RangeError('unbounded model input');
 const {givens,steps,timing,sheet}=plan;
 if(sheet.width!==960||sheet.height!==680)
  throw new RangeError('unsupported bounded prism paper');
 const identifiers=new Set();
 for(const action of [...givens,...steps.flatMap(s=>s.actions)]){
  if(!idCheck(action.id)||identifiers.has(action.id))
   throw new TypeError('invalid or repeated drawing action ID');
  identifiers.add(action.id);
 }
 function check(expectedRevision){
  if(expectedRevision!==revision)
   throw new RangeError('stale prism drawing revision');
  if(inputSignature!==JSON.stringify({box,plane}))
   throw new RangeError('prism geometry modified; rebuild verified scene');
 }
 function renderFrame({elapsedMs,expectedRevision}={}){
  check(expectedRevision);
  if(!finite(elapsedMs)||elapsedMs<0||elapsedMs>timing.totalMs)
   throw new RangeError('invalid V5 frame time');
  const at=Timeline.frame(timing,elapsedMs);
  const base=givens.map(a=>element(a,1,'given')),guides=[],results=[];
  for(const step of steps)for(const action of step.actions){
   const fraction=at.actionFractions[action.id];
   if(!finite(fraction)||fraction<=0)continue;
   if(step.role==='guide')guides.push(element(action,fraction,'guide'));
   else if(step.role==='result')results.push(element(action,fraction,'result'));
   else throw new TypeError('invalid verified section step');
  }
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="960" height="680" viewBox="0 0 960 680" role="img">'+
   '<title>DraftAI 棱柱截交线真实数学动态作图</title>'+
   '<desc>三视图线型未完成工程制图可见性认证。截面轮廓为准确有限棱边求交，颜色与虚点线仅为待审核提示。</desc>'+
   '<rect x="0" y="0" width="960" height="680" fill="white"/>'+
   '<g id="prism-source">'+base.join('')+'</g>'+
   '<g id="prism-guides">'+guides.join('')+'</g>'+
   '<g id="prism-cut-unknown-visibility">'+results.join('')+'</g></svg>';
  return Object.freeze({svg,revision,elapsedMs:at.elapsedMs,totalMs:timing.totalMs,
   done:at.done,activeStepId:at.activeStepId,
   activeStepIndex:at.activeStepIndex,activeActionId:at.activeActionId,
   completeActions:at.completedIds.length,
   counts:Object.freeze({givens:base.length,guides:guides.length,
    results:results.length,visibilityUndetermined:results.length}),
   modelGeometryVerified:true,visibilityVerified:false,
   completeEngineeringDrawingVerified:false});
 }
 return Object.freeze({status:'ready',revision,
  stepCount:steps.length,totalMs:timing.totalMs,
  sectionEdgeCount:plan.sectionEdgeCount,areaMm2:plan.areaMm2,
  perimeterMm:plan.perimeterMm,
  steps:Object.freeze(timing.steps.map(s=>Object.freeze({
   id:s.id,title:s.title,startMs:s.startMs,endMs:s.endMs
  }))),
  createPlayer({speed=1}={}){return Timeline.createPlayer(timing,{speed,revision});},
  modelGeometryVerified:true,visibilityVerified:false,
  firstAngleConventionSignedOff:false,
  productionUiIntegrated:false,
  renderFrame
 });
}
module.exports={createPrismV5SvgScene};
