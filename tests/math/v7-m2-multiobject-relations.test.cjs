'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {analyzeConfirmedRelations}=require('../../core/constraints/multiobject-relation-evidence.cjs');
const {newProject,createCoordinator,importProject,exportProject}=
 require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const pt=(id,x,y,z)=>({id,kind:'point',space:z===undefined?'drawing-2d':'model-3d',
 unit:'mm',data:z===undefined?{x,y}:{x,y,z}});
const seg=(id,a,b)=>({id,kind:'segment',space:a.z===undefined?'drawing-2d':'model-3d',
 unit:'mm',data:{start:a,end:b}});
const given=(kind,a,b,value=null)=>({id:'Relation1',kind,objectIds:[a,b],value,confirmed:true});
test('M2 relation evidence analyzes independent distances, coincidences and segment geometry in 2D and 3D',()=>{
 const geometry=[pt('A',0,0),pt('B',3,4),pt('C',3,4),
  seg('S1',{x:0,y:0},{x:3,y:0}),
  seg('S2',{x:8,y:9},{x:8,y:12}),
  seg('S3',{x:5,y:5},{x:8,y:5})];
 const relations=[
  given('distance','A','B',5),
  {...given('coincident','B','C'),id:'Coincidence'},
  {...given('equal-length','S1','S2'),id:'Length'},
  {...given('perpendicular','S1','S2'),id:'Orthogonal'},
  {...given('parallel','S1','S3'),id:'Parallel'}
 ];
 const p=analyzeConfirmedRelations(geometry,relations,{revision:8});
 assert.equal(p.status,'consistent');assert.equal(p.checkedCount,5);
 assert.equal(p.mathematicallyVerified,false);
 assert.equal(p.globallyUnique,null);
 assert.equal(p.v5Ready,false);
 assert.deepEqual(p.relations.map(r=>r.unit),['mm','mm','mm','dimensionless','dimensionless']);
 assert.ok(p.relations.every(r=>Math.abs(r.residual)<=r.tolerance));
 const next=analyzeConfirmedRelations([
  pt('A3',0,0,0),pt('B3',1,2,2)],
  [given('distance','A3','B3',3)],{revision:9});
 assert.equal(next.status,'consistent');assert.equal(next.relations[0].actual,3);
});
test('conflicts do not become a mathematical solution even when all geometry is known',()=>{
 const g=[pt('A',0,0),pt('B',3,4)];
 const bad=analyzeConfirmedRelations(g,[given('distance','A','B',7)],{revision:3});
 assert.equal(bad.status,'inconsistent');
 assert.equal(bad.relations[0].residual,-2);
 assert.equal(bad.constructedGeometry,null);
 assert.equal(bad.solutionCount,null);
});
test('reject mixed-dimensional, type-invalid, unconfirmed and fake relation inputs',()=>{
 const g=[pt('A',1,2),pt('B',2,3,4)];
 assert.throws(()=>analyzeConfirmedRelations(g,[given('distance','A','B',4)],{revision:1}),/空间/);
 const h=[pt('A',1,2),pt('B',2,3)];
 assert.throws(()=>analyzeConfirmedRelations(h,[given('parallel','A','B')],{revision:1}),/线段/);
 assert.throws(()=>analyzeConfirmedRelations(h,[{...given('distance','A','B',1),confirmed:false}],{revision:1}),/确认/);
 assert.throws(()=>analyzeConfirmedRelations(h,[given('distance','A','B',-1)],{revision:1}),/距离/);
 assert.throws(()=>analyzeConfirmedRelations(h,[given('distance','A','Missing',1)],{revision:1}),/已知/);
 assert.throws(()=>analyzeConfirmedRelations(h,[given('distance','A','B',1)],{revision:-1}),/修订/);
});
function setup(){
 const c=createCoordinator(newProject({id:'RelationsProject',task:'composition'}));
 const solver=createUnifiedProjectSession();c.attachSolver(solver);
 for(const point of [pt('A',0,0),pt('B',3,4)]){
  c.putObject({id:point.id,kind:'point',spatialId:null,projections:{V:[],H:[],W:[]}});
  c.putCondition({id:'geo_'+point.id,objectId:point.id,sourceCandidateId:null,
   confirmed:false,value:{type:'manual-geometry',unit:'mm',imageId:null,geometry:point}});
  c.confirmCondition('geo_'+point.id);
 }
 return {c,solver};
}
test('one local project stages relation, requires human confirmation and preserves old V5 refusal',()=>{
 const {c,solver}=setup();
 c.putRelation({...given('distance','A','B',5),confirmed:true});
 assert.equal(c.snapshot().relations[0].confirmed,false);
 assert.throws(()=>solver.solve(),/待人工确认/);
 c.confirmRelation('Relation1');
 const outcome=solver.solve();
 assert.equal(outcome.relationEvidence.status,'consistent');
 assert.equal(outcome.relationEvidence.checkedCount,1);
 assert.equal(outcome.verified,false);assert.equal(outcome.clock,null);
 assert.equal(c.canExport(),false);
 const revision=c.snapshot().revision;
 c.setCamera({yaw:34});
 assert.equal(c.snapshot().revision,revision);
 assert.equal(solver.readSnapshot(),outcome);
 const restored=createCoordinator(importProject(exportProject(c.snapshot())));
 assert.equal(restored.snapshot().relations.length,1);
 assert.equal(restored.currentResult(),null);
 restored.dispose();c.dispose();
});
test('source or object change invalidates relation confirmation and every previous computed residual',()=>{
 const {c,solver}=setup();
 c.putRelation(given('distance','A','B',5));c.confirmRelation('Relation1');
 const old=solver.solve(),revision=c.snapshot().revision;
 c.putCondition({id:'geo_B',objectId:'B',sourceCandidateId:null,confirmed:false,
  value:{type:'manual-geometry',unit:'mm',imageId:null,geometry:pt('B',8,1)}});
 assert.ok(c.snapshot().revision>revision);
 assert.equal(c.snapshot().relations[0].confirmed,false);
 assert.equal(solver.readSnapshot(),null);
 assert.throws(()=>c.confirmRelation('Relation1'),/两个对象/);
 c.confirmCondition('geo_B');
 c.confirmRelation('Relation1');
 assert.equal(solver.solve().relationEvidence.status,'inconsistent');
 c.setImage('NewSource');
 assert.equal(c.snapshot().relations[0].confirmed,false);
 assert.equal(solver.readSnapshot(),null);
 assert.equal(old.verified,false);
 c.dispose();
});
