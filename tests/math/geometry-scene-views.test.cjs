'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {deriveGeometryScene,projectSelectionLinks,SCHEMA}=
  require('../../core/projection/geometry-scene-views.cjs');
const P=require('../../core/projection/conventions.js');
const point=(id,x,y,z)=>({id,kind:'point',space:'model-3d',unit:'mm',data:{x,y,z}});
const segment=(id,a,b)=>({id,kind:'segment',space:'model-3d',unit:'mm',
  data:{start:a,end:b}});
const space={revision:7,resultId:'realResult',branchId:'candidateA'};

function cuboid(){
  const pts=Object.create(null);
  for(const x of [0,20])for(const y of [0,10])for(const z of [0,5])
    pts['p'+x+'_'+y+'_'+z]={x,y,z};
  const all=Object.keys(pts);
  const edges=[];
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
    const a=pts[all[i]],b=pts[all[j]];
    if(['x','y','z'].filter(k=>a[k]!==b[k]).length===1)
      edges.push([all[i],all[j]]);
  }
  const faces=[];
  for(const axis of ['x','y','z'])for(const value of axis==='x'?[0,20]:axis==='y'?[0,10]:[0,5])
    faces.push(all.filter(id=>pts[id][axis]===value));
  return {id:'Solid1',kind:'mesh',space:'model-3d',unit:'mm',
    data:{points:pts,edges,faces}};
}
test('one spatial point feeds all V/H/W first-angle outputs from existing conventions',()=>{
 const original=point('A',12,8,5);
 const scene=deriveGeometryScene({...space,geometry:[original]});
 assert.equal(scene.schema,SCHEMA);
 assert.equal(scene.coordinateUnit,'mm');
 assert.equal(scene.revision,7);
 assert.equal(scene.branchId,'candidateA');
 const representations=scene.objects[0].representations;
 for(const view of P.VIEWS)
   assert.deepEqual(representations[view].at,P.project(original.data)[view]);
 assert.deepEqual(P.aligned({
   V:representations.V.at,H:representations.H.at,W:representations.W.at
 }),{sameX:true,sameHeight:true,sameDepth:true});
 assert.deepEqual(representations['3D'],original);
 assert.equal(scene.evidence.math,'requires-canonical-solve-result');
 assert.equal(scene.evidence.visibility,'undetermined');
});
test('3D segment projection represents collapsed orthographic view honestly',()=>{
 const a={x:2,y:3,z:4},b={x:2,y:3,z:14};
 const scene=deriveGeometryScene({...space,geometry:[segment('Vertical',a,b)]});
 const v=scene.objects[0].representations;
 assert.equal(v.H.kind,'point');
 assert.equal(v.H.collapsedFrom,'segment');
 assert.equal(v.V.kind,'segment');
 assert.equal(v.W.kind,'segment');
 assert.deepEqual(v.H.at,{u:2,v:3});
});
test('a 3D infinite line uses same first-angle point + projected direction rule',()=>{
 const line={id:'AxisY',kind:'line',space:'model-3d',unit:'mm',
   data:{point:{x:1,y:2,z:3},direction:{x:0,y:1,z:0}}};
 const obj=deriveGeometryScene({...space,geometry:[line]}).objects[0];
 assert.equal(obj.representations.V.kind,'point');
 assert.equal(obj.representations.H.kind,'line');
 assert.equal(obj.representations.W.kind,'line');
 assert.deepEqual(obj.representations.W.direction,{u:1,v:0});
});
test('one canonical cuboid mesh preserves eight vertices, twelve edges, six faces across 3 views',()=>{
 const cube=cuboid();
 const scene=deriveGeometryScene({...space,geometry:[cube]});
 const obj=scene.objects[0];
 assert.equal(Object.keys(obj.representations['3D'].data.points).length,8);
 for(const view of P.VIEWS){
   const p=obj.representations[view];
   assert.equal(p.kind,'mesh-projection');
   assert.equal(Object.keys(p.points).length,8);
   assert.equal(p.edges.length,12);
   assert.equal(p.faces.length,6);
   assert.equal(p.visibility,'undetermined');
   for(const [vertexId,xyz] of Object.entries(cube.data.points))
     assert.deepEqual(p.points[vertexId],P.project(xyz)[view]);
 }
 const link=projectSelectionLinks(scene)[0];
 assert.equal(link.objectId,'Solid1');
 assert.deepEqual(JSON.parse(link.representations.V.entityKey),['Solid1','V']);
 assert.deepEqual(JSON.parse(link.representations['3D'].entityKey),['Solid1','3D']);
});
test('unbounded plane remains a mathematical plane without inventing edges or a visible patch',()=>{
 const p={id:'P1',kind:'plane',space:'model-3d',unit:'mm',
   data:{normal:{x:0,y:1,z:1},offset:10}};
 const o=deriveGeometryScene({...space,geometry:[p]}).objects[0];
 for(const v of P.VIEWS){
   assert.equal(o.representations[v].kind,'unbounded-plane');
   assert.equal(o.representations[v].outline,null);
 }
 assert.deepEqual(o.representations['3D'],p);
});
test('pure 2D circle and arc remain strictly planar, never fabricated into 3D',()=>{
 const arc={id:'A2',kind:'arc',space:'drawing-2d',unit:'mm',
   data:{center:{x:5,y:5},radius:10,startAngle:0,endAngle:90,direction:'ccw'}};
 const obj=deriveGeometryScene({...space,geometry:[arc]}).objects[0];
 assert.deepEqual(obj.representations.drawing,arc);
 for(const v of ['V','H','W','3D'])assert.equal(obj.representations[v],null);
 assert.equal(projectSelectionLinks({schema:SCHEMA,objects:[obj]})[0].representations['3D'],null);
});
test('camera or sheet transform never alters the same model-mm scene',()=>{
 const s=deriveGeometryScene({...space,geometry:[point('G1',10,20,30)]});
 const before=JSON.stringify(s);
 for(const t of [{origin:{x:500,y:200},scale:3},{origin:{x:-50,y:98},scale:15}])
  P.toSheet('V',s.objects[0].representations.V.at,t);
 assert.equal(JSON.stringify(s),before);
});
test('duplicate IDs, invalid vectors, nonfinite numbers, unknown fields fail closed',()=>{
 assert.throws(()=>deriveGeometryScene({...space,geometry:[point('A',0,1,2),point('A',1,2,3)]}),/重复/);
 assert.throws(()=>deriveGeometryScene({...space,geometry:[point('bad',0,Infinity,1)]}),/不合法/);
 assert.throws(()=>deriveGeometryScene({...space,geometry:[{id:'Q1',kind:'plane',space:'model-3d',
  data:{normal:{x:0,y:0,z:0},offset:1}}]}),/不合法/);
 assert.throws(()=>deriveGeometryScene({...space,geometry:[point('A',1,2,3)],revision:-1}),/输入版本/);
 assert.throws(()=>deriveGeometryScene({...space,geometry:[point('A',1,2,3)],branchId:'oops?'}),/分支/);
});
test('result revision and branch are preserved without upgrading any mathematical evidence',()=>{
 const base=deriveGeometryScene({geometry:[cuboid()],revision:3,resultId:'solveA',branchId:'case1'});
 const next=deriveGeometryScene({geometry:[cuboid()],revision:4,resultId:'solveB',branchId:'case2'});
 assert.equal(base.objects[0].representations.V.edges.length,next.objects[0].representations.V.edges.length);
 assert.equal(base.branchId,'case1');assert.equal(next.branchId,'case2');
 assert.notEqual(base.revision,next.revision);
 assert.equal(next.evidence.v5,'requires-verified-construction-intent');
 assert.equal(Object.hasOwn(next,'verified'),false);
});
