'use strict';
/**
 * Trusted, GET-only GitHub main-release preflight. Never merges or approves PRs.
 * A passing check only authorizes the caller to consider deployment; the
 * actual published Worker must still be bound to the same immutable SHA.
 */
const {inspectAddedCss}=require('../../tests/security/verify-pr-diff.cjs');
const REPO='07xh/engineering-drawing-study';
const API='https://api.github.com/repos/'+REPO;
const SHA=/^[a-f0-9]{40}$/;
const REQUIRED=Object.freeze(['validate','release-security']);
function safeToken(token){
 if(typeof token!=='string'||token.length<8||/[\r\n]/.test(token))throw Error('GitHub token unavailable');
}
function makeGithubReader({token,fetchImpl=globalThis.fetch}={}){
 safeToken(token);
 if(typeof fetchImpl!=='function')throw Error('fetch unavailable');
 return async function get(path){
  if(!/^\/(?:branches\/main|commits\/[a-f0-9]{40}(?:\/check-runs\?per_page=100)?)$/.test(path))
   throw Error('forbidden GitHub read path');
  let response;
  try{response=await fetchImpl(API+path,{method:'GET',redirect:'error',signal:AbortSignal.timeout(12000),
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json',
      'X-GitHub-Api-Version':'2022-11-28'}});}
  catch{throw Error('GitHub metadata request failed')}
  if(response?.status!==200)throw Error('GitHub metadata response not successful');
  let json;try{json=await response.json();}catch{throw Error('GitHub metadata was not JSON')}
  return json;
 };
}
async function checkProtectedMain({sha,read}={}){
 const deny=(reason)=>({ok:false,reason});
 if(!SHA.test(sha||'')||typeof read!=='function')return deny('invalid main SHA or GitHub reader');
 let main,commit,checks;
 try{
  main=await read('/branches/main');
  if(main?.protected!==true||main?.commit?.sha!==sha)
   return deny('main unprotected or changed while validating');
  commit=await read('/commits/'+sha);
  if(commit?.sha!==sha||!Array.isArray(commit.parents)||commit.parents.length!==1 ||
     !SHA.test(commit.parents[0]?.sha||'')||commit?.files?.length!==1)
   return deny('main update is not one linear, fully enumerated file change');
  const f=commit.files[0];
  if(f?.filename!=='site-ui.css'||f.status!=='modified'||f.previous_filename!==undefined||
     !Number.isSafeInteger(f.additions)||!Number.isSafeInteger(f.deletions)||
     f.additions<1||f.deletions<0||f.additions>24||f.deletions>24||
     f.changes!==f.additions+f.deletions||inspectAddedCss(f.patch)!==null ||
     typeof f.patch!=='string' ||
     f.patch.split('\n').filter(x=>x.startsWith('+')&&!x.startsWith('+++')).length!==f.additions ||
     f.patch.split('\n').filter(x=>x.startsWith('-')&&!x.startsWith('---')).length!==f.deletions)
   return deny('main update is not eligible low-risk CSS');
  checks=await read('/commits/'+sha+'/check-runs?per_page=100');
  if(!Array.isArray(checks?.check_runs)||checks.total_count!==checks.check_runs.length)
   return deny('incomplete GitHub check results');
  for(const name of REQUIRED){
   const runs=checks.check_runs.filter(x=>x?.name===name && x?.head_sha===sha);
   if(runs.length!==1||runs[0].status!=='completed'||runs[0].conclusion!=='success')
    return deny('missing/stale/failing required check: '+name);
  }
  const again=await read('/branches/main');
  if(again?.protected!==true||again?.commit?.sha!==sha)
   return deny('main changed during final verification');
  return {ok:true,sha,previousSha:commit.parents[0].sha,changedFile:'site-ui.css'};
 }catch(error){return deny('trusted GitHub evidence unavailable: '+String(error?.message||'Error'))}
}
module.exports={makeGithubReader,checkProtectedMain,REQUIRED};
