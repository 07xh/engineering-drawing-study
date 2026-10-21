'use strict';
/**
 * Carefully constrained opt-in squash auto-merge for a single low-risk CSS PR.
 * This script must run only from the trusted default-branch workflow_run
 * runner, NEVER from code checked out from an untrusted pull request.
 */
const fs=require('node:fs');
const {makeSafeReader,collectPullRequestDiff}=require('../../tests/security/github-evidence.cjs');
const {makeGithubReader}=require('./protected-main.cjs');
const {RULES_PATH,assessMainRules}=require('./main-rules.cjs');
const REPO='07xh/engineering-drawing-study',SHA=/^[0-9a-f]{40}$/;
const REQUIRED=Object.freeze(['validate','release-security']);
function targetOfWorkflowRun(payload){
 const r=payload?.workflow_run;
 if(r?.event!=='pull_request'||r.conclusion!=='success'||
    r.head_repository?.full_name!==REPO||!SHA.test(r.head_sha||'')||
    !Array.isArray(r.pull_requests)||r.pull_requests.length!==1||
    !Number.isInteger(r.pull_requests[0]?.number)||r.pull_requests[0].number<1)
  return null;
 return {number:r.pull_requests[0].number,headSha:r.head_sha};
}
async function checkSafeAutoMerge({payload,read,inspect=collectPullRequestDiff}={}){
 const refuse=(reason)=>({ok:false,reason});
 const target=targetOfWorkflowRun(payload);
 if(!target||typeof read!=='function')return refuse('not a trusted single PR completion event');
 let main,pr,checks;
 try{
  main=await read('/branches/main');
  if(main?.protected!==true||!SHA.test(main?.commit?.sha||''))
   return refuse('main lacks enforceable GitHub branch protection');
  const effective=assessMainRules(await read(RULES_PATH),{autoMerge:true});
  if(!effective.ok)return refuse('main rules not safe for automated merging: '+effective.reasons.join('; '));
  const diff=await inspect({prNumber:target.number,read});
  if(diff?.verified!==true||diff.headSha!==target.headSha||
     diff.changedFiles?.length!==1||diff.changedFiles[0]!=='site-ui.css')
   return refuse('PR diff or provenance is not approved');
  pr=await read('/pulls/'+target.number);
  if(pr?.head?.sha!==target.headSha||pr.base?.ref!=='main'||pr.base?.repo?.full_name!==REPO||
     pr.head?.repo?.full_name!==REPO||pr.draft!==false||pr.mergeable!==true||
     pr.mergeable_state!=='clean'||pr.state!=='open'||pr.base?.sha!==main.commit.sha)
   return refuse('PR is stale, risky, not merge-ready or not targeting protected main');
  checks=await read('/commits/'+target.headSha+'/check-runs?per_page=100');
  if(!Array.isArray(checks?.check_runs)||checks.total_count!==checks.check_runs.length)
   return refuse('required checks incomplete');
  for(const name of REQUIRED){
   const matched=checks.check_runs.filter(x=>x?.name===name&&x.head_sha===target.headSha);
   if(matched.length<1||matched.some(check=>check.status!=='completed'||check.conclusion!=='success'))
    return refuse('required check not successful: '+name);
  }
  const finalRules=assessMainRules(await read(RULES_PATH),{autoMerge:true});
  if(!finalRules.ok)return refuse('main rules changed during merge eligibility check');
  const after=await read('/branches/main');
  if(after?.protected!==true||after.commit?.sha!==main.commit.sha)
   return refuse('main moved during automatic merge review');
  return {ok:true,prNumber:target.number,headSha:target.headSha,baseSha:main.commit.sha};
 }catch{return refuse('GitHub trusted merge evidence unavailable')}
}
function mergeRestClient({token,fetchImpl=globalThis.fetch}={}){
 if(typeof token!=='string'||token.length<8||/[\r\n]/.test(token)||typeof fetchImpl!=='function')
  throw Error('trusted GitHub auto-merge credentials unavailable');
 return async({prNumber,headSha})=>{
  if(!Number.isInteger(prNumber)||prNumber<1||prNumber>2147483647||!SHA.test(headSha||''))
   throw Error('invalid merge target');
  let res;
  try{res=await fetchImpl('https://api.github.com/repos/'+REPO+'/pulls/'+prNumber+'/merge',{
   method:'PUT',redirect:'error',signal:AbortSignal.timeout(15000),
   headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json',
    'content-type':'application/json','X-GitHub-Api-Version':'2022-11-28'},
   body:JSON.stringify({sha:headSha,merge_method:'squash',
    commit_title:'style: verified low-risk DraftAI update (#'+prNumber+')'})
  });}catch{throw Error('GitHub merge request failed')}
  if(res?.status!==200)throw Error('GitHub refused automatic merge');
  let result;try{result=await res.json()}catch{throw Error('GitHub merge confirmation invalid')}
  if(result?.merged!==true||!SHA.test(result.sha||''))
   throw Error('GitHub did not confirm a completed squash merge');
  return {mergeSha:result.sha};
 };
}
async function tryAutoMerge({enabled,payload,read,inspect,merge}={}){
 if(enabled!==true)return {status:'disabled'};
 const review=await checkSafeAutoMerge({payload,read,inspect});
 if(!review.ok)return {status:'blocked',reason:review.reason};
 if(typeof merge!=='function')return {status:'blocked',reason:'GitHub trusted merger absent'};
 try{
  const result=await merge({prNumber:review.prNumber,headSha:review.headSha});
  if(!SHA.test(result?.mergeSha||''))return {status:'blocked',reason:'no verified merge SHA'};
  return {status:'merged',prNumber:review.prNumber,headSha:review.headSha,mergeSha:result.mergeSha};
 }catch{return {status:'blocked',reason:'GitHub did not merge the PR'};}
}
async function main(){
 if(process.env.DRAFTAI_AUTO_MERGE_ENABLED!=='true')return;
 // GitHub's default GITHUB_TOKEN suppresses push-triggered workflows after
 // bot merges. A dedicated GitHub App/PAT token is mandatory for real CI cascade.
 const token=process.env.GITHUB_TOKEN;
 const mergeToken=process.env.DRAFTAI_MERGE_TOKEN;
 if(!mergeToken)throw Error('dedicated merge token is not configured');
 const payload=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
 const prReader=makeSafeReader({token});
 const mainReader=makeGithubReader({token});
 const read=path=>(path==='/branches/main'||path===RULES_PATH||/^\/commits\/[0-9a-f]{40}\/check-runs\?per_page=100$/.test(path))?
  mainReader(path):prReader(path);
 const merge=mergeRestClient({token:mergeToken});
 const result=await tryAutoMerge({enabled:true,payload,read,merge});
 console.log(JSON.stringify(result));
 if(result.status!=='merged')process.exitCode=1;
}
if(require.main===module)main().catch(e=>{console.error('BLOCK:',e.message);process.exitCode=1});
module.exports={targetOfWorkflowRun,checkSafeAutoMerge,mergeRestClient,tryAutoMerge};
