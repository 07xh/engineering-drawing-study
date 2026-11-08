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
  state([part('box',{on:false})]),
  state([part('box',{hidden:true})])
 ];
 for(const v of variants)
  assert.throws(()=>Adapter.previewExactScene(serialize(v)),'must reject unsupported source');
 const fake=Bridge.documentFromState(state([p]));
 fake.verification='verified';
 assert.throws(()=>Adapter.previewExactScene(JSON.stringify(fake)));
});

test('real existing coordinator keeps imported geometry pending until explicit user confirmation',()=>{
 const {createCoordinator}=require('../../project/project-coordinator.cjs');
 const {createUnifiedProjectSession}=require('../../project/unified-workbench-session.cjs');
 const incoming=Adapter.draftProjectFromConeLab(
  serialize(state([part('box',{x:-20}),part('box',{x:20})])),
  {projectId:'ProjectReview1'});
 const coordinator=createCoordinator(incoming.project);
 const session=createUnifiedProjectSession();
 coordinator.attachSolver(session);
 assert.equal(coordinator.canExport(),false);
 const initialRevision=coordinator.snapshot().revision;
 coordinator.confirmCondition('geo_ConePart1');
 assert.equal(coordinator.snapshot().revision,initialRevision+1);
 assert.equal(coordinator.snapshot().conditions.filter(c=>c.confirmed).length,1);
 coordinator.confirmCondition('geo_ConePart2');
 assert.equal(coordinator.snapshot().conditions.filter(c=>c.confirmed).length,2);
 const result=session.solve();
 assert.equal(result.kind,'composition-evidence');
 assert.equal(result.verified,false);
 assert.equal(result.clock,null);
 assert.equal(coordinator.canExport(),false);
 assert.equal(result.scene.objects.length,2);
 assert.equal(result.scene.evidence.visibility,'undetermined');
 coordinator.dispose();
});
test('new importing control is attached to the original workbench instead of second page',()=>{
 const fs=require('node:fs');
 const path=require('node:path');
 const home=fs.readFileSync(path.resolve(__dirname,'../../ui-next/home.cjs'),'utf8');
 const entry=fs.readFileSync(path.resolve(__dirname,'../../project/unified-workbench-entry.cjs'),'utf8');
 assert.match(home,/id="v8-conelab-file"/);
 assert.match(home,/id="v8-conelab-status"/);
 assert.match(entry,/draftProjectFromConeLab\(await file\.text\(\)/);
 assert.match(entry,/await store\.saveProject\(candidate\.project\)/);
 assert.match(entry,/mount\(candidate\.project\)/);
});

test('Cone Lab triangular pyramid is the exact four-corner source polyhedron, not faceted curved geometry',()=>{
 const tri={k:'pyr3',type:'horiz',ang:0,x:0,y:0,z:0,r:20,h:36,on:true,open:true,_id:99};
 const g=Adapter.sourcePyramidMesh(tri,0);
 assert.equal(g.id,'ConePartSrc_99');
 assert.equal(validateGeometry(g).ok,true);
 assert.equal(Object.keys(g.data.points).length,4);
 assert.equal(g.data.edges.length,6);
 assert.equal(g.data.faces.length,4);
 assert.deepEqual(g.data.points.Apex,{x:0,y:0,z:18});
 const base=['Base0','Base1','Base2'].map(id=>g.data.points[id]);
 for(const point of base)close(point.z,-18);
 // The equal W depth must be a mathematically identical coordinate, not
 // independently rounded cos(120°) and cos(240°) approximations.
 assert.equal(base[1].y,base[2].y);
 assert.deepEqual(project(base[1]).W,project(base[2]).W);
 for(const point of base)close(Math.hypot(point.x,point.y),20);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 close(distance(base[0],base[1]),20*Math.sqrt(3));
 close(distance(base[1],base[2]),20*Math.sqrt(3));
 close(distance(base[2],base[0]),20*Math.sqrt(3));
 for(const vertex of base)close(distance(vertex,g.data.points.Apex),
  Math.hypot(20,36));
 const converted=Adapter.previewExactScene(serialize(state([tri,part('box')])) ,{revision:7});
 assert.equal(converted.scene.objects.length,2);
 assert.equal(converted.scene.evidence.visibility,'undetermined');
 assert.equal(compileGeometryScene(converted.scene).proof,'display-only');
});
test('pyramid uses original Cone Lab normal quaternion and no arbitrary reflection',()=>{
 const base={k:'pyr3',type:'horiz',ang:0,x:3,y:5,z:7,r:12,h:25,on:true};
 const front=Adapter.sourcePyramidMesh({...base,type:'frontal'},0);
 const top=Adapter.sourcePyramidMesh(base,0);
 const apexSource=Adapter.toSourceXYZ(front.data.points.Apex);
 close(apexSource.x,3);
 close(apexSource.y,5);
 close(apexSource.z,7+25/2);
 const topApex=Adapter.toSourceXYZ(top.data.points.Apex);
 close(topApex.y,5+25/2);
});
test('upstream source IDs preserve part identities across reordering and reject collision',()=>{
 const p1=part('cube',{_id:'body_A'}),p2=part('box',{x:49,_id:'body_B'});
 const a=Adapter.previewExactScene(serialize(state([p1,p2])));
 const b=Adapter.previewExactScene(serialize(state([p2,p1])));
 const ids=o=>o.geometry.map(g=>g.id).sort();
 assert.deepEqual(ids(a),['ConePartSrc_body_A','ConePartSrc_body_B']);
 assert.deepEqual(ids(b),ids(a));
 const byId=scene=>Object.fromEntries(scene.geometry.map(g=>[g.id,g.data]));
 assert.deepEqual(byId(a),byId(b));
 assert.throws(()=>Adapter.previewExactScene(
  serialize(state([{...p1,_id:3},{...p2,_id:3}]))),/来源 ID 重复/);
});
test('an imported triangular pyramid remains pending in the same coordinator and does not certify stroke',()=>{
 const pyramid={k:'pyr3',type:'horiz',ang:0,x:0,y:0,z:0,r:17,h:24,on:true,_id:7};
 const candidate=Adapter.draftProjectFromConeLab(
  serialize(state([pyramid,part('box',{x:30})])),{projectId:'ProjectPyramid1'});
 assert.equal(candidate.project.objects.length,2);
 assert.equal(candidate.project.conditions[0].value.geometry.importedFromConeLab.sourceKind,'pyr3');
 assert.ok(candidate.project.conditions.every(c=>c.confirmed===false));
 const {createCoordinator}=require('../../project/project-coordinator.cjs');
 const {createUnifiedProjectSession}=require('../../project/unified-workbench-session.cjs');
 const c=createCoordinator(candidate.project);
 const session=createUnifiedProjectSession();c.attachSolver(session);
 c.confirmCondition('geo_ConePartSrc_7');
 c.confirmCondition('geo_ConePart2');
 const out=session.solve();
 assert.equal(out.verified,false);
 assert.equal(out.clock,null);
 assert.equal(c.canExport(),false);
 assert.equal(out.scene.evidence.visibility,'undetermined');
 c.dispose();
});
test('generic C2 prism form cannot overwrite imported oriented mesh or pyramid',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const entry=fs.readFileSync(path.resolve(__dirname,'../../project/unified-workbench-entry.cjs'),'utf8');
 assert.match(entry,/if\(g\.importedFromConeLab\)/);
 assert.match(entry,/if\(chosen&&p\.conditions\.some\(c=>c\.objectId===chosen&&/);
 assert.match(entry,/导入的精确拼装模型禁止用普通长方体表单覆盖/);
});
