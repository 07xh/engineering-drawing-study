'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {evaluateReleaseReadiness, REQUIRED_CHECKS, validPath} = require('./release-readiness.cjs');
const sha = '1'.repeat(40), other = '2'.repeat(40);
const version = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
function candidate(overrides = {}) {
  return {
    repository:'07xh/engineering-drawing-study', targetBranch:'main',
    headSha:sha, artifactSha:sha, draft:false,mergeConflicts:false,
    changedFiles:['site-ui.css'],mainProtected:true,noAdminBypass:true,
    productionBuildUploadsOnly:true,previousActiveVersionId:version,
    verifiedPreview:true,privateRoutesDenied:true,metadataFromTrustedApi:true,
    checks:REQUIRED_CHECKS.map(name=>({name,sha,status:'completed',conclusion:'success'})),
    ...overrides
  };
}
function isBlocked(input,fragment){
  const result=evaluateReleaseReadiness(input);
  assert.equal(result.eligible,false);
  assert.equal(result.status,'blocked');
  assert(result.reasons.some(reason=>reason.includes(fragment)),JSON.stringify(result.reasons));
}
test('read-only classifier allows only a fully evidenced low-risk path',()=>{
 const result=evaluateReleaseReadiness(candidate());
 assert.equal(result.eligible,true);
 assert.equal(result.status,'eligible-for-external-release-controller');
 assert.deepEqual(result.reasons,[]);
});
test('all real geometry, build, CI, secret and UI code changes require governance',()=>{
 for(const file of ['core/contracts/problem.js','engines/projection/x.js','workbench/ui.js',
    'scripts/build-static.cjs','.github/workflows/check.yml','wrangler.jsonc',
    'index.html','labs/point-coach-core.js','README.md','docs/security/automatic-release.md'])
   isBlocked(candidate({changedFiles:[file]}),'unapproved change paths');
});
test('mixture of low-risk CSS and protected code is never eligible',()=>{
 isBlocked(candidate({changedFiles:['site-ui.css','scripts/build-static.cjs']}),'unapproved change paths');
});
test('no changes, duplicate names, traversal and absolute paths fail closed',()=>{
 for(const files of [[],['site-ui.css','site-ui.css'],['../site-ui.css'],['/site-ui.css'],['a//b']])
  isBlocked(candidate({changedFiles:files}),'changed file list');
 assert.equal(validPath('site-ui.css'),true);
 assert.equal(validPath('a/../b'),false);
});
test('PR must be from correct repository and correct branch',()=>{
 isBlocked(candidate({repository:'someone/else'}),'repository/target');
 isBlocked(candidate({targetBranch:'preview'}),'repository/target');
 isBlocked(candidate({draft:true}),'draft');
 isBlocked(candidate({mergeConflicts:true}),'draft');
});
test('untested artifact, invalid SHA and stale check cannot promote',()=>{
 isBlocked(candidate({artifactSha:other}),'same valid SHA');
 isBlocked(candidate({headSha:'abc'}),'same valid SHA');
 const checks=candidate().checks;
 isBlocked(candidate({checks:[{...checks[0],sha:other},...checks.slice(1)]}),'validate');
});
test('missing / failed / pending / duplicate named checks always block',()=>{
 const checks=candidate().checks;
 isBlocked(candidate({checks:checks.slice(1)}),'validate');
 isBlocked(candidate({checks:[{...checks[0],conclusion:'failure'},...checks.slice(1)]}),'validate');
 isBlocked(candidate({checks:[{...checks[0],status:'queued'},...checks.slice(1)]}),'validate');
 isBlocked(candidate({checks:[...checks,checks[0]]}),'validate');
});
test('unprotected main, bypass and direct production push block automation',()=>{
 isBlocked(candidate({mainProtected:false}),'protected main');
 isBlocked(candidate({noAdminBypass:false}),'protected main');
 isBlocked(candidate({productionBuildUploadsOnly:false}),'isolated');
});
test('unverified preview, privacy or rollback evidence blocks automation',()=>{
 isBlocked(candidate({verifiedPreview:false}),'verified preview');
 isBlocked(candidate({privateRoutesDenied:false}),'sensitive-path');
 isBlocked(candidate({previousActiveVersionId:null}),'previous active Worker');
 isBlocked(candidate({metadataFromTrustedApi:false}),'trusted APIs');
});
test('empty or malformed context blocks instead of crashing',()=>{
 for(const value of [undefined,null,{},[],false]){
  const result=evaluateReleaseReadiness(value);
  assert.equal(result.eligible,false);
 }
});
