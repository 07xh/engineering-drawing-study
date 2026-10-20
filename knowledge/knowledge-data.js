/* 图学课堂 · 《工程制图与 AutoCAD》第3版（胡建生主编，机械工业出版社）
 * NEW knowledge v2, rebuilt from the user's 292-page complete textbook.
 * Index: exact chapter / section names and printed starts verified against PDF page 6.
 * Section index != fully analysed lesson. Only selected Ch.2 content has page-reviewed teaching notes.
 * PDF print page mapping: printed p1 == PDF p7; for printed 1..284, PDF = printed + 6.
 * Never ship original scans, long quotations, paid chapter content, or guessed exercises.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingKnowledge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const edition='胡建生主编《工程制图与 AutoCAD》第3版（机械工业出版社）';
const catalog=[
['第一章 制图的基本知识和技能',2,[['制图国家标准简介',2],['尺寸注法',9],['几何作图',13],['平面图形分析及作图方法',21],['常用绘图工具的使用方法',24]]],
['第二章 投影基础',27,[['投影法和视图的基本概念',27],['三视图的形成及其对应关系',29],['点的投影',33],['直线的投影',37],['平面的投影',41],['几何体的投影',47]]],
['第三章 组合体',54,[['组合体的组合形式',54],['截交线',56],['相贯线',64],['组合体三视图的画法',67],['组合体的尺寸注法',69],['看组合体视图的方法',76]]],
['第四章 轴测图',84,[['轴测图的基本知识',84],['正等轴测图',85],['斜二等轴测图',93]]],
['第五章 图样的基本表示法',97,[['视图',97],['剖视图',101],['断面图',111],['局部放大图和简化画法',114],['第三角画法简介',117]]],
['第六章 图样中的特殊表示法',122,[['螺纹',122],['螺纹紧固件',128],['齿轮',131],['键联结和销联接',134],['滚动轴承',136],['圆柱螺旋压缩弹簧',139]]],
['第七章 零件图',143,[['零件的表达方法',143],['零件图的尺寸标注',148],['零件图上技术要求的注写',150],['零件上常见的工艺结构',161],['读零件图',163],['零件测绘',166]]],
['第八章 装配图',169,[['装配图的表达方法',169],['装配图的尺寸标注、技术要求及零件编号',172],['装配结构简介',174],['读装配图和拆画零件图',176],['装配体测绘',182]]],
['第九章 金属焊接图',187,[['焊接的表示法',187],['常见焊缝的标注方法',192]]],
['第十章 建筑施工图',196,[['建筑施工图的表达方法',196],['建筑施工图的识读',202]]],
['第十一章 电气专业制图',208,[['电气图的基础知识',208],['基本电气图',216],['专业电气图',222]]],
['第十二章 AutoCAD Mechanical软件的基本操作及应用',225,[['AutoCAD Mechanical软件的基本操作',225],['平面图形的绘制',234],['零件图的绘制',245],['装配图的绘制',263]]]
];
const chapters=catalog.map(([name,page,sectionArr],i)=>({id:'ch'+String(i+1).padStart(2,'0'),number:i+1,name,shortName:name.replace(/^第[一二三四五六七八九十]+章\s*/,''),startPage:page,pdfStartPage:page+6,
 sectionCount:sectionArr.length,desc:'本章目录和页码已从原书目录复核，正文内容按节逐页建设。'}));
