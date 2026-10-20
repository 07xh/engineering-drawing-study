/* Explanation of the representative point only, not a proof for the whole solid. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ProjectionConstraintLessons=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const steps=[
 '尚未给出代表点的投影坐标：空间位置有 x、y、z 三个独立未知量。',
 '正视图 V 给出横向 x 与高度 z；深度 y 仍未知，所以代表点还能沿深度方向移动。',
 '俯视图 H 给出 x 与深度 y；其中 x 与正视图重复，新增的 y 与已知 z 合起来确定代表点位置。',
 '侧视图 W 给出 y 与 z，用于核对宽相等、高平齐；对已确定的代表点，它不再减少自由度。'
];
function describe(stage,degree){
 if(!Number.isInteger(stage)||stage<0||stage>=steps.length)throw Error('无效的投影步骤');
 const expected=[3,1,0,0][stage];
 return {text:steps[stage],expected,consistent:degree===expected};
}
return {describe};
});
