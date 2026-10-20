/* Pure progress mapping: both endpoints are reachable; first prose step shows first drawing stage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LessonStageMapping=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function mapStep(step,total,frames=4){
 if(!Number.isInteger(total)||total<1||!Number.isInteger(frames)||frames<1)throw Error('invalid stage counts');
 if(!Number.isFinite(step))throw Error('invalid lesson step');
 const index=Math.max(1,Math.min(total,Math.trunc(step)))-1;
 return total===1?0:Math.round(index*(frames-1)/(total-1));
}
return {mapStep};
});
