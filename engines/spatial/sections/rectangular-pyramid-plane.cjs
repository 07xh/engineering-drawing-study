'use strict';
/** Exact finite-edge intersection of one upright rectangular pyramid with a plane.
 * No inferred visibility, first-angle standard or animation is claimed. */
const {normalizePlane}=require('./axis-cylinder-plane.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const valid=p=>p&&['x','y','z'].every(k=>finite(p[k])&&Math.abs(p[k])<=1e7);
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const mul=(a,t)=>({x:a.x*t,y:a.y*t,z:a.z*t});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const size=a=>Math.hypot(a.x,a.y,a.z);
const projection=p=>({V:{u:p.x,v:p.z},H:{u:p.x,v:p.y},W:{u:p.y,v:p.z}});
const fail=(status,reason)=>({status,reason,verified:false,perimeterVerified:false,
 vertices:[],perimeter:[],modelUnit:'mm',visibilityVerified:false,
 firstAngleConventionSignedOff:false,v5StepsReady:false,globallyUnique:null});
function checkPyramid(input){
 if(!input||!input.base||!valid(input.apex))throw new TypeError('bounded rectangular pyramid and apex required');
 const b=input.base,a=input.apex;
 if(!['minX','minY','maxX','maxY','z'].every(k=>finite(b[k])&&Math.abs(b[k])<=1e7)||
  b.maxX-b.minX<=1e-6||b.maxY-b.minY<=1e-6||a.z-b.z<=1e-6||
  b.maxX-b.minX>1e6||b.maxY-b.minY>1e6||a.z-b.z>1e6||
  a.x<=b.minX||a.x>=b.maxX||a.y<=b.minY||a.y>=b.maxY)
  throw new TypeError('upright pyramid requires positive finite base and apex strictly above its interior');
 return {base:{minX:b.minX,minY:b.minY,maxX:b.maxX,maxY:b.maxY,z:b.z},apex:{...a}};
}
function pyramidPlaneSection(input,plane){
 const pyramid=checkPyramid(input),pl=normalizePlane(plane),n=pl.normal;
 const b=pyramid.base,apex=pyramid.apex;
 const vertices3d=[
  {x:b.minX,y:b.minY,z:b.z},{x:b.maxX,y:b.minY,z:b.z},
  {x:b.maxX,y:b.maxY,z:b.z},{x:b.minX,y:b.maxY,z:b.z},apex
 ];
 const faces=[
  {id:'base',indices:[0,1,2,3]},
  ...[0,1,2,3].map(i=>({id:'side-'+i,indices:[i,(i+1)%4,4]}))
 ];
 const edges=[
  ...[0,1,2,3].map(i=>({id:'base-edge-'+i,a:i,b:(i+1)%4,faces:['base','side-'+i]})),
  ...[0,1,2,3].map(i=>({id:'apex-edge-'+i,a:i,b:4,faces:['side-'+i,'side-'+((i+3)%4)]}))
 ];
 const scale=Math.max(1,b.maxX-b.minX,b.maxY-b.minY,apex.z-b.z);
 const eps=1e-8*scale;
 const distance=p=>dot(n,sub(p,pl.point));
 const signs=vertices3d.map(distance);
 if(signs.some(d=>!finite(d)))return fail('undetermined','nonfinite signed plane distance');
 if(signs.every(d=>d>eps)||signs.every(d=>d< -eps))
  return fail('none','plane does not meet finite pyramid');
 if(signs.some(d=>Math.abs(d)<=eps))
  return fail('boundary-degenerate','plane touches an original pyramid vertex; needs separate topology proof');
 const candidates=[];
 for(const edge of edges){
  const da=signs[edge.a],db=signs[edge.b];
  if((da<0&&db<0)||(da>0&&db>0))continue;
  const t=da/(da-db);
  if(!finite(t)||t<=0||t>=1)return fail('undetermined','section parameter is not on open source edge');
  const a=vertices3d[edge.a],p=add(a,mul(sub(vertices3d[edge.b],a),t));
  if(!valid(p)||Math.abs(distance(p))>4*eps)
   return fail('undetermined','finite edge-plane intersection residual exceeded tolerance');
  candidates.push({sourceEdgeId:edge.id,sourceFaces:edge.faces,parameter:t,point:p});
 }
 if(candidates.length<3||candidates.length>5)
  return fail('undetermined','nondegenerate pyramid plane cut must have 3–5 corners');
 for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++)
  if(size(sub(candidates[i].point,candidates[j].point))<=4*eps)
   return fail('undetermined','intersection points are not independently separated');
 let center={x:0,y:0,z:0};
 for(const q of candidates)center=add(center,q.point);
 center=mul(center,1/candidates.length);
 const axisName=['x','y','z'].sort((a,b)=>Math.abs(n[a])-Math.abs(n[b]))[0];
 const ref={x:Number(axisName==='x'),y:Number(axisName==='y'),z:Number(axisName==='z')};
 const rawU=cross(ref,n),ulen=size(rawU);
 if(!finite(ulen)||ulen<=1e-12)return fail('undetermined','unable to construct plane basis');
 const u=mul(rawU,1/ulen),v=cross(n,u);
 const ordered=candidates.map(c=>({
  ...c,angle:Math.atan2(dot(v,sub(c.point,center)),dot(u,sub(c.point,center)))
 })).sort((a,b)=>a.angle-b.angle||a.sourceEdgeId.localeCompare(b.sourceEdgeId));
 let twiceArea=0,perimeterMm=0,maxResidualMm=0;
 const resultVertices=ordered.map((q,i)=>{
  const residual=Math.abs(distance(q.point));maxResidualMm=Math.max(maxResidualMm,residual);
  return {id:'section-'+(i+1),point:{...q.point},sourceEdgeId:q.sourceEdgeId,
   sourceFaces:[...q.sourceFaces],sourceEdgeParameter:q.parameter,
   planeResidualMm:residual,projection:projection(q.point)};
 });
 const links=[];
 const usedFaces=new Set();
 for(let i=0;i<ordered.length;i++){
  const a=ordered[i],z=ordered[(i+1)%ordered.length];
  const joint=a.sourceFaces.filter(id=>z.sourceFaces.includes(id));
  if(joint.length!==1||usedFaces.has(joint[0]))
   return fail('undetermined','successive section corners do not belong to one unique source face');
  const face=faces.find(f=>f.id===joint[0]);
  const faceOrigin=vertices3d[face.indices[0]],dir1=sub(vertices3d[face.indices[1]],faceOrigin),
   dir2=sub(vertices3d[face.indices[2]],faceOrigin);
  const faceCross=cross(dir1,dir2),faceSize=size(faceCross);
  if(!finite(faceSize)||faceSize<=eps*eps)return fail('undetermined','degenerate source pyramid face');
  const faceNormal=mul(faceCross,1/faceSize);
  const mid=mul(add(a.point,z.point),.5);
  const faceResidual=Math.max(Math.abs(dot(faceNormal,sub(a.point,faceOrigin))),
   Math.abs(dot(faceNormal,sub(z.point,faceOrigin))),
   Math.abs(dot(faceNormal,sub(mid,faceOrigin))));
  const planeResidual=Math.abs(distance(mid));
  if(!finite(faceResidual)||faceResidual>4*eps||planeResidual>4*eps)
   return fail('undetermined','section segment fails actual containing face residual');
  const dist=size(sub(a.point,z.point));
  if(!finite(dist)||dist<=4*eps)return fail('undetermined','zero-length section edge');
  const ca=sub(a.point,center),cb=sub(z.point,center);
  twiceArea+=dot(u,ca)*dot(v,cb)-dot(u,cb)*dot(v,ca);
  perimeterMm+=dist;maxResidualMm=Math.max(maxResidualMm,faceResidual,planeResidual);
  usedFaces.add(face.id);
  links.push({id:'section-edge-'+(i+1),fromId:'section-'+(i+1),
   toId:'section-'+((i+1)%ordered.length+1),sourceFaceId:face.id,
   from:{...a.point},to:{...z.point},lengthMm:dist,
   sourceEdgeIds:[a.sourceEdgeId,z.sourceEdgeId],
   projectedEndpoints:{from:projection(a.point),to:projection(z.point)},
   faceResidualMm:faceResidual});
 }
 if(!finite(twiceArea)||twiceArea<=eps*eps*8)
  return fail('undetermined','polygon is zero-area or not counterclockwise');
 for(let i=0;i<ordered.length;i++){
  const a=ordered[i].point,b=ordered[(i+1)%ordered.length].point,
   c=ordered[(i+2)%ordered.length].point;
  const turn=dot(n,cross(sub(b,a),sub(c,b)));
  if(!finite(turn)||turn<=eps*eps*4)
   return fail('undetermined','section polygon convexity not proven');
 }
 return {status:'ready',verified:true,perimeterVerified:true,
  shape:'upright-rectangular-pyramid',modelUnit:'mm',
  vertices:resultVertices,perimeter:links,edgeCount:links.length,
  areaMm2:twiceArea/2,perimeterMm,maxResidualMm,
  proof:{sourcePyramidEdges:8,sourcePyramidFaces:5,
   uniqueContainingFaces:usedFaces.size,planeToleranceMm:eps,
   polygonDegreeTwo:true,orderedCounterclockwiseWithPlaneNormal:true,
   projectionCoordinatesOnly:true},
  visibilityVerified:false,sectionInteriorVerified:false,
  firstAngleConventionSignedOff:false,v5StepsReady:false,globallyUnique:null};
}
module.exports={pyramidPlaneSection};
