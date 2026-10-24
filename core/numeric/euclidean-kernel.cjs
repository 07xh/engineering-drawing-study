'use strict';
/**
 * V3.8 M0: small, dependency-free Euclidean kernel in model millimetres.
 * Inputs are finite and calculations fail closed on overflow/underflow.
 * No claims about exact arithmetic, global uniqueness or geometric topology.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const {dyadic,product:exactProduct,sum:exactSum,sign:exactSign}=
 require('./binary64-dyadic.cjs');
function vector(value,dimension){
 if(dimension!==2&&dimension!==3)throw new TypeError('vector dimension must be 2 or 3');
 if(!Array.isArray(value)||value.length!==dimension)
  throw new TypeError('expected finite '+dimension+'D vector');
 // Numerical input is a single immutable-by-copy snapshot, not a
 // validate-then-second-read TOCTOU accessor.
 return Array.from({length:dimension},(_,i)=>{
  if(!Object.hasOwn(value,i))
   throw new TypeError('expected finite '+dimension+'D vector');
  const item=value[i];
  if(!finite(item))
   throw new TypeError('expected finite '+dimension+'D vector');
  return item;
 });
}
function checked(value){
 if(!finite(value))throw new RangeError('nonfinite geometric calculation');
 return value;
}
function multiplyFinite(a,b){
 const x=checked(a),y=checked(b),product=checked(x*y);
 // A nonzero exact product becoming zero is not usable geometric evidence.
 if(x!==0&&y!==0&&product===0)
  throw new RangeError('geometric multiplication underflowed to zero');
 return product;
}
function add(a,b){
 const dimension=a?.length;
 if(dimension!==2&&dimension!==3)throw new TypeError('only 2D/3D vectors supported');
 const x=vector(a,dimension),y=vector(b,dimension);
 return x.map((v,i)=>checked(v+y[i]));
}
function scale(a,factor){
 const dimension=a?.length;
 if(dimension!==2&&dimension!==3)throw new TypeError('only 2D/3D vectors supported');
 const x=vector(a,dimension),s=checked(factor);
 return x.map(v=>multiplyFinite(v,s));
}
function subtract(a,b){
 const dimension=a?.length;
 if(dimension!==2&&dimension!==3)throw new TypeError('only 2D/3D vectors supported');
 const x=vector(a,dimension),y=vector(b,dimension);
 return x.map((v,i)=>checked(v-y[i]));
}

/**
 * M0 filtered product-sum: preserve fast binary64 results except if their
 * SIGN (especially zero) cannot be trusted after cancellation. Uncertain
 * signs use the existing shared exact binary64 dyadic arithmetic only for
 * the uncommon cancellation path. Reject a rounded-zero nonzero result or
 * a reversed sign; an exact zero is returned as zero.
 *
 * This does not certify all low-order result digits or representable real
 * input coordinates prior to their binary64 rounding.
 */
function productSum(pairs){
 const terms=pairs.map(({a,b,coefficient})=>
  checked(multiplyFinite(a,b)*coefficient));
 let total=0,magnitude=0;
 for(const term of terms){
  total=checked(total+term);
  magnitude=checked(magnitude+Math.abs(term));
 }
 const bound=(8*pairs.length+4)*Number.EPSILON*magnitude;
 // Bound also relies on normal-range intermediate arithmetic; otherwise
 // always consult exact dyadic product-sum instead of treating 0 as proof.
 const normal=x=>x===0||Math.abs(x)>=2**-1022;
 if(Number.isFinite(bound)&&bound>=2**-1022&&
    normal(total)&&Math.abs(total)>bound)
  return total;
 let exact={n:0n,e:0};
 for(const {a,b,coefficient} of pairs){
  const e=exactProduct(dyadic(a),dyadic(b));
  exact=exactSum(exact,coefficient===1?e:{n:-e.n,e:e.e});
 }
 const s=exactSign(exact);
 if(s===0)return 0;
 if(!total||Math.sign(total)!==s)
  throw new RangeError('geometric product-sum cancellation lost a nonzero sign');
 return total;
}
function dot(a,b){
 const dimension=a?.length;
 if(dimension!==2&&dimension!==3)throw new TypeError('only 2D/3D vectors supported');
 const x=vector(a,dimension),y=vector(b,dimension);
 return productSum(x.map((v,i)=>({a:v,b:y[i],coefficient:1})));
}
function cross3(a,b){
 const x=vector(a,3),y=vector(b,3);
 return [
  productSum([{a:x[1],b:y[2],coefficient:1},
   {a:x[2],b:y[1],coefficient:-1}]),
  productSum([{a:x[2],b:y[0],coefficient:1},
   {a:x[0],b:y[2],coefficient:-1}]),
  productSum([{a:x[0],b:y[1],coefficient:1},
   {a:x[1],b:y[0],coefficient:-1}])
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
module.exports={vector,multiplyFinite,add,scale,subtract,dot,cross3,norm,normalize,pointPlaneSignedDistance};