chapters.push({id:'appendix',name:'附录与参考资料',shortName:'附录',startPage:271,pdfStartPage:277,sectionCount:3,desc:'附录 A/B/C 的目录索引；不在公开网站复制出版社附录原表。'});
const sections=[];
for(let i=0;i<catalog.length;i++){
 const [_,chapterStart,arr]=catalog[i],next=i+1<catalog.length?catalog[i+1][1]:271;
 for(let j=0;j<arr.length;j++){
  const [title,start]=arr[j],end=(j+1<arr.length?arr[j+1][1]:next)-1;
  sections.push({id:'ch'+String(i+1).padStart(2,'0')+'-s'+String(j+1).padStart(2,'0'),chapter:chapters[i].id,
    sectionNumber:(i+1)+'.'+(j+1),title,startPage:start,endPage:end,pdfStartPage:start+6,pdfEndPage:end+6});
 }
}
for(const [id,title,start,end] of [['appendix-a','附录 A 螺纹',271,271],['appendix-b','附录 B 常用的标准件',272,276],['appendix-c','附录 C 极限与配合',277,283]]){
 sections.push({id,chapter:'appendix',sectionNumber:'附录',title,startPage:start,endPage:end,pdfStartPage:start+6,pdfEndPage:end+6});
}
const entries=[];
function sectionIndex(s){
 const chapter=chapters.find(c=>c.id===s.chapter);
 entries.push({id:s.id,chapter:s.chapter,section:s.id,sectionNumber:s.sectionNumber,title:s.title,
  summary:'原书'+s.sectionNumber+'《'+s.title+'》已纳入章节目录。此条目前只有已核实的章节名称和页码，尚未从正文逐页完成知识解释。',
  law:'',steps:[],understanding:'',mistake:'',practice:[],terms:[s.title],
  pages:[s.startPage,s.endPage],pdfPages:[s.pdfStartPage,s.pdfEndPage],contentStatus:'toc-only',visualMode:null,
  sourceType:'textbook-third-edition-index',sourceVerified:true,verifiedSolution:false,
  sourceDetails:'从完整 PDF 第6页目录逐项核对；不代表正文图形和知识内容已经分析完成。'});
}
sections.forEach(sectionIndex);
function teach(sectionId,code,title,printedStart,printedEnd,parts){
 const s=sections.find(x=>x.id===sectionId);
 if(!s||printedStart<s.startPage||printedEnd>s.endPage)throw Error('讲解条目不在本节页码范围内：'+title);
 entries.push({id:'ch02-'+code,chapter:s.chapter,section:s.id,sectionNumber:s.sectionNumber,title,
  summary:parts.summary,law:parts.law,steps:parts.steps,
  understanding:parts.understanding,mistake:parts.mistake,
  practice:[],terms:parts.terms||[],pages:[printedStart,printedEnd],
  pdfPages:[printedStart+6,printedEnd+6],contentStatus:'page-reviewed',
  visualMode:parts.visualMode||null,sourceType:'textbook-third-edition-explained',sourceVerified:true,verifiedSolution:false,
  sourceDetails:'已对照用户上传完整教材相应印刷页的图文进行原创讲解。动态图属于重新建立的数学示例，不是出版社原图或答案。'});
}
teach('ch02-s01','projection-method','投影法与正投影的基本条件',27,28,{
 summary:'理解投射线、投影面及由空间物体到平面图形的映射，辨别中心投影和平行投影；工程图中的正投影以投射线垂直投影面为条件。',
 law:'正投影可用于表达物体某一观察方向下的几何投影，但单一投影通常不能完整表达空间形体。',
 steps:['先确认投影面与投射线方向。','区别中心投影、平行投影以及正投影关系。','判断当前视图遗失了哪一个空间方向的信息。'],
 understanding:'投影会沿投射方向压缩空间信息，正因此一个视图通常不足以唯一确定三维形状。',
 mistake:'将透视效果中的近大远小当作工程正投影的实际尺寸规则。',
 terms:['投射线','投影面','中心投影','平行投影','正投影']});
teach('ch02-s02','three-view-system','三视图的形成与第一角展开位置',29,30,{
 summary:'从三个互相垂直的基本投影面形成主视、俯视和左视图，按教材的展开关系排列。',
 law:'按照教材的三视图排布，俯视图在主视图下方，左视图在主视图右方。',
 steps:['确认正面 V、水平 H、侧面 W。','按规定的投影方向得到对应视图。','展开投影面，将三视图按固定关系排列并复核。'],
 understanding:'三幅视图描述同一物体，不是彼此独立的三个图案。',
 mistake:'把左右视图随意交换，或混用第一角与第三角的摆放位置。',
 terms:['主视图','俯视图','左视图','三投影面'],visualMode:'prism'});
