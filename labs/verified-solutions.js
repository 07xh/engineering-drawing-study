/* 教材题的人工核验解题步骤仓库：留空是安全状态，不是漏题。
 * 网络搜集、AI生成或普通方法演示不得直接填写。
 * 每个条目必须单独经原图几何审核、可见性核对与独立复算。
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VerifiedExerciseSolutions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const reviewed=Object.freeze({});
return {get(id){return Object.prototype.hasOwnProperty.call(reviewed,id)?reviewed[id]:null},ids:Object.keys(reviewed)};
});
