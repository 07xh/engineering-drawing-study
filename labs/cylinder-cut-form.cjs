'use strict';
/* Human-supplied metric inputs for the local cylinder-cut lab only.
 * The geometry solver independently revalidates every result.
 */
const fields=Object.freeze(['radius','height','px','py','pz','nx','ny','nz']);
function checkedGeometry(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))
  throw new TypeError('editable section fields required');
 const nums={};
 for(const name of fields){
  const value=raw[name];
  if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>1e7)
   throw new TypeError(name+' must be a bounded finite number');
  nums[name]=value;
 }
 if(nums.radius<=1e-7||nums.height<=1e-7)
  throw new RangeError('cylinder radius and height must be positive mm');
 if(Math.hypot(nums.nx,nums.ny,nums.nz)<=1e-12)
  throw new RangeError('plane normal cannot be zero');
 const {kept,vdir,hdir,wdir}=raw;
 if(!['positive','negative'].includes(kept))
  throw new TypeError('retained side of section plane must be confirmed');
 for(const [label,val] of [['vdir',vdir],['hdir',hdir],['wdir',wdir]])
  if(!['1','-1'].includes(val))throw new TypeError(label+' observer sign required');
 return {
  cylinder:{baseCenter:{x:0,y:0,z:0},radiusMm:nums.radius,heightMm:nums.height},
  plane:{point:{x:nums.px,y:nums.py,z:nums.pz},
   normal:{x:nums.nx,y:nums.ny,z:nums.nz}},
  options:{retainedHalfspace:kept,
   observerDirections:{
    V:{x:0,y:Number(vdir),z:0},
    H:{x:0,y:0,z:Number(hdir)},
    W:{x:Number(wdir),y:0,z:0}
   },
   samplesPerTurn:64
  }
 };
}
module.exports={fields,checkedGeometry};
