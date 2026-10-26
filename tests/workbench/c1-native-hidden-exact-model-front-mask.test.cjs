'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {certifyExactFullOriginalFront3DMask:exact,
 certifyActualOCCTFullFrontOriginalPaperEndpoints:native,
 certifyActualOCCTVisibleFrontOriginalIntervalUnion:union}=
 require('../../workbench/c1-native-hidden-exact-model-front-mask.cjs');

const geometry={id:'G',data:{points:{
 H0:{x:0,y:0,z:0},H1:{x:10,y:0,z:0},
 F0:{x:0,y:0,z:9},F1:{x:10,y:0,z:9},
 Offset:{x:10+Number.EPSILON*10,y:0,z:9},
 Tangent:{x:0,y:0,z:0},
 Rear:{x:0,y:0,z:-9}
}}};
const all=(front=['F0','F1'],hidden=['H0','H1'])=>exact({
 geometry,view:'H',hiddenEdge:hidden,frontEdge:front
});
const visible=(from='F0',to='F1',range=[0,1])=>({
 view:'H',occtHLRVisibilityClass:'visible-sharp',
 actualOCCTHLRFlattenedBRepLineVerified:true,
 actualOCCTHLRCurveEntireFiniteIntervalIsLine:true,
 v5Authorized:false,
 from:project(geometry.data.points[from]).H,
 to:project(geometry.data.points[to]).H,
 sourceCandidate3DLifts:[{
  sourceEdgeId:'G::F0|F1',
  originalSourceParameterRange:range,
  actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
  originalOCCTSourceLineCurveVerified:true,
  originalXYZReprojectsToHLR:true,v5Authorized:false,
  fromCandidate3D:{...geometry.data.points[from]},
  toCandidate3D:{...geometry.data.points[to]}
 }]
});
const actual=(obj)=>native({geometry,view:'H',
 frontEdge:['F0','F1'],nativeVisible:obj});
test('full source proof uses exact original H paper endpoints and exact signed 3D observer depth',()=>{
 const p=all();
 assert.equal(p.status,'exact-original-model-full-front-depth');
 assert.equal(p.exactOriginalProjectionSameWholePaperSegment,true);
 assert.deepEqual(p.exactDyadicFrontObserverDepthEndpointSigns,[1,1]);
 assert.equal(p.strictObserverFrontDepthAcrossOriginalOpenInterval,true);
 assert.equal(p.HLRGeneratedTopoDSIdentityProven,false);
 assert.equal(p.signedV5Action,false);
});
test('reverse ORIGINAL edge parameterization still proves the same whole physical front 3D projection',()=>{
 const p=all(['F1','F0']);
 assert.equal(p.originalFrontOrientationReversed,true);
 assert.equal(p.strictObserverFrontDepthAcrossOriginalOpenInterval,true);
});
test('strict literal ORIGINAL model endpoint mismatch is NOT repaired by an epsilon',()=>{
 const p=all(['F0','Offset']);
 assert.equal(p.status,'undetermined');
 assert.equal(p.exactOriginalProjectionSameWholePaperSegment,false);
 assert.equal(p.strictObserverFrontDepthAcrossOriginalOpenInterval,false);
});
test('zero observer depth at authentic source vertex or behind candidate is held, never inferred front',()=>{
 const p=all(['Tangent','F1']);
 assert.equal(p.strictObserverFrontDepthAcrossOriginalOpenInterval,false);
 const behind=all(['Rear','H0'],['H0','H1']);
 assert.equal(behind.strictObserverFrontDepthAcrossOriginalOpenInterval,false);
});
test('actual real OCCT native visible edge EXACTLY covers both original front paper endpoints',()=>{
 const p=actual(visible());
 assert.equal(p.nativeVisibleOriginalFrontSourceVerified,true);
 assert.equal(p.actualOCCTNativeEndpointsMatchOriginalPaperWithoutTolerance,true);
 assert.equal(p.nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints,true);
 assert.equal(p.noClaimOfOcctTopoDSGeneratedEdgeIdentity,true);
 assert.equal(p.signedV5Action,false);
 const q=actual(visible('F1','F0'));
 assert.equal(q.nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints,true);
});
test('OCCT one-ULP endpoint drift, partial edge and missing true original BRep curve all remain unsigned',()=>{
 const ulp=visible();ulp.to={...ulp.to,u:ulp.to.u-Number.EPSILON*10};
 const p=actual(ulp);
 assert.equal(p.nativeVisibleOriginalFrontSourceVerified,true);
 assert.equal(p.nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints,false);
 const partial=actual(visible('F0','F1',[0,.9999999999999999]));
 assert.equal(partial.nativeOriginalSourceParameterFullRangeVerified,false);
 assert.equal(partial.nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints,false);
 const fake=visible();fake.sourceCandidate3DLifts[0].originalOCCTSourceLineCurveVerified=false;
 assert.equal(actual(fake).nativeVisibleOriginalFrontSourceVerified,false);
});
test('untrusted HLR class and wrong view cannot be used to invent an original front source',()=>{
 const x=visible();x.occtHLRVisibilityClass='hidden-sharp';
 assert.throws(()=>actual(x),/genuine OCCT visible/);
 assert.throws(()=>native({geometry,view:'X',
  frontEdge:['F0','F1'],nativeVisible:visible()}),/genuine OCCT visible/);
});

