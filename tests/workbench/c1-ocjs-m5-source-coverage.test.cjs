'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {intervalCoverage,positiveCollinearOverlap}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const {validateC1RealHLRSourceCandidates:validateNative}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const {project}=require('../../core/projection/conventions.js');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1M0ExtremeVertexCompleteness:auditM0Vertices}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const p=(u,v)=>({u,v});
const physicalLedger=()=>{
 const geometry={id:'M0-Reviewed',data:{
  points:{A:{x:0,y:0,z:0},B:{x:3,y:4,z:5},
   C:{x:0,y:8,z:0},D:{x:3,y:12,z:5}},
  edges:[['A','B'],['A','C'],['C','D']]
 }};
 const edgeId='M0-Reviewed::A|B';
 const source=()=>({
  sourceEdgeId:edgeId,originalVertexIds:['A','B'],
  sourceParameterAtProjectedFrom:0,sourceParameterAtProjectedTo:1,
  originalSourceParameterRange:[0,1],
  fromCandidate3D:{x:0,y:0,z:0},
  toCandidate3D:{x:3,y:4,z:5},
  originalXYZReprojectsToHLR:true,
  actualOriginalOCCTBRepFrom3D:{x:0,y:0,z:0},
  actualOriginalOCCTBRepTo3D:{x:3,y:4,z:5},
  originalOCCTSourceCurveType:'line',
  originalOCCTCurveParameterRange:[0,Math.hypot(3,4,5)],
  actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
  originalOCCTSourceLineCurveVerified:true,
  actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,
  v5Authorized:false
 });
 const segment=()=>({
  projectedOriginalEdgeCandidates:[edgeId],
  sourceCandidate3DLifts:[source()],
  actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared:true,
  originalPhysicalOCCTSourceIdsCompared:[
   'M0-Reviewed::A|B','M0-Reviewed::A|C','M0-Reviewed::C|D'],
  actualDistinctOriginalOCCTBRepSourceCount:3,
  actualOriginalOCCTBRepEdgeOccurrencesCompared:3,
  directlySameOriginalOCCTBRepSourceEdgeIds:[],
  actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven:false,
  directlySameUniqueOriginalOCCTBRepSourceEdgeId:null
 });
 const cad={views:Object.fromEntries(['V','H','W'].map(view=>{
  const stroke=segment();
  stroke.from=project(geometry.data.points.A)[view];
  stroke.to=project(geometry.data.points.B)[view];
  return [view,[stroke]];
 }))};
 return {geometry,cad,edgeId};
};
test('C1 generic source-bound segment coverage joins real CAD split fragments without inventing a gap',()=>{
 const a=p(2,3),b=p(12,3);
 assert.equal(intervalCoverage(a,b,[
  {from:p(2,3),to:p(7,3)}, {from:p(7,3),to:p(12,3)}]),true);
 assert.equal(intervalCoverage(a,b,[
  {from:p(2,3),to:p(6,3)}, {from:p(7,3),to:p(12,3)}]),false);
 assert.equal(intervalCoverage(a,b,[
  {from:p(2,3),to:p(7,3.001)}, {from:p(7,3),to:p(12,3)}]),false);
});
test('non-contour CAD feature is never promoted by 2D nearby/point-only coincidence',()=>{
 const a=p(0,0),b=p(10,0);
 assert.equal(positiveCollinearOverlap(a,b,p(4,2),p(6,2)),false);
 assert.equal(positiveCollinearOverlap(a,b,p(10,0),p(12,0)),false);
 assert.equal(positiveCollinearOverlap(a,b,p(9,0),p(12,0)),true);
 assert.equal(positiveCollinearOverlap(a,b,p(6,0),p(1,0)),true);
 assert.equal(positiveCollinearOverlap(a,b,p(6,0.01),p(1,0.01)),false);
});

