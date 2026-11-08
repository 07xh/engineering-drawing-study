'use strict';
/**
 * Number of DISTINCT finite IEEE-754 binary64 numerical values between two
 * received numbers. +0/-0 have different bit patterns but one numerical
 * value, so the signed-zero boundary is counted once, never as a fake ULP.
 * No tolerance/geometry equivalence or source-parameter certification.
 */
const scratch=new DataView(new ArrayBuffer(8));
const SIGN=1n<<63n,FULL=(1n<<64n)-1n;
const orderedRank=x=>{
 scratch.setFloat64(0,x,false);
 const bits=scratch.getBigUint64(0,false);
 return (bits&SIGN)!==0n?(~bits)&FULL:bits|SIGN;
};
function binary64OrderedStepDistance(a,b){
 if(!Number.isFinite(a)||!Number.isFinite(b))
  throw new TypeError('two finite original binary64 numbers required');
 const x=orderedRank(a),y=orderedRank(b),
  lo=x<y?x:y,hi=x>y?x:y;
 let steps=hi-lo;
 if(lo<=orderedRank(-0)&&hi>=orderedRank(0))steps--;
 return steps;
}
module.exports={binary64OrderedStepDistance};
