'use strict';
/**
 * P0 DA-07 | Student-created finite-line fillet offset-line verification.
 * This module RECOMPUTES the selected mathematical solution through DA-02;
 * no synthetic fixture or caller-provided 'expected line' can become proof.
 * Only two offset construction lines are graded here; the final curved arc,
 * points and the source contour are explicitly outside this grade.
 */
const {chooseFiniteTwoSegmentArc}=require('../engines/planar/directed-two-segment-fillet.cjs');
const {matchLine}=require('./verified-projection-drawing.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const pt=p=>!!p&&typeof p==='object'&&finite(p.x)&&finite(p.y);
function gradeFilletOffsetLines(args,studentLines,{origin,scale,revision,toleranceMm=0.75}={}){
 if(!pt(origin)||!finite(scale)||scale<=0||
    !finite(toleranceMm)||toleranceMm<=0||toleranceMm>10||
    !Number.isSafeInteger(revision)||revision<0)
   throw new TypeError('valid model-to-sheet scale, mm tolerance, origin and revision required');
 if(!Array.isArray(studentLines)||studentLines.length>200)
   throw new TypeError('studentLines must be a bounded array');
 const selected=chooseFiniteTwoSegmentArc(args);
 if(selected.status!=='selected'||selected.g1Verified!==true||
    selected.finiteArcSweepVerified!==true||!selected.geometry)
   return {status:'not-verified',matchedCount:0,targetCount:0,
    remainingIds:[],extraCount:studentLines.length,revision,
    reason:'未获得通过全部切点及有向 G1 的有效有限圆弧，不判定辅助作图'};
 const steps=selected.steps.filter(step=>step.kind==='offset-line'&&
   step.role==='auxiliary'&&step.geometry);
 if(steps.length!==2||new Set(steps.map(s=>s.id)).size!==2)
   throw new RangeError('mathematical offset construction is not complete');
 const sheet=p=>{const v={x:origin.x+p.x*scale,y:origin.y-p.y*scale};
  if(!pt(v))throw new RangeError('sheet projection overflow');return v};
 const expected=steps.map(step=>({
  id:step.id,from:sheet(step.geometry.a),to:sheet(step.geometry.b)
 }));
 for(const [i,line] of studentLines.entries()){
  if(!line||!pt(line.from)||!pt(line.to)||line.revision!==revision)
   throw new TypeError('stale or invalid student line '+i);
 }
 const compatibility=studentLines.map(line=>expected.map(exp=>
  matchLine(exp,line,{scale,toleranceMm})?.ok===true));
 // Maximal bipartite matching: an extra copy of offset #1 is NEVER offset #2.
 const matched=new Array(expected.length).fill(-1);
 function augment(index,seen){
  for(let j=0;j<expected.length;j++){
   if(seen.has(j)||!compatibility[index][j])continue;
   seen.add(j);
   if(matched[j]===-1||augment(matched[j],seen)){
    matched[j]=index;return true;
   }
  }
  return false;
 }
 for(let i=0;i<studentLines.length;i++)augment(i,new Set());
 const matchedCount=matched.filter(i=>i>=0).length;
 const extraCount=studentLines.length-matchedCount;
 return {status:matchedCount===2&&extraCount===0?'correct':
   matchedCount===0?'incorrect':'partial',
  matchedCount,targetCount:expected.length,
  remainingIds:expected.filter((_,i)=>matched[i]===-1).map(g=>g.id),
  extraCount,revision,gradeScope:'two-real-offset-lines-only',
  reason:matchedCount===2?'两条真实偏移辅助线已核验；最终圆弧仍需分别验证':
   '按毫米单位检查辅助线平行方向、共线和有效线段覆盖'};
}
module.exports={gradeFilletOffsetLines};
