/* Explicit dependency graph for source-reviewed construction steps.
 * Records provenance, not a proof that geometric constraints are sufficient.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingDependencyGraph=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function build(steps){
 if(!Array.isArray(steps))throw Error('作图步骤必须为数组');
 const nodes=new Map(),order=[];
 for(const step of steps){
  if(!step||typeof step.id!=='string'||!Array.isArray(step.objects))throw Error('缺少步骤编号或几何对象清单');
  for(const obj of step.objects){
   if(!obj||typeof obj.id!=='string'||!obj.id||!['given','point','line','circle','arc','auxiliary'].includes(obj.kind)||!Array.isArray(obj.dependsOn)||obj.dependsOn.some(id=>typeof id!=='string'))throw Error('无效几何依赖');
   if(nodes.has(obj.id))throw Error('几何对象编号重复：'+obj.id);
   if(obj.dependsOn.includes(obj.id))throw Error('几何对象不能依赖自身');
   for(const dependency of obj.dependsOn)if(!nodes.has(dependency))throw Error('依赖对象尚未建立：'+dependency);
   const node={id:obj.id,kind:obj.kind,stepId:step.id,dependsOn:[...obj.dependsOn],reason:typeof obj.reason==='string'?obj.reason:''};
   nodes.set(obj.id,node);order.push(node);
  }
 }
 function ancestors(id){
  if(!nodes.has(id))throw Error('找不到几何对象：'+id);
  const visited=new Set();
  function walk(current){for(const dep of nodes.get(current).dependsOn)if(!visited.has(dep)){visited.add(dep);walk(dep);}}
  walk(id);return order.filter(node=>visited.has(node.id)).map(node=>node.id);
 }
 return {nodes:order,ancestors,byStep(id){return order.filter(node=>node.stepId===id);}};
}
return {build};
});
