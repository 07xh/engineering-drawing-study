'use strict';
/**
 * M3 integration: fail-closed, scoped section evidence recomputation. Never infers global
 * uniqueness, complete drawing/visibility, or input-image provenance.
 *
 * M2 never imports professional M3 solvers. This trusted M3 dispatcher
 * recomputes whitelisted sections; caller-provided result.verified is NOT proof.
 */
const {validateSolveResult}=require('../../../core/contracts/solve-result.js');
const {validateGeometry}=require('../../../core/contracts/geometry.js');
const {prismPlaneSection}=require('./rectangular-prism-plane.cjs');
const {pyramidPlaneSection}=require('./rectangular-pyramid-plane.cjs');
const {intersectCylinderSidePlane}=require('./axis-cylinder-plane.cjs');
const {planeSphereSurfaceSection}=require('./sphere-plane.cjs');
const M0=require('../../../core/numeric/euclidean-kernel.cjs');
const {auditPolygonPlaneResidual}=
 require('./independent-polygon-plane-audit.cjs');

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const known=new Set(['ready','none','clipped','undetermined','degenerate',
 'boundary-degenerate','two-generators','tangent-generator','tangent-point']);
const positive=new Set(['ready','two-generators','tangent-generator','tangent-point']);
const solverNames=Object.freeze({
 'rectangular-prism':'rectangular-prism-plane',
 'rectangular-pyramid':'rectangular-pyramid-plane',
 'cylinder-lateral':'axis-cylinder-plane',
 'sphere-surface':'sphere-plane'
});
const xyz=p=>record(p)&&['x','y','z'].every(k=>finite(p[k]));
function checkResult(result,solverId,scope){
 if(!record(result))throw new TypeError('section result required');
 if(typeof solverId!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(solverId))
  throw new TypeError('stable solverId required');
 if(typeof scope!=='string'||!/^[a-z][a-z0-9-]{0,119}$/.test(scope))
  throw new TypeError('bounded section proof scope required');
 if(!known.has(result.status))throw new TypeError('unknown legacy section status');
 if(result.globallyUnique===true)throw new TypeError('legacy section cannot assert global uniqueness');
 if(result.modelUnit!==undefined&&result.modelUnit!=='mm')
  throw new TypeError('section evidence cannot accept non-mm geometry');
 if(result.verified===true&&!positive.has(result.status))
  throw new TypeError('inconsistent verified section status');
}
function packet(result,solverId,scope,internallyVerified){
 checkResult(result,solverId,scope);
 if(internallyVerified&&
    (!positive.has(result.status)||result.verified!==true||
     result.modelUnit!=='mm'||!finite(result.maxResidualMm)||result.maxResidualMm<0))
  throw new TypeError('internal specialist solver lacks scoped positive proof');
 const diagnostics=['Specialist section status: '+result.status,
  internallyVerified
   ?'Geometry recomputed by a known specialist solver; this proves only its limited scope, not global uniqueness, input-image provenance or drawing visibility.'
   :'Caller-supplied section status is untrusted; recompute through solveVerifiedSectionEvidence before using geometry.'];
 if(typeof result.reason==='string'&&result.reason)
  diagnostics.push(result.reason.slice(0,400));
 const evidence={id:'section-evidence',scope,status:'undetermined',solutions:[],
  solutionCount:null,degrees:null,localDegrees:null,rank:null,
  globallyUnique:null,maxResidual:internallyVerified?result.maxResidualMm:null,
  proofLevel:'none',diagnostics,solverId};
 const checked=validateSolveResult(evidence);
 if(!checked.ok)throw new TypeError('invalid section evidence: '+checked.errors.join('; '));
 return Object.freeze({...evidence,diagnostics:Object.freeze(diagnostics),
  modelUnit:internallyVerified?'mm':null,legacyStatus:result.status,
  geometryVerifiedWithinLegacyScope:internallyVerified,
  geometryVerifiedWithinSpecialistScope:internallyVerified,
  sourceMethod:internallyVerified?'internal-specialist-recomputation':'untrusted-caller-result',
  sourceProblemConfirmed:false,visibilityVerified:false,
  proofOfGlobalUniqueness:false});
}
/**
 * Compatibility inspection only. A raw object from any caller (including one
 * with verified:true) cannot cross the proof boundary. Positive flags fail
 * closed, rather than being "laundered" through a SolveResult-like wrapper.
 */
