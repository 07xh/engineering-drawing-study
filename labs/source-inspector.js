/* 扫描题已知图线的逐项检查工具。只高亮仓库已录入的几何，不修改图形、不生成解答。 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.ChapterSourceInspector=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const kinds={
  given:{label:'已录入轮廓线',reason:'这是当前扫描描绘数据中的已知轮廓。需要对照教材核实端点、位置、虚实及与其他视图的对应；不能仅凭它推出缺失的答案线。'},
  axis:{label:'已录入轴线',reason:'轴线用于识别对称、圆心或投影基准，其位置属于当前数字描绘数据；尚需对照原图验证。'},
  transfer:{label:'已录入转移参考线',reason:'这条参考线可能用于在俯视与侧视之间转移深度，但只有原图中的方向、比例与对应点得到核实才能用它定位未知投影。'},
  thin:{label:'已录入细线',reason:'这条细线的确切用途可能是投影联系线或其他辅助条件，扫描标记未全部核对前不能当作已验算的解题线。'},
  circle:{label:'已录入圆形轮廓',reason:'圆形轮廓来自当前数字描绘数据。需要确认是否为完整圆、轮廓线还是局部圆弧，不能自动生成缺失部分。'},
  dot:{label:'已录入点位',reason:'该点的二维显示坐标只是描绘画布位置；点名、所属视图和空间对应关系仍以原题为准。'},
  label:{label:'已录入文字标注',reason:'这是已有图面标签，标签文字不能单独证明空间点坐标或对应的投影点存在。'}
 };
 const numeric=a=>a.every(n=>typeof n==='number'&&Number.isFinite(n));
 const within=(n,max)=>n>=0&&n<=max;
 function collect(source){
  if(!source||source.status!=='partial'&&source.status!=='verified-complete')return [];
  const out=[];
  for(const [index,a] of (source.lines||[]).entries()){
   if(!Array.isArray(a)||a.length<5||!numeric(a.slice(0,4))||!a.slice(0,4).every((n,i)=>within(n,i%2?520:960)))continue;
   const kind=kinds[a[4]]?a[4]:'thin',dx=a[2]-a[0],dy=a[3]-a[1];
   const orientation=Math.abs(dx)<2?'近似竖直':Math.abs(dy)<2?'近似水平':'倾斜';
   out.push({kind,index,geometry:a.slice(0,4),description:orientation+' · 已录入线段 '+(index+1)});
  }
  for(const [index,a] of (source.circles||[]).entries())if(Array.isArray(a)&&a.length>=3&&numeric(a.slice(0,3))&&a[2]>0&&a[2]<=520)out.push({kind:'circle',index,geometry:a.slice(0,3),description:'圆形轮廓 '+(index+1)});
  for(const [index,a] of (source.dots||[]).entries())if(Array.isArray(a)&&a.length>=2&&numeric(a.slice(0,2))&&within(a[0],960)&&within(a[1],520))out.push({kind:'dot',index,geometry:a.slice(0,2),description:'已录入点位 '+(index+1)});
  for(const [index,a] of (source.labels||[]).entries())if(Array.isArray(a)&&a.length>=3&&numeric(a.slice(0,2))&&within(a[0],960)&&within(a[1],520))out.push({kind:'label',index,geometry:a.slice(0,2),description:'图面标注 '+String(a[2]).slice(0,30)});
  return out;
 }
 function summary(source){
  const items=collect(source),count={};
  for(const item of items)count[item.kind]=(count[item.kind]||0)+1;
  return {total:items.length,count,complete:source?.status==='verified-complete'};
 }
 function explain(item,source){
  if(!item||!kinds[item.kind])return '';
  return kinds[item.kind].label+'：'+item.description+'。'+kinds[item.kind].reason+
   (source?.status==='verified-complete'?' 图形登记已标记为完整，但仍需核对该题的逐步解题证明。':' 当前原图为部分复刻，不得将本高亮当作原题答案或毫米测量。');
 }
 return {kinds,collect,summary,explain};
});