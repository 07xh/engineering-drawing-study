'use strict';
/**
 * V3.1 verified, offline SVG export for the three supported finite-fillet kinds.
 * Deliberately computes the trusted solution here; NEVER accepts caller-provided
 * steps, proofs, SVG fragments, OCR guesses or a 'verified' flag.
 */
const {confirmedFilletTimeline} = require('../workbench/v31-confirmed-fillet-v5.cjs');
const {normalizeProblem} = require('../engines/constraints-2d/finite-fillet-gate.cjs');
const Motion = require('../workbench/teaching-motion-v5.js');

const DEFAULT_SHEET = Object.freeze({origin:{x:360,y:220},scale:8});
const finite = n => typeof n === 'number' && Number.isFinite(n);
const scalar = n => {
  if (!finite(n) || Math.abs(n)>1e12) throw new RangeError('non-finite or excessive SVG coordinate');
  return String(Number(n.toFixed(7)));
};
const escapeXml = s => String(s).replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'
})[c]);
const validPoint = p => p && finite(p.x) && finite(p.y);
function boundsOfShape(shape){
  if (shape.kind==='line') {
    const {from,to}=shape.geometry;
    if (!validPoint(from)||!validPoint(to)) throw new TypeError('invalid line geometry');
    return {left:Math.min(from.x,to.x),right:Math.max(from.x,to.x),
      top:Math.min(from.y,to.y),bottom:Math.max(from.y,to.y)};
  }
  const {center,radius}=shape.geometry;
  if (!validPoint(center)||!finite(radius)||radius<=0) throw new TypeError('invalid radial geometry');
  return {left:center.x-radius,right:center.x+radius,
    top:center.y-radius,bottom:center.y+radius};
}
function projectPoint(p,sheet){
  if(!validPoint(p))throw new TypeError('non-finite model point');
  return {x:sheet.origin.x+sheet.scale*p.x,y:sheet.origin.y-sheet.scale*p.y};
}
function givens(problem,sheet){
  const raw=problem.geometry;
  const types=problem.kind==='two-segments'?['first','second']:
    problem.kind==='segment-circle'?['segment','circle']:['first','second'];
  return types.map((key,index)=>{
    const g=raw[key];
    if(g.a&&g.b)return {id:'given-'+index,kind:'line',
      geometry:{from:projectPoint(g.a,sheet),to:projectPoint(g.b,sheet)}};
    return {id:'given-'+index,kind:'circle',geometry:{
      center:projectPoint(g.center,sheet),radius:g.radius*sheet.scale}};
  });
}
function renderShape(shape,layer,stepIndex){
  const a=Motion.actionShapeAttrs(shape,1);
  const attrs = layer==='result'?'stroke="#17639b" stroke-width="2.8"':
    layer==='given'?'stroke="#333" stroke-width="2.2"':
      'stroke="#9c803c" stroke-width="1.4" stroke-dasharray="5 4"';
  const data=' data-action="'+escapeXml(shape.id)+'" data-layer="'+layer+'"'+
    (stepIndex===null?'':' data-step="'+stepIndex+'"');
  let svg;
  if(shape.kind==='line') svg='<line x1="'+scalar(a.x1)+'" y1="'+scalar(a.y1)+
    '" x2="'+scalar(a.x2)+'" y2="'+scalar(a.y2)+'"';
  else if(shape.kind==='circle'||shape.kind==='point') svg='<circle cx="'+scalar(a.cx)+
    '" cy="'+scalar(a.cy)+'" r="'+scalar(a.r)+'"';
  else if(shape.kind==='arc') {
    // Produced by the math-backed V5 renderer, never user-supplied SVG.
    if(typeof a.d!=='string'||!/^[MA0-9eE+.,\-\s]+$/.test(a.d))
      throw new TypeError('unsupported generated SVG path');
    svg='<path d="'+a.d+'"';
  } else throw new TypeError('unsupported verified action');
  return svg+data+' '+attrs+(shape.kind==='point'?' fill="#9c803c"':' fill="none"')+
    ' stroke-linecap="round" stroke-linejoin="round"/>';
}
function exportVerifiedFilletSvg(input, options={}){
  if(!options||typeof options!=='object'||Array.isArray(options)||
     Object.keys(options).some(k=>!['expectedRevision','includeGuides','completedSteps'].includes(k)))
    throw new TypeError('unsupported SVG export option');
  const {expectedRevision,includeGuides=true,completedSteps}=options;
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||typeof includeGuides!=='boolean')
    throw new TypeError('expected current revision and boolean includeGuides required');
  // No untrusted claim of mathematical validation can enter this API.
  const plan=confirmedFilletTimeline(input);
  if(plan.status!=='ready'||plan.mathematicallyVerified!==true||
     plan.typedMathEvidence?.g1Verified!==true||
     plan.typedMathEvidence?.finishedArcVerified!==true||
     plan.revision!==expectedRevision||
     plan.typedMathEvidence.revision!==expectedRevision)
    throw new RangeError('SVG export requires current-revision verified G1 construction');
  const totalSteps=plan.steps.length;
  const visibleSteps=completedSteps===undefined?totalSteps:completedSteps;
  if(!Number.isSafeInteger(visibleSteps)||visibleSteps<0||visibleSteps>totalSteps)
    throw new RangeError('completedSteps must be within the verified V5 timeline');
  const isFinalSheet=visibleSteps===totalSteps;
  const problem=normalizeProblem(input.problem);
  const sheet=input.sheet===undefined?DEFAULT_SHEET:input.sheet;
  if(!sheet||!validPoint(sheet.origin)||!finite(sheet.scale)||sheet.scale<=0)
    throw new TypeError('invalid verified sheet transform');
  const source=givens(problem,sheet);
  const actions=[],allActions=[];
  const usedIds=new Set(source.map(a=>a.id));
  for(const [i,step] of plan.steps.entries()){
    if(!Array.isArray(step.actions))throw new TypeError('invalid V5 step');
    for(const action of step.actions){
      if(typeof action.id!=='string'||usedIds.has(action.id))
        throw new TypeError('duplicate or missing verified action ID');
      usedIds.add(action.id);
      const indexed={shape:action,index:i,
        layer:step.role==='result'?'result':'guide'};
      allActions.push(indexed);
      if(i<visibleSteps&&(includeGuides||step.role==='result'))
        actions.push(indexed);
    }
  }
  if(!allActions.some(a=>a.layer==='result'&&a.shape.kind==='arc'))
    throw new RangeError('verified result arc missing');
  // Use the full verified construction as common framing: all process sheets
  // retain the exact same viewBox and do not jump when a new guide appears.
  const bounds=[...source,...allActions.map(a=>a.shape)].map(boundsOfShape);
  const finalArcVisible=actions.some(a=>a.layer==='result'&&a.shape.kind==='arc');
  const left=Math.min(...bounds.map(b=>b.left));
  const right=Math.max(...bounds.map(b=>b.right));
  const top=Math.min(...bounds.map(b=>b.top));
  const bottom=Math.max(...bounds.map(b=>b.bottom));
  const margin=Math.max(12,Math.min(36,Math.max(right-left,bottom-top)*.04));
  const x=left-margin,y=top-margin;
  const width=Math.max(right-left+2*margin,40);
  const height=Math.max(bottom-top+2*margin,40);
  [x,y,width,height].forEach(scalar);
  const title=isFinalSheet?'DraftAI 已验证的圆弧连接工程图':
    'DraftAI 已验证作图过程 · 第'+visibleSteps+'/'+totalSteps+'步';
  const description=isFinalSheet?
    '仅验证所选圆弧连接分支与有向 G1，不证明全局唯一解。':
    '所选解已经数学验证；本图只展示前'+visibleSteps+'步，未代表最终作图完成或全局唯一解。';
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="720" height="440" viewBox="'+
    [x,y,width,height].map(scalar).join(' ')+'" role="img">\n'+
    '<title>'+title+'</title>\n'+
    '<desc>'+description+'</desc>\n'+
    '<g id="given">'+source.map(s=>renderShape(s,'given',null)).join('')+'</g>\n'+
    '<g id="construction">'+actions.map(a=>renderShape(a.shape,a.layer,a.index)).join('')+'</g>\n'+
    '</svg>\n';
  return {svg,revision:plan.revision,selectedBranchId:plan.selectedBranchId,
    includedGuides:includeGuides,actionCount:actions.length,completedSteps:visibleSteps,
    originalStepCount:totalSteps,isFinalSheet,finalArcVisible,
    proofScope:plan.proofScope,globallyUnique:plan.typedMathEvidence.globallyUnique};
}
module.exports={exportVerifiedFilletSvg};
