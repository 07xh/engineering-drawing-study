'use strict';
/**
 * 04 V4.0: rigorously verified intersection of ONE axis-aligned finite
 * rectangular prism with a non-degenerate plane in model millimetres.
 * Intersect actual 12 finite edges, deduplicate real intersection vertices,
 * sort in the plane, certify polygon closure / residuals / convexity.
 *
 * Deliberately no hidden-line style, cap removal, 45° page layout, V5
 * animation, AI image interpretation, or arbitrary rotated solids.
 */
const {normalizePlane}=require('./axis-cylinder-plane.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>p&&['x','y','z'].every(k=>finite(p[k])&&Math.abs(p[k])<=1e8);
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const plus=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const times=(v,n)=>({x:v.x*n,y:v.y*n,z:v.z*n});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({
 x:a.y*b.z-a.z*b.y,
 y:a.z*b.x-a.x*b.z,
 z:a.x*b.y-a.y*b.x});
const length=v=>Math.hypot(v.x,v.y,v.z);
const distance=(a,b)=>length(sub(a,b));
const projection=p=>({V:{u:p.x,v:p.z},H:{u:p.x,v:p.y},W:{u:p.y,v:p.z}});
const fail=(status,reason)=>({status,reason,vertices:[],perimeter:[],
 modelUnit:'mm',verified:false,perimeterVerified:false,
 visibilityVerified:false,v5StepsReady:false,globallyUnique:null});
function checkBox(input){
 if(!input||!point(input.min)||!point(input.max)||
  ['x','y','z'].some(k=>input.max[k]-input.min[k]<=1e-7||
     input.max[k]-input.min[k]>1e7))
  throw new TypeError('finite axis-aligned box with positive mm extents required');
 return {min:{...input.min},max:{...input.max}};
}
function prismPlaneSection(box,plane){
 const b=checkBox(box),pl=normalizePlane(plane),n=pl.normal;
 const ranges=['x','y','z'].map(k=>b.max[k]-b.min[k]);
 const scale=Math.max(1,...ranges),eps=1e-8*scale;
 const corners=[];
 for(let z=0;z<=1;z++)for(let y=0;y<=1;y++)for(let x=0;x<=1;x++)
  corners.push({id:'vertex-'+x+y+z,point:{
   x:x?b.max.x:b.min.x,y:y?b.max.y:b.min.y,z:z?b.max.z:b.min.z
  },xyz:[x,y,z]});
 const edges=[];
 for(const c of corners){
  for(let axis=0;axis<3;axis++){
   if(c.xyz[axis]!==0)continue;
   const other=[...c.xyz];other[axis]=1;
   const d=corners.find(k=>k.xyz.every((v,i)=>v===other[i]));
   edges.push({id:'edge-'+c.id+'-axis-'+axis,a:c.point,b:d.point});
  }
 }
 if(edges.length!==12)throw new Error('invalid rectangular-prism edge topology');
 const planeDistance=p=>dot(n,sub(p,pl.point));
 const inside=p=>['x','y','z'].every(k=>p[k]>=b.min[k]-4*eps&&
   p[k]<=b.max[k]+4*eps);
 const measured=corners.map(c=>planeDistance(c.point));
 if(measured.every(x=>x>eps)||measured.every(x=>x< -eps))
  return fail('none','the entire prism lies to one side of plane');
 const candidates=[];
 for(const e of edges){
  const da=planeDistance(e.a),db=planeDistance(e.b);
  if(Math.abs(da)<=eps&&Math.abs(db)<=eps)
   return fail('boundary-degenerate','a full box edge lies in plane; needs separate face/edge topology');
  let q;
  if(Math.abs(da)<=eps)q=e.a;
  else if(Math.abs(db)<=eps)q=e.b;
  else if((da<0&&db>0)||(da>0&&db<0)){
   const t=da/(da-db);
   q=plus(e.a,times(sub(e.b,e.a),t));
  }else continue;
  if(!point(q)||!inside(q)||Math.abs(planeDistance(q))>4*eps)
   return fail('undetermined','finite prism edge intersection failed independent residual');
  const found=candidates.find(item=>distance(item.point,q)<=4*eps);
  if(found){
   if(!found.sourceEdgeIds.includes(e.id))found.sourceEdgeIds.push(e.id);
  }else candidates.push({point:{...q},sourceEdgeIds:[e.id]});
 }
 if(candidates.length<3)return fail('degenerate','fewer than three distinct intersections; no sectional polygon');
 if(candidates.length>6)
  return fail('undetermined','rectangular prism cannot have more than six section corners');
 let center={x:0,y:0,z:0};
 for(const q of candidates)center=plus(center,q.point);
 center=times(center,1/candidates.length);
 // Deterministic plane axes; choose least-aligned Cartesian reference.
 const basisReference=['x','y','z'].sort((a,b)=>Math.abs(n[a])-Math.abs(n[b]))[0];
 const axis={x:Number(basisReference==='x'),y:Number(basisReference==='y'),
  z:Number(basisReference==='z')};
 const rawU=cross(axis,n),norm=length(rawU);
 if(norm<=1e-12||!finite(norm))return fail('undetermined','degenerate section plane basis');
 const u=times(rawU,1/norm),v=cross(n,u);
 const ordered=candidates.map(q=>{
  const d=sub(q.point,center);
  return {...q,theta:Math.atan2(dot(v,d),dot(u,d))};
 }).sort((a,b)=>a.theta-b.theta);
 const vertices=ordered.map((q,i)=>({
  id:'section-'+(i+1),point:q.point,
  sourceEdgeIds:[...q.sourceEdgeIds].sort(),
  projection:projection(q.point),
  planeResidualMm:Math.abs(planeDistance(q.point)),
  boxOutsideMm:Math.max(0,...['x','y','z'].flatMap(k=>[
   b.min[k]-q.point[k],q.point[k]-b.max[k]
  ]))
 }));
 const links=[];
 let twiceArea=0,perimeterMm=0;
 for(let i=0;i<vertices.length;i++){
  const a=vertices[i],z=vertices[(i+1)%vertices.length];
  const aLocal={x:dot(u,sub(a.point,center)),y:dot(v,sub(a.point,center))};
  const zLocal={x:dot(u,sub(z.point,center)),y:dot(v,sub(z.point,center))};
  twiceArea+=aLocal.x*zLocal.y-zLocal.x*aLocal.y;
  const edgeLength=distance(a.point,z.point),mid=times(plus(a.point,z.point),.5);
  if(edgeLength<=eps*4||!inside(mid)||Math.abs(planeDistance(mid))>eps*4)
   return fail('undetermined','section polygon has invalid or unsupported edges');
  links.push({id:'section-edge-'+(i+1),fromId:a.id,toId:z.id,
   from:{...a.point},to:{...z.point},lengthMm:edgeLength,
   projectedEndpoints:{from:projection(a.point),to:projection(z.point)}});
  perimeterMm+=edgeLength;
 }
 if(!finite(twiceArea)||twiceArea<=eps*eps*8)
  return fail('degenerate','section polygon has zero or reversed signed area');
 // Verify strictly convex, non-self-intersecting polygon in plane coordinates.
 for(let i=0;i<vertices.length;i++){
  const a=vertices[i].point,b2=vertices[(i+1)%vertices.length].point,
   c=vertices[(i+2)%vertices.length].point;
  const signed=dot(n,cross(sub(b2,a),sub(c,b2)));
  if(signed< -eps*eps*4)
   return fail('undetermined','sorted section boundary is not convex');
 }
 const maxResidualMm=Math.max(...vertices.flatMap(q=>[
  q.planeResidualMm,q.boxOutsideMm]));
 return {status:'ready',verified:true,perimeterVerified:true,modelUnit:'mm',
  shape:'axis-aligned-rectangular-prism',curveKind:'plane-section-convex-polygon',
  vertices,perimeter:links,edgeCount:links.length,
  areaMm2:twiceArea/2,perimeterMm,maxResidualMm,
  proof:{planeBasis:{u,v,normal:n},orderedCounterclockwiseWithNormal:true,
   sourcePrismEdges:12,planeDistanceToleranceMm:eps,
   polygonDegreeTwo:true,projectedCoordinateOnly:true},
  visibilityVerified:false,sectionInteriorVerified:false,
  firstAngleConventionVerified:false,v5StepsReady:false,globallyUnique:null};
}
module.exports={prismPlaneSection};
