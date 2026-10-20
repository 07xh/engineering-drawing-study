/* 教材原图线条核对：蓝色图层仅指向已录入图形，不写解题答案。
 * 本地个人记录属于核对进度，不得作为仓库人工验证/几何证明。
 */
(function(){'use strict';
const model=window.ChapterSourceInspector,$=id=>document.getElementById(id);
const panel=$('inspectPanel'),layer=$('sourceHighlight');
if(!model||!panel||!layer)return;
const ns='http://www.w3.org/2000/svg',storage='drawing-source-review-v1',allowed=['pending','checked','uncertain'];
let source=null,exercise='',items=[],selected=-1,reviews={};
try{const data=JSON.parse(localStorage.getItem(storage)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))reviews=data}catch(e){}
const type=$('inspectType'),count=$('inspectCount'),explain=$('inspectExplain'),status=$('inspectReview'),note=$('inspectNote');
function itemKey(item){return item.kind+':'+item.index}
function match(item){const rec=reviews[exercise]&&reviews[exercise][itemKey(item)];return rec&&rec.signature===JSON.stringify(item.geometry)&&allowed.includes(rec.status)?rec:null}
function filtered(){return items.filter(x=>type.value==='all'||x.kind===type.value)}
function node(tag,attrs){
 const e=document.createElementNS(ns,tag);
 for(const [k,v]of Object.entries(attrs||{}))e.setAttribute(k,String(v));
 layer.append(e);return e;
}
function highlight(item){
 layer.replaceChildren();if(!item)return;
 const x=item.geometry,common={stroke:'#196fb4','stroke-width':5,fill:'none','pointer-events':'none'};
 if(['given','axis','transfer','thin'].includes(item.kind)){
  node('line',{x1:x[0],y1:x[1],x2:x[2],y2:x[3],...common});
  for(const [cx,cy] of [[x[0],x[1]],[x[2],x[3]]])node('circle',{cx,cy,r:5,fill:'#fff',stroke:'#196fb4','stroke-width':2});
 }else if(item.kind==='circle')node('circle',{cx:x[0],cy:x[1],r:x[2],...common});
 else node('circle',{cx:x[0],cy:x[1],r:9,...common});
}
function stats(){
 const checked=items.filter(x=>match(x)?.status==='checked').length,uncertain=items.filter(x=>match(x)?.status==='uncertain').length;
 $('inspectStats').textContent='本题个人核对记录：已对照 '+checked+' / '+items.length+' 项；标记有疑点 '+uncertain+' 项。所有记录仅代表个人对照进度，原题仍待正式核实。';
}
function render(){
 const view=filtered(),item=selected>=0?view[selected]:null;
 highlight(item);count.textContent=item?'正在检查 '+(selected+1)+' / '+view.length+' 项':'尚未选中线条 · 当前类型共 '+view.length+' 项';
 explain.textContent=item?model.explain(item,source):'已录入的原题已知图保持原样。点击“下一项”，仅在原有线条上增加蓝色高亮，不补画缺失线条。';
 $('inspectPrev').disabled=selected<0;
 $('inspectNext').disabled=view.length===0||selected>=view.length-1;
 $('inspectReset').disabled=selected<0;
 $('inspectSave').disabled=!item;
 status.disabled=!item;note.disabled=!item;
 const record=item?match(item):null;
 status.value=record?.status||'pending';note.value=record?.note||'';
 $('inspectSaved').textContent=item&&record?'已显示本机保存的个人核对记录。':'尚未保存本项核对笔记。';
 stats();
}
function open(id){
 exercise=id;source=window.VerifiedExerciseGeometry?.get(id)||null;
 items=model.collect(source);selected=-1;type.value='all';
 const summary=model.summary(source),parts=Object.entries(summary.count).map(([k,n])=>model.kinds[k].label+' '+n);
 $('inspectSummary').textContent='本题已录入 '+summary.total+' 个图形对象（'+(parts.join('、')||'暂无线条')+'）。'+
 (summary.complete?'图形登记为完整，不代表答案经过校核。':'原题仍为部分复刻，必须对照原始扫描复查。');
 render();
}
function save(){
 const item=filtered()[selected];if(!item)return;
 const record={status:allowed.includes(status.value)?status.value:'pending',note:note.value.slice(0,500),signature:JSON.stringify(item.geometry)};
 if(!reviews[exercise]||typeof reviews[exercise]!=='object')reviews[exercise]={};
 reviews[exercise][itemKey(item)]=record;
 try{localStorage.setItem(storage,JSON.stringify(reviews));$('inspectSaved').textContent='个人核对记录已保存到此浏览器；未改变任何题目审核状态。'}
 catch(e){$('inspectSaved').textContent='本机存储不可用，此条核对状态只会保留在当前页面。'}
 stats();
}
function report(){
 const header='图学课堂 · '+exercise+' · 已知线条个人核对摘要\n（仅个人阅读标记，不代表教材正式审核）';
 const lines=items.map(x=>{
  const record=match(x),name=record?.status==='checked'?'已对照':record?.status==='uncertain'?'存疑':'待核对';
  return x.kind+' #'+(x.index+1)+' '+name+(record?.note?' · '+record.note:'');
 });
 return header+'\n'+lines.join('\n');
}
type.addEventListener('change',()=>{selected=-1;render()});
$('inspectPrev').addEventListener('click',()=>{selected=Math.max(-1,selected-1);render()});
$('inspectNext').addEventListener('click',()=>{selected=Math.min(filtered().length-1,selected+1);render()});
$('inspectReset').addEventListener('click',()=>{selected=-1;render()});
$('inspectSave').addEventListener('click',save);
$('inspectCopy').addEventListener('click',async()=>{
 const text=report();
 if(navigator.clipboard&&navigator.clipboard.writeText){
  try{await navigator.clipboard.writeText(text);$('inspectSaved').textContent='已复制本题个人核对摘要。';return}catch(e){}
 }
 window.prompt('请复制本题核对摘要',text);
});
$('question').addEventListener('change',()=>open($('question').value));
open($('question').value);
window.ChapterSourceInspectorUI={open,render,report};
})();