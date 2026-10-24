'use strict';
/**
 * M0: independently prove that EVERY positive observer ray from an OPEN
 * source-segment subinterval is CLEAR of ONE trusted closed convex solid.
 *
 * Unlike a midpoint-only ray sample, this is a continuous certificate:
 * (1) a common support plane with rigorously OUTWARD ray direction; OR
 * (2) Fourier-Motzkin elimination of depth t>=0 from all conservative
 *    (expanded) convex halfspaces in (source parameter u, forward depth t).
 *
 * Only infeasibility of even the EXPANDED solid is a clearance proof.
 * Any feasible ray, tangency, near-parallel instability or unsupported
 * configuration stays undetermined. The caller must independently verify
 * closed convex source topology, scene completeness, view convention,
 * projected intersections, endpoints and drawing standards.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const xyz=p=>p&&typeof p==='object'&&!Array.isArray(p)&&
 Object.keys(p).sort().join(',')==='x,y,z'&&
 ['x','y','z'].every(k=>finite(p[k])&&Math.abs(p[k])<=1e8);
const id=s=>typeof s==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(s);
const {dotObject3:dot}=
 require('./object-vector3.cjs');
const at=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const result=(sourceId,solidId,status,reason)=>Object.freeze({
 schema:'draftai-convex-continuous-clearance/1',
 sourceId,solidId,status,reason,
 sourceOpenIntervalVerified:status==='certified-clear',
 sceneCompleteVerified:false,
 endpointJoinVerified:false,officialLineStyleVerified:false,v5Ready:false
});
function certifyConvexSegmentClearance({
 source,solid,observerDirection,sourceParameterRange=[0,1],
 clearanceMarginMm=1e-7,angularTolerance=1e-12
}={}){
 if(!source||typeof source!=='object'||Array.isArray(source)||
    Object.keys(source).sort().join(',')!=='from,id,to'||
    !id(source.id)||!xyz(source.from)||!xyz(source.to)||
    !solid||typeof solid!=='object'||Array.isArray(solid)||
    Object.keys(solid).sort().join(',')!=='halfspaces,id'||
    !id(solid.id)||!Array.isArray(solid.halfspaces)||
    solid.halfspaces.length<4||solid.halfspaces.length>64||
    !xyz(observerDirection)||!Array.isArray(sourceParameterRange)||
    sourceParameterRange.length!==2||
    sourceParameterRange.some(t=>!finite(t)||t<0||t>1)||
    sourceParameterRange[0]>=sourceParameterRange[1])
  throw new TypeError('finite 3D segment, bounded parameter interval, solid and observer required');
 if(!finite(clearanceMarginMm)||clearanceMarginMm<=0||
    clearanceMarginMm>1e-2||!finite(angularTolerance)||
    angularTolerance<=0||angularTolerance>1e-6)
  throw new RangeError('strictly positive, bounded numerical margins required');
 const span=Math.hypot(source.from.x-source.to.x,
  source.from.y-source.to.y,source.from.z-source.to.z);
 const dn=Math.hypot(observerDirection.x,observerDirection.y,observerDirection.z);
 if(!finite(span)||span<=clearanceMarginMm||!finite(dn)||dn<=1e-12)
  throw new RangeError('nondegenerate source and observer required');
 const d={x:observerDirection.x/dn,y:observerDirection.y/dn,
  z:observerDirection.z/dn};
 const [start,end]=sourceParameterRange;
 const p=at(source.from,source.to,start),q=at(source.from,source.to,end);
 const v={x:q.x-p.x,y:q.y-p.y,z:q.z-p.z};
 const faces=[],ids=new Set();
 for(const f of solid.halfspaces){
  if(!f||typeof f!=='object'||Array.isArray(f)||
     Object.keys(f).sort().join(',')!=='id,normal,offsetMm'||
     !id(f.id)||ids.has(f.id)||!xyz(f.normal)||
     !finite(f.offsetMm)||Math.abs(f.offsetMm)>1e9)
   throw new TypeError('finite distinct support planes required');
  ids.add(f.id);
  const norm=Math.hypot(f.normal.x,f.normal.y,f.normal.z);
  if(!finite(norm)||norm<=1e-12)
   throw new RangeError('nonzero convex support normal required');
  const n={x:f.normal.x/norm,y:f.normal.y/norm,z:f.normal.z/norm};
  const offset=f.offsetMm/norm;
  if(!finite(offset))throw new RangeError('face normalization overflow');
  faces.push({n,offset,id:f.id});
 }
 // Common separating support for all s in [a,b], t>0: even a ray
 // beginning ON the face is clear if it points strictly OUTWARD.
 for(const f of faces){
  const slope=dot(f.n,d);
  const x0=dot(f.n,p)-f.offset,x1=dot(f.n,q)-f.offset;
  if(slope>angularTolerance&&x0>=0&&x1>=0)
   return result(source.id,solid.id,'certified-clear','full-interval-outward-support');
  if(slope>=0&&x0>=clearanceMarginMm&&x1>=clearanceMarginMm)
   return result(source.id,solid.id,'certified-clear','full-interval-exterior-support');
 }
 const lower=[{a:0,b:0}],upper=[],conditions=[];
 for(const f of faces){
  const alpha=dot(f.n,v),beta=dot(f.n,d);
  // EXPAND the solid; proving miss of the enlarged one proves miss of
  // the exact one, including grazing and near-touch cases.
  const gamma=f.offset+clearanceMarginMm-dot(f.n,p);
  if(![alpha,beta,gamma].every(finite))
   throw new RangeError('nonfinite clipping inequality');
  if(beta===0){
   conditions.push({a:alpha,b:-gamma});
  }else if(Math.abs(beta)<=angularTolerance){
   return result(source.id,solid.id,'undetermined','nearly-parallel-support');
  }else{
   const bound={a:-alpha/beta,b:gamma/beta};
   if(!finite(bound.a)||!finite(bound.b))
    throw new RangeError('nonfinite ray-depth bound');
   (beta>0?upper:lower).push(bound);
  }
 }
 if(!upper.length)
  return result(source.id,solid.id,'undetermined','unbounded-forward-feasibility');
 for(const lo of lower)for(const hi of upper)
  conditions.push({a:lo.a-hi.a,b:lo.b-hi.b});
 let l=0,r=1;
 const slack=Math.min(1e-8,clearanceMarginMm/Math.max(span,1));
 for(const {a,b} of conditions){
  if(!finite(a)||!finite(b))
   throw new RangeError('nonfinite eliminated depth inequality');
  if(a===0){
   if(b>clearanceMarginMm)
    return result(source.id,solid.id,'certified-clear','inflated-forward-rays-infeasible');
   continue;
  }
  const root=-b/a;
  if(!finite(root))throw new RangeError('nonfinite projected depth boundary');
  // Relax the feasible source interval rather than discard any
  // sub-mm near-tangent/roundoff intersection.
  if(a>0)r=Math.min(r,root+slack);
  else l=Math.max(l,root-slack);
  if(l>r+slack)
   return result(source.id,solid.id,'certified-clear','inflated-forward-rays-infeasible');
 }
 return result(source.id,solid.id,'undetermined','some-forward-ray-may-hit-convex-solid');
}
module.exports={certifyConvexSegmentClearance};