test('C1 real HLR source identity checks every V/H/W stroke without claiming native TopoDS history',()=>{
 const x=physicalLedger();
 assert.equal(validateNative(x),true);
 for(const view of ['V','H','W']){
  const q=physicalLedger();
  q.cad.views[view].push(structuredClone(q.cad.views[view][0]));
  assert.equal(validateNative(q),true);
 }
});
test('C1 refuses fabricated same-geometry source IDs, even on an unsigned CAD crease',()=>{
 for(const view of ['V','H','W']){
  const q=physicalLedger(),stroke=q.cad.views[view][0];
  stroke.projectedOriginalEdgeCandidates=['M0-Reviewed::A|invented'];
  stroke.sourceCandidate3DLifts[0].sourceEdgeId='M0-Reviewed::A|invented';
  assert.throws(()=>validateNative(q),/invalid original physical source candidates/);
 }
});
test('C1 refuses duplicate, missing and cross-source native lift witnesses',()=>{
 for(const change of [
  q=>q.cad.views.V[0].projectedOriginalEdgeCandidates.push(q.edgeId),
  q=>q.cad.views.H[0].sourceCandidate3DLifts=[],
  q=>q.cad.views.W[0].sourceCandidate3DLifts[0].sourceEdgeId='M0-Reviewed::A|C',
  q=>q.cad.views.V[0].sourceCandidate3DLifts[0].originalVertexIds=['A','C'],
  q=>q.cad.views.H[0].sourceCandidate3DLifts[0].originalVertexIds=['B','A']
 ]){
  const q=physicalLedger();change(q);
  assert.throws(()=>validateNative(q),/source candidates|physical source lift|BRep IsSame/);
 }
});
test('C1 refuses forged HLR source parameters and false BRep IsSame identities',()=>{
 for(const change of [
  q=>q.cad.views.V[0].sourceCandidate3DLifts[0].sourceParameterAtProjectedFrom=NaN,
  q=>q.cad.views.H[0].sourceCandidate3DLifts[0].originalSourceParameterRange=[0,0.9999999999999999],
  q=>q.cad.views.W[0].sourceCandidate3DLifts[0].sourceParameterAtProjectedTo=0,
  q=>q.cad.views.V[0].sourceCandidate3DLifts[0].fromCandidate3D.y=Number.MIN_VALUE,
  q=>q.cad.views.H[0].sourceCandidate3DLifts[0].toCandidate3D.x=3-Number.EPSILON*2,
  q=>q.cad.views.V[0].sourceCandidate3DLifts[0].v5Authorized=true,
  q=>q.cad.views.H[0].sourceCandidate3DLifts[0].actualOriginalOCCTBRepEdge3DEndpointsVerified=false,
  q=>q.cad.views.W[0].directlySameUniqueOriginalOCCTBRepSourceEdgeId='M0-Reviewed::A|C',
  q=>q.cad.views.V[0].actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared=false
 ]){
  const q=physicalLedger();change(q);
  assert.throws(()=>validateNative(q),/physical source lift|BRep IsSame/);
 }
});
test('C1 refuses duplicate original physical edges before HLR source matching',()=>{
 const q=physicalLedger();q.geometry.data.edges.push(['B','A']);
 assert.throws(()=>validateNative(q),/duplicate original M0 source/);
});
test('C1 exact original XYZ parameter reversal remains valid in all first-angle views',()=>{
 const q=physicalLedger();
 for(const view of ['V','H','W']){
  const lift=q.cad.views[view][0].sourceCandidate3DLifts[0];
  lift.sourceParameterAtProjectedFrom=1;
  lift.sourceParameterAtProjectedTo=0;
  lift.fromCandidate3D={x:3,y:4,z:5};
  lift.toCandidate3D={x:0,y:0,z:0};
  const stroke=q.cad.views[view][0];
  [stroke.from,stroke.to]=[stroke.to,stroke.from];
 }
 assert.equal(validateNative(q),true);
});