function piece(fromT,toT){
 const seg=visible();
 const a=geometry.data.points.F0,b=geometry.data.points.F1;
 const p=(t)=>({x:a.x+(b.x-a.x)*t,y:0,z:9});
 seg.from=project(p(fromT)).H;seg.to=project(p(toT)).H;
 seg.sourceCandidate3DLifts[0].originalSourceParameterRange=[fromT,toT];
 seg.sourceCandidate3DLifts[0].fromCandidate3D=p(fromT);
 seg.sourceCandidate3DLifts[0].toCandidate3D=p(toT);
 return seg;
}
const aggregate=pieces=>union({geometry,view:'H',frontEdge:['F0','F1'],
 nativeVisibleSegments:pieces});
test('two genuinely split native visible BRep intervals exactly cover one original front edge',()=>{
 const p=aggregate([piece(0,.4),piece(.4,1)]);
 assert.equal(p.nativeVisibleOriginalFrontSourceVerified,true);
 assert.equal(p.nativeVisibleOriginalFrontWholePaperUnionCertified,true);
 assert.equal(p.nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints,false);
 assert.deepEqual(p.nativeVisibleUnprovenOriginalSourceIntervals,[]);
 assert.deepEqual(p.nativeVisibleVerifiedOriginalSourceIntervals,[[0,1]]);
 assert.equal(p.exactNativeSubintervalsAccepted,2);
 assert.equal(p.engineeringLineStyleCertified,false);
 assert.equal(p.signedV5Action,false);
});
test('reverse and overlapping actual native partial strokes retain exact full coverage',()=>{
 const p1=piece(0,.6),p2=piece(.4,1);
 const old=p2.from;p2.from=p2.to;p2.to=old;
 const l=p2.sourceCandidate3DLifts[0],start=l.fromCandidate3D;
 l.fromCandidate3D=l.toCandidate3D;l.toCandidate3D=start;
 assert.equal(aggregate([p2,p1]).nativeVisibleOriginalFrontWholePaperUnionCertified,true);
 assert.equal(aggregate([piece(0,1)]).nativeVisibleOriginalFrontWholePaperUnionCertified,true);
});
test('even a positive one-ULP-like native source gap must remain unproven',()=>{
 const p=aggregate([piece(0,.4),piece(.4+Number.EPSILON,1)]);
 assert.equal(p.nativeVisibleOriginalFrontWholePaperUnionCertified,false);
 assert.equal(p.nativeVisibleUnprovenOriginalSourceIntervals.length,1);
 assert.ok(p.nativeVisibleUnprovenOriginalSourceIntervals[0][0]<
  p.nativeVisibleUnprovenOriginalSourceIntervals[0][1]);
});
test('reject mismatched native paper endpoints despite claimed original 3D source lift',()=>{
 const drift=piece(.4,1);drift.from={...drift.from,u:drift.from.u+1e-12};
 const p=aggregate([piece(0,.4),drift]);
 assert.equal(p.nativeVisibleOriginalFrontWholePaperUnionCertified,false);
 assert.equal(p.exactNativeSubintervalsAccepted,1);
 assert.equal(p.mismatchedNativeOriginalEndpointsOrLiftHeld,1);
});
test('wrong CAD original source, forged BRep, stale view and missing 3D lift do not promote',()=>{
 const wrong=piece(.4,1);wrong.sourceCandidate3DLifts[0].sourceEdgeId='G::FAKE';
 assert.equal(aggregate([piece(0,.4),wrong]).nativeVisibleOriginalFrontWholePaperUnionCertified,false);
 const fake=piece(.4,1);fake.sourceCandidate3DLifts[0].originalOCCTSourceLineCurveVerified=false;
 assert.equal(aggregate([piece(0,.4),fake]).nativeVisibleOriginalFrontWholePaperUnionCertified,false);
 const unl=piece(.4,1);delete unl.sourceCandidate3DLifts[0].fromCandidate3D;
 assert.equal(aggregate([piece(0,.4),unl]).nativeVisibleOriginalFrontWholePaperUnionCertified,false);
 const stale=piece(0,1);stale.view='W';
 assert.throws(()=>aggregate([stale]),/unverified genuine OCCT/);
});
test('full coverage cannot be invented by out-of-range or zero-length source parameters',()=>{
 const invalid=piece(.4,1);invalid.sourceCandidate3DLifts[0].originalSourceParameterRange=[.4,1.1];
 const p=aggregate([piece(0,.4),invalid]);
 assert.equal(p.nativeVisibleOriginalFrontWholePaperUnionCertified,false);
 assert.ok(p.nativeVisibleUnprovenOriginalSourceIntervals.length>0);
});

