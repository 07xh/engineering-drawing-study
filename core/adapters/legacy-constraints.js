'use strict';
const {validateConstraint,byScope}=require('../contracts/constraint.js');
function toLegacyCondition(c,scope){
 const checked=validateConstraint(c);
 if(!checked.ok)throw Error('统一约束无效：'+checked.errors.join('；'));
 if(scope!==c.scope)throw Error('不得混用不同求解范围的约束');
 // The typed outer discriminant is authoritative; caller payload must never
 // change the solver route, even if a future validator regresses.
 const data=JSON.parse(JSON.stringify(c.data));
 delete data.type;
 return {...data,type:c.type};
}
function toLegacyConditions(constraints,scope){
 if(!Object.hasOwn(byScope,scope))throw Error('未知求解范围：'+scope);
 if(!Array.isArray(constraints))throw Error('约束必须是数组');
 if(['point-3d-linear','point-2d-linear','point-2d-intersection'].includes(scope)){
  const targets=new Set(constraints.flatMap(c=>c?.targetIds||[]));
  if(targets.size>1)throw Error('单点约束不可混入不同目标点');
 }
 if(scope==='point-2d-intersection'&&constraints.length!==2)throw Error('二维交会必须恰好有两个几何条件');
 return constraints.map(c=>toLegacyCondition(c,scope));
}
module.exports={toLegacyCondition,toLegacyConditions};
