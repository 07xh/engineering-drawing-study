'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Bridge=require('../../labs/cone-lab/model-bridge.js');
const Adapter=require('../../project/cone-lab-geometry-adapter.cjs');
const Solid=require('../../core/geometry/analytic-revolved-solid.cjs');
const {validateGeometry}=require('../../core/contracts/geometry.js');
const {project}=require('../../core/projection/conventions.js');
const {compileGeometryScene}=require('../../project/geometry-scene-consumer.cjs');
const {createCoordinator,validateProject}=
 require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,String(a)+' != '+String(b));
const base=(k,values={})=>({
 k,type:'horiz',ang:0,x:9,y:7,z:11,on:true,open:true,
 r:12,h:30,...(k==='frustum'?{rt:5}:{}),...values
});
const text=parts=>JSON.stringify(Bridge.documentFromState({
 shape:'lab',flipped:false,parts,faces:[],cyls:[],pickSel:{}
}));
test('original cylinder/cone/frustum source remains exact analytic solid, not a fake polygon mesh',()=>{
 const parts=[base('cyl',{_id:51}),base('cone',{x:38,_id:52}),base('frustum',{x:72,_id:53})];
 const out=Adapter.previewExactScene(text(parts),{revision:12});
 assert.equal(out.geometry.length,3);
 for(let i=0;i<3;i++){
  const g=out.geometry[i],d=g.data;
  assert.equal(g.kind,'analytic-solid');
  assert.equal(g.id,'ConePartSrc_'+(51+i));
  assert.equal(g.importedFromConeLab.verification,'unverified-preview');
  assert.equal(g.importedFromConeLab.exactAnalyticSurface,true);
  assert.equal(validateGeometry(g).ok,true);
  assert.equal(Solid.validAnalyticRevolvedSolid(d),true);
  assert.equal(g.data.edges,undefined,'source math cannot become mesh edges');
  assert.equal(d.height,30);
  near(d.radiusBottom,12);
  near(d.radiusTop,[12,0,5][i]);
  assert.equal(d.profile,['cylinder','cone','frustum'][i]);
 }
 assert.deepEqual(out.geometry[0].data.center,{x:9,y:-11,z:7});
 assert.deepEqual(out.geometry[0].data.axis,{x:0,y:0,z:1});
 assert.deepEqual(out.geometry[0].data.radialU,{x:1,y:0,z:0});
 assert.deepEqual(out.geometry[0].data.radialV,{x:0,y:-1,z:0});
 assert.equal(out.scene.evidence.visibility,'undetermined');
 assert.equal(out.scene.evidence.v5,'requires-verified-construction-intent');
});
test('parameter at bottom/top circumference and cone apex matches actual 3D mathematical solid',()=>{
 const g=Adapter.sourceRevolvedSolid(base('cone',{x:0,y:0,z:0,r:8,h:40}),0);
 assert.deepEqual(Solid.centerAt(g.data,0),{x:0,y:0,z:-20});
 assert.deepEqual(Solid.centerAt(g.data,1),{x:0,y:0,z:20});
 assert.deepEqual(Solid.onAnalyticRevolvedSolid(g.data,0,0),{x:8,y:0,z:-20});
 assert.deepEqual(Solid.onAnalyticRevolvedSolid(g.data,1,0),{x:0,y:0,z:20});
 const p=Solid.onAnalyticRevolvedSolid(g.data,0.5,0);
 near(p.x,4);near(p.z,0);
 assert.deepEqual(project(p).V,{u:4,v:0});
 assert.deepEqual(project(p).H,{u:4,v:0});
 assert.deepEqual(project(p).W,{u:0,v:0});
});
test('all six upstream axis modes keep right-handed orthonormal analytic surface basis',()=>{
 const p=base('cyl',{x:0,y:0,z:0});
 for(const [type,ang] of [['horiz',0],['frontal',0],['lat',0],
  ['fv',35],['pv',55],['lv',145]]){
  const g=Adapter.sourceRevolvedSolid({...p,type,ang},0);
  assert.ok(Solid.validAnalyticRevolvedSolid(g.data),type);
  const a=Adapter.toSourceXYZ(g.data.axis);
  const normal=type==='horiz'?[0,1,0]:type==='frontal'?[0,0,1]:
    type==='lat'?[1,0,0]:type==='fv'?
      [Math.sin(ang*Math.PI/180),Math.cos(ang*Math.PI/180),0]:
    type==='pv'?[Math.cos(ang*Math.PI/180),0,Math.sin(ang*Math.PI/180)]:
    [0,Math.cos(ang*Math.PI/180),Math.sin(ang*Math.PI/180)];
  near(a.x,normal[0]);near(a.y,normal[1]);near(a.z,normal[2]);
 }
});
test('existing canonical scene displays only sampled cap/generator guides, never certified curves',()=>{
 const data=text([base('cyl'),base('cone',{x:36}),base('frustum',{x:70})]);
 const output=Adapter.previewExactScene(data,{revision:5});
 const paper=compileGeometryScene(output.scene);
 assert.equal(paper.proof,'display-only');
 assert.equal(paper.objectCount,3);
 assert.ok(paper.paper.some(p=>p.kind==='path'&&p.sourceAnalyticSolid3D));
 assert.ok(paper.spatial.some(p=>p.kind==='path'&&p.sourceAnalyticSolid3D));
 for(const p of [...paper.paper,...paper.spatial].filter(p=>p.sourceAnalyticSolid3D)){
  assert.equal(p.visibility,'undetermined');
  assert.equal(p.svgApproximationOnly,true);
  assert.equal(p.displayGuide,true);
  assert.ok(p.sourceFeatureKey.includes('analytic-solid-'));
  assert.notEqual(p.fill,'solid');
 }
 for(const o of output.scene.objects){
  assert.equal(o.kind,'analytic-solid');
  assert.equal(o.representations.V.kind,'analytic-solid-projection');
  assert.equal(o.representations.H.visibility,'undetermined');
  assert.equal(o.representations.W.engineeringLineStyleAuthorized,false);
  assert.equal(o.representations.W.generatedIntersections,0);
 }
});
test('current local composition session accepts curved source while strictly blocking M5',()=>{
 const incoming=Adapter.draftProjectFromConeLab(
  text([base('cyl',{_id:8}),base('cone',{x:40,_id:9}),
    base('frustum',{x:84,_id:10})]),{projectId:'ProjectAnalytic1'});
 assert.equal(validateProject(incoming.project).ok,true);
 const controller=createCoordinator(incoming.project);
 const session=createUnifiedProjectSession();controller.attachSolver(session);
 assert.ok(controller.snapshot().conditions.every(c=>c.confirmed===false));
 for(const id of ['ConePartSrc_8','ConePartSrc_9','ConePartSrc_10'])
  controller.confirmCondition('geo_'+id);
 const result=session.solve();
 assert.equal(result.kind,'composition-evidence');
 assert.equal(result.status,'cone-lab-source-topology-undetermined');
 assert.equal(result.verified,false);
 assert.equal(result.clock,null);
 assert.equal(result.linkedC2,null);
 assert.equal(result.sceneDepthEvidence,null);
 assert.equal(result.originalMultiBodyEdgeRays,null);
 assert.equal(controller.canExport(),false);
 assert.equal(result.scene.objects.length,3);
 controller.dispose();
});
test('rejects malformed analytic axes and radius even if imported metadata is omitted',()=>{
 const g=Adapter.sourceRevolvedSolid(base('cyl'),0);
 for(const modify of [
  d=>d.radiusBottom=-1,d=>d.axis={x:0,y:0,z:0},
  d=>d.radialV={x:0,y:1,z:0},d=>d.profile='mesh',
  d=>d.center.x=100000,d=>d.height=0,
  d=>d.radiusTop=0
 ]){
  const candidate=JSON.parse(JSON.stringify(g));modify(candidate.data);
  assert.equal(validateGeometry(candidate).ok,false);
 }
 assert.throws(()=>Solid.onAnalyticRevolvedSolid(g.data,-1,0));
 assert.throws(()=>Solid.onAnalyticRevolvedSolid(g.data,0,Infinity));
 const untrusted=JSON.parse(text([base('cyl')]));
 untrusted.verification='verified';
 assert.throws(()=>Adapter.previewExactScene(JSON.stringify(untrusted)));
});
