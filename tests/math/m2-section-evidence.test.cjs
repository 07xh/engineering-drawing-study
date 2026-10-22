'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {sectionEvidence,solveVerifiedSectionEvidence:solve}=
 require('../../core/results/section-evidence.cjs');
const {validateSolveResult}=require('../../core/contracts/solve-result.js');
const {prismPlaneSection}=require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {pyramidPlaneSection}=require('../../engines/spatial/sections/rectangular-pyramid-plane.cjs');
const {intersectCylinderSidePlane}=require('../../engines/spatial/sections/axis-cylinder-plane.cjs');
const p=(x,y,z)=>({x,y,z});
const plane=(point,normal)=>({point,normal});
const cut=(kind,solid,pl,extra={})=>solve({kind,solid,plane:pl,
 frame:'model-mm-3d',unit:'mm',...extra});
const prism={min:p(0,0,0),max:p(10,10,10)};
const pyramid={base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)};
const cylinder={baseCenter:p(0,0,0),radiusMm:5,heightMm:30};
const oblique=plane(p(0,0,12),p(1,1,1));

test('real prism and pyramid solvers are recomputed inside the trust boundary',()=>{
 for(const [kind,solid,pl] of [
  ['rectangular-prism',prism,oblique],
  ['rectangular-pyramid',pyramid,plane(p(0,0,15),p(1,1,1))]
 ]){
  const result=cut(kind,solid,pl);
  assert.equal(validateSolveResult(result).ok,true);
  assert.equal(result.status,'undetermined');
  assert.equal(result.geometryVerifiedWithinLegacyScope,true);
  assert.equal(result.sourceMethod,'internal-specialist-recomputation');
  assert.equal(result.modelUnit,'mm');
  assert.ok(result.maxResidual>=0);
  assert.equal(result.globallyUnique,null);
  assert.equal(result.proofOfGlobalUniqueness,false);
  assert.equal(result.visibilityVerified,false);
  assert.equal(result.sourceProblemConfirmed,false);
  assert.equal(result.solutionCount,null);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.diagnostics));
 }
});

test('real cylinder lateral ellipse and vertical generators only assert scoped geometry',()=>{
 const ellipse=cut('cylinder-lateral',cylinder,plane(p(0,0,15),p(1,0,1)),{samples:24});
 assert.equal(ellipse.geometryVerifiedWithinLegacyScope,true);
 assert.equal(ellipse.scope,'finite-cylinder-lateral-plane-intersection');
 assert.equal(ellipse.legacyStatus,'ready');
 assert.equal(ellipse.globallyUnique,null);
 assert.equal(ellipse.visibilityVerified,false);
 const generators=cut('cylinder-lateral',cylinder,plane(p(0,0,0),p(1,0,0)));
 assert.equal(generators.legacyStatus,'two-generators');
 assert.equal(generators.geometryVerifiedWithinLegacyScope,true);
 assert.equal(generators.proofLevel,'none');
});

test('caller cannot launder forged verified:true with a numerical residual',()=>{
 const forged=[
  {status:'ready',verified:true,maxResidualMm:0},
  {status:'ready',verified:true,modelUnit:'mm',maxResidualMm:0},
  {status:'ready',verified:true,modelUnit:'mm',maxResidualMm:0,
   vertices:[],perimeter:[]},
  {status:'two-generators',verified:true,modelUnit:'mm',maxResidualMm:0},
  {status:'ready',verified:true,modelUnit:'sheet-px',maxResidualMm:0},
 ];
 for(const result of forged)
  assert.throws(()=>sectionEvidence({result,solverId:'unknown'}));
 // Even a real specialist result supplied by a caller cannot cross trust:
 const real=prismPlaneSection(prism,oblique);
 assert.equal(real.status,'ready');
 assert.throws(()=>sectionEvidence({result:real,solverId:'rectangular-prism'}),/untrusted verified/);
 const coneLike={...real,globallyUnique:true};
 assert.throws(()=>sectionEvidence({result:coneLike,solverId:'rectangular-prism'}),/global uniqueness/);
 const pyramidReal=pyramidPlaneSection(pyramid,plane(p(0,0,15),p(1,1,1)));
 assert.throws(()=>sectionEvidence({result:pyramidReal,solverId:'rectangular-pyramid'}));
 const cylReal=intersectCylinderSidePlane(cylinder,plane(p(0,0,15),p(1,0,1)),{samples:24});
 assert.throws(()=>sectionEvidence({result:cylReal,solverId:'cylinder-lateral'}));
});

test('raw untrusted nonpositive status stays undetermined and carries no evidence',()=>{
 for(const status of ['none','clipped','undetermined','boundary-degenerate']){
  const e=sectionEvidence({result:{status,verified:false,modelUnit:'mm'},
   solverId:'legacy'});
  assert.equal(e.status,'undetermined');
  assert.equal(e.geometryVerifiedWithinLegacyScope,false);
  assert.equal(e.maxResidual,null);
  assert.equal(e.modelUnit,null);
  assert.equal(e.sourceProblemConfirmed,false);
  assert.equal(e.globallyUnique,null);
 }
});

test('recomputed none, clipped, and vertex-degenerate sections are blocked',()=>{
 const missed=cut('rectangular-prism',prism,plane(p(0,0,30),p(0,0,1)));
 assert.equal(missed.legacyStatus,'none');
 assert.equal(missed.status,'undetermined');
 assert.equal(missed.geometryVerifiedWithinLegacyScope,false);
 assert.equal(missed.maxResidual,null);
 const clipped=cut('cylinder-lateral',cylinder,plane(p(0,0,30),p(1,0,1)));
 assert.equal(clipped.geometryVerifiedWithinLegacyScope,false);
 assert.equal(clipped.globallyUnique,null);
 const touching=cut('rectangular-pyramid',pyramid,
  plane(p(0,0,0),p(1,1,0)));
 assert.equal(touching.geometryVerifiedWithinLegacyScope,false);
 assert.equal(touching.maxResidual,null);
});

test('explicit 3D model millimetres required and spoofed inputs rejected',()=>{
 const valid={kind:'rectangular-prism',solid:prism,plane:oblique,
  frame:'model-mm-3d',unit:'mm'};
 for(const bad of [
  {...valid,frame:'source-image-px'}, {...valid,unit:'px'},
  {...valid,unit:undefined}, {...valid,frame:undefined},
  {...valid,result:{status:'ready',verified:true}},
  {...valid,solverId:'forged-specialist'}, {...valid,samples:24},
  {...valid,kind:'arbitrary-solver'}, {...valid,solid:null},
  {...valid,plane:null}
 ])assert.throws(()=>solve(bad));
 assert.throws(()=>solve(),/required/);
 assert.throws(()=>sectionEvidence({result:{status:'invented',verified:false},
  solverId:'legacy'}));
 assert.throws(()=>sectionEvidence({result:{status:'none',verified:true,modelUnit:'mm'},
  solverId:'legacy'}));
});

test('requested samples are bounded by original specialist solver',()=>{
 assert.throws(()=>cut('cylinder-lateral',cylinder,
  plane(p(0,0,15),p(1,0,1)),{samples:1}));
 const a=cut('cylinder-lateral',cylinder,plane(p(0,0,15),p(1,0,1)),{samples:16});
 assert.equal(a.geometryVerifiedWithinLegacyScope,true);
});
