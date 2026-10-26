'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {auditC1NativeVisibleContourOriginalFrontSource:audit}=
 require('../../workbench/c1-native-visible-contour-front-source.cjs');
const g=()=>({...prismMesh({solid:{
 min:{x:0,y:0,z:0},max:{x:2,y:4,z:9}
 }}),id:'Box'});
const originalLift=(geometry,ids)=>{
 const a=geometry.data.points[ids[0]],b=geometry.data.points[ids[1]];
 return {
  sourceEdgeId:'Box::'+[...ids].sort().join('|'),
  originalVertexIds:[...ids],
  sourceParameterAtProjectedFrom:0,sourceParameterAtProjectedTo:1,
  originalSourceParameterRange:[0,1],
  actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
  originalOCCTSourceLineCurveVerified:true,
  originalXYZReprojectsToHLR:true,
  v5Authorized:false,
  actualOriginalOCCTBRepFrom3D:{...a},
  actualOriginalOCCTBRepTo3D:{...b},
  fromCandidate3D:{...a},toCandidate3D:{...b}
 };
};
const caseData=()=>{
 const geometry=g();
 const front=originalLift(geometry,['V101','V111']),
  back=originalLift(geometry,['V100','V110']);
 return {geometry,revision:3,view:'H',nativeHLREdgeOrdinal:1,
  seg:{
   occtHLRVisibilityClass:'visible-sharp',
   actualOCCTHLRFlattenedBRepLineVerified:true,
   actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared:true,
   actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,
   from:project(front.fromCandidate3D).H,
   to:project(front.toCandidate3D).H,
   sourceCandidate3DLifts:[back,front]
  }
 };
};
test('genuine H native contour selects top z=9 original edge over bottom z=0 using exact original supporting face and affine observer-depth ordering',()=>{
 const x=caseData(),r=audit(x);
 assert.equal(r.status,'locally-proven-original-3d-front-contour-source');
 assert.equal(r.certifiedOriginalFrontPhysicalSourceEdgeId,'Box::V101|V111');
 assert.deepEqual(r.otherOriginal3DCoProjectedSourceEdgeIds,['Box::V100|V110']);
 assert.equal(r.exactWholeOpenRayAndBothEndpointDepthDominance,true);
 assert.equal(r.independentM4OriginalHullOverlapWitness,true);
 assert.equal(r.exactObserverAxis,'z');
 assert.equal(r.observerDirectionSign,1);
 assert.equal(r.actualGeneratedTopoDSEdgeOriginalHistoryCertified,false);
 assert.equal(r.entireHullAndProjectedJunctionsCertified,false);
 assert.equal(r.gbEngineeringLineCertified,false);
 assert.equal(r.signedV5Action,false);
});
test('swapping actual projected original source candidate ordering cannot change the genuine frontmost 3D contour source',()=>{
 const x=caseData();
 x.seg.sourceCandidate3DLifts.reverse();
 const r=audit(x);
 assert.equal(r.certifiedOriginalFrontPhysicalSourceEdgeId,'Box::V101|V111');
});
test('genuine original CAD BRep source XYZ disagreement cannot be fixed by paper coincidence',()=>{
 const x=caseData();
 x.seg.sourceCandidate3DLifts[1].actualOriginalOCCTBRepTo3D.z=9.01;
 const r=audit(x);
 assert.equal(r.status,'undetermined');
 assert.equal(r.certifiedOriginalFrontPhysicalSourceEdgeId,null);
 assert.equal(r.gbEngineeringLineCertified,false);
});
test('same original source listed twice is not two independent physical 3D contour candidates',()=>{
 const x=caseData();
 x.seg.sourceCandidate3DLifts[0]={
  ...x.seg.sourceCandidate3DLifts[1]
 };
 const r=audit(x);
 assert.equal(r.reason,'duplicate-original-3d-physical-source-candidate');
 assert.equal(r.signedV5Action,false);
});
test('false depth inside a projected native HLR endpoint cannot create a physical frontmost contour source',()=>{
 const x=caseData();
 x.seg.sourceCandidate3DLifts[1].fromCandidate3D.z=0;
 const r=audit(x);
 assert.equal(r.reason,'native-projected-or-original-3d-endpoint-mismatch');
 assert.equal(r.signedV5Action,false);
});
test('HLR native paper with misplaced even one binary64 unit is never projected/3D certified by an epsilon',()=>{
 const x=caseData();
 x.seg.from.u+=Number.EPSILON*4; // one representable ULP above the magnitude-2 coordinate
 const r=audit(x);
 assert.equal(r.status,'undetermined');
 assert.equal(r.signedV5Action,false);
});
