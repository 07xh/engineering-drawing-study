'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {extractDxfForReview}=require('../../recognition/offline-dxf-review.cjs');
const {newCadRoleReview,confirmCadModelUnits,reviewCadEntity,auditedCadConditions}=
 require('../../recognition/cad-role-review.cjs');
const p=(c,v)=>c+'\n'+v+'\n';
function fixture(unit=4){
 return Buffer.from(
  p(0,'SECTION')+p(2,'HEADER')+p(9,'$INSUNITS')+p(70,unit)+p(0,'ENDSEC')+
  p(0,'SECTION')+p(2,'ENTITIES')+
  p(0,'LINE')+p(5,'A1')+p(8,'givens')+
  p(10,0)+p(20,0)+p(11,40)+p(21,0)+
  p(0,'CIRCLE')+p(5,'A2')+p(8,'reference-answer')+
  p(10,20)+p(20,0)+p(40,20)+
  p(0,'DIMENSION')+p(5,'A3')+p(8,'annotations')+
  p(1,'R20')+p(42,20)+
  p(0,'SPLINE')+p(5,'A4')+p(8,'helper')+
  p(0,'ENDSEC')+p(0,'EOF'),'utf8');
}
const source=()=>extractDxfForReview(fixture());
test('08 roles keep reference answer out of given geometry after explicit user decisions',()=>{
 const s=source();let review=newCadRoleReview(s);
 assert.equal(auditedCadConditions(s,review).status,'review-incomplete');
 assert.throws(()=>reviewCadEntity(s,review,{
  expectedRevision:3,id:'cad-00001',role:'given',reviewedBy:'user'}),/stale/);
 review=confirmCadModelUnits(s,review,{
  expectedRevision:0,reviewedBy:'user',
  mmPerDxfUnit:1,confirmationSource:'matched-INSUNITS'});
 review=reviewCadEntity(s,review,{
  expectedRevision:1,id:'cad-00001',role:'given',reviewedBy:'user'});
 review=reviewCadEntity(s,review,{
  expectedRevision:2,id:'cad-00002',role:'reference-answer',
  reviewedBy:'user',reason:'finished geometry, not a problem given'});
 review=reviewCadEntity(s,review,{
  expectedRevision:3,id:'cad-00003',role:'given',reviewedBy:'user',
  dimension:{kind:'radius',value:20,unit:'mm',
   geometryRefs:['cad-00001']}});
 review=reviewCadEntity(s,review,{
  expectedRevision:4,id:'cad-00004',role:'exclude',reviewedBy:'user',
  reason:'unsupported spline is verified irrelevant to these givens'});
 const out=auditedCadConditions(s,review);
 assert.equal(out.status,'reviewed-cad-input-only');
 assert.equal(out.counts.given,2);
 assert.equal(out.counts['reference-answer'],1);
 assert.equal(out.geometryCandidates.length,1);
 assert.equal(out.geometryCandidates[0].sourceEntityId,'cad-00001');
 assert.equal(out.dimensionCandidates.length,1);
 assert.equal(out.dimensionCandidates[0].dimensionConstraintVerified,false);
 assert.equal(out.knownAndReferenceLayersReviewed,true);
 assert.equal(out.readyForIndependentSemanticInterpretation,true);
 assert.equal(out.independentBlindAnswerIsolationVerified,false);
 assert.equal(out.readyForM3,false);
 assert.equal(out.readyForV5,false);
 assert.equal(out.textbookWholeProblemVerified,false);
 assert.equal(s.entities[0].reviewStatus,'unconfirmed');
});
test('09 dimension refs must resolve to user-reviewed given geometry',()=>{
 const s=source();let r=newCadRoleReview(s);
 r=confirmCadModelUnits(s,r,{
  expectedRevision:0,reviewedBy:'user',mmPerDxfUnit:1,
  confirmationSource:'matched-INSUNITS'});
 assert.throws(()=>reviewCadEntity(s,r,{
  expectedRevision:1,reviewedBy:'user',id:'cad-00003',role:'given',
  dimension:{kind:'radius',value:20,unit:'mm',geometryRefs:[]}
 }),/dimension/);
 assert.throws(()=>reviewCadEntity(s,r,{
  expectedRevision:1,reviewedBy:'user',id:'cad-00003',role:'given',
  dimension:{kind:'radius',value:20,unit:'mm',geometryRefs:['cad-00004']}
 }),/invalid/);
 r=reviewCadEntity(s,r,{
  expectedRevision:1,id:'cad-00003',role:'given',reviewedBy:'user',
  dimension:{kind:'radius',value:20,unit:'mm',
   geometryRefs:['cad-00002']}});
 assert.deepEqual(auditedCadConditions(s,r).unresolvedEntityIds.includes('cad-00003'),true);
 r=reviewCadEntity(s,r,{
  expectedRevision:2,id:'cad-00002',role:'reference-answer',reviewedBy:'user'});
 assert.equal(auditedCadConditions(s,r).unresolvedEntityIds.includes('cad-00003'),true);
});
test('09 no header-only mm assumption or unsupported entity can be promoted as a given',()=>{
 const s=source(),s2=extractDxfForReview(fixture(0));
 let a=newCadRoleReview(s);
 assert.throws(()=>confirmCadModelUnits(s,a,{
  expectedRevision:0,reviewedBy:'user',mmPerDxfUnit:25.4,
  confirmationSource:'matched-INSUNITS'}),/INSUNITS/);
 assert.throws(()=>confirmCadModelUnits(s2,newCadRoleReview(s2),{
  expectedRevision:0,reviewedBy:'user',mmPerDxfUnit:1,
  confirmationSource:'matched-INSUNITS'}),/INSUNITS/);
 assert.throws(()=>reviewCadEntity(s,a,{
  expectedRevision:0,reviewedBy:'user',id:'cad-00004',role:'given'}),/unsupported/);
 assert.throws(()=>reviewCadEntity(s,a,{
  expectedRevision:0,reviewedBy:'user',id:'cad-00004',role:'exclude',
  reason:'bad'}),/explanation/);
 a=reviewCadEntity(s,a,{
  expectedRevision:0,reviewedBy:'user',id:'cad-00001',role:'given'});
 assert.throws(()=>auditedCadConditions(s2,a),/foreign/);
 const out=auditedCadConditions(s,a);
 assert.equal(out.readyForIndependentSemanticInterpretation,false);
 assert.equal(out.readyForM3,false);
 assert.equal(out.units.reviewed,false);
});
