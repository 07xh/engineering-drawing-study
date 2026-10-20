/* 教材解题动画的数据审核闸门：互联网检索结果不能成为作图步骤。
 * 数据必须由人工独立校核并绑定教材图版本；当前28题均为partial，全部拒绝。
 * 这是本地数据一致性检查，不代替审稿或几何证明。
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VerifiedSolutionCompiler=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const range=(n,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
const lineValid=p=>Array.isArray(p)&&p.length===4&&range(p[0],960)&&range(p[1],520)&&range(p[2],960)&&range(p[3],520);
function verify(source,recipe){
 const failures=[];
 if(!source||typeof source!=='object'||source.status!=='verified-complete')failures.push('原图尚未完成逐题校对');
 if(!source||typeof source.source!=='string'||!source.source.startsWith('教材第'))failures.push('缺少可核对的原题来源页');
 if(!source||source.coordinateAudit!=='verified')failures.push('尺寸、点位和投影坐标未完成审核');
 if(!source||source.visibilityAudit!=='verified')failures.push('可见性与虚实线仍未校核');
 if(!source||source.solutionAudit!=='verified')failures.push('独立求解步骤尚未几何验算');
 if(!source||typeof source.sourceFingerprint!=='string'||source.sourceFingerprint.length<12)failures.push('缺少原图版本标识');
 if(!recipe||recipe.sourceId!==source?.id||recipe.sourceFingerprint!==source?.sourceFingerprint)failures.push('解题数据未绑定同一版本的教材原题');
 if(!recipe||recipe.reviewStatus!=='verified'||recipe.reviewedBy!=='human-audit')failures.push('解题数据尚未经人工审核');
 if(!recipe||!Array.isArray(recipe.steps)||!recipe.steps.length)failures.push('没有可复核的解题线段步骤');
 if(recipe&&Array.isArray(recipe.steps)){
  for(const [i,step] of recipe.steps.entries()){
   if(!step||!['construction','solution'].includes(step.kind)||typeof step.why!=='string'||step.why.trim().length<8||!Array.isArray(step.lines)||!step.lines.length||!step.lines.every(lineValid))failures.push('第 '+(i+1)+' 个步骤格式或边界非法');
  }
 }
 return {approved:failures.length===0,failures};
}
function compile(source,recipe){
 const approval=verify(source,recipe);
 return {approved:approval.approved,reasons:approval.failures,steps:approval.approved?recipe.steps.map(s=>({kind:s.kind,why:s.why,lines:s.lines.map(x=>x.slice())})):[]};
}
return {verify,compile};
});
