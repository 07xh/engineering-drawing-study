'use strict';
/**
 * M2 conservative compatibility boundary for existing finite section solvers.
 * This does not solve geometry, infer global uniqueness, or certify visibility.
 * It never mutates existing 04 result or silently treats 'ready' as 'unique'.
 */
const {validateSolveResult}=require('../contracts/solve-result.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const known=new Set(['ready','none','clipped','undetermined','degenerate','boundary-degenerate','two-generators','tangent-generator']);
function sectionEvidence({result,solverId,scope='finite-plane-section'}={}){
 if(!result||typeof result!=='object'||Array.isArray(result))
  throw new TypeError('section result required');
 if(typeof solverId!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(solverId))
  throw new TypeError('stable solverId required');
 if(scope!=='finite-plane-section')throw new TypeError('unsupported section evidence scope');
 if(!known.has(result.status))throw new TypeError('unknown legacy section status');
 if(result.globallyUnique===true)throw new TypeError('legacy section cannot assert global uniqueness');
 if(result.modelUnit!==undefined&&result.modelUnit!=='mm')
  throw new TypeError('section evidence requires model millimetres');
 const verified=result.verified===true;
 const canUseGeometry=verified&&['ready','two-generators','tangent-generator'].includes(result.status);
 if(verified&&!canUseGeometry)throw new TypeError('inconsistent verified legacy section status');
 if(canUseGeometry&&(!finite(result.maxResidualMm)||result.maxResidualMm<0))
  throw new TypeError('verified section must provide finite nonnegative residual in mm');
 const diagnostics=[
  'Legacy section status: '+result.status,
  canUseGeometry?'Scoped section geometry verified by legacy solver; uniqueness, visibility and completeness are not established by this adapter.':
   'No transferable positive section-geometry proof; legacy result must remain blocked or independently reviewed.'
 ];
 if(typeof result.reason==='string'&&result.reason)diagnostics.push(result.reason.slice(0,400));
 const evidence={id:'section-evidence',scope,status:'undetermined',solutions:[],solutionCount:null,
  degrees:null,localDegrees:null,rank:null,globallyUnique:null,maxResidual:canUseGeometry?result.maxResidualMm:null,
  proofLevel:'none',diagnostics,solverId};
 const check=validateSolveResult(evidence);
 if(!check.ok)throw new TypeError('invalid section evidence: '+check.errors.join('; '));
 return Object.freeze({...evidence,diagnostics:Object.freeze([...diagnostics]),
  legacyStatus:result.status,modelUnit:'mm',geometryVerifiedWithinLegacyScope:canUseGeometry,
  visibilityVerified:false,proofOfGlobalUniqueness:false});
}
module.exports={sectionEvidence};
