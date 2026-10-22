'use strict';
/**
 * M0 affine transforms: model-space coordinates only.
 * Row-major 3x3/4x4 matrices, column-vector convention.
 * Reject nonfinite entries, overflow, and projective transforms.
 */
const {vector,multiplyFinite}=require('./euclidean-kernel.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function affine(matrix,dimension){
 if(dimension!==2&&dimension!==3)throw new TypeError('affine dimension must be 2 or 3');
 const n=dimension+1;
 if(!Array.isArray(matrix)||matrix.length!==n||
   !Array.from({length:n},(_,i)=>Object.hasOwn(matrix,i)&&
   Array.isArray(matrix[i])&&matrix[i].length===n&&
   Array.from({length:n},(_,j)=>Object.hasOwn(matrix[i],j)&&finite(matrix[i][j])).every(Boolean)).every(Boolean))
  throw new TypeError('expected finite '+n+'x'+n+' affine matrix');
 const last=matrix[n-1];
 if(last.some((v,i)=>v!==(i===n-1?1:0)))
  throw new RangeError('projective matrices are not supported');
 return matrix.map(row=>[...row]);
}
function transformPoint(matrix,point){
 const dimension=point?.length;
 if(dimension!==2&&dimension!==3)throw new TypeError('expected 2D or 3D point');
 const p=vector(point,dimension),m=affine(matrix,dimension);
 return p.map((_,i)=>{
  const terms=m[i].slice(0,dimension).map((v,k)=>multiplyFinite(v,p[k]));
  if(!terms.every(finite))throw new RangeError('transform product overflow');
  const result=terms.reduce((a,b)=>a+b,m[i][dimension]);
  if(!finite(result))throw new RangeError('transform sum overflow');
  return result;
 });
}
function transformDirection(matrix,direction){
 const dimension=direction?.length;
 if(dimension!==2&&dimension!==3)throw new TypeError('expected 2D or 3D direction');
 const v=vector(direction,dimension),m=affine(matrix,dimension);
 return v.map((_,i)=>{
  const terms=m[i].slice(0,dimension).map((a,k)=>multiplyFinite(a,v[k]));
  if(!terms.every(finite))throw new RangeError('transform product overflow');
  const result=terms.reduce((a,b)=>a+b,0);
  if(!finite(result))throw new RangeError('transform sum overflow');
  return result;
 });
}
function composeAffine(left,right,dimension){
 if(dimension!==2&&dimension!==3)throw new TypeError('dimension must be 2 or 3');
 const a=affine(left,dimension),b=affine(right,dimension),n=dimension+1;
 const out=Array.from({length:n},()=>Array(n).fill(0));
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){
  const terms=a[i].map((v,k)=>multiplyFinite(v,b[k][j]));
  if(!terms.every(finite))throw new RangeError('matrix product overflow');
  out[i][j]=terms.reduce((s,v)=>s+v,0);
  if(!finite(out[i][j]))throw new RangeError('matrix sum overflow');
 }
 return affine(out,dimension);
}
module.exports={affine,transformPoint,transformDirection,composeAffine};
