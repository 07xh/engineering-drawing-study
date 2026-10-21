'use strict';
// Synthetic GitHub effective-rules response for offline unit tests ONLY.
// Never import into a production decision; release code reads the GitHub API.
const {RULES_PATH}=require('./main-rules.cjs');
function effectiveMainRules(){
 return [
  {type:'pull_request',parameters:{allowed_merge_methods:['squash'],required_approving_review_count:0}},
  {type:'non_fast_forward'},
  {type:'deletion'},
  {type:'required_linear_history'},
  {type:'required_status_checks',parameters:{
   strict_required_status_checks_policy:true,
   required_status_checks:[{context:'validate'},{context:'release-security'}]
  }}
 ];
}
module.exports={RULES_PATH,effectiveMainRules};
