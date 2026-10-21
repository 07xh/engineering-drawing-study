(function(){'use strict';
const C=window.PointCoach,G=window.PointConstruction,$=id=>document.getElementById(id);
if(!C||!G){$('storageStatus').textContent='学习组件未能加载，请刷新页面。';return;}
let storageAvailable=true,raw=null;
try{raw=localStorage.getItem(C.storageKey);}catch(e){storageAvailable=false;}
let data=C.restore(raw),state=data.active;
const board=$('coachBoard'),inputs=[$('candidateY'),$('candidateZ')],radios=Array.from(document.querySelectorAll('input[name="reason"]'));
const hints=[
 '先找高度：a′ 到 X 轴的竖直距离，就是 a″ 的高度。只确定高度时，候选点还可以左右移动。',
 '再找深度：a 到 X 轴的距离是 y；a″ 到 Z 轴的横向距离，也必须是同一个 y。图上已显示等高联系线。',
 '把 a 水平引到右下方的 45° 转移线，再竖直向上，与 a′ 的等高线相交。两个条件交会，才确定唯一的 a″。'
];
function persist(){
 data.active=state;
 try{localStorage.setItem(C.storageKey,JSON.stringify(data));storageAvailable=true;}catch(e){storageAvailable=false;}
 $('storageStatus').className='coach-storage'+(storageAvailable?'':' error');
 $('storageStatus').textContent=storageAvailable?'学习记录仅保存在当前浏览器，不会自动跨设备同步。':'当前浏览器无法保存学习记录。你仍可完成练习，但刷新或关闭后本次进度可能丢失。';
}
function text(x,y,value,color='#345b45',size=22){return '<text x="'+x+'" y="'+y+'" fill="'+color+'" font-size="'+size+'">'+value+'</text>';}
function line(x1,y1,x2,y2,color='#b1bfb3',dash='',width=1.5){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';}
function renderBoard(){
 const stage=state.explanation?state.stage:state.hint>=3?2:state.hint>=2?1:0;
 const frame=G.frame(state.problem,stage),coords=frame.coords;
 let svg='<title>已知 a′ 和 a，在 W 面补 a″；深度 '+state.problem.y+'，高度 '+state.problem.z+'，以图中标注为依据。</title>';
 svg+='<rect x="485" y="50" width="315" height="222" rx="12" fill="#f1f5e9"/>';
 for(let v=0;v<=70;v+=10){
  const dx=G.origin.x+v*G.scale,dy=G.origin.y-v*G.scale;
  svg+=line(dx,55,dx,300,'#e0e7dc')+line(460,dy,800,dy,'#e0e7dc');
  if(v>0)svg+=text(dx-8,326,String(v),'#687866',16)+text(432,dy+5,String(v),'#687866',16);
 }
 for(const shape of frame.shapes){
  if(shape.kind==='panel'){
   const [x,y,w,h]=shape.rect;svg+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="10" fill="none" stroke="#d1ddce"/>';
   svg+=text(x+14,y+30,shape.label,'#496747',22);
  }else if(shape.kind==='point'){
   const [x,y]=shape.at;svg+='<circle cx="'+x+'" cy="'+y+'" r="7" fill="#286e4d"/>'+text(x+12,y-10,shape.label);
  }else if(shape.xy){const [x1,y1,x2,y2]=shape.xy;svg+=line(x1,y1,x2,y2,shape.kind==='axis'?'#8b9d8e':'#a66b29',shape.kind==='axis'?'':'8 6',shape.kind==='axis'?2:2.5);}
 }
 // Explicit known dimensions support keyboard and screen-reader users without a mouse.
 svg+=line(coords.V[0],coords.V[1],coords.H[0],coords.H[1],'#b8c6b6','5 5');
 svg+=text(140,265,'已知高度 z = '+state.problem.z,'#315b44',23);
 svg+=text(140,558,'已知深度 y = '+state.problem.y,'#315b44',23);
 svg+=text(467,296,'O')+text(95,293,'X')+text(467,32,'Z')+text(467,611,'Y（H）')+text(807,295,'Y（W）',undefined,19);
 if(state.candidate&&!state.explanation){
  const x=G.origin.x+state.candidate.y*G.scale,y=G.origin.y-state.candidate.z*G.scale;
  svg+='<path d="M '+x+' '+(y-10)+' l 10 10 -10 10 -10 -10 Z" fill="#fff6e6" stroke="#a85b1f" stroke-width="3"/>'+text(x+14,y+20,'你的 a″','#9a501e');
 }
 board.innerHTML=svg;
 $('modeBadge').textContent=state.explanation?'分步讲解':state.solved?'本组已完成':state.assisted?'提示后尝试':'自己尝试';
 $('candidateStatus').textContent=state.candidate?'你的候选点：深度 '+state.candidate.y+'，高度 '+state.candidate.z+'。'+(state.explanation?'讲解模式暂时隐藏候选点。':'尚需点击“检查位置与依据”核对。'):'尚未放置候选点 a″。';
 $('explanationPanel').hidden=!state.explanation;
 if(state.explanation){$('explainCount').textContent=(state.stage+1)+' / 5';$('explainTitle').textContent=frame.title;$('explainWhy').textContent=frame.why;$('explainPrev').disabled=state.stage===0;$('explainNext').disabled=state.stage===4;}
}
function renderSpatial(){
 if(!state.model)return;
 const angle=Number($('modelAngle').value)*Math.PI/180;
 const project=([x,y,z])=>[260+(-x*Math.cos(angle)+y*Math.sin(angle))*3.1,260+(x*Math.sin(angle)+y*Math.cos(angle))*1.25-z*3];
 const poly=(points,fill)=>'<polygon points="'+points.map(p=>project(p).join(',')).join(' ')+'" fill="'+fill+'" stroke="#9fb3a0"/>';
 let svg=poly([[0,0,0],[65,0,0],[65,65,0],[0,65,0]],'#d8e6c9')+poly([[0,0,0],[65,0,0],[65,0,65],[0,0,65]],'#e1ebe4')+poly([[0,0,0],[0,65,0],[0,65,65],[0,0,65]],'#e8e0cd');
 const p=state.problem,A=project([p.x,p.y,p.z]);
 for(const [point,label] of [[[p.x,0,p.z],'a′ / V'],[[p.x,p.y,0],'a / H'],[[0,p.y,p.z],'a″ / W']]){
  const q=project(point);svg+=line(...A,...q,'#8b6f43','6 5',2)+'<circle cx="'+q[0]+'" cy="'+q[1]+'" r="5" fill="#497b51"/>'+text(q[0]+7,q[1]-9,label,'#32523a',17);
 }
 svg+='<circle cx="'+A[0]+'" cy="'+A[1]+'" r="7" fill="#b36a2b"/>'+text(A[0]+10,A[1]-8,'A','#945019');
 $('spatialBoard').innerHTML=svg;
 $('modelCoordinates').textContent='辅助学习参数：A('+p.x+', '+p.y+', '+p.z+')。V 保留 x、z，H 保留 x、y，W 保留 y、z。';
}
function renderRecords(){
 const unique=mode=>new Set(data.records.filter(r=>r.mode===mode).map(r=>C.id(r.problem))).size;
 $('guidedCount').textContent=unique('guided')+' 组';$('independentCount').textContent=unique('independent')+' 组';
 $('taskState').textContent=state.solved?(state.assisted?'提示下完成':'独立完成'):state.assisted?'正在提示后尝试':'尚未完成';
 const due=data.reviewAt;
 $('reviewState').textContent=due?(Date.now()>=due?'今天复习一组':new Date(due).toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'})):'完成后安排';
 const list=$('recordList');list.replaceChildren();
 if(!data.records.length){const li=document.createElement('li');li.textContent='尚无完成记录。先尝试这一组，不用急着看答案。';list.append(li);}
 for(const r of data.records.slice(-8).reverse()){
  const li=document.createElement('li');li.textContent=new Date(r.at).toLocaleDateString('zh-CN')+' · 参数组 '+C.id(r.problem)+' · '+(r.mode==='independent'?'独立完成':'提示下完成');list.append(li);
 }
}
function render(){
 renderBoard();renderRecords();renderSpatial();
 inputs[0].value=state.candidate?.y??'';inputs[1].value=state.candidate?.z??'';
 for(const radio of radios)radio.checked=radio.value===state.reason;
 const f=state.feedback;$('answerFeedback').hidden=!f;$('answerFeedback').textContent=f?f.text:'';$('answerFeedback').className='coach-feedback'+(f?.correct?' correct':'');
 $('successPanel').hidden=!state.solved;
 $('successTitle').textContent=state.assisted?'你借助帮助完成了这一组。':'这一组，你独立完成了。';
 $('successText').textContent=state.assisted?'接下来换一组参数，不打开提示或讲解，再做一次。能自己找到位置并说明依据，才是下一步目标。':'接下来换参数检验迁移能力。已安排明天的本地复习建议，下次进入可再做一组。';
 $('attemptStage').textContent=state.solved?'03 / 独立重做':state.assisted?'02 / 理解与修正':'01 / 尝试作图';
 $('checkAnswer').disabled=state.solved||state.explanation;
 $('checkAnswer').textContent=state.explanation?'返回自己作答后再检查':state.solved?'本组已完成':'检查位置与依据';
 $('hintButton').textContent='给我一点提示 · '+state.hint+'/3';$('hintButton').disabled=state.hint===3||state.solved;
 $('explainButton').disabled=state.solved;$('modelButton').disabled=state.solved;
 $('hintList').replaceChildren();for(const hint of hints.slice(0,state.hint)){const li=document.createElement('li');li.textContent=hint;$('hintList').append(li);}
 $('spatialPanel').hidden=!state.model;
 $('taskLabel').textContent='当前参数组 '+C.id(state.problem)+' · '+(state.explanation?'正在看讲解；返回作答后亲手定位。':'用图中已知条件定位，完成后换一组检验。');
}
function dispatch(action){
 const before=state;state=C.act(state,action);
 if(state.assisted&&!data.seen.includes(C.id(state.problem)))data.seen.push(C.id(state.problem));
 if(!before.solved&&state.solved){
  const entry={problem:{...state.problem},mode:C.performance(state),at:Date.now()};
  if(!data.records.some(r=>C.id(r.problem)===C.id(entry.problem)&&r.mode===entry.mode))data.records.push(entry);
  data.records=data.records.slice(-100);
  data.reviewAt=Date.now()+(state.assisted?6:24)*60*60*1000;
 }
 persist();render();
}
function updateCandidate(){
 const rawY=inputs[0].value,rawZ=inputs[1].value;
 const candidate=rawY.trim()!==''&&rawZ.trim()!==''?{y:Number(rawY),z:Number(rawZ)}:null;
 // Do not replace either input while the user is halfway through typing the pair.
 state=C.act(state,{type:'candidate',value:candidate});persist();renderBoard();
 $('answerFeedback').hidden=true;$('successPanel').hidden=true;$('checkAnswer').disabled=state.explanation;$('checkAnswer').textContent='检查位置与依据';renderRecords();
}
for(const input of inputs)input.addEventListener('input',updateCandidate);
for(const radio of radios)radio.addEventListener('change',()=>dispatch({type:'reason',value:radio.value}));
$('answerForm').addEventListener('submit',event=>{event.preventDefault();dispatch({type:'check'});if(state.feedback)$('answerFeedback').focus({preventScroll:true});});
board.addEventListener('click',event=>{
 if(state.explanation)return;
 const matrix=board.getScreenCTM();if(!matrix)return;
 const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
 const y=Math.round((p.x-G.origin.x)/G.scale),z=Math.round((G.origin.y-p.y)/G.scale);
 if(p.x>=G.origin.x&&p.y<=G.origin.y&&C.validCandidate({y,z}))dispatch({type:'candidate',value:{y,z}});
 else {$('candidateStatus').textContent='请在右上方 W 区、0–70 的网格范围内放点，也可用输入框定位。';}
});
$('hintButton').addEventListener('click',()=>dispatch({type:'hint'}));
$('explainButton').addEventListener('click',()=>{dispatch({type:'explain'});$('explanationPanel').scrollIntoView({block:'nearest'});});
$('backPractice').addEventListener('click',()=>dispatch({type:'practice'}));
$('explainPrev').addEventListener('click',()=>dispatch({type:'stage',value:state.stage-1}));
$('explainNext').addEventListener('click',()=>dispatch({type:'stage',value:state.stage+1}));
$('modelButton').addEventListener('click',()=>{dispatch({type:'model'});$('spatialPanel').scrollIntoView({block:'start'});});
$('modelAngle').addEventListener('input',renderSpatial);
$('resetAttempt').addEventListener('click',()=>dispatch({type:'reset'}));
function newTask(){
 const excluded=[C.id(state.problem),...data.seen,...data.records.map(r=>C.id(r.problem))];
 try{state=C.create(C.generate(Math.random,excluded));persist();render();$('workspace').scrollIntoView({block:'start'});inputs[0].focus({preventScroll:true});}
 catch(e){$('storageStatus').textContent=e.message;}
}
$('newTask').addEventListener('click',newTask);$('nextPractice').addEventListener('click',newTask);
$('zoomBoard').addEventListener('click',()=>{
 const zoomed=$('zoomBoard').getAttribute('aria-pressed')!=='true';
 $('zoomBoard').setAttribute('aria-pressed',String(zoomed));$('zoomBoard').textContent=zoomed?'恢复全图':'放大看图';
 $('boardViewport').classList.toggle('is-zoomed',zoomed);
});
if(data.seen.includes(C.id(state.problem)))state.assisted=true;
persist();render();
})();
