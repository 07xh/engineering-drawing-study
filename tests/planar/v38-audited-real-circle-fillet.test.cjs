'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditRealCircleFilletCenters:audit}=require('../../engines/planar/audited-circle-fillet-centers.cjs');
const {solveFiniteFillet:solve}=require('../../engines/constraints-2d/finite-fillet-gate.cjs');
const first={center:{x:0,y:0},radius:5},second={center:{x:20,y:0},radius:5};
const sample=(overrides={})=>({
 kind:'two-circles',unit:'mm',geometry:{first,second},
 filletRadius:10,revision:7,options:{firstMode:'external',secondMode:'external'},
 ...overrides
});
const verified=(problem=sample(),opts={})=>audit(problem,{
 expectedRevision:problem.revision,absoluteToleranceMm:1e-8,
 featureScaleMm:25,relativeTolerance:0,...opts
});
test('02 actual two-circle candidates consume shared M2 numerical evidence without uniqueness claims',()=>{
 const input=sample(),raw=solve(input),result=verified(input);
 assert.equal(raw.status,'multiple');assert.equal(raw.candidateCount,2);
 assert.equal(result.status,'candidate-loci-consistent');
 assert.deepEqual(result.branchIds,raw.candidates.map(c=>c.branchId));
 assert.equal(result.candidateCount,2);
 assert.equal(result.numericEvidence.status,'within-declared-tolerances');
 assert.equal(result.numericEvidence.candidates.length,2);
 assert.ok(result.numericEvidence.candidates.every(c=>c.checks.every(x=>x.status==='within-tolerance')));
 assert.equal(result.independentGlobalProof,false);
 assert.equal(result.suitableForV5,false);
 assert.equal(result.globallyUnique,null);
 assert.ok(Object.isFrozen(result));
});
test('02 tangent center loci have one real candidate without claiming global uniqueness',()=>{
 const input=sample({geometry:{first,second:{center:{x:30,y:0},radius:5}}});
 const raw=solve(input),result=verified(input);
 assert.equal(raw.status,'unique');
 assert.deepEqual(raw.candidates.map(c=>c.branchId),['center-1']);
 assert.equal(result.status,'candidate-loci-consistent');
 assert.deepEqual(result.branchIds,['center-1']);
 assert.equal(result.globallyUnique,null);
 assert.equal(result.suitableForV5,false);
});
test('02 finite source arcs remain unsupported by this typed 02 gate, not silently treated as circles',()=>{
 const input=sample({geometry:{first:{...first,arc:{
   startAngle:0,endAngle:180,direction:'ccw'}},second}});
 assert.throws(()=>verified(input),/unsupported field arc/);
});
test('02 non-intersecting auxiliary loci have no numerical candidate evidence and no false none proof',()=>{
 const input=sample({geometry:{first,second:{center:{x:50,y:0},radius:5}}});
 const result=verified(input);
 assert.equal(result.sourceStatus,'none');
 assert.equal(result.status,'not-certified');
 assert.equal(result.numericEvidence.status,'no-candidates-to-audit');
 assert.equal(result.numericEvidence.proofOfNonexistence,false);
 assert.deepEqual(result.branchIds,[]);
});
test('02 concentric equal loci remain coincident, never guessed as one valid branch',()=>{
 const input=sample({geometry:{first,second:{center:{x:0,y:0},radius:5}}});
 const result=verified(input);
 assert.equal(result.sourceStatus,'coincident');
 assert.equal(result.status,'not-certified');
 assert.equal(result.suitableForV5,false);
});
test('02 equal internal circle/fillet radii block degenerate locus with no fabricated M2 circle',()=>{
 const input=sample({geometry:{first:{...first,radius:10},second},
  options:{firstMode:'internal',secondMode:'external'}});
 const result=verified(input);
 assert.equal(result.status,'unsupported-degenerate-locus');
 assert.equal(result.numericEvidence,null);
 assert.equal(result.suitableForV5,false);
});
test('02 source revision and unit mismatch fail closed before producing evidence',()=>{
 assert.throws(()=>verified(sample(),{expectedRevision:8}),/revision/);
 assert.throws(()=>verified(sample({unit:'px'})),/unit mm/);
 assert.throws(()=>verified(sample({kind:'two-segments'})));
 assert.throws(()=>verified(sample({options:{firstMode:'none'}})));
});
test('02 unrealistic tolerance, nonfinite coordinates and invalid radii reject safely',()=>{
 assert.throws(()=>verified(sample(),{absoluteToleranceMm:0}),/tolerance/);
 assert.throws(()=>verified(sample({geometry:{first:{...first,radius:Infinity},second}})));
 assert.throws(()=>verified(sample({geometry:{first:{...first,radius:-2},second}})));
});
test('02 common positive scaling keeps two branches and checked mm residuals',()=>{
 for(const k of [0.1,1,100]){
  const input=sample({geometry:{first:{center:{x:0,y:0},radius:5*k},
   second:{center:{x:20*k,y:0},radius:5*k}},filletRadius:10*k});
  const result=verified(input,{featureScaleMm:25*k,absoluteToleranceMm:1e-8*k});
  assert.equal(result.status,'candidate-loci-consistent');
  assert.deepEqual(result.branchIds,['center-1','center-2']);
 }
});
