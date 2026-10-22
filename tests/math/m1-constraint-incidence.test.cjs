'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildConstraintIncidence:build}=require('../../core/constraints/constraint-incidence.cjs');
const p=(id,x=0,y=0)=>({id,kind:'point',space:'drawing-2d',unit:'mm',data:{x,y}});
const p3=(id)=>({id,kind:'point',space:'model-3d',unit:'mm',data:{x:1,y:2,z:3}});
const fixed=(id,point,value=0)=>({id,scope:'multi-point-2d-linear',
 targetIds:[point],type:'fixed',data:{point,axis:'x',value},source:'given'});
const coincident=(id,a,b)=>({id,scope:'multi-point-2d-linear',
 targetIds:[a,b],type:'coincident',data:{a,b},source:'reviewed'});

test('real 2D point constraints form deterministic bipartite independent structural components',()=>{
 const g=[p('A'),p('B'),p('C')],c=[fixed('xA','A'),coincident('AB','A','B')];
 const r=build({geometry:g,constraints:c});
 assert.equal(r.status,'structural-only');assert.equal(r.incidenceCount,3);
 assert.deepEqual(r.components,[
  {geometryIds:['A','B'],constraintIds:['AB','xA']},
  {geometryIds:['C'],constraintIds:[]}
 ]);
 assert.deepEqual(build({geometry:[g[2],g[1],g[0]],constraints:[c[1],c[0]]}),r);
 assert.deepEqual(g,[p('A'),p('B'),p('C')]);
 assert.ok(Object.isFrozen(r));assert.ok(Object.isFrozen(r.components[0].geometryIds));
});
test('duplicated independent-looking constraints do not magically establish rank or global uniqueness',()=>{
 const r=build({geometry:[p('A')],constraints:[fixed('f1','A'),fixed('f2','A')]});
 assert.deepEqual(r.components,[{geometryIds:['A'],constraintIds:['f1','f2']}]);
 assert.equal(r.numericRank,null);assert.equal(r.localDegrees,null);
 assert.equal(r.globallyUnique,null);assert.equal(r.proofOfExistence,false);
 assert.equal(r.proofOfUniqueness,false);
});
test('valid 3D point constraint stays an isolated model-space component',()=>{
 const c={id:'z',scope:'point-3d-linear',targetIds:['P'],type:'coordinate',
  data:{axis:'z',value:3},source:'given'};
 const r=build({geometry:[p3('P')],constraints:[c]});
 assert.deepEqual(r.components,[{geometryIds:['P'],constraintIds:['z']}]);
});
test('geometry references, mixed dimensional frames, untagged units and invalid schema fail closed',()=>{
 assert.throws(()=>build({geometry:[p('A')],constraints:[fixed('xB','B')]}),/unknown geometry/);
 assert.throws(()=>build({geometry:[p('A'),p3('B')],
  constraints:[coincident('AB','A','B')]}),/drawing-2d/);
 assert.throws(()=>build({geometry:[{...p('A'),unit:'unitless'}],
  constraints:[fixed('xA','A')]}),/model-mm/);
 assert.throws(()=>build({geometry:[p('A')],constraints:[{...fixed('xA','A'),data:{point:'B',axis:'x',value:0}}]}),/invalid constraint/);
 assert.throws(()=>build({geometry:[p('A'),p('A')],constraints:[]}),/duplicate geometry/);
 assert.throws(()=>build({geometry:[p('A')],constraints:[fixed('same','A'),fixed('same','A')]}),/duplicate constraint/);
});
test('malformed arrays and unbounded inputs cannot bypass structural validation',()=>{
 const holes=[p('A'),p('B')];delete holes[1];
 assert.throws(()=>build({geometry:holes,constraints:[]}),/dense arrays/);
 assert.throws(()=>build({geometry:[p('A')],constraints:[,]}),/dense arrays/);
 assert.throws(()=>build({geometry:Array(2049).fill(p('A')),constraints:[]}),/size budget/);
 assert.throws(()=>build({geometry:[],constraints:Array(4097).fill(fixed('xA','A'))}),/size budget/);
});
