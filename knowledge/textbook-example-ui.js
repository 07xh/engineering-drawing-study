/* Only source-verified textbook examples can be shown. Never load copied PDF scans.
 * The synthetic SVG pixel coordinates are deliberately marked as normalization.
 */
(function(){'use strict';
const $=id=>document.getElementById(id);
const source=window.TextbookExamples,geom=window.TextbookExampleGeometry;
const adapter=window.TextbookActionAdapter,dof=window.DrawingPlayerDofSummary,inspector=window.TextbookShapeInspector;
let current=null,index=0,problem=null,selectedShapeKey=null;
const ns='http://www.w3.org/2000/svg';
function svg(tag,attrs,content){const element=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs||{}))element.setAttribute(k,String(v));if(content!==undefined)element.textContent=content;$('bookExampleSvg').append(element);return element}
const colors={given:'#2b7451',axis:'#758878',auxiliary:'#bc7f2e',mark:'#a36c35',result:'#216faf'};
// Compare consecutive textbook geometry frames, not prose-step numbers.
function shapeKey(item){
 return JSON.stringify(item.type==='line'?[item.type,item.style,item.label,item.a.x,item.a.y,item.b.x,item.b.y]:
  [item.type,item.style,item.label,item.p.x,item.p.y]);
}
function stageDelta(frame){
 if(index===0)return [];
 const prior=geom.frame(current.id,index-1),seen=new Set(prior.shapes.map(shapeKey));
 return frame.shapes.filter(item=>!seen.has(shapeKey(item)));
}
function selectable(item){
 return inspector?.explain(current.id,item)||null;
}
function visible(item){return $('bookExampleShowAux').checked||item.style!=='auxiliary'}
function inspectable(frame){return frame.shapes.filter(item=>visible(item)&&selectable(item))}
function pickShape(key,restoreFocus=false){
 selectedShapeKey=key;
 $('bookExampleShapeInspector').open=true;
 render();
 if(restoreFocus){
  const targets=$('bookExampleSvg').querySelectorAll?.('[data-inspect-key]')||[];
  const target=[...targets].find(node=>node.getAttribute('data-inspect-key')===key);
  target?.focus?.({preventScroll:true});
 }
}
function bindHit(node,item,key){
 const info=selectable(item);if(!info)return;
 node.setAttribute('data-inspect-key',key);
 node.setAttribute('role','button');node.setAttribute('tabindex','0');
 node.setAttribute('aria-pressed',String(selectedShapeKey===key));
 node.setAttribute('aria-label','查看'+info.name+'的作图依据');
 node.addEventListener('click',()=>pickShape(key,true));
 node.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();pickShape(key,true)}
 });
}
function draw(frame,added){
 const board=$('bookExampleSvg');board.replaceChildren();
 const fresh=new Set(added.map(shapeKey)),highlight=$('bookExampleHighlight').checked;
 svg('rect',{width:820,height:420,fill:'#fff'});
 for(const item of frame.shapes){
  if(!$('bookExampleShowAux').checked && item.style==='auxiliary')continue;
  const col=colors[item.style]||'#657567';
  const isNew=index>0&&fresh.has(shapeKey(item));
  const attrs=highlight&&isNew?{class:'book-example-new-shape','data-new':'true'}:{};
  const picked=selectedShapeKey===shapeKey(item);
  if(item.type==='line'){
   if(highlight&&isNew)svg('line',{x1:item.a.x,y1:item.a.y,x2:item.b.x,y2:item.b.y,stroke:'#e5b957',
    'stroke-width':9,opacity:.34,'stroke-linecap':'round','aria-hidden':'true','pointer-events':'none'});
   if(picked)svg('line',{x1:item.a.x,y1:item.a.y,x2:item.b.x,y2:item.b.y,stroke:'#487eac',
    'stroke-width':14,opacity:.26,'aria-hidden':'true','pointer-events':'none'});
   svg('line',{x1:item.a.x,y1:item.a.y,x2:item.b.x,y2:item.b.y,stroke:col,
    'stroke-width':item.style==='result'?3.8:item.style==='given'?3:2,
    'stroke-linecap':'round',...attrs,'pointer-events':'none',
    ...(item.style==='auxiliary'||item.style==='axis'?{'stroke-dasharray':item.style==='axis'?'3 5':'8 5'}:{})});
   const hit=svg('line',{x1:item.a.x,y1:item.a.y,x2:item.b.x,y2:item.b.y,stroke:'transparent',
    'stroke-width':20,'pointer-events':'stroke','data-hit':'true'});
   bindHit(hit,item,shapeKey(item));
  }else if(item.type==='point'){
   if(highlight&&isNew)svg('circle',{cx:item.p.x,cy:item.p.y,r:11,fill:'#f5d986',opacity:.5,'aria-hidden':'true','pointer-events':'none'});
   if(picked)svg('circle',{cx:item.p.x,cy:item.p.y,r:15,stroke:'#487eac','stroke-width':4,opacity:.72,fill:'none','aria-hidden':'true','pointer-events':'none'});
   svg('circle',{cx:item.p.x,cy:item.p.y,r:item.style==='result'?6.5:5.4,fill:col,...attrs,'pointer-events':'none'});
   svg('text',{x:item.p.x+8,y:item.p.y-9,'font-size':19,'font-weight':600,fill:col,'pointer-events':'none'},item.label);
   const hit=svg('circle',{cx:item.p.x,cy:item.p.y,r:14,fill:'transparent','pointer-events':'all','data-hit':'true'});
   bindHit(hit,item,shapeKey(item));
  }
 }
}
function updateInspector(items){
 const select=$('bookExampleShapeSelect');select.replaceChildren();
 for(const shape of items){
  const data=selectable(shape),option=document.createElement('option');
  option.value=shapeKey(shape);option.textContent=data.name+' · '+data.role;
  select.append(option);
 }
 const chosen=items.find(item=>shapeKey(item)===selectedShapeKey);
 const detail=chosen&&selectable(chosen);
 select.disabled=!detail;
 if(!detail){
  $('bookExampleShapeSummary').textContent='当前没有可检查的图元';
  for(const id of ['bookExampleShapeName','bookExampleShapeRole','bookExampleShapeReason','bookExampleShapeEffect'])
   $(id).textContent='本帧没有可检查的几何元素。';
  return;
 }
 select.value=selectedShapeKey;
 $('bookExampleShapeSummary').textContent=detail.name;
 $('bookExampleShapeName').textContent=detail.name;
 $('bookExampleShapeRole').textContent='图中作用：'+detail.role;
 $('bookExampleShapeReason').textContent='为什么画它：'+detail.reason;
 $('bookExampleShapeEffect').textContent='约束意义：'+detail.effect;
}
function render(){
 if(!current)return;
 const frame=geom.frame(current.id,index),step=current.order[index];
 const added=stageDelta(frame),items=inspectable(frame);
 if(!items.some(item=>shapeKey(item)===selectedShapeKey)){
  const firstAdded=added.find(item=>visible(item)&&selectable(item)&&item.style==='auxiliary')||
   added.find(item=>visible(item)&&selectable(item))||items[0];
  selectedShapeKey=firstAdded?shapeKey(firstAdded):null;
 }
 draw(frame,added);
 updateInspector(items);
 const selected=items.find(item=>shapeKey(item)===selectedShapeKey);
 if(window.TextbookConstraintVisualUI)window.TextbookConstraintVisualUI.show(current,index,problem,selected?.label||null);
 const newLabels=[...new Set(added.map(shape=>shape.label).filter(Boolean))];
 $('bookExampleStageAddition').textContent=index===0?
  '已知条件：先辨认题目提供的点线与投影轴；此时不显示待求结果。':
  !added.length?'本步未新增图线或点，主要用于检查已经建立的关系。':
  '本步新增 '+added.length+' 个几何图元：'+newLabels.slice(0,4).join('、')+(newLabels.length>4?' 等':'')+'。';
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
  button.addEventListener('click',()=>{index=i;selectedShapeKey=null;render()});
  nav.append(button);
 });
 $('bookExampleSvg').setAttribute('role','group');
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
 current=example;index=0;problem=null;selectedShapeKey=null;
 $('bookExampleShapeInspector').open=false;
 $('bookExampleDofDetails').open=false;
 $('bookExampleCheckDetails').open=false;
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
 if(!example){current=null;problem=null;window.TextbookConstraintVisualUI?.clear();return}
 picker.value=example.id;
 activate(example);
}
$('bookExamplePicker').addEventListener('change',()=>{
 const example=available.find(entry=>entry.id===$('bookExamplePicker').value);
 if(example)activate(example);
});
$('bookExampleShowAux').addEventListener('change',()=>{if(current)render()});
$('bookExampleShapeSelect').addEventListener('change',()=>{if(current)pickShape($('bookExampleShapeSelect').value)});
$('bookExampleHighlight').addEventListener('change',()=>{if(current)render()});
$('bookExampleZoom').addEventListener('click',()=>{
 const canvas=$('bookExampleCanvas'),zoom=canvas.classList.toggle('is-zoomed');
 $('bookExampleZoom').setAttribute('aria-pressed',String(zoom));
 $('bookExampleZoom').textContent=zoom?'适应屏幕':'放大查看';
 if(!zoom)canvas.scrollLeft=0;
});
$('bookExamplePrev').addEventListener('click',()=>{if(current){index=Math.max(0,index-1);selectedShapeKey=null;render()}});
$('bookExampleNext').addEventListener('click',()=>{if(current){index=Math.min(current.order.length-1,index+1);selectedShapeKey=null;render()}});
$('bookExampleReset').addEventListener('click',()=>{if(current){index=0;selectedShapeKey=null;render()}});
$('bookExampleFinal').addEventListener('click',()=>{if(current){index=current.order.length-1;selectedShapeKey=null;render()}});
// Arrow keys move between verified frames only while the example controls have focus.
$('textbookExample').addEventListener('keydown',event=>{
 if(!current||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
 const target=event.target;
 if(!target||!target.closest||!target.closest('.book-example-guide'))return;
 if(target.matches('input,textarea,select'))return;
 if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
 const next=Math.max(0,Math.min(current.order.length-1,index+(event.key==='ArrowRight'?1:-1)));
 if(next===index)return;
 event.preventDefault();index=next;selectedShapeKey=null;render();
});
window.TextbookExampleUI={show};
})();