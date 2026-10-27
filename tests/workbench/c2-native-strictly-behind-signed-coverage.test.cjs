'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC2StrictNativeBehindSignedPaperCoverage}=
 require('../../workbench/c2-native-strictly-behind-signed-coverage.cjs');
const visible='gb-t-4457.4-continuous-wide-visible-outline';
const p=(u,v=0)=>({u,v});
const source=()=>({
 view:'V',sourceNativeResultEdgeOrdinal:1,
 originalGeneratedEdgeParameterRange:[0,1],
 projectedFromModelMm:p(0),projectedToModelMm:p(10),
 reason:'unresolved-projected-depth-or-collinear-source-alias',
 originalMathEvidenceUnsigned:true
});
const witness=()=>({
 schema:'draftai-m0-m4-whole-coproject-original-3d-affine-depth/1',
 candidateSourceId:'NativeC2Edge1Span1',peerSourceId:'NativeC2Peer2',
 view:'V',status:'candidate-strictly-behind',
 independentOriginal3DWholeOpenDepthOrderCertified:true,
 signedObserverDepthDifferenceAtEndsMm:[-4,-4],
 strictlyPositiveOriginalDepthMarginMm:1e-7
});
const m4=()=>[{
 view:'V',sourceNativeResultEdgeOrdinal:1,
 unresolvedNearDegenerateOriginalSourceEvents:false,
 subspans:[{
  status:'unresolved-projected-depth-or-collinear-source-alias',
  originalGeneratedEdgeParameterRange:[0,1],
  projectedFromModelMm:p(0),projectedToModelMm:p(10),
  coProjectedOriginalNative3DDepthWitnesses:[witness()]
 }]
}];
const signed=(a,b,i,style=visible)=>({
 view:'V',sourceNativeResultEdgeOrdinal:2,
 actionId:'real_v5_'+i,
 standardEngineeringLineStyle:style,
 projectedFromModelMm:p(a),projectedToModelMm:p(b),
 fullOriginalC2NativeM0M4M5ProofVerifiedInFreshRun:true
});
const run=(unsigned=[source()],m4Rows=m4(),
 signs=[signed(0,5,1),signed(5,10,2)])=>
 auditC2StrictNativeBehindSignedPaperCoverage({unsigned,m4Rows,signed:signs});
test('two real signed foreground strokes cover complete back line with ZERO new V5',()=>{
 const r=run();
 assert.equal(r.suppressed.length,1);
 assert.equal(r.held.length,0);
 assert.equal(r.suppressed[0].suppressedInsteadOfDrawingDuplicateV5,true);
 assert.equal(r.suppressed[0].exactCompleteForegroundPaperIntervalCoverageVerified,true);
 assert.equal(r.suppressed[0].additionalNewV5ActionCount,0);
 assert.equal(r.supplementaryV5ActionCount,0);
 assert.deepEqual(r.suppressed[0].coveringOriginalNativeSourceOrdinals,[2]);
});
test('positive 1 ULP physical paper gap cannot suppress back edge',()=>{
 const next=new DataView(new ArrayBuffer(8));
 next.setFloat64(0,5,false);
 next.setBigUint64(0,next.getBigUint64(0,false)+1n,false);
 const after=next.getFloat64(0,false);
 const r=run([source()],m4(),[signed(0,5,1),signed(after,10,2)]);
 assert.equal(r.suppressed.length,0);
 assert.equal(r.held.length,1);
 assert.equal(r.held[0].suppressionProofStatus,
  'front-signed-stroke-does-not-cover-exact-paper-interval');
});
test('near-parallel but not coincident signed V5 foreground does not suppress',()=>{
 const sign=signed(0,10,1);
 sign.projectedFromModelMm.v=1e-10;
 sign.projectedToModelMm.v=1e-10;
 const r=run([source()],m4(),[sign]);
 assert.equal(r.suppressed.length,0);
});
test('depth inversion or tie cannot masquerade as real strict-behind source',()=>{
 const rows=m4();rows[0].subspans[0].
  coProjectedOriginalNative3DDepthWitnesses[0].
  signedObserverDepthDifferenceAtEndsMm[1]=+1;
 assert.equal(run([source()],rows,[signed(0,10,1)]).held.length,1);
 const rows2=m4();
 rows2[0].subspans[0].coProjectedOriginalNative3DDepthWitnesses[0]
  .status='undetermined-depth-tie-crossing-or-insufficient-margin';
 assert.equal(run([source()],rows2,[signed(0,10,1)]).held.length,1);
});
test('unresolved source degeneracy vetoes even exactly covered back line',()=>{
 const rows=m4();rows[0].unresolvedNearDegenerateOriginalSourceEvents=true;
 assert.equal(run([source()],rows,[signed(0,10,1)]).suppressed.length,0);
});
test('missing peer signed action and source view mismatch cannot suppress',()=>{
 assert.equal(run([source()],m4(),[]).held.length,1);
 const peer=signed(0,10,1);peer.view='H';
 assert.equal(run([source()],m4(),[peer]).held.length,1);
});
test('forged source interval or duplicate signed action identities fail closed',()=>{
 const fake=source();fake.projectedToModelMm=p(11);
 assert.throws(()=>run([fake]),/unverified original M4/);
 assert.throws(()=>run([source()],m4(),[signed(0,5,1),signed(5,10,1)]),
  /previously signed/);
});
