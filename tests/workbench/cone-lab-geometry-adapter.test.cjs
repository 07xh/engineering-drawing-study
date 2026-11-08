'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Bridge=require('../../labs/cone-lab/model-bridge.js');
const {validateGeometry}=require('../../core/contracts/geometry.js');
const {project}=require('../../core/projection/conventions.js');
const {validateProject}=require('../../project/project-coordinator.cjs');
const {compileGeometryScene}=require('../../project/geometry-scene-consumer.cjs');
const Adapter=require('../../project/cone-lab-geometry-adapter.cjs');
const close=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,String(a)+' differs from '+String(b));
const state=parts=>({shape:'lab',flipped:false,faces:[],cyls:[],pickSel:{},parts});
const part=(k,overrides={})=>({
 k,type:'horiz',ang:0,x:7,y:11,z:13,on:true,open:true,
 ...(k==='box'?{w:8,h:10,d:12}:{a:8}),...overrides
});
const serialize=s=>JSON.stringify(Bridge.documentFromState(s));
test('first-angle observer rays come from front/top/source right, not Cone Lab left',()=>{
 assert.deepEqual(Adapter.OBSERVER_SOURCE,{V:{x:0,y:0,z:1},
   H:{x:0,y:1,z:0},W:{x:1,y:0,z:0}});
 assert.deepEqual(Adapter.toDraftXYZ({x:5,y:7,z:11}),{x:5,y:-11,z:7});
 assert.deepEqual(Adapter.toSourceXYZ({x:5,y:-11,z:7}),{x:5,y:7,z:11});
 assert.deepEqual(project(Adapter.toDraftXYZ({x:5,y:7,z:11})),{
   V:{u:5,v:7},H:{u:5,v:-11},W:{u:-11,v:7}});
});
test('positive Y default box/cube has exact eight vertices twelve edges six faces and fixed identity',()=>{
 const src=state([part('box'),part('cube',{x:27,y:15,z:-19})]);
 const converted=Adapter.previewExactScene(serialize(src),{revision:9});
 assert.equal(converted.scene.objects.length,2);
 assert.equal(converted.geometry[0].id,'ConePart1');
 assert.equal(converted.geometry[1].id,'ConePart2');
 assert.equal(converted.scene.revision,9);
 assert.equal(converted.scene.evidence.visibility,'undetermined');
 assert.equal(converted.scene.evidence.math,'requires-canonical-solve-result');
 assert.equal(converted.scene.evidence.v5,'requires-verified-construction-intent');
 const g=converted.geometry[0];
 assert.equal(Object.keys(g.data.points).length,8);
 assert.equal(g.data.edges.length,12);
 assert.equal(g.data.faces.length,6);
 assert.deepEqual(g.data.points.V000,{x:3,y:-7,z:6});
 assert.deepEqual(g.data.points.V111,{x:11,y:-19,z:16});
 assert.equal(validateGeometry(g).ok,true);
 const rendered=compileGeometryScene(converted.scene);
 assert.equal(rendered.proof,'display-only');
 assert.equal(rendered.objectCount,2);
 assert.ok(rendered.paper.some(p=>p.visibility==='undetermined'));
 assert.equal(rendered.spatial.filter(p=>p.kind==='line').length,24);
});
test('rotation maps source local up to all six Cone Lab plane normals',()=>{
 const p=part('box',{x:0,y:0,z:0});
 for(const [type,ang,n] of [
  ['horiz',0,[0,1,0]],['frontal',0,[0,0,1]],['lat',0,[1,0,0]],
  ['fv',45,[Math.SQRT1_2,Math.SQRT1_2,0]],
  ['pv',30,[Math.cos(Math.PI/6),0,0.5]],
  ['lv',60,[0,0.5,Math.sin(Math.PI/3)]],
  ['fv',180,[0,-1,0]]
 ]){
  const q=Adapter.sourcePartQuaternion({...p,type,ang});
  close(Math.hypot(...q),1);
  const g=Adapter.sourceBoxMesh({...p,type,ang},0);
  const a=g.data.points.V000,b=g.data.points.V010;
  const d=Adapter.toSourceXYZ({x:b.x-a.x,y:b.y-a.y,z:b.z-a.z});
  const len=Math.hypot(d.x,d.y,d.z);
  close(d.x/len,n[0]);close(d.y/len,n[1]);close(d.z/len,n[2]);
 }
});
test('creates validated separate local composition project with NO confirmed conditions or V5',()=>{
 const result=Adapter.draftProjectFromConeLab(
   serialize(state([part('box'),part('cube')])),
   {projectId:'ProjectCone1'});
 assert.equal(result.project.task,'composition');
 assert.equal(result.project.revision,0);
 assert.equal(result.project.objects.length,2);
 assert.equal(result.project.conditions.length,2);
 assert.ok(result.project.conditions.every(c=>c.confirmed===false));
 assert.ok(result.project.conditions.every(c=>c.value.type==='manual-geometry'));
 assert.equal(result.project.source.imageId,null);
 assert.equal(validateProject(result.project).ok,true);
 assert.equal(result.scene.evidence.visibility,'undetermined');
 assert.equal(result.scene.resultId,null);
});
test('rejects unsupported shape, cutters, cut planes, hidden parts, and forged file proofs',()=>{
 const p=part('box');
 const variants=[
  {...state([p]),shape:'cone'},
  {...state([p]),flipped:true},
  {...state([p]),faces:[{type:'horiz',ang:0,x:0,y:0,z:0}]},
  {...state([p]),cyls:[{shape:'cyl',type:'frontal',ang:0,x:0,y:0,z:0,r:8,len:40}]},
  {...state([p]),pickSel:{a:false}},
  state([part('cyl',{r:8,h:20})]),
  state([part('pyr3',{r:8,h:20})]),
  state([part('box',{on:false})]),
  state([part('box',{hidden:true})])
 ];
 for(const v of variants)
  assert.throws(()=>Adapter.previewExactScene(serialize(v)),'must reject unsupported source');
 const fake=Bridge.documentFromState(state([p]));
 fake.verification='verified';
 assert.throws(()=>Adapter.previewExactScene(JSON.stringify(fake)));
});
