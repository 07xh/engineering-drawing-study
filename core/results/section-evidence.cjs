'use strict';
/**
 * V3.8 M2: fail-closed, scoped section evidence. Never infers global
 * uniqueness, complete drawing/visibility, or input-image provenance.
 *
 * Trust boundary: ONLY solveVerifiedSectionEvidence invokes a known specialist
 * solver internally. Arbitrary caller-provided result.verified is NOT proof.
 */
const {validateSolveResult}=require('../contracts/solve-result.js');
const {prismPlaneSection}=require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {pyramidPlaneSection}=require('../../engines/spatial/sections/rectangular-pyramid-plane.cjs');
const {intersectCylinderSidePlane}=require('../../engines/spatial/sections/axis-cylinder-plane.cjs');

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const known=new Set(['ready','none','clipped','undetermined','degenerate',
 'boundary-degenerate','two-generators','tangent-generator']);
const positive=new Set(['ready','two-generators','tangent-generator']);
const solverNames=Object.freeze({
 'rectangular-prism':'rectangular-prism-plane',
 'rectangular-pyramid':'rectangular-pyramid-plane',
 'cylinder-lateral':'axis-cylinder-plane'
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
  sourceMethod:internallyVerified?'internal-specialist-recomputation':'untrusted-caller-result',
  sourceProblemConfirmed:false,visibilityVerified:false,
  proofOfGlobalUniqueness:false});
}
/**
 * Compatibility inspection only. A raw object from any caller (including one
 * with verified:true) cannot cross the proof boundary. Positive flags fail
 * closed, rather than being "laundered" through a SolveResult-like wrapper.
 */
function sectionEvidence({result,solverId,scope='finite-plane-section'}={}){
 checkResult(result,solverId,scope);
 if(result.verified===true)
  throw new TypeError('untrusted verified flag: use solveVerifiedSectionEvidence');
 return packet(result,solverId,scope,false);
}
function assertPolygonProof(result){
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
 if(samples!==undefined&&kind!=='cylinder-lateral')
  throw new TypeError('samples only apply to cylinder lateral solver');
 const result=kind==='rectangular-prism'?prismPlaneSection(solid,plane):
  kind==='rectangular-pyramid'?pyramidPlaneSection(solid,plane):
   intersectCylinderSidePlane(solid,plane,samples===undefined?{}:{samples});
 const scope=kind==='cylinder-lateral'?
  'finite-cylinder-lateral-plane-intersection':'finite-solid-plane-section-perimeter';
 const solverId=solverNames[kind];
 checkResult(result,solverId,scope);
 if(!positive.has(result.status)||result.verified!==true)
  return packet(result,solverId,scope,false);
 if(kind==='cylinder-lateral')assertCylinderProof(result);
 else assertPolygonProof(result);
 return packet(result,solverId,scope,true);
}
module.exports={sectionEvidence,solveVerifiedSectionEvidence};
