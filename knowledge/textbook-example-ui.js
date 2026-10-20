/* Only source-verified textbook examples can be shown. Never load copied PDF scans.
 * The synthetic SVG pixel coordinates are deliberately marked as normalization.
 */
(function(){'use strict';
const $=id=>document.getElementById(id);
const source=window.TextbookExamples,geom=window.TextbookExampleGeometry;
const adapter=window.TextbookActionAdapter,dof=window.DrawingPlayerDofSummary;
let current=null,index=0,problem=null;
const ns='http://www.w3.org/2000/svg';
function svg(tag,attrs,content){const element=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs||{}))element.setAttribute(k,String(v));if(content!==undefined)element.textContent=content;$('bookExampleSvg').append(element);return element}
const colors={given:'#2b7451',axis:'#758878',auxiliary:'#bc7f2e',mark:'#a36c35',result:'#216faf'};
function draw(frame){
 const board=$('bookExampleSvg');board.replaceChildren();
 svg('rect',{width:820,height:420,fill:'#fff'});
 for(const item of frame.shapes){
  if(!$('bookExampleShowAux').checked && item.style==='auxiliary')continue;
  const col=colors[item.style]||'#657567';
  if(item.type==='line'){
   svg('line',{x1:item.a.x,y1:item.a.y,x2:item.b.x,y2:item.b.y,stroke:col,
    'stroke-width':item.style==='result'?3.8:item.style==='given'?3:2,
    'stroke-linecap':'round',
    ...(item.style==='auxiliary'||item.style==='axis'?{'stroke-dasharray':item.style==='axis'?'3 5':'8 5'}:{})});
  }else if(item.type==='point'){
   svg('circle',{cx:item.p.x,cy:item.p.y,r:item.style==='result'?6.5:5.4,fill:col});
   svg('text',{x:item.p.x+8,y:item.p.y-9,'font-size':19,'font-weight':600,fill:col},item.label);
  }
 }
}
function render(){
 if(!current)return;
 const frame=geom.frame(current.id,index),step=current.order[index];
 draw(frame);
 $('bookExampleCounter').textContent='步骤 '+(index+1)+' / '+current.order.length;
 const nav=$('bookExampleStepNav');nav.replaceChildren();
 nav.setAttribute('role','group');nav.setAttribute('aria-label','教材例题步骤导航');
 current.order.forEach((label,i)=>{
  const button=document.createElement('button');
  button.type='button';button.textContent=String(i+1);
  button.title='第 '+(i+1)+' 步：'+label;
  button.setAttribute('aria-pressed',String(i===index));
  button.setAttribute('aria-label',button.title);
  if(i===index){button.className='is-current';button.setAttribute('aria-current','step')}
  button.addEventListener('click',()=>{index=i;render()});
  nav.append(button);
 });
 $('bookExampleSvg').setAttribute('role','img');
 $('bookExampleSvg').setAttribute('aria-label',current.number+'：'+step+'。步骤 '+(index+1)+' / '+current.order.length);
 $('bookExampleStageTitle').textContent='课本作图 · '+(index+1)+' / '+current.order.length;
 $('bookExampleAction').textContent='本步按教材做：'+step;
 $('bookExampleReason').textContent='为什么这样作：'+current.why[index];
 $('bookExampleDof').textContent='教材步骤说明：'+current.freedom[index]+'（'+frame.degreeTarget+'）';
 const badge=$('bookExampleComputedDof'),constraintNote=$('bookExampleConstraintReason');
 badge.hidden=true;constraintNote.textContent='';
 const currentStep=problem&&problem.steps[index],prior=index>0&&problem?problem.steps[index-1]:null;
 if(currentStep?.localDofAnalysis){
  try{
   const summary=dof.summarize(currentStep.localDofAnalysis,prior?.localDofAnalysis||null);
   if(summary.available){
    badge.hidden=false;
    $('bookExampleComputedDofValue').textContent=String(summary.currentDegrees);
    $('bookExampleComputedDofLabel').textContent=summary.label+' · 剩余局部自由度';
    const note=currentStep.localDofExplanation;
    constraintNote.textContent=note?'计算依据：'+(note.addedConstraint||'本步未新增独立定位条件')+'。'+note.reason+' '+note.scope:'';
   }else constraintNote.textContent='本步未显示计算自由度：'+summary.reason;
  }catch(error){constraintNote.textContent='自由度计算未通过核验：'+error.message;}
 }else constraintNote.textContent='本步没有经过核验的结构化几何约束，以上为教材步骤说明。';
 $('bookExampleAudit').textContent='本步核对：'+current.stageChecks[index]+(index===4?
  ' 数学验证：'+(frame.proof.maxResidual<1e-8?'通过':'未通过')+'。':'');
 $('bookExamplePrev').disabled=index===0;
 $('bookExampleNext').disabled=index===current.order.length-1;
}
let available=[];
function activate(example){
 current=example;index=0;problem=null;
 const sharedLink=$('bookExampleSharedPlayer');
 if(sharedLink)sharedLink.hidden=!example;
 if(!example)return;
 try{problem=adapter.adapt(example,geom)}catch(error){problem=null}
 $('bookExampleTitle').textContent=example.number+' · '+example.title;
 $('bookExampleSource').textContent='《工程制图与 AutoCAD》第3版 · 印刷第'+example.printedPage+'页 / PDF第'+example.pdfPage+'页 · '+example.figure;
 $('bookExampleKnown').textContent='课本例题：'+example.known+' 目标：'+example.goal;
 $('bookExampleFidelity').textContent='来源与重绘边界：'+example.fidelity;
 if(sharedLink){sharedLink.hidden=false;sharedLink.href='./drawing-player.html?example='+encodeURIComponent(example.id)}
 render();
}
function show(topicId){
 const view=$('textbookExample');if(!view)return;
 const matches=source?.forTopic(topicId)||[];
 available=matches;
 const example=matches[0]||null;
 view.hidden=!example;
 const picker=$('bookExamplePicker');
 picker.replaceChildren();
 for(const entry of matches){
  const option=document.createElement('option');
  option.value=entry.id;option.textContent=entry.number+' · '+entry.title;
  picker.append(option);
 }
 $('bookExamplePickerLabel').hidden=matches.length<2;
 if(!example){current=null;problem=null;return}
 picker.value=example.id;
 activate(example);
}
$('bookExamplePicker').addEventListener('change',()=>{
 const example=available.find(entry=>entry.id===$('bookExamplePicker').value);
 if(example)activate(example);
});
$('bookExampleShowAux').addEventListener('change',()=>{if(current)render()});
$('bookExamplePrev').addEventListener('click',()=>{if(current){index=Math.max(0,index-1);render()}});
$('bookExampleNext').addEventListener('click',()=>{if(current){index=Math.min(current.order.length-1,index+1);render()}});
$('bookExampleReset').addEventListener('click',()=>{if(current){index=0;render()}});
$('bookExampleFinal').addEventListener('click',()=>{if(current){index=current.order.length-1;render()}});
// Arrow keys move between verified frames only while the example controls have focus.
$('textbookExample').addEventListener('keydown',event=>{
 if(!current||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
 const target=event.target;
 if(!target||!target.closest||!target.closest('.book-example-guide'))return;
 if(target.matches('input,textarea,select'))return;
 if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
 const next=Math.max(0,Math.min(current.order.length-1,index+(event.key==='ArrowRight'?1:-1)));
 if(next===index)return;
 event.preventDefault();index=next;render();
});
window.TextbookExampleUI={show};
})();