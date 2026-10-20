(function(){'use strict';
const data=window.TextbookPageAudit,book=window.DrawingKnowledge;
const $=id=>document.getElementById(id);
if(!data||!book){$('auditResult').textContent='教材数据尚未加载';return}
const select=$('auditChapter');
const reviewedExamples=data.individuallyReviewedExamples||[];
$('auditExampleCount').textContent='已单独核对 '+reviewedExamples.length+' 道教材例题（与整页核验不同）';
const linkHolder=$('auditExampleLinks');
for(const example of reviewedExamples){
 const link=document.createElement('a');link.href='./index.html#'+encodeURIComponent(example.topic);
 link.textContent=example.number+' · '+example.title+'（印刷第'+example.printedPage+'页） ↗';
 link.style.display='inline-block';link.style.margin='7px 14px 0 0';linkHolder.append(link);
}
select.add(new Option('全部 292 页（包括前后资料）','all'));
for(const chapter of book.chapters)select.add(new Option(chapter.name,chapter.id));
const sectionMap=Object.fromEntries(book.sections.map(s=>[s.id,s]));
function node(tag,text,className){
 const e=document.createElement(tag);e.textContent=text;
 if(className)e.className=className;return e;
}
function render(){
 const chapter=select.value;
 const pages=chapter==='all'?data.pages:data.pages.filter(p=>p.chapter===chapter);
 const summary=data.summary(chapter==='all'?null:chapter);
 $('auditCount').textContent=summary.indexed;
 $('auditSampled').textContent=summary.visuallySampled;
 $('auditReviewed').textContent=summary.fullyReviewed;
 $('auditWaiting').textContent=summary.awaitingFullReview;
 $('auditResult').textContent='当前显示 '+pages.length+' 页';
 const grid=$('auditPages');grid.replaceChildren();
 if(!pages.length){grid.append(node('p','本章尚未匹配到PDF页码，请核对章节目次。','empty'));return}
 for(const page of pages){
  const card=node('article',null,'page'+(page.visualSample?' sample':''));
  card.append(node('h3','PDF 第 '+page.pdfPage+' 页'+(page.printedPage?' · 原书第 '+page.printedPage+' 页':'')));
  const section=page.sectionId?sectionMap[page.sectionId]:null;
  card.append(node('span',page.fullyPageReviewed?'正文/图例/步骤均已核验':
   page.visualSample?'已抽查 · 待逐条核验':'未完成逐页核验','flag'));
  if(section){card.append(node('p',(section.sectionNumber==='附录'?'':section.sectionNumber+' ')+section.title,'section'))}
  else card.append(node('p',page.part==='front'?'前置页（封面、前言或目录）':page.part==='back'?'后置资料':'章节之外的正文页'));
  if(page.visualSample)card.append(node('p','抽查内容：'+page.visualSample));
  if(!page.fullyPageReviewed)card.append(node('small','尚不能据此发布原书例题步骤和图形答案。'));
  grid.append(card);
 }
}
select.addEventListener('change',render);render();
})();
