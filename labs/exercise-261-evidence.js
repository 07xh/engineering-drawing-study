/* 2-6-1 原图证据检查器
 * 只分析已在 verified-exercises.js 中登记的已知线；不构造新的点、线或答案。
 * 当前缺少标注为教材第15页的清晰原图。用户上传的 23 页 PDF 仅有印刷页 31—53 的理论内容。
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Exercise261Evidence=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EPS=1.5;
const close=(a,b)=>Math.abs(a-b)<=EPS;
const uniquePoints=points=>{
 const list=[];
 for(const p of points)if(!list.some(x=>close(x[0],p[0])&&close(x[1],p[1])))list.push([...p]);
 return list;
};
function scan(source){
 const valid=source&&source.status==='partial'&&Array.isArray(source.lines);
 if(!valid)return {id:'2-6-1',safe:false,reason:'题目状态不是已知的部分扫描资料',stages:[],facts:[],missing:[]};
 const lines=source.lines,byKind=kind=>lines.map((a,i)=>({a,i})).filter(o=>Array.isArray(o.a)&&o.a.length>=5&&o.a[4]===kind&&o.a.slice(0,4).every(Number.isFinite));
 const axes=byKind('axis'),transfers=byKind('transfer'),givens=byKind('given'),thins=byKind('thin');
 const horizontalAxis=axes.filter(({a})=>close(a[1],a[3])&&Math.abs(a[2]-a[0])>200);
 const verticalAxis=axes.filter(({a})=>close(a[0],a[2])&&Math.abs(a[3]-a[1])>150);
 if(horizontalAxis.length!==1||verticalAxis.length!==1)return {id:'2-6-1',safe:false,reason:'无法唯一辨认投影轴；暂停已知线逐帧核对',stages:[],facts:[],missing:[]};
 const yAxis=horizontalAxis[0].a[1],xAxis=verticalAxis[0].a[0];
 const upper=givens.filter(({a})=>a[1]<yAxis-EPS&&a[3]<yAxis-EPS);
 const lower=givens.filter(({a})=>a[1]>yAxis+EPS&&a[3]>yAxis+EPS);
 const top=upper.filter(({a})=>close(a[1],a[3])&&Math.abs(a[2]-a[0])>80);
 const hpts=uniquePoints(lower.flatMap(({a})=>[[a[0],a[1]],[a[2],a[3]]]));
 const hEdges=lower.filter(({a})=>hpts.length===3&&
    hpts.some(p=>close(p[0],a[0])&&close(p[1],a[1]))&&
    hpts.some(p=>close(p[0],a[2])&&close(p[1],a[3])));
 const twiceArea=hpts.length===3?Math.abs((hpts[1][0]-hpts[0][0])*(hpts[2][1]-hpts[0][1])-
       (hpts[2][0]-hpts[0][0])*(hpts[1][1]-hpts[0][1])):0;
 const vertical=thins.filter(({a})=>close(a[0],a[2])&&a[1]<yAxis&&a[3]>yAxis);
 const xValues=hpts.map(p=>p[0]);
 const correspondence=hpts.length===3&&top.length===1&&vertical.length>=3&&
  hpts.every(p=>vertical.some(({a})=>close(a[0],p[0])&&close(a[3],p[1])))&&
  hpts.every(p=>Math.min(top[0].a[0],top[0].a[2])-EPS<=p[0]&&p[0]<=Math.max(top[0].a[0],top[0].a[2])+EPS)&&
  new Set(xValues.map(x=>x.toFixed(2))).size===3;
 const angle45=transfers.filter(({a})=>Math.abs(Math.abs(a[2]-a[0])-Math.abs(a[3]-a[1]))<=EPS*4);
 const structureOk=top.length===1&&hEdges.length===3&&hpts.length===3&&twiceArea>EPS&&
    correspondence&&angle45.length===1;
 const stages=[
 {title:'先辨认投影轴',why:'现有描图记录了一条水平轴、竖直轴与一条约45°的转移参考线；这些仍需与教材原图核对。',indices:[...horizontalAxis,...verticalAxis,...angle45].map(o=>o.i)},
 {title:'识别上方已知投影',why:'当前数字描图中的上方线段为水平线。仅凭这一视图还不能确认空间三角面的全部位置及题上字母。',indices:top.map(o=>o.i)},
 {title:'检查下方三角形边',why:'已录入下方三条相连线段构成非退化三角形；它们在画布上是几何图形，但还不等于纸质原题已精确复刻。',indices:hEdges.map(o=>o.i)},
 {title:'核对同名投影的横向关系',why:'三条已录入竖直细线与下方三个顶点的横向坐标相合，符合长对正的形式条件；字母和空间点对应仍须查原书。',indices:vertical.map(o=>o.i)},
 {title:'仅整理待求方法，不画答案',why:'若原图确认上方三点等高且与下方三点对应，可进一步研究是否为水平面，再依高平齐、宽相等求第三投影。现在没有原图证据，不生成任何求作点或答案线。',indices:[]}
 ];
 const facts=[
 {label:'轴线关系',ok:horizontalAxis.length===1&&verticalAxis.length===1,detail:'已识别画布中的横向轴和竖向轴。'},
 {label:'下方三角形拓扑',ok:hEdges.length===3&&hpts.length===3&&twiceArea>EPS,detail:'三条已录入边首尾连接，围成非退化三角形（只检查数字描图）。'},
 {label:'上方水平投影线',ok:top.length===1,detail:'描图中上方有一条水平轮廓线。'},
 {label:'长对正形式检查',ok:correspondence,detail:'三条竖直投影联系线横向位置与下方三个顶点一致。'},
 {label:'45°转移参考线',ok:angle45.length===1,detail:'数字画布上的转移线斜率绝对值接近 1，不表示真实纸面比例已验证。'}
 ];
 const missing=[
 '需要教材原题标注的第15页完整清晰扫描；现有上传理论 PDF 从印刷页31开始，不包含该原题。',
 '确认 a、b、c（及其撇号）的真实字母与三视图归属，不能仅依 x 坐标猜配对。',
 '确认投影面位置、每条已知线的起止点、虚实线、重影点以及缺失的细微标注。',
 '确认是否存在角度、尺寸或题意附加限制；画布坐标不能当作毫米。',
 '在上述原图校对后独立证明求作步骤、判断空间平面类型，并核实每条答案线。'
 ];
 return {id:'2-6-1',safe:structureOk&&source.status==='partial',sourceStatus:source.status,
  originalVerified:false,solutionAllowed:false,sourceProvenance:'现有仓库部分数字化描图（来源标注为教材第15页）；当前上传PDF不含该页原题。',
  facts,missing,stages:structureOk?stages:[],reason:structureOk?'已建立现有描图内部拓扑和投影对应形式检查；尚未验证原题扫描。':'数字描图未通过内部形态一致性检查；请先修复数据，不执行高亮分析。',
  internal:{axisY:yAxis,axisX:xAxis,triangleVertices:hpts.length,twiceArea,projectorCount:vertical.length,validGeometry:structureOk},
  notice:'蓝色高亮仅复用原先已录入的线段，既不画未知的侧面投影，也不改变教材答案审核状态。'};
}
function highlight(source,report,step){
 if(!report||!report.safe||!Number.isInteger(step)||step<0||step>=report.stages.length)return [];
 const entries=report.stages[step].indices;
 return entries.map(i=>({index:i,segment:source.lines[i].slice(0,4),kind:source.lines[i][4]}));
}
return {scan,highlight};
});