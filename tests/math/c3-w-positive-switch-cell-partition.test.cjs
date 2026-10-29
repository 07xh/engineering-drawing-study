'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {partitionC3WDirectionalOpenIntervals:partition,
 auditC3SelectedBooleanVHWOpenRays:audit}=
 require('../../workbench/c3-selected-boolean-vhw-open-rays.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('W center one ULP from an endpoint still creates an independent signed open cell',()=>{
 const eps=Number.EPSILON,range=[1,1+2*eps],z=1+eps,y=-5;
 const rows=partition(range,z,y);
 assert.equal(rows.length,2);
 assert.deepEqual(rows.map(x=>x.xOpenRange),[[1,z],[z,range[1]]]);
 assert.deepEqual(rows.map(x=>[
  x.zCylinderOutwardRaySign,x.yCylinderOutwardRaySign
 ]),[[-1,1],[1,1]]);
 assert.ok(rows.every(x=>Object.isFrozen(x)&&Object.isFrozen(x.xOpenRange)));
});
test('subnormal positive interval is never swallowed by midpoint rounding or a radius tolerance',()=>{
 const tiny=Number.MIN_VALUE;
 const rows=partition([-tiny,1],0,2);
 assert.deepEqual(rows.map(r=>r.xOpenRange),[[-tiny,0],[0,1]]);
 assert.deepEqual(rows.map(r=>r.zCylinderOutwardRaySign),[-1,1]);
 assert.deepEqual(rows.map(r=>r.yCylinderOutwardRaySign),[-1,-1]);
 assert.ok(rows[0].xOpenRange[1]-rows[0].xOpenRange[0]>0);
});
test('both W radial roots exactly equal give one switch, never a zero-length cell',()=>{
 const rows=partition([-10,10],0,0);
 assert.equal(rows.length,2);
 assert.deepEqual(rows.map(r=>r.xOpenRange),[[-10,0],[0,10]]);
 assert.deepEqual(rows.map(r=>[r.zCylinderOutwardRaySign,
  r.yCylinderOutwardRaySign]),[[-1,-1],[1,1]]);
});
test('W source x-center coinciding with a branch endpoint does not invent a new cell',()=>{
 assert.deepEqual(partition([0,10],0,10).map(r=>r.xOpenRange),[[0,10]]);
 assert.deepEqual(partition([0,10],0,10).map(r=>[
  r.zCylinderOutwardRaySign,r.yCylinderOutwardRaySign]),[[1,-1]]);
 assert.deepEqual(partition([-10,0],0,0).map(r=>[
  r.zCylinderOutwardRaySign,r.yCylinderOutwardRaySign]),[[-1,-1]]);
 assert.deepEqual(partition([0,10],-1,11).map(r=>r.xOpenRange),[[0,10]]);
});
test('positive binary64 root interval at very large coordinates still needs event splitting',()=>{
 const base=1e200,step=base*Number.EPSILON;
 const center=base+step,end=center+step;
 assert.ok(center>base&&end>center);
 const rows=partition([base,end],center,base-1e199);
 assert.equal(rows.length,2);
 assert.deepEqual(rows.map(x=>x.zCylinderOutwardRaySign),[-1,1]);
});
test('nonfinite, reversed or collapsed x intervals must fail closed',()=>{
 for(const [range,a,b] of [
  [[0,0],0,0],[[1,0],0,0],[[0,Infinity],0,0],
  [[0,1],Number.NaN,0],[[0,1],0,Infinity]
 ])assert.throws(()=>partition(range,a,b),/strict positive M3 x-domain/);
});
test('current real finite-cylinder W Boolean rays remain source-bound and contain no hidden root',()=>{
 const source=model();
 for(const operation of ['union','intersection']){
  const proof=audit({input:source,revision:37,solidOperation:operation});
  assert.equal(proof.status,'scoped-three-view-regular-open-ray-theorem');
  assert.equal(proof.undeterminedCount,0);
  const w=proof.intervals.filter(x=>x.view==='W'&&
   x.sourceKind==='analytic-curve');
  assert.ok(w.length>0);
  for(const row of w){
   const [lo,hi]=row.openParameterRange;
   assert.ok(hi>lo);
   assert.ok(!(lo<source.zCylinder.xCenter&&source.zCylinder.xCenter<hi));
   assert.ok(!(lo<source.yCylinder.xCenter&&source.yCylinder.xCenter<hi));
   assert.equal(row.zCylinderOutwardRaySign,
    hi<=source.zCylinder.xCenter?-1:1);
   assert.equal(row.yCylinderOutwardRaySign,
    hi<=source.yCylinder.xCenter?-1:1);
   assert.equal(row.switchingPointsAndEndpointsCertified,false);
   assert.equal(row.standardLineStyle,'undetermined');
   assert.equal(row.finalV5StrokeAuthorized,false);
  }
  assert.equal(proof.finalV5CurveAuthorized,false);
 }
});
