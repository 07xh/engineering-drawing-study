/* Individually inspected scan pages: topical and figure inventory only.
 * Not complete sentence proofreading, original drawings or worked solutions.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TextbookPageInspections=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const data=[[7,1,"绪论与课程目标",[],"未见编号图表"],[8,2,"国家标准与基本图幅",["表1-1"],"幅面表与教材采用的标准年份已查看"],[9,3,"图幅裁切及不留装订边图框",["图1-1","图1-2"],"A系列幅面与A3/A4图框示意"],[10,4,"留装订边图框和标题栏",["图1-3","图1-4","图1-5"],"两类图框和标题栏结构"],[11,5,"对中符号、方向符号、比例开篇",["图1-6","图1-7"],"旋转看图方向和符号图示"],[12,6,"比例系列与字体起始",["表1-2","图1-8"],"三种比例对比，非编号例题"],[13,7,"字体示例和图线表起始",["表1-3","表1-4（上半）"],"图线表跨页"],[14,8,"图线表续页与应用示意",["表1-4（下半）","图1-9"],"多线型应用图"],
[15,9,"尺寸注法基本规则与标注构成",["表1-5","图1-10","图1-11"],"图中列出尺寸数字、界线、尺寸线与终端；仅核对结构和图号，未核对所有符号标准适用性"],
[16,10,"线性与角度尺寸的书写、尺寸线及界线",["图1-12","图1-13","图1-14"],"包含角度数字方向、图线避让与角度尺寸示例"],
[17,11,"尺寸线、尺寸界线与圆弧尺寸",["图1-15","图1-16","图1-17"],"查看正确/错误画法对照和直径半径示例"],
[18,12,"大圆弧、小尺寸与简化注法",["图1-18","图1-19","图1-20","图1-21"],"仅核对示例存在；书中引用的标准年份不能当作现行规范"],
[19,13,"几何作图：线段七等分、圆内接三角形与六边形起始",["图1-22","图1-23"],"核对例1-1、例1-2的图号与作图段落，例1-3跨页"],
[20,14,"圆内接正六边形与圆弧连接引入",["图1-24","图1-25","图1-26"],"核对例1-3续页及例1-4的四项尺规作图，图1-26仅为概念图"],
[21,15,"圆弧连接基本原理及钝角两边连接",["表1-6","图1-26","图1-27"],"表1-6列直线、外切、内切关系；例1-5的三步图示存在"],
[22,16,"直角圆角、直线与圆弧、两圆外切连接",["图1-28","图1-29","图1-30"],"核对例1-6、例1-7、例1-8图号及步骤主题，未逐条完成图形尺寸复核"]];
const records=Object.freeze(data.map(([pdfPage,printedPage,topic,figures,note])=>Object.freeze({
 pdfPage,printedPage,topic,figures:Object.freeze(figures),note,
 inspectionLevel:'section-figure-inventory',textFullyChecked:false,
 figureGeometryFullyChecked:false,allExampleStepsChecked:false,fullyPageReviewed:false
})));
const map=new Map(records.map(x=>[x.pdfPage,x]));
return Object.freeze({records,get:n=>map.get(n)||null,range:[7,22]});
});
