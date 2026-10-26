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
const {readRealOcjsSharpHLREdge}=
 require('./c1-ocjs-raw-hlr-edges.cjs');
const {computeC1NativeHLRIsSameVertexGraph}=
 require('./c1-ocjs-native-vertex-issame-graph.cjs');
const finite=Number.isFinite;
const {verifyOcjsHLRProjectedLineCurveWitness}=
 require('./c1-ocjs-output-curve-witness.cjs');
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

/**
 * Lift ACTUAL projected HLR endpoints back onto every compatible ORIGINAL
 * M0 edge. These are per-source 3D CANDIDATES, not OCCT TopoDS identities:
 * two edges at different depths can have precisely the same V/H/W image.
 * Reprojection is checked independently of the initial collinearity test.
 * This intentionally does not certify a 3D B-Rep curve, M5 style or V5.
 */
function liftOriginalProjectedSourceCandidates(g,view,from,to){
 if(!VIEWS.includes(view)||![from?.u,from?.v,to?.u,to?.v].every(finite))
  throw new TypeError('finite actual HLR V/H/W projected endpoints required');
 // A projected point is not a B-Rep line, even when it lies on several
 // original edges. Never assign it a 3D source identity.
 const degenerate=Math.hypot(to.u-from.u,to.v-from.v)<=1e-8;
 const ids=degenerate?[]:provenanceCandidates(g,view,from,to);
 const sourceCandidate3DLifts=ids.map(sourceEdgeId=>{
  const edge=g.data.edges.find(e=>
   g.id+'::'+[...e].sort().join('|')===sourceEdgeId);
  if(!edge)throw new RangeError('original 3D source edge missing');
  const a=g.data.points[edge[0]],b=g.data.points[edge[1]];
  const pa=project(a)[view],pb=project(b)[view];
  const du=pb.u-pa.u,dv=pb.v-pa.v,den=du*du+dv*dv;
  if(!(den>1e-15)||!finite(den))
   throw new RangeError('projected original source edge collapsed');
  const fraction=q=>((q.u-pa.u)*du+(q.v-pa.v)*dv)/den;
  const ta=fraction(from),tb=fraction(to);
  if(![ta,tb].every(finite)||ta < -1e-6||ta>1+1e-6||
     tb < -1e-6||tb>1+1e-6)
   throw new RangeError('HLR endpoint lies outside original source edge');
  const clamp=t=>Math.max(0,Math.min(1,t));
  const t0=clamp(ta),t1=clamp(tb);
  const point=t=>({x:a.x+(b.x-a.x)*t,
   y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
  const fromCandidate3D=point(t0),toCandidate3D=point(t1);
  const pf=project(fromCandidate3D)[view],
   pt=project(toCandidate3D)[view];
  if(Math.hypot(pf.u-from.u,pf.v-from.v)>1e-6||
     Math.hypot(pt.u-to.u,pt.v-to.v)>1e-6)
   throw new RangeError('original 3D source candidate fails HLR reprojection');
  return {
   sourceEdgeId,originalVertexIds:[...edge],
   sourceParameterAtProjectedFrom:t0,sourceParameterAtProjectedTo:t1,
   originalSourceParameterRange:[Math.min(t0,t1),Math.max(t0,t1)],
   fromCandidate3D,toCandidate3D,
   originalSourceCurveType:'straight-m0-polyhedral-edge',
   originalXYZReprojectsToHLR:true,
   actualOCCTTopoDSEdgeIdentityRecovered:false,
   actualOCCT3DCurveExtracted:false,
   officialEngineeringLineStyle:'undetermined',v5Authorized:false
  };
 });
 return {
  projectedOriginalEdgeCandidates:ids,sourceCandidate3DLifts,
  unmappedReason:ids.length?null:degenerate?
   'degenerate-projected-hlr-not-a-physical-segment':
   'no-original-m0-edge-reprojects-to-both-hlr-endpoints',
  candidate3DGeometryOnly:true,actualOCCTTopoDSIdentityRecovered:false,
  officialEngineeringLineStyle:'undetermined',v5Authorized:false
 };
}

/**
 * Correlate one real ORIGINAL OCCT source B-Rep edge with an M0 source edge
 * using its measured 3D OCCT vertex coordinates, NEVER a paper projection.
 * Source identity is unique only within the original input shape. This does
 * NOT establish which original TopoDS edge generated a particular HLR edge.
 */
function matchOriginalBRepEdgeByXYZ(geometry,occtFrom,occtTo){
 const valid=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
 if(!valid(occtFrom)||!valid(occtTo))
  throw new TypeError('finite measured OCCT 3D edge endpoints required');
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 if(distance(occtFrom,occtTo)<=1e-8)
  throw new RangeError('OCCT original 3D source edge has collapsed endpoints');
 const matches=[];
 for(const vertices of geometry.data.edges){
  const [a,b]=vertices,from=geometry.data.points[a],
   to=geometry.data.points[b];
  if(!valid(from)||!valid(to))throw new RangeError('invalid M0 source XYZ');
  const direct=distance(occtFrom,from)<=1e-6&&
   distance(occtTo,to)<=1e-6;
  const reverse=distance(occtFrom,to)<=1e-6&&
   distance(occtTo,from)<=1e-6;
  if(direct||reverse)matches.push({
   sourceEdgeId:geometry.id+'::'+[...vertices].sort().join('|'),
   originalVertexIds:[...vertices],occtEdgeOrientation:direct?'forward':'reverse',
   fromOCCT3D:{...occtFrom},toOCCT3D:{...occtTo},
   originalOCCTBRepVertexXYZMatched:true,
   occtCurveTypeIndependentlyVerified:false,
   generatedHLREdgeTopoDSIdentityMatched:false,
   engineeringLineStyle:'undetermined',v5Authorized:false
  });
 }
 if(matches.length!==1)
  throw new RangeError('original OCCT source B-Rep 3D endpoint match '+matches.length+
   ' (missing or ambiguous M0 physical source)');
 return matches[0];
}

/**
 * Independent geometric check of an actual OCCT BRepAdaptor 3D LINE.
 * Reject finite but wrong curve samples and parametric midpoint drift.
 * A straight 3D source curve does not prove HLR source topology or line style.
 */
function verifyOriginalOcctLinearCurveWitness({
 sourceEndpoints,parameterRange,curveSamples,curveKind
}={}){
 const finite3=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
 if(curveKind!=='line'||!Array.isArray(sourceEndpoints)||
    sourceEndpoints.length!==2||!sourceEndpoints.every(finite3)||
    !Array.isArray(parameterRange)||parameterRange.length!==2||
    !parameterRange.every(Number.isFinite)||
    !(parameterRange[1]>parameterRange[0])||
    !Array.isArray(curveSamples)||curveSamples.length!==3||
    !curveSamples.every(finite3))
  throw new TypeError('finite OCCT 3D line curve and parameter witness required');
 const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const [a,b]=sourceEndpoints,[first,middle,last]=curveSamples;
 const direct=d(a,first)<=1e-6&&d(b,last)<=1e-6;
 const reverse=d(a,last)<=1e-6&&d(b,first)<=1e-6;
 if(!direct&&!reverse||d(a,b)<=1e-8)
  throw new RangeError('OCCT BRep curve endpoints disagree with original 3D topology');
 const affineMid={x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2};
 if(d(middle,affineMid)>1e-6)
  throw new RangeError('OCCT BRep reported line with nonaffine middle geometry');
 return {
  occtSourceCurveType:'line',
  occtSourceCurveParameterRange:[...parameterRange],
  occtSourceCurve3DEndpointsAndMidpointVerified:true,
  occtCurveTypeIndependentlyVerified:true,
  generatedHLREdgeTopoDSIdentityMatched:false,
  engineeringLineStyle:'undetermined',v5Authorized:false
 };
}
/**
 * Traverse actual OCJS ORIGINAL shape TopoDS edges, not HLR's flattened
 * visible output. Return an auditable complete source edge ledger. It is
 * only a corroboration for independently M0-reviewed source identity.
 */
/**
 * Compare ACTUAL native HLR edge TShapes against the ACTUAL original BRep
 * source-edge TShapes before Emscripten handles are destroyed.
 *
 * IsSame positively establishes shared TShape+Location (ignoring orientation)
 * when true. A normal HLR-created edge can have no IsSame source match:
 * paper coincidence must NEVER be substituted for generated-edge history.
 */
function probeRealOcctHLREdgeDirectOriginalSourceIdentity({
 generatedEdge,originalSourceEdges
}={}){
 if(typeof generatedEdge?.IsSame!=='function'||
    !Array.isArray(originalSourceEdges))
  throw new TypeError('actual OCCT generated and original native TopoDS edges required');
 const ids=new Set(),visited=new Set();
 for(const item of originalSourceEdges){
  if(typeof item?.sourceEdgeId!=='string'||!item.sourceEdgeId||
     typeof item.edge?.IsSame!=='function')
   throw new TypeError('untrusted original native TopoDS source edge');
  const forward=generatedEdge.IsSame(item.edge),
   backward=item.edge.IsSame(generatedEdge);
  if(typeof forward!=='boolean'||typeof backward!=='boolean'||
     forward!==backward)
   throw new RangeError('asymmetric or nonboolean actual OCCT TopoDS IsSame proof');
  visited.add(item.sourceEdgeId);
  if(forward)ids.add(item.sourceEdgeId);
 }
 if(ids.size>1)
  throw new RangeError('generated HLR TopoDS edge IsSame to multiple different original physical edges');
 return {
  actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared:true,
  originalPhysicalOCCTSourceIdsCompared:[...visited].sort(),
  directlySameOriginalOCCTBRepSourceEdgeIds:[...ids].sort(),
  directlySameUniqueOriginalOCCTBRepSourceEdgeId:
   ids.size===1?[...ids][0]:null,
  actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven:ids.size===1,
  // Direct IsSame is not history for HLR-created, split or reprojected edges.
  completeOCCTGeneratedEdgeToOriginalTopoDSHistoryCertified:false,
  wholeSceneEngineeringLineStyleCertified:false,
  signedV5Action:false
 };
}
function extractRealOcjsOriginalSourceBRepEdges({
 oc,shape,geometry,kind,vertexType,avoid,newObj,hold,originalNativeEdgeHandles
}){
 const explorer=newObj('TopExp_Explorer_2',shape,kind,avoid);
 const matches=new Map();
 let occurrences=0;
 while(explorer.More()){
  if(++occurrences>512)throw new RangeError('excess OCCT source topology edges');
  const edge=hold(explorer.Current());
  const vertices=newObj('TopExp_Explorer_2',edge,vertexType,avoid);
  const coords=[];
  while(vertices.More()){
   const node=hold(vertices.Current());
   const vertex=hold(method(oc.TopoDS,'Vertex_1')(node));
   const point=hold(method(oc.BRep_Tool,'Pnt')(vertex));
   coords.push({x:point.X(),y:point.Y(),z:point.Z()});
   if(coords.length>2)
    throw new RangeError('original OCCT edge with non-segment source vertices');
   vertices.Next();
  }
  if(coords.length!==2)throw new RangeError('missing real original OCCT 3D vertices');
  const edgeType=hold(method(oc.TopoDS,'Edge_1')(edge));
  const adaptor=newObj('BRepAdaptor_Curve_2',edgeType);
  const kindLine=oc.GeomAbs_CurveType?.GeomAbs_Line??oc.GeomAbs_Line;
  if(kindLine===undefined||adaptor.GetType()!==kindLine||
     adaptor.Is3DCurve()!==true)
   throw new RangeError('original OCCT polyhedral source is not verified 3D line');
  const first=adaptor.FirstParameter(),last=adaptor.LastParameter();
  if(![first,last].every(finite)||!(last>first))
   throw new RangeError('nonfinite/nonincreasing OCCT source curve parameters');
  const readCurvePoint=t=>{
   const pt=hold(adaptor.Value(t));
   return {x:pt.X(),y:pt.Y(),z:pt.Z()};
  };
  const curveProof=verifyOriginalOcctLinearCurveWitness({
   sourceEndpoints:coords,parameterRange:[first,last],
   curveSamples:[readCurvePoint(first),
    readCurvePoint((first+last)/2),readCurvePoint(last)],
   curveKind:'line'
  });
  const record={...matchOriginalBRepEdgeByXYZ(geometry,coords[0],coords[1]),
   ...curveProof};
  if(originalNativeEdgeHandles instanceof Array)
   originalNativeEdgeHandles.push({sourceEdgeId:record.sourceEdgeId,edge:edgeType});
  const prior=matches.get(record.sourceEdgeId);
  if(prior){
   const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
   const same=d(prior.fromOCCT3D,record.fromOCCT3D)<=1e-6&&
    d(prior.toOCCT3D,record.toOCCT3D)<=1e-6;
   const swapped=d(prior.fromOCCT3D,record.toOCCT3D)<=1e-6&&
    d(prior.toOCCT3D,record.fromOCCT3D)<=1e-6;
   if(!same&&!swapped||
      prior.occtSourceCurveType!==record.occtSourceCurveType||
      prior.occtSourceCurve3DEndpointsAndMidpointVerified!==true)
    throw new RangeError('duplicate conflicting original OCCT edge');
  }else matches.set(record.sourceEdgeId,record);
  explorer.Next();
 }
 if(matches.size!==geometry.data.edges.length)
  throw new RangeError('real original OCCT source topology incomplete: '+
   matches.size+'/'+geometry.data.edges.length);
 return {
  originalBRepSourceEdges:[...matches.values()].sort((a,b)=>
   a.sourceEdgeId.localeCompare(b.sourceEdgeId)),
  occtOriginalEdgeOccurrenceCount:occurrences,
  completeSourceTopology3DEndpointCorrespondence:true,
  generatedHLREdgeTopoDSIdentityMatched:false,
  actualOCCTCurveTypeIndependentlyVerified:true,
  engineeringLineStylesCertified:false,v5Authorized:false
 };
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
  const originalNativeEdgeHandles=[];
  const sourceBRep=extractRealOcjsOriginalSourceBRepEdges({
   oc,shape:solid,geometry,kind,vertexType,avoid,newObj,hold,
   originalNativeEdgeHandles
  });
  if(originalNativeEdgeHandles.length!==sourceBRep.occtOriginalEdgeOccurrenceCount)
   throw new RangeError('native source OCCT TopoDS edge occurrence ledger incomplete');
  const sourceById=new Map(sourceBRep.originalBRepSourceEdges.map(x=>
   [x.sourceEdgeId,x]));
  const rows={},hiddenViews={},hiddenSharpNullCompoundViews=[];
  const nativeGraphInput={};
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
   const withSourceCandidates=(measured,hlrClass,generatedNativeEdge)=>{
    const lifted=liftOriginalProjectedSourceCandidates(
     geometry,view,measured.from,measured.to);
    if(hlrClass==='visible-sharp'&&lifted.unmappedReason)
     throw new RangeError('real OCJS visible HLR source unmapped in '+
      view+': '+lifted.unmappedReason);
    const verifiedLifts=lifted.sourceCandidate3DLifts.map(lift=>{
     const actual=sourceById.get(lift.sourceEdgeId);
     if(!actual||actual.originalOCCTBRepVertexXYZMatched!==true||
        actual.occtSourceCurve3DEndpointsAndMidpointVerified!==true)
      throw new RangeError('real source 3D OCCT BRep curve missing for HLR candidate');
     return {...lift,actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
      originalOCCTSourceCurveType:actual.occtSourceCurveType,
      originalOCCTCurveParameterRange:[...actual.occtSourceCurveParameterRange],
      originalOCCTSourceLineCurveVerified:
       actual.occtSourceCurve3DEndpointsAndMidpointVerified,
      actualOriginalOCCTBRepFrom3D:{...actual.fromOCCT3D},
      actualOriginalOCCTBRepTo3D:{...actual.toOCCT3D},
      actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false};
    });
    const direct=probeRealOcctHLREdgeDirectOriginalSourceIdentity({
     generatedEdge:generatedNativeEdge,originalSourceEdges:originalNativeEdgeHandles
    });
    if(direct.directlySameUniqueOriginalOCCTBRepSourceEdgeId!==null&&
       !lifted.projectedOriginalEdgeCandidates.includes(
        direct.directlySameUniqueOriginalOCCTBRepSourceEdgeId))
     throw new RangeError('actual OCCT native IsSame original edge disagrees with geometric M0 HLR source candidates');
    return {...measured,...lifted,...direct,occtHLRVisibilityClass:hlrClass,
     sourceCandidate3DLifts:verifiedLifts,
     originalOCCTSourceTopology3DVerified:true,
     actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,
     hiddenStrokeEngineeringStyleNotCertified:true};
   };
   // Same native edge reader is used on both HLR sharp-edge compounds.
   // Neither represents original TopoDS identity or a GB line style.
   const traverse=(compound,hlrClass)=>{
    const edges=newObj('TopExp_Explorer_2',compound,kind,avoid);
    const result=[],vertexRecords=[];
    while(edges.More()){
     const edge=hold(edges.Current());
     let nativeEndpoints=null;
     const measured=readRealOcjsSharpHLREdge({
      oc,edge,view,vertexType,avoid,newObj,hold,
      onGenuineTopoDSVertices:rec=>{nativeEndpoints=rec;}
     });
     if(measured){
      const checked=withSourceCandidates(measured,hlrClass,edge);
      if(!nativeEndpoints||
         nativeEndpoints.nativeVertices.length!==2||
         nativeEndpoints.projectedEndpoints.length!==2)
       throw new RangeError('verified OCCT edge lost its native vertex topology');
      const ordinal=result.length;
      result.push(checked);
      vertexRecords.push({nativeHLREdgeOrdinal:ordinal,
       vertices:nativeEndpoints.nativeVertices,
       projectedEndpoints:nativeEndpoints.projectedEndpoints});
     }
     if(result.length>128)
      throw new RangeError('unbounded real BRep HLR sharp-edge output');
     edges.Next();
    }
    return {segments:result,vertexRecords};
   };
   const visibleNative=traverse(visible,'visible-sharp');
   const segments=visibleNative.segments;
   // HCompound contains ACTUAL hidden C0/sharp HLR edges. This is
   // computed occlusion evidence, not permission to draw GB dashed lines.
   const hidden=hold(method(extractor,'HCompound_1').call(extractor));
   // Native HCompound legitimately yields a null TopoDS shape when NO
   // sharp hidden edges exist for a particular view. Null is not a line.
   // Track this empty case explicitly rather than forging hidden segments.
   const emptyHiddenSharp=hidden.IsNull();
   if(emptyHiddenSharp)hiddenSharpNullCompoundViews.push(view);
   const hiddenNative=emptyHiddenSharp?
    {segments:[],vertexRecords:[]}:traverse(hidden,'hidden-sharp');
   const hiddenSegments=hiddenNative.segments;
   nativeGraphInput[view]={
    visible:visibleNative.vertexRecords,
    hidden:hiddenNative.vertexRecords
   };
   if(segments.length<(b?4:3))
    throw new RangeError('real OCJS C1 silhouette incomplete for '+view+' count='+segments.length+' source='+geometry.id+' scope='+(b?'cuboid':'sewn-convex-shell'));
   rows[view]=segments;
   hiddenViews[view]=hiddenSegments;
  }
  // IsSame inspects genuine OCCT TShape/Location while all emscripten
  // TopoDS vertex objects are still alive. Persist no native handles.
  const nativeGeneratedVertexGraph=
   computeC1NativeHLRIsSameVertexGraph({perView:nativeGraphInput});
  if(nativeGeneratedVertexGraph.counts.genuineOCCTNativeHLRSharpEdges!==
     VIEWS.reduce((n,v)=>n+rows[v].length+hiddenViews[v].length,0)||
     nativeGeneratedVertexGraph.signedV5ActionCount!==0)
   throw new RangeError('actual OCCT HLR native generated vertex graph is incomplete');
  return Object.freeze({
   schema:'draftai-c1-ocjs-real-visible-brep/1',
   engine:'opencascade.js',revision,
   sourceGeometryId:geometry.id,unit:'mm',
   proofScope:b?'reviewed-axis-aligned-cuboid':
    'reviewed-closed-convex-polyhedral-shell',
   views:rows,hiddenSharpViews:hiddenViews,
   nativeGeneratedVertexGraph,
   hiddenHLROutputFromActualOCCT:true,
   hiddenSharpNullCompoundViews,
   hiddenSharpEdgesAreOnlyUnsignedCandidates:true,
   hiddenHLROriginalEdgeAttributionRecovered:false,
   hiddenLineStylesCertified:false,
   engineComputedVisibleGeometry:true,
   allEmittedVisibleHLRCurvesVerifiedStraightAndPlanar:true,
   actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified:false,
   originalBRepSourceEdges:sourceBRep.originalBRepSourceEdges,
   occtOriginalEdgeOccurrenceCount:sourceBRep.occtOriginalEdgeOccurrenceCount,
   completeSourceTopology3DEndpointCorrespondence:
    sourceBRep.completeSourceTopology3DEndpointCorrespondence,
   actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,
   actualOCCTCurveTypeIndependentlyVerified:
    sourceBRep.actualOCCTCurveTypeIndependentlyVerified,
   sourceCandidateOnly:true,
   lineStyleCertified:false,v5Authorized:false
  });
 }finally{
  for(const o of owned.reverse())o.delete();
 }
}
module.exports={computeC1OcjsVisibleSegments,cuboidBounds,
 liftOriginalProjectedSourceCandidates,matchOriginalBRepEdgeByXYZ,
 extractRealOcjsOriginalSourceBRepEdges,
 verifyOriginalOcctLinearCurveWitness,
 probeRealOcctHLREdgeDirectOriginalSourceIdentity};
