'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditPlanarCandidates:audit}=require('../../core/verification/planar-candidate-audit.cjs');
const legacy=require('../../knowledge/planar-intersections.js');
const circle=(id,x,y,r)=>({id,kind:'circle',frame:'model-mm-2d',unit:'mm',x,y,r});
const line=(id,a,b,offset)=>({id,kind:'line',frame:'model-mm-2d',unit:'mm',a,b,offset});
const common={featureScaleMm:10,absoluteToleranceMm:1e-9,sourceRevision:4};
const verify=(primitives,candidates,options={})=>audit({primitives,candidates,...common,...options});
const wrap=solutions=>solutions.map((point,i)=>({id:'branch-'+i,point}));
test('M2 audits both REAL legacy circle-circle intersection branches',()=>{
 const one=circle('a',0,0,5),two=circle('b',8,0,5);
 const r0=legacy.circleCircle({x:0,y:0,r:5},{x:8,y:0,r:5});
 assert.equal(r0.status,'multiple');
 const r=verify([one,two],wrap(r0.solutions));
 assert.equal(r.status,'within-declared-tolerances');assert.equal(r.candidates.length,2);
 assert.ok(r.candidates.every(c=>c.checks.every(v=>v.absoluteResidualMm<1e-9)));
 assert.equal(r.globallyUnique,null);assert.equal(r.proofOfExistence,false);
});
test('M2 audits actual legacy line-circle candidates',()=>{
 const r0=legacy.lineCircle({a:0,b:1,offset:0},{x:0,y:0,r:5});
 const r=verify([line('horizontal',0,1,0),circle('circle',0,0,5)],wrap(r0.solutions));
 assert.equal(r.status,'within-declared-tolerances');
});
test('M2 rejects forged off-geometry candidate despite caller-supplied unique flag',()=>{
 const r=verify([line('l',0,1,0),circle('c',0,0,5)],
  [{id:'fake',point:{x:5,y:2},status:'unique',globallyUnique:true}]);
 assert.equal(r.status,'candidate-residual-failed');
 assert.equal(r.candidates[0].withinTolerance,false);
});
test('M2 empty candidate set never asserts no solution',()=>{
 const r=verify([circle('c1',0,0,5),circle('c2',8,0,5)],[]);
 assert.equal(r.status,'no-candidates-to-audit');assert.equal(r.proofOfNonexistence,false);
});
test('M2 duplicate branches are numerically ambiguous, not two proven solutions',()=>{
 const r=verify([circle('c1',0,0,5),line('l',0,1,0)],
  [{id:'a',point:{x:5,y:0}},{id:'b',point:{x:5,y:0}}]);
 assert.equal(r.status,'branch-separation-undetermined');
 assert.equal(r.hasInsufficientBranchSeparation,true);
});
test('M2 uses local physical feature scale, detects off-geometry error',()=>{
 const r=verify([line('l',0,1,0),circle('c',0,0,5)],
  [{id:'a',point:{x:5,y:0.1}}],{absoluteToleranceMm:1e-6});
 assert.equal(r.status,'candidate-residual-failed');
});
test('M2 rejects mm/px mismatch, duplicate IDs, nonfinite and stale versions',()=>{
 const ok=[circle('a',0,0,5),circle('b',8,0,5)];
 assert.throws(()=>verify([{...ok[0],unit:'px'},ok[1]],[]));
 assert.throws(()=>verify([{...ok[0],frame:'sheet-px'},ok[1]],[]));
 assert.throws(()=>verify(ok,[{id:'x',point:{x:1,y:1}},{id:'x',point:{x:2,y:2}}]));
 assert.throws(()=>verify(ok,[{id:'x',point:{x:Infinity,y:1}}]));
 assert.throws(()=>verify(ok,[{id:'x',point:{x:1,y:1}}],{sourceRevision:-1}));
});
test('M2 nonfinite residuals, degenerate lines and unsupported geometry fail closed',()=>{
 assert.throws(()=>verify([circle('a',1e308,0,5),circle('b',8,0,5)],
  [{id:'x',point:{x:-1e308,y:0}}]));
 assert.throws(()=>verify([line('l',0,0,4),circle('b',0,0,5)],[]));
 assert.throws(()=>verify([line('l',1e-320,0,4),circle('b',0,0,5)],[]));
 assert.throws(()=>verify([circle('c',0,0,5),
  {id:'s',kind:'segment',frame:'model-mm-2d',unit:'mm'}],[]));
});
