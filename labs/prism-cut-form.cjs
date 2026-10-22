'use strict';
/* Human-confirmed local millimetre prism/cutting plane form; no AI guessing. */
const fields=['sizeX','sizeY','sizeZ','px','py','pz','nx','ny','nz'];
function checkedPrismFields(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))
  throw new TypeError('explicit prism fields required');
 const n={};
 for(const k of fields){
  if(typeof raw[k]!=='number'||!Number.isFinite(raw[k])||Math.abs(raw[k])>1e6)
   throw new TypeError(k+' must be a bounded finite number');
  n[k]=raw[k];
 }
 if(['sizeX','sizeY','sizeZ'].some(k=>n[k]<=1e-6))
  throw new RangeError('all prism dimensions must be positive millimetres');
 if(Math.hypot(n.nx,n.ny,n.nz)<=1e-12)
  throw new RangeError('nondegenerate plane normal required');
 return {
  box:{min:{x:0,y:0,z:0},max:{x:n.sizeX,y:n.sizeY,z:n.sizeZ}},
  plane:{point:{x:n.px,y:n.py,z:n.pz},
   normal:{x:n.nx,y:n.ny,z:n.nz}}
 };
}
module.exports={fields,checkedPrismFields};
