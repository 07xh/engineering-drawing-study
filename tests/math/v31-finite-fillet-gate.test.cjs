'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizeProblem,solveFiniteFillet}=require('../../engines/constraints-2d/finite-fillet-gate.cjs');
const point=(x,y)=>({x,y});
const line=(x1,y1,x2,y2)=>({a:point(x1,y1),b:point(x2,y2)});
const circ=(x,y,r)=>({center:point(x,y),radius:r});
const first={kind:'two-segments',unit:'mm',filletRadius:2,
 geometry:{first:line(0,0,10,0),second:line(10,0,10,10)},revision:3};
const second={kind:'segment-circle',unit:'mm',filletRadius:2,
 geometry:{segment:line(-30,0,30,0),circle:circ(0,7,5)}};
const third={kind:'two-circles',unit:'mm',filletRadius:10,
 geometry:{first:circ(0,0,5),second:circ(20,0,5)}};

test('typed input rejects image/screen units and invalid parameters',()=>{
 for(const unit of ['px','sheet-px','input-math-unit',undefined])
  assert.throws(()=>normalizeProblem({...first,unit}),/unit/);
 for(const filletRadius of [0,-3,NaN,Infinity])
  assert.throws(()=>normalizeProblem({...first,filletRadius}),/filletRadius/);
 assert.throws(()=>normalizeProblem({...first,geometry:{first:line(0,0,0,0),second:first.geometry.second}}),/degenerate/);
 assert.throws(()=>normalizeProblem({...first,options:{firstSide:0}}),/firstSide/);
 assert.throws(()=>normalizeProblem({...first,revision:-1}),/revision/);
 assert.throws(()=>normalizeProblem({...first,geometry:{...first.geometry,hiddenPixels:5}}),/unsupported field/);
 assert.throws(()=>normalizeProblem({...third,geometry:{first:circ(0,0,0),second:third.geometry.second}}),/radius/);
});

test('normalization is immutable and does not silently default a revision',()=>{
 const before=structuredClone(first),p=normalizeProblem(first);
 p.geometry.first.a.x=55;
 assert.deepEqual(first,before);
 assert.equal(p.revision,3);
 assert.equal(normalizeProblem(third).revision,0);
});

test('real two-finite-segment solver is consumed with no fabricated arc proof',()=>{
 const r=solveFiniteFillet(first);
 assert.ok(['unique','multiple','none','continuous'].includes(r.status));
 assert.equal(r.revision,3);assert.equal(r.globallyUnique,null);
 assert.equal(r.finishedArcVerified,false);assert.equal(r.directedG1Verified,false);
 for(const c of r.candidates){assert.ok(c.maxResidual>=0);assert.equal(c.finiteSourceContactsVerified,true);
  assert.equal(c.finishedArcVerified,false);assert.ok(c.branchId.length>0);}
});

test('real bounded segment-circle solver keeps finite contact evidence',()=>{
 const r=solveFiniteFillet(second);
 assert.equal(r.kind,'segment-circle');assert.equal(r.unit,'mm');
 assert.ok(['unique','multiple','none'].includes(r.status));
 for(const c of r.candidates){assert.ok(c.maxResidual<1e-5);
  assert.ok(c.contacts.first.x>=-30&&c.contacts.first.x<=30);
  assert.equal(c.finishedArcVerified,false);}
});

test('real two-circle solver enumerates both centers without choosing branch',()=>{
 const r=solveFiniteFillet(third);
 assert.equal(r.status,'multiple');assert.equal(r.solutionCount,2);
 assert.equal(r.candidates.length,2);assert.equal(r.globallyUnique,null);
 const centers=r.candidates.map(c=>c.center.y).sort((a,b)=>a-b);
 assert.ok(centers[0]<0&&centers[1]>0);
 for(const c of r.candidates)assert.ok(c.maxResidual<1e-7);
});

test('disjoint two-circle center loci return none, never guessed answer',()=>{
 const r=solveFiniteFillet({...third,geometry:{...third.geometry,second:circ(50,0,5)}});
 assert.equal(r.status,'none');assert.equal(r.candidateCount,0);assert.deepEqual(r.candidates,[]);
});

test('invalid solver evidence is rejected; unstable becomes undetermined',()=>{
 const make=c=>solveFiniteFillet(third,{solvers:{'two-circles':()=>c}});
 const candidate={id:'c',center:point(0,0),contacts:{first:point(0,0),second:point(1,1)},maxResidual:0};
 assert.throws(()=>make({status:'unique',candidateCount:0,candidates:[]}),/count/);
 assert.throws(()=>make({status:'multiple',candidateCount:1,candidates:[candidate]}),/count/);
 assert.throws(()=>make({status:'unique',candidateCount:1,candidates:[{...candidate,maxResidual:NaN}]}),/residual/);
 assert.throws(()=>make({status:'multiple',candidateCount:2,candidates:[candidate,candidate]}),/duplicate/);
 assert.throws(()=>make({status:'coincident',candidateCount:1,candidates:[candidate]}),/non-discrete/);
 const r=make({status:'unstable',candidateCount:0,candidates:[]});
 assert.equal(r.status,'undetermined');assert.equal(r.solutionCount,null);
});
