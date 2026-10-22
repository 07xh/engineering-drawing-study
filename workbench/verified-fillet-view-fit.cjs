'use strict';
/**
 * #377 F1: camera-only fit for the existing 07 SVG workbench.
 * Geometry is still produced by the existing mathematical solver and V5;
 * this never changes coordinates, units, branches or proof status.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>p!==null&&typeof p==='object'&&finite(p.x)&&finite(p.y);
function fitVerifiedDrawingView({problem,sheet,steps=[]}={}){
 if(!problem||problem.unit!=='mm'||!point(sheet?.origin)||
   !finite(sheet.scale)||sheet.scale<=0||!Array.isArray(steps))
  throw new TypeError('confirmed model-mm problem and positive sheet scale required');
 const ext={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
 const add=(p,r=0)=>{
  if(!point(p)||!finite(r)||r<0)
   throw new TypeError('invalid drawing view bounds');
  const left=p.x-r,right=p.x+r,top=p.y-r,bottom=p.y+r;
  if(![left,right,top,bottom].every(finite))throw new RangeError('drawing bounds overflow');
  ext.minX=Math.min(ext.minX,left);ext.maxX=Math.max(ext.maxX,right);
  ext.minY=Math.min(ext.minY,top);ext.maxY=Math.max(ext.maxY,bottom);
 };
 const map=p=>{
  if(!point(p))throw new TypeError('finite model-mm point required');
  return {x:sheet.origin.x+p.x*sheet.scale,y:sheet.origin.y-p.y*sheet.scale};
 };
 const line=s=>{if(!s||!point(s.a)||!point(s.b))throw new TypeError('invalid known segment');add(map(s.a));add(map(s.b));};
 const circle=c=>{if(!c||!point(c.center)||!finite(c.radius)||c.radius<=0)throw new TypeError('invalid known circle');add(map(c.center),c.radius*sheet.scale);};
 const g=problem.geometry;
 if(!g||typeof g!=='object')throw new TypeError('known model geometry required');
 if(problem.kind==='two-segments'){line(g.first);line(g.second);}
 else if(problem.kind==='two-circles'){circle(g.first);circle(g.second);}
 else if(problem.kind==='segment-circle'){line(g.segment);circle(g.circle);}
 else throw new TypeError('unsupported view fit kind');
 for(const step of steps){
  if(!step||!Array.isArray(step.actions))throw new TypeError('invalid proven V5 step');
  for(const a of step.actions){
   const v=a?.geometry;
   if(a?.kind==='line'){add(v?.from);add(v?.to);}
   else if(['point','circle','arc'].includes(a?.kind))
    add(v?.center,a.kind==='point'?0:v?.radius);
   else throw new TypeError('unsupported V5 action in view fit');
  }
 }
 const dx=ext.maxX-ext.minX,dy=ext.maxY-ext.minY;
 if(!finite(dx)||!finite(dy)||dx<0||dy<0)throw new RangeError('nonfinite drawing extent');
 const padding=Math.max(20,.12*Math.max(dx,dy));
 let width=Math.max(240,dx+2*padding),height=Math.max(440/3,dy+2*padding);
 const ratio=720/440;
 if(width/height>ratio)height=width/ratio;
 else width=height*ratio;
 const cx=(ext.minX+ext.maxX)/2,cy=(ext.minY+ext.maxY)/2;
 if(![cx,cy,width,height].every(finite)||width<=0||height<=0)
  throw new RangeError('invalid camera dimensions');
 return Object.freeze({viewBox:[cx-width/2,cy-height/2,width,height].join(' '),
  bounds:Object.freeze({...ext}),camera:Object.freeze({x:cx-width/2,y:cy-height/2,width,height})});
}
module.exports={fitVerifiedDrawingView};
