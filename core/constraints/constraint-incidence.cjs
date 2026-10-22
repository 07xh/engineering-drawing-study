'use strict';
/**
 * M1 structural incidence of validated, unit-tagged model geometry and
 * constraints. Reuses existing schema validators; NEVER computes rank,
 * numerical independence, DOF, existence, uniqueness or SolveResult.
 */
const {validateGeometry}=require('../contracts/geometry.js');
const {validateConstraint}=require('../contracts/constraint.js');
const MAX_GEOMETRY=2048,MAX_CONSTRAINTS=4096,MAX_INCIDENCES=16384;
const dense=a=>Array.isArray(a)&&Array.from({length:a.length},
 (_,i)=>Object.hasOwn(a,i)).every(Boolean);
const scopeSpace=scope=>scope==='point-3d-linear'?'model-3d':'drawing-2d';

function buildConstraintIncidence({geometry,constraints}={}){
 if(!dense(geometry)||!dense(constraints))
  throw new TypeError('geometry and constraints must be dense arrays');
 if(geometry.length>MAX_GEOMETRY||constraints.length>MAX_CONSTRAINTS)
  throw new RangeError('constraint incidence graph exceeds size budget');
 const items=new Map(),byPoint=new Map(),byConstraint=new Map();
 for(const g of geometry){
  const check=validateGeometry(g);
  if(!check.ok)throw new TypeError('invalid geometry: '+check.errors.join('; '));
  if(items.has(g.id))throw new TypeError('duplicate geometry id: '+g.id);
  items.set(g.id,{kind:g.kind,space:g.space,unit:g.unit});
  byPoint.set(g.id,[]);
 }
 let incidences=0;
 for(const c of constraints){
  const check=validateConstraint(c);
  if(!check.ok)throw new TypeError('invalid constraint: '+check.errors.join('; '));
  if(byConstraint.has(c.id))throw new TypeError('duplicate constraint id: '+c.id);
  const expectedSpace=scopeSpace(c.scope);
  for(const id of c.targetIds){
   const point=items.get(id);
   if(!point)throw new TypeError('constraint references unknown geometry: '+id);
   if(point.kind!=='point'||point.space!==expectedSpace||point.unit!=='mm')
    throw new TypeError('constraint target must be a point in '+expectedSpace+' with explicit model-mm unit: '+id);
   byPoint.get(id).push(c.id);
   incidences++;
   if(incidences>MAX_INCIDENCES)
    throw new RangeError('constraint incidence count exceeds size budget');
  }
  byConstraint.set(c.id,[...c.targetIds]);
 }
 // True bipartite connectivity, not algebraic independence. Traverse in
 // sorted order so input permutations cannot change component identity.
 const seenPoints=new Set(),seenConstraints=new Set(),components=[];
 for(const root of [...items.keys()].sort()){
  if(seenPoints.has(root))continue;
  const pointIds=[],constraintIds=[],queue=[root];
  seenPoints.add(root);
  for(let k=0;k<queue.length;k++){
   const id=queue[k];pointIds.push(id);
   for(const cId of [...byPoint.get(id)].sort()){
    if(seenConstraints.has(cId))continue;
    seenConstraints.add(cId);constraintIds.push(cId);
    for(const neighbor of [...byConstraint.get(cId)].sort()){
     if(seenPoints.has(neighbor))continue;
     seenPoints.add(neighbor);queue.push(neighbor);
    }
   }
  }
  components.push(Object.freeze({
   geometryIds:Object.freeze(pointIds.sort()),
   constraintIds:Object.freeze(constraintIds.sort())
  }));
 }
 return Object.freeze({
  schema:'draftai-constraint-incidence/1',
  status:'structural-only',
  geometryCount:geometry.length,
  constraintCount:constraints.length,
  incidenceCount:incidences,
  components:Object.freeze(components),
  numericRank:null,localDegrees:null,globallyUnique:null,
  proofOfExistence:false,proofOfUniqueness:false
 });
}
module.exports={buildConstraintIncidence};