test('native visible BRep with identical H paper endpoints but false original XYZ depth cannot certify full source',()=>{
 const impostor=visible();
 impostor.sourceCandidate3DLifts[0].fromCandidate3D.z+=1;
 const proof=actual(impostor);
 assert.equal(proof.actualOCCTNativeEndpointsMatchOriginalPaperWithoutTolerance,true);
 assert.equal(proof.nativeOriginalSourceParameterFullRangeVerified,true);
 assert.equal(proof.native3DSourceEndpointsIndependentlyMatchOriginalVertices,false);
 assert.equal(proof.nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints,false);
 assert.equal(proof.signedV5Action,false);
});
test('two native intervals covering all H paper but second lying on a different 3D depth leave positive original-source gap',()=>{
 const genuine=piece(0,.4),impostor=piece(.4,1);
 impostor.sourceCandidate3DLifts[0].fromCandidate3D.z+=5;
 impostor.sourceCandidate3DLifts[0].toCandidate3D.z+=5;
 const proof=aggregate([genuine,impostor]);
 assert.equal(proof.nativeVisibleOriginalFrontWholePaperUnionCertified,false);
 assert.deepEqual(proof.nativeVisibleVerifiedOriginalSourceIntervals,[[0,.4]]);
 assert.deepEqual(proof.nativeVisibleUnprovenOriginalSourceIntervals,[[.4,1]]);
 assert.equal(proof.mismatchedNativeOriginalEndpointsOrLiftHeld,1);
 assert.equal(proof.native3DOriginalSourceParameterDepthIndependentlyRecomputed,true);
 assert.equal(proof.signedV5Action,false);
});
test('reversed actual native HLR segment retains positive source proof only for exactly reversed original XYZ',()=>{
 const reverse=piece(.4,1);
 const old=reverse.from;reverse.from=reverse.to;reverse.to=old;
 const lift=reverse.sourceCandidate3DLifts[0];
 const a=lift.fromCandidate3D;lift.fromCandidate3D=lift.toCandidate3D;
 lift.toCandidate3D=a;
 assert.equal(aggregate([piece(0,.4),reverse]).
  nativeVisibleOriginalFrontWholePaperUnionCertified,true);
 reverse.sourceCandidate3DLifts[0].fromCandidate3D.z+=1;
 assert.equal(aggregate([piece(0,.4),reverse]).
  nativeVisibleOriginalFrontWholePaperUnionCertified,false);
});
test('3D original edge parallel to H observer ray projects to a point and cannot be a certified visible line',()=>{
 const geometryPoint={id:'G',data:{points:{
  P0:{x:0,y:0,z:0},P1:{x:0,y:0,z:9}
 }}};
 const candidate={
  view:'H',occtHLRVisibilityClass:'visible-sharp',
  actualOCCTHLRFlattenedBRepLineVerified:true,
  actualOCCTHLRCurveEntireFiniteIntervalIsLine:true,
  v5Authorized:false,
  from:project(geometryPoint.data.points.P0).H,
  to:project(geometryPoint.data.points.P1).H,
  sourceCandidate3DLifts:[{
   sourceEdgeId:'G::P0|P1',originalSourceParameterRange:[0,1],
   actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
   originalOCCTSourceLineCurveVerified:true,
   originalXYZReprojectsToHLR:true,v5Authorized:false,
   fromCandidate3D:geometryPoint.data.points.P0,
   toCandidate3D:geometryPoint.data.points.P1
  }]
 };
 const result=union({geometry:geometryPoint,view:'H',
  frontEdge:['P0','P1'],nativeVisibleSegments:[candidate]});
 assert.equal(result.originalSourceProjectsToNoncollapsedPaperLine,false);
 assert.equal(result.nativeVisibleOriginalFrontWholePaperUnionCertified,false);
 assert.deepEqual(result.nativeVisibleUnprovenOriginalSourceIntervals,[[0,1]]);
 assert.equal(result.signedV5Action,false);
});
