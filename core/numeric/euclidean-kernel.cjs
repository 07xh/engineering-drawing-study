'use strict';
/**
 * V3.8 M0: small, dependency-free Euclidean kernel in model millimetres.
 * Inputs are finite and calculations fail closed on overflow/underflow.
 * No claims about exact arithmetic, global uniqueness or geometric topology.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function vector(value,dimension){
 if(!Array.isArray(value)||value.length!==dimension||!value.every(finite))
  throw new TypeError('expected finite '+dimension+'D vector');
 return [...value];
}
function checked(value){
 if(!finite(value))throw new RangeError('nonfinite geometric calculation');
 return value;
}
function subtract(a,b){
 const dimension=a?.length;
 if(dimension!==2&&dimension!==3)throw new TypeError('only 2D/3D vectors supported');
 const x=vector(a,dimension),y=vector(b,dimension);
 return x.map((v,i)=>checked(v-y[i]));
}
function dot(a,b){
 const dimension=a?.length;
 if(dimension!==2&&dimension!==3)throw new TypeError('only 2D/3D vectors supported');
 const x=vector(a,dimension),y=vector(b,dimension);
 return checked(x.reduce((sum,v,i)=>checked(sum+checked(v*y[i])),0));
}
function cross3(a,b){
 const x=vector(a,3),y=vector(b,3);
 return [
  checked(checked(x[1]*y[2])-checked(x[2]*y[1])),
  checked(checked(x[2]*y[0])-checked(x[0]*y[2])),
  checked(checked(x[0]*y[1])-checked(x[1]*y[0]))
 ];
}
function norm(a){
 const x=vector(a,a?.length);
 if(x.length!==2&&x.length!==3)throw new TypeError('only 2D/3D vectors supported');
 return checked(Math.hypot(...x));
}
function normalize(a){
 const x=vector(a,a?.length),m=norm(x);
 if(m===0||!finite(1/m))throw new RangeError('zero or unrepresentable vector magnitude');
 const out=x.map(v=>checked(v/m));
 if(out.every(v=>v===0))throw new RangeError('vector normalization underflow');
 return out;
}
function pointPlaneSignedDistance(point,planePoint,normal){
 const p=vector(point,3),origin=vector(planePoint,3),n=normalize(normal);
 return dot(subtract(p,origin),n);
}
module.exports={vector,subtract,dot,cross3,norm,normalize,pointPlaneSignedDistance};
