'use strict';
/**
 * Pure M2: fail-closed inspection of UNTRUSTED section evidence. Never infers global
 * uniqueness, complete drawing/visibility, or input-image provenance.
 *
 * Trusted specialist recomputation now belongs to the M3 orchestrator at
 * engines/spatial/sections/verified-section-evidence.cjs.
 * Arbitrary caller-provided result.verified is NEVER proof.
 */
const {validateSolveResult}=require('../contracts/solve-result.js');

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const known=new Set(['ready','none','clipped','undetermined','degenerate',
 'boundary-degenerate','two-generators','tangent-generator','tangent-point']);
const positive=new Set(['ready','two-generators','tangent-generator','tangent-point']);
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
function packet(result,solverId,scope){
 const internallyVerified=false;
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
function sectionEvidence({result,solverId,scope='finite-plane-section'}={}){
 checkResult(result,solverId,scope);
 if(result.verified===true)
  throw new TypeError('untrusted verified flag: use solveVerifiedSectionEvidence');
 return packet(result,solverId,scope);
}
module.exports={sectionEvidence};
