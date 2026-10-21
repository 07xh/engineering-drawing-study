'use strict';
const {object,identifier,report,noDuplicateIds,finiteTree}=require('./common.js');
const byScope=Object.freeze({
 'point-3d-linear':['coordinate','projection','plane','line'],
 'point-2d-linear':['coordinate','line','through-points'],
 'point-2d-intersection':['line','circle'],
 'multi-point-2d-linear':['fixed','coincident','horizontal','vertical','point-on-line','linear'],
 'multi-point-2d-local-jacobian':['distance','perpendicular','parallel','angle','circle-tangent-line','circle-tangent-circle','on-line','fixed']
});
function validateConstraint(c){
 const errors=[];
 if(!object(c))return report(['Constraint 必须是对象']);
 if(!identifier(c.id))errors.push('Constraint.id 无效');
 if(!Object.hasOwn(byScope,c.scope)||!byScope[c.scope].includes(c.type))errors.push('Constraint.scope/type 不支持');
 if(!Array.isArray(c.targetIds)||!c.targetIds.length||!c.targetIds.every(identifier)||!noDuplicateIds(c.targetIds))errors.push('Constraint.targetIds 无效');
 if(!object(c.data)||!finiteTree(c.data))errors.push('Constraint.data 无效或包含非有限数字');
 if(!['given','derived','reviewed'].includes(c.source))errors.push('Constraint.source 无效');
 return report(errors);
}
module.exports={byScope,validateConstraint};
