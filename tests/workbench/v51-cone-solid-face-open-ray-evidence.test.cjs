'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSpatialV5Preview}=
 require('../../workbench/cone-spatial-v5-preview.cjs');
const {coneSolidFaceRayEvidence:faces}=
 require('../../workbench/cone-solid-face-ray-evidence.cjs');
const P=(x,y,z)=>({x,y,z});
const cone={baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'};
const p=(n=P(1,0,3),z=6)=>({
 point:P(0,0,z),normal:n,modelUnit:'mm'
});
const proof=(plane=p(),kind='full-ellipse',z=6,revision=17)=>
 coneSpatialV5Preview(cone,plane,{
  kind,sourceConfirmed:true,revision,samples:64,
  presentationMode:'split-sheet',provenGuideDag:true
 }).spatialIntent;
test('04 strict full ellipse retained apex local cut-face ray is inward/parallel per V H W',()=>{
 const intent=proof(),out=faces(intent,{retainedHalfspace:'positive'});
 assert.equal(out.status,'strict-face-interior-evidence');
 assert.equal(out.retainedPiece,'apex');
 assert.equal(out.faceInteriorValidated,true);
 assert.ok(out.coneInteriorMarginMm>1e-7);
 assert.equal(out.views.V.cutFace.visibility,'undetermined');
 assert.equal(out.views.H.cutFace.visibility,'hidden');
 assert.equal(out.views.W.cutFace.visibility,'hidden');
 assert.equal(out.views.H.baseFace,null);
 assert.equal(out.cutFaceOpenInteriorRayCertified,true);
 assert.equal(out.completeSolidVisibilityVerified,false);
 assert.equal(out.visibilityEndpointsVerified,false);
 assert.equal(out.V5ProofPromotionAllowed,false);
});
test('04 complementary retained base face yields outward cut face and inward base under H',()=>{
 const out=faces(proof(),{retainedHalfspace:'negative'});
 assert.equal(out.status,'strict-face-interior-evidence');
 assert.equal(out.retainedPiece,'base');
 assert.equal(out.views.H.cutFace.visibility,'visible');
 assert.equal(out.views.W.cutFace.visibility,'visible');
 assert.equal(out.views.V.cutFace.visibility,'undetermined');
 assert.equal(out.views.H.baseFace.visibility,'hidden');
 assert.equal(out.views.V.baseFace.visibility,'undetermined');
 assert.equal(out.views.W.baseFace.visibility,'undetermined');
 assert.equal(out.baseFaceOpenInteriorRayCertified,true);
 assert.equal(out.completeSolidVisibilityVerified,false);
});
test('09 normal reversal plus retained-halfspace reversal is the same convex cut body',()=>{
 const a=faces(proof(p(P(1,0,3))),{retainedHalfspace:'positive'});
 const b=faces(proof(p(P(-1,0,-3))),{retainedHalfspace:'negative'});
 assert.equal(a.retainedPiece,b.retainedPiece);
 for(const v of ['V','H','W']){
  assert.equal(a.views[v].cutFace.visibility,b.views[v].cutFace.visibility);
  assert.deepEqual(a.views[v].cutFace.planeSupportNormal,
   b.views[v].cutFace.planeSupportNormal);
 }
});
test('09 clipped sector, incorrect source and reversed eye rays do not promote scope',()=>{
 const incomplete=faces(proof(p(P(1,0,3),1),'clipped-ellipse'),{
  retainedHalfspace:'positive'});
 assert.equal(incomplete.status,'not-verified');
 assert.equal(incomplete.completeSolidVisibilityVerified,false);
 const src=proof();
 assert.throws(()=>faces(src),/halfspace/);
 assert.throws(()=>faces({...src,revision:100},{
  retainedHalfspace:'positive'}),/validated/);
 assert.throws(()=>faces(src,{retainedHalfspace:'positive',observerDirections:{
  V:P(0,1,0),H:P(0,0,1),W:P(1,0,0)}}),/observer ray conflicts/);
 const original=JSON.stringify(src);
 faces(src,{retainedHalfspace:'negative'});
 assert.equal(JSON.stringify(src),original);
});
