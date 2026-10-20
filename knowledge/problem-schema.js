/* Unified, source-safe engineering drawing problem contract.
 * This module validates metadata only; it never invents textbook drawings or solutions.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingProblemSchema=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const types=['point-projection','line-projection','plane-projection','solid-projection','section','intersection','dimensioning','other'];
const statuses=['source-pending','source-verified','steps-verified','solution-verified'];
const modes=['manual-steps','constraint-engine','geometry-engine'];
function validate(input){
 const errors=[];
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,errors:['题目必须是对象']};
 const str=(v)=>typeof v==='string'&&v.trim().length>0;
 if(!str(input.id))errors.push('缺少题目编号');
 if(!str(input.title))errors.push('缺少题目标题');
 if(!types.includes(input.type))errors.push('未知题型');
 if(!statuses.includes(input.status))errors.push('未知核验状态');
 if(!input.source||!str(input.source.book)||!Number.isInteger(input.source.page)||input.source.page<1)errors.push('必须提供教材名称及有效页码');
 if(!Array.isArray(input.givens))errors.push('已知条件必须是数组');
 if(!Array.isArray(input.steps))errors.push('作图步骤必须是数组');
 if(input.steps&&Array.isArray(input.steps)&&input.steps.some(s=>!s||!str(s.id)||!str(s.explanation)||!Array.isArray(s.actions)))errors.push('每步必须有编号、解释和绘图动作数组');
 if(!modes.includes(input.renderMode))errors.push('未知渲染模式');
 if(input.status==='solution-verified'&&(!str(input.source.answerRef)||!input.steps?.length))errors.push('已核验答案必须关联来源与作图步骤');
 if(input.renderMode!=='manual-steps'&&input.status==='source-pending')errors.push('未核验题目不能启用自动求解');
 return {ok:errors.length===0,errors};
}
return {types,statuses,modes,validate};
});
