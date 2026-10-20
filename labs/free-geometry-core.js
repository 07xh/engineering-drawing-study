/* 图学课堂自由创建模式：点与线段是用户输入的可编辑数据，
 * 不是教材题目，也不隐式加入长度、刚性或空间定位约束。
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./dof-lab-geometry.js'):root.DrawingLabGeometry);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DrawingFreeGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G){
'use strict';
const MAX_POINTS=80,MAX_EDGES=220,finite=n=>typeof n==='number'&&Number.isFinite(n);
const ID=/^\p{L}[\p{L}\p{N}_-]{0,15}$/u,clone=x=>JSON.parse(JSON.stringify(x));
function create(){return {version:1,revision:0,nextOrdinal:0,points:[],edges:[]}}
function nameAt(n){const letter=String.fromCharCode(65+n%26);const suffix=Math.floor(n/26);return letter+(suffix?suffix:'')}
function checkPoint(point){
 if(!point||typeof point.id!=='string'||!ID.test(point.id)||['__proto__','constructor','prototype'].includes(point.id))throw Error('点名须以字母开头，最多16个字符');
 for(const axis of ['x','y','z'])if(!finite(point[axis])||Math.abs(point[axis])>10000)throw Error('空间坐标必须为有限数字且绝对值不超过10000');
}
function validate(state){
 if(!state||state.version!==1||!Number.isInteger(state.revision)||state.revision<0||!Number.isInteger(state.nextOrdinal)||state.nextOrdinal<0
  ||!Array.isArray(state.points)||!Array.isArray(state.edges)||state.points.length>MAX_POINTS||state.edges.length>MAX_EDGES)throw Error('自由绘图状态无效');
 const ids=new Set();
 for(const p of state.points){checkPoint(p);if(ids.has(p.id))throw Error('点名重复：'+p.id);ids.add(p.id)}
 const pairs=new Set();
 for(const e of state.edges){
  if(!e||typeof e.a!=='string'||typeof e.b!=='string'||!ids.has(e.a)||!ids.has(e.b)||e.a===e.b)throw Error('线段两端必须是不同的已有点');
  const key=[e.a,e.b].sort().join('\u0000');
  if(pairs.has(key))throw Error('同一线段不能重复添加');
  pairs.add(key);
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
  if(updated.id!==action.id)for(const edge of next.edges){
   if(edge.a===action.id)edge.a=updated.id;
   if(edge.b===action.id)edge.b=updated.id;
  }
 }else if(action.type==='remove-point'){
  if(!next.points.some(p=>p.id===action.id))throw Error('不存在要删除的点');
  next.points=next.points.filter(p=>p.id!==action.id);
  next.edges=next.edges.filter(e=>e.a!==action.id&&e.b!==action.id);
 }else if(action.type==='add-edge'){
  if(next.edges.length>=MAX_EDGES)throw Error('最多添加220条线段');
  next.edges.push({a:action.a,b:action.b});
 }else if(action.type==='remove-edge'){
  const index=next.edges.findIndex(e=>(e.a===action.a&&e.b===action.b)||(e.a===action.b&&e.b===action.a));
  if(index<0)throw Error('不存在要删除的线段');
  next.edges.splice(index,1);
 }else if(action.type==='clear'){
  next.points=[];next.edges=[];next.nextOrdinal=0;
 }else throw Error('不支持的自由绘图操作');
 next.revision++;
 validate(next);
 return next;
}
function asModel(state){
 validate(state);
 return {
  id:'user-free-'+state.revision,
  name:'自定义空间点线模型（非教材原题）',
  points:Object.fromEntries(state.points.map(p=>[p.id,{x:p.x,y:p.y,z:p.z}])),
  edges:state.edges.map(e=>[e.a,e.b]),
  faces:[]
 };
}
function projected(state){
 validate(state);
 return Object.fromEntries(state.points.map(p=>[p.id,G.projectPoint(p)]));
}
function summary(state){
 validate(state);
 return {
  points:state.points.length,segments:state.edges.length,
  unconstrainedDegrees:state.points.length*3,
  note:'仅统计未添加几何约束时，各空间点独立的位置自由度。连接线段只是显示关系，不自动固定长度或减少自由度。'
 };
}
return {create,apply,validate,asModel,projected,summary,limits:{points:MAX_POINTS,edges:MAX_EDGES}};
});
