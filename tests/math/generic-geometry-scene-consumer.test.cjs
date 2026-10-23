'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {deriveGeometryScene}=require('../../core/projection/geometry-scene-views.cjs');
const {compileGeometryScene,arcPath}=require('../../project/geometry-scene-consumer.cjs');
const P=(x,y,z)=>({x,y,z}),p=(x,y)=>({x,y});
const sheet={origin:p(360,208),scale:5};
const options={sheet,camera:{yaw:0,pitch:25}};
const G=(id,kind,space,data)=>({id,kind,space,unit:'mm',data});
function mesh(id,dx=0){
 const points={
  a:P(dx,0,0),b:P(dx+8,0,0),c:P(dx+8,6,0),d:P(dx,6,0),
  e:P(dx,0,4),f:P(dx+8,0,4),g:P(dx+8,6,4),h:P(dx,6,4)
 };
 return G(id,'mesh','model-3d',{
  points,edges:[['a','b'],['b','c'],['c','d'],['d','a'],
   ['e','f'],['f','g'],['g','h'],['h','e'],
   ['a','e'],['b','f'],['c','g'],['d','h']],
  faces:[['a','b','c','d'],['e','f','g','h'],['a','b','f','e'],
   ['b','c','g','f'],['c','d','h','g'],['d','a','e','h']]
 });
}
function scene(geometry){
 return deriveGeometryScene({geometry,revision:18,resultId:'ActualMath'});
}
test('many planar objects share one geometry consumer, with true circles and both CW/CCW arcs',()=>{
 const source=[
  G('A','point','drawing-2d',p(2,3)),
  G('S','segment','drawing-2d',{start:p(-10,0),end:p(12,0)}),
  G('L','line','drawing-2d',{point:p(2,2),direction:p(1,2)}),
  G('C','circle','drawing-2d',{center:p(5,7),radius:4}),
  G('CW','arc','drawing-2d',{center:p(1,2),radius:3,startAngle:120,endAngle:-40,direction:'cw'}),
  G('CCW','arc','drawing-2d',{center:p(-5,-5),radius:2,startAngle:0,endAngle:230,direction:'ccw'})
 ];
 const input=scene(source),before=JSON.stringify(input);
 const a=compileGeometryScene(input,options);
 assert.equal(a.objectCount,6);
 assert.equal(a.paper.length,6);
 assert.equal(a.spatial.length,0,'drawing-2d never manufactures 3D');
 assert.deepEqual(a.paper.map(x=>x.objectId),['A','S','L','C','CW','CCW']);
 assert.deepEqual(a.paper.map(x=>x.kind),['circle','line','line','circle','path','path']);
 assert.equal(a.paper.find(x=>x.objectId==='C').attrs.r,20);
 assert.ok(a.paper.find(x=>x.objectId==='CW').attrs.d.includes(' 0 0 '));
 assert.ok(a.paper.find(x=>x.objectId==='CCW').attrs.d.includes(' 1 0 '));
 assert.equal(a.paper.find(x=>x.objectId==='L').viewportOnly,true);
 assert.equal(JSON.stringify(input),before,'renderer may not mutate canonical math');
 assert.equal(Object.isFrozen(input.objects[0].model),true);
});
test('one scene projects many independent 3D points, segments and meshes with first-angle V/H/W',()=>{
 const data=[
  G('P1','point','model-3d',P(3,4,5)),
  G('P2','point','model-3d',P(-2,8,1)),
  G('Edge','segment','model-3d',{start:P(0,0,0),end:P(5,6,7)}),
  mesh('Cube1'),mesh('Cube2',16)
 ];
 const math=scene(data),before=JSON.stringify(math);
 const a=compileGeometryScene(math,options);
 assert.equal(a.objectCount,5);
 assert.equal(a.paper.filter(v=>v.objectId==='Cube1').length,36);
 assert.equal(a.paper.filter(v=>v.objectId==='Cube2').length,36);
 assert.equal(a.spatial.filter(v=>v.objectId==='Cube1').length,12);
 assert.equal(a.spatial.filter(v=>v.objectId==='Cube2').length,12);
 for(const view of ['V','H','W']){
  const pt=a.paper.find(x=>x.objectId==='P1'&&x.view===view);
  assert.ok(pt,'missing first-angle view '+view);
  const expected={
   V:{x:360-3*a.paperTransform.scale,y:208-5*a.paperTransform.scale},
   H:{x:360-3*a.paperTransform.scale,y:208+4*a.paperTransform.scale},
   W:{x:360+4*a.paperTransform.scale,y:208-5*a.paperTransform.scale}
  }[view];
  assert.equal(pt.attrs.cx,expected.x);
  assert.equal(pt.attrs.cy,expected.y);
 }
 assert.equal(a.paper.filter(x=>x.visibility==='undetermined').length,72);
 assert.equal(a.spatial.filter(x=>x.visibility==='undetermined').length,24);
 assert.equal(a.paper.every(x=>x.objectId!==null),true);
 assert.equal(a.proof,'display-only');
 assert.equal(JSON.stringify(math),before);
 const b=compileGeometryScene(math,{...options,camera:{yaw:72,pitch:-30},
  selectedObjectId:'Cube2'});
 assert.deepEqual(b.paper,a.paper,'camera movement cannot change the mathematical paper');
 assert.notDeepEqual(b.spatial,a.spatial);
 assert.equal(b.selectedObjectId,'Cube2');
 assert.equal(b.revision,18);
});
test('single 3D line and exact collapsed edge remain explicit, not invented contours',()=>{
 const math=scene([
  G('Axis','line','model-3d',{point:P(0,0,0),direction:P(0,1,0)}),
  G('Ray','segment','model-3d',{start:P(1,0,0),end:P(1,0,8)})
 ]);
 const a=compileGeometryScene(math,options);
 assert.equal(a.paper.filter(x=>x.objectId==='Axis').length,3);
 assert.equal(a.paper.find(x=>x.objectId==='Axis'&&x.view==='V').collapsedFrom,'line');
 assert.equal(a.paper.find(x=>x.objectId==='Axis'&&x.view==='H').viewportOnly,true);
 assert.equal(a.paper.find(x=>x.objectId==='Ray'&&x.view==='H').collapsedFrom,'segment');
});
test('full-turn model arc is rendered as two true directed SVG arcs, not an empty path',()=>{
 const math=scene([G('Round','arc','drawing-2d',
  {center:p(1,2),radius:3,startAngle:0,endAngle:360,direction:'ccw'})]);
 const a=compileGeometryScene(math,options);
 assert.equal(a.paper.filter(x=>x.kind==='path').length,1);
 assert.equal((a.paper[0].attrs.d.match(/ A /g)||[]).length,2);
 assert.ok(a.paperBounds.width>=300);
 assert.ok(arcPath(p(100,100),10,0,-360).includes(' A '));
});
test('invalid, unsupported, stale and hidden geometry remain fail-closed',()=>{
 const base=scene([G('P','point','model-3d',P(1,2,3))]);
 assert.throws(()=>compileGeometryScene({...base,schema:'forged'},options),/正式数学/);
 assert.throws(()=>compileGeometryScene(base,{...options,
  camera:{yaw:Infinity,pitch:0}}),/相机/);
 assert.throws(()=>compileGeometryScene(base,{...options,
  hiddenObjectIds:['A','B']}),/门禁/);
 const missing=compileGeometryScene(base,{...options,hiddenObjectIds:['P']});
 assert.equal(missing.paper.length,0);assert.equal(missing.spatial.length,0);
 assert.equal(missing.revision,18,'hiding display geometry is not a solver revision');
});
test('infinite plane is not converted into a finite fake surface',()=>{
 const math=scene([G('Infinite','plane','model-3d',
  {normal:P(0,0,1),offset:3})]);
 const a=compileGeometryScene(math,options);
 assert.equal(a.paper.length,0);assert.equal(a.spatial.length,0);
 assert.ok(a.warnings.some(x=>x.includes('Infinite')));
});
