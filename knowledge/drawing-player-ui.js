(function(){'use strict';
const problem=window.DrawingPlayerDemo,contract=window.DrawingProblemSchema,renderer=window.DrawingActionRenderer;
const board=document.getElementById('drawingBoard'),reason=document.getElementById('reason'),counter=document.getElementById('counter'),status=document.getElementById('status');
const previous=document.getElementById('previous'),next=document.getElementById('next');
try{
 const result=contract.validate(problem);if(!result.ok)throw Error(result.errors.join('；'));
 const frames=renderer.frames(problem);if(!frames.length)throw Error('没有可播放的作图步骤');
 let index=0;
 document.getElementById('problemTitle').textContent=problem.title;
 function render(){
  const frame=frames[index];
  board.innerHTML=renderer.svgMarkup(frame);
  reason.textContent=frame.explanation;
  counter.textContent=(index+1)+' / '+frames.length;
  previous.disabled=index===0;next.disabled=index===frames.length-1;
 }
 previous.addEventListener('click',()=>{if(index>0){index--;render()}});
 next.addEventListener('click',()=>{if(index<frames.length-1){index++;render()}});
 status.textContent='已加载 '+frames.length+' 个经过验证格式检查的原创演示步骤。';
 render();
}catch(error){status.textContent='播放器无法加载：'+error.message;previous.disabled=true;next.disabled=true}
})();
