'use strict';
/**
 * M0-only bounded RECESSION CONE certificate for a finite 3D intersection
 * of outward-facing halfspaces. This is independent of vertices, edges,
 * faces, object kind, and the current V/H/W view.
 *
 * Let C={d | n_i·d <= 0 for every i}. If the normals span R^3, C is a
 * pointed polyhedral cone. Any nonzero pointed C has an extreme ray on
 * the intersection of two linearly independent face-normal boundaries.
 * Thus C={0} if BOTH +/- (n_i cross n_j) are strictly excluded by at
 * least one face for every independent (i,j). Here each exclusion is
 * certified by a conservative Float64 determinant sign filter; uncertain
 * signs fail CLOSED. Parallelism reuses the existing exact-for-binary64
 * adaptive 2D orientation predicate, not a guessed angular epsilon.
 *
 * This is NOT a proof that the input halfspaces are nonempty, derived from
 * source Geometry, or have a complete vertex/face representation. Without
 * a separate existence and source/topology proof, no solid, visibility,
 * whole-scene, official line style or V5 result is certified.
 */
const {orientation2DAdaptive}=require('./orientation2d-adaptive.cjs');
const finite=Number.isFinite;
const MIN_NORMAL=2**-1022;
const U=Number.EPSILON;
const axes=Object.freeze(['x','y','z']);
const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const normalOrZero=x=>x===0||Math.abs(x)>=MIN_NORMAL;
function parse({halfspaces}={}){
 if(!Array.isArray(halfspaces)||halfspaces.length<4||halfspaces.length>64)
  throw new TypeError('four to 64 explicit finite outward halfspaces required');
 return Array.from({length:halfspaces.length},(_,i)=>{
  if(!Object.hasOwn(halfspaces,i)||!isRecord(halfspaces[i]))
   throw new TypeError('missing halfspace '+i);
  const face=halfspaces[i],normal=face.normal,offset=face.offsetMm;
  if(!isRecord(normal)||!axes.every(k=>Object.hasOwn(normal,k)))
   throw new TypeError('explicit finite normal required at '+i);
  const n={x:normal.x,y:normal.y,z:normal.z};
  if(!axes.every(k=>typeof n[k]==='number'&&finite(n[k])&&
      Math.abs(n[k])<=1e8)||typeof offset!=='number'||!finite(offset)||
      Math.abs(offset)>1e12||Math.hypot(n.x,n.y,n.z)<1e-12)
   throw new TypeError('bounded normal and offset required at '+i);
  return n;
 });
}
function parallel(a,b){
 const o=(i,j)=>orientation2DAdaptive([0,0],[a[i],a[j]],
   [b[i],b[j]]).sign;
 return o('x','y')===0&&o('x','z')===0&&o('y','z')===0;
}
/** Sufficient, conservative sign certificate of exact det(a,b,c) for
 * already-represented finite binary64 normals. Uncertain => 0, not a
 * claim of exact equality. Six triple products, >=64 eps magnitude guard.
 */
function strictDetSign(a,b,c){
 const values=[
  [a.x,b.y,c.z,1],[a.y,b.z,c.x,1],[a.z,b.x,c.y,1],
  [a.x,b.z,c.y,-1],[a.y,b.x,c.z,-1],[a.z,b.y,c.x,-1]
 ];
 let sum=0,absolute=0;
 for(const [x,y,z,sign] of values){
  const intermediate=x*y,product=intermediate*z;
  if(!finite(intermediate)||!finite(product)||
     !normalOrZero(intermediate)||!normalOrZero(product)||
     (x!==0&&y!==0&&intermediate===0)||
     (intermediate!==0&&z!==0&&product===0))
   return 0;
  sum+=sign*product;
  absolute+=Math.abs(product);
 }
 const error=64*U*absolute;
 if(!finite(sum)||!finite(absolute)||!finite(error)||
    !normalOrZero(sum)||error<MIN_NORMAL||Math.abs(sum)<=error)
  return 0;
 return sum>0?1:-1;
}
function certifyTrivialRecessionCone({halfspaces}={}){
 const normals=parse({halfspaces});
 const result=(status,reason,witnesses,unknownPairs,nonparallelPairs)=>Object.freeze({
  schema:'draftai-m0-trivial-recession-cone/1',status,reason,
  halfspaceCount:normals.length,nonparallelPairsChecked:nonparallelPairs,
  uncertainPairCount:unknownPairs,
  pairExclusionWitnesses:Object.freeze(witnesses.map(w=>Object.freeze(w))),
  recessionConeTrivialVerified:status==='certified-trivial-recession',
  // Boundedness of a NONEMPTY polyhedron follows only after existence.
  nonemptyFeasibleSetVerified:false,sourceGeometryVerified:false,
  sourceVertexCompletenessVerified:false,
  completeSceneVerified:false,officialLineStyleVerified:false,
  v5VerifiedExportReady:false
 });
 const witnesses=[];let unknown=0,pairs=0;
 for(let i=0;i<normals.length;i++)for(let j=i+1;j<normals.length;j++){
  const a=normals[i],b=normals[j];
  if(parallel(a,b))continue;
  pairs++;
  let positive=null,negative=null;
  for(let k=0;k<normals.length;k++){
   if(k===i||k===j)continue;
   const sign=strictDetSign(a,b,normals[k]);
   if(sign>0&&positive===null)positive=k;
   if(sign<0&&negative===null)negative=k;
   if(positive!==null&&negative!==null)break;
  }
  if(positive===null||negative===null)unknown++;
  else witnesses.push({firstFaceIndex:i,secondFaceIndex:j,
   excludesPositiveRayFaceIndex:positive,
   excludesNegativeRayFaceIndex:negative});
 }
 if(pairs===0||witnesses.length===0)
  return result('undetermined','normals-do-not-prove-three-dimensional-span',witnesses,unknown,pairs);
 if(unknown>0)
  return result('undetermined','one-or-more-recession-directions-not-strictly-excluded',
   witnesses,unknown,pairs);
 return result('certified-trivial-recession',
  'every-independent-normal-pair-has-two-strictly-certified-exclusion-witnesses',
  witnesses,0,pairs);
}
module.exports={certifyTrivialRecessionCone};
