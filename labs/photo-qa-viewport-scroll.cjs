'use strict';
/**
 * Compute a scroll position that centers an ORIGINAL image-space point
 * in a CSS scroll container. This affects only viewport position;
 * it cannot change pixel annotations, geometry or QA scores.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const bound=(n,min,max)=>Math.min(max,Math.max(min,n));
function scrollToImagePoint(image,target,viewport,container){
 if(!image||!target||!viewport||!container||
  ![image.width,image.height,target.x,target.y,
    viewport.width,viewport.height,container.width,container.height].every(finite)||
  image.width<=0||image.height<=0||
  viewport.width<=0||viewport.height<=0||
  container.width<=0||container.height<=0||
  target.x<0||target.x>image.width||target.y<0||target.y>image.height)
  return null;
 const maxX=Math.max(0,viewport.width-container.width);
 const maxY=Math.max(0,viewport.height-container.height);
 return {
  left:bound(target.x/image.width*viewport.width-container.width/2,0,maxX),
  top:bound(target.y/image.height*viewport.height-container.height/2,0,maxY)
 };
}
module.exports={scrollToImagePoint};
