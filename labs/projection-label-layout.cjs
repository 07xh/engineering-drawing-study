'use strict';
// Display-only placement; the supplied geometric point is never modified.
function placeLabel(point,label,camera,occupied){
 const size=14,width=Math.min(camera.width,Math.max(size,[...label].reduce((n,c)=>n+(c.charCodeAt(0)>255?size:8),0)));
 if(point.x<camera.x||point.x>camera.x+camera.width||point.y<camera.y||point.y>camera.y+camera.height){
  const result={x:point.x+10,y:point.y-10,width};occupied.push(result);return result;
 }
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const x0=camera.x,x1=camera.x+camera.width-width;
 const y0=camera.y+16,y1=camera.y+camera.height-5;
 const choices=[[10,-10],[-width-10,-10],[10,24],[-width-10,24]];
 const candidates=choices.map(([dx,dy])=>({x:clamp(point.x+dx,x0,x1),y:clamp(point.y+dy,y0,y1),width}));
 const overlap=a=>occupied.reduce((total,b)=>total+Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y,b.y)-Math.max(a.y-20,b.y-20)),0);
 const chosen=candidates.reduce((best,c)=>overlap(c)<overlap(best)?c:best);
 occupied.push(chosen);return chosen;
}
module.exports={placeLabel};