test('C1 identical V paper strokes at different Y depths stay distinct unsigned 3D candidates',()=>{
 const q=physicalLedger(),stroke=q.cad.views.V[0];
 const rear='M0-Reviewed::C|D';
 stroke.projectedOriginalEdgeCandidates.push(rear);
 stroke.sourceCandidate3DLifts.push({
  ...structuredClone(stroke.sourceCandidate3DLifts[0]),
  sourceEdgeId:rear,originalVertexIds:['C','D'],
  fromCandidate3D:{x:0,y:8,z:0},
  toCandidate3D:{x:3,y:12,z:5},
  actualOriginalOCCTBRepFrom3D:{x:0,y:8,z:0},
  actualOriginalOCCTBRepTo3D:{x:3,y:12,z:5}
 });
 assert.deepEqual(project(stroke.sourceCandidate3DLifts[0].fromCandidate3D).V,
  project(stroke.sourceCandidate3DLifts[1].fromCandidate3D).V);
 assert.equal(validateNative(q),true);
 stroke.directlySameUniqueOriginalOCCTBRepSourceEdgeId=rear;
 stroke.directlySameOriginalOCCTBRepSourceEdgeIds=[rear];
 stroke.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven=true;
 assert.equal(validateNative(q),true);
 stroke.sourceCandidate3DLifts[1].fromCandidate3D.y=0;
 assert.throws(()=>validateNative(q),/physical source lift/);
});
test('C1 rejects incorrect paper endpoint even with valid original 3D source name and flags',()=>{
 for(const view of ['V','H','W']){
  const q=physicalLedger();
  q.cad.views[view][0].to.u+=0.01;
  assert.throws(()=>validateNative(q),/physical source lift/);
 }
});

