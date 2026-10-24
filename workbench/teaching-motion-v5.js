/* DraftAI 07 V5: presentation geometry lives entirely in sheet pixels. No solver. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DA07MotionV5=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TAU=Math.PI*2,finite=n=>typeof n==='number'&&Number.isFinite(n);
 const point=p=>p!==null&&typeof p==='object'&&finite(p.x)&&finite(p.y);
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 const fraction=t=>{if(!finite(t))throw new TypeError('finite animation fraction required');return clamp(t,0,1);};
 const pointCheck=p=>{if(!point(p))throw new TypeError('invalid sheet coordinate');};
 const copy=p=>({x:p.x,y:p.y});
 function line(from,to,t){
  pointCheck(from);pointCheck(to);const u=fraction(t);
  const pen={x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u};
  pointCheck(pen);return {from:copy(from),to:pen,pen,finished:u===1};
 }
 function circle(center,radius,t){
  pointCheck(center);
  if(!finite(radius)||radius<=0)throw new RangeError('invalid screen radius');
  const u=fraction(t),circumference=TAU*radius;
  const pen={x:center.x+radius*Math.sin(TAU*u),y:center.y-radius*Math.cos(TAU*u)};
  if(!finite(circumference))throw new RangeError('circle circumference overflow');
  pointCheck(pen);
  return {center:copy(center),radius,pen,visibleLength:circumference*u,circumference,finished:u===1};
 }
 function arc(center,radius,startRadians,sweepRadians,t){
  pointCheck(center);
  if(![radius,startRadians,sweepRadians].every(finite)||radius<=0||
      Math.abs(sweepRadians)<=1e-12||Math.abs(sweepRadians)>=TAU-1e-12)
   throw new RangeError('finite directed arc with sweep strictly between 0 and 2pi required');
  const u=fraction(t),s=startRadians,angle=s+sweepRadians*u;
  const from={x:center.x+radius*Math.cos(s),y:center.y+radius*Math.sin(s)};
  const pen={x:center.x+radius*Math.cos(angle),y:center.y+radius*Math.sin(angle)};
  pointCheck(from);pointCheck(pen);
  return {d:u===0?'M '+from.x+' '+from.y:
   'M '+from.x+' '+from.y+' A '+radius+' '+radius+' 0 '+
   (Math.abs(sweepRadians*u)>Math.PI?1:0)+' '+(sweepRadians>0?1:0)+' '+pen.x+' '+pen.y,
   pen,finished:u===1};
 }
 function projectArcFromVerifiedModel(data,{origin,scale}={}){
  if(!data||!point(data.center)||!finite(data.radius)||data.radius<=0||
      !finite(data.startAngle)||!finite(data.endAngle)||
      !['cw','ccw'].includes(data.direction)||!point(origin)||!finite(scale)||scale<=0)
   throw new TypeError('verified model arc and sheet transform required');
  const rawSweep=data.endAngle-data.startAngle;
  if(Math.abs(rawSweep)<=1e-9||Math.abs(rawSweep)>=360-1e-9||
      (rawSweep>0)!==(data.direction==='ccw'))
   throw new RangeError('model sweep and direction conflict');
  // The first-angle paper mapping y = originY - scale * modelY reverses orientation.
  const projected={center:{x:origin.x+data.center.x*scale,y:origin.y-data.center.y*scale},
    radius:data.radius*scale,startRadians:-data.startAngle*Math.PI/180,
    sweepRadians:-rawSweep*Math.PI/180};
  pointCheck(projected.center);
  if(!finite(projected.radius)||projected.radius<=0)throw new RangeError('model-to-sheet overflow');
  return projected;
 }
 function focus(bounds,{width=720,height=440,zoom=1.18}={}){
  if(![width,height,zoom].every(finite)||width<=0||height<=0||zoom<1||zoom>3)
   throw new RangeError('invalid focus canvas');
  if(bounds===null||bounds===undefined)return {x:0,y:0,width,height};
  if(![bounds.minX,bounds.maxX,bounds.minY,bounds.maxY].every(finite)||
      bounds.minX>bounds.maxX||bounds.minY>bounds.maxY)
   throw new TypeError('invalid shape bounds');
  const w=width/zoom,h=height/zoom;
  const cx=(bounds.minX+bounds.maxX)/2,cy=(bounds.minY+bounds.maxY)/2;
  const x=clamp(cx-w/2,0,width-w),y=clamp(cy-h/2,0,height-h);
  if(![x,y,w,h].every(finite))throw new RangeError('focus overflow');
  return {x,y,width:w,height:h};
 }
 function cameraTowards(current,target,deltaMs=16,timeConstantMs=170,reducedMotion=false){
  if(![current,target].every(v=>v&&['x','y','width','height'].every(k=>finite(v[k])))||
      !finite(deltaMs)||deltaMs<0||!finite(timeConstantMs)||timeConstantMs<=0)
   throw new RangeError('invalid camera interpolation');
  const blend=reducedMotion?1:1-Math.exp(-Math.min(deltaMs,1000)/timeConstantMs);
  return Object.fromEntries(['x','y','width','height'].map(k=>[k,current[k]+(target[k]-current[k])*blend]));
 }
 // A generic presentation-only curve: two exact signed radial coordinate
 // laws in one shared parameter. Display tessellation never proves math,
 // contour topology, visibility, national drawing style or V5 release.
 function projectAnalyticCurveFromVerifiedModel(g,sheet,view){
  if(!g||!g.parameter||!point(sheet?.origin)||
     !finite(sheet.scale)||sheet.scale<=0||
     !['V','H','W'].includes(view))
   throw new TypeError('explicit first-angle model curve and paper frame required');
  const a=g.parameter.from,b=g.parameter.to;
  const radial=c=>c?.kind==='signed-circle-radical'&&
   [c.center,c.offset,c.radius].every(finite)&&
   [-1,1].includes(c.sign)&&c.radius>0;
  if(!finite(a)||!finite(b)||b<=a||!radial(g.u)||!radial(g.v))
   throw new TypeError('finite analytic signed-radical curve domain required');
  const inDomain=c=>[a,b].every(x=>Math.abs(x-c.center)<=c.radius+
    1e-10*Math.max(1,c.radius,Math.abs(c.center)));
  if(!inDomain(g.u)||!inDomain(g.v))
   throw new RangeError('signed radial domain is not covered by both source circles');
  const frame={origin:copy(sheet.origin),scale:sheet.scale,
   signU:view==='W'?1:-1,signV:view==='H'?1:-1};
  return {parameter:{from:a,to:b},
   u:{...g.u},v:{...g.v},paper:frame,
   approximationScope:'svg-tessellation-only-not-math-proof'};
 }
 function evaluateAnalyticCurvePoint(g,parameter){
  if(!g||!g.parameter||!g.u||!g.v||!g.paper||
     !finite(parameter)||parameter<g.parameter.from||
     parameter>g.parameter.to)
   throw new TypeError('bounded analytic curve parameter required');
  const radial=c=>{
   const d=parameter-c.center;
   const value=(c.radius-Math.abs(d))*(c.radius+Math.abs(d));
   const tol=1e-10*Math.max(1,c.radius*c.radius);
   if(value<-tol)throw new RangeError('analytic curve escaped radial domain');
   return c.offset+c.sign*Math.sqrt(Math.max(0,value));
  };
  const u=radial(g.u),v=radial(g.v),f=g.paper;
  const p={x:f.origin.x+f.signU*u*f.scale,
   y:f.origin.y+f.signV*v*f.scale};
  pointCheck(p);return p;
 }
 function analyticCurve(g,t){
  const u=fraction(t);
  if(!g||!g.parameter||!g.paper||!finite(g.parameter.from)||
     !finite(g.parameter.to)||g.parameter.to<=g.parameter.from||
     !finite(g.paper.scale)||g.paper.scale<=0||
     ![-1,1].includes(g.paper.signU)||
     ![-1,1].includes(g.paper.signV))
   throw new TypeError('trusted V5 analytic curve presentation required');
  const lo=g.parameter.from;
  const hi=lo+(g.parameter.to-lo)*u;
  const start=evaluateAnalyticCurvePoint(g,lo);
  const pen=evaluateAnalyticCurvePoint(g,hi);
  if(u===0)return {d:'M '+start.x+' '+start.y,pen,finished:false,
   renderApproximationOnly:true};
  const positions=[start];
  // Adaptive tessellation uses midpoint AND quarter-point chord deviation.
  // It controls the display, never certifies the analytic source itself.
  // Fixed recursion budget prevents path explosions.
  const dist=(p,a,b)=>{
   const vx=b.x-a.x,vy=b.y-a.y,len=Math.hypot(vx,vy);
   if(len<=1e-12)return Math.hypot(p.x-a.x,p.y-a.y);
   return Math.abs(vx*(a.y-p.y)-vy*(a.x-p.x))/len;
  };
  function visit(a,pa,b,pb,depth){
   const q1=a+(b-a)*.25,m=a+(b-a)*.5,q3=a+(b-a)*.75;
   const p1=evaluateAnalyticCurvePoint(g,q1),
     pm=evaluateAnalyticCurvePoint(g,m),
     p3=evaluateAnalyticCurvePoint(g,q3);
   const error=Math.max(dist(p1,pa,pb),dist(pm,pa,pb),
      dist(p3,pa,pb));
   if(error<=.35||depth>=10){
    positions.push(pb);return;
   }
   visit(a,pa,m,pm,depth+1);
   visit(m,pm,b,pb,depth+1);
  }
  visit(lo,start,hi,pen,0);
  return {d:positions.map((p,i)=>(i?'L ':'M ')+p.x+' '+p.y).join(' '),
   pen,finished:u===1,renderApproximationOnly:true};
 }
 function actionShapeAttrs(action,t){
  if(!action||!action.geometry||typeof action.kind!=='string')throw new TypeError('missing presentation geometry');
  const g=action.geometry,u=fraction(t);
  if(action.kind==='line'){
   const v=line(g.from,g.to,u);
   return {x1:v.from.x,y1:v.from.y,x2:v.to.x,y2:v.to.y,opacity:1};
  }
  if(action.kind==='circle'){
   const v=circle(g.center,g.radius,u);
   return {cx:v.center.x,cy:v.center.y,r:v.radius,
    'stroke-dasharray':u>=1?'none':v.visibleLength+' '+v.circumference,opacity:u===0?0:1};
  }
  if(action.kind==='arc'){
   const v=arc(g.center,g.radius,g.startRadians,g.sweepRadians,u);
   return {d:v.d,opacity:u===0?0:1};
  }
  if(action.kind==='analytic-curve'){
   const v=analyticCurve(g,u);
   return {d:v.d,opacity:u===0?0:1};
  }
  if(action.kind==='point'){
   pointCheck(g.center);
   return {cx:g.center.x,cy:g.center.y,r:finite(g.radius)&&g.radius>0?g.radius:4,
     opacity:u===0?0:1};
  }
  throw new TypeError('unknown presentation shape kind: '+action.kind);
 }
 function updateSvg(node,action,t){
  if(!node||typeof node.setAttribute!=='function')throw new TypeError('SVG element required');
  const attrs=actionShapeAttrs(action,t);
  for(const [name,val] of Object.entries(attrs))node.setAttribute(name,String(val));
  return attrs;
 }
 return Object.freeze({line,circle,arc,projectArcFromVerifiedModel,
    projectAnalyticCurveFromVerifiedModel,evaluateAnalyticCurvePoint,
    analyticCurve,focus,cameraTowards,actionShapeAttrs,updateSvg});
});
