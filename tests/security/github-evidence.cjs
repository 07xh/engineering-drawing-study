'use strict';
/**
 * Read-only GitHub PR evidence adapter, intended for a future trusted CI runner.
 * This does NOT merge, approve, deploy, read secrets, or assert main protection.
 * All returned data must still pass verifyPullRequestDiff and other release gates.
 */
const {verifyPullRequestDiff}=require('./verify-pr-diff.cjs');
const REPO='07xh/engineering-drawing-study';
const ROOT='https://api.github.com/repos/'+REPO;
const SHA=/^[0-9a-f]{40}$/;
const MAX_PR=2147483647;
function makeSafeReader({token,fetchImpl=globalThis.fetch}={}){
  if(typeof fetchImpl!=='function')throw Error('trusted fetch unavailable');
  if(token!==undefined&&(typeof token!=='string'||token.length<8||/[\r\n]/.test(token)))
    throw Error('invalid GitHub read-only token');
  return async function read(path){
    if(typeof path!=='string'||!/^\/(pulls\/\d+(?:\/files\?per_page=100&page=[12])?|commits\/[0-9a-f]{40}|git\/trees\/[0-9a-f]{40}\?recursive=1)$/.test(path))
      throw Error('disallowed GitHub API read path');
    const url=ROOT+path;
    const headers={accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
    if(token)headers.authorization='Bearer '+token;
    let response;
    try{response=await fetchImpl(url,{method:'GET',redirect:'error',headers,signal:AbortSignal.timeout(10000)});}
    catch{throw Error('GitHub read request failed')}
    if(!response||response.status!==200)throw Error('GitHub read failed with HTTP '+(response?.status??'unknown'));
    try{return await response.json();}catch{throw Error('GitHub API JSON invalid')}
  };
}
async function collectPullRequestDiff({prNumber,read}={}){
  const fail=(reason)=>({verified:false,status:'blocked',reasons:[reason],diffEvidence:null});
  if(!Number.isSafeInteger(prNumber)||prNumber<=0||prNumber>MAX_PR||typeof read!=='function')
    return fail('invalid PR number or trusted GitHub reader');
  let pr,files,secondPage,commit,tree;
  try{
    pr=await read('/pulls/'+prNumber);
    if(!pr||pr.number!==prNumber||pr.base?.repo?.full_name!==REPO||pr.head?.repo?.full_name!==REPO||
       !SHA.test(pr.head?.sha||'')||pr.changed_files!==1)
      return fail('GitHub PR origin or exact single-file requirement failed');
    files=await read('/pulls/'+prNumber+'/files?per_page=100&page=1');
    secondPage=await read('/pulls/'+prNumber+'/files?per_page=100&page=2');
    if(!Array.isArray(files)||files.length!==1||!Array.isArray(secondPage)||secondPage.length!==0)
      return fail('GitHub PR files not complete');
    commit=await read('/commits/'+pr.head.sha);
    if(commit?.sha!==pr.head.sha||!SHA.test(commit?.commit?.tree?.sha||''))
      return fail('GitHub commit and tree object not bound to head SHA');
    tree=await read('/git/trees/'+commit.commit.tree.sha+'?recursive=1');
    if(tree?.sha!==commit.commit.tree.sha||tree.truncated!==false||!Array.isArray(tree.tree))
      return fail('GitHub tree missing, truncated, or mismatched');
  }catch(error){return fail('GitHub read-only evidence unavailable: '+String(error?.message||'Error'))}
  const diffEvidence={repository:REPO,
    pullRequest:{base:{ref:pr.base.ref},head:{sha:pr.head.sha,repo:{full_name:pr.head.repo.full_name}},
      state:pr.state,draft:pr.draft,mergeable:pr.mergeable,changed_files:pr.changed_files},
    files:files.map(f=>({filename:f.filename,previous_filename:f.previous_filename,sha:f.sha,status:f.status,
      additions:f.additions,deletions:f.deletions,changes:f.changes,patch:f.patch})),filesComplete:true,
    headTree:{forCommitSha:pr.head.sha,truncated:tree.truncated,tree:tree.tree.map(x=>({path:x.path,mode:x.mode,type:x.type,sha:x.sha}))}};
  const result=verifyPullRequestDiff(diffEvidence);
  return {verified:result.eligible,status:result.eligible?'trusted-read-diff-only':'blocked',
    reasons:result.reasons,headSha:pr.head.sha,changedFiles:result.approvedFiles,diffEvidence:result.eligible?diffEvidence:null};
}
module.exports={makeSafeReader,collectPullRequestDiff};
