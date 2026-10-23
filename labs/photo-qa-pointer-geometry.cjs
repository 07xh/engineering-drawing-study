'use strict';
/**
 * Pure mobile/mouse photo QA pointer geometry: original image pixels remain
 * invariant under CSS width, page scroll, pan and nonuniform viewport sizes.
 * The pointer rect MUST be the actual visible overlay boundingClientRect.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function imagePointFromClient(pointer,rect,image){
 if(!pointer||!rect||!image||
   ![pointer.clientX,pointer.clientY,rect.left,rect.top,
     rect.width,rect.height,image.width,image.height].every(finite)||
   rect.width<=0||rect.height<=0||image.width<=0||image.height<=0)
  return null;
 const u=(pointer.clientX-rect.left)/rect.width;
 const v=(pointer.clientY-rect.top)/rect.height;
 if(u<0||u>1||v<0||v>1)return null;
 return {x:u*image.width,y:v*image.height};
}
/** Keep a drag as a *single-pointer* action.
 * Second contact, cancellation or lost capture invalidates the entire
 * gesture; neither the pointer's last good position nor a stale image is
 * silently promoted to new human ground truth.
 */
function createPhotoQaGesture(){
 const active=new Set();
 let blocked=false,current=null;
 const copy=()=>current?{
  pointerId:current.pointerId,kind:current.kind,
  start:{...current.start},last:{...current.last}
 }:null;
 return Object.freeze({
  down(id,point,kind){
   if(!Number.isSafeInteger(id)||id<0||!point||
    !finite(point.x)||!finite(point.y)||typeof kind!=='string')
    return {status:'ignored'};
   if(active.has(id))return {status:'ignored'};
   active.add(id);
   if(active.size>1||blocked){
    blocked=true;current=null;return {status:'multitouch-cancelled'};
   }
   current={pointerId:id,kind,start:{...point},last:{...point}};
   return {status:'started',gesture:copy()};
  },
  move(id,point){
   if(!current||blocked||current.pointerId!==id||
    !point||!finite(point.x)||!finite(point.y))return null;
   current.last={...point};return copy();
  },
  up(id,point){
   active.delete(id);
   if(blocked){
    if(active.size===0)blocked=false;
    current=null;return {status:'cancelled'};
   }
   if(!current||current.pointerId!==id)return {status:'ignored'};
   const gesture=copy();current=null;
   if(!point||!finite(point.x)||!finite(point.y))
    return {status:'outside-cancelled'};
   gesture.last={...point};return {status:'completed',gesture};
  },
  cancel(id){
   active.delete(id);
   current=null;
   if(active.size===0)blocked=false;
   else blocked=true;
   return {status:'cancelled'};
  },
  reset(){
   active.clear();blocked=false;current=null;
  },
  snapshot:copy,
  get blocked(){return blocked;},
  get pointers(){return active.size;}
 });
}
module.exports={imagePointFromClient,createPhotoQaGesture};
