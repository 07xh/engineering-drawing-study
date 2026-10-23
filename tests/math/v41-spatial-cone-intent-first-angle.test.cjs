'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {verifiedConeSpatialIntent:run}=
 require('../../workbench/verified-cone-spatial-intent.cjs');
const {SPATIAL_INTENT_VERSION:VERSION,validateSpatialConstructionIntent:validate}=
 require('../../core/contracts/spatial-construction-intent.js');
const {validateConstructionIntent}=require('../../core/contracts/construction-intent.js');
const P=(x,y,z)=>({x,y,z});
const C=(center=P(0,0,0),r=5,h=10)=>
 ({baseCenter:center,radiusMm:r,heightMm:h,modelUnit:'mm'});
const plane=(q=P(0,0,6),n=P(1,0,3))=>
 ({point:q,normal:n,modelUnit:'mm'});
const sheet={origin:{x:340,y:240},scale:6};
const close=(a,b,tol=1e-7)=>assert.ok(Number.isFinite(a)&&
 Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),
 a+' != '+b);
function accepted(kind,p,revision=7,samples=64){
 return run(C(),p,{kind,revision,sourceConfirmed:true,
  sheetTransform:sheet,samples});
}
test('04 complete cone ellipse is a real analytic 3D Intent, not a 2D/V5 claim',()=>{
 const output=accepted('full-ellipse',plane());
 assert.equal(output.status,'ready');
 assert.equal(output.spatialIntent.schema,VERSION);
 assert.equal(validate(output.spatialIntent).ok,true);
 assert.equal(validateConstructionIntent(output.spatialIntent).ok,false);
 assert.equal(output.mathematicallyVerified,true);
 assert.equal(output.firstAngleCoordinateMappingVerified,true);
 assert.equal(output.firstAngleLayoutVerified,false);
 assert.equal(output.v5StepsReady,false);
 assert.equal(output.timing,null);
 assert.deepEqual(output.constructionSteps,[]);
 assert.equal(output.publicWorkbenchConnected,false);
 assert.equal(output.spatialIntent.operation.geometryKind,'full-ellipse');
 assert.equal(output.spatialIntent.operation.capChord,null);
 assert.equal(output.spatialIntent.operation.analytic.closed,true);
 assert.equal(output.spatialIntent.source.proofLevel,'analytic');
 assert.equal(output.spatialIntent.source.visibilityVerified,false);
 assert.equal(output.spatialIntent.source.sectionInteriorVerified,false);
 assert.equal(output.spatialIntent.source.firstAngleLayoutVerified,false);
 assert.equal(output.spatialIntent.source.v5StepsReady,false);
});
test('03 independent first-angle V/H/W model and paper projections preserve XYZ coordinates',()=>{
 const out=accepted('full-ellipse',plane());
 const samples=out.spatialIntent.operation.samplePoints;
 assert.equal(samples.length,65);
 for(let i=0;i<samples.length;i++){
  const q=samples[i],proj=out.projectionSamples;
  const draw=out.sheetViews;
  close(proj.V[i].u,q.x);close(proj.V[i].v,q.z);
  close(proj.H[i].u,q.x);close(proj.H[i].v,q.y);
  close(proj.W[i].u,q.y);close(proj.W[i].v,q.z);
  close(draw.V[i].x,sheet.origin.x-q.x*sheet.scale);
  close(draw.V[i].y,sheet.origin.y-q.z*sheet.scale);
  close(draw.H[i].x,sheet.origin.x-q.x*sheet.scale);
  close(draw.H[i].y,sheet.origin.y+q.y*sheet.scale);
  close(draw.W[i].x,sheet.origin.x+q.y*sheet.scale);
  close(draw.W[i].y,sheet.origin.y-q.z*sheet.scale);
  close(Math.hypot(q.x,q.y),5*(10-q.z)/10);
  close((q.x-0)*1+(q.z-6)*3,0);
 }
});
test('04 clipped finite-cone arc has independent base chord, not an invented V5 arc',()=>{
 const out=accepted('clipped-ellipse',plane(P(0,0,1)));
 assert.equal(out.status,'ready');
 assert.equal(validate(out.spatialIntent).ok,true);
 const g=out.spatialIntent.operation;
 assert.equal(g.geometryKind,'clipped-ellipse');
 assert.equal(g.analytic.closed,false);
 assert.ok(g.analytic.radialBoundsMm.min<5);
 assert.ok(g.analytic.radialBoundsMm.max>5);
 assert.equal(g.samplePoints.length,65);
 const a=g.capChord.start,b=g.capChord.end;
 close(Math.hypot(a.x-b.x,a.y-b.y),8);
 close(a.z,0);close(b.z,0);
 close(Math.hypot(a.x,a.y),5);close(Math.hypot(b.x,b.y),5);
 assert.equal(out.v5StepsReady,false);
});
test('04 samples count cannot manufacture different analytic proof values',()=>{
 const p=plane(),a=accepted('full-ellipse',p,5,32);
 const b=accepted('full-ellipse',p,5,128);
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.equal(a.spatialIntent.operation.samplePoints.length,33);
 assert.equal(b.spatialIntent.operation.samplePoints.length,129);
 assert.deepEqual(a.spatialIntent.operation.analytic,
  b.spatialIntent.operation.analytic);
});
test('04 normal reversal, translation and scaling preserve accepted math and view mapping',()=>{
 const p=plane();
 const original=accepted('full-ellipse',p,5);
 const reversed=accepted('full-ellipse',plane(P(0,0,6),P(-1,0,-3)),5);
 assert.equal(reversed.status,'ready');
 for(let i=0;i<original.spatialIntent.operation.samplePoints.length;i++)
  for(const k of ['x','y','z'])
   close(original.spatialIntent.operation.samplePoints[i][k],
    reversed.spatialIntent.operation.samplePoints[i][k]);
 const c=C(P(10,-7,2),10,20);
 const shifted=plane(P(10,-7,14),P(1,0,3));
 const out=run(c,shifted,{kind:'full-ellipse',revision:6,
  sourceConfirmed:true,sheetTransform:sheet});
 assert.equal(out.status,'ready');
 for(const k of ['V','H','W'])
  assert.equal(out.sheetViews[k].length,65);
});
test('04 missing reviewed source, unsupported cone, near-apex and invalid revision fail closed',()=>{
 const c=C(),p=plane();
 const no=run(c,p,{sourceConfirmed:false,revision:4});
 assert.equal(no.status,'not-verified');assert.equal(no.spatialIntent,null);
 const invalid=accepted('full-ellipse',plane(P(0,0,10)));
 assert.equal(invalid.status,'not-verified');
 assert.equal(invalid.spatialIntent,null);
 const vertical=accepted('full-ellipse',plane(P(0,0,6),P(1,0,0)));
 assert.equal(vertical.status,'not-verified');
 assert.deepEqual(vertical.sheetViews,null);
 assert.throws(()=>run(c,p,{sourceConfirmed:true,kind:'parabola',
  sheetTransform:sheet}),/unsupported/);
 assert.throws(()=>run(c,p,{sourceConfirmed:true,revision:-1,
  sheetTransform:sheet}),/revision/);
 assert.throws(()=>run(c,p,{sourceConfirmed:true,revision:1,
  sheetTransform:{origin:{x:0,y:0},scale:0}}),/positive/);
});
test('04 source cone and plane are never mutated, stale proof revision is rejected',()=>{
 const c=C(),p=plane(),before=JSON.stringify([c,p]);
 const a=accepted('full-ellipse',p,5);
 const b=run(c,p,{sourceConfirmed:true,revision:9,sheetTransform:sheet});
 assert.equal(a.spatialIntent.source.revision,5);
 assert.equal(b.spatialIntent.source.revision,9);
 assert.equal(JSON.stringify([c,p]),before);
 const forged=structuredClone(a.spatialIntent);
 forged.source.v5StepsReady=true;
 assert.equal(validate(forged).ok,false);
 forged.source.v5StepsReady=false;
 forged.source.revision=6;
 assert.equal(validate(forged).ok,false);
});
test('04 structural validator rejects nonfinite, dimension confusion and fabricated chord',()=>{
 const intent=accepted('full-ellipse',plane()).spatialIntent;
 for(const change of [
  x=>{x.coordinateSpace='model-mm-2d';},
  x=>{x.operation.samplePoints[0].z=NaN;},
  x=>{x.projectionSamples.H[0].u=Infinity;},
  x=>{x.operation.capChord={start:P(0,0,0),end:P(1,0,0)};},
  x=>{x.operation.analytic.denominator.constant=Infinity;},
  x=>{x.source.visibilityVerified=true;}
 ]){
  const wrong=structuredClone(intent);change(wrong);
  assert.equal(validate(wrong).ok,false);
 }
});

