(function(){'use strict';
const contract=window.DrawingProblemSchema,renderer=window.DrawingActionRenderer;
const board=document.getElementById('drawingBoard'),reason=document.getElementById('reason'),counter=document.getElementById('counter'),status=document.getElementById('status');
const previous=document.getElementById('previous'),next=document.getElementById('next'),selector=document.getElementById('problemSelect'),source=document.getElementById('sourceDescription');
let frames=[],index=0,currentExample=null;
function render(){
 const frame=frames[index];
 board.innerHTML=renderer.svgMarkup(frame,{showAuxiliary:document.getElementById('showAuxiliary').checked,highlightStep:document.getElementById('highlightStep').checked});
 reason.textContent=frame.explanation;
 document.getElementById('why').textContent=currentExample?'为什么这样作图：'+currentExample.why[index]:'';
 document.getElementById('freedom').textContent=currentExample?'约束与自由度：'+currentExample.freedom[index]:'';
 document.getElementById('stageCheck').textContent=currentExample?'本步检查：'+currentExample.stageChecks[index]:'';
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
  frames=prepared;index=0;currentExample=example;
  document.getElementById('problemTitle').textContent=example?example.number+' · '+example.title:problem.title;
  source.textContent=example?'教材印刷第'+example.printedPage+'页 · '+example.figure+'。'+example.fidelity:'原创播放器测试数据，不是教材题。';
  status.textContent='已载入 '+frames.length+' 个步骤；动画使用统一题目格式。';
  render();
 }catch(error){frames=[];currentExample=null;board.replaceChildren();
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
