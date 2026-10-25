'use strict';
/**
 * Reusable C1 computation consumer of the REAL OpenCascade.js WASM HLR engine.
 * Scope: reviewed M0-proven closed convex polyhedral mesh, including
 * variable cuboids, tetrahedra and other planar-faced solids. NOT C2 Boolean.
 *
 * No second M0-M5/V5. This engine computes the visible B-Rep projected segments;
 * IDs are merely paper-collinear CANDIDATES until existing M5 proves unique
 * 3D source, endpoints and continuous visibility. Nothing here signs line style.
 *
 * Dependency inversion: the caller injects a pinned, independently initialized
 * OCJS instance, so no 50-MB WASM or node/fs import enters the normal bundle.
 */
const {VIEWS,project}=require('../../../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const finite=Number.isFinite;
function cuboidBounds(g){
 if(!g||g.kind!=='mesh'||g.space!=='model-3d'||g.unit!=='mm'||
   !g.data||!g.id||!Array.isArray(g.data.edges)||!Array.isArray(g.data.faces))
  throw new TypeError('real reviewed model-mm mesh required');
 const pts=g.data.points;
 if(!pts||Object.keys(pts).length!==8||g.data.edges.length!==12||
    g.data.faces.length!==6)throw new RangeError('only complete cuboids supported by OCJS C1');
 const axes=['x','y','z'], bounds={};
 for(const a of axes){
  const values=[...new Set(Object.values(pts).map(p=>p?.[a]))].sort((x,y)=>x-y);
  if(values.length!==2||values.some(x=>!finite(x)||Math.abs(x)>1e5)||
     values[1]-values[0]<=1e-7)
   throw new RangeError('strict finite nondegenerate axis-aligned cuboid required');
  bounds[a]=values;
 }
 const seen=new Set();
 for(const p of Object.values(pts)){
  if(!p||Object.keys(p).sort().join(',')!=='x,y,z'||
     axes.some(a=>!bounds[a].includes(p[a])))
   throw new RangeError('noncuboid source XYZ');
  seen.add(axes.map(a=>p[a]===bounds[a][0]?'0':'1').join(''));
 }
 if(seen.size!==8)throw new RangeError('all eight physical box corners required');
 const edgeKeys=new Set();
 for(const e of g.data.edges){
  if(!Array.isArray(e)||e.length!==2||e[0]===e[1]||
    !Object.hasOwn(pts,e[0])||!Object.hasOwn(pts,e[1]))
   throw new RangeError('invalid original solid edge');
  const a=pts[e[0]],b=pts[e[1]];
  if(axes.filter(k=>a[k]!==b[k]).length!==1)
   throw new RangeError('original cuboid edges must join axis-adjacent corners');
  edgeKeys.add([...e].sort().join('|'));
 }
 if(edgeKeys.size!==12)throw new RangeError('duplicate original cuboid edge');
 const faceKeys=new Set();
 for(const f of g.data.faces){
  if(!Array.isArray(f)||f.length!==4||new Set(f).size!==4||
    f.some(id=>!Object.hasOwn(pts,id)))
   throw new RangeError('all six authentic quadrilateral box faces required');
  const same=axes.filter(k=>new Set(f.map(id=>pts[id][k])).size===1);
  if(same.length!==1)throw new RangeError('box face must be planar axis boundary');
  const face=same[0]+':'+pts[f[0]][same[0]];
  faceKeys.add(face);
  for(let i=0;i<4;i++)
   if(!edgeKeys.has([f[i],f[(i+1)%4]].sort().join('|')))
    throw new RangeError('original face has nonexistent adjacent source edge');
 }
 if(faceKeys.size!==6)throw new RangeError('duplicated/missing box face');
 return bounds;
}
function method(owner,key){
 const fn=owner?.[key];
 if(typeof fn!=='function')
  throw new TypeError('pinned OpenCascade.js HLR API missing '+key+
    ' (available: '+Object.keys(owner??{}).filter(k=>
     /Pnt|Vertex|Edge|TopAbs/.test(k)).slice(0,22).join(',')+')');
 return fn;
}
function closeToSegment(p,a,b,tol=1e-6){
 const ux=b.u-a.u,uy=b.v-a.v,len2=ux*ux+uy*uy;
 if(len2<1e-15)return false;
 const cross=ux*(p.v-a.v)-uy*(p.u-a.u);
 const t=((p.u-a.u)*ux+(p.v-a.v)*uy)/len2;
 return Math.abs(cross)<=tol*Math.sqrt(len2)&&t>=-tol&&t<=1+tol;
}
function provenanceCandidates(g,view,from,to){
 const src=[];
 for(const edge of g.data.edges){
  const a=project(g.data.points[edge[0]])[view];
  const b=project(g.data.points[edge[1]])[view];
  if(closeToSegment(from,a,b)&&closeToSegment(to,a,b))
   src.push(g.id+'::'+[...edge].sort().join('|'));
 }
 return src.sort();
}
const FRAME=Object.freeze({
 V:{normal:[0,1,0],xdir:[1,0,0]},
 H:{normal:[0,0,-1],xdir:[1,0,0]},
 W:{normal:[-1,0,0],xdir:[0,1,0]}
});
/**
 * Every polygonal face is reconstructed from REVIEWED M0 mesh coordinates,
 * not a hardcoded answer. Sewed shell has no free or multiply-used CAD
 * edges; M0 independently proves its strict convex closed geometry.
 *
 * A shell suffices for HLR projection: it owns complete real OCCT faces
 * and their sewn shared topological edges, without relying on a separately
 * signed V5 action or an arbitrary triangulated renderer.
 */
function makeConvexOcjsShell({oc,geometry,newObj,hold}){
 const proof=verifiedConvexMeshHalfspaces(geometry);
 if(proof.status!=='validated-closed-convex-mesh'||
    proof.sourceGeometryId!==geometry.id||geometry.data.faces.length>64)
  throw new RangeError('independently M0-proven closed convex source required');
 const sewing=newObj('BRepBuilderAPI_Sewing',
  Math.min(1e-7,proof.toleranceMm),true,true,true,false);
 for(const faceIds of geometry.data.faces){
  const polygon=newObj('BRepBuilderAPI_MakePolygon_1');
  for(const id of faceIds){
   const p=geometry.data.points[id];
   // Added() indicates creation of the latest polygon EDGE; the first
   // vertex has no edge yet. The final closed Wire/Face and sewing are
   // the authoritative OCCT topology checks, not each intermediate flag.
   polygon.Add_1(newObj('gp_Pnt_3',p.x,p.y,p.z));
  }
  polygon.Close();
  const wire=hold(polygon.Wire());
  if(wire.IsNull())throw new RangeError('real polygon wire is null');
  const faceBuilder=newObj('BRepBuilderAPI_MakeFace_15',wire,true);
  const face=hold(faceBuilder.Face());
  if(!faceBuilder.IsDone()||face.IsNull())
   throw new RangeError('OCJS could not build source polygon face');
  sewing.Add(face);
 }
 // Message_ProgressRange is a normal OCCT algorithm call argument, not
 // an independent or fabricated processing model.
 sewing.Perform(newObj('Message_ProgressRange_1'));
 if(sewing.NbFreeEdges()!==0||sewing.NbMultipleEdges()!==0)
  throw new RangeError('real OCJS sewn convex shell has open or nonmanifold edges');
 const shell=hold(sewing.SewedShape());
 if(shell.IsNull())throw new RangeError('OCJS returned null sewn shell');
 return shell;
}
function computeC1OcjsVisibleSegments({oc,geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current reviewed C1 revision required');
 // Closed convex meshes are independently proved at M0 before any CAD
 // call; cuboids reuse efficient OCCT primitive and other polyhedra use
 // genuine polygon-face sewing (not a second geometric inference path).
 verifiedConvexMeshHalfspaces(geometry);
 let b=null;
 try{b=cuboidBounds(geometry);}catch(_){ /* generic convex branch */ }
 const owned=[];
 const hold=obj=>{
  if(!obj||typeof obj.delete!=='function')
   throw new TypeError('unreleasable OCJS object');
  owned.push(obj);return obj;
 };
 const newObj=(key,...args)=>hold(new (method(oc,key))(...args));
 const enumValue=(name)=>oc.TopAbs_ShapeEnum?.[name]??oc[name];
 try{
  const kind=enumValue('TopAbs_EDGE'),vertexType=enumValue('TopAbs_VERTEX'),
   avoid=enumValue('TopAbs_SHAPE');
  if([kind,vertexType,avoid].some(x=>x===undefined))
   throw new TypeError('real OCJS TopAbs enum unavailable');
  let solid;
  if(b){
   const builder=newObj('BRepPrimAPI_MakeBox_4',
    newObj('gp_Pnt_3',b.x[0],b.y[0],b.z[0]),
    newObj('gp_Pnt_3',b.x[1],b.y[1],b.z[1]));
   solid=hold(builder.Shape());
   if(!builder.IsDone()||solid.IsNull())
    throw new RangeError('real OCJS B-Rep cuboid construction failed');
  }else{
   solid=makeConvexOcjsShell({oc,geometry,newObj,hold});
  }
  const rows={};
  for(const view of VIEWS){
   const f=FRAME[view];
   const axis=newObj('gp_Ax2_2',newObj('gp_Pnt_3',0,0,0),
     newObj('gp_Dir_4',...f.normal),newObj('gp_Dir_4',...f.xdir));
   const projector=newObj('HLRAlgo_Projector_2',axis);
   const algorithm=newObj('HLRBRep_Algo_1');
   algorithm.Add_2(solid,0);
   algorithm.Projector_1(projector);
   algorithm.Update();
   algorithm.Hide_1();
   const handle=newObj('Handle_HLRBRep_Algo_2',algorithm);
   if(handle.IsNull())throw new RangeError('null OCJS B-Rep HLR handle');
   const extractor=newObj('HLRBRep_HLRToShape',handle),
    visible=hold(extractor.VCompound_1());
   if(visible.IsNull())throw new RangeError('no real OCJS visible HLR geometry');
   const edges=newObj('TopExp_Explorer_2',visible,kind,avoid);
   const segments=[];
   while(edges.More()){
    const edge=hold(edges.Current());
    const vs=newObj('TopExp_Explorer_2',edge,vertexType,avoid),coords=[];
    while(vs.More()){
     const shape=hold(vs.Current());
     // OCJS is generated Embind: a static downcast + OCCT vertex location.
     const vertex=hold(method(oc.TopoDS,'Vertex_1')(shape));
     const p=hold(method(oc.BRep_Tool,'Pnt')(vertex));
     if(![p.X(),p.Y(),p.Z()].every(finite)||Math.abs(p.Z())>1e-6)
      throw new RangeError('nonfinite/nonplanar real HLR edge');
     coords.push({u:p.X(),v:-p.Y()});
     vs.Next();
    }
    if(coords.length!==2)throw new RangeError('HLR edge missing true endpoints');
    if(Math.hypot(coords[0].u-coords[1].u,coords[0].v-coords[1].v)>1e-7){
     const candidates=provenanceCandidates(geometry,view,coords[0],coords[1]);
     if(!candidates.length)
      throw new RangeError('real OCJS line cannot be related to original C1 source');
     segments.push({view,from:coords[0],to:coords[1],
      projectedOriginalEdgeCandidates:candidates});
    }
    if(segments.length>128)
     throw new RangeError('unbounded real B-Rep HLR output');
    edges.Next();
   }
   if(segments.length<(b?4:3))
    throw new RangeError('real OCJS C1 silhouette incomplete for '+view+' count='+segments.length+' source='+geometry.id+' scope='+(b?'cuboid':'sewn-convex-shell'));
   rows[view]=segments;
  }
  return Object.freeze({
   schema:'draftai-c1-ocjs-real-visible-brep/1',
   engine:'opencascade.js',revision,
   sourceGeometryId:geometry.id,unit:'mm',
   proofScope:b?'reviewed-axis-aligned-cuboid':
    'reviewed-closed-convex-polyhedral-shell',
   views:rows,engineComputedVisibleGeometry:true,
   sourceCandidateOnly:true,
   lineStyleCertified:false,v5Authorized:false
  });
 }finally{
  for(const o of owned.reverse())o.delete();
 }
}
module.exports={computeC1OcjsVisibleSegments,cuboidBounds};
