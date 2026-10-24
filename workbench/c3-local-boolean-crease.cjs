'use strict';
/**
 * Reusable C3 M5 LOCAL Boolean-crease retention theorem.
 *
 * For regular points on the shared boundary of two closed finite solids
 * A and B, their outward face gradients are linearly independent.
 * The inverse-function theorem gives local signed coordinates (F,G);
 * A∩B retains the negative/negative quadrant, A∪B retains the other
 * three. In both models, BOTH faces are active and their common edge
 * is locally retained. The retained face SECTORS differ. Source edge
 * geometry alone never determines the user's intended Boolean model.
 *
 * Global boundary completeness and drawing line styles are deliberately
 * separate; open edges only, no graph vertices, tangencies, projection
 * coincidences, or unseen third surfaces are certified here.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditC3Merged3DSourceGraph}=
 require('./c3-merged-3d-source-graph.cjs');
const {auditC3CapBoundaryIncidence}=
 require('./c3-cap-boundary-incidence.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
const finite=Number.isFinite;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,
 z:a.x*b.y-a.y*b.x});
const size=v=>Math.hypot(v.x,v.y,v.z);
const delta=(r,d)=>(r-Math.abs(d))*(r+Math.abs(d));
const equationResidual=(p,Z,Y)=>({
 zLateral:(p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2-Z.radius**2,
 yLateral:(p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2-Y.radius**2
});
function auditC3LocalBooleanCreases({input,revision,solidOperation=null}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current C3 source revision required');
 if(![null,'intersection','union'].includes(solidOperation))
  throw new TypeError('Boolean solid operation must be explicit intersection or union');
 const empty=(status,reason)=>freeze({
  schema:'draftai-c3-local-boolean-crease/1',revision,status,reason,
  solidOperation:solidOperation||'unselected',
  sourceEdgeCount:0,regularLocalCreaseCount:0,
  undeterminedSourceEdgeCount:0,edgeProofs:[],
  localBooleanRetainedFaceSidesVerified:false,
  globalRetainedBoundaryComplete:false,
  allSourceGraphVerticesCertified:false,
  fullVHWVisibilityVerified:false,
  officialLineStylesVerified:false,finalV5CurveAuthorized:false
 });
 if(solidOperation===null)
  return empty('requires-explicit-solid-operation',
   'The retained surface sectors depend on intersection vs union');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 const graph=auditC3Merged3DSourceGraph({input,revision});
 const cap=auditC3CapBoundaryIncidence({input,revision});
 if(m3.status!=='scoped-analytic-ready'||
    !['scoped-complete-3d-source-incidence',
      'undetermined-cap-lateral-continuation'].includes(graph.status)||
    graph.allLateralBranchesAndCapSegmentsCovered!==true||
    !['scoped-analytic-cap-junction-incidence',
      'undetermined-unmatched-lateral-cap-junction'].includes(cap.status))
  return empty('not-covered','finite M3/3D graph cap-source geometry unproved');
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder;
 const tol=1e-9*Math.max(1,Z.radius,Y.radius);
 const tolSquared=1e-9*Math.max(1,Z.radius**2,Y.radius**2);
 const branches=new Map(m3.branches.map(b=>[b.id,b]));
 const caps=new Map(cap.capSegments.map(s=>[s.id,s]));
 // In both boolean models the edge exists at transverse contact, but
 // different strict solid sectors determine which face patches survive.
 const sectors=solidOperation==='intersection'?{
  retainedInterior:'zCylinder:inside AND yCylinder:inside',
  activeZSurfaceSide:'yCylinder:inside',
  activeYSurfaceSide:'zCylinder:inside'
 }:{
  retainedInterior:'zCylinder:inside OR yCylinder:inside',
  activeZSurfaceSide:'yCylinder:outside',
  activeYSurfaceSide:'zCylinder:outside'
 };
 const edgeProofs=graph.edges.map(edge=>{
  const fail=reason=>({
   edgeId:edge.id,sourceId:edge.sourceId,kind:edge.kind,
   status:'undetermined',reason,
   regularTransverseThroughoutOpenEdge:false,
   localCompositeCreaseRetained:false,
   localFaceSectorsVerified:false,
   officialLineStyle:'undetermined',finalV5StrokeAuthorized:false
  });
  let normalWitness,globalOpenTransverse=false;
  if(edge.kind==='analytic-curve'){
   const b=branches.get(edge.sourceId);
   if(!b||!b.finiteDomainVerified||
      b.officialLineStyle!=='undetermined'||
      ![-1,1].includes(b.signY)||![-1,1].includes(b.signZ))
    return fail('missing signed M3 lateral/lateral source');
   const [lo,hi]=b.xRange;
   if(!(hi-lo>tol))return fail('collapsed lateral curve interval');
   // Radial square roots are strictly positive for EVERY open x when
   // endpoints are supported and neither radial source is constant zero.
   const bounds=[
    {r:Z.radius,c:Z.xCenter},
    {r:Y.radius,c:Y.xCenter}
   ];
   if(bounds.some(({r,c})=>
      Math.max(Math.abs(lo-c),Math.abs(hi-c))>r+tol))
    return fail('analytic branch exceeds radial support');
   // Source axial-cap clipping must remain STRICT on the open interval.
   // The radical extrema occur only at the circle's x-center. M3 can
   // merge two cap-adjacent x cells, so a cap tangent strictly INSIDE a
   // source branch is a genuine third-face event and must be rejected.
   function capInteriorClear({r,c,offset,sign,min,max}){
    const values=[lo,hi].map(x=>offset+sign*Math.sqrt(Math.max(0,
      delta(r,x-c))));
    if(c>lo+tol&&c<hi-tol){
     const extreme=offset+sign*r;
     if(extreme<=min+tol||extreme>=max-tol)
      return false; // interior cap touch / crossing / near tangency
     values.push(extreme);
    }
    return values.every(v=>v>=min-tol&&v<=max+tol);
   }
   if(!capInteriorClear({r:Z.radius,c:Z.xCenter,offset:Z.yCenter,
      sign:b.signY,min:Y.yMin,max:Y.yMax})||
      !capInteriorClear({r:Y.radius,c:Y.xCenter,offset:Y.zCenter,
       sign:b.signZ,min:Z.zMin,max:Z.zMax}))
    return fail('cap intersects the OPEN analytic branch or clipping is unstable');
   // At any strict interior x, (y-Yz)*(z-Zy) is nonzero, so
   // cross(grad F,grad G).x != 0. This is a WHOLE open interval proof.
   const mid=(lo+hi)/2;
   const y=Z.yCenter+b.signY*Math.sqrt(Math.max(0,delta(Z.radius,mid-Z.xCenter)));
   const z=Y.zCenter+b.signZ*Math.sqrt(Math.max(0,delta(Y.radius,mid-Y.xCenter)));
   const p={x:mid,y,z},res=equationResidual(p,Z,Y);
   if(Math.max(Math.abs(res.zLateral),Math.abs(res.yLateral))>tolSquared)
    return fail('independent midpoint implicit surface residual');
   const nZ={x:mid-Z.xCenter,y:y-Z.yCenter,z:0},
    nY={x:mid-Y.xCenter,y:0,z:z-Y.zCenter};
   if(size(cross(nZ,nY))<=tol*Math.max(1,size(nZ)*size(nY)))
    return fail('under-resolved source gradient rank');
   globalOpenTransverse=true;
   normalWitness={point3D:p,zFaceNormal:nZ,yFaceNormal:nY,
    crossGradient:cross(nZ,nY),
    analyticGlobalReason:'both signed radicals strictly nonzero throughout open x range'};
  }else if(edge.kind==='line'){
   const src=caps.get(edge.sourceId);
   if(!src||!src.finiteBoundaryContactVerified||
      !src.continuousSegmentCertifiedByDiskConvexity||
      !src.sourcePairImplicitAndAxialConstraintsVerified||
      src.officialLineStyle!=='undetermined')
    return fail('source cap pair has no continuous finite-disk proof');
   const a=src.from,b=src.to,p={x:(a.x+b.x)/2,
    y:(a.y+b.y)/2,z:(a.z+b.z)/2};
   const zFace=src.sourceFaces.find(f=>f.startsWith('zCylinder.')),
    yFace=src.sourceFaces.find(f=>f.startsWith('yCylinder.'));
   if(!zFace||!yFace)return fail('missing both analytic face IDs');
   const zNormal=zFace==='zCylinder.lateral'?
    {x:p.x-Z.xCenter,y:p.y-Z.yCenter,z:0}:
    zFace==='zCylinder.cap.zMin'?{x:0,y:0,z:-1}:
    zFace==='zCylinder.cap.zMax'?{x:0,y:0,z:1}:null;
   const yNormal=yFace==='yCylinder.lateral'?
    {x:p.x-Y.xCenter,y:0,z:p.z-Y.zCenter}:
    yFace==='yCylinder.cap.yMin'?{x:0,y:-1,z:0}:
    yFace==='yCylinder.cap.yMax'?{x:0,y:1,z:0}:null;
   if(!zNormal||!yNormal)return fail('unknown original cap-face identity');
   const rank=size(cross(zNormal,yNormal));
   // The independent cap-pair M3 roots have strict positive radial
   // discriminants; cap-cap normals are fixed perpendicular axes.
   // The cap line generator retains constant x and its source normals.
   if(!(rank>tol*Math.max(1,size(zNormal)*size(yNormal))))
    return fail('cap face pair is singular, near-tangent or coincident');
   if(src.pairKind==='z-cap-to-y-lateral'&&
      Math.abs(src.from.x-Y.xCenter)<=tol)
    return fail('Y lateral cap-plane tangent generator');
   if(src.pairKind==='y-cap-to-z-lateral'&&
      Math.abs(src.from.x-Z.xCenter)<=tol)
    return fail('Z lateral cap-plane tangent generator');
   if(!['z-cap-to-y-lateral','y-cap-to-z-lateral',
      'z-cap-to-y-cap'].includes(src.pairKind))
    return fail('unsupported face pair');
   globalOpenTransverse=true;
   normalWitness={point3D:p,zFaceNormal:zNormal,
    yFaceNormal:yNormal,crossGradient:cross(zNormal,yNormal),
    analyticGlobalReason:'source cap disk convexity and strict positive radial roots on open segment'};
  }else return fail('unknown 3D source graph edge');
  return {edgeId:edge.id,sourceId:edge.sourceId,kind:edge.kind,
   status:'regular-local-boolean-crease',
   sourceGraph3DVertexIds:[edge.fromVertexId,edge.toVertexId],
   regularTransverseThroughoutOpenEdge:globalOpenTransverse,
   localCompositeCreaseRetained:true,
   localFaceSectorsVerified:true,
   selectedSolidOperation:solidOperation,retainedFaceSectors:{...sectors},
   normalWitness,
   verticesAndGlobalBooleanFaceOwnershipVerified:false,
   allViewsContinuousVisibilityVerified:false,
   officialLineStyle:'undetermined',finalV5StrokeAuthorized:false};
 });
 const qualifying=edgeProofs.filter(p=>p.localCompositeCreaseRetained);
 const all=qualifying.length===graph.edges.length;
 return freeze({
  schema:'draftai-c3-local-boolean-crease/1',revision,solidOperation,
  status:all?'scoped-all-source-open-edges-locally-retained':
   'scoped-partial-local-crease-proof',
  sourceEdgeCount:graph.edges.length,regularLocalCreaseCount:qualifying.length,
  undeterminedSourceEdgeCount:graph.edges.length-qualifying.length,
  edgeProofs,
  originalM3BranchCount:m3.branchCount,
  originalFiniteCapFeatureCount:cap.capSegments.length,
  graph3DConnectivityVerifiedWithinSourceScope:true,
  selectedBooleanRetainedFaceSectors:{...sectors},
  localBooleanRetainedFaceSidesVerified:all,
  globalRetainedBoundaryComplete:false,
  allSourceGraphVerticesCertified:false,
  fullVHWVisibilityVerified:false,
  officialLineStylesVerified:false,finalV5CurveAuthorized:false
 });
}
module.exports={auditC3LocalBooleanCreases};
