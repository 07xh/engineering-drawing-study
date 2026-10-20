(function(){'use strict';
const book=window.DrawingKnowledge;
if(!book||!Array.isArray(book.entries)){document.getElementById('knowledgeCount').textContent='知识数据加载失败，请刷新页面或检查本地文件是否完整。';return}
const $=id=>document.getElementById(id);
const chapterNames=Object.fromEntries(book.chapters.map(c=>[c.id,c.name]));
const key='drawing-knowledge-read-v1';
const validIds=new Set(book.entries.map(x=>x.id));
let read=new Set(),current=null,step=1;
try{const raw=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(raw))read=new Set(raw.filter(x=>validIds.has(x)))}catch(e){}
const input=$('knowledgeSearch'),chapter=$('chapterSelect'),progress=$('progressSelect');
const requestedExercise=new URLSearchParams(location.search).get('exercise');
let exercise=/^2-[6-9]-(?:[1-9]|10)$/.test(requestedExercise||'')?requestedExercise:null;
for(const c of book.chapters){const option=document.createElement('option');option.value=c.id;option.textContent=c.name;chapter.append(option)}
$('totalCards').textContent=book.entries.length+' 条原创知识卡';
function save(){try{localStorage.setItem(key,JSON.stringify([...read]))}catch(e){$('markStatus').textContent='此浏览器无法保存阅读记录。'}}
function counter(){$('completedCards').textContent='本机已学 '+read.size+' / '+book.entries.length+' 条'}
function selection(){
 return book.find(input.value,chapter.value).filter(x=>(!exercise||x.practice.includes(exercise))&&(progress.value==='all'||(progress.value==='read'?read.has(x.id):!read.has(x.id))))
}
function element(tag,cls,value){const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e}
function searchView(){
 const root=$('knowledgeCards');root.replaceChildren();
 const results=selection();$('knowledgeCount').textContent='显示 '+results.length+' / '+book.entries.length+' 条知识';
 $('empty').hidden=results.length!==0;$('exerciseFilterStatus').hidden=!exercise;
 if(exercise)$('exerciseFilterStatus').textContent='正在查看习题 '+exercise+' 的关联知识。点击“清除筛选”即可浏览全部知识条目。';
 for(const item of results){
  const article=element('article','knowledge-card'+(read.has(item.id)?' is-read':''));article.dataset.id=item.id;
  const meta=element('div','meta');meta.append(element('span','pill',chapterNames[item.chapter]),element('span','source','教材第 '+item.pages.join('、')+' 页'));
  const h=element('h3','',item.title),p=element('p','',item.summary);
  const actions=element('div','card-actions');
  const button=element('button','', '学习知识 →');button.type='button';button.addEventListener('click',()=>show(item.id,true));
  actions.append(button,element('span','learned',read.has(item.id)?'✓ 已学过':''));
  article.append(meta,h,p,actions);root.append(article);
 }
 counter();
}
function updateSteps(){
 if(!current)return;
 const root=$('detailSteps');root.replaceChildren();step=Math.max(1,Math.min(step,current.steps.length));
 current.steps.slice(0,step).forEach((s,i)=>root.append(element('li','',(i+1)+'．'+s)));
 $('stepCount').textContent=step+' / '+current.steps.length+' 步';
 $('stepPrev').disabled=step<=1;$('stepNext').disabled=step>=current.steps.length;$('stepAll').disabled=step>=current.steps.length;
}
function show(id,scroll=false){
 const item=book.get(id);if(!item)return;
 current=item;step=1;
 $('knowledgeDetail').hidden=false;
 $('detailChapter').textContent=chapterNames[item.chapter];
 $('detailPages').textContent='教材印刷第 '+item.pages.join('、')+' 页 · 上传 PDF 第 '+item.pdfPages.join('、')+' 页';
 $('detailTitle').textContent=item.title;$('detailSummary').textContent=item.summary;$('detailLaw').textContent=item.law;
 $('detailUnderstanding').textContent=item.understanding;$('detailMistake').textContent=item.mistake;
 $('sourceNote').textContent='来源：'+book.source.name+'（PDF 对照页码已标注）。此条为原创归纳，不是原文或出版社标准答案。';
 const related=$('detailExercises');related.replaceChildren();
 for(const ex of item.practice){const link=element('a','',ex+' · 去做题 ↗');link.href='../labs/chapter-drawing.html#'+encodeURIComponent(ex);related.append(link)}
 $('markRead').textContent=read.has(id)?'取消已学过标记':'标记已学过';
 $('markStatus').textContent=read.has(id)?'已记录：阅读过此知识':'阅读完成后可手动标记，不等于自动判定掌握';
 updateSteps();
 if(window.KnowledgeVisualUI)window.KnowledgeVisualUI.show(id);
 try{history.replaceState(null,'','#'+id)}catch(e){}
 if(scroll){$('knowledgeDetail').scrollIntoView({behavior:'smooth',block:'start'});$('knowledgeDetail').focus({preventScroll:true})}
}
$('stepPrev').onclick=()=>{step--;updateSteps()};
$('stepNext').onclick=()=>{step++;updateSteps()};
$('stepAll').onclick=()=>{if(current){step=current.steps.length;updateSteps()}};
$('markRead').onclick=()=>{
 if(!current)return;
 if(read.has(current.id))read.delete(current.id);else read.add(current.id);
 save();show(current.id,false);searchView();
};
for(const control of [input,chapter,progress])control.addEventListener('input',searchView);
$('resetFilters').onclick=()=>{exercise=null;input.value='';chapter.value='all';progress.value='all';try{history.replaceState(null,'',location.pathname)}catch(e){}searchView()};
window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(book.get(id))show(id,false)});
searchView();
let anchor='';
try{anchor=decodeURIComponent(location.hash.slice(1))}catch(e){}
if(book.get(anchor))show(anchor,false);
})();
