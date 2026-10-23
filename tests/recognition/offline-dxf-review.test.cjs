'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {extractDxfForReview}=require('../../recognition/offline-dxf-review.cjs');
const {privateCadReview}=require('../../scripts/extract-cad-dxf-review.cjs');
const pair=(code,val)=>String(code)+'\n'+String(val)+'\n';
const header=(unit=4)=>pair(0,'SECTION')+pair(2,'HEADER')+
 pair(9,'$ACADVER')+pair(1,'AC1018')+
 pair(9,'$INSUNITS')+pair(70,unit)+
 pair(0,'ENDSEC');
const entities=items=>pair(0,'SECTION')+pair(2,'ENTITIES')+
 items.map(([kind,properties])=>pair(0,kind)+
 properties.map(([k,v])=>pair(k,v)).join('')).join('')+
 pair(0,'ENDSEC')+pair(0,'EOF');
const raw=(items,unit=4)=>Buffer.from(header(unit)+entities(items),'utf8');
const line=(x1=2,y1=3,x2=24,y2=13)=>['LINE',[
 [5,'AA'],[8,'given-geometry'],[10,x1],[20,y1],[30,0],
 [11,x2],[21,y2],[31,0]
]];
const dim=['DIMENSION',[[5,'BB'],[8,'dim-annotation'],
 [1,'R10'],[2,'*D2'],[42,10],[70,32],[13,2],[23,3],[14,5],[24,8]]];
const arc=['ARC',[[5,'CC'],[8,'result-layer'],
 [10,20],[20,20],[30,0],[40,8],[50,30],[51,270]]];
const poly=['LWPOLYLINE',[[90,3],[70,1],[8,'centerlines'],
 [10,0],[20,0],[42,0],[10,10],[20,0],[42,1],
 [10,10],[20,10]]];
test('08 ASCII DXF extracts true model coordinates while preserving all annotations as unreviewed',()=>{
 const original=raw([line(),dim,arc,poly,
  ['CIRCLE',[[10,15],[20,9],[40,2.5]]],
  ['TEXT',[[10,6],[20,7],[40,3],[1,'孔径 Ø10']]]]);
 const r=extractDxfForReview(original);
 assert.equal(r.status,'requires-human-review');
 assert.equal(r.units.displayUnit,'mm');
 assert.equal(r.units.exactModelMmConfirmed,false);
 assert.equal(r.source.answerIsolationVerified,false);
 assert.equal(r.audit.readyForM3,false);
 assert.equal(r.audit.readyForConstructionIntent,false);
 assert.equal(r.audit.readyForV5,false);
 assert.equal(r.audit.candidateCount,6);
 assert.equal(r.audit.unassociatedDimensionCount,1);
 assert.match(r.source.sha256,/^[a-f0-9]{64}$/);
 const segment=r.entities[0];
 assert.equal(segment.geometry.from.x,2);
 assert.equal(segment.geometry.to.y,13);
 assert.equal(segment.handle,'AA');
 assert.equal(segment.layer,'given-geometry');
 assert.equal(segment.sourceKnownOrAnswer,'undetermined');
 assert.equal(segment.reviewStatus,'unconfirmed');
 assert.equal(r.entities[1].annotation.reportedMeasurement,10);
 assert.equal(r.entities[1].annotation.annotationMeasurementAccepted,false);
 assert.deepEqual(r.entities[1].annotation.geometryRefs,[]);
 assert.equal(r.entities[2].geometry.startDeg,30);
 assert.equal(r.entities[2].geometry.endDeg,270);
 assert.equal(r.entities[2].geometry.sweepAndBranchReviewed,false);
 assert.equal(r.entities[3].geometry.hasCurvedBulges,true);
 assert.equal(r.entities[3].geometry.exactArcReconstructionVerified,false);
 assert.equal(r.entities[5].annotation.rawText,'孔径 Ø10');
 assert.equal(r.entities.every(e=>e.userRole==='unclassified'),true);
 assert.equal(JSON.stringify(r).includes('readyForM3":true'),false);
 assert.equal(JSON.stringify(r).includes('correct-answer'),false);
});
test('08 nonstandard model objects/paper-space or nondefault OCS do not silently turn into source constraints',()=>{
 const r=extractDxfForReview(raw([
  line(),['INSERT',[[2,'BLOCKA'],[10,5],[20,8]]],
  ['SPLINE',[[70,8]]],
  ['LINE',[[67,1],[10,0],[20,0],[11,1],[21,2]]],
  ['ARC',[[10,0],[20,0],[40,5],[50,0],[51,40],[210,1],[220,0],[230,0]]],
  ['LWPOLYLINE',[[90,2],[10,1],[20,0],[10,2],[20,0],[39,2]]],
  ['LINE',[[410,'Layout2'],[10,2],[20,0],[11,8],[21,0]]]
 ]));
 assert.equal(r.audit.entityCount,7);
 assert.equal(r.audit.candidateCount,1);
 assert.equal(r.audit.unsupportedCount,6);
 for(const e of r.entities.slice(1)){
  assert.equal(e.status,'unsupported');
  assert.equal(e.geometry,null);
 }
 assert.equal(r.audit.allRequiredCadEntitiesSupported,false);
});
test('09 group parser refuses truncated malicious or binary CAD and unknown model coordinates',()=>{
 assert.throws(()=>extractDxfForReview(Buffer.from('AC1018\0')),/DWG/);
 assert.throws(()=>extractDxfForReview(Buffer.alloc(0)),/nonempty/);
 assert.throws(()=>extractDxfForReview(Buffer.from('0\nSECTION\n2\nENTITIES\n0\nLINE\n10\nNaN\n')),
  /incomplete|truncated/);
 assert.throws(()=>extractDxfForReview(raw([
  ['LINE',[[10,0],[20,0],[11,'Infinity'],[21,2]]]
 ])),/invalid numerical|unsupported/);
 const r=extractDxfForReview(raw([
  ['LINE',[[10,0],[20,0],[11,2],[21,3]]]
 ],0));
 assert.equal(r.units.displayUnit,'unitless');
 assert.equal(r.units.exactModelMmConfirmed,false);
 assert.equal(r.audit.readyForM3,false);
 const old=raw([line()]);
 assert.throws(()=>extractDxfForReview(old,{sourceDwgSha256:'not-a-digest'}),/fingerprint/);
});
test('09 local export with association is not accepted as proven matching DWG geometry',()=>{
 const dxf=raw([line()]),dwg=Buffer.alloc(1200);
 dwg.write('AC1018',0,'ascii');dwg.writeUInt32LE(448,13);
 dwg[468]=1;dwg[469]=2;dwg.writeUInt32LE(600,470);
 dwg.writeUInt32LE(60,474);dwg.writeUInt32LE(40,600);
 dwg.writeInt32LE(184,604);dwg.writeInt32LE(95,608);
 dwg.writeUInt16LE(1,612);dwg.writeUInt16LE(8,614);
 const manifest=privateCadReview(dxf,dwg);
 assert.equal(manifest.source.dwgPreflightStatus,'thumbnail-only');
 assert.match(manifest.source.sourceDwgSha256,/^[a-f0-9]{64}$/);
 assert.equal(manifest.source.originalDwgConversionProven,false);
 assert.equal(manifest.audit.exactOriginalDwgGeometryVerified,false);
 assert.equal(manifest.audit.independentTextbookResultComparison,false);
 assert.equal(manifest.audit.readyForV5,false);
});
