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
  if(example.id==='example-1-1'){
   // Analyze ONE target Q1 on AB, not all six interior points or the auxiliary ray.
   // The constructed target is supplied for residual evaluation, never revealed as an input drawing.
   const proof=frame.proof;
   if(!proof||!proof.A||!proof.B||!Array.isArray(proof.marks)||!Array.isArray(proof.points)
      ||proof.marks.length!==8||proof.points.length!==8||!proof.sevenSegments||!proof.sixParallelLines)
    throw Error('例1-1归一化等分几何未通过验证');
   const lineThrough=(p,d)=>({a:d.y,b:-d.x,offset:d.y*p.x-d.x*p.y});
   const baseDirection={x:proof.B.x-proof.A.x,y:proof.B.y-proof.A.y};
   const baseLine=lineThrough(proof.A,baseDirection);
   const end=proof.marks[7],transfer=proof.marks[1];
   const transferDirection={x:proof.B.x-end.x,y:proof.B.y-end.y};
   const parallelLine=lineThrough(transfer,transferDirection);
   const constraints=[{type:'on-line',point:'Q1',line:baseLine}];
   if(i>=3)constraints.push({type:'on-line',point:'Q1',line:parallelLine});
   step.localDofAnalysis={points:{Q1:{x:proof.points[1].x,y:proof.points[1].y}},constraints};
   const explanations=[
    ['线段 AB 是 Q1 所在的已知直线','题意要求内部等分点落在 AB 上，因此目标点受一条直线约束，只能沿 AB 移动。'],
    [null,'辅助射线和七段等距标记是构造比例关系的工具，此时还没有给目标点 Q1 增加新的定位直线。'],
    [null,'连接第七标记与 B，建立平行线的参考方向；目标点 Q1 尚未与 AB 以外的线求交。'],
    ['过第一个射线分点作与第七分点—B连线平行的直线','这条平行线与已知 AB 相交，两条方向不同的定位直线在归一化构型下确定 Q1。'],
    [null,'本步检查七个线段是否相等，不新增目标 Q1 的定位约束。']
   ];
   step.localDofExplanation={
    model:'例1-1单个内部等分点 Q1 的画纸位置',
    addedConstraint:explanations[i][0],reason:explanations[i][1],
    scope:'仅计算归一化示意中的 Q1，六个分点整体及可选辅助射线方向不在此局部自由度模型内。'
   };
  }
  if(example.id==='example-2-2'){
   // Only the normalized drawing's W-view target is solved here; not the book's pixel coordinates.
   const points=frame.proof&&frame.proof.points;
   if(!points)throw Error('缺少已核验的例2-2示意投影坐标');
   const conditions=[];
   if(i>=1)conditions.push({type:'coordinate',axis:'y',value:points.aPrime.y});
   if(i>=3)conditions.push({type:'coordinate',axis:'x',value:points.aDouble.x});
   step.constraintAnalysis={scope:'point-2d-linear',conditions};
   // Compute local DOF of the normalized W-view target only, not original book pixels.
   const target=points.aDouble;
   const localConstraints=[];
   if(i>=1)localConstraints.push({type:'fixed',point:'aDouble',axis:'y',value:points.aPrime.y});
   if(i>=3)localConstraints.push({type:'fixed',point:'aDouble',axis:'x',value:target.x});
   step.localDofAnalysis={points:{aDouble:{x:target.x,y:target.y}},constraints:localConstraints};
   step.localDofExplanation={
    model:'归一化示意图中的侧投影画纸位置',
    addedConstraint:i===1?'等高联系线：固定 a″ 的纵坐标':i===3?'深度定位线：固定 a″ 的横向位置':null,
    reason:i===1?'正面投影与侧面投影保持同一高度；这一步只限制纵坐标，横向位置仍未确定。':i===3?'H 面深度转移后给出侧投影的横向位置；与等高条件共同确定示意点。':i===0?'尚未添加定位约束，画纸上的横、纵坐标均未限定。':i===2?'本步继续绘制深度转移辅助线，但目标点约束集合未增加新的独立条件。':'目标点位置已由等高与深度两个条件确定；后续检查不应再减少自由度。',
    scope:'仅分析归一化画纸上的目标点，不表示空间点本身存在额外自由度。'
   };
  }
  steps.push(step);
 }
 return {id:example.id,title:example.title,type:'other',status:'steps-verified',
  source:{book:'工程制图与 AutoCAD 第3版',page:example.printedPage},
  givens:[example.known],steps,renderMode:'manual-steps'};
}
return {adapt};
});
