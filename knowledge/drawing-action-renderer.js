/* Pure, source-verified step action renderer. No inference or automatic textbook solving. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingActionRenderer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const allowed=['point','line','circle','text'];
const styles={given:{stroke:'#277453',width:2.6},auxiliary:{stroke:'#b67828',width:1.7,dash:'7 5'},axis:{stroke:'#77887c',width:1.4,dash:'3 5'},result:{stroke:'#216faf',width:3.2},mark:{stroke:'#99672c',width:2}};
function finite(n){return typeof n==='number'&&Number.isFinite(n)}
function validAction(a){
 if(!a||!allowed.includes(a.kind)||!a.geometry)return false;
 const g=a.geometry;
 if(a.style!==undefined&&!Object.prototype.hasOwnProperty.call(styles,a.style))return false;
 if(a.kind==='point')return finite(g.x)&&finite(g.y)&&(a.label===undefined||(typeof a.label==='string'&&a.label.length<=80));
 if(a.kind==='line')return [g.x1,g.y1,g.x2,g.y2].every(finite);
 if(a.kind==='circle')return [g.cx,g.cy,g.r].every(finite)&&g.r>0;
 return finite(g.x)&&finite(g.y)&&typeof a.text==='string'&&a.text.length<=120;
}
function frames(problem){
 if(!problem||!Array.isArray(problem.steps)||!Array.isArray(problem.givens))throw Error('无效题目');
 if(!['steps-verified','solution-verified'].includes(problem.status))throw Error('未经步骤核验，不得播放教材作图动画');
 const visible=[],result=[];
 for(const step of problem.steps){
  if(!Array.isArray(step.actions))throw Error('缺少作图动作');
  for(const action of step.actions){
   if(!validAction(action))throw Error('不支持或无效的作图动作');
   visible.push({...action,stepId:step.id});
  }
  result.push({stepId:step.id,explanation:step.explanation,shapes:visible.map(a=>({...a}))});
 }
 return result;
}
function svgMarkup(frame,options){
 const opts=options||{};
 const showAux=opts.showAuxiliary!==false;
 const highlight=opts.highlightStep!==false;
 if(!frame||!Array.isArray(frame.shapes))throw Error('无效动画帧');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return frame.shapes.filter(a=>showAux||a.style!=='auxiliary').map(a=>{
  if(!validAction(a))throw Error('无效绘图动作');
  const g=a.geometry,sty=styles[a.style||'given'];
  const active=highlight&&a.stepId===frame.stepId;
  const strokeWidth=active?sty.width+1.4:sty.width;
  const common=' fill="none" stroke="'+sty.stroke+'" stroke-width="'+strokeWidth+'"'+(sty.dash?' stroke-dasharray="'+sty.dash+'"':'');
  if(a.kind==='point')return '<circle cx="'+g.x+'" cy="'+g.y+'" r="'+(active?5.5:4)+'" fill="'+sty.stroke+'"/>'+(a.label?'<text x="'+(g.x+8)+'" y="'+(g.y-9)+'" fill="'+sty.stroke+'" font-size="17">'+esc(a.label)+'</text>':'');
  if(a.kind==='line')return '<line x1="'+g.x1+'" y1="'+g.y1+'" x2="'+g.x2+'" y2="'+g.y2+'"'+common+'/>';
  if(a.kind==='circle')return '<circle cx="'+g.cx+'" cy="'+g.cy+'" r="'+g.r+'"'+common+'/>';
  return '<text x="'+g.x+'" y="'+g.y+'" fill="'+sty.stroke+'">'+esc(a.text)+'</text>';
 }).join('');
}
return {allowed,styles,validAction,frames,svgMarkup};
});
