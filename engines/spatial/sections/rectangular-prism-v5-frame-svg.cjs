'use strict';
/**
 * 04 V4.0: verified prism-section V5 steps -> complete bounded SVG frame.
 *
 * The intersected polygon is an exact, mathematically verified 1D perimeter.
 * Every result stroke uses an explicitly UNCERTAIN line type: no unsupported
 * claim of national-standard visibility is allowed in the SVG.
 */
const {prismSectionV5Preview}=require('./rectangular-prism-v5-preview.cjs');
const {classifyPrismSectionVisibility}=require('./rectangular-prism-cut-visibility.cjs');
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
function element(action,fraction,layer,certifiedVisibility=null){
 if(!idCheck(action.id)||!['given','guide','result'].includes(layer))
  throw new TypeError('invalid verified prism action ID');
 const a=Motion.actionShapeAttrs(action,fraction);
 if(layer==='result'&&action.visibility!=='undetermined')
  throw new TypeError('unverified prism source must keep uncertain visibility');
 if(layer!=='result'&&certifiedVisibility!==null)
  throw new TypeError('cannot attach result visibility to input or guides');
 if(layer==='result'&&
  !['visible','hidden','undetermined',null].includes(certifiedVisibility))
  throw new TypeError('invalid model ray classification');
 const visibility=layer==='result'?certifiedVisibility||'undetermined':null;
 const style=layer==='given'?
  {stroke:'#344253',dash:'none',width:1.8}:
  layer==='guide'?
   {stroke:'#8195a4',dash:'4 4',width:1.2}:
   visibility==='visible'?{stroke:'#205544',dash:'none',width:2}:
   visibility==='hidden'?{stroke:'#485364',dash:'7 4',width:1.7}:
   {stroke:'#b26b19',dash:'2 5',width:2};
 const mark=' data-action="'+escape(action.id)+'" data-layer="'+layer+'"';
 const hint=layer==='result'?' data-visibility="'+visibility+'" data-source="'+
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
function createPrismV5SvgScene(box,plane,{
 revision=0,retainedHalfspace,observerDirections
}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('nonnegative model revision required');
 const plan=prismSectionV5Preview(box,plane);
 if(plan.status!=='ready'||!plan.mathematicalPerimeterVerified||
    !plan.v5PreviewReady)
  return Object.freeze({
   status:'blocked',reason:plan.reason||'unverified prism section',
   revision,renderFrame(){throw new RangeError('no verified prism V5 frame');}
  });
 // No model visibility is inferred from a V/H/W label. The default,
 // with no explicit kept halfspace AND three observer rays, remains uncertain.
 const visibilityRequested=retainedHalfspace!==undefined||
  observerDirections!==undefined;
 const evidenceByAction=new Map(),viewEvidence={};
 const counts={visible:0,hidden:0,undetermined:0};
 const views=['V','H','W'];
 if(visibilityRequested){
  if(!['positive','negative'].includes(retainedHalfspace)||
    !observerDirections||typeof observerDirections!=='object'||
    Array.isArray(observerDirections)||
    Object.keys(observerDirections).sort().join(',')!=='H,V,W')
   throw new TypeError('complete kept halfspace and three reviewed V/H/W observer rays required');
  for(const view of views){
   const evidence=classifyPrismSectionVisibility(box,plane,{
    retainedHalfspace,observerDirection:observerDirections[view]
   });
   if(evidence.status!=='ready'||evidence.sourcePerimeterVerified!==true||
     evidence.totalEdges!==plan.sectionEdgeCount)
    return Object.freeze({
     status:'blocked',revision,reason:evidence.reason||'invalid observer ray proof',
     renderFrame(){throw new RangeError('no verified prism visibility');}
    });
   viewEvidence[view]=Object.freeze({
    observerDirection:evidence.observerDirection,
    counts:Object.freeze({...evidence.counts}),
    edgeInteriorsVerified:evidence.edgeInteriorsVerified
   });
   for(const edge of evidence.edgeRuns){
    if(!/^section-edge-[1-6]$/.test(edge.sourceEdgeId))
     throw new TypeError('untrusted prism section edge ID');
    const key=edge.sourceEdgeId+'-'+view;
    if(evidenceByAction.has(key))
     throw new TypeError('duplicate prism face ray evidence');
    evidenceByAction.set(key,edge.visibility);
    counts[edge.visibility]++;
   }
  }
  if(evidenceByAction.size!==3*plan.sectionEdgeCount)
   throw new RangeError('incomplete model ray evidence');
 }else counts.undetermined=3*plan.sectionEdgeCount;
 const inputSignature=JSON.stringify({box,plane,retainedHalfspace,observerDirections});
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
  if(inputSignature!==JSON.stringify({box,plane,retainedHalfspace,observerDirections}))
   throw new RangeError('prism geometry modified; rebuild verified scene');
 }

 const inspected=new Map(),segments=new Map(timing.segments.map(x=>[x.id,x]));
 const register=(action,layer,stepIndex)=>{
  if(inspected.has(action.id))throw new TypeError('duplicate reviewed source action');
  inspected.set(action.id,{action,layer,stepIndex});
 };
 for(const action of givens)register(action,'given',null);
 for(const [index,step] of steps.entries())
  for(const action of step.actions)register(action,step.role,index);
 function boundsOf(action){
  const a=Motion.actionShapeAttrs(action,1);
  if(action.kind==='line')return {
   minX:Math.min(a.x1,a.x2),maxX:Math.max(a.x1,a.x2),
   minY:Math.min(a.y1,a.y2),maxY:Math.max(a.y1,a.y2)};
  if(action.kind==='point')return {
   minX:a.cx-a.r,maxX:a.cx+a.r,minY:a.cy-a.r,maxY:a.cy+a.r};
  throw new TypeError('unrecognized reviewed prism drawing action');
 }
 function focusBox(actions){
  if(!actions.length)throw new RangeError('cannot focus an empty step');
  const x=actions.map(boundsOf);
  const minX=Math.min(...x.map(b=>b.minX)),maxX=Math.max(...x.map(b=>b.maxX));
  const minY=Math.min(...x.map(b=>b.minY)),maxY=Math.max(...x.map(b=>b.maxY));
  const ratio=sheet.width/sheet.height,padding=40;
  const w=Math.min(sheet.width,Math.max(320,maxX-minX+padding*2,
   (maxY-minY+padding*2)*ratio)),h=w/ratio;
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  const vx=Math.min(sheet.width-w,Math.max(0,cx-w/2)),
   vy=Math.min(sheet.height-h,Math.max(0,cy-h/2));
  return Object.freeze({x:vx,y:vy,width:w,height:h,
   viewBox:[vx,vy,w,h].map(number).join(' ')});
 }
 function focusOnAction({actionId,expectedRevision}={}){
  check(expectedRevision);
  const item=inspected.get(actionId);
  if(!item)throw new RangeError('not a trusted prism drawing action');
  return focusBox([item.action]);
 }
 function focusOnStep({stepIndex,expectedRevision}={}){
  check(expectedRevision);
  if(!Number.isSafeInteger(stepIndex)||stepIndex<0||stepIndex>=steps.length)
   throw new RangeError('unknown prism V5 step');
  return focusBox(steps[stepIndex].actions);
 }
 function inspectAt({x,y,elapsedMs,expectedRevision,tolerancePx=12}={}){
  check(expectedRevision);
  if(![x,y,elapsedMs,tolerancePx].every(finite)||tolerancePx<=0||
    tolerancePx>32||x<0||x>sheet.width||y<0||y>sheet.height||
    elapsedMs<0||elapsedMs>timing.totalMs)
   throw new RangeError('invalid screen pick or timeline position');
  const fractions=Timeline.frame(timing,elapsedMs).actionFractions;
  let chosen=null,bestDistance=Infinity,bestPriority=-1;
  for(const [id,item] of inspected){
   const progress=item.layer==='given'?1:fractions[id];
   if(!finite(progress)||progress<=0)continue;
   const a=Motion.actionShapeAttrs(item.action,progress);
   let distance;
   if(item.action.kind==='line'){
    const dx=a.x2-a.x1,dy=a.y2-a.y1,len=dx*dx+dy*dy;
    const t=len>1e-14?Math.min(1,Math.max(0,
     ((x-a.x1)*dx+(y-a.y1)*dy)/len)):0;
    distance=Math.hypot(x-a.x1-t*dx,y-a.y1-t*dy);
   }else if(item.action.kind==='point'){
    distance=Math.max(0,Math.hypot(x-a.cx,y-a.cy)-a.r);
   }else continue;
   const priority=item.layer==='result'?2:item.layer==='guide'?1:0;
   if(distance<=tolerancePx&&
      (distance<bestDistance-1e-6||
       (Math.abs(distance-bestDistance)<=1e-6&&priority>bestPriority))){
    chosen={id,...item};bestDistance=distance;bestPriority=priority;
   }
  }
  if(!chosen)return null;
  const segment=segments.get(chosen.id);
  const match=/^prism-section-([1-6])-(V|H|W)$/.exec(chosen.id);
  const visibility=chosen.layer==='result'?
   (visibilityRequested?evidenceByAction.get(chosen.action.sourceSectionEdgeId+'-'+match[2]):
    'undetermined'):null;
  return Object.freeze({
   actionId:chosen.id,layer:chosen.layer,
   stepIndex:chosen.stepIndex,
   stepId:chosen.stepIndex===null?null:steps[chosen.stepIndex].id,
   sourceSectionEdgeId:chosen.action.sourceSectionEdgeId||null,
   visibility,view:match?match[2]:null,
   distancePx:bestDistance,
   seekMs:segment?segment.startMs+Math.min(segment.durationMs*0.75,450):0
  });
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
   else if(step.role==='result'){
    const match=/^prism-section-([1-6])-(V|H|W)$/.exec(action.id);
    if(!match||action.sourceSectionEdgeId!=='section-edge-'+match[1])
     throw new TypeError('result action and mathematical edge source mismatch');
    const status=visibilityRequested?
     evidenceByAction.get(action.sourceSectionEdgeId+'-'+match[2]):null;
    if(visibilityRequested&&!status)
     throw new TypeError('missing verified model edge-ray evidence');
    results.push(element(action,fraction,'result',status));
   }
   else throw new TypeError('invalid verified section step');
  }
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="960" height="680" viewBox="0 0 960 680" role="img">'+
   '<title>DraftAI 棱柱截交线真实数学动态作图</title>'+
   '<desc>长方棱柱真实解析求交；'+
   (visibilityRequested?'可见与遮挡来自明确保留半空间和各视图观察射线的截线开区间判断。':
     '观察方向和保留材料未确认，全部截线仍为待审核线型。')+
   '截线端点、标准第一角法和其它实体遮挡均未审定。</desc>'+
   '<rect x="0" y="0" width="960" height="680" fill="white"/>'+
   '<g id="prism-source">'+base.join('')+'</g>'+
   '<g id="prism-guides">'+guides.join('')+'</g>'+
   '<g id="prism-cut-unknown-visibility">'+results.join('')+'</g></svg>';
  return Object.freeze({svg,revision,elapsedMs:at.elapsedMs,totalMs:timing.totalMs,
   done:at.done,activeStepId:at.activeStepId,
   activeStepIndex:at.activeStepIndex,activeActionId:at.activeActionId,
   completeActions:at.completedIds.length,
   counts:Object.freeze({givens:base.length,guides:guides.length,
    results:results.length,
    visibilityUndetermined:results.filter(x=>x.includes('data-visibility="undetermined"')).length,
    visibilityVisible:results.filter(x=>x.includes('data-visibility="visible"')).length,
    visibilityHidden:results.filter(x=>x.includes('data-visibility="hidden"')).length}),
   modelGeometryVerified:true,
   openEdgeRayVisibilityVerified:visibilityRequested&&counts.undetermined===0,
   visibilityVerified:visibilityRequested&&counts.undetermined===0,
   firstAngleConventionSignedOff:false,
   boundaryEndpointsVerified:false,
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
  inspectAt,focusOnAction,focusOnStep,
  modelGeometryVerified:true,
  visibilityEvidenceMode:visibilityRequested?'explicit-observer-rays':'unconfirmed',
  visibilityCounts:Object.freeze(counts),
  observerEvidence:Object.freeze(viewEvidence),
  openEdgeRayVisibilityVerified:visibilityRequested&&counts.undetermined===0,
  visibilityVerified:visibilityRequested&&counts.undetermined===0,
  boundaryEndpointsVerified:false,
  firstAngleConventionSignedOff:false,
  productionUiIntegrated:false,
  renderFrame
 });
}
module.exports={createPrismV5SvgScene};
