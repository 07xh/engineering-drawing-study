'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {REQUIRED_CHECKS}=require('./release-readiness.cjs');
const {createReleasePlan}=require('./release-plan.cjs');
const SHA='1'.repeat(40),OLD='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',NEW='bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const ready=()=>({repository:'07xh/engineering-drawing-study',targetBranch:'main',headSha:SHA,artifactSha:SHA,
 draft:false,mergeConflicts:false,changedFiles:['site-ui.css'],mainProtected:true,noAdminBypass:true,
 productionBuildUploadsOnly:true,previousActiveVersionId:OLD,verifiedPreview:true,
 privateRoutesDenied:true,metadataFromTrustedApi:true,
 checks:REQUIRED_CHECKS.map(name=>({name,sha:SHA,status:'completed',conclusion:'success'}))});
const version=()=>({worker:'engineering-drawing-study',environment:'production',candidateVersionId:NEW,
 previousVersionId:OLD,sourceSha:SHA,uploadVerified:true,previousVersionActiveVerified:true,
 rollbackPreviouslyTested:true,uniqueDeploymentLock:true});
const plan=(patchReady={},patchVersion={})=>createReleasePlan({readiness:{...ready(),...patchReady},release:{...version(),...patchVersion}});
function blocks(p,why){assert.equal(p.ready,false);assert.equal(p.stages.length,0);assert(p.reasons.some(x=>x.includes(why)),JSON.stringify(p.reasons));}
test('only a fully evidenced snapshot yields a plan, never actual deployment',()=>{
 const result=plan();assert.equal(result.ready,true);assert.equal(result.status,'plan-only-not-authorized');
 assert.deepEqual(result.stages.map(s=>s.action),[
  'revalidate-trusted-evidence','activate-immutable-worker-version','run-read-only-production-smoke',
  'rollback-on-smoke-failure','record-final-sha-version-and-smoke']);
 assert.equal(result.stages[1].versionId,NEW);assert.equal(result.stages[3].versionId,OLD);
});
test('no Cloudflare payload fails closed',()=>blocks(createReleasePlan({readiness:ready()}),'metadata missing'));
test('wrong Worker or environment blocked',()=>{
 blocks(plan({}, {worker:'another-worker'}),'unexpected Worker');
 blocks(plan({}, {environment:'preview'}),'unexpected Worker');
});
test('invalid or identical worker versions blocked',()=>{
 blocks(plan({}, {candidateVersionId:'latest'}),'invalid candidate');
 blocks(plan({}, {previousVersionId:'bad'}),'invalid prior');
 blocks(plan({}, {candidateVersionId:OLD}),'already active');
});
test('version/source mismatch and stale rollback pointer block',()=>{
 blocks(plan({}, {sourceSha:'2'.repeat(40)}),'source SHA');
 blocks(plan({previousActiveVersionId:NEW}),'previous active version differs');
});
test('unverified upload, rollback or missing deployment lock block',()=>{
 blocks(plan({}, {uploadVerified:false}),'independently verified');
 blocks(plan({}, {previousVersionActiveVerified:false}),'independently verified');
 blocks(plan({}, {rollbackPreviouslyTested:false}),'rollback procedure');
 blocks(plan({}, {uniqueDeploymentLock:false}),'concurrency lock');
});
test('unprotected main and failed required checks never plan a release',()=>{
 blocks(plan({mainProtected:false}),'protected main');
 blocks(plan({checks:[]}), 'required check');
});
