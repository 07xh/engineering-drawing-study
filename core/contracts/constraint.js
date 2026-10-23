'use strict';
const {object,identifier,finite,vec,report,noDuplicateIds,finiteTree}=require('./common.js');
const EPS=1e-9;
const byScope=Object.freeze({
 'point-3d-linear':['coordinate','projection','plane','line'],
 'point-2d-linear':['coordinate','line','through-points'],
 'point-2d-intersection':['line','circle'],
 'multi-point-2d-linear':['fixed','coincident','horizontal','vertical','point-on-line','linear'],
 'multi-point-2d-local-jacobian':['distance','perpendicular','parallel','angle','circle-tangent-line','circle-tangent-circle','on-line','fixed']
});
const nonzero=(v,keys)=>vec(v,keys)&&Math.hypot(...keys.map(k=>v[k]))>EPS;
const line=(v)=>object(v)&&[v.a,v.b,v.offset].every(finite)&&Math.hypot(v.a,v.b)>EPS;
const point=(v)=>vec(v,['x','y']);
const ids=(v)=>typeof v==='string'&&identifier(v);
const axis2=v=>['x','y'].includes(v);
function validateData(scope,type,d){
 if(!object(d)||!finiteTree(d))return false;
 if(Object.hasOwn(d,'type'))return false; // never let nested data override the discriminant
 if(scope==='point-3d-linear'){
  if(type==='coordinate')return ['x','y','z'].includes(d.axis)&&finite(d.value);
  if(type==='projection')return ['V','H','W'].includes(d.plane)&&Array.isArray(d.value)&&d.value.length===2&&d.value.every(finite);
  if(type==='plane')return nonzero(d.normal,['x','y','z'])&&finite(d.offset);
  if(type==='line')return vec(d.point,['x','y','z'])&&nonzero(d.direction,['x','y','z']);
 }
 if(scope==='point-2d-linear'){
  if(type==='coordinate')return axis2(d.axis)&&finite(d.value);
  if(type==='line')return line(d);
  if(type==='through-points')return point(d.p)&&point(d.q)&&Math.hypot(d.p.x-d.q.x,d.p.y-d.q.y)>EPS;
 }
 if(scope==='point-2d-intersection')return type==='line'?line(d):type==='circle'&&[d.x,d.y,d.r].every(finite)&&d.r>0;
 if(scope==='multi-point-2d-linear'){
  if(type==='fixed')return ids(d.point)&&axis2(d.axis)&&finite(d.value);
  if(['coincident','horizontal','vertical'].includes(type))return ids(d.a)&&ids(d.b)&&d.a!==d.b;
  if(type==='point-on-line')return ids(d.point)&&line(d);
  if(type==='linear')return Array.isArray(d.terms)&&d.terms.length>0&&
   d.terms.every(t=>object(t)&&ids(t.point)&&axis2(t.axis)&&finite(t.factor))&&
   d.terms.some(t=>Math.abs(t.factor)>EPS)&&finite(d.value);
 }
 if(scope==='multi-point-2d-local-jacobian'){
  if(type==='fixed')return ids(d.point)&&axis2(d.axis)&&finite(d.value);
  if(type==='distance')return ids(d.a)&&ids(d.b)&&d.a!==d.b&&finite(d.value)&&d.value>=0;
  if(['perpendicular','parallel','angle'].includes(type)){
   const ref=['a','b','c','d'].every(k=>ids(d[k]))&&d.a!==d.b&&d.c!==d.d;
   return ref&&(type!=='angle'||finite(d.value)&&d.value>=0&&d.value<=Math.PI);
  }
  if(type==='circle-tangent-line')return ids(d.center)&&line(d.line)&&finite(d.radius)&&d.radius>0;
  if(type==='circle-tangent-circle')return ids(d.a)&&ids(d.b)&&d.a!==d.b&&
   finite(d.radiusA)&&finite(d.radiusB)&&d.radiusA>0&&d.radiusB>0&&
   ['external','internal'].includes(d.mode)&&
   (d.mode!=='internal'||Math.abs(d.radiusA-d.radiusB)>EPS);
  if(type==='on-line')return ids(d.point)&&line(d.line);
 }
 return false;
}
function validateConstraint(c){
 const errors=[];
 if(!object(c))return report(['Constraint 必须是对象']);
 if(!identifier(c.id))errors.push('Constraint.id 无效');
 if(!Object.hasOwn(byScope,c.scope)||!byScope[c.scope].includes(c.type))errors.push('Constraint.scope/type 不支持');
 if(!Array.isArray(c.targetIds)||!c.targetIds.length||!c.targetIds.every(identifier)||!noDuplicateIds(c.targetIds))errors.push('Constraint.targetIds 无效');
 if(!validateData(c.scope,c.type,c.data))errors.push('Constraint.data 与 scope/type 不匹配、缺少参数或包含退化对象');
 if(['multi-point-2d-linear','multi-point-2d-local-jacobian'].includes(c.scope)&&object(c.data)&&Array.isArray(c.targetIds)){
  const d=c.data, refs=[];
  if(['fixed','point-on-line','on-line'].includes(c.type))refs.push(d.point);
  if(['coincident','horizontal','vertical','distance','parallel','perpendicular','angle','circle-tangent-circle'].includes(c.type))
   refs.push(d.a,d.b);
  if(['parallel','perpendicular','angle'].includes(c.type))refs.push(d.c,d.d);
  if(c.type==='circle-tangent-line')refs.push(d.center);
  if(c.type==='linear'&&Array.isArray(d.terms))refs.push(...d.terms.map(t=>t?.point));
  if(refs.length&&(!refs.every(id=>c.targetIds.includes(id))||
    c.targetIds.some(id=>!refs.includes(id))))errors.push('Constraint.targetIds 与 data 中引用的点不一致');
 }
 if(!['given','derived','reviewed'].includes(c.source))errors.push('Constraint.source 无效');
 return report(errors);
}
module.exports={byScope,validateConstraint,validateData};
