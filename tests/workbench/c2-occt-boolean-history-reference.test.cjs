'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const script=path.resolve(__dirname,'../../tools/c2_occt_boolean_history_reference.py');
const fixture=path.resolve(__dirname,'../fixtures/c2-l-shape-two-boxes-occt.json');
const available=spawnSync('python3',['-c','import OCP'],{timeout:15000}).status===0;
const run=file=>spawnSync('python3',[script,file],{
 encoding:'utf8',timeout:30000});
test('C2 OCCT reference requires real source revision and non-degenerate boxes',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c2-occt-input-'));
 try{
  const file=path.join(folder,'wrong.json');
  fs.writeFileSync(file,JSON.stringify({revision:0,
   components:[{id:'One',type:'box',min:[0,0,0],max:[1,2,3]},
    {id:'Two',type:'box',min:[1,0,0],max:[2,2,3]}]}));
  const r=run(file);
  assert.equal(r.status,2);
  assert.match(r.stderr,/source geometry revision|safe positive source revision/);
  fs.writeFileSync(file,JSON.stringify({revision:1,
   components:[{id:'One',type:'box',min:[0,0,0],max:[1,2,3]},
    {id:'One',type:'box',min:[1,0,0],max:[2,2,3]}]}));
  const duplicate=run(file);
  assert.equal(duplicate.status,2);
  assert.match(duplicate.stderr,/unique stable box source/);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
test('actual OCCT TopoDS history accounts for every fused nonconvex L-edge',{
 skip:!available&&'OCP/OpenCascade not installed in this CI environment'
},()=>{
 const r=run(fixture);
 assert.equal(r.status,0,r.stderr);
 const x=JSON.parse(r.stdout);
 assert.equal(x.status,'valid-occt-boolean-history-reference-only');
 assert.equal(x.resultFaceCount,14);
 assert.equal(x.resultEdgeCount,30);
 assert.equal(x.resultVertexCount,18);
 assert.equal(x.allResultEdgesHaveSameRunActualTopoDSHistorySupport,true);
 assert.equal(x.outputEdges.length,30);
 assert.equal(x.allFinalGeneratedEdgeEndpointsMappedToSameRunNativeTopoDSVertices,true);
 assert.equal(x.allResultNativeVertexIncidenceAccountedFor,true);
 assert.equal(x.resultVertexIncidence.length,18);
 assert(x.resultVertexIncidence.every(v=>
  v.genuineTopoDSIsSameJunctionProven===true&&
  v.incidentFinalTopoDSEdgeOrdinals.length>=2));
 assert(x.outputEdges.every(e=>
  e.actualNativeTopoDSVertexOrdinals.length===2&&
  e.actualNativeTopoDSVertexOrdinals[0]!==e.actualNativeTopoDSVertexOrdinals[1]&&
  e.nativeTopologicalEndpointJoinSource==='same-run-result-TopoDS-vertex-IsSame'));
 assert.equal(x.allResultEdgesHaveExactlyTwoRealNativeIncidentFaces,true);
 assert.equal(x.certifiedNativePhysicalCreaseEdgeCount,22);
 assert.equal(x.certifiedNativeCoplanarSubdivisionEdgeCount,8);
 assert.equal(x.ambiguousNativeDihedralEdgeCount,0);
 assert(x.outputEdges.every(e=>
  e.currentNativeResultEdgeHasExactlyTwoIncidentFaces===true&&
  e.currentNativeResultFaceOutwardNormals.length===2&&
  Number.isFinite(e.currentNativeResultDihedralAngleRad)&&
  !(e.currentNativeResultPhysicalCreaseVerified&&
    e.currentNativeResultCoplanarSubdivisionVerified)));
 assert.equal(x.certifiedNativePhysicalCreaseEdgeCount+
  x.certifiedNativeCoplanarSubdivisionEdgeCount+
  x.ambiguousNativeDihedralEdgeCount,x.resultEdgeCount);
 assert(x.outputEdges.every(e=>e.originalTopoDSHistory.length>0));
 assert(x.resultEdgesWithDirectOriginalEdgeHistory>0);
 assert.equal(x.sourceBooleanIntersectionFeatureTopologicallyAccountedFor,true);
 assert.equal(x.completeProjectedOcclusionAndGBLineStylesCertified,false);
 assert.equal(x.signedV5ActionCount,0);
 assert.equal(x.realTextbookBlindTestPassed,false);
});


test('native input fingerprint changes when only original box dimensions change',()=>{
 const code=[
  'import sys,json',
  'sys.path.insert(0,sys.argv[1])',
  'from c2_occt_boolean_history_reference import source_manifest_fingerprint',
  'data=json.loads(open(sys.argv[2],encoding="utf-8").read())',
  'first=source_manifest_fingerprint(data)',
  'data["components"][1]["max"][1]+=0.25',
  'second=source_manifest_fingerprint(data)',
  'assert first!=second',
  'assert len(first)==64 and len(second)==64',
  'print(first)'
 ].join('\n');
 const r=spawnSync('python3',['-c',code,path.dirname(script),fixture],
  {encoding:'utf8',timeout:15000});
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout.trim(),/^[0-9a-f]{64}$/);
});