function assertPolygonProof(result,plane,solid,kind){
 if(result.perimeterVerified!==true||result.proof?.polygonDegreeTwo!==true||
    !Array.isArray(result.vertices)||!Array.isArray(result.perimeter)||
    result.vertices.length<3||result.vertices.length>6||
    result.perimeter.length!==result.vertices.length)
  throw new TypeError('polygon section lacks verified source topology');
 const vertices=result.vertices;
 for(let i=0;i<vertices.length;i++){
  const vertex=vertices[i],edge=result.perimeter[i],next=vertices[(i+1)%vertices.length];
  if(typeof vertex.id!=='string'||!xyz(vertex.point)||
     !edge||edge.fromId!==vertex.id||edge.toId!==next.id||
     !xyz(edge.from)||!xyz(edge.to)||
     ['x','y','z'].some(k=>edge.from[k]!==vertex.point[k]||edge.to[k]!==next.point[k]))
   throw new TypeError('polygon section source-edge coordinates not connected');
 }
 const extent=kind==='rectangular-prism'
  ?Math.max(...['x','y','z'].map(k=>solid.max[k]-solid.min[k]))
  :Math.max(solid.base.maxX-solid.base.minX,
   solid.base.maxY-solid.base.minY,solid.apex.z-solid.base.z);
 const audit=auditPolygonPlaneResidual(vertices,plane,{
  modelExtentMm:extent,claimedMaxResidualMm:result.maxResidualMm
 });
 if(!audit.ok)
  throw new TypeError('polygon section independently fails original plane residual');
}
function assertCylinderProof(result){
 if(result.status==='ready'){
  if(result.analyticCurveVerified!==true||result.closedCurve!==true||
     result.completeLateralIntersection!==true||
     !Array.isArray(result.points)||result.points.length<17||
     result.points.some(p=>!xyz(p)))
   throw new TypeError('analytic cylinder lateral curve lacks scope proof');
 }else {
  const expected=result.status==='two-generators'?2:1;
  if(result.completeLateralIntersection!==true||
     !Array.isArray(result.generators)||result.generators.length!==expected||
     result.generators.some(g=>!xyz(g.a)||!xyz(g.b)||
      !finite(g.residualMm)||g.residualMm<0))
   throw new TypeError('cylinder generators lack scoped proof');
 }
}
/**
 * Independently audit the 04 sphere specialist's bounded analytic geometry.
 * All operations reuse the shared M0 numerical kernel. The result still
 * cannot become a globally-unique SolveResult or a verified V5 plan.
 */
function assertSphereProof(result,sphere,plane){
 const isCircle=result.status==='ready';
 const isTangent=result.status==='tangent-point';
 if(!isCircle&&!isTangent||
    result.sourceSphereVerified!==true||result.sourcePlaneVerified!==true||
    result.globallyUnique!==null||result.modelUnit!=='mm')
  throw new TypeError('sphere surface result lacks scoped source proof');
 const center=sphere.center,radius=sphere.radiusMm;
 const points=result.points;
 if(!record(center)||!xyz(center)||!record(plane.point)||!xyz(plane.point)||
    !record(plane.normal)||!xyz(plane.normal)||
    !finite(radius)||radius<=0||!Array.isArray(points)||
    points.length<(isCircle?17:1)||points.length>(isCircle?129:1)||
    points.some(p=>!xyz(p)))
  throw new TypeError('sphere source or checked points are invalid');
 if(isCircle){
  if(result.geometryKind!=='sphere-surface-plane-circle'||
     !record(result.curve)||result.curve.kind!=='analytic-circle-3d'||
     result.curve.analyticCurveVerified!==true||result.curve.closed!==true||
     result.curve.sampledPolylineOnly!==true||
     !xyz(result.curve.center)||!xyz(result.curve.axisU)||!xyz(result.curve.axisV)||
     !xyz(result.curve.normal)||!finite(result.curve.radiusMm)||result.curve.radiusMm<=0)
   throw new TypeError('sphere circle lacks analytic section invariants');
 }else if(result.geometryKind!=='sphere-surface-plane-tangency'||
          !xyz(result.point)||result.curve!==null)
  throw new TypeError('sphere tangent is not one verified source point');
 const scale=Math.max(1,radius,
  ...['x','y','z'].map(k=>Math.abs(center[k])),
  ...['x','y','z'].map(k=>Math.abs(plane.point[k])));
 const tol=Math.max(1e-8*Math.max(1,radius),64*Number.EPSILON*scale)*4;
 const centerVector=[center.x,center.y,center.z];
 const planeVector=[plane.point.x,plane.point.y,plane.point.z];
 const normalVector=[plane.normal.x,plane.normal.y,plane.normal.z];
 const normal=M0.normalize(normalVector);
 const signed=M0.dot(M0.subtract(centerVector,planeVector),normal);
 const foot=centerVector.map((c,k)=>c-signed*normal[k]);
 if(isCircle){
  if(Math.abs(M0.norm(M0.subtract(
   [result.curve.center.x,result.curve.center.y,result.curve.center.z],foot)))>tol)
   throw new TypeError('sphere section center fails independent plane projection');
  const expectedRadius=Math.sqrt(Math.max(0,(radius-Math.abs(signed))*(radius+Math.abs(signed))));
  if(!finite(expectedRadius)||Math.abs(result.curve.radiusMm-expectedRadius)>tol)
   throw new TypeError('sphere circle radius fails independent intersection identity');
 }else {
  if(M0.norm(M0.subtract([result.point.x,result.point.y,result.point.z],foot))>tol)
   throw new TypeError('sphere tangent point differs from plane foot');
 }
 for(const p of points){
  const v=[p.x,p.y,p.z];
  const radiusResidual=Math.abs(M0.norm(M0.subtract(v,centerVector))-radius);
  const planeResidual=Math.abs(M0.dot(M0.subtract(v,planeVector),normal));
  if(!finite(radiusResidual)||!finite(planeResidual)||
     Math.max(radiusResidual,planeResidual)>tol)
   throw new TypeError('sphere point fails independent source-surface residual');
 }
}
/**
 * Expose ONLY the already audited straight-edged section boundary as shared
 * Geometry. This does not certify any face interior, hidden line, global
 * uniqueness or V5. No second intersection calculation or SVG-specific shape.
 */
