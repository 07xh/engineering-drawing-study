'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {evaluateFiniteOrthogonalCylinderIntersection: solve} =
  require('../../engines/spatial/intersections/finite-orthogonal-cylinders.cjs');

function input(dx=0,dy=0,dz=0) {
  return {
    kind:'finite-orthogonal-cylinder-intersection',
    sourceConfirmed:true,unit:'mm',
    zCylinder:{radius:12,xCenter:dx,yCenter:dy,zMin:dz-18,zMax:dz+18},
    yCylinder:{radius:9,xCenter:dx+2,zCenter:dz,yMin:dy-17,yMax:dy+17}
  };
}
function sortedEndpoints(result) {
  return result.branches.flatMap(b=>b.endpoints.map(e=>e.point))
    .map(p=>[p.x,p.y,p.z])
    .sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);
}
test('C3: rigid translations preserve finite analytic topology and residuals',()=>{
  const base=solve({input:input(),revision:7});
  assert.equal(base.status,'scoped-analytic-ready');
  assert.ok(base.branchCount>0);
  for(const shift of [[23,-31,17],[-110,65,-42]]) {
    const moved=solve({input:input(...shift),revision:7});
    assert.equal(moved.status,base.status);
    assert.equal(moved.branchCount,base.branchCount);
    assert.equal(moved.projectionWitnessCount,base.projectionWitnessCount);
    assert.equal(moved.analyticallyCompleteWithinScope,true);
    assert.equal(moved.verifiedCapClipping,true);
    assert.equal(moved.officialLineStylesVerified,false);
    assert.equal(moved.v5Ready,false);
    assert.ok(moved.maxScaledResidual<=1e-9);
    const expected=sortedEndpoints(base), actual=sortedEndpoints(moved);
    assert.equal(actual.length,expected.length);
    for(let i=0;i<expected.length;i++)
      for(let axis=0;axis<3;axis++)
        assert.ok(Math.abs(actual[i][axis]-expected[i][axis]-shift[axis])<1e-6);
  }
});
test('C3: axial separation remains empty after rigid translation',()=>{
  const source=input();
  source.zCylinder.zMin=40;
  source.zCylinder.zMax=60;
  const base=solve({input:source,revision:8});
  assert.equal(base.status,'none');
  const moved=input(37,-15,29);
  moved.zCylinder.zMin=69;
  moved.zCylinder.zMax=89;
  const result=solve({input:moved,revision:8});
  assert.equal(result.status,'none');
  assert.equal(result.branchCount,0);
  assert.equal(result.v5Ready,false);
});
