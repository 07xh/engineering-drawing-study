'use strict';
// Development-only, seeded property testing. This is an independent M5 oracle,
// NOT a new M3 solver or evidence of verified engineering line styles.
// `npm install` is needed only in the existing validate CI workflow.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fc=require('fast-check');
const {evaluateFiniteOrthogonalCylinderIntersection:solve}=
  require('../../engines/spatial/intersections/finite-orthogonal-cylinders.cjs');

// Deliberately finite, non-singular, and geometrically different inputs.
// Keeping zRadius > yRadius + |offsetX| avoids accidental tangencies.
// The shrinker still explores smaller radii, offsets, translations and units.
const dimensions=fc.record({
  zRadius:fc.integer({min:13,max:29}),
  yRadius:fc.integer({min:4,max:9}),
  offsetX:fc.integer({min:-3,max:3}),
  cx:fc.integer({min:-40,max:40}),
  cy:fc.integer({min:-40,max:40}),
  cz:fc.integer({min:-40,max:40}),
  scale:fc.integer({min:1,max:3})
});
const seed=20261025;
const settings={seed,numRuns:80};
function model(p,mode='complete'){
  const s=p.scale;
  const Z={
    radius:p.zRadius*s,xCenter:p.cx*s,yCenter:p.cy*s,
    zMin:(p.cz-(mode==='positive'?0:p.zRadius+3))*s,
    zMax:(p.cz+p.zRadius+3)*s
  };
  // zMin for positive mode is precisely cz (not cz-0).
  const Y={
    radius:p.yRadius*s,xCenter:(p.cx+p.offsetX)*s,zCenter:p.cz*s,
    yMin:(p.cy-(mode==='positive'?0:p.zRadius+3))*s,
    yMax:(p.cy+p.zRadius+3)*s
  };
  return {kind:'finite-orthogonal-cylinder-intersection',
    unit:'mm',sourceConfirmed:true,zCylinder:Z,yCylinder:Y};
}
function safetyGate(r) {
  assert.equal(r.scope,'finite-lateral-lateral-only');
  assert.equal(r.verifiedVisibility,false);
  assert.equal(r.officialLineStylesVerified,false);
  assert.equal(r.v5Ready,false);
  assert.deepEqual(r.constructionIntents,[]);
  assert.deepEqual(r.steps,[]);
}
// Independent scalar bisection rather than the M3 implementation's
// signed-sqrt expression. Checks equation membership at interior x slices.
function radialCoordinate(x,r,cx,otherCenter,sign) {
  let lo=0,hi=r;
  for(let i=0;i<54;i++){
    const mid=(lo+hi)/2;
    if((x-cx)**2+mid**2>r**2)hi=mid;
    else lo=mid;
  }
  return otherCenter+sign*(lo+hi)/2;
}
function verifyRegular(r,input,signPairs){
  const {zCylinder:Z,yCylinder:Y}=input;
  assert.equal(r.status,'scoped-analytic-ready');
  assert.equal(r.branchCount,signPairs.length);
  assert.equal(r.analyticallyCompleteWithinScope,true);
  assert.equal(r.verifiedCapClipping,true);
  assert.equal(r.geometryVerifiedWithinSpecialistScope,true);
  safetyGate(r);
  for(const b of r.branches){
    assert.ok(signPairs.some(pair=>pair[0]===b.signY&&pair[1]===b.signZ));
    assert.ok(b.xRange[1]>b.xRange[0]);
    assert.equal(b.officialLineStyle,'undetermined');
    for(const {point:p} of b.endpoints) {
      const tol=1e-7*Math.max(1,Z.radius**2,Y.radius**2);
      assert.ok(Math.abs((p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2-Z.radius**2)<=tol);
      assert.ok(Math.abs((p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2-Y.radius**2)<=tol);
      assert.ok(p.z>=Z.zMin-1e-7&&p.z<=Z.zMax+1e-7);
      assert.ok(p.y>=Y.yMin-1e-7&&p.y<=Y.yMax+1e-7);
    }
  }
  const minX=Math.max(Z.xCenter-Z.radius,Y.xCenter-Y.radius);
  const maxX=Math.min(Z.xCenter+Z.radius,Y.xCenter+Y.radius);
  for(const fraction of [0.17,0.51,0.83]){
    const x=minX+(maxX-minX)*fraction;
    for(const sy of [-1,1])for(const sz of [-1,1]){
      const y=radialCoordinate(x,Z.radius,Z.xCenter,Z.yCenter,sy);
      const z=radialCoordinate(x,Y.radius,Y.xCenter,Y.zCenter,sz);
      const independentlyInside=y>=Y.yMin-1e-8&&y<=Y.yMax+1e-8&&
        z>=Z.zMin-1e-8&&z<=Z.zMax+1e-8;
      const matching=r.branches.filter(b=>b.signY===sy&&b.signZ===sz&&
        x>b.xRange[0]+1e-8&&x<b.xRange[1]-1e-8);
      assert.equal(matching.length,independentlyInside?1:0,
        'analytic branch coverage disagrees with independent bisection');
    }
  }
}

test('fast-check/C3: general radii, translations and mm scaling retain four analytic sheets',()=>{
  fc.assert(fc.property(dimensions,p=>{
    const m=model(p),r=solve({input:m,revision:7});
    verifyRegular(r,m,[[-1,-1],[-1,1],[1,-1],[1,1]]);
  }),settings);
});

test('fast-check/C3: positive finite caps retain only the strictly allowed sheet',()=>{
  fc.assert(fc.property(dimensions,p=>{
    const m=model(p,'positive'),r=solve({input:m,revision:9});
    verifyRegular(r,m,[[1,1]]);
  }),settings);
});

test('fast-check/C3: radial separation or tangency cannot be promoted to a V5 solution',()=>{
  fc.assert(fc.property(dimensions,fc.integer({min:1,max:5}),(p,gap)=>{
    const separated=model(p);
    separated.yCylinder.xCenter=separated.zCylinder.xCenter+
      separated.zCylinder.radius+separated.yCylinder.radius+gap*p.scale;
    const absent=solve({input:separated,revision:11});
    assert.equal(absent.status,'none');
    assert.equal(absent.branchCount,0);
    safetyGate(absent);
    const tangent=model(p);
    tangent.yCylinder.xCenter=tangent.zCylinder.xCenter+
      tangent.zCylinder.radius+tangent.yCylinder.radius;
    const uncertain=solve({input:tangent,revision:11});
    assert.equal(uncertain.status,'degenerate-undetermined');
    assert.equal(uncertain.branchCount,0);
    safetyGate(uncertain);
  }),settings);
});
