/* Bridges existing page-reviewed example geometry to the shared action player.
 * Original verified example UI stays authoritative; no fabricated source art.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TextbookActionAdapter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function key(s){return JSON.stringify(s)}
function geometryKey(s){return s.type==='line'?key([s.type,s.a,s.b]):key([s.type,s.p])}
function convert(shape){
 if(shape.type==='line')return {kind:'line',style:shape.style||'given',geometry:{x1:shape.a.x,y1:shape.a.y,x2:shape.b.x,y2:shape.b.y}};
 if(shape.type==='point')return {kind:'point',style:shape.style||'given',label:shape.label||'',geometry:{x:shape.p.x,y:shape.p.y}};
 throw Error('尚不支持的教材图形类型');
}
function adapt(example,geometry){
 if(!example||example.sourceStatus!=='page-figure-reviewed')throw Error('教材来源未核验');
 if(!geometry||typeof geometry.frame!=='function')throw Error('缺少已核验例题几何数据');
 const steps=[],seen=new Set();
 for(let i=0;i<example.order.length;i++){
  const frame=geometry.frame(example.id,i),actions=[];
  for(const shape of frame.shapes){
   const fingerprint=geometryKey(shape);
   if(seen.has(fingerprint))continue;
   seen.add(fingerprint);actions.push(convert(shape));
  }
  const step={id:'step-'+(i+1),explanation:example.order[i],actions};
  if(example.id==='example-2-2'){
   // Only the normalized drawing's W-view target is solved here; not the book's pixel coordinates.
   const points=frame.proof&&frame.proof.points;
   if(!points)throw Error('缺少已核验的例2-2示意投影坐标');
   const conditions=[];
   if(i>=1)conditions.push({type:'coordinate',axis:'y',value:points.aPrime.y});
   if(i>=3)conditions.push({type:'coordinate',axis:'x',value:points.aDouble.x});
   step.constraintAnalysis={scope:'point-2d-linear',conditions};
  }
  steps.push(step);
 }
 return {id:example.id,title:example.title,type:'other',status:'steps-verified',
  source:{book:'工程制图与 AutoCAD 第3版',page:example.printedPage},
  givens:[example.known],steps,renderMode:'manual-steps'};
}
return {adapt};
});
