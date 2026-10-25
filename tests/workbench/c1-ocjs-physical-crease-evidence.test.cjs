'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1OcjsPhysicalCreaseCandidates}=
 require('../../workbench/c1-ocjs-physical-crease-ray-evidence.cjs');
const v=(x,y,z)=>({x,y,z});
const box=()=>({...prismMesh({solid:{
 min:v(0,0,0),max:v(20,12,9)}}),id:'VerifiedC1'});
test('source-only non-hull C1 evidence refuses no real CAD kernel',()=>{
 const g=box();
 assert.throws(()=>auditC1OcjsPhysicalCreaseCandidates({
  oc:null,geometry:g,revision:7}),/real OCJS/);
 assert.throws(()=>auditC1OcjsPhysicalCreaseCandidates({
  oc:{},geometry:g,revision:0}),/real OCJS/);
});
test('unclosed and counterfeit source topology refuses any HLR result',()=>{
 const g=box();
 const missing={...g,data:{...g.data,faces:g.data.faces.slice(1)}};
 assert.throws(()=>auditC1OcjsPhysicalCreaseCandidates({
  oc:{},geometry:missing,revision:1}),/closed|face|Euler/);
 const repeated={...g,data:{...g.data,
  edges:[...g.data.edges,[...g.data.edges[0]]]}};
 assert.throws(()=>auditC1OcjsPhysicalCreaseCandidates({
  oc:{},geometry:repeated,revision:1}),/Euler|duplicate|declared/);
});
test('uninitialized CAD cannot be substituted by user supplied HLR candidate booleans',()=>{
 const g=box();
 assert.throws(()=>auditC1OcjsPhysicalCreaseCandidates({
  oc:{},geometry:g,revision:8,
  cad:{sourceGeometryId:g.id,v5Authorized:true,views:{V:[],H:[],W:[]}},
  signedLineStyle:true}),/OCJS|TopAbs|BRep/);
});
