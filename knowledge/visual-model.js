/* 图学课堂原创几何演示。严格使用第一角法（V左上、H左下、W右上）。
 * 示例形体和真实教材原题完全隔离，不向教材习题注入待求答案线。
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.KnowledgeVisual=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const point=(x,y,z)=>({x,y,z});
const basePoints={A:point(20,18,42),B:point(53,43,14),C:point(16,49,19)};
const modes={
 point:{name:'点 A 的三面投影',points:{A:basePoints.A},edges:[]},
 line:{name:'空间线段 AB 的三面投影',points:{A:basePoints.A,B:basePoints.B},edges:[['A','B']]},
 plane:{name:'空间三角面 ABC 的三面投影',points:basePoints,edges:[['A','B'],['B','C'],['C','A']]},
 prism:{name:'三棱柱的三面投影',points:{A:point(17,14,12),B:point(51,14,12),C:point(30,48,12),D:point(17,14,52),E:point(51,14,52),F:point(30,48,52)},edges:[['A','B'],['B','C'],['C','A'],['D','E'],['E','F'],['F','D'],['A','D'],['B','E'],['C','F']]},
 pyramid:{name:'三棱锥的三面投影',points:{A:point(13,17,10),B:point(53,15,10),C:point(31,53,10),S:point(32,29,55)},edges:[['A','B'],['B','C'],['C','A'],['A','S'],['B','S'],['C','S']]},
 cylinder:{name:'直立圆柱的三面投影',points:{A:point(41,30+11*Math.sqrt(3),40)},edges:[],solid:'cylinder'},
 cone:{name:'直圆锥的三面投影',points:{A:point(30+22*23/47*0.5,30+22*23/47*Math.sqrt(3)/2,33),S:point(30,30,56)},edges:[],solid:'cone'},
 sphere:{name:'圆球的三面投影',points:{A:point(42,30,30+Math.sqrt(340))},edges:[],solid:'sphere'}
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
const origin={x:475,y:325},scale=4;
const defs={
 V:{label:'正视图 · V',u:'x',v:'z',rect:[145,60,305,250]},
 H:{label:'俯视图 · H',u:'x',v:'y',rect:[145,340,305,250]},
 W:{label:'左视图 · W',u:'y',v:'z',rect:[500,60,325,250]}
};
function projection(pt,view){
 if(!defs[view])throw Error('未知投影面');
 const x=origin.x,y=origin.y;
 if(view==='V')return [x-pt.x*scale,y-pt.z*scale];
 if(view==='H')return [x-pt.x*scale,y+pt.y*scale];
 return [x+pt.y*scale,y-pt.z*scale];
}
function stages(){return [
 {title:'① 建立三投影面与投影轴',why:'第一角画法：正视图位于左上，俯视图位于正视图正下方，左视图位于正视图右侧。三幅图共用三维尺寸。'},
 {title:'② 先确定正视图',why:'V 面投影锁定 x、z，不能单独求 y（深度）；对示例代表点，剩余 1 个自由度。'},
 {title:'③ 用俯视图补充深度',why:'H 面投影包含 x、y，长对正传递同一个 x。结合正视图的 z，示例代表点的空间位置才唯一。'},
 {title:'④ 从俯视图用 45° 线转移宽度',why:'第一角画法中，V 与 W 高平齐；H 的深度经右下角 45° 转移后和 W 宽相等。第三投影用于复核而不是再次决定已知坐标；橙色线仅是教学辅助线。'}
]}
function constraints(model,stage){
 const q=model.points[Object.keys(model.points)[0]],out=[];
 if(stage>=1)out.push({type:'projection',plane:'V',value:[q.x,q.z]});
 if(stage>=2)out.push({type:'projection',plane:'H',value:[q.x,q.y]});
 if(stage>=3)out.push({type:'projection',plane:'W',value:[q.y,q.z]});
 return out;
}
function analyze(engine,id,chapter,stage){
 const model=modes[modeFor(id,chapter)],result=engine.analyze(constraints(model,stage));
 return {mode:modeFor(id,chapter),degree:result.result.degrees,rank:result.result.rank,steps:result.steps,summary:engine.describe(result.result),scope:'仅分析这个原创模型中的一个代表点，线性约束的秩不等于整个立体或真实教材习题的全部自由度。'};
}
function line(shapes,view,a,b,kind='line',label=''){shapes.push({kind,view,xy:[...a,...b],label})}
function ring(shapes,view,center,r,kind='circle',label=''){shapes.push({kind,view,cx:center[0],cy:center[1],r,label})}
function solidShapes(shapes,model,mode,view,stage,id){
 const center=point(30,30,30),pt=model.points.A,upper=56,lower=9;
 const c=projection(center,view),radius=22*scale;
 if(mode==='sphere')ring(shapes,view,c,radius);
 else if(view==='H')ring(shapes,view,c,radius);
 else{
  const top=projection(point(30,30,upper),view),bottom=projection(point(30,30,lower),view);
  if(mode==='cylinder'){
   const dx=radius;
   line(shapes,view,[top[0]-dx,top[1]],[top[0]+dx,top[1]]);
   line(shapes,view,[bottom[0]-dx,bottom[1]],[bottom[0]+dx,bottom[1]]);
   line(shapes,view,[top[0]-dx,top[1]],[bottom[0]-dx,bottom[1]]);
   line(shapes,view,[top[0]+dx,top[1]],[bottom[0]+dx,bottom[1]]);
  }else{
   line(shapes,view,top,[bottom[0]-radius,bottom[1]]);
   line(shapes,view,top,[bottom[0]+radius,bottom[1]]);
   line(shapes,view,[bottom[0]-radius,bottom[1]],[bottom[0]+radius,bottom[1]]);
  }
 }
 if(stage<3)return;
 const xy=projection(pt,view);
 if(mode==='cylinder'){
  if(view!=='H')line(shapes,view,projection(point(pt.x,pt.y,upper),view),projection(point(pt.x,pt.y,lower),view),'construction','过 A 的柱面母线');
 }else if(mode==='cone'){
  const apex=model.points.S,ratio=(upper-lower)/(upper-pt.z);
  const base=point(30+(pt.x-30)*ratio,30+(pt.y-30)*ratio,lower);
  line(shapes,view,projection(apex,view),projection(base,view),'construction','经过圆锥锥顶和 A 的母线');
  if(id==='cone-circle'){
   const r=22*(upper-pt.z)/(upper-lower);
   if(view==='H')ring(shapes,view,projection(point(30,30,0),'H'),r*scale,'aux-circle','平行底面的辅助截圆');
   else{
    const at=projection(point(30,30,pt.z),view);
    line(shapes,view,[at[0]-r*scale,at[1]],[at[0]+r*scale,at[1]],'construction','等高截线');
   }
  }
 }else if(mode==='sphere'){
  const r=Math.sqrt(Math.max(0,22*22-(pt.z-30)*(pt.z-30)));
  if(view==='H')ring(shapes,view,projection(point(30,30,0),'H'),r*scale,'aux-circle','球面等高截圆');
  else{
   const at=projection(point(30,30,pt.z),view);
   line(shapes,view,[at[0]-r*scale,at[1]],[at[0]+r*scale,at[1]],'construction','截平面投影');
  }
 }
 shapes.push({kind:'point',view,name:'A',xy});
}
function correspondence(model,stage,shapes){
 const p=model.points[Object.keys(model.points)[0]],v=projection(p,'V'),h=projection(p,'H'),w=projection(p,'W');
 if(stage>=2)line(shapes,'VH',v,h,'guide','长对正：同 x');
 if(stage>=3){
  const mirror=[origin.x+(h[1]-origin.y),h[1]];
  line(shapes,'VW',v,w,'guide','高平齐：同 z');
  line(shapes,'HW',h,mirror,'guide','深度水平转移至 45° 线');
  line(shapes,'HW',mirror,w,'guide','宽相等：同 y');
 }
}
function svgShapes(id,chapter,stage){
 if(!Number.isInteger(stage)||stage<0||stage>3)throw Error('无效的步骤序号');
 const mode=modeFor(id,chapter),model=modes[mode],shapes=[];
 for(const view of ['V','H','W']){
  const def=defs[view],active=view==='V'?stage>=1:view==='H'?stage>=2:stage>=3;
  shapes.push({kind:'panel',view,rect:def.rect,label:def.label,active});
 }
 line(shapes,'axis',[100,origin.y],[890,origin.y],'axis','X / Yw');
 line(shapes,'axis',[origin.x,48],[origin.x,607],'axis','Z / Yh');
 if(stage>=3)line(shapes,'axis',[origin.x,origin.y],[origin.x+240,origin.y+240],'transfer45','45° 深度转移');
 for(const view of ['V','H','W']){
  const visible=view==='V'?stage>=1:view==='H'?stage>=2:stage>=3;
  if(!visible)continue;
  if(model.solid)solidShapes(shapes,model,mode,view,stage,id);
  else{
   for(const [a,b] of model.edges)line(shapes,view,projection(model.points[a],view),projection(model.points[b],view));
   for(const [name,pt] of Object.entries(model.points))shapes.push({kind:'point',view,name,xy:projection(pt,view)});
  }
 }
 correspondence(model,stage,shapes);
 return {name:model.name,stage,shapes,origin:{...origin},scale,scope:'原创建模坐标，仅用于学习第一角三视图。所有辅助线与教材原题答案图层隔离。'};
}
return {origin,scale,defs,modeFor,projection,stages,constraints,analyze,svgShapes,modes};
});