'use strict';
// Independent M1 -> shared first-angle Scene -> single V7 consumer regressions.
// Piecewise edges are display geometry, never an analytic or visibility proof.
const test=require('node:test'),assert=require('node:assert/strict');
const {validateGeometry}=require('../../core/contracts/geometry.js');
const {deriveGeometryScene,projectSelectionLinks}=
 require('../../core/projection/geometry-scene-views.cjs');
const {compileGeometryScene}=require('../../project/geometry-scene-consumer.cjs');
const {project,VIEWS}=require('../../core/projection/conventions.js');
const G=(id,space,points,closed=false)=>({
 id,kind:'polyline',space,unit:'mm',data:{points,closed}
});
const pt=(x,y,z)=>({x,y,z});
const p2=(x,y)=>({x,y});
const opts={sheet:{origin:{x:360,y:208},scale:5},camera:{yaw:0,pitch:25}};
test('closed finite-section perimeter keeps exact segment order in one V/H/W and 3D scene',()=>{
 const points=[pt(0,0,0),pt(10,0,0),pt(10,0,5)];
 const source=G('Section1','model-3d',points,true);
 const before=JSON.stringify(source);
 const scene=deriveGeometryScene({geometry:[source],revision:11,
  resultId:'ScopedGeometry'});
 assert.equal(scene.objects.length,1);
 const obj=scene.objects[0];
 assert.equal(obj.model.kind,'polyline');
 for(const view of VIEWS){
  const rep=obj.representations[view];
  assert.equal(rep.kind,'polyline-projection');
  assert.equal(rep.closed,true);
  assert.equal(rep.spans.length,3);
  assert.equal(rep.visibility,'undetermined');
  assert.equal(rep.topology,'ordered-piecewise-linear');
  rep.points.forEach((uv,i)=>assert.deepEqual(uv,project(points[i])[view]));
  assert.deepEqual(rep.spans.map(x=>[x.fromIndex,x.toIndex]),[[0,1],[1,2],[2,0]]);
 }
 assert.equal(obj.representations.H.spans[1].projection.kind,'point',
  'a vertical spatial segment has collapsed H projection, not a missing edge');
 const view=compileGeometryScene(scene,opts);
 assert.equal(view.paper.filter(x=>x.objectId==='Section1').length,9);
 assert.equal(view.spatial.filter(x=>x.objectId==='Section1').length,3);
 assert.ok(view.paper.every(x=>x.visibility==='undetermined'));
 assert.ok(view.spatial.every(x=>x.visibility==='undetermined'));
 assert.ok(view.paper.some(x=>x.kind==='circle'&&x.collapsedFrom==='segment'));
 assert.deepEqual(JSON.parse(projectSelectionLinks(scene)[0].representations.V.entityKey),['Section1','V']);
 assert.equal(scene.evidence.v5,'requires-verified-construction-intent');
 assert.equal(Object.hasOwn(scene,'verified'),false);
 assert.ok(Object.isFrozen(obj.representations.H.spans[0]));
 assert.equal(JSON.stringify(source),before,'render/projection must not mutate source');
});
test('mixed arbitrary planar and spatial polylines reuse same consumer and keep 2D pure',()=>{
 const planar=G('Contour','drawing-2d',[p2(1,1),p2(4,1),p2(4,3)]);
 const spatial=G('CurveEdges','model-3d',
  [pt(1,2,3),pt(5,8,9)],false);
 const scene=deriveGeometryScene({geometry:[planar,spatial],revision:12,branchId:'A1'});
 assert.equal(scene.objects[0].representations['3D'],null);
 assert.equal(scene.objects[0].representations.V,null);
 assert.equal(scene.objects[1].representations.V.spans.length,1);
 const image=compileGeometryScene(scene,opts);
 assert.equal(image.paper.filter(x=>x.objectId==='Contour').length,2);
 assert.equal(image.spatial.filter(x=>x.objectId==='Contour').length,0);
 assert.equal(image.paper.filter(x=>x.objectId==='CurveEdges').length,3);
 assert.equal(image.spatial.filter(x=>x.objectId==='CurveEdges').length,1);
 const camera=compileGeometryScene(scene,{...opts,camera:{yaw:60,pitch:-15}});
 assert.deepEqual(camera.paper,image.paper,'camera must not recompute model or first-angle projections');
 assert.notDeepEqual(camera.spatial,image.spatial);
});
test('unsupported/degenerate polylines reject before any displayed or certified scene',()=>{
 const valid=G('Line','model-3d',[pt(0,0,0),pt(0,0,4)]);
 const invalid=[
  G('None','model-3d',[]),
  G('ClosedTwo','model-3d',[pt(0,0,0),pt(1,0,0)],true),
  G('Duplicate','model-3d',[pt(0,0,0),pt(0,0,0)]),
  G('DuplicatedClosure','model-3d',[pt(0,0,0),pt(1,0,0),pt(0,0,0)],true),
  G('Overflow','model-3d',[pt(-1e308,0,0),pt(1e308,0,0)]),
  G('NotFinite','model-3d',[pt(0,0,0),pt(NaN,1,2)]),
  {...valid,data:{...valid.data,verified:true}},
  {...valid,data:{points:valid.data.points,closed:'yes'}},
  {...valid,data:{points:Array.from({length:2049},(_,i)=>pt(i,0,0)),closed:false}}
 ];
 for(const g of invalid){
  assert.equal(validateGeometry(g).ok,false,g.id);
  assert.throws(()=>deriveGeometryScene({geometry:[g],revision:1}),/不合法/);
 }
 assert.equal(validateGeometry(valid).ok,true);
});
test('changing polyline geometry requires a new scene revision; neither scene grants V5 proof',()=>{
 const source=G('Perimeter','model-3d',[pt(1,2,3),pt(4,5,6)]);
 const a=deriveGeometryScene({geometry:[source],revision:1});
 const b=deriveGeometryScene({geometry:[G('Perimeter','model-3d',
  [pt(1,2,3),pt(4,5,7)])],revision:2});
 assert.equal(a.revision,1);assert.equal(b.revision,2);
 assert.notDeepEqual(a.objects[0].model,b.objects[0].model);
 assert.equal(b.evidence.visibility,'undetermined');
 assert.equal(b.evidence.v5,'requires-verified-construction-intent');
 assert.equal(b.objects[0].representations.H.visibility,'undetermined');
});
