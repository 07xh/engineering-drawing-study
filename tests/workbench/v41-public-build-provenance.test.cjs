'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {derivePublicBuildInfo:derive,writePublicBuildInfo:write}=
 require('../../scripts/public-build-provenance.cjs');
const SHA='a'.repeat(40),OTHER='b'.repeat(40);
test('verified checkout commit identifies generated source independently from deployment',()=>{
 const info=derive({gitHead:SHA,env:{GITHUB_SHA:OTHER},preview:false});
 assert.deepEqual(info,{
  schema:'draftai-public-build-info/1',sourceCommit:SHA,
  sourceKind:'git-checkout',artifactType:'static-worker-assets',
  commitIdentified:true,deploymentVerified:false,
  note:'This is the source checkout used for this static bundle, not confirmation of active Cloudflare production deployment.'
 });
});
test('allowlisted CI commit fallback never guesses a commit from branch, time or path',()=>{
 const fallback=derive({gitHead:'',env:{CF_PAGES_COMMIT_SHA:SHA,GITHUB_SHA:OTHER},preview:true});
 assert.equal(fallback.sourceCommit,SHA);
 assert.equal(fallback.sourceKind,'environment-commit');
 assert.equal(fallback.artifactType,'ui-preview');
 const unknown=derive({gitHead:'bad',env:{GITHUB_SHA:'truncated',SECRET_ACCESS_KEY:'sensitive'}});
 assert.equal(unknown.sourceCommit,null);
 assert.equal(unknown.commitIdentified,false);
 assert.equal(unknown.sourceKind,'unavailable');
 assert.equal(unknown.deploymentVerified,false);
 assert.doesNotMatch(JSON.stringify(unknown),/sensitive|SECRET/);
});
test('manifest writer yields a strict small public JSON without file path, account, secrets or timestamps',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-provenance-'));
 try{
  const out=write(dir,{readGitHead:()=>SHA,env:{
   GITHUB_SHA:OTHER,CLOUDFLARE_API_TOKEN:'private-token',
   DATABASE_URL:'private-db'
  }});
  const file=fs.readFileSync(path.join(dir,'draftai-build-info.json'),'utf8');
  assert.deepEqual(JSON.parse(file),out);
  assert.ok(file.length<850);
  assert.doesNotMatch(file,/private-token|private-db|CLOUDFLARE|DATABASE|\/tmp\//);
  assert.equal(out.sourceCommit,SHA);
  assert.equal(out.deploymentVerified,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('unavailable git command returns explicit unknown, does not fabricate last main SHA',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-provenance-'));
 try{
  const info=write(dir,{readGitHead:()=>{throw new Error('no repository metadata')},env:{}});
  assert.equal(info.sourceCommit,null);
  assert.equal(info.commitIdentified,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('static build packages manifest only after public assets and UI assembly',()=>{
 const source=fs.readFileSync('scripts/build-static.cjs','utf8');
 const final=source.indexOf("require('./public-build-provenance.cjs').writePublicBuildInfo");
 const ui=source.indexOf("require('../ui-next/enhance-page.cjs').applyPreview");
 assert.ok(ui>0&&final>ui,'manifest must describe fully built public dist');
 assert.match(source,/artifact commit:|public asset commit:/);
 assert.doesNotMatch(fs.readFileSync('scripts/public-build-provenance.cjs','utf8'),
  /fetch\(|XMLHttpRequest|localStorage|solveFiniteFillet/);
});
