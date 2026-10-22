'use strict';
/**
 * Local human tapping diagnostic in ORIGINAL image pixels. Known crosshair
 * coordinates are rendered on-device; reported residual includes fingertip
 * placement uncertainty and does NOT certify the hardware touch driver.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function createPhotoTouchCheck(){
 let targets=[],index=0,errors=[],status='idle';
 function snapshot(){
  const sum=errors.reduce((n,e)=>n+e,0);
  return {
   status,index,total:targets.length,
   target:status==='active'?{...targets[index]}:null,
   errors:[...errors],
   meanErrorPx:errors.length?Number((sum/errors.length).toFixed(2)):null,
   maxErrorPx:errors.length?Number(Math.max(...errors).toFixed(2)):null,
   isDeviceCertification:false
  };
 }
 return Object.freeze({
  start(image){
   if(!image||!Number.isSafeInteger(image.width)||
    !Number.isSafeInteger(image.height)||image.width<32||image.height<32||
    image.width>10000||image.height>10000)
    throw new TypeError('valid current original image dimensions required');
   const {width:w,height:h}=image;
   targets=[
    {x:.5*w,y:.5*h},
    {x:.2*w,y:.2*h},
    {x:.8*w,y:.2*h},
    {x:.2*w,y:.8*h},
    {x:.8*w,y:.8*h}
   ];
   index=0;errors=[];status='active';
   return snapshot();
  },
  tap(point){
   if(status!=='active')return {accepted:false,...snapshot()};
   if(!point||!finite(point.x)||!finite(point.y))
    return {accepted:false,...snapshot()};
   const target=targets[index];
   const deviation=Math.hypot(point.x-target.x,point.y-target.y);
   if(!finite(deviation))return {accepted:false,...snapshot()};
   errors.push(Number(deviation.toFixed(2)));
   index++;
   if(index===targets.length)status='complete';
   return {accepted:true,...snapshot()};
  },
  cancel(){
   status='idle';index=0;targets=[];errors=[];
   return snapshot();
  },
  snapshot
 });
}
module.exports={createPhotoTouchCheck};
