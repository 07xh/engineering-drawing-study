'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {buildConstraintIncidence} = require('../../core/constraints/constraint-incidence.cjs');

const point = id => ({id,kind:'point',space:'drawing-2d',unit:'mm',data:{x:0,y:0}});
const link = (id,a,b) => ({id,scope:'multi-point-2d-linear',targetIds:[a,b],type:'coincident',data:{a,b},source:'reviewed'});

test('M1 structural components are invariant under geometry, constraint and target order permutations', () => {
 const geometry = ['A','B','C','D','E'].map(point);
 const constraints = [link('ab','A','B'),link('bc','B','C'),link('de','D','E')];
 const baseline = buildConstraintIncidence({geometry,constraints});
 for(let seed=1;seed<=64;seed++){
  // Rotate and reverse the geometry and constraint ordering without changing meaning.
  const gs = [...geometry.slice(seed%5),...geometry.slice(0,seed%5)];
  if(seed%2)gs.reverse();
  const cs = [...constraints.slice(seed%3),...constraints.slice(0,seed%3)];
  if(seed%2)cs.reverse();
  // A coincident constraint is symmetric in its listed target IDs. The
  // graph must canonicalize them independently from the data reference order.
  const reordered=cs.map(c=>seed%3===0?{...c,targetIds:[...c.targetIds].reverse()}:c);
  assert.deepEqual(buildConstraintIncidence({geometry:gs,constraints:reordered}),baseline);
 }
 assert.equal(baseline.status,'structural-only');
 assert.equal(baseline.numericRank,null);
 assert.equal(baseline.globallyUnique,null);
 assert.equal(baseline.proofOfUniqueness,false);
});

test('M1 connectivity does not mistake cycles or redundant edges for independent equations',()=>{
 const geometry=['A','B','C'].map(point);
 const constraints=[link('ab','A','B'),link('bc','B','C'),link('ca','C','A')];
 const r=buildConstraintIncidence({geometry,constraints});
 assert.deepEqual(r.components,[{geometryIds:['A','B','C'],constraintIds:['ab','bc','ca']}]);
 assert.equal(r.incidenceCount,6);
 assert.equal(r.numericRank,null);
 assert.equal(r.localDegrees,null);
 assert.equal(r.proofOfExistence,false);
 assert.equal(r.proofOfUniqueness,false);
});

test('M1 isolated points and empty graphs preserve fail-closed evidence',()=>{
 const empty=buildConstraintIncidence({geometry:[],constraints:[]});
 assert.deepEqual(empty.components,[]);
 assert.equal(empty.proofOfUniqueness,false);
 const isolated=buildConstraintIncidence({geometry:[point('Z'),point('A')],constraints:[]});
 assert.deepEqual(isolated.components,[
  {geometryIds:['A'],constraintIds:[]},
  {geometryIds:['Z'],constraintIds:[]}
 ]);
 assert.equal(isolated.globallyUnique,null);
 assert.ok(Object.isFrozen(isolated));
});


test('M1 permutation audit refuses unknown target and cross-space mm mismatch',()=>{
 const geometry=[point('A'),point('B')],edge=link('ab','A','B');
 assert.throws(()=>buildConstraintIncidence({geometry,
  constraints:[{...edge,targetIds:['A','Z'],data:{a:'A',b:'Z'}}]}),/unknown geometry/);
 assert.throws(()=>buildConstraintIncidence({geometry:[point('A'),{...point('B'),unit:'unitless'}],
  constraints:[edge]}),/model-mm unit/);
 const original=buildConstraintIncidence({geometry,constraints:[edge]});
 assert.equal(original.globallyUnique,null);
 assert.equal(original.proofOfUniqueness,false);
});
