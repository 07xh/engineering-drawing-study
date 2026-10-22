'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const N=require('../../core/numeric/residual-evidence.cjs');
const mm=(options={})=>({
  absoluteTolerance:1e-8,relativeTolerance:0,
  characteristicScale:50,unit:'mm',...options
});

test('M0 numerical policy rejects zero, negative or unscoped tolerances',()=>{
  for(const bad of [
    {},mm({absoluteTolerance:0}),mm({absoluteTolerance:-1}),
    mm({absoluteTolerance:NaN}),mm({relativeTolerance:Infinity}),
    mm({characteristicScale:0}),mm({characteristicScale:NaN}),
    mm({unit:'px'}),mm({characteristicScale:Infinity}),
    mm({absoluteTolerance:1e308,relativeTolerance:1e308,
      characteristicScale:1e308})
  ])assert.throws(()=>N.policy(bad));
});

test('M0 residual is compared to a caller-declared local geometry feature scale',()=>{
  const p=mm({absoluteTolerance:1e-5,relativeTolerance:0.001,
    characteristicScale:10});
  const within=N.checkResidual({residual:0.009,...p});
  const outside=N.checkResidual({residual:0.1,...p});
  assert.equal(within.status,'within-tolerance');
  assert.equal(outside.status,'outside-tolerance');
  assert.ok(within.normalizedResidual<1);
  assert.ok(outside.normalizedResidual>1);
  assert.equal(within.unit,'mm');
  assert.equal(within.proofOfUniqueness,false);
  assert.equal(within.proofOfExistence,false);
});

test('M0 negative signed residual uses magnitude, never accepts a large negative error',()=>{
  const value=N.checkResidual({residual:-0.2,...mm({absoluteTolerance:0.01})});
  assert.equal(value.status,'outside-tolerance');
  assert.equal(value.absoluteResidual,0.2);
});

test('M0 large global coordinates never turn a true 10 mm mismatch into a match',()=>{
  const result=N.compareCoordinates({
    a:1e12,b:1e12+10,...mm({relativeTolerance:1e-4,characteristicScale:40})
  });
  assert.equal(result.absoluteDifference,10);
  assert.equal(result.status,'different');
  assert.ok(result.allowedDifference<0.005);
});

test('M0 small differences on ordinary coordinates are within physical tolerance',()=>{
  const r=N.compareCoordinates({a:35.5,b:35.500001,
    ...mm({absoluteTolerance:1e-5})});
  assert.equal(r.status,'within-tolerance');
  assert.equal(r.proofOfUniqueness,false);
});

test('M0 unrepresentable sub-millimeter difference at huge origin stays unknown',()=>{
  const r=N.compareCoordinates({a:1e12,b:1e12+0.000001,
    ...mm({absoluteTolerance:1e-8})});
  // At 1e12 magnitude, JS Number cannot resolve a 1e-6 difference.
  assert.equal(r.status,'resolution-limited');
  assert.ok(r.approximateFloatingResolution>r.allowedDifference);
  assert.equal(r.resolutionIsHeuristic,true);
});

test('M0 differences near the floating representation floor are not overclaimed',()=>{
  const r=N.compareCoordinates({a:1e12,b:1e12+0.0001220703125,
    ...mm({absoluteTolerance:1e-8})});
  assert.equal(r.status,'resolution-limited');
});

test('M0 local feature scale, not global origin, decides relative tolerance',()=>{
  const p=mm({absoluteTolerance:1e-8,relativeTolerance:0.01,
    characteristicScale:2});
  const a=N.policy(p);
  const r=N.compareCoordinates({a:1e9,b:1e9+0.1,...p});
  assert.ok(Math.abs(a.allowedDifference-0.02000001)<1e-10);
  assert.equal(r.status,'different');
});

test('M0 no numeric helper silently converts degree errors to mm',()=>{
  assert.equal(N.policy({absoluteTolerance:0.1,relativeTolerance:0,
    characteristicScale:360,unit:'deg'}).unit,'deg');
  assert.throws(()=>N.checkResidual({residual:2,
    ...mm({unit:'pixels'})}));
});

test('M0 overflow and nonfinite inputs fail closed',()=>{
  assert.throws(()=>N.checkResidual({residual:Infinity,...mm()}));
  assert.throws(()=>N.compareCoordinates({a:Infinity,b:1,...mm()}));
  assert.throws(()=>N.compareCoordinates({a:1e308,b:-1e308,...mm()}));
  assert.throws(()=>N.checkResidual({residual:1e308,
    ...mm({absoluteTolerance:Number.MIN_VALUE})}));
});

test('M0 zero residual is a local numeric check, not a global existence proof',()=>{
  const r=N.checkResidual({residual:0,...mm()});
  assert.equal(r.status,'within-tolerance');
  assert.equal(r.kind,'local-numeric-residual-check');
  assert.equal(r.proofOfExistence,false);
  assert.equal(r.proofOfUniqueness,false);
});
