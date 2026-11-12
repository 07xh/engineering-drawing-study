/* DraftAI 07 V4: presentation-only geometry motion. No geometric solving. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DA07Motion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TAU=2*Math.PI;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const between=(x,a,b)=>Math.max(a,Math.min(b,x));
const vec=p=>p&&finite(p.x)&&finite(p.y);
function progress(value){if(!finite(value))throw new TypeError('progress must be finite');return between(value,0,1);}
function assertPoint(p){if(!vec(p))throw new TypeError('screen point must be finite');}
function drawLine(from,to,t){
  assertPoint(from);assertPoint(to);
  const f=progress(t),end={x:from.x+(to.x-from.x)*f,y:from.y+(to.y-from.y)*f};
  if(!vec(end))throw new RangeError('screen line overflow');
  return {from:{...from},to:end,finished:f===1,pen:end};
}
function drawCircle(center,radius,t){
  assertPoint(center);
  if(!finite(radius)||radius<=0)throw new RangeError('invalid circle radius');
  const f=progress(t),length=TAU*radius,theta=-Math.PI/2+TAU*f;
  const pen={x:center.x+radius*Math.cos(theta),y:center.y+radius*Math.sin(theta)};
  if(!finite(length)||!vec(pen))throw new RangeError('circle overflow');
  return {cx:center.x,cy:center.y,r:radius,strokeDasharray:[length*f,length],
    strokeRotation:-90,pen,finished:f===1};
}
function drawArc(center,radius,startRadians,sweepRadians,t){
  assertPoint(center);
  if(!finite(radius)||radius<=0||!finite(startRadians)||!finite(sweepRadians)||
     Math.abs(sweepRadians)<=1e-12||Math.abs(sweepRadians)>=TAU-1e-12)
    throw new RangeError('invalid finite screen-space arc');
  const f=progress(t),endAngle=startRadians+sweepRadians*f;
  const a={x:center.x+radius*Math.cos(startRadians),y:center.y+radius*Math.sin(startRadians)};
  const b={x:center.x+radius*Math.cos(endAngle),y:center.y+radius*Math.sin(endAngle)};
  if(!vec(a)||!vec(b))throw new RangeError('arc overflow');
  const svgPath=f===0?'M '+a.x+' '+a.y:
    'M '+a.x+' '+a.y+' A '+radius+' '+radius+' 0 '+
    (Math.abs(sweepRadians*f)>Math.PI?1:0)+' '+(sweepRadians>0?1:0)+' '+b.x+' '+b.y;
  return {d:svgPath,pen:b,finished:f===1};
}
/* Returns a viewport, not new mathematical coordinates. Screen-space bounds only. */
function focusViewport(bounds,canvas={width:720,height:460},zoom=1.18){
  if(!canvas||!finite(canvas.width)||!finite(canvas.height)||canvas.width<=0||canvas.height<=0)
    throw new RangeError('invalid viewport canvas');
  if(!finite(zoom)||zoom<1||zoom>3)throw new RangeError('invalid zoom');
  if(!bounds)return {x:0,y:0,width:canvas.width,height:canvas.height};
  if(![bounds.minX,bounds.maxX,bounds.minY,bounds.maxY].every(finite)||
      bounds.minX>bounds.maxX||bounds.minY>bounds.maxY)throw new RangeError('invalid focus bounds');
  const width=canvas.width/zoom,height=canvas.height/zoom;
  const cx=(bounds.minX+bounds.maxX)/2,cy=(bounds.minY+bounds.maxY)/2;
  const x=between(cx-width/2,0,canvas.width-width);
  const y=between(cy-height/2,0,canvas.height-height);
  if(![x,y,width,height].every(finite))throw new RangeError('viewport overflow');
  return {x,y,width,height};
}
function easeViewport(current,target,factor=0.12,reducedMotion=false){
  if(!current||!target||!['x','y','width','height'].every(k=>finite(current[k])&&finite(target[k])))
    throw new TypeError('invalid viewport frames');
  const t=reducedMotion?1:progress(factor);
  return Object.fromEntries(['x','y','width','height'].map(k=>[k,current[k]+(target[k]-current[k])*t]));
}
function drawingStepMap(steps){
  if(!Array.isArray(steps))throw new TypeError('steps must be an array');
  const map=new Map();
  for(const [index,step] of steps.entries()){
    if(!step||typeof step.id!=='string'||!step.id||
      !Array.isArray(step.actionIds)||step.actionIds.some(x=>typeof x!=='string'||!x))
      throw new TypeError('invalid presentation step');
    for(const id of step.actionIds){
      if(map.has(id))throw new Error('duplicate drawing action id: '+id);
      map.set(id,{stepId:step.id,stepIndex:index});
    }
  }
  return map;
}
return {progress,drawLine,drawCircle,drawArc,focusViewport,easeViewport,drawingStepMap};
});
