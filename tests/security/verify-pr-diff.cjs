'use strict';
/**
 * Read-only, fail-closed inspection of GitHub PR-file and git-tree evidence.
 * The caller MUST obtain all objects from a trusted GitHub connection and
 * verify that the tree belongs to the PR head. No API request/merge/deploy here.
 * Passing only grants eligibility for further independently verified gates.
 */
const REPOSITORY='07xh/engineering-drawing-study';
const SHA=/^[0-9a-f]{40}$/;
const LOW_RISK_CSS='site-ui.css';
const MAX_CHANGED_LINES=24;
function inspectAddedCss(patch){
  if(typeof patch!=='string'||patch.length>12000||!/^@@ /m.test(patch))return 'missing/truncated CSS hunk';
  const additions=patch.split('\n').filter(line=>line.startsWith('+')&&!line.startsWith('+++'));
  if(!additions.length||additions.length>MAX_CHANGED_LINES)return 'CSS addition count outside safe bound';
  for(const line of additions){
    const css=line.slice(1);
    if(/[\\\u0000-\u001f]/.test(css))return 'CSS escapes/control characters need review';
    if(/@(?:import|font-face|namespace|charset|supports)|url\s*\(|expression\s*\(|behavior\s*:|-moz-binding|(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:[;}\s]|$))|<\/?(?:script|style)/i.test(css))
      return 'potentially sensitive CSS rule or external resource';
  }
  return null;
}
function verifyPullRequestDiff(snapshot){
  const reasons=[];
  if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))
    return {eligible:false,status:'blocked',reasons:['missing trusted PR evidence'],approvedFiles:[]};
  const {repository,pullRequest:pr,files,filesComplete,headTree}=snapshot;
  if(repository!==REPOSITORY)reasons.push('repository mismatch');
  if(!pr||typeof pr!=='object'||pr.base?.ref!=='main'||pr.head?.repo?.full_name!==REPOSITORY||
      !SHA.test(pr.head?.sha||'')||pr.state!=='open'||pr.draft!==false||pr.mergeable!==true)
    reasons.push('invalid PR origin, base, draft or merge state');
  if(filesComplete!==true||!Array.isArray(files)||files.length!==1||pr?.changed_files!==files?.length)
    reasons.push('incomplete or unexpectedly sized PR file list');
  if(!headTree||headTree.forCommitSha!==pr?.head?.sha||headTree.truncated!==false||
     !Array.isArray(headTree.tree))reasons.push('missing complete head commit tree');
  const allowed=[];
  if(Array.isArray(files)){
    for(const f of files){
      if(!f||typeof f!=='object'||f.filename!==LOW_RISK_CSS||f.status!=='modified'||
         f.previous_filename!==undefined||!Number.isSafeInteger(f.additions)||
         !Number.isSafeInteger(f.deletions)||f.additions<1||f.deletions<0||
         f.additions>MAX_CHANGED_LINES||f.deletions>MAX_CHANGED_LINES||
         f.changes!==f.additions+f.deletions){
        reasons.push('non-allowlisted, deleted, renamed or oversized PR edit');
        continue;
      }
      const patchLines=typeof f.patch==='string'?f.patch.split('\n'):[];
      const actualAdditions=patchLines.filter(line=>line.startsWith('+')&&!line.startsWith('+++')).length;
      const actualDeletions=patchLines.filter(line=>line.startsWith('-')&&!line.startsWith('---')).length;
      if(actualAdditions!==f.additions||actualDeletions!==f.deletions){
        reasons.push('PR file patch incomplete or mismatched with GitHub change counts');continue;
      }
      const matching=Array.isArray(headTree?.tree)?headTree.tree.filter(entry=>entry.path===f.filename):[];
      if(matching.length!==1||matching[0].mode!=='100644'||matching[0].type!=='blob'||!SHA.test(f.sha||'')||matching[0].sha!==f.sha){
        reasons.push('file missing, non-regular or ambiguous at checked head commit');continue;
      }
      const unsafe=inspectAddedCss(f.patch);
      if(unsafe){reasons.push(unsafe);continue;}
      allowed.push(f.filename);
    }
  }
  return {eligible:reasons.length===0,status:reasons.length?'blocked':'diff-only-eligible',reasons,approvedFiles:reasons.length?[]:allowed};
}
module.exports={inspectAddedCss,verifyPullRequestDiff};
