'use strict';
/**
 * M5 multi-body PROJECTED CONVEX UNION boundary, not a 3D hidden-line result.
 * Each first-angle projection of a validated closed convex solid is a closed
 * convex polygon. Split its boundary at every other polygon edge crossing;
 * classify the OPEN intervals as outside the other polygons, strictly
 * covered by their interiors, or indeterminate on shared/tangent boundaries.
 *
 * Provenance is recomputed from CURRENT source Geometry, never client
 * supplied contour flags. Endpoints, 3D depth and V5 remain unapproved.
 */
const {verifyConvexProjectedOutline}=
 require('./convex-projected-outline.cjs');
const {VIEWS}=require('../projection/conventions.js');
const finite=Number.isFinite;
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);
 Object.freeze(x);
}return x;};
const sub=(a,b)=>({u:a.u-b.u,v:a.v-b.v});
const cross=(a,b)=>a.u*b.v-a.v*b.u;
const dot=(a,b)=>a.u*b.u+a.v*b.v;
const interpolate=(a,b,t)=>({u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t});
const fail=s=>{throw new TypeError('M5 multi-body projected union: '+s);};
function classifyMultiBodyProjectedUnion({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)fail('current source revision required');
 if(!Array.isArray(geometry)||!geometry.length||geometry.length>8)
  fail('one to eight reviewed convex 3D meshes required');
 const ids=new Set(),polygons=[];
 for(const mesh of geometry){
  if(!mesh||typeof mesh.id!=='string'||ids.has(mesh.id))
   fail('duplicate or missing source Geometry identity');
  ids.add(mesh.id);
  // Independently recomputes topology and V/H/W projected convex hulls.
  const proof=verifyConvexProjectedOutline({mesh,revision});
  polygons.push({id:mesh.id,proof});
 }
 const segments=[],events=[];
 for(const view of VIEWS){
  const shapes=polygons.map(({id,proof})=>({
   id,vertices:proof[view].vertices,
   sides:proof[view].boundarySides
  }));
  const coords=shapes.flatMap(s=>s.vertices);
  const ext=Math.max(1,...coords.map(p=>Math.abs(p.u)),...coords.map(p=>Math.abs(p.v)));
  const tol=Math.max(1e-9,ext*2e-10);
  function againstPoly(p,poly){
   let boundary=false;
   const v=poly.vertices;
   for(let i=0;i<v.length;i++){
    const a=v[i],b=v[(i+1)%v.length],delta=sub(b,a);
    const len=Math.hypot(delta.u,delta.v),side=cross(delta,sub(p,a));
    if(!finite(side))return 'undetermined';
    if(side< -tol*len)return 'outside';
    if(side<=tol*len)boundary=true;
   }
   return boundary?'boundary':'inside';
  }
  for(const shape of shapes)for(let sideIndex=0;sideIndex<shape.sides.length;sideIndex++){
   const boundary=shape.sides[sideIndex];
   const a=boundary.from,b=boundary.to,r=sub(b,a),length=Math.hypot(r.u,r.v);
   if(!finite(length)||length<=tol)fail('invalid source projected hull side');
   const cuts=[0,1],paramTol=tol/length;
   let unstable=false;
   for(const other of shapes){
    if(other.id===shape.id)continue;
    for(const edge of other.sides){
     const c=edge.from,d=edge.to,s=sub(d,c),ls=Math.hypot(s.u,s.v);
     const qp=sub(c,a),denom=cross(r,s),
      crossTol=tol*Math.max(length,ls);
     if(Math.abs(denom)>crossTol){
      const t=cross(qp,s)/denom,u=cross(qp,r)/denom;
      if(t>= -paramTol&&t<=1+paramTol&&
         u>=-tol/ls&&u<=1+tol/ls){
       if(t<=paramTol||t>=1-paramTol||
          u<=tol/ls||u>=1-tol/ls)unstable=true;
       else cuts.push(t);
      }
     }else {
      const lineDistance=Math.abs(cross(qp,r))/length;
      if(lineDistance<=tol){
       // A shared projected line is not a genuine 3D edge join.
       // Split its exact projected overlap but NEVER claim true visibility.
       const p0=dot(sub(c,a),r)/(length*length),
         p1=dot(sub(d,a),r)/(length*length),
         left=Math.max(0,Math.min(p0,p1)),
         right=Math.min(1,Math.max(p0,p1));
       if(left<=right+paramTol){
        if(left>paramTol&&left<1-paramTol)cuts.push(left);
        if(right>paramTol&&right<1-paramTol)cuts.push(right);
       }
      }else if(lineDistance<=tol*4)unstable=true;
     }
    }
   }
   cuts.sort((x,y)=>x-y);
   const unique=[];
   for(const x of cuts)if(!unique.length||x-unique[unique.length-1]>paramTol)
    unique.push(x);
   for(let i=0;i<unique.length-1;i++){
    const x=unique[i],y=unique[i+1];
    if(y-x<=paramTol)continue;
    const midpoint=interpolate(a,b,(x+y)/2);
    let strictlyCovered=false,onOtherBoundary=false,ambiguous=false;
    for(const other of shapes){
     if(other.id===shape.id)continue;
     const status=againstPoly(midpoint,other);
     if(status==='inside')strictlyCovered=true;
     else if(status==='boundary')onOtherBoundary=true;
     else if(status==='undetermined')ambiguous=true;
    }
    const status=strictlyCovered?'strictly-inside-other-projection':
     onOtherBoundary||ambiguous||unstable?'undetermined':
     'open-projected-union-boundary';
    segments.push({
     view,sourceGeometryId:shape.id,sourceHullSideIndex:sideIndex,
     sourceParameterRange:[x,y],fromModelProjectionMm:interpolate(a,b,x),
     toModelProjectionMm:interpolate(a,b,y),
     status,projectedOpenInteriorBoundaryVerified:
      status==='open-projected-union-boundary',
     source3DEdgeFrontmostVerified:false,
     endpointJoinVisibilityVerified:false,
     multiBodyDepthVisibilityVerified:false,
     officialLineStyleVerified:false,constructionIntentReady:false,v5Ready:false
    });
   }
   if(unstable)events.push({
    view,sourceGeometryId:shape.id,sourceHullSideIndex:sideIndex,
    status:'endpoint-tangency-or-near-parallel-undetermined'});
  }
 }
 if(segments.length>3000)fail('projected union partition budget exceeded');
 return freeze({
  schema:'draftai-m5-multibody-projected-union/1',revision,
  sourceGeometryIds:[...ids],status:'open-boundary-geometry-only',
  segmentCount:segments.length,segments,uncertainEvents:events,
  openBoundaryCount:segments.filter(s=>
   s.status==='open-projected-union-boundary').length,
  coveredBoundaryCount:segments.filter(s=>
   s.status==='strictly-inside-other-projection').length,
  undeterminedCount:segments.filter(s=>s.status==='undetermined').length,
  sourceProjectionBoundaryInputVerified:true,
  allSplitEndpointsTopologyVerified:false,
  unionClosedContourVerified:false,
  frontmostSourceEdgesVerified:false,
  multiBody3DVisibilityVerified:false,
  officialLineStylesVerified:false,
  constructionIntentReady:false,v5Ready:false
 });
}
module.exports={classifyMultiBodyProjectedUnion};
