/* Explicit candidate filters; never chooses arbitrarily when ambiguous. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingCandidateFilter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function filter(result,criteria){
 if(!result||!Array.isArray(result.solutions)||!Array.isArray(criteria))throw Error('候选解和附加条件必须明确提供');
 let candidates=result.solutions.map(p=>({...p}));
 for(const c of criteria){
  if(!c||!['x-greater','x-less','y-greater','y-less','nearer-to','farther-from'].includes(c.type))throw Error('不支持的附加条件');
  if(c.type==='nearer-to'||c.type==='farther-from'){
   const ref=c.point||{};if(!finite(ref.x)||!finite(ref.y))throw Error('距离参照点无效');
   if(!candidates.length)continue;
   const distances=candidates.map(p=>Math.hypot(p.x-ref.x,p.y-ref.y));
   const target=c.type==='nearer-to'?Math.min(...distances):Math.max(...distances);
   candidates=candidates.filter((_,i)=>Math.abs(distances[i]-target)<=1e-8);
  }else{
   if(!finite(c.value))throw Error('比较阈值无效');
   const key=c.type.startsWith('x-')?'x':'y';
   const greater=c.type.endsWith('greater');
   candidates=candidates.filter(p=>greater?p[key]>c.value+1e-9:p[key]<c.value-1e-9);
  }
 }
 const status=candidates.length===0?'none':candidates.length===1?'unique':'multiple';
 return {status,solutionCount:candidates.length,solutions:candidates,reason:status==='multiple'?'附加条件仍不能确定唯一交点。':status==='none'?'没有候选点满足全部附加条件。':'附加条件筛选出唯一候选点。'};
}
return {filter};
});
