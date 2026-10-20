/* 原创教学几何模型：与教材原题、标准答案分离。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.KnowledgeVisual=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const point=(x,y,z)=>({x,y,z});
const p={A:point(20,18,42),B:point(53,43,14),C:point(16,49,19)};
const modes={
 point:{name:'点 A 的三面投影',points:{A:p.A},edges:[]},
 line:{name:'空间线段 AB 的三面投影',points:{A:p.A,B:p.B},edges:[['A','B']]},
 plane:{name:'空间三角面 ABC 的三面投影',points:p,edges:[['A','B'],['B','C'],['C','A']]},
 prism:{name:'三棱柱的三面投影',points:{A:point(17,14,12),B:point(51,14,12),C:point(30,48,12),D:point(17,14,52),E:point(51,14,52),F:point(30,48,52)},edges:[['A','B'],['B','C'],['C','A'],['D','E'],['E','F'],['F','D'],['A','D'],['B','E'],['C','F']]},
 pyramid:{name:'三棱锥的三面投影',points:{A:point(13,17,10),B:point(53,15,10),C:point(31,53,10),S:point(32,29,55)},edges:[['A','B'],['B','C'],['C','A'],['A','S'],['B','S'],['C','S']]},
 cylinder:{name:'直立圆柱的三面投影',points:{A:point(49,30,40)},edges:[],solid:'cylinder'},
 cone:{name:'直圆锥的三面投影',points:{A:point(41,30,33),S:point(30,30,56)},edges:[],solid:'cone'},
 sphere:{name:'圆球的三面投影',points:{A:point(42,30,42)},edges:[],solid:'sphere'}
};
function modeFor(id,chapter){
 if(['cone-views','cone-generator','cone-circle'].includes(id))return 'cone';
 if(['sphere-views','sphere-point'].includes(id))return 'sphere';
 if(['cylinder-views','cylinder-point'].includes(id))return 'cylinder';
 if(id.includes('pyramid')||id.includes('frustum'))return 'pyramid';
 if(id.includes('prism'))return 'prism';
 if(chapter==='curved')return 'cylinder';
 if(chapter==='polyhedra')return 'prism';
 if(chapter==='plane')return 'plane';
 if(chapter==='line')return 'line';
 return 'point';
}
const defs={V:{label:'正面 V',u:'x',v:'z',ox:48,oy:270},H:{label:'水平 H',u:'x',v:'y',ox:370,oy:270},W:{label:'侧面 W',u:'y',v:'z',ox:692,oy:270}};
function projection(pt,view){const d=defs[view];return [d.ox+pt[d.u]*3.1,d.oy-pt[d.v]*3.1]}
function stages(){return [
 {title:'① 先辨认形体与投影面',why:'先分清正面 V、水平 H、侧面 W；灰色线为本演示辅助坐标，不是教材原图。'},
 {title:'② 出现正面投影',why:'正面投影表示 x 与 z。一个孤立空间点仍缺少 y 坐标。'},
 {title:'③ 添加水平投影与联系关系',why:'水平投影表示 x 与 y；与正面投影的 x 坐标一致。对应可靠时三坐标可确定。'},
 {title:'④ 添加侧面投影并核对',why:'侧面投影表示 y 与 z；核对高平齐、宽相等。第三面一致信息一般不额外减少点的自由度。'}
]}
function constraints(model,stage){
 const q=model.points[Object.keys(model.points)[0]];
 const arr=[];
 if(stage>=1)arr.push({type:'projection',plane:'V',value:[q.x,q.z]});
 if(stage>=2)arr.push({type:'projection',plane:'H',value:[q.x,q.y]});
 if(stage>=3)arr.push({type:'projection',plane:'W',value:[q.y,q.z]});
 return arr;
}
function analyze(engine,id,chapter,stage){
 const model=modes[modeFor(id,chapter)];
 const result=engine.analyze(constraints(model,stage));
 return {mode:modeFor(id,chapter),degree:result.result.degrees,rank:result.result.rank,steps:result.steps,summary:engine.describe(result.result),scope:'仅分析示例形体的一个代表点；不代表全部棱、面、曲面或教材原题的自由度。'};
}
function svgShapes(id,chapter,stage){
 const mode=modeFor(id,chapter),model=modes[mode],shapes=[];
 for(const view of ['V','H','W']){
  const def=defs[view],active=(view==='V'?stage>=1:view==='H'?stage>=2:stage>=3);
  shapes.push({kind:'panel',view,rect:[def.ox-20,33,260,270],label:def.label,active});
  if(!active)continue;
  if(model.solid){
   const cx=def.ox+30*3.1,cy=def.oy-30*3.1,r=22*3.1,hi=def.oy-55*3.1,lo=def.oy-9*3.1;
   if(mode==='sphere'){shapes.push({kind:'circle',view,cx,cy,r})}
   else if(view==='H'){shapes.push({kind:'circle',view,cx,cy,r})}
   else if(mode==='cylinder'){
    for(const segment of [[cx-r,hi,cx-r,lo],[cx+r,hi,cx+r,lo],[cx-r,hi,cx+r,hi],[cx-r,lo,cx+r,lo]])shapes.push({kind:'line',view,xy:segment});
   }else{
    for(const segment of [[cx,hi,cx-r,lo],[cx,hi,cx+r,lo],[cx-r,lo,cx+r,lo]])shapes.push({kind:'line',view,xy:segment});
   }
  }else{
   for(const [a,b] of model.edges)shapes.push({kind:'line',view,xy:[...projection(model.points[a],view),...projection(model.points[b],view)]});
   for(const [name,pt] of Object.entries(model.points))shapes.push({kind:'point',view,name,xy:projection(pt,view)});
  }
 }
 if(stage>=2){const q=model.points[Object.keys(model.points)[0]],v=projection(q,'V'),h=projection(q,'H');shapes.push({kind:'guide',xy:[v[0],v[1],v[0],h[1]],text:'V/H 同 x'})}
 if(stage>=3){const q=model.points[Object.keys(model.points)[0]],v=projection(q,'V'),w=projection(q,'W');shapes.push({kind:'guide',xy:[w[0],v[1],w[0],w[1]],text:'V/W 同 z（示意）'})}
 return {name:model.name,stage,shapes,scope:'全部坐标与形体为原创教学数据；本动画不显示任何教材待求答案线。'};
}
return {modeFor,projection,stages,constraints,analyze,svgShapes,modes};
});
