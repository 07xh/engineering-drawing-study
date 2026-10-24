'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {newProject,createCoordinator,importProject,exportProject}=
 require('../../project/project-coordinator.cjs');
const {manualSegment,checkedRecognition,candidateLinks}=
 require('../../project/source-candidate-bridge.cjs');
const image={width:480,height:300,byteLength:76024,mediaType:'image/png'};
const points={from:{x:42,y:51},to:{x:160,y:51}};
const input=id=>manualSegment({id,image,...points});
function project(){
 const c=createCoordinator(newProject({id:'SourceProject',task:'composition'}));
 c.setImage('PhotoA');
 c.putObject({id:'LineA',kind:'edge',spatialId:null,
  projections:{V:[],H:[],W:[]}});
 return c;
}
function link(c,id='SourceA'){
 const p=c.snapshot();
 c.putCondition({id:'geo_LineA',objectId:'LineA',sourceCandidateId:id,
  confirmed:false,value:{type:'manual-geometry',unit:'mm',imageId:p.source.imageId,
  geometry:{id:'LineA',kind:'segment',space:'drawing-2d',unit:'mm',
   data:{start:{x:0,y:0},end:{x:10,y:0}}}}});
}
test('canonical ProblemDraft candidate→condition and condition→candidate lookup are stable',()=>{
 const c=project(),v=c.snapshot().revision;
 c.putSourceCandidate(input('SourceA'),image);
 assert.equal(c.snapshot().revision,v+1);
 assert.equal(checkedRecognition(c.snapshot()).candidates[0].reviewStatus,'unconfirmed');
 link(c);
 assert.throws(()=>c.confirmCondition('geo_LineA'),/尚未经人工确认/);
 c.reviewSourceCandidate('SourceA','confirmed');
 c.confirmCondition('geo_LineA');
 assert.equal(c.snapshot().conditions[0].confirmed,true);
 const links=c.sourceCandidates();
 assert.equal(links.length,1);
 assert.deepEqual(links[0].conditions.map(x=>x.conditionId),['geo_LineA']);
 assert.equal(links[0].status,'confirmed');
 const restored=createCoordinator(importProject(exportProject(c.snapshot())));
 assert.equal(restored.sourceCandidates()[0].conditions[0].objectId,'LineA');
 assert.equal(restored.snapshot().recognition.draft.solverRevision,null);
 restored.dispose();c.dispose();
});
test('editing or rejecting candidate revokes linked math conditions, revision and old results',()=>{
 const c=project();
 c.putSourceCandidate(input('SourceA'),image);link(c);
 c.reviewSourceCandidate('SourceA','confirmed');c.confirmCondition('geo_LineA');
 const before=c.snapshot().revision;
 c.putSourceCandidate(manualSegment({id:'SourceA',image,
  from:{x:46,y:52},to:{x:175,y:52}}),image);
 assert.ok(c.snapshot().revision>before);
 assert.equal(c.snapshot().conditions[0].confirmed,false);
 assert.equal(c.sourceCandidates()[0].status,'unconfirmed');
 assert.throws(()=>c.confirmCondition('geo_LineA'),/尚未经人工确认/);
 c.reviewSourceCandidate('SourceA','rejected');
 assert.throws(()=>c.confirmCondition('geo_LineA'),/尚未经人工确认/);
 c.dispose();
});
test('photo replacement or scale edit removes stale candidate links; cannot inherit old human review',()=>{
 const c=project();c.putSourceCandidate(input('SourceA'),image);link(c);
 c.reviewSourceCandidate('SourceA','confirmed');c.confirmCondition('geo_LineA');
 c.setImageGeometry({rotationDeg:90,calibration:null});
 assert.equal(c.snapshot().recognition,null);
 assert.equal(c.snapshot().conditions[0].sourceCandidateId,null);
 assert.equal(c.snapshot().conditions[0].confirmed,false);
 c.setImage('PhotoB');
 assert.equal(c.snapshot().source.imageId,'PhotoB');
 assert.equal(c.sourceCandidates().length,0);
 assert.throws(()=>c.reviewSourceCandidate('SourceA','confirmed'),/没有待审核/);
 c.dispose();
});
test('reject forged links, orphan refs, obsolete origin and fake reviewed candidate assertions',()=>{
 const c=project();c.putSourceCandidate(input('SourceA'),image);
 const p=c.snapshot();
 const broken={...p,conditions:[{id:'C1',objectId:'LineA',sourceCandidateId:'NoSuch',
  confirmed:true,value:{imageId:'PhotoA'}}]};
 assert.throws(()=>importProject(JSON.stringify(broken)),/候选不存在/);
 const forged={...p,recognition:{...p.recognition,
  draft:{...p.recognition.draft,proofOfCorrectness:true}}};
 assert.throws(()=>importProject(JSON.stringify(forged)),/不规范/);
 const stale={...p,source:{...p.source,rotationDeg:90}};
 assert.throws(()=>importProject(JSON.stringify(stale)),/过期/);
 assert.throws(()=>manualSegment({id:'Bad',image,from:{x:-1,y:2},to:points.to}),/图片范围/);
 assert.throws(()=>manualSegment({id:'Bad',image,from:points.from,to:points.from}),/不能重合/);
 c.dispose();
});
