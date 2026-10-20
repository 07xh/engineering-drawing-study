/* 《工程制图与AutoCAD》第3版知识地图 UI
   Newly indexed sections are not misrepresented as fully reviewed lessons.
   Keeps prior v1 progress record untouched; new edition uses an independent key.
*/
(function(){'use strict';
const book=window.DrawingKnowledge;
const $=id=>document.getElementById(id);
if(!book||!Array.isArray(book.entries)){$('knowledgeCount').textContent='第三版教材知识数据加载失败，请刷新网页。';return}
const chapters=Object.fromEntries(book.chapters.map(c=>[c.id,c]));
const sections=Object.fromEntries(book.sections.map(s=>[s.id,s]));
const key='drawing-textbook-3e-progress-v2',reviewed=new Set(book.entries.filter(x=>x.contentStatus==='page-reviewed').map(x=>x.id));
let completed=new Set(),current=null,step=0;
try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))completed=new Set(saved.filter(id=>reviewed.has(id)))}catch(e){}
const search=$('knowledgeSearch'),ch=$('chapterSelect'),sec=$('sectionSelect'),coverage=$('coverageSelect'),progress=$('progressSelect');
const exercise=new URLSearchParams(location.search).get('exercise');
for(const chapter of book.chapters){const option=document.createElement('option');option.value=chapter.id;option.textContent=chapter.name;ch.append(option)}
$('totalCards').textContent=book.chapters.length-1+' 章 · '+book.sections.filter(s=>s.chapter!=='appendix').length+' 节';
function counter(){
 $('completedCards').textContent='本机已学习 '+completed.size+' / '+reviewed.size+' 个讲解';
}
function e(tag,text,cls){
 const node=document.createElement(tag);if(cls)node.className=cls;
 if(text!==undefined)node.textContent=text;
 return node;
}
function updateSectionOptions(){
 const previousValue=sec.value;
 sec.replaceChildren(new Option('全部小节','all'));
 for(const section of book.sections.filter(s=>ch.value==='all'||s.chapter===ch.value)){
  const option=new Option((section.sectionNumber==='附录'?'':section.sectionNumber+' ')+section.title,section.id);
  sec.add(option);
 }
 if(Array.from(sec.options).some(x=>x.value===previousValue))sec.value=previousValue;
 else sec.value='all';
}
function filtered(){
 const q=search.value.trim().toLowerCase();
 return book.entries.filter(item=>{
  if(ch.value!=='all'&&item.chapter!==ch.value)return false;
  if(sec.value!=='all'&&item.section!==sec.value)return false;
  if(coverage.value!=='all'&&item.contentStatus!==coverage.value)return false;
  if(progress.value==='read'&&!completed.has(item.id))return false;
  if(progress.value==='unread'&&completed.has(item.id))return false;
  const keyword=[item.title,item.summary,item.law,item.sectionNumber,chapters[item.chapter]?.name||'',
    sections[item.section]?.title||'',...item.terms,String(item.pages.join('-'))].join(' ').toLowerCase();
  return !q||keyword.includes(q);
 });
}
function renderList(){
 const root=$('knowledgeCards');root.replaceChildren();
 const rows=filtered(),note=$('exerciseFilterStatus');
 $('knowledgeCount').textContent='共 '+book.entries.length+' 条目录与讲解记录 · 当前显示 '+rows.length+' 条';
 $('empty').hidden=rows.length!==0;
 note.hidden=!exercise;
 if(exercise)note.textContent='来自旧章节练习 '+exercise+'：该练习尚未与本次完整教材核对，不能自动认定为原书同名原题。本页按新版教材目录展示，不据题号推测知识关联。';
 let priorChapter='';
 for(const item of rows){
  if(item.chapter!==priorChapter){priorChapter=item.chapter;root.append(e('h3',chapters[item.chapter]?.name||item.chapter,'kb-chapter-heading'))}
  const card=e('article',undefined,'knowledge-card'+(completed.has(item.id)?' is-read':'')+(current?.id===item.id?' is-active':''));card.dataset.id=item.id;
  const meta=e('div',undefined,'meta');
  meta.append(e('span',chapters[item.chapter]?.shortName||item.chapter,'pill'),
    e('span','教材 '+item.pages[0]+(item.pages[0]===item.pages[1]?'':'–'+item.pages[1])+' 页','source'));
  const title=e('h3',item.title),description=e('p',item.contentStatus==='toc-only'?'目录索引 · 正文尚未逐页复核':item.summary);
  const foot=e('div',undefined,'card-actions'),button=e('button',item.contentStatus==='toc-only'?'查看目录信息 →':'阅读知识与原理 →');
  button.type='button';button.addEventListener('click',()=>show(item.id,true));
  foot.append(button,e('span',item.contentStatus==='toc-only'?'待精读':completed.has(item.id)?'✓ 已阅读':'可学习','learned'));
  card.append(meta,title,description,foot);root.append(card);
 }
 counter();
}
function renderSteps(){
 if(!current)return;
 const ul=$('detailSteps');ul.replaceChildren();
 step=Math.max(1,Math.min(step,current.steps.length));
 current.steps.slice(0,step).forEach((s,i)=>ul.append(e('li',(i+1)+'．'+s)));
 $('stepCount').textContent=step+' / '+current.steps.length+' 步';
 $('stepPrev').disabled=step<=1;
 $('stepNext').disabled=step>=current.steps.length;
 $('stepAll').disabled=step>=current.steps.length;
}
function showDepth(item){
 const deep=window.TextbookDeepLessons&&window.TextbookDeepLessons.get(item.id);
 const container=$('deepLesson');if(!container)return;
 container.hidden=!(deep&&item.contentStatus==='page-reviewed');
 if(!deep||item.contentStatus!=='page-reviewed')return;
 $('deepQuestion').textContent=deep.question;
 $('deepLogic').textContent=deep.logic;
 $('deepExample').textContent=deep.example;
 $('deepCheck').textContent=deep.check;
 $('deepBoundary').textContent='适用范围与来源界限：'+deep.boundary;
 const list=$('deepStages');list.replaceChildren();
 for(const stage of deep.stages){
  const li=e('li'),heading=e('strong',stage[0]),details=e('p',stage[1]);
  const why=e('p','为什么：'+stage[2],'deep-why');
  li.append(heading,details,why);list.append(li);
 }
}
function show(id,scroll=false){
 const item=book.get(id);if(!item)return;
 current=item;
 document.querySelectorAll('#knowledgeCards .knowledge-card').forEach(card=>card.classList.toggle('is-active',card.dataset.id===id));
 $('knowledgeDetail').hidden=false;
 $('detailChapter').textContent=chapters[item.chapter]?.name||'';
 $('detailPages').textContent='印刷第 '+item.pages[0]+(item.pages[0]===item.pages[1]?'':'–'+item.pages[1])+' 页 · PDF 第 '+item.pdfPages[0]+(item.pdfPages[0]===item.pdfPages[1]?'':'–'+item.pdfPages[1])+' 页';
 $('detailTitle').textContent=item.title;
 $('detailSummary').textContent=item.summary;
 $('sourceNote').textContent='资料依据：'+book.source.name+'。'+item.sourceDetails+' · 教材原PDF与扫描图不进入公开网页。';
 const lesson=item.contentStatus==='page-reviewed';
 $('verifiedLessonContent').hidden=!lesson;
 const notice=$('detailStatusNotice');
 notice.textContent=lesson?'已对照相应教材页面，提供重新撰写的知识讲解。动态模型仅是原创教学示例，不代表教材原题答案。':
  '目前仅按原书目录建立本节索引，尚未完成对应正文、图例和作图步骤的逐页核对；暂不显示自行推测的结论、自由度数值或作图动画。';
 notice.className=lesson?'kb-review-note':'note';
 if(lesson){
  $('detailLaw').textContent=item.law;$('detailUnderstanding').textContent=item.understanding;
  $('detailMistake').textContent=item.mistake;step=1;renderSteps();
 }
 showDepth(item);
 if(window.TextbookExampleUI)window.TextbookExampleUI.show(item.id);
 const matchedTextbookExample=!!(window.TextbookExamples&&window.TextbookExamples.forTopic(item.id).length);
 const related=$('detailExercises');related.replaceChildren();
 if(window.matchMedia('(min-width:901px)').matches)$('knowledgeDetail').scrollTop=0;
 if(!item.practice.length){related.append(e('p','本节目前没有已核对到本书原题的习题关联；目前不自动关联任何未经原图核实的习题。只有你提交且与教材已核对的题目才能作为正式关联。','source'))}
 else for(const ex of item.practice){const a=e('a',ex+' · 进入练习');a.href='../labs/chapter-drawing.html#'+encodeURIComponent(ex);related.append(a)}
 const mark=$('markRead');mark.disabled=!lesson;
 mark.textContent=completed.has(id)?'取消已学习标记':'标记已学习';
 $('markStatus').textContent=lesson?(completed.has(id)?'已在本机记录为学习过':'记录阅读进度，不等于熟练掌握'): '只有逐页核对的讲解才计入学习进度。';
 if(window.KnowledgeVisualUI)window.KnowledgeVisualUI.show(id);
 const visualLink=document.querySelector('.site-jump-visual');
 if(visualLink)visualLink.hidden=matchedTextbookExample||!lesson||!item.visualMode;
 if(matchedTextbookExample)$('visualLesson').hidden=true;
 const lab=$('chapterLabLink');if(lab){
  const allowedLabs={
   '../labs/tangent-constraint.html':'打开原创圆弧连接与自由度实验 ↗',
   '../labs/paper-geometry.html':'打开原创尺规作图与等分实验 ↗',
   '../labs/paper-geometry.html?mode=dimension':'打开原创尺寸定位实验 ↗',
   '../labs/composite-geometry.html?mode=composite':'打开第三章原创组合体三视图实验 ↗',
   '../labs/composite-geometry.html?mode=section':'打开第三章原创截交线实验 ↗',
   '../labs/composite-geometry.html?mode=intersection':'打开第三章原创相贯线实验 ↗'
  };
  const allowed=!matchedTextbookExample&&lesson&&Object.prototype.hasOwnProperty.call(allowedLabs,item.labLink);
  lab.hidden=!allowed;
  if(allowed){lab.href=item.labLink;lab.textContent=allowedLabs[item.labLink]}
 }
 try{history.replaceState(null,'','#'+encodeURIComponent(id))}catch(e){}
 if(scroll){
  const detail=$('knowledgeDetail');
  const splitLayout=window.matchMedia('(min-width:901px)').matches;
  if(splitLayout){
   // The left catalogue stays at its current scroll position.
   detail.scrollTop=0;
  }else{
   detail.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  detail.focus({preventScroll:true});
 }
}
$('stepPrev').onclick=()=>{step--;renderSteps()};
$('stepNext').onclick=()=>{step++;renderSteps()};
$('stepAll').onclick=()=>{if(current){step=current.steps.length;renderSteps()}};
$('markRead').onclick=()=>{
 if(!current||current.contentStatus!=='page-reviewed')return;
 if(completed.has(current.id))completed.delete(current.id);else completed.add(current.id);
 try{localStorage.setItem(key,JSON.stringify([...completed]))}catch(e){$('markStatus').textContent='当前浏览器无法保存阅读进度。'}
 renderList();show(current.id,false);
};
ch.addEventListener('change',()=>{updateSectionOptions();renderList()});
for(const ctl of [search,sec,coverage,progress])ctl.addEventListener('input',renderList);
$('resetFilters').onclick=()=>{search.value='';ch.value='all';updateSectionOptions();sec.value='all';coverage.value='all';progress.value='all';renderList()};
window.addEventListener('hashchange',()=>{
 let id='';try{id=decodeURIComponent(location.hash.slice(1))}catch(e){return}
 if(book.get(id))show(id,false);
});
const selectedChapter=new URLSearchParams(location.search).get('chapter');
if(selectedChapter&&chapters[selectedChapter])ch.value=selectedChapter;
updateSectionOptions();renderList();
let hash='';try{hash=decodeURIComponent(location.hash.slice(1))}catch(e){}
if(book.get(hash))show(hash,false);
else {const rows=filtered(),preferred=rows.find(x=>x.contentStatus==='page-reviewed');if(preferred)show(preferred.id,false);else if(rows.length)show(rows[0].id,false)}
})();
