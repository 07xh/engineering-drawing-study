'use strict';
/**
 * 04 V4.5: actual V5 full-sheet SVG frames for a VERIFIED finite rectangular
 * pyramid / plane perimeter. This module never certifies hidden-line status,
 * first-angle standards, intersection endpoints or entire section interiors.
 */
const {pyramidSectionV5Preview}=require('./rectangular-pyramid-v5-preview.cjs');
const Timeline=require('../../../workbench/teaching-timeline-v5.js');
const Motion=require('../../../workbench/teaching-motion-v5.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const validId=s=>typeof s==='string'&&/^[a-zA-Z][\w-]{0,79}$/.test(s);
const {formatFrameNumber}=require('./shared-v5-frame-svg-safety.cjs');
const number=n=>formatFrameNumber(n,'unsafe pyramid SVG value');
function svgAction(action,progress,role){
 if(!['given','guide','result'].includes(role)||!validId(action.id))
  throw new TypeError('unreviewed SVG action id or role');
 if(role==='result'&&(
   action.visibility!=='undetermined'||
   !/^section-edge-[1-5]$/.test(action.sourceSectionEdgeId)||
   !/^(base|side-[0-3])$/.test(action.sourcePyramidFaceId)))
  throw new TypeError('result requires true unreviewed face-source evidence');
 const a=Motion.actionShapeAttrs(action,progress);
 const style=role==='given'?{ink:'#354456',dash:'none',width:1.7}:
  role==='guide'?{ink:'#8396a5',dash:'4 4',width:1.2}:
  {ink:'#b26b19',dash:'2 5',width:2};
 const meta=' data-action="'+action.id+'" data-layer="'+role+'"'+
  (role==='result'?' data-visibility="undetermined" data-source="'+
   action.sourceSectionEdgeId+'" data-source-face="'+action.sourcePyramidFaceId+'"':'');
 if(action.kind==='line')return '<line x1="'+number(a.x1)+'" y1="'+number(a.y1)+
  '" x2="'+number(a.x2)+'" y2="'+number(a.y2)+'"'+
  ' fill="none" stroke="'+style.ink+'" stroke-width="'+number(style.width)+
  '" stroke-dasharray="'+style.dash+'"'+meta+'/>';
 if(action.kind==='point')return '<circle cx="'+number(a.cx)+
  '" cy="'+number(a.cy)+'" r="'+number(a.r)+
  '" opacity="'+number(a.opacity)+'" fill="'+style.ink+'"'+meta+'/>';
 throw new TypeError('unsupported proven pyramid V5 geometry action');
}
function createPyramidV5SvgScene(pyramid,plane,{revision=0}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('nonnegative input revision required');
 const plan=pyramidSectionV5Preview(pyramid,plane);
 if(plan.status!=='ready'||plan.mathematicalPerimeterVerified!==true||
  plan.v5PreviewReady!==true)return Object.freeze({
   status:'blocked',revision,reason:plan.reason||'no mathematically proven pyramid cut',
   renderFrame(){throw new RangeError('no verified pyramid V5 frame');}
  });
 const signature=JSON.stringify({pyramid,plane});
 if(signature.length>10000)throw new RangeError('oversize pyramid geometry input');
 const {timing,steps,givens,sheet}=plan;
 if(sheet.width!==960||sheet.height!==680)
  throw new RangeError('unexpected pyramid paper dimensions');
 const ids=new Set();
 for(const a of [...givens,...steps.flatMap(s=>s.actions)]){
  if(!validId(a.id)||ids.has(a.id))
   throw new TypeError('duplicate or invalid math-backed pyramid action ID');
  ids.add(a.id);
  Motion.actionShapeAttrs(a,1);
 }
 const resultActions=steps.filter(s=>s.role==='result').flatMap(s=>s.actions);
 if(resultActions.length!==plan.sectionEdgeCount*3)
  throw new RangeError('incomplete polygon 3-view frame action set');
 for(const a of resultActions){
  const match=/^pyramid-section-([1-5])-(V|H|W)$/.exec(a.id);
  if(!match||a.sourceSectionEdgeId!=='section-edge-'+match[1]||
   a.sourcePyramidFaceId!==plan.proof.sourceSectionFaces[Number(match[1])-1])
   throw new TypeError('result action does not match source-face-verified polygon');
 }
 function check(expectedRevision){
  if(expectedRevision!==revision)
   throw new RangeError('stale pyramid drawing revision');
  if(signature!==JSON.stringify({pyramid,plane}))
   throw new RangeError('pyramid inputs changed; rebuild verified scene');
 }
 function renderFrame({elapsedMs,expectedRevision}={}){
  check(expectedRevision);
  if(!finite(elapsedMs)||elapsedMs<0||elapsedMs>timing.totalMs)
   throw new RangeError('invalid pyramid V5 elapsed time');
  const f=Timeline.frame(timing,elapsedMs);
  const base=givens.map(a=>svgAction(a,1,'given')),[guides,results]=[[],[]];
  for(const s of steps){
   if(!['guide','result'].includes(s.role))
    throw new TypeError('unknown pyramid drawing step role');
   for(const a of s.actions){
    const fraction=f.actionFractions[a.id];
    if(!finite(fraction)||fraction<=0)continue;
    (s.role==='guide'?guides:results).push(svgAction(a,fraction,s.role));
   }
  }
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="960" height="680"'+
   ' viewBox="0 0 960 680" role="img">'+
   '<title>DraftAI 四棱锥真实截交线三视图逐步作图</title>'+
   '<desc>图元由有限棱锥与截平面解析求交及V5动作组成。橙色截交线的可见与隐藏尚未审核，不能当作正式第一角法工程图。</desc>'+
   '<rect x="0" y="0" width="960" height="680" fill="white"/>'+
   '<g id="pyramid-givens">'+base.join('')+'</g>'+
   '<g id="pyramid-guides">'+guides.join('')+'</g>'+
   '<g id="pyramid-section-unknown">'+results.join('')+'</g></svg>';
  return Object.freeze({
   svg,revision,elapsedMs:f.elapsedMs,totalMs:timing.totalMs,
   done:f.done,activeStepIndex:f.activeStepIndex,activeStepId:f.activeStepId,
   activeActionId:f.activeActionId,completedActions:f.completedIds.length,
   counts:Object.freeze({givens:base.length,guides:guides.length,
    results:results.length,undetermined:results.length}),
   mathematicalPerimeterVerified:true,visibilityVerified:false,
   firstAngleConventionSignedOff:false,
   completeEngineeringDrawingVerified:false
  });
 }
 return Object.freeze({
  status:'ready',revision,stepCount:steps.length,totalMs:timing.totalMs,
  sectionEdgeCount:plan.sectionEdgeCount,areaMm2:plan.areaMm2,
  perimeterMm:plan.perimeterMm,sourceSectionFaces:Object.freeze(
   [...plan.proof.sourceSectionFaces]),
  steps:Object.freeze(timing.steps.map(s=>Object.freeze({
   id:s.id,title:s.title,startMs:s.startMs,endMs:s.endMs
  }))),
  createPlayer({speed=1}={}){
   check(revision);
   return Timeline.createPlayer(timing,{revision,speed});
  },
  mathematicalPerimeterVerified:true,visibilityVerified:false,
  firstAngleConventionSignedOff:false,productionUiIntegrated:false,
  completeEngineeringDrawingVerified:false,
  renderFrame
 });
}
module.exports={createPyramidV5SvgScene};
