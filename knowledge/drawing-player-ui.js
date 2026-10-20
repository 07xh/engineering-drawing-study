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
 document.getElementById('stageCheck').textContent=currentExample?'本步检查：'+currentExample.stageChecks[index]:'';
 const math=document.getElementById('mathVerification');
 const local=document.getElementById('localDofVerification');
 const localRequest=currentProblem?.steps[index]?.localDofAnalysis;
 if(!localRequest){local.textContent='本步尚未提供经过核验的多点构型与非线性约束，不能自动判断局部自由度。';}
 else try{
  const trace=window.DrawingNonlinearStepTrace.analyze(localRequest);
  const last=trace.steps[trace.steps.length-1];
  local.textContent='局部自由度：'+trace.initialDegrees+' → '+trace.finalDegrees+'；'+(last?'最后一项约束：'+(last.classification==='locally-independent'?'一阶独立':'一阶冗余')+'，减少 '+last.removedLocalDegrees+' 个局部自由度；':'尚未加入约束；')+(trace.atProvidedConfiguration?'给定构型满足约束。':'给定构型不满足全部约束。')+' 注意：仅为当前构型的一阶分析，不代表全局唯一。';
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
  const example=id==='demo'?null:window.TextbookExamples.get(id);
  if(id!=='demo'&&!example)throw Error('找不到经过核验的教材例题');
  const problem=example?window.TextbookActionAdapter.adapt(example,window.TextbookExampleGeometry):window.DrawingPlayerDemo;
  const result=contract.validate(problem);if(!result.ok)throw Error(result.errors.join('；'));
  const prepared=renderer.frames(problem);if(!prepared.length)throw Error('没有可播放的作图步骤');
  frames=prepared;index=0;currentExample=example;currentProblem=problem;
  document.getElementById('problemTitle').textContent=example?example.number+' · '+example.title:problem.title;
  source.textContent=example?'教材印刷第'+example.printedPage+'页 · '+example.figure+'。'+example.fidelity:'原创播放器测试数据，不是教材题。';
  status.textContent='已载入 '+frames.length+' 个步骤；动画使用统一题目格式。';
  render();
 }catch(error){frames=[];currentExample=null;currentProblem=null;board.replaceChildren();
  document.getElementById('mathVerification').textContent='无法核验：播放器未成功载入。';
  document.getElementById('localDofVerification').textContent='无法核验：播放器未成功载入。';
  for(const id of ['why','freedom','stageCheck'])document.getElementById(id).textContent='';reason.textContent='';counter.textContent='';status.textContent='播放器无法加载：'+error.message;previous.disabled=true;next.disabled=true}
}
previous.addEventListener('click',()=>{if(index>0){index--;render()}});
next.addEventListener('click',()=>{if(index<frames.length-1){index++;render()}});
selector.addEventListener('change',()=>load(selector.value));
for(const id of ['showAuxiliary','highlightStep'])document.getElementById(id).addEventListener('change',()=>{if(frames.length)render()});
const initial=new URLSearchParams(location.search).get('example');
if(initial&&['example-1-1','example-2-2'].includes(initial))selector.value=initial;
load(selector.value);
})();
