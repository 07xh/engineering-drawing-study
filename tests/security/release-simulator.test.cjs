'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {REQUIRED_CHECKS}=require('./release-readiness.cjs');
const {makeInMemoryWorker,rehearseRelease}=require('./release-simulator.cjs');
const SHA='1'.repeat(40),OTHER='2'.repeat(40);
const OLD='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const NEW='bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
function evidence(){const blob='a'.repeat(40);return {
  repository:'07xh/engineering-drawing-study',targetBranch:'main',headSha:SHA,artifactSha:SHA,
  draft:false,mergeConflicts:false,changedFiles:['site-ui.css'],mainProtected:true,noAdminBypass:true,
  productionBuildUploadsOnly:true,previousActiveVersionId:OLD,verifiedPreview:true,
  privateRoutesDenied:true,metadataFromTrustedApi:true,
  checks:REQUIRED_CHECKS.map(name=>({name,sha:SHA,status:'completed',conclusion:'success'})),
  diffEvidence:{repository:'07xh/engineering-drawing-study',
    pullRequest:{base:{ref:'main'},head:{sha:SHA,repo:{full_name:'07xh/engineering-drawing-study'}},state:'open',draft:false,mergeable:true,changed_files:1},
    files:[{filename:'site-ui.css',sha:blob,status:'modified',additions:1,deletions:1,changes:2,
      patch:'@@ -1 +1 @@\n-old {color:red}\n+new {color:blue}'}],filesComplete:true,
    headTree:{forCommitSha:SHA,truncated:false,tree:[{path:'site-ui.css',sha:blob,mode:'100644',type:'blob'}]}}
}};
function release(){return {worker:'engineering-drawing-study',environment:'production',candidateVersionId:NEW,
  previousVersionId:OLD,sourceSha:SHA,uploadVerified:true,previousVersionActiveVerified:true,
  rollbackPreviouslyTested:true,uniqueDeploymentLock:true};}
function worker(overrides={}){return makeInMemoryWorker({activeVersionId:OLD,versions:[{id:NEW,sourceSha:SHA}],...overrides});}
function perform(simulator,ready=evidence(),candidate=release()){return rehearseRelease({readiness:ready,release:candidate,simulator});}
test('success rehearsal promotes only in memory and unlocks',()=>{
 const sim=worker(),r=perform(sim);assert.equal(r.status,'simulated-success');
 assert.equal(r.activeVersionId,NEW);assert.equal(r.productionDeploymentOccurred,false);
 assert.deepEqual(r.events.map(x=>x.operation),['lock','lookup','promote','smoke','unlock']);assert.equal(sim.locked,false);
});
test('smoke rejection reverts exactly to previous active version',()=>{
 const sim=worker({smoke:'fail'}),r=perform(sim);assert.equal(r.status,'simulated-rolled-back');
 assert.equal(r.activeVersionId,OLD);assert.equal(r.productionDeploymentOccurred,false);
 assert.deepEqual(r.events.map(x=>x.operation),['lock','lookup','promote','smoke','rollback','unlock']);
});
test('network exception during simulated smoke also rolls back',()=>{
 const r=perform(worker({smoke:'throw'}));assert.equal(r.status,'simulated-rolled-back');assert.equal(r.activeVersionId,OLD);
});
test('failed rollback explicitly demands human intervention and unlocks',()=>{
 const sim=worker({smoke:'fail',failRollback:true});const r=perform(sim);
 assert.equal(r.status,'manual-intervention-needed');assert.equal(r.activeVersionId,NEW);
 assert(r.reasons.some(x=>x.includes('rollback failed')));assert.equal(sim.locked,false);
});
test('failed promotion does not attempt rollback if version unchanged',()=>{
 const sim=worker({failActivate:true}),r=perform(sim);assert.equal(r.status,'blocked');
 assert.equal(r.activeVersionId,OLD);assert.equal(r.events.some(x=>x.operation==='rollback'),false);
});
test('snapshot race blocks a promotion before any change',()=>{
 const sim=makeInMemoryWorker({activeVersionId:NEW,versions:[{id:NEW,sourceSha:SHA}]});
 const r=perform(sim);assert.equal(r.status,'blocked');assert.equal(sim.activeVersionId,NEW);
 assert.equal(r.events.some(x=>x.operation==='promote'),false);
});
test('different uploaded source SHA blocks promotion',()=>{
 const sim=worker({versions:[{id:NEW,sourceSha:OTHER}]});const r=perform(sim);
 assert.equal(r.status,'blocked');assert(r.reasons.some(x=>x.includes('source SHA')));
});
test('missing candidate Worker version blocks promotion',()=>{
 const sim=worker({versions:[]}),r=perform(sim);assert.equal(r.status,'blocked');assert.equal(sim.activeVersionId,OLD);
});
test('failing required check blocks before acquiring lock',()=>{
 const sim=worker(),bad=evidence();bad.checks[0].conclusion='failure';
 const r=perform(sim,bad);assert.equal(r.status,'blocked');assert.deepEqual(sim.events,[]);
});
test('unprotected main blocks before acquiring lock',()=>{
 const sim=worker(),r=perform(sim,{...evidence(),mainProtected:false});assert.equal(r.status,'blocked');assert.deepEqual(sim.events,[]);
});
test('unauthorized fake transport is never called',()=>{
 let called=false;
 const fake={acquireLock(){called=true;throw Error('should never be called')}};
 const r=perform(fake);assert.equal(r.status,'blocked');assert.equal(called,false);
});
test('locked simulator blocks simultaneous release rehearsal',()=>{
 const sim=worker();assert.equal(sim.acquireLock(),true);
 const r=perform(sim);assert.equal(r.status,'blocked');assert.equal(sim.activeVersionId,OLD);
 sim.releaseLock();
});
test('simulator validates IDs and smoke outcomes',()=>{
 assert.throws(()=>makeInMemoryWorker({activeVersionId:'bad'}));
 assert.throws(()=>worker({versions:[{id:'latest',sourceSha:SHA}]}));
 assert.throws(()=>worker({smoke:'unknown'}));
 assert.throws(()=>worker({versions:[{id:NEW,sourceSha:SHA},{id:NEW,sourceSha:SHA}]}));
});
test('repeat rehearsal against stale prior version cannot deploy again',()=>{
 const sim=worker();assert.equal(perform(sim).status,'simulated-success');
 const again=perform(sim);assert.equal(again.status,'blocked');
 assert.equal(sim.events.filter(x=>x.operation==='promote').length,1);
});
