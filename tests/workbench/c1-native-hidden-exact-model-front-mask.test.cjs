'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {certifyExactFullOriginalFront3DMask:exact,
 certifyActualOCCTFullFrontOriginalPaperEndpoints:native}=
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
  originalXYZReprojectsToHLR:true,v5Authorized:false
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
