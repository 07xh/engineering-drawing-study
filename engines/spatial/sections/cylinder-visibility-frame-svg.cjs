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
const {formatFrameNumber,escapeFrameAttribute}=
 require('./shared-v5-frame-svg-safety.cjs');
const number=n=>formatFrameNumber(n,'invalid SVG coordinate');
const escape=escapeFrameAttribute;
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

 const actionIndex=new Map(),segments=new Map(timing.segments.map(s=>[s.id,s]));
 function register(action,stepIndex,layer){
  if(actionIndex.has(action.id))throw new TypeError('duplicate SVG inspection action');
  actionIndex.set(action.id,{action,stepIndex,layer});
 }
 for(const action of givens)register(action,null,'given');
 for(const [i,step] of steps.entries())
  for(const action of step.actions)register(action,i,step.role);
 function assertRevision(expectedRevision){
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision!==revision)
   throw new RangeError('stale or missing geometry revision');
  if(JSON.stringify({cylinder,plane,retainedHalfspace,
    observerDirections,samplesPerTurn})!==inputSignature)
   throw new RangeError('geometry or observer inputs changed; rebuild verified scene');
 }
 function shapeBounds(action){
  const a=Motion.actionShapeAttrs(action,1);
  if(action.kind==='line')return {
   minX:Math.min(a.x1,a.x2),maxX:Math.max(a.x1,a.x2),
   minY:Math.min(a.y1,a.y2),maxY:Math.max(a.y1,a.y2)};
  if(action.kind==='point'||action.kind==='circle')
   return {minX:a.cx-a.r,maxX:a.cx+a.r,
    minY:a.cy-a.r,maxY:a.cy+a.r};
  throw new TypeError('unsupported inspected action geometry');
 }
 function viewFromBounds(bounds){
  const padding=38,ratio=sheet.width/sheet.height;
  const spanX=Math.max(1,bounds.maxX-bounds.minX)+2*padding;
  const spanY=Math.max(1,bounds.maxY-bounds.minY)+2*padding;
  const width=Math.min(sheet.width,Math.max(340,spanX,spanY*ratio));
  const height=width/ratio;
  const cx=(bounds.minX+bounds.maxX)/2,cy=(bounds.minY+bounds.maxY)/2;
  const x=Math.min(sheet.width-width,Math.max(0,cx-width/2));
  const y=Math.min(sheet.height-height,Math.max(0,cy-height/2));
  return Object.freeze({x,y,width,height,
   viewBox:[x,y,width,height].map(number).join(' ')});
 }
 function unionBounds(actions){
  if(!actions.length)throw new RangeError('no geometry to focus on');
  const bounds={minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity};
  for(const action of actions){
   const b=shapeBounds(action);
   bounds.minX=Math.min(bounds.minX,b.minX);
   bounds.maxX=Math.max(bounds.maxX,b.maxX);
   bounds.minY=Math.min(bounds.minY,b.minY);
   bounds.maxY=Math.max(bounds.maxY,b.maxY);
  }
  return bounds;
 }
 function focusOnAction({actionId,expectedRevision}={}){
  assertRevision(expectedRevision);
  const entry=actionIndex.get(actionId);
  if(!entry)throw new RangeError('not a reviewed drawing action');
  return viewFromBounds(shapeBounds(entry.action));
 }
 function focusOnStep({stepIndex,expectedRevision}={}){
  assertRevision(expectedRevision);
  if(!Number.isSafeInteger(stepIndex)||stepIndex<0||stepIndex>=steps.length)
   throw new RangeError('invalid construction step for focus');
  const actions=steps[stepIndex].actions;
  return viewFromBounds(unionBounds(actions));
 }
 function inspectAt({x,y,elapsedMs,expectedRevision,tolerancePx=12}={}){
  assertRevision(expectedRevision);
  if(![x,y,elapsedMs,tolerancePx].every(finite)||tolerancePx<=0||
    tolerancePx>32||x<0||x>sheet.width||y<0||y>sheet.height||
    elapsedMs<0||elapsedMs>timing.totalMs)
   throw new RangeError('invalid SVG pointer/elapsed time');
  const fractions=Timeline.frame(timing,elapsedMs).actionFractions;
  let best=null,dist=Infinity,priority=-1;
  for(const [id,entry] of actionIndex){
   const fraction=entry.layer==='given'?1:fractions[id];
   if(!finite(fraction)||fraction<=0)continue;
   const a=Motion.actionShapeAttrs(entry.action,fraction);
   let d;
   if(entry.action.kind==='line'){
    const vx=a.x2-a.x1,vy=a.y2-a.y1;
    const len2=vx*vx+vy*vy;
    const t=len2>1e-14?Math.max(0,Math.min(1,
     ((x-a.x1)*vx+(y-a.y1)*vy)/len2)):0;
    d=Math.hypot(x-a.x1-t*vx,y-a.y1-t*vy);
   }else if(entry.action.kind==='point'){
    d=Math.hypot(x-a.cx,y-a.cy);
   }else if(entry.action.kind==='circle'){
    // Incomplete arcs need angular hit testing; only fully drawn circles
    // are pickable instead of presenting invisible segments as selectable.
    if(fraction<1)continue;
    d=Math.abs(Math.hypot(x-a.cx,y-a.cy)-a.r);
   }else continue;
   const rank=entry.layer==='result'?2:entry.layer==='guide'?1:0;
   if(d<=tolerancePx&&(d<dist-1e-6||
       (Math.abs(d-dist)<=1e-6&&rank>priority))){
    best={id,...entry};dist=d;priority=rank;
   }
  }
  if(!best)return null;
  const segment=segments.get(best.id);
  return Object.freeze({actionId:best.id,layer:best.layer,
   stepIndex:best.stepIndex,stepId:best.stepIndex===null?null:
    steps[best.stepIndex].id,visibility:best.action.visibility||null,
   sourceEdgeId:best.action.sourceEdgeId||null,
   distancePx:dist,
   seekMs:segment?segment.startMs+Math.min(segment.durationMs*0.7,450):0});
 }

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
  stepCount:steps.length,
  stepDescriptors:Object.freeze(timing.steps.map(s=>Object.freeze({
   id:s.id,title:s.title,startMs:s.startMs,endMs:s.endMs
  }))),
  createPlayer({speed=1}={}){return Timeline.createPlayer(timing,{speed,revision});},
  inspectAt,focusOnAction,focusOnStep,
  visibilityLineStylesFullyVerified:plan.visibilityLineStylesFullyVerified,
  productionUiIntegrated:false,
  firstAngleObserverConventionsSignedOff:false,
  renderFrame
 });
}
module.exports={createCylinderVisibilitySvgScene};
