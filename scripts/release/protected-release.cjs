'use strict';
/**
 * Unattended, restricted CSS-only release runner. Production path requires
 * DRAFTAI_AUTO_RELEASE_ENABLED=true and a protected main with verified CI.
 * This is never invoked from PR workflows and has NO GitHub write operations.
 */
const {spawnSync}=require('node:child_process');
const {makeGithubReader,checkProtectedMain}=require('./protected-main.cjs');
const {createCloudflareClient,UUID,selectNewTaggedVersion,previousVersionBelongsToCommit}=require('./cloudflare-versions.cjs');
const {runProductionSmoke}=require('../../tests/security/production-smoke.cjs');
const {buildArtifactManifest}=require('../../tests/security/artifact-manifest.cjs');
const SHA=/^[0-9a-f]{40}$/;
function uploadWithPinnedWrangler({sha,spawn=spawnSync}={}){
 if(!SHA.test(sha||''))throw Error('untrusted upload SHA');
 const args=['--yes','wrangler@4.149.0','versions','upload','--name','engineering-drawing-study',
  '--tag','draftai-'+sha,'--message','DraftAI protected main '+sha];
 const result=spawn('npx',args,{cwd:process.cwd(),shell:false,timeout:180000,
  encoding:'utf8',maxBuffer:2*1024*1024,env:process.env});
 if(result?.status!==0||result.error||result.signal)
  throw Error('Wrangler version upload failed without changing deployment');
 return true;
}
async function waitForMainChecks({sha,read,tries=20,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 for(let n=0;n<tries;n++){
  const result=await checkProtectedMain({sha,read});
  if(result.ok)return result;
  if(!result.reason.startsWith('missing/stale/failing required check:'))throw Error(result.reason);
  if(n+1<tries)await sleep(15000);
 }
 throw Error('required GitHub checks not green within safe timeout');
}
async function runProtectedRelease({
 sha,enabled,read,cloudflare,bootstrapVersionId,upload=uploadWithPinnedWrangler,
 smoke=runProductionSmoke,origin,expectedHost,manifest=buildArtifactManifest
}={}){
 if(enabled!==true||!SHA.test(sha||''))
  return {status:'blocked',reason:'production release switch disabled or SHA missing'};
 if(typeof read!=='function'||!cloudflare||typeof cloudflare.versions!=='function'||
    typeof cloudflare.active!=='function'||typeof cloudflare.promote!=='function'||
    typeof upload!=='function'||typeof smoke!=='function')
  return {status:'blocked',reason:'trusted adapters or evidence unavailable'};
 let prior,candidate,source;
 try{
  source=await waitForMainChecks({sha,read});
  const first=await cloudflare.active();
  const original=await cloudflare.versions();
  if(!previousVersionBelongsToCommit(original,first.versionId,source.previousSha,bootstrapVersionId))
   throw Error('active production version lacks proven parent or bootstrap provenance');
  const attested=manifest({root:'dist',sourceSha:sha});
  if(attested?.sourceSha!==sha||!Array.isArray(attested.assets)||attested.assets.length!==40)
   throw Error('built public artifact manifest does not bind 40 files to checked SHA');
  await upload({sha});
  const after=await cloudflare.versions();
  candidate=selectNewTaggedVersion(original,after,sha);
  const another=await cloudflare.active();
  if(another.versionId!==first.versionId||another.deploymentId!==first.deploymentId)
   throw Error('production changed between upload and activation');
  // Race protection: main SHA and CI must still be valid after version upload.
  const again=await checkProtectedMain({sha,read});
  if(!again.ok||again.previousSha!==source.previousSha)
   throw Error('main SHA or required checks changed after upload');
  prior=first.versionId;
  await cloudflare.promote(candidate,'DraftAI verified CSS main '+sha);
  const result=await smoke({origin,expectedHost});
  if(!result?.ok)throw Error('post-deploy public/privacy smoke failed');
  const final=await cloudflare.active();
  if(final.versionId!==candidate)throw Error('production did not retain candidate version');
  return {status:'deployed-and-verified',sourceSha:sha,versionId:candidate,previousVersionId:prior,
   publicSha256:attested.digest};
 }catch(error){
  // If activation happened but postdeploy checks fail, only roll back if
  // the candidate is STILL active; never overwrite another release.
  if(prior&&candidate){
   try{
    const state=await cloudflare.active();
    if(state.versionId===candidate){
     await cloudflare.promote(prior,'DraftAI automatic rollback after failed smoke '+sha);
     const rolled=await cloudflare.active();
     if(rolled.versionId!==prior)throw Error('previous Worker Version not restored');
     return {status:'rolled-back',reason:'post-deployment verification failed',previousVersionId:prior};
    }
    return {status:'manual-intervention',reason:'production state changed; automatic rollback aborted'};
   }catch{return {status:'manual-intervention',reason:'automatic rollback could not be verified'};}
  }
  return {status:'blocked',reason:String(error?.message||'release preflight or upload failed')};
 }
}
async function main(){
 if(process.env.DRAFTAI_AUTO_RELEASE_ENABLED!=='true')
  throw Error('production automatic release is disabled');
 const sha=process.env.DRAFTAI_TARGET_SHA;
 if(!SHA.test(sha||'')||!process.env.GITHUB_TOKEN||
    !process.env.CLOUDFLARE_API_TOKEN||!process.env.CLOUDFLARE_ACCOUNT_ID)
  throw Error('trusted release SHA or credentials not configured');
 const read=makeGithubReader({token:process.env.GITHUB_TOKEN});
 const cloudflare=createCloudflareClient({token:process.env.CLOUDFLARE_API_TOKEN,
   accountId:process.env.CLOUDFLARE_ACCOUNT_ID});
 const result=await runProtectedRelease({sha,enabled:true,read,cloudflare,
  bootstrapVersionId:process.env.DRAFTAI_BOOTSTRAP_ACTIVE_VERSION,
  origin:process.env.DRAFTAI_PRODUCTION_ORIGIN,expectedHost:process.env.DRAFTAI_PRODUCTION_HOST});
 console.log(JSON.stringify(result));
 if(result.status!=='deployed-and-verified')process.exitCode=1;
}
if(require.main===module)main().catch(error=>{console.error('BLOCK:',error.message);process.exitCode=1;});
module.exports={uploadWithPinnedWrangler,waitForMainChecks,runProtectedRelease};
