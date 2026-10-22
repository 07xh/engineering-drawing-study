'use strict';
/**
 * Experimental connected-ink circle/arc proposals for clean raster drawings.
 * Pure, bounded image-pixel geometry. Not OCR, vector CAD, calibrated mm or
 * mathematical proof; intersecting strokes may merge and thus be rejected.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function checkFrame(frame){
 const w=frame?.width,h=frame?.height;
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<32||h<32||
  w>900||h>900||!frame.data||frame.data.length!==4*w*h)
  throw new RangeError('bounded 32..900 RGBA frame required');
 return {w,h};
}
function inkMask(frame,w,h){
 const hist=new Uint32Array(256),gray=new Uint8Array(w*h);
 let low=255,high=0;
 for(let i=0;i<w*h;i++){
  const a=frame.data[4*i+3]/255;
  const v=Math.round(a*(.2126*frame.data[4*i]+
   .7152*frame.data[4*i+1]+.0722*frame.data[4*i+2])+
   (1-a)*255);
  const g=Math.max(0,Math.min(255,v));
  gray[i]=g;hist[g]++;if(g<low)low=g;if(g>high)high=g;
 }
 if(high-low<20)return null;
 let sum=0,total=w*h,leftSum=0,leftCount=0,best=-1,threshold=80;
 for(let k=0;k<256;k++)sum+=k*hist[k];
 for(let k=0;k<256;k++){
  leftSum+=k*hist[k];leftCount+=hist[k];
  const right=total-leftCount;if(!leftCount||!right)continue;
  const difference=leftSum/leftCount-(sum-leftSum)/right;
  const variance=leftCount*right*difference*difference;
  if(variance>best){best=variance;threshold=k;}
 }
 const mask=new Uint8Array(total);let count=0;
 const limit=Math.min(190,Math.max(38,threshold+16));
 for(let i=0;i<total;i++)if(gray[i]<=limit){mask[i]=1;count++;}
 return count>total*.32||count<35?null:mask;
}
function circleFit(points){
 const n=points.length;
 let mx=0,my=0;for(const p of points){mx+=p.x;my+=p.y;}
 mx/=n;my/=n;
 let xx=0,xy=0,yy=0,xr=0,yr=0;
 for(const p of points){
  const x=p.x-mx,y=p.y-my,q=(x*x+y*y)*.5;
  xx+=x*x;xy+=x*y;yy+=y*y;xr+=x*q;yr+=y*q;
 }
 const det=xx*yy-xy*xy;
 if(!(det>1e-7*xx*yy))return null;
 const cx=mx+(xr*yy-yr*xy)/det,cy=my+(yr*xx-xr*xy)/det;
 if(!finite(cx)||!finite(cy))return null;
 let radius=0;for(const p of points)radius+=Math.hypot(p.x-cx,p.y-cy);
 radius/=n;
 let sq=0;const angles=[];
 for(const p of points){
  const distance=Math.hypot(p.x-cx,p.y-cy);
  sq+=(distance-radius)**2;
  angles.push((Math.atan2(p.y-cy,p.x-cx)*180/Math.PI+360)%360);
 }
 angles.sort((a,b)=>a-b);
 let widest=-1,edge=0;
 for(let i=0;i<n;i++){
  const next=i===n-1?angles[0]+360:angles[i+1];
  const gap=next-angles[i];
  if(gap>widest){widest=gap;edge=i;}
 }
 const start=angles[(edge+1)%n],end=angles[edge],coverage=360-widest;
 return {center:{x:cx,y:cy},radius,radialRms:Math.sqrt(sq/n),
  coverageDeg:coverage,startAngle:start,endAngle:end};
}
function detectCurveCandidates(frame,{minRadius=10,minArcDegrees=72,maxCandidates=12}={}){
 const {w,h}=checkFrame(frame);
 if(!finite(minRadius)||minRadius<5||minRadius>200||
   !finite(minArcDegrees)||minArcDegrees<55||minArcDegrees>330||
   !Number.isInteger(maxCandidates)||maxCandidates<1||maxCandidates>25)
  throw new RangeError('invalid curve candidate options');
 const mask=inkMask(frame,w,h);if(!mask)return [];
 const visited=new Uint8Array(w*h),results=[],maxR=Math.hypot(w,h)*.8;
 const offsets=[-1,0,1];
 for(let idx=0;idx<mask.length;idx++){
  if(!mask[idx]||visited[idx])continue;
  visited[idx]=1;
  const queue=[idx],points=[];
  for(let head=0;head<queue.length;head++){
   const pos=queue[head],x=pos%w,y=Math.floor(pos/w);
   points.push({x,y});
   for(const dy of offsets)for(const dx of offsets){
    if(!dx&&!dy)continue;
    const nx=x+dx,ny=y+dy;
    if(nx<0||ny<0||nx>=w||ny>=h)continue;
    const ni=ny*w+nx;
    if(mask[ni]&&!visited[ni]){visited[ni]=1;queue.push(ni);}
   }
  }
  if(points.length<Math.max(36,minRadius*1.5)||points.length>w*h*.12)
   continue;
  const f=circleFit(points);if(!f)continue;
  if(f.radius<minRadius||f.radius>maxR||f.coverageDeg<minArcDegrees)
   continue;
  const rmsMax=Math.max(1.4,f.radius*.035);
  if(f.radialRms>rmsMax)continue;
  const circle=f.coverageDeg>=326;
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const minx=Math.min(...xs),maxx=Math.max(...xs),
   miny=Math.min(...ys),maxy=Math.max(...ys);
  // Tiny numerical radius or nearly straight strokes must not be promoted.
  if(maxx-minx<6||maxy-miny<6)continue;
  const center={x:Number(f.center.x.toFixed(2)),
   y:Number(f.center.y.toFixed(2))};
  const r=Number(f.radius.toFixed(2));
  const candidate={
   kind:circle?'circle':'arc',coordinateSpace:'image-px',
   center,radius:r,
   bbox:[minx,miny,maxx-minx+1,maxy-miny+1],
   coverageDeg:Number(f.coverageDeg.toFixed(1)),
   radialRmsPx:Number(f.radialRms.toFixed(3)),
   confidence:Number(Math.min(.88,.22+.55*(f.coverageDeg/360)-
    .14*f.radialRms/Math.max(f.radius,1)).toFixed(3)),
   method:'connected-ink-circlefit-candidate/0.1'
  };
  if(!circle){
   candidate.startAngle=Number(f.startAngle.toFixed(2));
   candidate.endAngle=Number(f.endAngle.toFixed(2));
   candidate.sweepDeg=Number(f.coverageDeg.toFixed(2));
   // Increasing angles are screen-space clockwise; not contour G1 semantics.
   candidate.sweepDirection='cw-screen';
  }
  if(results.some(old=>Math.hypot(old.center.x-center.x,
   old.center.y-center.y)<3&&Math.abs(old.radius-r)<3))continue;
  results.push(candidate);
 }
 results.sort((a,b)=>b.coverageDeg-a.coverageDeg||
  a.radialRmsPx-b.radialRmsPx);
 return results.slice(0,maxCandidates).map((c,i)=>({id:'curve_'+(i+1),...c}));
}
module.exports={detectCurveCandidates};