const {bindC1NativeThirdViewEvidence:bindMissingView}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const missingViewFixture=view=>{
 const geometryId='confirmed-c1',revision=27;
 const actionId='canonical-'+view+'-visible-0',sourceEdgeId='confirmed-c1::A|B';
 const canonical={
  wholeSolidV5Ready:false,
  certifiedVisibleContourLineBindings:[{
   view,actionId,sourceEdgeId,
   signedFormalLineV5:true
  }],
  thirdViewDrawing:{
   view,revision,geometryId,completeDrawingCertified:false,
   certifiedVisibleContour:[{
    sourceEdgeId,v5ActionId:actionId,
    standardLineStyle:'gb-t-4457.4-continuous-wide-visible-outline'
   }],
   unresolvedPhysicalEdges:[{
    sourceEdgeId:'confirmed-c1::C|D',
    standardLineStyle:'undetermined',v5ActionId:null
   }],
   drawingLayers:{officialV5StrokeActionIds:[actionId]}
  }
 };
 const cad={revision,sourceGeometryId:geometryId,
  lineStyleCertified:false,v5Authorized:false,views:{V:[],H:[],W:[]}};
 cad.views[view]=[{from:{u:0,v:0},to:{u:3,v:5},
  projectedOriginalEdgeCandidates:[sourceEdgeId]}];
 return {canonical,cad,revision,geometryId};
};
test('native missing-view evidence binds all three first-angle views to existing M3/V5 without signing extra strokes',()=>{
 for(const view of ['V','H','W']){
  const fixture=missingViewFixture(view);
  const result=bindMissingView(fixture);
  assert.equal(result.view,view);
  assert.equal(result.revision,fixture.revision);
  assert.equal(result.geometryId,fixture.geometryId);
  assert.deepEqual(result.canonicalCertifiedVisibleV5ActionIds,
   ['canonical-'+view+'-visible-0']);
  assert.equal(result.unresolvedPhysicalSourceCount,1);
  assert.equal(result.generatedTopoDSHistoryComplete,false);
  assert.equal(result.completeDrawingCertified,false);
  assert.equal(result.newV5ActionsFromNativeHLR,0);
  assert.deepEqual(result.realHLRVisibleSegments[0].original3DSourceCandidates,
   ['confirmed-c1::A|B']);
  assert.equal(result.realHLRVisibleSegments[0].engineeringLineStyle,'undetermined');
  assert.equal(result.realHLRVisibleSegments[0].v5ActionId,null);
  assert.ok(Object.isFrozen(result.realHLRVisibleSegments));
  assert.ok(Object.isFrozen(result.realHLRVisibleSegments[0].from));
  assert.ok(Object.isFrozen(result.canonicalCertifiedVisibleV5ActionIds));
  assert.throws(()=>{result.realHLRVisibleSegments[0].from.u=100;},TypeError);
 }
});
test('native C1 missing-view consumer rejects stale M3 identity, invented or duplicated canonical V5 actions',()=>{
 for(const change of [
  x=>x.canonical.thirdViewDrawing.revision++,
  x=>x.canonical.thirdViewDrawing.geometryId='other-solid',
  x=>x.cad.revision++,
  x=>x.cad.sourceGeometryId='stale-cad',
  x=>x.cad.lineStyleCertified=true,
  x=>x.cad.v5Authorized=true,
  x=>x.canonical.thirdViewDrawing.view='Q',
  x=>x.canonical.thirdViewDrawing.certifiedVisibleContour[0].v5ActionId='invented',
  x=>x.canonical.thirdViewDrawing.certifiedVisibleContour[0].sourceEdgeId='other-source',
  x=>x.canonical.thirdViewDrawing.certifiedVisibleContour[0].standardLineStyle='undetermined',
  x=>x.canonical.thirdViewDrawing.drawingLayers.officialV5StrokeActionIds[0]='invented',
  x=>x.canonical.thirdViewDrawing.drawingLayers.officialV5StrokeActionIds.push('invented'),
  x=>x.canonical.certifiedVisibleContourLineBindings.push(
   {...x.canonical.certifiedVisibleContourLineBindings[0]}),
  x=>x.canonical.thirdViewDrawing.completeDrawingCertified=true,
  x=>x.canonical.wholeSolidV5Ready=true,
  x=>x.canonical.thirdViewDrawing.unresolvedPhysicalEdges[0].v5ActionId='forged',
  x=>x.canonical.thirdViewDrawing.unresolvedPhysicalEdges[0].standardLineStyle='visible'
 ]){
  const x=missingViewFixture('W');change(x);
  assert.throws(()=>bindMissingView(x),/native OCCT|noncanonical V5/);
 }
});
test('native C1 missing-view evidence fails closed on absent or malformed HLR geometry/source candidates',()=>{
 for(const change of [
  x=>x.cad.views.V=[],
  x=>x.cad.views.V[0].from.u=Infinity,
  x=>x.cad.views.V[0].to.v=NaN,
  x=>x.cad.views.V[0].projectedOriginalEdgeCandidates=[],
  x=>x.cad.views.V[0].projectedOriginalEdgeCandidates.push(''),
  x=>x.cad.views.V[0].projectedOriginalEdgeCandidates.push('confirmed-c1::A|B')
 ]){
  const x=missingViewFixture('V');change(x);
  assert.throws(()=>bindMissingView(x),/native OCCT|invalid native C1/);
 }
});

test('real C1 OCCT source gate independently proves bounded M0 box extreme vertices',()=>{
 for(const [min,max] of [
  [{x:0,y:0,z:0},{x:6,y:8,z:10}],
  [{x:-73,y:-44,z:-21},{x:-13,y:-7,z:19}],
  [{x:151,y:22,z:-32},{x:154,y:73,z:-29}]
 ]){
  const g=prismMesh({solid:{min,max}});
  const p=auditM0Vertices(g);
  assert.equal(p.vertexHullVerified,true);
  assert.equal(p.derivedVertexCount,8);
  assert.equal(p.officialLineStyleVerified,false);
  assert.equal(p.completeSceneVerified,false);
 }
});
test('real C1 OCCT source gate independently proves skew tetra extreme vertices',()=>{
 const g={id:'skew-tetra-m0',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points:{A:{x:0,y:0,z:0},B:{x:17,y:1,z:3},
   C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}},
   edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
   faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]}};
 const p=auditM0Vertices(g);
 assert.equal(p.vertexHullVerified,true);
 assert.equal(p.derivedVertexCount,4);
});
test('real C1 source gate rejects missing physical face before any CAD signing',()=>{
 const g=prismMesh({solid:{min:{x:0,y:0,z:0},max:{x:6,y:8,z:10}}});
 const bad={...g,data:{...g.data,faces:g.data.faces.slice(1)}};
 assert.throws(()=>auditM0Vertices(bad),/closed|face|topology|mesh/i);
});

