'use strict';
/*
 * Shared M2 relation/residual evidence for already human-confirmed Geometry.
 * No nonlinear search, unknown-coordinate solver, uniqueness or V5 proof.
 * Uses the existing M0 Euclidean kernel and the one Geometry contract.
 */
const M0=require('../numeric/euclidean-kernel.cjs');
const {validateGeometry}=require('../contracts/geometry.js');
const TYPES=Object.freeze(['distance','coincident','equal-length','parallel','perpendicular']);
const ID=/^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const finite=Number.isFinite;
function fail(s){throw new TypeError('多对象数学关系：'+s);}
function checkRelation(r,known){
 if(!r||typeof r!=='object'||Array.isArray(r)||
    !ID.test(r.id)||!TYPES.includes(r.kind)||
    !Array.isArray(r.objectIds)||r.objectIds.length!==2||
    r.objectIds.some(id=>!ID.test(id)||!known.has(id))||
    r.objectIds[0]===r.objectIds[1]||
    typeof r.confirmed!=='boolean')
  fail('需要两个不同的已知 Geometry 对象及合法关系类型');
 if(r.kind==='distance'){
  if(!finite(r.value)||r.value<=0||r.value>1e8)fail('距离需要有限的正毫米目标');
 }else if(r.value!==null)fail('该关系不应带数值目标');
 return r;
}
function coords(g){
 const axes=g.space==='drawing-2d'?['x','y']:['x','y','z'];
 const vec=p=>axes.map(k=>p[k]);
 return {dim:axes.length,vec};
}
function segmentVector(g){
 const {vec}=coords(g);
 return M0.subtract(vec(g.data.end),vec(g.data.start));
}
function relationResidual(g,h,kind,value){
 if(g.space!==h.space)fail('不同坐标空间不得直接比较或推断三维对应');
 const {vec}=coords(g),dim=g.space==='drawing-2d'?2:3;
 if(kind==='distance'||kind==='coincident'){
  if(g.kind!=='point'||h.kind!=='point')fail('点距离/重合要求两个空间相同的点');
  const actual=M0.norm(M0.subtract(vec(g.data),vec(h.data)));
  return {actual,target:kind==='distance'?value:0,residual:kind==='distance'?actual-value:actual,
   unit:'mm'};
 }
 if(g.kind!=='segment'||h.kind!=='segment')
  fail('线段关系必须引用两个相同坐标空间的有限线段');
 const a=segmentVector(g),b=segmentVector(h);
 const an=M0.norm(a),bn=M0.norm(b);
 if(an<=1e-12||bn<=1e-12)fail('线段退化，不得报告关系证明');
 if(kind==='equal-length')
  return {actual:an,target:bn,residual:an-bn,unit:'mm'};
 const u=a.map(v=>v/an),v=b.map(w=>w/bn);
 const dot=M0.dot(u,v);
 if(kind==='perpendicular')
  return {actual:dot,target:0,residual:dot,unit:'dimensionless'};
 if(kind==='parallel'){
  const cross=dim===3?M0.norm(M0.cross3(u,v)):
   Math.abs(u[0]*v[1]-u[1]*v[0]);
  if(!finite(cross))fail('法向量计算溢出');
  return {actual:cross,target:0,residual:cross,unit:'dimensionless'};
 }
 fail('尚不支持的多对象关系');
}
function analyzeConfirmedRelations(geometry,relations,{revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)fail('需要当前数学修订号');
 if(!Array.isArray(geometry)||geometry.length>200||!Array.isArray(relations)||
    relations.length>200)fail('对象或关系集合超过可审计范围');
 const byId=new Map();
 for(const g of geometry){
  if(!g||byId.has(g.id)||g.unit!=='mm')fail('对象 ID 重复或缺少毫米单位');
  const valid=validateGeometry(g);
  if(!valid.ok)fail('输入 Geometry 无效：'+valid.errors.join('；'));
  byId.set(g.id,g);
 }
 const seen=new Set(),items=[];
 for(const row of relations){
  checkRelation(row,byId);
  if(seen.has(row.id))fail('关系 ID 不允许重复');
  seen.add(row.id);
  if(!row.confirmed)fail('存在未经人工确认的关系');
  const {actual,target,residual,unit}=
   relationResidual(byId.get(row.objectIds[0]),byId.get(row.objectIds[1]),
    row.kind,row.value);
  const tolerance=unit==='mm'?Math.max(1e-7,
    1e-8*Math.max(1,Math.abs(actual),Math.abs(target))):1e-8;
  if(![actual,target,residual,tolerance].every(finite))fail('数值残差溢出');
  items.push(Object.freeze({id:row.id,kind:row.kind,
   objectIds:Object.freeze([...row.objectIds]),unit,actual,target,residual,
   tolerance,consistent:Math.abs(residual)<=tolerance}));
 }
 return Object.freeze({schema:'draftai-m2-confirmed-relations/1',revision,
  status:items.some(i=>!i.consistent)?'inconsistent':
   items.length?'consistent':'no-relations',
  relations:Object.freeze(items),checkedCount:items.length,
  globallyUnique:null,localDegrees:null,solutionCount:null,
  constructedGeometry:null,mathematicallyVerified:false,
  v5Ready:false,scope:'given-geometry-consistency-only'});
}
module.exports={TYPES,checkRelation,analyzeConfirmedRelations};
