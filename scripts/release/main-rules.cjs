'use strict';
/**
 * Strict "rules actually apply to main" checker for an unattended release.
 * GitHub's GET /rules/branches/main returns enforced rules only, including
 * applicable inherited rulesets. This verifies effective rule types; it
 * does NOT claim to audit bypass actors hidden from read-only API tokens.
 */
const REQUIRED_STATUS=Object.freeze(['validate','release-security']);
const RULES_PATH='/rules/branches/main?per_page=100&page=1';
function assessMainRules(rules,{autoMerge=false}={}){
 const reasons=[];
 if(!Array.isArray(rules)||rules.length===0||rules.length>=100||
    rules.some(r=>!r||typeof r.type!=='string'))
  return {ok:false,reasons:['effective branch rules missing, invalid or truncated']};
 const byType=type=>rules.filter(r=>r.type===type);
 for(const type of ['pull_request','non_fast_forward','deletion','required_linear_history']){
  if(byType(type).length===0)reasons.push('missing enforced main rule: '+type);
 }
 const pulls=byType('pull_request');
 if(autoMerge&&pulls.some(x=>
   !Array.isArray(x.parameters?.allowed_merge_methods)||
   !x.parameters.allowed_merge_methods.includes('squash')||
   !Number.isSafeInteger(x.parameters?.required_approving_review_count)||
   x.parameters.required_approving_review_count!==0))
  reasons.push('PR rules do not allow unattended squash merging');
 const statuses=byType('required_status_checks');
 if(statuses.length===0)reasons.push('required status check rules are missing');
 else{
  const contexts=new Set();
  for(const rule of statuses){
   const policy=rule.parameters;
   if(!policy||policy.strict_required_status_checks_policy!==true||
      !Array.isArray(policy.required_status_checks)||
      policy.required_status_checks.length===0){
    reasons.push('required status checks are not strictly enforced');continue;
   }
   for(const check of policy.required_status_checks){
    if(typeof check?.context==='string')contexts.add(check.context);
   }
  }
  for(const required of REQUIRED_STATUS)
   if(!contexts.has(required))reasons.push('main does not require check: '+required);
 }
 return {ok:reasons.length===0,reasons};
}
module.exports={REQUIRED_STATUS,RULES_PATH,assessMainRules};