function verifiedPolygonPerimeterGeometry(result){
 const points=result.vertices.map(({point})=>Object.freeze({
  x:point.x,y:point.y,z:point.z
 }));
 const geometry={id:'Section1',kind:'polyline',space:'model-3d',unit:'mm',
  data:{points,closed:true}};
 const checked=validateGeometry(geometry);
 if(!checked.ok)
  throw new TypeError('specialist polygon cannot enter shared Geometry Scene: '+
   checked.errors.join('; '));
 return Object.freeze({...geometry,data:Object.freeze({
  points:Object.freeze(points),closed:true
 })});
}
/**
 * Recomputes a section internally from explicit model-millimetre input.
 * No caller-provided result or forged solver callback is accepted. Source
 * photo / ProblemDraft confirmation still belongs to the upstream gate.
 */
function solveVerifiedSectionEvidence(input){
 if(!record(input))throw new TypeError('section problem required');
 const allowed=['kind','solid','plane','frame','unit','samples'];
 if(Object.keys(input).some(k=>!allowed.includes(k)))
  throw new TypeError('unrecognized or forged section-proof input');
 const {kind,solid,plane,frame,unit,samples}=input;
 if(!Object.hasOwn(solverNames,kind))throw new TypeError('unsupported specialist section kind');
 if(frame!=='model-mm-3d'||unit!=='mm')
  throw new TypeError('explicit model-mm-3d/mm input required');
 if(!record(solid)||!record(plane))
  throw new TypeError('solid and plane are required');
 if(samples!==undefined&&!['cylinder-lateral','sphere-surface'].includes(kind))
  throw new TypeError('samples only apply to analytic curve solvers');
 const options=samples===undefined?{}:{samples};
 const result=kind==='rectangular-prism'?prismPlaneSection(solid,plane):
  kind==='rectangular-pyramid'?pyramidPlaneSection(solid,plane):
  kind==='cylinder-lateral'?intersectCylinderSidePlane(solid,plane,options):
   planeSphereSurfaceSection(solid,plane,options);
 const scope=kind==='cylinder-lateral'? 'finite-cylinder-lateral-plane-intersection':
  kind==='sphere-surface'?'sphere-surface-plane-intersection':
  'finite-solid-plane-section-perimeter';
 const solverId=solverNames[kind];
 checkResult(result,solverId,scope);
 if(!positive.has(result.status)||result.verified!==true)
  return packet(result,solverId,scope,false);
 if(kind==='cylinder-lateral')assertCylinderProof(result);
 else if(kind==='sphere-surface')assertSphereProof(result,solid,plane);
 else assertPolygonProof(result,plane,solid,kind);
 const evidence=packet(result,solverId,scope,true);
 if(kind==='rectangular-prism'||kind==='rectangular-pyramid')
  return Object.freeze({...evidence,
   sectionPerimeterGeometry:verifiedPolygonPerimeterGeometry(result)});
 return evidence;
}
module.exports={solveVerifiedSectionEvidence};