test('09 independently check oriented 3D contour closure before downstream animation',()=>{
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const full=accepted('full-ellipse',plane(),11,64);
 assert.equal(full.status,'ready');
 const closed=full.spatialIntent.operation;
 assert.equal(closed.capChord,null);
 assert.ok(distance(closed.samplePoints[0],closed.samplePoints.at(-1))<1e-7,
  'complete analytic ellipse must close at the sampled seam');
 for(const n of [P(1,0,3),P(-1,0,-3)]){
  const clipped=accepted('clipped-ellipse',plane(P(0,0,1),n),12,64);
  assert.equal(clipped.status,'ready');
  const g=clipped.spatialIntent.operation;
  assert.equal(g.analytic.closed,false);
  assert.ok(distance(g.samplePoints.at(-1),g.capChord.start)<1e-7,
   'directed cap chord must START at lateral arc end');
  assert.ok(distance(g.capChord.end,g.samplePoints[0])<1e-7,
   'directed cap chord must END at lateral arc start');
  assert.ok(distance(g.samplePoints[0],g.samplePoints.at(-1))>1,
   'clipped arc must not be misrepresented as a closed lateral curve');
  // A structurally valid Intent is not a mathematical topology proof.
  const reversed=structuredClone(clipped.spatialIntent);
  [reversed.operation.capChord.start,reversed.operation.capChord.end]=
   [reversed.operation.capChord.end,reversed.operation.capChord.start];
  assert.equal(validate(reversed).ok,true);
  assert.notEqual(distance(reversed.operation.capChord.start,g.samplePoints.at(-1))<1e-7,true);
  assert.equal(clipped.spatialIntent.source.v5StepsReady,false);
 }
});
