'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {validateGeometry}=require('../../core/contracts/geometry.js');
const {validAnalyticCurve3D,atAnalyticCurve3D}=
 require('../../core/geometry/analytic-curve-3d.cjs');
const {deriveGeometryScene}=require('../../core/projection/geometry-scene-views.cjs');
const {compileGeometryScene}=require('../../project/geometry-scene-consumer.cjs');
const {project}=require('../../core/projection/conventions.js');
function given(){
 return {id:'TrueCurve',kind:'analytic-curve',space:'model-3d',unit:'mm',
  data:{parameter:{from:-3,to:3},coordinates:{
   x:{kind:'affine',offset:0,slope:1},
   y:{kind:'signed-circle-radical',center:0,offset:0,radius:5,sign:1},
   z:{kind:'signed-circle-radical',center:1,offset:2,radius:6,sign:-1}
  }}};
}
test('M0 source analytic curve is a true finite continuous equation, never sampled Geometry edges',()=>{
 const g=given(),d=g.data;
 assert.equal(validAnalyticCurve3D(d),true);
 assert.equal(validateGeometry(g).ok,true);
 const scene=deriveGeometryScene({geometry:[g],revision:8,resultId:'AnalyticReview'});
 assert.equal(Object.isFrozen(scene),true);
 assert.equal(scene.objects[0].model.kind,'analytic-curve');
 assert.equal(scene.objects[0].model.data.points,undefined);
 for(const v of ['V','H','W']){
  const rep=scene.objects[0].representations[v];
  assert.equal(rep.kind,'analytic-curve-projection');
  assert.equal(rep.visibility,'undetermined');
  assert.equal(rep.sourceAnalytic3D,true);
  assert.deepEqual(rep.start,project(atAnalyticCurve3D(d,-3))[v]);
  assert.deepEqual(rep.end,project(atAnalyticCurve3D(d,3))[v]);
 }
 const paper=compileGeometryScene(scene);
 assert.equal(paper.paper.filter(x=>x.objectId==='TrueCurve').length,3);
 assert.equal(paper.spatial.filter(x=>x.objectId==='TrueCurve').length,1);
 for(const item of [...paper.paper,...paper.spatial]){
  assert.equal(item.kind,'path');
  assert.equal(item.visibility,'undetermined');
  assert.equal(item.fill,'none');
  assert.equal(item.svgApproximationOnly,true);
  assert.equal(item.sourceAnalytic3D,true);
  assert.ok(item.attrs.d.startsWith('M '));
  assert.equal(item.attrs.d.match(/ L /g)?.length,128);
 }
 assert.equal(paper.proof,'display-only');
 for(const t of [-3,-2,-1,0,1,2,3]){
  const p=atAnalyticCurve3D(d,t);
  assert.ok(Math.abs(p.x*p.x+p.y*p.y-25)<1e-10);
  assert.ok(Math.abs((p.x-1)**2+(p.z-2)**2-36)<1e-10);
 }
});
test('radical endpoint, camera and projection scaling cannot mint a signed engineering curve',()=>{
 const g=given();
 const scene=deriveGeometryScene({geometry:[g],revision:2});
 const first=compileGeometryScene(scene,{camera:{yaw:10,pitch:20}});
 const moved=compileGeometryScene(scene,{camera:{yaw:68,pitch:-12},
  viewTransforms:{V:{origin:{x:320,y:200},scale:3},
   H:{origin:{x:320,y:410},scale:3},W:{origin:{x:620,y:200},scale:3}}});
 assert.notEqual(first.spatial[0].attrs.d,moved.spatial[0].attrs.d);
 assert.equal(first.spatial[0].visibility,'undetermined');
 assert.equal(moved.paper.every(p=>p.visibility==='undetermined'),true);
 assert.equal(scene.revision,2);
 assert.equal(scene.objects[0].representations['3D'].kind,'analytic-curve');
});
test('invalid or forged real domains, formulas and nonfinite values fail closed',()=>{
 for(const bad of [
  {parameter:{from:3,to:-3}},
  {parameter:{from:0,to:100000}},
  {coordinates:{x:{kind:'evil',source:'Function()'}}},
  {coordinates:{y:{kind:'signed-circle-radical',center:0,offset:0,
    radius:1,sign:0}}},
  {coordinates:{z:{kind:'signed-circle-radical',center:1,offset:2,
    radius:6,sign:1,approvedLineStyle:'solid'}}},
  {parameter:{from:-3,to:Infinity}},
  {script:'console.log(1)'}
 ]){
  const g=given(),d={...g.data,...bad};
  assert.equal(validAnalyticCurve3D(d),false);
  assert.equal(validateGeometry({...g,data:d}).ok,false);
 }
 assert.throws(()=>atAnalyticCurve3D(given().data,4),/parameter/);
 assert.throws(()=>deriveGeometryScene({geometry:[{...given(),space:'drawing-2d'}],
  revision:1}),/不合法/);
});
