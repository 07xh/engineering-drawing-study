/* 图学课堂自由创建模式：点与线段是用户输入的可编辑数据，
 * 不是教材题目，也不隐式加入长度、刚性或空间定位约束。
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./dof-lab-geometry.js'):root.DrawingLabGeometry);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DrawingFreeGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G){
'use strict';
const MAX_POINTS=80,MAX_EDGES=220,MAX_FACES=140,finite=n=>typeof n==='number'&&Number.isFinite(n);
const ID=/^\p{L}[\p{L}\p{N}_-]{0,15}$/u,clone=x=>JSON.parse(JSON.stringify(x));
function create(){return {version:1,revision:0,nextOrdinal:0,points:[],edges:[],faces:[]}}
function nameAt(n){const letter=String.fromCharCode(65+n%26);const suffix=Math.floor(n/26);return letter+(suffix?suffix:'')}
function checkPoint(point){
 if(!point||typeof point.id!=='string'||!ID.test(point.id)||['__proto__','constructor','prototype'].includes(point.id))throw Error('点名须以字母开头，最多16个字符');
 for(const axis of ['x','y','z'])if(!finite(point[axis])||Math.abs(point[axis])>10000)throw Error('空间坐标必须为有限数字且绝对值不超过10000');
}
function faceKey(ids){return [...ids].sort().join('\u0000')}
function edgeKey(a,b){return [a,b].sort().join('\u0000')}
function checkTriangle(face,byId){
 if(!Array.isArray(face)||face.length!==3||new Set(face).size!==3||face.some(id=>!byId.has(id)))throw Error('三角面必须包含三个不同的已有空间点');
 const [a,b,c]=face.map(id=>byId.get(id));
 const u=[b.x-a.x,b.y-a.y,b.z-a.z],v=[c.x-a.x,c.y-a.y,c.z-a.z];
 const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 const denominator=Math.hypot(...u)*Math.hypot(...v);
 if(!denominator||Math.hypot(...cross)/denominator<1e-7)throw Error('三个点共线或重合，无法建立有效三角面');
}
function validate(state){
 if(!state||state.version!==1||!Number.isInteger(state.revision)||state.revision<0||!Number.isInteger(state.nextOrdinal)||state.nextOrdinal<0
  ||!Array.isArray(state.points)||!Array.isArray(state.edges)||!Array.isArray(state.faces)||state.points.length>MAX_POINTS||state.edges.length>MAX_EDGES||state.faces.length>MAX_FACES)throw Error('自由绘图状态无效');
 const ids=new Set();
 for(const p of state.points){checkPoint(p);if(ids.has(p.id))throw Error('点名重复：'+p.id);ids.add(p.id)}
 const pairs=new Set();
 for(const e of state.edges){
  if(!e||typeof e.a!=='string'||typeof e.b!=='string'||!ids.has(e.a)||!ids.has(e.b)||e.a===e.b)throw Error('线段两端必须是不同的已有点');
  const key=edgeKey(e.a,e.b);
  if(pairs.has(key))throw Error('同一线段不能重复添加');
  pairs.add(key);
 }
 const faces=new Set(),byId=new Map(state.points.map(p=>[p.id,p]));
 for(const face of state.faces){
  checkTriangle(face,byId);
  const key=faceKey(face);
  if(faces.has(key))throw Error('重复的三角面');
  faces.add(key);
  for(let i=0;i<3;i++)if(!pairs.has(edgeKey(face[i],face[(i+1)%3])))throw Error('三角面的边界线段缺失');
 }
 return true;
}
function apply(state,action){
 validate(state);
 if(!action||typeof action.type!=='string')throw Error('绘图操作无效');
 const next=clone(state);
 if(action.type==='add-point'){
  if(next.points.length>=MAX_POINTS)throw Error('最多添加80个空间点');
  let id=action.id;
  if(id==null||id===''){
   do{id=nameAt(next.nextOrdinal++);}while(next.points.some(p=>p.id===id));
  }
  const point={id,x:action.x,y:action.y,z:action.z};checkPoint(point);
  if(next.points.some(p=>p.id===id))throw Error('点名已存在：'+id);
  next.points.push(point);
 }else if(action.type==='edit-point'){
  const old=next.points.find(p=>p.id===action.id);
  if(!old)throw Error('不存在要修改的点');
  const updated={id:action.newId??old.id,x:action.x,y:action.y,z:action.z};
  checkPoint(updated);
  if(updated.id!==old.id&&next.points.some(p=>p.id===updated.id))throw Error('点名已存在：'+updated.id);
  Object.assign(old,updated);
  if(updated.id!==action.id){
   for(const edge of next.edges){
    if(edge.a===action.id)edge.a=updated.id;
    if(edge.b===action.id)edge.b=updated.id;
   }
   for(const face of next.faces)for(let i=0;i<3;i++)if(face[i]===action.id)face[i]=updated.id;
  }
 }else if(action.type==='remove-point'){
  if(!next.points.some(p=>p.id===action.id))throw Error('不存在要删除的点');
  next.points=next.points.filter(p=>p.id!==action.id);
  next.edges=next.edges.filter(e=>e.a!==action.id&&e.b!==action.id);
  next.faces=next.faces.filter(face=>!face.includes(action.id));
 }else if(action.type==='add-edge'){
  if(next.edges.length>=MAX_EDGES)throw Error('最多添加220条线段');
  next.edges.push({a:action.a,b:action.b});
 }else if(action.type==='remove-edge'){
  const index=next.edges.findIndex(e=>(e.a===action.a&&e.b===action.b)||(e.a===action.b&&e.b===action.a));
  if(index<0)throw Error('不存在要删除的线段');
  next.edges.splice(index,1);
  next.faces=next.faces.filter(face=>!face.some((id,i)=>edgeKey(id,face[(i+1)%3])===edgeKey(action.a,action.b)));
 }else if(action.type==='add-face'){
  if(next.faces.length>=MAX_FACES)throw Error('最多添加140个三角面');
  const face=action.vertices;
  checkTriangle(face,new Map(next.points.map(p=>[p.id,p])));
  if(next.faces.some(f=>faceKey(f)===faceKey(face)))throw Error('重复的三角面');
  for(let i=0;i<3;i++){
   const a=face[i],b=face[(i+1)%3];
   if(!next.edges.some(e=>edgeKey(e.a,e.b)===edgeKey(a,b))){
    if(next.edges.length>=MAX_EDGES)throw Error('添加面所需线段超过上限');
    next.edges.push({a,b});
   }
  }
  next.faces.push([...face]);
 }else if(action.type==='remove-face'){
  const face=action.vertices;
  if(!Array.isArray(face)||face.length!==3)throw Error('三角面编号无效');
  const index=next.faces.findIndex(f=>faceKey(f)===faceKey(face));
  if(index<0)throw Error('不存在要删除的三角面');
  next.faces.splice(index,1);
 }else if(action.type==='clear'){
  next.points=[];next.edges=[];next.faces=[];next.nextOrdinal=0;
 }else throw Error('不支持的自由绘图操作');
 next.revision++;
 validate(next);
 return next;
}
function asModel(state){
 validate(state);
 return {
  id:'user-free-'+state.revision,
  name:'自定义空间点线三角面模型（非教材原题）',
  points:Object.fromEntries(state.points.map(p=>[p.id,{x:p.x,y:p.y,z:p.z}])),
  edges:state.edges.map(e=>[e.a,e.b]),
  faces:state.faces.map(face=>[...face])
 };
}
function projected(state){
 validate(state);
 return Object.fromEntries(state.points.map(p=>[p.id,G.projectPoint(p)]));
}
function summary(state){
 validate(state);
 return {
  points:state.points.length,segments:state.edges.length,faces:state.faces.length,
  unconstrainedDegrees:state.points.length*3,
  note:'仅统计未施加尺寸与定位约束时，各空间点独立的位置自由度。画线和建立有效三角面不自动固定长度、角度或刚体形状。'
 };
}
return {create,apply,validate,asModel,projected,summary,limits:{points:MAX_POINTS,edges:MAX_EDGES,faces:MAX_FACES}};
});
