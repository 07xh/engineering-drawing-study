'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {deriveGeometryScene}=require('../../core/projection/geometry-scene-views.cjs');
const {compileGeometryScene}=require('../../project/geometry-scene-consumer.cjs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const p=(x,y,z)=>({x,y,z});
const G=(id,kind,data)=>({id,kind,space:'model-3d',unit:'mm',data});
const prism=()=>prismMesh({solid:{min:p(0,0,0),max:p(10,12,14)}});
function prepared(revision=41){
 return deriveGeometryScene({revision,resultId:'ConfirmedGeometry',
  geometry:[prism(),G('EdgeA','segment',{start:p(0,0,0),end:p(0,12,0)}),
   G('PolylineA','polyline',{points:[p(0,0,0),p(10,0,0),p(10,0,7)],closed:false}),
   G('DotA','point',p(10,12,14))]});
}
const key=p=>JSON.parse(p.sourceFeatureKey);
const group=(compiled,id)=>[...compiled.paper,...compiled.spatial]
 .filter(p=>p.objectId===id);
test('all 12 source box edges keep a single 3D identity across first-angle V/H/W',()=>{
 const compiled=compileGeometryScene(prepared());
 const boxId=prism().id,edges=group(compiled,boxId);
 assert.equal(edges.length,48);
 const keys=new Set(edges.map(p=>p.sourceFeatureKey));
 assert.equal(keys.size,12);
 for(const k of keys){
  const linked=edges.filter(p=>p.sourceFeatureKey===k);
  assert.deepEqual(linked.map(x=>x.view).sort(),['3D','H','V','W']);
  assert.ok(linked.every(p=>p.visibility==='undetermined'));
  assert.equal(key(linked[0])[0],boxId);
  assert.equal(key(linked[0])[1],'mesh-edge');
 }
 // Different original 3D edges can project to the exact same V line.
 const ink=new Map();
 for(const e of edges.filter(e=>e.view==='V'&&e.kind==='line')){
  const a=e.attrs,coords=[a.x1,a.y1,a.x2,a.y2];
  const k=JSON.stringify(coords[0]<coords[2]||
   (coords[0]===coords[2]&&coords[1]<=coords[3])?
   coords:[coords[2],coords[3],coords[0],coords[1]]);
  if(!ink.has(k))ink.set(k,[]);
  ink.get(k).push(e.sourceFeatureKey);
 }
 assert.ok([...ink.values()].some(keys=>new Set(keys).size>1),
  '2D coincident ink must keep distinct source identities');
});
test('source segments, collapsed projections and polyline spans match 3D without certifying line styles',()=>{
 const a=compileGeometryScene(prepared());
 const edge=group(a,'EdgeA');
 assert.deepEqual(edge.map(x=>x.view).sort(),['3D','H','V','W']);
 assert.equal(new Set(edge.map(x=>x.sourceFeatureKey)).size,1);
 assert.ok(edge.some(x=>x.collapsedFrom==='segment'));
 const spans=group(a,'PolylineA');
 assert.equal(spans.length,8);
 assert.equal(new Set(spans.map(x=>x.sourceFeatureKey)).size,2);
 for(const k of new Set(spans.map(x=>x.sourceFeatureKey)))
  assert.deepEqual(spans.filter(p=>p.sourceFeatureKey===k).map(x=>x.view).sort(),
   ['3D','H','V','W']);
 assert.deepEqual(key(group(a,'DotA')[0]),['DotA','point']);
 assert.equal(a.proof,'display-only');
});
test('camera rotation changes only the 3D depiction, not source identities or engineering status',()=>{
 const s=prepared(),other=compileGeometryScene(s,{camera:{yaw:85,pitch:-20}});
 const original=compileGeometryScene(s);
 const signature=r=>r.map(p=>[p.objectId,p.sourceFeatureKey,p.view,p.visibility]);
 assert.deepEqual(signature(other.paper),signature(original.paper));
 assert.deepEqual(signature(other.spatial),signature(original.spatial));
 assert.deepEqual(other.paper,original.paper);
 assert.notDeepEqual(other.spatial,original.spatial);
 assert.equal(s.revision,41);
 assert.ok([...other.paper,...other.spatial].every(x=>x.sourceFeatureKey));
});
test('2D-only geometry cannot invent corresponding 3D feature',()=>{
 const s=deriveGeometryScene({revision:4,geometry:[
  {id:'PaperOnly',kind:'segment',space:'drawing-2d',unit:'mm',
   data:{start:{x:1,y:2},end:{x:3,y:4}}}
 ]});
 const out=compileGeometryScene(s);
 assert.equal(out.paper.length,1);assert.equal(out.spatial.length,0);
 assert.deepEqual(key(out.paper[0]),['PaperOnly','segment']);
});
