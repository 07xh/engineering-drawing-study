/* 图学课堂：教材原题录入资料的机器结构检查。
 * 这里的检查不意味着对照过原始扫描、也不是几何解题证明；
 * 缺少原题完整图片、尺寸、点位、遮挡审核时，绝不放行答案层。
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChapterFidelityAudit=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const counts={'2-6':6,'2-7':6,'2-8':8,'2-9':8};
const ids=Object.entries(counts).flatMap(([section,n])=>Array.from({length:n},(_,i)=>section+'-'+(i+1)));
const number=x=>typeof x==='number'&&Number.isFinite(x);
const limits={x:960,y:520};
const pointInside=(x,y)=>number(x)&&number(y)&&x>=0&&x<=limits.x&&y>=0&&y<=limits.y;
const segmentValid=a=>Array.isArray(a)&&a.length>=5&&pointInside(a[0],a[1])&&pointInside(a[2],a[3]);
const circleValid=a=>Array.isArray(a)&&a.length>=3&&pointInside(a[0],a[1])&&number(a[2])&&a[2]>0&&a[2]<=260;
const pointValid=a=>Array.isArray(a)&&a.length>=2&&pointInside(a[0],a[1]);
const labelsValid=a=>pointValid(a)&&typeof a[2]==='string';
function inspection(id,source){
 const s=source&&typeof source==='object'?source:null;
 const findings=[],add=(code,severity,message)=>findings.push({code,severity,message});
 const lines=s&&Array.isArray(s.lines)?s.lines:[],circles=s&&Array.isArray(s.circles)?s.circles:[],dots=s&&Array.isArray(s.dots)?s.dots:[],labels=s&&Array.isArray(s.labels)?s.labels:[];
 if(!s){add('missing-source','blocker','仓库尚未录入这道题的原始已知图数据。')}
 else {
  if(s.status!=='verified-complete')add('partial-source','blocker','当前仅有部分已知图的数字化描绘，尚未完成与原题逐项比对。');
  if(!s.source||typeof s.source!=='string')add('missing-location','blocker','需要人工登记原图来源页及版次。');
  if(!s.sourceFingerprint)add('source-fingerprint','blocker','缺少可追溯的原图版本标识，不能将答案与当前原图绑定。');
  if(s.coordinateAudit!=='verified')add('coordinate-audit','blocker','原图毫米尺寸、字母与投影点的对应关系未完成复核。');
  if(s.visibilityAudit!=='verified')add('visibility-audit','blocker','可见性、虚实线与前后分支未完成复核。');
  if(s.solutionAudit!=='verified')add('proof-audit','blocker','独立几何作图及答案逐步复算尚未完成。');
  if(!lines.length&&!circles.length&&!dots.length)add('no-geometry','warning','当前还没有足够的线、圆或点记录可供核对。');
  const seen=new Set();
  for(const [i,a] of lines.entries()){
   if(!segmentValid(a)){add('invalid-line','warning','第 '+(i+1)+' 条线段含无效/越界坐标。');continue}
   if(Math.hypot(a[2]-a[0],a[3]-a[1])<0.01)add('zero-line','warning','第 '+(i+1)+' 条线段两个端点重合。');
   const p=[[a[0],a[1]],[a[2],a[3]]].sort((x,y)=>x[0]-y[0]||x[1]-y[1]);
   const key=JSON.stringify(p)+':'+String(a[4]);
   if(seen.has(key))add('duplicate-line','warning','第 '+(i+1)+' 条线段与已录入线段重复，请检查是否为重影或误录。');
   seen.add(key);
   if(a[4]==='axis'&&Math.abs(a[2]-a[0])>2&&Math.abs(a[3]-a[1])>2)add('sloping-axis','check','第 '+(i+1)+' 条标为投影轴的线段倾斜，请复核轴定义。');
   if(a[4]==='transfer'&&Math.abs(Math.abs(a[2]-a[0])-Math.abs(a[3]-a[1]))>6)add('transfer-angle','check','第 '+(i+1)+' 条转移参考线与 45° 显示比例不一致，需核对绘图坐标和实际扫描。');
  }
  for(const [i,a] of circles.entries())if(!circleValid(a))add('invalid-circle','warning','第 '+(i+1)+' 个圆的圆心或半径数值非法，尚不能显示为真实轮廓。');
  for(const [i,a] of dots.entries())if(!pointValid(a))add('invalid-dot','warning','第 '+(i+1)+' 个点的坐标非法。');
  for(const [i,a] of labels.entries())if(!labelsValid(a))add('invalid-label','warning','第 '+(i+1)+' 个文字标注非法。');
 }
 const blockers=findings.filter(x=>x.severity==='blocker');
 const displayElements={lines:lines.length,circles:circles.length,dots:dots.length,labels:labels.length};
 const procedural=[
 {key:'origin',label:'原题版次、图号与完整原图来源',done:false},
 {key:'givens',label:'原题所有已知线、圆、点及题意',done:false},
 {key:'dimensions',label:'尺寸、端点及对应投影坐标',done:false},
 {key:'occlusion',label:'可见性、虚线、前后位置',done:false},
 {key:'proof',label:'辅助线合法性与独立几何复算',done:false}
 ];
 return {id,sourceName:s&&s.source||'未提供',title:s&&s.title||'待核对原题',status:s&&s.status||'missing',description:s&&s.note||'尚未取得可核对的完整原始图。',displayElements,findings,blockers:blockers.length,procedural,
  visualAvailable:!!s&&(lines.some(segmentValid)||circles.some(circleValid)||dots.some(pointValid)),
  solutionAvailable:false,
  verdict:'只能检查现有数字化资料的结构，未能证明它与纸质教材完全一致。所有教材待求答案线仍锁定。'};
}
function scan(get){if(typeof get!=='function')throw Error('必须提供原题读取函数');return ids.map(id=>inspection(id,get(id)))}
function totals(rows){return {tasks:rows.length,partial:rows.filter(r=>r.status==='partial').length,missing:rows.filter(r=>r.status==='missing').length,blocked:rows.filter(r=>!r.solutionAvailable).length,displayable:rows.filter(r=>r.visualAvailable).length,
  rawObjects:rows.reduce((n,x)=>n+Object.values(x.displayElements).reduce((a,b)=>a+b,0),0),
  warnings:rows.reduce((n,x)=>n+x.findings.filter(f=>f.severity!=='blocker').length,0)}}
function nextActions(report){
 const acts=[];
 if(report.status==='missing')acts.push('先取得完整原题扫描，并确认题目页码与对应编号。');
 if(report.status==='partial')acts.push('先对照完整原图，逐项确认当前已录入点、线、圆及图面文字。');
 if(report.findings.some(f=>['transfer-angle','sloping-axis','invalid-line','invalid-circle','duplicate-line','zero-line'].includes(f.code)))acts.push('检查图形数据中机器标记的坐标或重复线；不能仅凭程序警告认定原书画错。');
 acts.push('确认原题尺寸和同名投影后，独立验算作图辅助线与可见性；全部完成前保留答案层锁定。');
 return acts;
}
return {ids,inspection,scan,totals,nextActions,limits};
});