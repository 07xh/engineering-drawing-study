(function(){'use strict';
const contract=window.DrawingProblemSchema,renderer=window.DrawingActionRenderer;
const board=document.getElementById('drawingBoard'),reason=document.getElementById('reason'),counter=document.getElementById('counter'),status=document.getElementById('status');
const previous=document.getElementById('previous'),next=document.getElementById('next'),selector=document.getElementById('problemSelect'),source=document.getElementById('sourceDescription');
let frames=[],index=0,currentExample=null,currentProblem=null;
function render(){
 const frame=frames[index];
 board.innerHTML=renderer.svgMarkup(frame,{showAuxiliary:document.getElementById('showAuxiliary').checked,highlightStep:document.getElementById('highlightStep').checked});
 reason.textContent=frame.explanation;
 document.getElementById('why').textContent=currentExample?'为什么这样作图：'+currentExample.why[index]:'';
 document.getElementById('freedom').textContent=currentExample?'约束与自由度：'+currentExample.freedom[index]:'';
 const constraintReason=document.getElementById('constraintReason');
 const reasonData=currentProblem?.steps[index]?.localDofExplanation;
 constraintReason.textContent=reasonData?'计算依据：'+(reasonData.addedConstraint||'本步未增加新的定位约束')+'。'+reasonData.reason+' '+reasonData.scope:'';
 document.getElementById('stageCheck').textContent=currentExample?'本步检查：'+currentExample.stageChecks[index]:'';
 const math=document.getElementById('mathVerification');
 const dofBadge=document.getElementById('computedDof');
 dofBadge.hidden=true;
 const local=document.getElementById('localDofVerification');
 const localRequest=currentProblem?.steps[index]?.localDofAnalysis;
 const previousRequest=index>0?currentProblem?.steps[index-1]?.localDofAnalysis:null;
 if(!localRequest){local.textContent='本步尚未提供经过核验的多点构型与非线性约束，不能自动判断局部自由度。';}
 else try{
  const summary=window.DrawingPlayerDofSummary.summarize(localRequest,previousRequest);
  if(!summary.available){local.textContent=summary.reason;}
  else {
   dofBadge.hidden=false;
   document.getElementById('computedDofValue').textContent=String(summary.currentDegrees);
   document.getElementById('computedDofLabel').textContent=summary.label+' · 给定构型的一阶计算';
   const trace=summary.trace,last=trace.steps[trace.steps.length-1];
   local.textContent='局部自由度：'+(summary.previousDegrees===null?summary.currentDegrees:summary.previousDegrees+' → '+summary.currentDegrees)+'；'+(last?'末项约束：'+(last.classification==='locally-independent'?'一阶独立':'一阶冗余')+'；':'尚无定位约束；')+'仅表示当前构型的一阶自由度，不证明全局唯一。';
  }
 }catch(error){local.textContent='局部自由度核验失败：'+error.message;}
 const request=currentProblem?.steps[index]?.constraintAnalysis;
 if(!request){math.textContent='本步尚无经过核验的结构化数学约束；上方为教材步骤解释，不是自动计算结果。';}
 else try{
  const answer=window.DrawingConstraintAnalysis.analyze(request);
  const names={unique:'唯一解',multiple:'多个候选解',none:'无解',continuous:'连续多解',coincident:'约束重合'};
  math.textContent='数学计算：'+(names[answer.status]||answer.status)+'；剩余自由度：'+(answer.degrees===null?'不适用':answer.degrees)+'；解数量：'+(answer.solutionCount===null?'不确定或无限':' '+answer.solutionCount)+'。';
 }catch(error){math.textContent='数学约束核验失败：'+error.message;}
 counter.textContent=(index+1)+' / '+frames.length;
 previous.disabled=index===0;next.disabled=index===frames.length-1;
}
function load(id){
 try{
  const example=window.TextbookExamples.get(id);
  if(!example)throw Error('找不到经过核验的教材例题');
  const problem=window.TextbookActionAdapter.adapt(example,window.TextbookExampleGeometry);
  const result=contract.validate(problem);if(!result.ok)throw Error(result.errors.join('；'));
  const prepared=renderer.frames(problem);if(!prepared.length)throw Error('没有可播放的作图步骤');
  frames=prepared;index=0;currentExample=example;currentProblem=problem;
  document.getElementById('problemTitle').textContent=example.number+' · '+example.title;
  source.textContent='教材印刷第'+example.printedPage+'页 · '+example.figure+'。'+example.fidelity;
  status.textContent='已载入 '+frames.length+' 个步骤；动画使用统一题目格式。';
  render();
 }catch(error){frames=[];currentExample=null;currentProblem=null;board.replaceChildren();
  document.getElementById('computedDof').hidden=true;
  document.getElementById('mathVerification').textContent='无法核验：播放器未成功载入。';
  document.getElementById('localDofVerification').textContent='无法核验：播放器未成功载入。';
  for(const id of ['why','freedom','constraintReason','stageCheck'])document.getElementById(id).textContent='';reason.textContent='';counter.textContent='';status.textContent='播放器无法加载：'+error.message;previous.disabled=true;next.disabled=true}
}
previous.addEventListener('click',()=>{if(index>0){index--;render()}});
next.addEventListener('click',()=>{if(index<frames.length-1){index++;render()}});
selector.addEventListener('change',()=>load(selector.value));
for(const id of ['showAuxiliary','highlightStep'])document.getElementById(id).addEventListener('change',()=>{if(frames.length)render()});
const initial=new URLSearchParams(location.search).get('example');
if(initial&&window.TextbookExamples.get(initial)&&Array.from(selector.options).some(option=>option.value===initial))selector.value=initial;
load(selector.value);
})();
