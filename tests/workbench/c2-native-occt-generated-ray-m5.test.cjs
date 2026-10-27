'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {verifiedConvexMeshHalfspaces}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {originalBoxGeometry,auditC2OcctGeneratedEdgeUnionRays}=
 require('../../workbench/c2-native-occt-generated-ray-m5.cjs');
const fixture=path.resolve(__dirname,
 '../fixtures/c2-l-shape-two-boxes-occt.json');
const python=path.resolve(__dirname,
 '../../tools/c2_occt_boolean_history_reference.py');
const manifest=JSON.parse(fs.readFileSync(fixture,'utf8'));
test('original two-box components share current M0 verified closed convex geometry',()=>{
 for(const component of manifest.components){
  const proof=verifiedConvexMeshHalfspaces(originalBoxGeometry(component));
  assert.equal(proof.status,'validated-closed-convex-mesh');
  assert.equal(proof.sourceFaceCount,6);
  assert.equal(proof.sourceEdgeCount,12);
 }
});
test('untrusted or stale OCCT-generated edge inventories never self-certify C2 lines',()=>{
 assert.throws(()=>auditC2OcctGeneratedEdgeUnionRays({
  manifest,nativeReport:{sourceRevision:manifest.revision}
 }),/current complete unsigned native OCCT/);
 assert.throws(()=>auditC2OcctGeneratedEdgeUnionRays({
  manifest:{...manifest,components:[manifest.components[0],manifest.components[0]]},
  nativeReport:{}
 }),/distinct current original/);
});
const nativeRequired=process.env.DRAFTAI_REQUIRE_NATIVE_OCCT==='1';
const hasOcp=spawnSync('python3',['-c','import OCP'],
 {timeout:15000}).status===0;
test('native OCP CI mode refuses silent skipped truth tests',()=>{
 if(nativeRequired)assert.equal(hasOcp,true,
  'DRAFTAI_REQUIRE_NATIVE_OCCT requires actual installed OCC bindings');
});
test('actual native OCCT 30 output edges get M0/M5 V/H/W continuous depth',{
 skip:!hasOcp&&'Native OCP/OpenCascade not installed in this CI runtime'
},()=>{
 const result=spawnSync('python3',[python,fixture],{
  encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024
 });
 assert.equal(result.status,0,result.stderr);
 const nativeReport=JSON.parse(result.stdout);
 const audit=auditC2OcctGeneratedEdgeUnionRays({
  manifest,nativeReport
 });
 assert.equal(audit.generatedNativeResultEdgeCount,30);
 assert.equal(audit.rows.length,90);
 assert.equal(audit.counts.physicalGeneratedEdges,22);
 assert.equal(audit.counts.coplanarNativeSubdivisions,8);
 assert.equal(audit.counts.undeterminedNativeFeatures,0);
 assert.equal(audit.counts.physicalGeneratedEdges+
  audit.counts.coplanarNativeSubdivisions,
  audit.generatedNativeResultEdgeCount);
 assert(audit.rows.some(x=>x.status==='coplanar-mesh-only-not-an-engineering-line'));

 assert(audit.counts.clear>0,
  'real visible full-open-ray generated physical edge evidence required');
 assert(audit.counts.hidden>0,
  'real obscured union BRep physical edge evidence required');
 assert.equal(audit.allFirstAngleWholeOriginalGeneratedEdgeRaysAudited,true);
 assert.equal(audit.completeBooleanBoundaryAndPaperJunctionsCertified,false);
 assert.equal(audit.signedV5ActionCount,0);
 assert(audit.rows.every(row=>row.V5ActionSignedOff===false&&
  row.officialEngineeringLineStyle==='undetermined'));
});
