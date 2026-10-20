/* Whole-source page inventory based on the user's 292-page image-only PDF.
 * Inventory != full text/figure/example verification. Never ship PDF scans or
 * reconstruct publisher pages here. Update reviews only after direct page review.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./knowledge-data.js'):root.DrawingKnowledge,
  typeof module==='object'&&module.exports?require('./textbook-examples.js'):root.TextbookExamples);
 if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TextbookPageAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(book,examples){
'use strict';
const pageCount=292,firstBody=7,lastBody=290;
const samples=new Map([
 [90,'轴测图概述及图4-1坐标轴'],
 [91,'正等与斜轴测规则及图4-2'],
 [93,'正等轴测基本体例题和作图步骤'],
 [95,'正等轴测六等分圆的步骤'],
 [98,'轴测支座综合示例的图形'],
 [100,'正二测构形步骤与比例'],
 [102,'轴测圆与支座演示'],
 [103,'图样基本表示法章节起始与基本视图'],
 [105,'向视、局部视图及图5-3'],
 [110,'剖视种类比较及内部结构'],
 [114,'半剖图的构造示例'],
 [120,'重合断面与断面示例'],
 [128,'螺纹与螺纹加工的介绍'],
 [130,'螺纹特殊表示和标注表'],
 [133,'螺纹代号与标记示例'],
 [149,'零件图概述与表达方法'],
 [151,'零件图综合示意与标题栏'],
 [155,'零件尺寸及工艺标注'],
 [175,'装配图章节与整机图例'],
 [178,'装配图特殊画法与固定结构'],
 [181,'轴承与装配防松结构'],
 [193,'金属焊接图及不同接头形式'],
 [196,'焊缝符号表示表'],
 [202,'建筑施工图章节与组成'],
 [205,'建筑平立面的图示对应'],
 [214,'电气专业制图章节和原理接线图'],
 [219,'位置代号与现场布置'],
 [231,'AutoCAD Mechanical章节及界面'],
 [237,'圆形多边形命令与操作示意'],
 [242,'二维图形及矩形圆角操作']
]);
/* Progress records must include individually verified source checks.
 * An orientation sample is NOT a full page review. The map is deliberately empty.
 * Every confirmed source check can be added as {pdfPage:{text:true,figures:true,
 * examples:true,steps:true,notes:'review rationale'}} by later audited batches.
 */
const reviews=Object.freeze({});
function sectionFor(printed){
 return book.sections.find(s=>printed>=s.startPage&&printed<=s.endPage)||null;
}
const pages=Array.from({length:pageCount},(_,index)=>{
 const pdfPage=index+1,body=pdfPage>=firstBody&&pdfPage<=lastBody;
 const printedPage=body?pdfPage-6:null;
 const section=body?sectionFor(printedPage):null;
 const entry=reviews[pdfPage]||null;
 const full=!!(entry?.text&&entry?.figures&&entry?.examples&&entry?.steps);
 return Object.freeze({pdfPage,printedPage,sectionId:section?.id||null,
  chapter:section?.chapter||null,part:pdfPage<=6?'front':pdfPage>=291?'back':'body',
  scanIndexed:true,extractedTextAvailable:false,
  visualSample:samples.get(pdfPage)||null,fullyPageReviewed:full,
  evidence:entry?{...entry}:null});
});
function get(pdfPage){return Number.isInteger(pdfPage)&&pdfPage>=1&&pdfPage<=pageCount?pages[pdfPage-1]:null}
function forSection(sectionId){return pages.filter(p=>p.sectionId===sectionId)}
function summary(chapter=null){
 const set=chapter?pages.filter(x=>x.chapter===chapter):pages;
 return {total:set.length,indexed:set.length,visuallySampled:set.filter(x=>x.visualSample).length,
  fullyReviewed:set.filter(x=>x.fullyPageReviewed).length,
  awaitingFullReview:set.filter(x=>!x.fullyPageReviewed).length};
}
const figureSourceNotes=Object.freeze([
 {chapter:'ch04',printedPage:84,pdfPage:90,topic:'轴测图的方向和轴向比例',status:'visual-sampled',note:'对照页首图示建立来源入口；尚未逐条审核原图全部尺寸。'},
 {chapter:'ch05',printedPage:97,pdfPage:103,topic:'基本视图与观察方向',status:'visual-sampled',note:'只核对章节与示意图存在，尚未重绘原书例题。'},
 {chapter:'ch06',printedPage:122,pdfPage:128,topic:'螺纹结构及标准表示',status:'visual-sampled',note:'规范图例需核对现行标准，不从模糊扫描推断代号。'},
 {chapter:'ch07',printedPage:143,pdfPage:149,topic:'零件图表达',status:'visual-sampled',note:'零件尺寸和图样不被自动转为未经核实的原题答案。'},
 {chapter:'ch08',printedPage:169,pdfPage:175,topic:'装配图的组成和表达',status:'visual-sampled',note:'仅核对该页章节和整机图例的存在。'},
 {chapter:'ch09',printedPage:187,pdfPage:193,topic:'焊接结构和焊缝',status:'visual-sampled',note:'焊缝符号和标注仍需逐页、逐标准复核。'},
 {chapter:'ch10',printedPage:196,pdfPage:202,topic:'建筑平面、立面和剖面',status:'visual-sampled',note:'图中有多视图与建筑结构示例，尚未转为可核验的绘图步骤。'},
 {chapter:'ch11',printedPage:208,pdfPage:214,topic:'电气图的逻辑连接',status:'visual-sampled',note:'电路原理图连接关系不视为机械几何自由度。'},
 {chapter:'ch12',printedPage:225,pdfPage:231,topic:'AutoCAD Mechanical 界面与文件',status:'visual-sampled',note:'教材软件版本步骤可能过时，不能据旧截图保证当前软件效果。'}
]);
const individuallyReviewedExamples=Object.freeze((examples?.all||[]).filter(x=>x.sourceStatus==='page-figure-reviewed').map(x=>Object.freeze({
 id:x.id,number:x.number,title:x.title,pdfPage:x.pdfPage,printedPage:x.printedPage,figure:x.figure,topic:x.topics[0],
 note:'仅该例题的来源、图号与主要步骤经过单独核对；不代表整页图文及同页其他例题都完成逐页核验。'
})));
return Object.freeze({pageCount,pages,get,forSection,summary,figureSourceNotes,individuallyReviewedExamples,samplePages:[...samples.keys()]});
});
