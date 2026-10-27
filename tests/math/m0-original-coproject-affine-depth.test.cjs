'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {originalCoProjectedAffineDepth}=
 require('../../core/numeric/original-coproject-affine-depth.cjs');
const E=(id,y)=>({id,
 from:{x:2,y,z:0},to:{x:2,y,z:5}});
test('two original co-projected 3D physical edges prove entire affine front order',()=>{
 const p=originalCoProjectedAffineDepth({
  candidate:E('One',0),peer:E('Two',4),view:'V'
 });
 assert.equal(p.status,'candidate-strictly-front');
 assert.deepEqual(p.signedObserverDepthDifferenceAtEndsMm,[4,4]);
 assert.equal(p.engineeringLineStyleCertified,false);
});
test('opposite depth endpoints stay unsigned despite frontmost midpoint ambiguity',()=>{
 const r=originalCoProjectedAffineDepth({
  candidate:E('Line',0),
  peer:{id:'Skew',from:{x:2,y:-1,z:0},to:{x:2,y:1,z:5}},
  view:'V'
 });
 assert.equal(r.status,'undetermined-depth-tie-crossing-or-insufficient-margin');
 assert.equal(r.formalV5ActionSigned,false);
});
