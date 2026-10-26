'use strict';
/**
 * Shared C1 paper-support overlap predicate, intentionally outside the
 * real-OCCT-to-V5 adapter. Canonical M4/M5 source-event consumers must be
 * callable FROM the adapter's independent native source gate without
 * circular CommonJS partial exports. This is diagnostic 2D overlap only,
 * NEVER a physical 3D source depth or engineering line signer.
 */
function positiveCollinearOverlap(a,b,c,d,tol=1e-6){
 const dx=b.u-a.u,dy=b.v-a.v,L=Math.hypot(dx,dy);
 if(!(L>1e-9))return false;
 const lineError=p=>Math.abs(dx*(p.v-a.v)-dy*(p.u-a.u))/L;
 if(lineError(c)>tol||lineError(d)>tol)return false;
 const fraction=p=>((p.u-a.u)*dx+(p.v-a.v)*dy)/(L*L);
 const [lo,hi]=[fraction(c),fraction(d)].sort((x,y)=>x-y);
 return Math.min(1,hi)-Math.max(0,lo)>tol/Math.max(1,L);
}
module.exports={positiveCollinearOverlap};
