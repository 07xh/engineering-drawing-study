'use strict';
/**
 * This test runs ONLY in the pinned dedicated real-DXF CI workflow.
 * Unlike in-memory record mocks it uses actual ezdxf-created DXF entities,
 * original HEX handles, original entity coordinates, the isolated given/
 * reference partition and then the EXISTING source-review M3/QuickHull/M0/
 * M5/sole-V5 and the independent post-solve answer comparator.
 *
 * Synthetic DXF only: NOT an independently converted textbook DWG.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {compileReviewedC1DxfGivenToSoleV5}=
 require('../../workbench/c1-authenticated-dxf-to-reviewed-v5.cjs');
const {compareIsolatedC1DxfReferenceAfterSolve}=
 require('../../workbench/c1-isolated-dxf-reference-after-solve.cjs');
const geometry=[];
for(const x of [-2,3])for(const y of [-3,4])for(const z of [0,5])
 geometry.push({x,y,z});
const py=[
 'import sys,hashlib,json,pathlib',
 'import ezdxf',
 'sys.path.insert(0,sys.argv[1])',
 'from c1_textbook_dwg_evidence import inspect_dxf,partition_reference',
 'from c1_textbook_dxf_blind_packets import inspect_geometry_entities,build_blind_packets,write_isolated_packets',
 'root=pathlib.Path(sys.argv[2])',
 'shape=json.load(sys.stdin)',
 'doc=ezdxf.new(dxfversion="R2000")',
 'm=doc.modelspace()',
 'points={"H":[],"V":[]}',
 'for view in ("H","V"):',
 ' for p in shape:',
 '  xy=(p["x"],p["y"] if view=="H" else p["z"])',
 '  if xy in [e[0] for e in points[view]]:continue',
 '  ent=m.add_point((*xy,0),dxfattribs={"layer":"GIVEN"})',
 '  points[view].append((xy,ent.dxf.handle))',
 'refs=[]',
 'for a,b in [((0,0,0),(1,0,0)),((1,0,0),(1,1,0))]:',
 ' ent=m.add_line(a,b,dxfattribs={"layer":"ANSWER"})',
 ' refs.append(ent.dxf.handle)',
 'dxf=root/"independently-created-synthetic-cad.dxf"',
 'doc.saveas(dxf)',
 'entity_data=inspect_geometry_entities(dxf)',
 'inventory,records=inspect_dxf(dxf)',
 'given_handles=[h for v in ("H","V") for _xy,h in points[v]]',
 'sha=hashlib.sha256(b"synthetic-C1-dxf-not-real-textbook-DWG").hexdigest()',
 'dxf_sha=hashlib.sha256(dxf.read_bytes()).hexdigest()',
 'partition_path=root/"original-handle-partition.json"',
 'partition_path.write_text(json.dumps({"sourceSha256":sha,"givenHandles":given_handles,"referenceHandles":refs}))',
 'partition=partition_reference(inventory,records,sha,partition_path)',
 'indices={v:{tuple(x):i for i,(x,h) in enumerate(points[v])} for v in points}',
 'pairs=[{"firstIndex":indices["H"][(p["x"],p["y"])],"secondIndex":indices["V"][(p["x"],p["z"])]} for p in shape]',
 'frame={"originCad":[0,0],"scaleMmPerCadUnit":1,"uSign":1,"vSign":1}',
 'review={"sourceSha256":sha,"convertedDxfSha256":dxf_sha,',
 ' "originalSourceAssumption":"all-extreme-vertices-of-one-closed-convex-solid",',
 ' "originalSourceAssumptionReviewed":True,',
 ' "reviewedCorrespondences":pairs,',
 ' "givenViewVertices":{view:[{"handle":h,"endpoint":"point"} for _xy,h in points[view]] for view in ("H","V")},',
 ' "viewFrames":{"H":frame,"V":frame},"referenceFrame":frame,',
 ' "referenceStrokes":[{"handle":h,"style":"gb-t-4457.4-continuous-wide-visible-outline"} for h in refs]}',
 'given,answer=build_blind_packets(source_sha256=sha,dxf_sha256=dxf_sha,',
 ' partition=partition,review=review,entities=entity_data)',
 'write_isolated_packets(root/"GIVEN.json",root/"PRIVATE-ANSWER.json",given,answer,[dxf,partition_path])',
 'assert len(entity_data)==len(records)==len(given_handles)+len(refs)',
 'assert not inventory["unsupportedEntityTypes"]',
 'print(json.dumps({"sourceSha256":sha,"convertedDxfSha256":dxf_sha,',
 ' "actualCadEntityCount":len(entity_data),"sourceHandles":given_handles,',
 ' "referenceHandles":refs,"realTextbookDWGConverted":False}))'
].join('\n');
test('REAL ezdxf entities and handles: eight 3D corners from two genuine 4-point paper views through one M3/M0/M5/V5 and isolated reference check',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-real-dxf-ci-'));
 try{
  const run=spawnSync('python3',['-c',py,path.resolve(__dirname,'../../tools'),root],
   {input:JSON.stringify(geometry),encoding:'utf8',timeout:30000});
  assert.equal(run.status,0,run.stderr||run.stdout);
  const meta=JSON.parse(run.stdout);
  assert.equal(meta.realTextbookDWGConverted,false);
  assert.equal(meta.actualCadEntityCount,10);
  assert.equal(new Set(meta.sourceHandles).size,8);
  const given=JSON.parse(fs.readFileSync(path.join(root,'GIVEN.json'),'utf8'));
  assert.equal(given.views.H.length,4);
  assert.equal(given.views.V.length,4);
  assert.equal(given.reviewedCorrespondences.length,8);
  assert.equal(given.sourceSha256,meta.sourceSha256);
  assert.equal(given.convertedDxfSha256,meta.convertedDxfSha256);
  assert(!meta.referenceHandles.some(id=>JSON.stringify(given).includes(id)),
   'private real CAD answer handles leaked into M3 input');
  // Only now compute the official M5 source actions. The reference JSON is
  // intentionally not read before this source M3/M5/V5 solve finishes.
  const solved=await compileReviewedC1DxfGivenToSoleV5({
   givenPacket:given,revision:11,geometryId:'SyntheticRealDXFBox',
   confirmedReview:{
    sourceSha256:given.sourceSha256,
    convertedDxfSha256:given.convertedDxfSha256,
    confirmedCurrentRevision:11,confirmedGeometryId:'SyntheticRealDXFBox',
    originalGivenPointSetsChecked:true,
    allOriginalExtremeVerticesPresentChecked:true,
    closedConvexFaceAndEdgeTopologyReviewed:true,
    referenceAnswerWasNotUsedToConfirmTopology:true,
    explicitReviewedInputKind:'human-reviewed-original-candidate'
   },sheetTransform:{origin:{x:350,y:210},scale:4}
  });
  assert.equal(solved.solution.sceneResult.geometry.data.edges.length,12);
  assert.equal(solved.solution.singleOriginalV5Player,true);
  assert.equal(solved.solution.m0M3M5PhysicalSourceAcceptance.status,
   'bounded-original-source-math-acceptance');
  const reference=JSON.parse(fs.readFileSync(
   path.join(root,'PRIVATE-ANSWER.json'),'utf8'));
  assert.equal(reference.referenceStrokes.length,2);
  const check=compareIsolatedC1DxfReferenceAfterSolve({
   reviewedSourceResult:solved,isolatedReference:reference});
  assert.equal(check.privateAnswerHandlesNeverEnteredM3M5OrV5,true);
  assert.equal(check.exactlyStyledBidirectionalReferenceCoverage,false,
   'deliberately incomplete independent CAD reference must be rejected');
  assert.equal(check.realTextbookBlindTestPassed,false);
  assert.equal(check.completeC1DeliveryAuthorized,false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
