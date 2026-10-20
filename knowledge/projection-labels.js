/* Deterministic collision-aware label placement for the original SVG lesson. */
(function(root,factory){const api=factory();if(typeof module==='undefined')root.ProjectionLabels=api;else module.exports=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function crossesRect(segment,rect){
 const [x1,y1,x2,y2]=segment,dx=x2-x1,dy=y2-y1;
 let low=0,high=1;
 for(const [p,q] of [[-dx,x1-rect[0]],[dx,rect[2]-x1],[-dy,y1-rect[1]],[dy,rect[3]-y1]]){
  if(p===0){if(q<0)return false;continue}
  const t=q/p;
  if(p<0)low=Math.max(low,t);else high=Math.min(high,t);
  if(low>high)return false;
 }
 return true;
}
function layout(points,lines=[]){
 const occupied=[];
 const pointCenters=points.map(p=>p.xy);
 return points.map(point=>{
  const [x,y]=point.xy,name=point.name+({V:'′',H:'',W:'″'}[point.view]||'');
  const width=10+name.length*9,height=18;
  const offsets=[[9,-11],[9,21],[-width-9,-11],[-width-9,21],[13,3],[-width-13,3]];
  const candidates=offsets.map(([dx,dy])=>{
   const px=Math.max(5,Math.min(960-width,x+dx)),py=Math.max(20,Math.min(640,y+dy));
   const rect=[px,py-height,px+width,py+2];
   const overlap=occupied.reduce((sum,r)=>sum+Math.max(0,Math.min(rect[2],r[2])-Math.max(rect[0],r[0]))*Math.max(0,Math.min(rect[3],r[3])-Math.max(rect[1],r[1])),0);
   // Prefer labels that avoid both previously placed text and every projection dot.
   const dotOverlap=pointCenters.reduce((sum,[cx,cy])=>{
    const nearX=Math.max(rect[0],Math.min(cx,rect[2]));
    const nearY=Math.max(rect[1],Math.min(cy,rect[3]));
    return sum+((cx-nearX)**2+(cy-nearY)**2<36?1000:0);
   },0);
   const lineOverlap=lines.reduce((sum,line)=>sum+(Array.isArray(line.xy)&&crossesRect(line.xy,rect)?250:0),0);
   return {x:px,y:py,rect,overlap:overlap+dotOverlap+lineOverlap};
  });
  candidates.sort((a,b)=>a.overlap-b.overlap);
  const best=candidates[0];occupied.push(best.rect);
  return {...point,label:name,labelX:best.x,labelY:best.y};
 });
}
return {layout,crossesRect};
});
