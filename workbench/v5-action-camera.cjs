'use strict';
/**
 * P3 / 07: view-only camera derived from already verified V5 sheet-pixel
 * actions. This module neither reconstructs mathematical geometry nor
 * creates a second animation player. Unknown/out-of-sheet data has no focus.
 */
const Motion=require('./teaching-motion-v5.js');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const point=p=>p&&finite(p.x)&&finite(p.y);
const whole=(width,height)=>({x:0,y:0,width,height});
function actionBounds(action){
 const g=action?.geometry;
 if(!g||typeof g!=='object')return null;
 if(action.kind==='line'){
  if(!point(g.from)||!point(g.to))return null;
  return {minX:Math.min(g.from.x,g.to.x),maxX:Math.max(g.from.x,g.to.x),
   minY:Math.min(g.from.y,g.to.y),maxY:Math.max(g.from.y,g.to.y)};
 }
 if(!['point','circle','arc'].includes(action.kind)||!point(g.center))return null;
 const r=action.kind==='point'?(finite(g.radius)&&g.radius>0?g.radius:4):g.radius;
 if(!finite(r)||r<=0)return null;
 const b={minX:g.center.x-r,maxX:g.center.x+r,
  minY:g.center.y-r,maxY:g.center.y+r};
 return Object.values(b).every(finite)?b:null;
}
function actionViewBox(action,{width=720,height=470}={}){
 if(!finite(width)||!finite(height)||width<=0||height<=0)
  throw new RangeError('finite positive V5 sheet dimensions required');
 const full=whole(width,height),b=actionBounds(action);
 // Motion.focus cannot safely pan beyond the fixed sheet. Prefer unchanged
 // view instead of zooming into a clipped shape or inventing a second camera.
 if(!b||!Object.values(b).every(finite)||b.minX<0||b.minY<0||
    b.maxX>width||b.maxY>height)return full;
 const zoom=Math.min(1.8,width/(b.maxX-b.minX+120),
                     height/(b.maxY-b.minY+120));
 if(!finite(zoom)||zoom<=1.01)return full;
 return Motion.focus(b,{width,height,zoom});
}
module.exports={actionBounds,actionViewBox};
