'use strict';
/**
 * M5 finite CONVEX projected geometric outline. Reuses the existing closed
 * convex mesh topology proof and authoritative first-angle V/H/W projector.
 *
 * The convex hull of the orthographic vertex projection equals the projection
 * of the entire closed convex solid. This proves ONLY its local 2D boundary
 * SET (not which source edge is frontmost, multiple-solid silhouette union,
 * perspective, endpoint joins, line thickness, hidden line or V5).
 */
const {verifiedConvexMeshHalfspaces}=
 require('../geometry/verified-convex-mesh-halfspaces.cjs');
const {project,VIEWS}=require('../projection/conventions.js');
const finite=Number.isFinite;
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const cr=(a,b,c)=>(b.u-a.u)*(c.v-a.v)-(b.v-a.v)*(c.u-a.u);
const dist=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
function fail(s){throw new TypeError('convex first-angle outline: '+s);}
function verifyConvexProjectedOutline({mesh,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)fail('current revision required');
 // Throws for open, inconsistent, invalid or nonconvex imported mesh.
 const validated=verifiedConvexMeshHalfspaces(mesh);
 const byView={};
 for(const view of VIEWS){
  const source=Object.entries(mesh.data.points).map(([id,p])=>
   ({sourcePointId:id,...project(p)[view]}));
  if(source.some(x=>!finite(x.u)||!finite(x.v)))fail('nonfinite projected vertex');
  const xs=source.map(x=>x.u),ys=source.map(x=>x.v);
  const extent=Math.max(Math.max(...xs)-Math.min(...xs),
   Math.max(...ys)-Math.min(...ys));
  if(!finite(extent)||extent<1e-8)fail('projection degenerates to line or point');
  const tol=Math.max(1e-9,extent*1e-10),crossTol=tol*extent;
  const unique=[];
  for(const p of source){
   const duplicate=unique.find(q=>dist(p,q)<=tol);
   if(duplicate){
    // Exact equal projected vertices are normal for first-angle box
    // projection. Almost-equal points can change hull topology: refuse.
    if(p.u!==duplicate.u||p.v!==duplicate.v)
     fail('nearly coincident projection topology needs further proof');
    duplicate.sourcePointIds.push(p.sourcePointId);
   }else unique.push({u:p.u,v:p.v,sourcePointIds:[p.sourcePointId]});
  }
  if(unique.length<3)fail('fewer than three independent projected vertices');
  unique.sort((a,b)=>a.u-b.u||a.v-b.v);
  const partial=(points)=>{
   const out=[];
   for(const p of points){
    while(out.length>=2){
     const turn=cr(out[out.length-2],out[out.length-1],p);
     if(Math.abs(turn)<=crossTol&&turn!==0)
      fail('near-collinear hull edges are numerically uncertain');
     if(turn>0)break;
     out.pop();
    }
    out.push(p);
   }
   return out;
  };
  const lo=partial(unique),hi=partial([...unique].reverse());
  const hull=lo.slice(0,-1).concat(hi.slice(0,-1));
  if(hull.length<3)fail('projected hull has zero area');
  const signed2=hull.reduce((s,p,i)=>
   s+p.u*hull[(i+1)%hull.length].v-
    p.v*hull[(i+1)%hull.length].u,0);
  if(!finite(signed2)||signed2<=crossTol)
   fail('hull orientation/area is not independently stable');
  const sides=[];
  for(let i=0;i<hull.length;i++){
   const from=hull[i],to=hull[(i+1)%hull.length];
   const length=dist(from,to),lengthTol=tol/length;
   if(length<=tol)fail('projected contour edge collapsed');
   // Independently check every projected point is on or inside this
   // counter-clockwise support half-plane (convex projection proof).
   for(const p of unique){
    const side=cr(from,to,p);
    if(!finite(side)||side< -crossTol)fail('hull fails independent support test');
    if(side<0&&side!==0)fail('uncertain support plane at projection tolerance');
   }
   const spans=[];
   for(const [a,b]of mesh.data.edges){
    const p=project(mesh.data.points[a])[view],
      q=project(mesh.data.points[b])[view];
    if(dist(p,q)<=tol)continue;
    const signedA=cr(from,to,p),signedB=cr(from,to,q);
    if(Math.abs(signedA)>crossTol||Math.abs(signedB)>crossTol)continue;
    if((signedA!==0&&Math.abs(signedA)<crossTol)||
       (signedB!==0&&Math.abs(signedB)<crossTol))
      fail('uncertain source-edge alignment to projected contour');
    const t=u=>((u.u-from.u)*(to.u-from.u)+
      (u.v-from.v)*(to.v-from.v))/(length*length);
    const first=Math.max(0,Math.min(t(p),t(q))),
      last=Math.min(1,Math.max(t(p),t(q)));
    if(last-first>lengthTol)
     spans.push({sourceEdgeId:[a,b].sort().join('|'),
      projectedFractionRange:[first,last]});
   }
   spans.sort((a,b)=>a.projectedFractionRange[0]-b.projectedFractionRange[0]);
   let covered=0;
   for(const s of spans){
    if(s.projectedFractionRange[0]>covered+lengthTol)
     fail('declared mesh edges do not cover the projected hull boundary');
    covered=Math.max(covered,s.projectedFractionRange[1]);
   }
   if(covered<1-lengthTol)
    fail('projected contour side lacks complete original-edge coverage');
   sides.push({from:{u:from.u,v:from.v},to:{u:to.u,v:to.v},
    projectedLengthMm:length,sourceEdgeCandidates:spans,
    projectedBoundaryVerified:true,frontmostSourceEdgeVerified:false,
    endpointsVisibleVerified:false,officialLineStyleVerified:false});
  }
  byView[view]={
   view,vertexCount:hull.length,vertices:hull.map(p=>({
    u:p.u,v:p.v,sourcePointIds:[...p.sourcePointIds]})),
   boundarySides:sides,convexProjectedBoundaryVerified:true,
   sourceEdgeDepthOrderVerified:false,
   completeMultiBodyContourVerified:false,
   sourceEndpointVisibilityVerified:false,officialLineStylesVerified:false
  };
 }
 return freeze({
  schema:'draftai-m5-convex-projected-outline/1',
  revision,sourceGeometryId:mesh.id,unit:'mm',
  sourceClosedConvexTopologyVerified:validated.status==='validated-closed-convex-mesh',
  method:'independently-checked-first-angle-convex-hull',
  V:byView.V,H:byView.H,W:byView.W,
  multiBodySilhouetteVerified:false,completeDrawingVerified:false,
  constructionIntentReady:false,v5Ready:false
 });
}
module.exports={verifyConvexProjectedOutline};
