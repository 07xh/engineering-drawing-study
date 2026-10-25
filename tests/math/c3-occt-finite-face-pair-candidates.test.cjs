'use strict';
/**
 * Genuine offline OCCT B-Rep section edge candidates, independently compared
 * with the EXISTING analytic M3 lateral and finite cap-face-pair solvers.
 * No CAD candidate is ever copied into SolveResult, M5 line style, or V5.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fixture=require('../fixtures/c3-occt-finite-face-candidates.json');
const {evaluateFiniteOrthogonalCylinderIntersection:solveLateral}=
 require('../../engines/spatial/intersections/finite-orthogonal-cylinders.cjs');
const {evaluateFiniteCylinderCapBoundaryPairs:solveCaps}=
 require('../../engines/spatial/intersections/finite-cylinder-cap-boundary-pairs.cjs');
const {project}=require('../../core/projection/conventions.js');
const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);
const point=p=>({x:p[0],y:p[1],z:p[2]});
const faceName=(axis,kind)=>{
 if(kind==='lateral')return axis+'Cylinder.lateral';
 if(kind==='cap-min')return axis+'Cylinder.cap.'+(axis==='z'?'zMin':'yMin');
 if(kind==='cap-max')return axis+'Cylinder.cap.'+(axis==='z'?'zMax':'yMax');
 throw new RangeError('unrecognized original CAD face identity');
};
function classify(p,cylinder,axis){
 if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite))
  throw new RangeError('invalid original CAD XYZ');
 const [x,y,z]=p;
 const radial=axis==='z'?
  (x-cylinder.xCenter)**2+(y-cylinder.yCenter)**2:
  (x-cylinder.xCenter)**2+(z-cylinder.zCenter)**2;
 const axial=axis==='z'?z:y;
 const min=axis==='z'?cylinder.zMin:cylinder.yMin;
 const max=axis==='z'?cylinder.zMax:cylinder.yMax;
 const r2=cylinder.radius**2;
 if(axial<min-1e-6||axial>max+1e-6||radial>r2+.01)
  throw new RangeError('CAD point outside finite original solid');
 const faces=[];
 if(Math.abs(radial-r2)<=.01)faces.push('lateral');
 if(Math.abs(axial-min)<=1e-6)faces.push('cap-min');
 if(Math.abs(axial-max)<=1e-6)faces.push('cap-max');
 if(!faces.length)throw new RangeError('CAD point has no original source face');
 return faces;
}
function verifyCandidate(c,edge,cap){
 const Z=c.input.zCylinder,Y=c.input.yCylinder;
 if(!Number.isSafeInteger(edge.edgeIndex)||edge.edgeIndex<0)
  throw new RangeError('invalid OCCT source edge index');
 if(!['GeomAbs_Line','GeomAbs_BSplineCurve'].includes(edge.curveType))
  throw new RangeError('unsupported finite OCCT section primitive');
 const witnesses=[...edge.endpoints,edge.interiorWitness];
 if(edge.endpoints.length!==2||witnesses.length!==3)
  throw new RangeError('missing real CAD B-Rep witnesses');
 for(const p of witnesses){
  classify(p,Z,'z');classify(p,Y,'y');
  for(const v of Object.values(project(point(p))))
   if(!Number.isFinite(v.u)||!Number.isFinite(v.v))
    throw new RangeError('original CAD geometry cannot project to first angle');
 }
 for(const [axis,cyl] of [['z',Z],['y',Y]]){
  const owners=classify(edge.interiorWitness,cyl,axis);
  if(owners.length!==1||edge.sourceFaces[axis]!==owners[0])
   throw new RangeError('CAD claimed source face is forged or ambiguous');
 }
 const zTag=faceName('z',edge.sourceFaces.z);
 const yTag=faceName('y',edge.sourceFaces.y);
 if(zTag==='zCylinder.lateral'&&yTag==='yCylinder.lateral')
  return 'lateral-lateral-candidate';
 if(edge.curveType!=='GeomAbs_Line')
  throw new RangeError('cap source face-pair should be a straight source interval');
 const matches=cap.segments.filter(s=>s.sourceFaces.includes(zTag)&&s.sourceFaces.includes(yTag)&&
  ((dist(edge.endpoints[0],[s.from.x,s.from.y,s.from.z])<.003&&
    dist(edge.endpoints[1],[s.to.x,s.to.y,s.to.z])<.003)||
   (dist(edge.endpoints[1],[s.from.x,s.from.y,s.from.z])<.003&&
    dist(edge.endpoints[0],[s.to.x,s.to.y,s.to.z])<.003)));
 if(matches.length!==1)
  throw new RangeError('CAD cap edge has no unique independently proven analytic face-pair interval');
 const analytic=matches[0],mid=[
  (analytic.from.x+analytic.to.x)/2,
  (analytic.from.y+analytic.to.y)/2,
  (analytic.from.z+analytic.to.z)/2
 ];
 if(dist(mid,edge.interiorWitness)>=.003)
  throw new RangeError('CAD cap-edge interior is inconsistent with analytic full segment');
 assert.equal(analytic.continuousSegmentCertifiedByDiskConvexity,true);
 assert.equal(analytic.sourcePairImplicitAndAxialConstraintsVerified,true);
 assert.equal(analytic.officialLineStyle,'undetermined');
 assert.equal(analytic.v5OfficialCurveAuthorized,false);
 return analytic.pairKind;
}

test('real OCCT section edges independently cover M3 lateral and all three positive-cap face-pair candidates',()=>{
 assert.equal(fixture.schema,'draftai-c3-occt-finite-face-candidates/1');
 assert.match(fixture.cadKernel,/7\.9\.3\.1\.1/);
 assert.equal(fixture.unit,'mm');
 assert.equal(fixture.proof,'candidate-only');
 assert.equal(fixture.cases.length,2);
 for(const c of fixture.cases){
  const lateral=solveLateral({input:c.input,revision:19});
  const caps=solveCaps({input:c.input,revision:19});
  assert.equal(lateral.status,'scoped-analytic-ready');
  assert.equal(caps.status,'scoped-analytic-cap-boundary-pairs');
  assert.equal(c.sectionEdgeCount,c.candidates.length);
  const ids=new Set(),types=[];
  for(const edge of c.candidates){
   assert.ok(!ids.has(edge.edgeIndex),'duplicate original B-Rep section edge');
   ids.add(edge.edgeIndex);
   types.push(verifyCandidate(c,edge,caps));
  }
  assert.deepEqual([...ids].sort((a,b)=>a-b),
   Array.from({length:c.sectionEdgeCount},(_,i)=>i));
  const capKinds=types.filter(v=>v!=='lateral-lateral-candidate').sort();
  if(c.id==='unequal-offset-positive-caps'){
   assert.equal(lateral.branchCount,1);
   assert.deepEqual(capKinds,[
    'z-cap-to-y-cap','z-cap-to-y-lateral','z-cap-to-y-lateral']);
   assert.equal(caps.segments.length,3);
  }else{
   assert.equal(c.id,'unequal-offset-full');
   assert.equal(lateral.branchCount,4);
   assert.deepEqual(capKinds,[]);
   assert.equal(caps.segments.length,0);
  }
  // A true section candidate and even an analytic cap segment do not
  // certify the retained Boolean contour, hiding or official line styles.
  assert.equal(caps.fullSolidBoundaryTopologyVerified,false);
  assert.equal(caps.officialLineStylesVerified,false);
  assert.equal(caps.finalCurveV5Authorized,false);
  assert.equal(lateral.officialLineStylesVerified,false);
  assert.equal(lateral.v5Ready,false);
  assert.deepEqual(lateral.constructionIntents,[]);
 }
});

test('forged cap source, moved B-Rep endpoint, altered branch and nonfinite CAD evidence are rejected',()=>{
 const c=fixture.cases[1],caps=solveCaps({input:c.input,revision:19});
 const edge=c.candidates.find(x=>x.sourceFaces.z==='cap-min'&&x.sourceFaces.y==='lateral');
 assert.equal(verifyCandidate(c,edge,caps),'z-cap-to-y-lateral');
 const copy=()=>structuredClone(edge);
 const wrongFace=copy();wrongFace.sourceFaces.z='cap-max';
 assert.throws(()=>verifyCandidate(c,wrongFace,caps),/forged or ambiguous/);
 const forgedPoint=copy();forgedPoint.endpoints[1][1]+=.25;
 assert.throws(()=>verifyCandidate(c,forgedPoint,caps),/no unique independently proven analytic/);
 const forgedWitness=copy();forgedWitness.interiorWitness[0]+=.5;
 assert.throws(()=>verifyCandidate(c,forgedWitness,caps),/outside finite original solid|no original source face|inconsistent/);
 const nan=copy();nan.endpoints[0][2]=NaN;
 assert.throws(()=>verifyCandidate(c,nan,caps),/invalid original CAD XYZ/);
 const rogue=copy();rogue.curveType='GeomAbs_BezierCurve';
 assert.throws(()=>verifyCandidate(c,rogue,caps),/unsupported finite OCCT/);
});