teach('ch02-s02','three-equalities','三视图对应：长对正、高平齐、宽相等',30,32,{
 summary:'三视图投影方向不同，但源于同一空间形体，因此三个尺寸方向可以跨视图对应。',
 law:'主、俯长对正；主、左高平齐；俯、左宽相等。',
 steps:['在主视图与俯视图之间核对横向对应。','在主视图与左视图之间核对高度。','利用投影面展开的深度转移关系核对俯视和左视的宽。'],
 understanding:'每条尺寸对应都来自共享的一个空间方向；已知的一个投影方向不能提供全部三个坐标。',
 mistake:'只看两幅图轮廓是否相似，不检查相应点与相应长度。',
 terms:['三等规律','长对正','高平齐','宽相等','投影联系线'],visualMode:'point'});
teach('ch02-s03','point-projection','点的三面投影与同名投影',33,34,{
 summary:'从空间同一点在 V、H、W 三个基本投影面上的位置关系，理解同名投影及其对应联系线。',
 law:'正面投影保留横向和高度；水平投影保留横向与深度；侧面投影保留深度和高度。',
 steps:['辨认点的哪个投影已知及所在投影面。','作同名点的投影联系关系，统一横向或高度。','利用另一投影所给的坐标补全其余信息。'],
 understanding:'不是画纸上任意两个标记就代表空间的同一个点；同名关系是独立的约束前提。',
 mistake:'看见纸面交叉线便任意将交点认定为已知点的第三投影。',
 terms:['同名投影','点的三面投影','投影坐标'],visualMode:'point'});
teach('ch02-s03','point-coordinates','两面已知投影求第三面投影',34,35,{
 summary:'教材点的投影示例利用投影轴与坐标联系确定第三投影；需要判断已知的横向、深度、高度信息。',
 law:'当两幅已知投影属于同一空间点、对应关系一致时，两面投影通常可以确定该点的三维坐标。',
 steps:['按题意识别两幅已知视图中的同名点。','从已知正面投影作等高联系，再从水平投影转移深度。','交会确定第三投影后复核三等规律。'],
 understanding:'这只是单个空间点的三维约束解释；平面、实体的可见性和完整轮廓还需另外核实。',
 mistake:'只画等高线、不转移深度，就随机确定侧面点的位置。',
 terms:['第三投影','投影轴','45°转移','自由度'],visualMode:'point'});
teach('ch02-s03','relative-points','两点相对位置、重影点与可见性',35,36,{
 summary:'比较空间两点左右、前后和上下的相对关系，并通过其他投影理解同一视图中可能发生的重影。',
 law:'一幅投影中的两点重合不必然表示空间两点同一，需查看沿观察方向的差异。',
 steps:['先确认两点各自的同名投影。','比较相应方向的坐标关系。','遇到重影时再用另一投影及题目可见性条件判断位置。'],
 understanding:'重影是观察方向的坐标被压缩，不能仅凭一个重合投影恢复所有空间信息。',
 mistake:'把视图中重合的点直接认定为空间同一个点。',
 terms:['重影点','相对位置','可见性'],visualMode:'point'});
teach('ch02-s04','line-two-points','直线的投影与两个端点',37,38,{
 summary:'以直线两个空间端点的投影对应来建立三面投影，区分直线相对投影面的几何方位。',
 law:'连接同一投影面上的同名端点才得到该直线的相应投影。',
 steps:['检查两个空间端点 A、B 的投影。','在每个投影面连接同名端点。','对比其缩短、平行及积聚等投影特性。'],
 understanding:'两个不同空间点决定一条直线，但这不意味着任何一幅投影都反映直线实长。',
 mistake:'连接来自不同投影面的端点，或把投影线段误认为真实空间长度。',
 terms:['直线投影','同名端点','投影特性'],visualMode:'line'});
