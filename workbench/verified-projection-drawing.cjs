'use strict';
/**
 * DA-07 student drawing validator for actual DA-03 projected guide steps.
 * Compares MODEL-unit incidence, direction and target interval coverage,
 * not screen-pixel equality. Student strokes and guide steps are screen-
 * positioned, but every geometric residual is divided by the display scale.
 *
 * A single drawn line can certify at most one mathematical construction step.
 * Inputs must originate from a unique, proof-backed solveProjection result;
 * this pure validator cannot turn a synthetic fixture into a verified answer.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>p&&typeof p==='object'&&finite(p.x)&&finite(p.y);
const line=shape=>shape&&point(shape.from)&&point(shape.to);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function matchLine(guide,stroke,{scale,toleranceMm}){
 if(!line(guide)||!line(stroke))throw new TypeError('line endpoints must be finite');
 const lenPx=dist(guide.from,guide.to);
 const drawnPx=dist(stroke.from,stroke.to);
 if(!Number.isFinite(lenPx)||!Number.isFinite(drawnPx))
  throw new RangeError('line length overflow');
 if(lenPx/scale<=1e-10||drawnPx/scale<=1e-10)return null;
 const ux=(guide.to.x-guide.from.x)/lenPx;
 const uy=(guide.to.y-guide.from.y)/lenPx;
 const relative=p=>({dx:p.x-guide.from.x,dy:p.y-guide.from.y});
 const start=relative(stroke.from),end=relative(stroke.to);
 const projected=[start.dx*ux+start.dy*uy,end.dx*ux+end.dy*uy];
 const perpendicular=[Math.abs(start.dx*uy-start.dy*ux),
   Math.abs(end.dx*uy-end.dy*ux)];
 const gapMm=Math.max(0,Math.min(...projected)/scale,
   (lenPx-Math.max(...projected))/scale);
 const normalMm=Math.max(...perpendicular)/scale;
 if(!finite(gapMm)||!finite(normalMm))throw new RangeError('drawing residual overflow');
 return {ok:normalMm<=toleranceMm&&gapMm<=toleranceMm,
  normalMm,gapMm};
}
function gradeProjectionDrawing(steps,strokes,options={}){
 const {scale,toleranceMm=0.75,revision}=options;
 if(!finite(scale)||scale<=0||!finite(toleranceMm)||toleranceMm<=0||
  !Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('positive mm scale/tolerance and valid revision required');
 if(!Array.isArray(steps)||!Array.isArray(strokes))
  throw new TypeError('steps and strokes must be arrays');
 if(steps.length>100||strokes.length>500)throw new RangeError('drawing size limit');
 const guides=steps.map((s,i)=>{
  if(!s||typeof s.id!=='string'||!s.id||!line(s))
   throw new TypeError('expected guide step '+i+' must have finite endpoints');
  if(s.source!=='computed-first-angle-guides'||s.unit!=='px')
   throw new TypeError('cannot certify non-mathematical guide steps');
  if(dist(s.from,s.to)/scale<=1e-10)
   throw new RangeError('degenerate mathematical guide cannot be graded');
  return s;
 });
 if(new Set(guides.map(s=>s.id)).size!==guides.length)
  throw new TypeError('duplicate mathematical step ID');
 for(const [i,s] of strokes.entries()){
  if(!line(s)||s.revision!==revision)throw new TypeError('stale or invalid student stroke '+i);
 }
 const compat=strokes.map(s=>guides.map(g=>matchLine(g,s,{scale,toleranceMm})));
 const matchedToStroke=new Array(guides.length).fill(-1);
 // Augmenting-path bipartite matching: one stroke must never be counted twice,
 // and student line order cannot change the total verified step count.
 const assign=(stroke,seen)=>{
  for(let j=0;j<guides.length;j++){
   if(!compat[stroke][j]?.ok||seen.has(j))continue;
   seen.add(j);
   if(matchedToStroke[j]<0||assign(matchedToStroke[j],seen)){
    matchedToStroke[j]=stroke;return true;
   }
  }
  return false;
 };
 for(let i=0;i<strokes.length;i++)assign(i,new Set());
 const acceptedIds=[],unmatchedIds=[];
 for(let i=0;i<guides.length;i++){
  (matchedToStroke[i]<0?unmatchedIds:acceptedIds).push(guides[i].id);
 }
 const paired=new Set(matchedToStroke.filter(i=>i>=0));
 const extraCount=strokes.length-paired.size;
 const matchedCount=acceptedIds.length;
 const complete=guides.length>0&&matchedCount===guides.length;
 return {status:complete&&extraCount===0?'correct':
   matchedCount===0?'incorrect':'partial',
  matchedCount,targetCount:guides.length,
  acceptedIds,remainingIds:unmatchedIds,extraCount,
  maxNormalResidualMm:matchedCount?
   Math.max(...matchedToStroke.flatMap((i,j)=>i<0?[]:[compat[i][j].normalMm])):null,
  toleranceMm,revision};
}
module.exports={matchLine,gradeProjectionDrawing};
