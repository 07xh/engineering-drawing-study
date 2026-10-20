/* Deterministic collision-aware label placement for the original SVG lesson. */
(function(root,factory){const api=factory();if(typeof module==='undefined')root.ProjectionLabels=api;else module.exports=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function layout(points){
 const occupied=[];
 return points.map(point=>{
  const [x,y]=point.xy,name=point.name+({V:'′',H:'',W:'″'}[point.view]||'');
  const width=10+name.length*9,height=18;
  const offsets=[[9,-11],[9,21],[-width-9,-11],[-width-9,21],[13,3],[-width-13,3]];
  const candidates=offsets.map(([dx,dy])=>{
   const px=Math.max(5,Math.min(960-width,x+dx)),py=Math.max(20,Math.min(640,y+dy));
   const rect=[px,py-height,px+width,py+2];
   const overlap=occupied.reduce((sum,r)=>sum+Math.max(0,Math.min(rect[2],r[2])-Math.max(rect[0],r[0]))*Math.max(0,Math.min(rect[3],r[3])-Math.max(rect[1],r[1])),0);
   return {x:px,y:py,rect,overlap};
  });
  candidates.sort((a,b)=>a.overlap-b.overlap);
  const best=candidates[0];occupied.push(best.rect);
  return {...point,label:name,labelX:best.x,labelY:best.y};
 });
}
return {layout};
});
