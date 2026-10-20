/* Individually inspected scan pages: topical and figure inventory only.
 * Not complete sentence proofreading, original drawings or worked solutions.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TextbookPageInspections=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const data=[[7,1,"绪论与课程目标",[],"未见编号图表"],[8,2,"国家标准与基本图幅",["表1-1"],"幅面表与教材采用的标准年份已查看"],[9,3,"图幅裁切及不留装订边图框",["图1-1","图1-2"],"A系列幅面与A3/A4图框示意"],[10,4,"留装订边图框和标题栏",["图1-3","图1-4","图1-5"],"两类图框和标题栏结构"],[11,5,"对中符号、方向符号、比例开篇",["图1-6","图1-7"],"旋转看图方向和符号图示"],[12,6,"比例系列与字体起始",["表1-2","图1-8"],"三种比例对比，非编号例题"],[13,7,"字体示例和图线表起始",["表1-3","表1-4（上半）"],"图线表跨页"],[14,8,"图线表续页与应用示意",["表1-4（下半）","图1-9"],"多线型应用图"]];
const records=Object.freeze(data.map(([pdfPage,printedPage,topic,figures,note])=>Object.freeze({
 pdfPage,printedPage,topic,figures:Object.freeze(figures),note,
 inspectionLevel:'section-figure-inventory',textFullyChecked:false,
 figureGeometryFullyChecked:false,allExampleStepsChecked:false,fullyPageReviewed:false
})));
const map=new Map(records.map(x=>[x.pdfPage,x]));
return Object.freeze({records,get:n=>map.get(n)||null,range:[7,14]});
});