teach('ch02-s04','line-position','特殊位置直线和一般位置直线',38,39,{
 summary:'教材将直线按其对三个投影面的相对位置区分；特定平行或垂直关系对应特殊的投影现象。',
 law:'平行于某投影面的直线可在该面反映长度；垂直于某投影面的直线可在该面投影积聚。',
 steps:['判断空间直线是否平行或垂直于某基本投影面。','核对相应投影的平行、实长或积聚现象。','排除特殊位置后再考虑一般位置直线。'],
 understanding:'实长和积聚是具体的空间方位条件带来的性质，不是视觉画法。',
 mistake:'一条投影恰好水平便断言空间直线必然水平。',
 terms:['投影面平行线','投影面垂直线','一般位置直线','实长','积聚'],visualMode:'line'});
teach('ch02-s04','point-on-line','直线上的点与投影从属',39,40,{
 summary:'已知空间点属于某直线时，各面投影应与该直线的同名投影满足从属及对应关系。',
 law:'点在线上时，点的同名投影必须位于对应直线投影上，且投影联系关系成立。',
 steps:['确定原题给出的直线端点。','沿同名投影建立点线从属条件。','由另一投影检查位置与是否在线段允许范围内。'],
 understanding:'从属关系增加了约束，但不能跳过多视图对应检查。',
 mistake:'只要点位于某条纸面线段上，就推定它一定属于空间直线。',
 terms:['点线从属','直线上点'],visualMode:'line'});
teach('ch02-s05','plane-definition','平面的表示方法与空间确定性',41,42,{
 summary:'理解教材以几何点、线和多边形等表示平面，以及确定一张空间平面需要的独立条件。',
 law:'三个不共线的空间点可以唯一确定平面；不满足独立性时不能唯一确定。',
 steps:['判断题图中的表示元素属于点、相交线还是多边形。','检查空间点或直线是否提供足够的独立几何约束。','建立这些元素在各投影面中的同名关系。'],
 understanding:'画纸上的二维多边形不是脱离空间投影关系的独立平面。',
 mistake:'把三个共线点作为能确定唯一平面的完整条件。',
 terms:['平面表示','三点不共线','共面'],visualMode:'plane'});
teach('ch02-s05','plane-special','平面相对投影面的特殊位置',42,44,{
 summary:'依据平面与基本投影面的平行或垂直关系理解实形投影和积聚投影。',
 law:'平面平行某基本投影面时，该面投影可反映实形；垂直某基本投影面时，在该面可表现为积聚线。',
 steps:['先分析平面对三个投影面的方向关系。','检查哪一个投影保留实形，哪一个可能积聚。','再求各边及各顶点的同名投影。'],
 understanding:'“看起来像一条线”还不能证明空间平面满足特殊位置条件。',
 mistake:'拿一般倾斜平面的某视图直接测量真实面积或真角。',
 terms:['投影面平行面','投影面垂直面','一般位置平面','积聚'],visualMode:'plane'});
teach('ch02-s05','point-on-plane','平面内直线及平面内取点',44,46,{
 summary:'对一般位置平面上的给定点，教材通过构造合法的平面内辅助线来建立其他视图的投影。',
 law:'辅助线必须确实属于空间平面，其已知端点与投影也必须满足从属关系。',
 steps:['先确认已知平面的真实几何元素。','用面内两个有效点或已知面内方向构造辅助线。','利用辅助线同名投影和点的联系线求取其余投影。'],
 understanding:'引入辅助线能让“点在平面上”的复杂空间约束转为点在一条确定直线上的约束。',
 mistake:'在三角形的二维投影内部随便画线，直接称其为空间面内线。',
 terms:['面内点','面内直线','辅助线法'],visualMode:'plane'});
teach('ch02-s06','polyhedra','平面立体及表面取点',47,49,{
 summary:'棱柱、棱锥等平面立体由有限的平面面片围成；其视图须同时满足顶点、棱线和面片关系。',
 law:'立体表面点不仅需要属于相应空间平面，还需处在对应的实际面片范围内。',
 steps:['识别棱柱或棱锥及其底面、侧面。','先确定面片顶点和棱线的对应投影。','对面上给定点借助积聚性或合法面内直线建立未知投影。'],
 understanding:'多个图形线段即使在一个视图重合，也可能属于空间中不同的棱线。',
 mistake:'忽略点的具体表面归属，只沿一条随意的投影线求点。',
 terms:['棱柱','棱锥','棱台','平面立体'],visualMode:'pyramid'});
