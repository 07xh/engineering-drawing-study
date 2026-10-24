'use strict';
/**
 * M0/M5: strict, general convex closed Geometry mesh -> outward halfspaces.
 * Mesh vertices/edges/faces are USER-REVIEWED GIVEN GEOMETRY, not results
 * inferred from a reference drawing. An arbitrary render mesh is NOT a
 * closed occluding solid. Independently check closed two-face edge manifold,
 * Euler topology, nonzero volume, supporting planes and ordered convex faces
 * before converting to a finite convex intersection.
 */
const {validateGeometry}=require('../contracts/geometry.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const xyz=p=>p&&['x','y','z'].every(k=>finite(p[k]));
const {subtractObject3:sub,crossObject3:cross,dotObject3:dot,
 normObject3:len}=require('../numeric/object-vector3.cjs');
const edgeKey=(a,b)=>[a,b].sort().join('|');
const reject=why=>{throw new TypeError('closed convex mesh evidence: '+why);};
function verifiedConvexMeshHalfspaces(g){
 const v=validateGeometry(g);
 if(!v.ok||g?.kind!=='mesh'||g.space!=='model-3d'||g.unit!=='mm')
  reject('explicit finite model-3d mm mesh required');
 const {points,edges,faces}=g.data,ids=Object.keys(points);
 if(ids.length<4||ids.length>128||edges.length<6||edges.length>256||
    faces.length<4||faces.length>64||ids.length-edges.length+faces.length!==2)
  reject('bounded Euler-closed convex polyhedron topology required');
 const coords=ids.map(id=>points[id]);
 const extent=Math.max(...['x','y','z'].map(k=>
  Math.max(...coords.map(p=>p[k]))-Math.min(...coords.map(p=>p[k]))));
 if(!finite(extent)||extent<=1e-7||extent>1e6)
  reject('nondegenerate bounded mesh extent required');
 const tol=Math.max(1e-8,extent*1e-9);
 for(let i=0;i<coords.length;i++)for(let j=i+1;j<coords.length;j++)
  if(len(sub(coords[i],coords[j]))<=tol)
   reject('two different vertex identities share a geometric point');
 const centroid={x:coords.reduce((s,p)=>s+p.x,0)/coords.length,
  y:coords.reduce((s,p)=>s+p.y,0)/coords.length,
  z:coords.reduce((s,p)=>s+p.z,0)/coords.length};
 if(!xyz(centroid))reject('nonfinite solid interior witness');
 const faceEdgeCounts=new Map(),used=new Set(),halfspaces=[];
 for(let i=0;i<faces.length;i++){
  const face=faces[i],vertex=face.map(id=>points[id]);
  if(face.length>64)reject('bounded convex polygon faces required');
  for(const id of face)used.add(id);
  const a=vertex[0];
  let normal=null;
  for(let k=1;k<vertex.length-1;k++){
   const n=cross(sub(vertex[k],a),sub(vertex[k+1],a));
   const d=len(n);
   if(finite(d)&&d>tol*tol){
    normal={x:n.x/d,y:n.y/d,z:n.z/d};break;
   }
  }
  if(!normal)reject('collinear or numerically degenerate face');
  let offset=dot(normal,a);
  if(dot(normal,centroid)>offset){normal={x:-normal.x,y:-normal.y,z:-normal.z};offset=-offset;}
  if(offset-dot(normal,centroid)<=tol)
   reject('no strictly interior vertex-centroid proof');
  for(const p of coords){
   if(dot(normal,p)>offset+tol)
    reject('nonconvex face support plane or inverted face');
  }
  for(const p of vertex){
   if(Math.abs(dot(normal,p)-offset)>tol)
    reject('nonplanar face ring');
  }
  let winding=0;
  for(let k=0;k<vertex.length;k++){
   const aa=vertex[k],bb=vertex[(k+1)%vertex.length],
    cc=vertex[(k+2)%vertex.length];
   const turn=dot(normal,cross(sub(bb,aa),sub(cc,bb)));
   if(Math.abs(turn)>tol*tol){
    const direction=Math.sign(turn);
    if(winding&&winding!==direction)
     reject('nonconvex or self-intersecting face ring');
    winding=direction;
   }
   if(len(sub(bb,aa))<=tol)reject('zero-length face edge');
   const key=edgeKey(face[k],face[(k+1)%face.length]);
   faceEdgeCounts.set(key,(faceEdgeCounts.get(key)||0)+1);
  }
  halfspaces.push({id:'face-'+(i+1),normal,offsetMm:offset});
 }
 if(used.size!==ids.length||faceEdgeCounts.size!==edges.length||
    [...faceEdgeCounts.values()].some(n=>n!==2))
  reject('open, nonmanifold or disconnected face boundary');
 const declared=new Set(edges.map(x=>edgeKey(x[0],x[1])));
 if(declared.size!==edges.length||
    [...faceEdgeCounts.keys()].some(k=>!declared.has(k)))
  reject('declared Geometry mesh edges disagree with closed faces');
 return Object.freeze({
  status:'validated-closed-convex-mesh',
  sourceGeometryId:g.id,unit:'mm',toleranceMm:tol,
  sourceVertexCount:ids.length,sourceEdgeCount:edges.length,
  sourceFaceCount:faces.length,halfspaces:Object.freeze(
   halfspaces.map(h=>Object.freeze({...h,normal:Object.freeze(h.normal)}))),
  provenTopology:'convex-closed-two-face-edges-and-euler',
  v5Ready:false,officialLineStylesVerified:false,
  wholeDrawingVerified:false
 });
}
module.exports={verifiedConvexMeshHalfspaces};