const withSignedPhysical=view=>{
 const x=missingViewFixture(view),actionId='physical-'+view,
  sourceEdgeId='confirmed-c1::C|D',
  standardLineStyle='gb-t-4457.4-thin-dashed-hidden-edge',
  originalParameterRange=[0,0.5];
 x.canonical.certifiedPhysicalLineBindings=[{view,actionId,sourceEdgeId,
  standardLineStyle,originalParameterRange:[...originalParameterRange]}];
 x.canonical.thirdViewDrawing.certifiedPhysicalFeatures=[{
  sourceEdgeId,v5ActionId:actionId,standardLineStyle,
  originalParameterRange:[...originalParameterRange]
 }];
 x.canonical.thirdViewDrawing.drawingLayers.officialV5StrokeActionIds.push(actionId);
 return x;
};
test('native OCCT missing-view binds existing M5 physical solid/dashed actions without creating new V5',()=>{
 for(const view of ['V','H','W']){
  const x=withSignedPhysical(view),result=bindMissingView(x);
  assert.deepEqual(result.canonicalCertifiedVisibleV5ActionIds,
   ['canonical-'+view+'-visible-0']);
  assert.deepEqual(result.canonicalCertifiedPhysicalV5ActionIds,
   ['physical-'+view]);
  assert.deepEqual(result.canonicalOfficialV5StrokeActionIds,
   ['canonical-'+view+'-visible-0','physical-'+view]);
  assert.equal(result.newV5ActionsFromNativeHLR,0);
  assert.equal(result.generatedTopoDSHistoryComplete,false);
 }
});
test('native OCCT rejects forged or omitted canonical physical M5 action/parameter identities',()=>{
 for(const view of ['V','H','W'])for(const change of [
  x=>x.canonical.thirdViewDrawing.certifiedPhysicalFeatures[0].v5ActionId='forged',
  x=>x.canonical.thirdViewDrawing.certifiedPhysicalFeatures[0].sourceEdgeId='forged',
  x=>x.canonical.thirdViewDrawing.certifiedPhysicalFeatures[0].standardLineStyle='undetermined',
  x=>x.canonical.thirdViewDrawing.certifiedPhysicalFeatures[0].originalParameterRange=[0,0.5000000000000001],
  x=>x.canonical.thirdViewDrawing.drawingLayers.officialV5StrokeActionIds.pop(),
  x=>x.canonical.thirdViewDrawing.drawingLayers.officialV5StrokeActionIds.push('forged'),
  x=>x.canonical.certifiedPhysicalLineBindings[0].actionId='forged',
  x=>x.canonical.certifiedPhysicalLineBindings.push(
   {...x.canonical.certifiedPhysicalLineBindings[0]})
 ]){
  const x=withSignedPhysical(view);change(x);
  assert.throws(()=>bindMissingView(x),/noncanonical V5/);
 }
});

