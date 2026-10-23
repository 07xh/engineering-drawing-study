'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {sectionEvidence}=require('../../core/results/section-evidence.cjs');
const {solveVerifiedSectionEvidence:solve}=
 require('../../engines/spatial/sections/verified-section-evidence.cjs');
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


test('real 04 sphere-plane analytic circle enters the SINGLE conservative M2 evidence envelope',()=>{
 const sphere={center:p(0,0,0),radiusMm:5,modelUnit:'mm'};
 const pl={...plane(p(0,0,3),p(0,0,2)),modelUnit:'mm'};
 const e=cut('sphere-surface',sphere,pl,{samples:32});
 assert.equal(validateSolveResult(e).ok,true);
 assert.equal(e.status,'undetermined');
 assert.equal(e.scope,'sphere-surface-plane-intersection');
 assert.equal(e.solverId,'sphere-plane');
 assert.equal(e.sourceMethod,'internal-specialist-recomputation');
 assert.equal(e.legacyStatus,'ready');
 assert.equal(e.geometryVerifiedWithinSpecialistScope,true);
 assert.equal(e.geometryVerifiedWithinLegacyScope,true);
 assert.equal(e.sourceProblemConfirmed,false);
 assert.equal(e.modelUnit,'mm');
 assert.equal(e.globallyUnique,null);
 assert.equal(e.solutionCount,null);
 assert.equal(e.proofLevel,'none');
 assert.equal(e.proofOfGlobalUniqueness,false);
 assert.equal(e.visibilityVerified,false);
 assert.ok(e.maxResidual>=0);
 assert.ok(Object.isFrozen(e));
});

test('real sphere tangency is scoped geometry only, never proof of global uniqueness',()=>{
 const sphere={center:p(0,0,0),radiusMm:5,modelUnit:'mm'};
 const pl={...plane(p(0,0,5),p(0,0,1)),modelUnit:'mm'};
 const e=cut('sphere-surface',sphere,pl);
 assert.equal(validateSolveResult(e).ok,true);
 assert.equal(e.legacyStatus,'tangent-point');
 assert.equal(e.geometryVerifiedWithinSpecialistScope,true);
 assert.equal(e.maxResidual,0);
 assert.equal(e.status,'undetermined');
 assert.equal(e.globallyUnique,null);
 assert.equal(e.proofLevel,'none');
});

test('sphere nonintersection, near tangent and underresolved world scale do not grant proof',()=>{
 const sphere={center:p(0,0,0),radiusMm:5,modelUnit:'mm'};
 for(const z of [8,5+1e-9]){
  const e=cut('sphere-surface',sphere,{...plane(p(0,0,z),p(0,0,1)),modelUnit:'mm'});
  assert.equal(e.geometryVerifiedWithinSpecialistScope,false);
  assert.equal(e.maxResidual,null);
  assert.equal(e.status,'undetermined');
  assert.equal(e.globallyUnique,null);
 }
 const tiny={center:p(1e7,0,0),radiusMm:1e-6,modelUnit:'mm'};
 const pl={...plane(p(1e7,0,0),p(0,0,1)),modelUnit:'mm'};
 const blocked=cut('sphere-surface',tiny,pl);
 assert.equal(blocked.geometryVerifiedWithinSpecialistScope,false);
 assert.equal(blocked.sourceProblemConfirmed,false);
});

test('sphere data origin cannot be laundered through forged positive caller result',()=>{
 for(const result of [
  {status:'ready',verified:true,modelUnit:'mm',maxResidualMm:0},
  {status:'tangent-point',verified:true,modelUnit:'mm',maxResidualMm:0},
  {status:'ready',verified:true,modelUnit:'mm',maxResidualMm:0,
   curve:{analyticCurveVerified:true}},
 ])assert.throws(()=>sectionEvidence({result,solverId:'sphere-plane'}),/untrusted verified/);
 const solid={center:p(0,0,0),radiusMm:5,modelUnit:'mm'};
 const pl={...plane(p(0,0,2),p(0,0,1)),modelUnit:'mm'};
 const good={kind:'sphere-surface',solid,plane:pl,frame:'model-mm-3d',unit:'mm'};
 for(const invalid of [
  {...good,unit:'image-px'}, {...good,frame:'sheet-px'},
  {...good,result:{status:'ready',verified:true,maxResidualMm:0}},
  {...good,solverId:'untrusted-sphere'}, {...good,solid:{...solid,modelUnit:undefined}},
  {...good,plane:{...pl,modelUnit:'px'}},
  {...good,kind:'sphere-volume'}, {...good,samples:1}
 ])assert.throws(()=>solve(invalid));
});
