'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {classifyAffineOpenSourceDepth:classify}=
 require('../../workbench/m5-c1-continuous-frontmost-source-rays.cjs');
const p=(x,y,z)=>({x,y,z});
const row=(from3D,to3D,depth0,depth1)=>({
 from3D,to3D,observerDepthAtFromMm:depth0,observerDepthAtToMm:depth1
});
test('strict front on open interval with real shared 3D start is analytic, not heuristic',()=>{
 const a=row(p(0,0,0),p(10,0,0),0,10);
 const b=row(p(0,0,0),p(5,0,0),0,5);
 const w=classify(a,b);
 assert.equal(w.relativeDepthProvenForWholeInterval,true);
 assert.equal(w.relation,'first-in-front');
 assert.equal(w.exactSharedPhysicalStart,true);
 assert.equal(w.strictOpenIntervalSharedPhysicalEndpointProven,true);
 assert.equal(w.officialLineStyleVerified,undefined);
});
test('strict front on open interval also accepts exact physical shared end',()=>{
 const a=row(p(10,0,0),p(0,0,0),10,0);
 const b=row(p(5,0,0),p(0,0,0),5,0);
 const w=classify(a,b);
 assert.equal(w.relativeDepthProvenForWholeInterval,true);
 assert.equal(w.exactSharedPhysicalEnd,true);
});
test('opposite strict depth still works and mathematically crossing is never signed',()=>{
 const a=row(p(0,0,1),p(0,0,3),-4,-1);
 const b=row(p(0,0,8),p(0,0,9),0,0);
 assert.equal(classify(a,b).relation,'second-in-front');
 const cross=row(p(0,0,1),p(0,0,3),-5,5);
 assert.equal(classify(cross,b).relativeDepthProvenForWholeInterval,false);
 assert.equal(classify(cross,b).relation,'interior-depth-switch-undetermined');
});
test('paper-coincident but distinct 3D endpoint never allows boundary-depth-tie promotion',()=>{
 // Same observer-depth at the start is not a real shared 3D junction.
 const a=row(p(0,3,0),p(10,3,0),0,10);
 const b=row(p(0,3,9),p(5,3,9),0,5);
 const w=classify(a,b);
 assert.equal(w.exactSharedPhysicalStart,false);
 assert.equal(w.relativeDepthProvenForWholeInterval,false);
 assert.equal(w.relation,'boundary-depth-tie-undetermined');
});
test('near-zero signed difference and entire 3D coincident source do not prove unique front',()=>{
 const x=row(p(0,0,0),p(10,0,0),1e-11,10);
 const y=row(p(0,0,0),p(5,0,0),0,5);
 assert.equal(classify(x,y).relativeDepthProvenForWholeInterval,false);
 const a=row(p(0,0,0),p(10,0,0),0,0);
 const b=row(p(0,0,0),p(10,0,0),0,0);
 assert.equal(classify(a,b).relativeDepthProvenForWholeInterval,false);
 assert.equal(classify(a,b).relation,'depth-tied-undetermined');
});
test('crossing, endpoint identity and physical endpoints must all be finite',()=>{
 assert.throws(()=>classify(row(p(0,0,0),p(1,0,0),NaN,0),
 row(p(0,0,0),p(1,0,0),0,0)),/finite/);
 assert.throws(()=>classify(row(p(0,0,0),p(1,0,0),0,1),
 row(p(0,0,0),p(1,0,0),0,0),0),/positive/);
});