test('C1 native BRep curve witnesses are actual original XYZ and unit-speed lines in V/H/W',()=>{
 for(const view of ['V','H','W']){
  const good=physicalLedger();
  const lift=good.cad.views[view][0].sourceCandidate3DLifts[0];
  [lift.actualOriginalOCCTBRepFrom3D,lift.actualOriginalOCCTBRepTo3D]=
   [lift.actualOriginalOCCTBRepTo3D,lift.actualOriginalOCCTBRepFrom3D];
  lift.originalOCCTCurveParameterRange=[11,11+Math.hypot(3,4,5)];
  assert.equal(validateNative(good),true,
   'native original BRep orientation and parameter origin are independent');
  for(const mutate of [
   x=>x.actualOriginalOCCTBRepFrom3D.y=Number.MIN_VALUE,
   x=>x.actualOriginalOCCTBRepTo3D.x=3.000000000001,
   x=>x.originalOCCTSourceCurveType='circle',
   x=>x.originalOCCTCurveParameterRange=[0,Math.hypot(3,4,5)-0.001],
   x=>x.originalOCCTCurveParameterRange=[1,1],
   x=>x.originalOCCTCurveParameterRange=[0,Infinity],
   x=>delete x.actualOriginalOCCTBRepTo3D
  ]){
   const bad=physicalLedger();
   mutate(bad.cad.views[view][0].sourceCandidate3DLifts[0]);
   assert.throws(()=>validateNative(bad),/physical source lift/,
    'forged original native 3D curve cannot be accepted as an M0 source');
  }
 }
});
test('C1 IsSame audit must enumerate ALL original TopoDS edges, not a selected subset',()=>{
 for(const view of ['V','H','W'])for(const mutate of [
  x=>x.originalPhysicalOCCTSourceIdsCompared.pop(),
  x=>x.originalPhysicalOCCTSourceIdsCompared.reverse(),
  x=>x.originalPhysicalOCCTSourceIdsCompared[1]=
   x.originalPhysicalOCCTSourceIdsCompared[0],
  x=>x.actualDistinctOriginalOCCTBRepSourceCount=2,
  x=>x.actualOriginalOCCTBRepEdgeOccurrencesCompared=2,
  x=>x.actualOriginalOCCTBRepEdgeOccurrencesCompared=2.5,
  x=>x.directlySameOriginalOCCTBRepSourceEdgeIds=['M0-Reviewed::A|C'],
  x=>x.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven=true,
  x=>x.directlySameUniqueOriginalOCCTBRepSourceEdgeId='M0-Reviewed::A|B'
 ]){
  const bad=physicalLedger();
  mutate(bad.cad.views[view][0]);
  assert.throws(()=>validateNative(bad),/BRep IsSame/,
   'partial or forged native TopoDS inventory must fail closed');
 }
});

