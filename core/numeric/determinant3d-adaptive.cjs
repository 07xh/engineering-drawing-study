'use strict';
/**
 * Fast-or-exact determinant of three independent 3D direction vectors
 * for their represented IEEE-754 binary64 components.
 *
 * In normal finite range, accept a sign only when it strictly exceeds a
 * conservative 64*EPS upper bound for six triple products and addition.
 * Underflow, overflow or near cancellation falls back to ONE shared exact
 * dyadic arithmetic kernel (also used by the existing M0 2D orientation).
 *
 * This is a sign predicate, NOT a 3D intersection, length, tolerance,
 * line style, global uniqueness or source provenance proof.
 */
const {dyadic,product,sum,sign}=require('./binary64-dyadic.cjs');
const MIN_NORMAL=2**-1022;
const normalOrZero=x=>x===0||Math.abs(x)>=MIN_NORMAL;
function point3(v,name){
 if(!Array.isArray(v)||v.length!==3||
  ![0,1,2].every(i=>Object.hasOwn(v,i)))
  throw new TypeError(name+' requires a dense finite 3D coordinate array');
 const out=[v[0],v[1],v[2]];
 if(!out.every(x=>typeof x==='number'&&Number.isFinite(x)))
  throw new TypeError(name+' requires a dense finite 3D coordinate array');
 return out;
}
const FAST_NEGATIVE=Object.freeze({sign:-1,method:'float64-filtered',
 exactForBinary64Inputs:true});
const FAST_POSITIVE=Object.freeze({sign:1,method:'float64-filtered',
 exactForBinary64Inputs:true});
const EXACT=Object.freeze([-1,0,1].map(v=>Object.freeze({
 sign:v,method:'exact-dyadic-fallback',exactForBinary64Inputs:true
})));
function exactTriples(triples){
 let exact={n:0n,e:0};
 for(const [x,y,z,coefficient] of triples){
  const v=product(product(dyadic(x),dyadic(y)),dyadic(z));
  exact=coefficient>0?sum(exact,v):
   sum(exact,{n:-v.n,e:v.e});
 }
 return exact;
}
/** Opt-in offline exact dyadic 3x3 determinant, no binary64 rounding of
 * intersection coordinates; returned (n,e) means n*2^e.
 * Not for animation frames or implicit live drag computations.
 */
function determinant3DExactDyadic(first,second,third){
 const a=point3(first,'first'),b=point3(second,'second'),
  c=point3(third,'third');
 return exactTriples([
  [a[0],b[1],c[2],1],[a[1],b[2],c[0],1],
  [a[2],b[0],c[1],1],[a[0],b[2],c[1],-1],
  [a[1],b[0],c[2],-1],[a[2],b[1],c[0],-1]
 ]);
}
function determinant3DAdaptive(first,second,third){
 const a=point3(first,'first'),b=point3(second,'second'),
  c=point3(third,'third');
 const triples=[
  [a[0],b[1],c[2],1],[a[1],b[2],c[0],1],
  [a[2],b[0],c[1],1],[a[0],b[2],c[1],-1],
  [a[1],b[0],c[2],-1],[a[2],b[1],c[0],-1]
 ];
 let total=0,magnitude=0,safe=true;
 for(const [x,y,z,coefficient] of triples){
  const m=x*y,v=m*z;
  if(!Number.isFinite(m)||!Number.isFinite(v)||
     !normalOrZero(m)||!normalOrZero(v)||
     (x!==0&&y!==0&&m===0)||
     (m!==0&&z!==0&&v===0)){safe=false;break;}
  total+=coefficient*v;
  magnitude+=Math.abs(v);
 }
 const err=64*Number.EPSILON*magnitude;
 if(safe&&Number.isFinite(total)&&Number.isFinite(magnitude)&&
   Number.isFinite(err)&&normalOrZero(total)&&
   err>=MIN_NORMAL&&Math.abs(total)>err){
  return total<0?FAST_NEGATIVE:FAST_POSITIVE;
 }
 return EXACT[sign(exactTriples(triples))+1];
}
module.exports={determinant3DAdaptive,determinant3DExactDyadic};
