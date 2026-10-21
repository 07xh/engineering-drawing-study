'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {assessMainRules,RULES_PATH}=require('./main-rules.cjs');
function effectiveRules(){
 return [
  {type:'pull_request',parameters:{allowed_merge_methods:['squash'],required_approving_review_count:0}},
  {type:'non_fast_forward'},{type:'deletion'},{type:'required_linear_history'},
  {type:'required_status_checks',parameters:{strict_required_status_checks_policy:true,
   required_status_checks:[{context:'validate'},{context:'release-security'}]}}
 ];
}
test('fully enforced branch protection passes in manual and automatic modes',()=>{
 assert.equal(RULES_PATH,'/rules/branches/main?per_page=100&page=1');
 assert.equal(assessMainRules(effectiveRules()).ok,true);
 assert.equal(assessMainRules(effectiveRules(),{autoMerge:true}).ok,true);
});
test('empty, malformed or possibly paginated rules fail closed',()=>{
 for(const v of [undefined,null,[],{},Array(100).fill({type:'non_fast_forward'})])
  assert.equal(assessMainRules(v).ok,false);
});
test('each critical branch protection rule is required',()=>{
 for(const name of ['pull_request','non_fast_forward','deletion','required_linear_history','required_status_checks']){
  const rules=effectiveRules().filter(r=>r.type!==name);
  const result=assessMainRules(rules);
  assert.equal(result.ok,false);
  assert(result.reasons.some(x=>x.includes(name)||x.includes('status')),JSON.stringify(result));
 }
});
test('strict required checks must name both validate and release-security',()=>{
 const rules=effectiveRules(), last=rules.at(-1);
 for(const v of [[{context:'validate'}],[{context:'release-security'}],[]]){
  const list=rules.slice(0,-1).concat({...last,parameters:{...last.parameters,required_status_checks:v}});
  assert.equal(assessMainRules(list).ok,false);
 }
 const unstrict=rules.slice(0,-1).concat({...last,parameters:{...last.parameters,strict_required_status_checks_policy:false}});
 assert.equal(assessMainRules(unstrict).ok,false);
});
test('automatic merge needs zero required approvals and squash enabled',()=>{
 for(const changes of [{required_approving_review_count:1},{allowed_merge_methods:['merge']},
  {required_approving_review_count:null}]){
  const rules=effectiveRules(),first=rules[0];
  rules[0]={...first,parameters:{...first.parameters,...changes}};
  assert.equal(assessMainRules(rules,{autoMerge:true}).ok,false);
  assert.equal(assessMainRules(rules,{autoMerge:false}).ok,true);
 }
});
test('additional unrelated main rules can coexist without weakening required gates',()=>{
 const rules=effectiveRules().concat({type:'commit_message_pattern',parameters:{pattern:'feat'}});
 assert.equal(assessMainRules(rules,{autoMerge:true}).ok,true);
});
test('duplicated conflicting PR rules cannot silently permit auto merging',()=>{
 const rules=effectiveRules().concat({type:'pull_request',parameters:{required_approving_review_count:1,allowed_merge_methods:['squash']}});
 assert.equal(assessMainRules(rules,{autoMerge:true}).ok,false);
});
