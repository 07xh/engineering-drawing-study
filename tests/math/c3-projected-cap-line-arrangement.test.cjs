'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {arrangeProjected3DSourceLines:arrange}=
 require('../../core/projection/projected-source-line-arrangement.cjs');
const {auditC3ProjectedCapLineArrangement:audit}=
 require('../../workbench/c3-projected-cap-line-arrangement.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const p=(x,y,z)=>({x,y,z});
const segment=(id,a,b)=>({id,sourceId:id,from3D:a,to3D:b});
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('two DIFFERENT spatial lines cross only on first-angle W paper: split, depth-order without joining 3D',()=>{
 const r=arrange({view:'W',segments:[
  segment('rear',p(1,-2,0),p(1,2,0)),
  segment('front',p(4,0,-2),p(4,0,2))
 ]});
 assert.equal(r.projectedLineSourceCount,2);
 assert.equal(r.projectedLineAtoms.length,4);
 assert.equal(r.projectedEvents.length,1);
 assert.equal(r.projectedEvents[0].kind,'transverse-projected-crossing');
 assert.deepEqual(r.projectedEvents[0].projectedUV,{u:0,v:0});
 assert.deepEqual(r.projectedEvents[0].signedObserverDepths,[1,4]);
 assert.equal(r.projectedEvents[0].sameTrue3DSourcePoint,false);
 assert.equal(r.projectedEvents[0].projectedCrossingAloneDoesNotAuthorize3DJoin,true);
 assert.equal(r.true3DContactEventCount,0);
 assert.ok(r.projectedLineAtoms.every(x=>x.finalV5StrokeAuthorized===false));
 assert.equal(r.allProjectedStraightSourceParametersCoveredExactlyOnce,true);
});
test('genuine 3D crossing is recognized as physical only when its independent XYZ agree',()=>{
 const r=arrange({view:'W',segments:[
  segment('a',p(2,-2,0),p(2,2,0)),
  segment('b',p(2,0,-2),p(2,0,2))
 ]});
 assert.equal(r.projectedEvents[0].sameTrue3DSourcePoint,true);
 assert.equal(r.true3DContactEventCount,1);
 assert.equal(r.officialLineStylesVerified,false);
});
test('W collinear paper overlap preserves exact affine strict front/back depth order for all open atoms',()=>{
 const r=arrange({view:'W',segments:[
  segment('rear',p(0,-2,0),p(0,2,0)),
  segment('front',p(5,-1,0),p(5,1,0))
 ]});
 assert.equal(r.projectedPositiveLengthOverlaps.length,1);
 const o=r.projectedPositiveLengthOverlaps[0];
 assert.equal(o.status,'strict-projected-overlap-depth-order');
 assert.equal(o.frontSourceId,'front');
 assert.deepEqual(o.firstSourceParameterRange,[.25,.75]);
 assert.deepEqual(o.observerDepthDifferenceAtEnds,[-5,-5]);
 assert.equal(r.projectedLineAtoms.length,4);
 const overlapped=r.projectedLineAtoms.filter(x=>x.edgeId==='rear'&&
  x.parameterRange[0]>=.25&&x.parameterRange[1]<=.75);
 assert.equal(overlapped.length,1);
 assert.deepEqual(overlapped[0].otherProjectedSourcesInFront,['front']);
 const forward=r.projectedLineAtoms.find(x=>x.edgeId==='front');
 assert.deepEqual(forward.otherProjectedSourcesBehind,['rear']);
 assert.equal(r.strictPairwiseOverlapDepthOrderCertifiedWherePresent,true);
 assert.equal(r.fullProjectedCompositeContourCertified,false);
});
test('affine depth-order reversal requires an additional exact projected event, not a fabricated stroke',()=>{
 const r=arrange({view:'W',segments:[
  segment('sloping',p(-2,-2,0),p(2,2,0)),
  segment('fixed',p(0,-2,0),p(0,2,0))
 ]});
 assert.equal(r.projectedPositiveLengthOverlaps.length,1);
 const o=r.projectedPositiveLengthOverlaps[0];
 assert.equal(o.status,'undetermined-depth-contact-or-switch');
 assert.ok(o.switchSourceParameters);
 assert.equal(o.switchSourceParameters[0],.5);
 assert.equal(r.strictPairwiseOverlapDepthOrderCertifiedWherePresent,false);
 assert.equal(r.projectedLineAtoms.length,4);
 assert.ok(r.projectedLineAtoms.every(x=>x.standardLineStyle==='undetermined'));
});
test('one true 3D cap segment may collapse to a POINT in first-angle H without fake zero line',()=>{
 const r=arrange({view:'H',segments:[
  segment('vertical-z',p(3,4,-2),p(3,4,2)),
  segment('crossing-x',p(1,4,0),p(5,4,0))
 ]});
 assert.equal(r.projectedPointSourceCount,1);
 assert.equal(r.projectedLineSourceCount,1);
 assert.deepEqual(r.collapsedPointSources[0].projectedUV,{u:3,v:4});
 assert.equal(r.projectedEvents[0].kind,'collapsed-source-on-projected-line');
 assert.equal(r.projectedLineAtoms.length,2);
 assert.equal(r.collapsedPointSources[0].projectedDimension,'point-not-line');
});
test('projected endpoint contact and parallel nonintersection do not invent 3D topology',()=>{
 const a=arrange({view:'W',segments:[
  segment('one',p(0,0,0),p(0,3,0)),
  segment('touch',p(2,3,0),p(2,3,2)),
  segment('parallel',p(3,0,5),p(3,3,5))
 ]});
 assert.equal(a.projectedEvents.length,1);
 assert.equal(a.projectedEvents[0].sameTrue3DSourcePoint,false);
 assert.equal(a.projectedPositiveLengthOverlaps.length,0);
 assert.equal(a.projectedLineAtoms.length,3);
});
test('bounded inputs reject fabricated source points and repeated source edges',()=>{
 assert.throws(()=>arrange({view:'M',segments:[]}),/first-angle/);
 assert.throws(()=>arrange({view:'V',segments:[
  segment('z',p(0,0,0),p(0,0,0))
 ]}),/collapsed 3D/);
 assert.throws(()=>arrange({view:'V',segments:[
  segment('x',p(0,0,0),p(1,0,0)),
  segment('x',p(0,0,0),p(0,1,0))
 ]}),/unique finite/);
 assert.throws(()=>arrange({view:'H',segments:[
  segment('bad',p(0,NaN,0),p(3,0,0))
 ]}),/unique finite/);
});
test('real clipped finite cylinders expose true V/H/W cap projected overlaps + H point degeneracies',()=>{
 const s=input();s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const r=audit({input:s,revision:7});
 assert.equal(r.status,'scoped-source-cap-line-three-view-arrangement');
 assert.equal(r.true3DSourceCapEdgeCount,2);
 assert.equal(r.originalCapFeatureCount,2);
 assert.equal(r.views.V.sourceEdgeCount,2);
 assert.equal(r.views.H.projectedPointSourceCount,2);
 assert.equal(r.views.W.projectedLineSourceCount,2);
 assert.equal(r.allProjectedCapLinesAccountedFor,true);
 assert.equal(r.completeC3ProjectedContourCertified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.finalV5StrokeAuthorized,false);
 const j=joint({input:s,revision:7,solidOperation:'intersection'});
 assert.equal(j.projectedCapLineEvidence.status,r.status);
 assert.equal(j.capLineSourceProjectionPartitionVerified,true);
 assert.equal(j.fullCurveTopologyVerified,false);
 assert.equal(j.officialLineStylesVerified,false);
});
test('both families of source caps enumerate all projected coincident and crossing locations',()=>{
 const s=input();s.zCylinder.zMin=-5;s.zCylinder.zMax=5;
 s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const r=audit({input:s,revision:11});
 assert.equal(r.true3DSourceCapEdgeCount,10);
 assert.ok(r.projectedCollapsedPointCount>0);
 assert.equal(r.allProjectedCapLinesAccountedFor,true);
 for(const view of ['V','H','W']){
  const v=r.views[view];
  assert.equal(v.allProjectedStraightSourceParametersCoveredExactlyOnce,true);
  assert.ok(v.projectedLineAtoms.every(atom=>atom.standardLineStyle==='undetermined'));
  assert.ok(v.projectedEvents.every(e=>!e.officialLineStyle||
   e.officialLineStyle==='undetermined'));
 }
});
test('no cap intersections still yields a valid, empty source-only projected arrangement',()=>{
 const r=audit({input:input(),revision:2});
 assert.equal(r.status,'scoped-source-cap-line-three-view-arrangement');
 assert.equal(r.true3DSourceCapEdgeCount,0);
 assert.equal(r.projectedCrossingEventCount,0);
 assert.equal(r.projectedOverlapPairCount,0);
 assert.equal(r.projectedCollapsedPointCount,0);
 assert.equal(r.allCurveLineIntersectionsCertified,false);
});
