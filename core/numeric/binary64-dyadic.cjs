'use strict';
/** Shared EXACT binary64 dyadic arithmetic for robust sign predicates.
 * A finite JS Number is precisely n * 2^e. This module has NO
 * geometry units, tolerance policies, model-space semantics or V5 roles.
 * Only filtered-predicate fallbacks should generally allocate BigInts.
 */
const words=new DataView(new ArrayBuffer(8));
function dyadic(value){
 if(typeof value!=='number'||!Number.isFinite(value))
  throw new TypeError('finite binary64 number required');
 words.setFloat64(0,value,false);
 const high=words.getUint32(0,false),low=words.getUint32(4,false);
 const exp=(high>>>20)&0x7ff;
 const fraction=(BigInt(high&0xfffff)<<32n)|BigInt(low);
 if(exp===0&&fraction===0n)return {n:0n,e:0};
 const mantissa=exp===0?fraction:((1n<<52n)|fraction);
 return {n:(high>>>31)?-mantissa:mantissa,
  e:exp===0?-1074:exp-1075};
}
function difference(a,b){
 if(b.n===0n)return a;
 if(a.n===0n)return {n:-b.n,e:b.e};
 const e=Math.min(a.e,b.e);
 return {n:(a.n<<BigInt(a.e-e))-(b.n<<BigInt(b.e-e)),e};
}
function product(a,b){return {n:a.n*b.n,e:a.e+b.e};}
function sum(a,b){return difference(a,{n:-b.n,e:b.e});}
function sign(a){return a.n>0n?1:a.n<0n?-1:0;}
module.exports={dyadic,difference,product,sum,sign};
