'use strict';
/**
 * Public, opt-in verification artifact for deployed static Worker assets.
 * Reading this file from a live Worker can identify its packaged checkout,
 * but it does NOT prove deployment correctness or GitHub approval by itself.
 */
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const validCommit=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s.trim());
function derivePublicBuildInfo({gitHead=null,env={},preview=false}={}){
 let sha=null,source='unavailable';
 if(validCommit(gitHead)){
  sha=gitHead.trim();source='git-checkout';
 }else for(const key of ['CF_PAGES_COMMIT_SHA','GITHUB_SHA']){
  if(validCommit(env[key])){sha=env[key].trim();source='environment-commit';break;}
 }
 return Object.freeze({
  schema:'draftai-public-build-info/1',
  sourceCommit:sha,
  sourceKind:source,
  artifactType:preview?'ui-preview':'static-worker-assets',
  commitIdentified:!!sha,
  deploymentVerified:false,
  // Avoid leaking CI metadata, repo path, branch credentials or local user data.
  note:'This is the source checkout used for this static bundle, not confirmation of active Cloudflare production deployment.'
 });
}
function writePublicBuildInfo(out,{repoRoot,env=process.env,preview=false,
 readGitHead=null}={}){
 let gitHead=null;
 try{
  gitHead=readGitHead?readGitHead():
   execFileSync('git',['rev-parse','--verify','HEAD'],{
    cwd:repoRoot||path.resolve(__dirname,'..'),
    encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:2500
   }).trim();
 }catch(_){gitHead=null;}
 const info=derivePublicBuildInfo({gitHead,env,preview});
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'draftai-build-info.json'),
  JSON.stringify(info,null,2)+'\n','utf8');
 return info;
}
module.exports={derivePublicBuildInfo,writePublicBuildInfo};