const {exactC1NativeSourceIntervalCoverage:exactSourceCoverage}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const nextAfterHalf=()=>{
 const bits=new DataView(new ArrayBuffer(8));
 bits.setFloat64(0,0.5,false);
 bits.setBigUint64(0,bits.getBigUint64(0,false)+1n,false);
 return bits.getFloat64(0,false);
};
test('C1 V/H/W native source parameter coverage joins actual 3D intervals without paper tolerance',()=>{
 for(const view of ['V','H','W']){
  const {geometry,cad,edgeId}=physicalLedger();
  const first=structuredClone(cad.views[view][0]);
  const second=structuredClone(first);
  first.sourceCandidate3DLifts[0].originalSourceParameterRange=[0,0.5];
  second.sourceCandidate3DLifts[0].originalSourceParameterRange=[0.5,1];
  const input={geometry,view,sourceEdgeId:edgeId,
   real3DFrom:geometry.data.points.A,real3DTo:geometry.data.points.B,
   strokes:[first,second]};
  const full=exactSourceCoverage(input);
  assert.equal(full.entireOriginalParameterIntervalCovered,true);
  assert.deepEqual(full.positiveLengthUncoveredIntervals,[]);
  assert.equal(full.signedV5Action,false);
  assert.equal(full.engineeringLineStyle,'undetermined');
  const reversed=exactSourceCoverage({...input,
   real3DFrom:geometry.data.points.B,real3DTo:geometry.data.points.A});
  assert.equal(reversed.entireOriginalParameterIntervalCovered,true);
  second.sourceCandidate3DLifts[0].originalSourceParameterRange=
   [nextAfterHalf(),1];
  const gap=exactSourceCoverage(input);
  assert.equal(gap.entireOriginalParameterIntervalCovered,false);
  assert.deepEqual(gap.positiveLengthUncoveredIntervals,
   [[0.5,nextAfterHalf()]]);
  assert.equal(gap.status,'exact-original-3d-native-source-positive-gap');
 }
});
test('C1 exact source gap consumer rejects fake 3D endpoints, stale BRep and paper-only source aliases',()=>{
 for(const view of ['V','H','W']){
  const {geometry,cad,edgeId}=physicalLedger();
  const stroke=cad.views[view][0];
  const input={geometry,view,sourceEdgeId:edgeId,
   real3DFrom:geometry.data.points.A,real3DTo:geometry.data.points.B,
   strokes:[stroke]};
  const shifted=exactSourceCoverage({...input,
   real3DFrom:{x:0,y:Number.MIN_VALUE,z:0}});
  assert.equal(shifted.entireOriginalParameterIntervalCovered,false);
  assert.equal(shifted.status,
   'unreconstructable-original-3d-source-parameter');
  const other=structuredClone(stroke);
  other.sourceCandidate3DLifts[0].sourceEdgeId='M0-Reviewed::C|D';
  const alias=exactSourceCoverage({...input,strokes:[other]});
  assert.equal(alias.entireOriginalParameterIntervalCovered,false);
  assert.deepEqual(alias.positiveLengthUncoveredIntervals,[[0,1]]);
  for(const change of [
   x=>x.actualOriginalOCCTBRepEdge3DEndpointsVerified=false,
   x=>x.originalOCCTSourceLineCurveVerified=false,
   x=>x.v5Authorized=true,
   x=>x.originalSourceParameterRange=[0,0]
  ]){
   const bad=structuredClone(stroke);
   change(bad.sourceCandidate3DLifts[0]);
   assert.throws(()=>exactSourceCoverage({...input,strokes:[bad]}),
    /unverified original native BRep|verified finite native CAD/);
  }
  assert.throws(()=>exactSourceCoverage({...input,
   sourceEdgeId:'M0-Reviewed::invented'}),/missing or duplicated/);
 }
});

test('C1 exact original M0 vertex paper identity recovers a rounded display endpoint only after real M5 proof',()=>{
 const bits=new DataView(new ArrayBuffer(8));
 bits.setFloat64(0,1,false);
 bits.setBigUint64(0,bits.getBigUint64(0,false)-1n,false);
 const almostOne=bits.getFloat64(0,false);
 for(const view of ['V','H','W']){
  const {geometry,cad,edgeId}=physicalLedger();
  const a=geometry.data.points.A,b=geometry.data.points.B;
  const rounded={x:3*almostOne,y:4*almostOne,z:5*almostOne};
  const paperA=project(a)[view],paperB=project(b)[view];
  const args={geometry,view,sourceEdgeId:edgeId,
   real3DFrom:a,real3DTo:rounded,
   projectedFromModelMm:paperA,projectedToModelMm:paperB,
   strokes:cad.views[view]};
  const unsigned=exactSourceCoverage(args);
  assert.equal(unsigned.originalSourceParameterRange[1],almostOne);
  const authenticated=exactSourceCoverage({...args,
   independentlyM5SourceAndJunctionsProven:true});
  assert.deepEqual(authenticated.originalSourceParameterRange,[0,1]);
  assert.equal(authenticated.entireOriginalParameterIntervalCovered,true);
  assert.equal(authenticated.signedV5Action,false);
  const shifted=exactSourceCoverage({...args,
   projectedToModelMm:{u:paperB.u+1e-10,v:paperB.v},
   independentlyM5SourceAndJunctionsProven:true});
  assert.equal(shifted.originalSourceParameterRange[1],almostOne);
 }
});