teach('ch02-s06','cylinder','圆柱的投影与表面点',49,50,{
 summary:'圆柱由连续曲面构成；结合轴线方向判断哪个视图反映圆形底面、哪些视图显示轮廓母线。',
 law:'侧面点的投影应符合圆柱底圆和母线方向，不能离开柱面任意取点。',
 steps:['确定圆柱轴线和底圆投影。','按观察方向确认轮廓及可见性。','利用圆周积聚和母线关系定位表面点其他投影。'],
 understanding:'轴向观察时圆周投影提供了环向位置约束，已知高度提供纵向位置约束。',
 mistake:'把圆柱内部随意选取的母线当成外轮廓可见实线，而没有按实际观察方向核对轮廓位置和遮挡关系。',
 terms:['圆柱','母线','表面取点'],visualMode:'cylinder'});
teach('ch02-s06','cone','圆锥的投影、素线与辅助圆',50,51,{
 summary:'圆锥表面点可以依题意借助经过锥顶的合法素线，或借助与底面平行的辅助截圆求取未知投影。',
 law:'辅助素线与辅助圆都必须确实属于相应圆锥曲面，且半径、交点及可见性条件一致。',
 steps:['先确定圆锥的锥顶、轴线和底圆。','根据点的已知投影选择素线或定高辅助圆。','求交并与其他视图核对，同时区分前后候选点。'],
 understanding:'辅助线把表面点可能的位置缩小到可检查的曲线；额外视图关系决定最终位置。',
 mistake:'把任意画的连接线当成锥面素线，或让辅助圆半径与截面高度不一致。',
 terms:['圆锥','素线法','辅助圆法'],visualMode:'cone'});
teach('ch02-s06','sphere','圆球的投影与球面取点',52,53,{
 summary:'球面在基本投影面中的外轮廓通常呈圆形；球面点可通过与某投影面平行的辅助截圆作投影分析。',
 law:'球面不同高度对应的截圆半径可能不同，两个对称候选点需依据题意与可见性区别。',
 steps:['确认球的中心和半径。','选定经过所求点的辅助截平面。','由截圆与投影联系线确定候选点，结合其他条件判断唯一性。'],
 understanding:'球面可能把不同的空间点投射到同一条视图关系上，需足够的独立信息消除歧义。',
 mistake:'在任何高度都画和球最大轮廓相同半径的辅助圆。',
 terms:['圆球','球面','截圆','球面点'],visualMode:'sphere'});
// Rebuild the reading order around the book, not around legacy card insertion order.
const order=new Map(sections.map((s,i)=>[s.id,i]));
entries.sort((a,b)=>order.get(a.section)-order.get(b.section)||
 (a.contentStatus==='toc-only'?-1:b.contentStatus==='toc-only'?1:0));
function get(id){return entries.find(e=>e.id===id)||null}
function find(query='',chapter='all'){
 const q=String(query).trim().toLowerCase();
 return entries.filter(x=>(chapter==='all'||x.chapter===chapter)&&
  (!q||[x.title,x.summary,x.sectionNumber,x.chapter,x.law,...x.terms,String(x.pages.join('-'))].join(' ').toLowerCase().includes(q)));
}
return {chapters,sections,entries,get,find,source:{
 name:edition,edition:'第3版',publisher:'机械工业出版社',
 pdfPages:292,printedStart:1,printedEnd:284,pdfOffset:6,tableOfContentsPdfPage:6,
 privacy:'教材 PDF / 原书图 / 版权受保护的内容不包含于公开仓库',
 status:'12章/附录已按目录建索引；第二章选定知识点已逐页复核并原创讲解；其他章节待进一步逐页建设。'
}};
});
