#!/usr/bin/env node
/**
 * Real reusable C1 math consumer regression, using pinned OpenCascade.js WASM.
 * Must NOT pass using stubs, screenshots, or pre-recorded CAD fixtures.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFileSync,statSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
const require=createRequire(import.meta.url);
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {compileC1WithOcjsHLR}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const {cuboidBounds,computeC1OcjsVisibleSegments}=
 require('../../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const {verifiedConvexMeshHalfspaces}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
async function main(){
const key='2.0.0-beta.b5ff984';
const root=resolve(process.argv[2]??'');
if(!process.argv[2])throw new TypeError('isolated OCJS package root required');
const pkg=resolve(root,'node_modules/opencascade.js');
const manifest=JSON.parse(readFileSync(resolve(pkg,'package.json'),'utf8'));
assert.equal(manifest.version,key,'fixed real distribution required');
const bytes=statSync(resolve(pkg,'dist/opencascade.full.wasm')).size;
assert.ok(bytes>=50_000_000,'true pinned HLR WASM binary absent');
const entry=pathToFileURL(resolve(pkg,'dist/node.js')).href;
const {default:init}=await import(entry);
const t0=performance.now();
const oc=await init();
const initMs=performance.now()-t0;
const xyz=(x,y,z)=>({x,y,z});
function reviewed(min,max,revision,id){
 const source=prismMesh({solid:{min,max}});
 return {input:{
  geometryId:id,confirmedBy:'user',topologyConfirmed:true,
  revision,unit:'mm',edges:source.data.edges.map(e=>[...e]),
  faces:source.data.faces.map(f=>[...f]),
  vertices:Object.entries(source.data.points).map(([vertexId,p])=>{
   const v=project(p);
   return {id:vertexId,knownViews:{V:[v.V.u,v.V.v],H:[v.H.u,v.H.v]}};
  })
 },sheetTransform:{origin:{x:350,y:195},scale:3}};
}
const cases=[
 ['unequal-translated',xyz(-4,5,-9),xyz(24,18,31),31],
 ['negative-coordinate',xyz(-73,-44,-21),xyz(-13,-7,19),32],
 ['anisotropic-translated',xyz(151,22,-32),xyz(154,73,-29),33]
];
const records=[];
for(const [id,min,max,revision] of cases){
 const args=reviewed(min,max,revision,'C1OCJS_'+id.replaceAll('-','_'));
 const begin=performance.now();
 const result=compileC1WithOcjsHLR({...args,oc});
 assert.equal(result.c1CadRuntime.revision,revision);
 assert.equal(result.c1CadRuntime.geometryId,args.input.geometryId);
 assert.equal(result.c1CadRuntime.secondV5,false);
 assert.equal(result.c1CadRuntime.newOfficialLineStyleSigner,false);
 assert.equal(result.globalVisibleContourProof.allThreeViewsGlobalContourCertified,true);
 assert.equal(result.verifiedLineIntentAndOriginalSingleV5Parity,true);
 assert.equal(result.certifiedVisibleContourLineActionCount,12);
 assert.equal(result.intents.length,result.steps.length);
 assert.equal(result.wholeSolidV5Ready,false);
 assert.deepEqual(Object.keys(result.c1CadRuntime.perView).sort(),['H','V','W']);
 for(const view of Object.values(result.c1CadRuntime.perView)){
  assert.ok(view.cadVisibleSegments>=4);
  assert.equal(view.m5SignedVisibleIntervals,4);
  assert.equal(view.sourceAndCoverageAgreement,true);
 }
 result.player.invalidate(revision+1,0);
 assert.equal(result.player.canRender(revision),false);
 records.push({case:id,revision,
  elapsedMs:Math.round(performance.now()-begin),
  views:result.c1CadRuntime.perView});
}
// Stop unsupported geometry rather than approving untracked occluded edges.
const bad=reviewed(xyz(0,0,0),xyz(10,12,14),35,'C1Unsupported');
const fake={...bad.input,edges:bad.input.edges.slice(1)};
assert.throws(()=>compileC1WithOcjsHLR({input:fake,
 sheetTransform:bad.sheetTransform,oc}),/closed|edge|invalid|topology|geometry/i);
assert.throws(()=>compileC1WithOcjsHLR({input:bad.input,
 sheetTransform:bad.sheetTransform,oc:{}}),/OpenCascade|API|BRep|OCJS|TopAbs/i);
const q=prismMesh({solid:{min:xyz(0,0,0),max:xyz(2,4,9)}});
const g={...q,id:'C1rotated',data:{
 ...q.data,points:Object.fromEntries(Object.entries(q.data.points).map(
 ([id,p])=>[id,{x:p.x+p.y/2,y:p.y,z:p.z}]))}};
assert.throws(()=>cuboidBounds(g),/axis-aligned|corner|cuboid|axis-adjacent/);
// Reuse the SAME WASM HLR computation for geometrically different
// M0-proven closed convex non-cuboids; not snapshots or hardcoded projections.
const t={
 id:'C1SkewTetra',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{
  A:xyz(0,0,0),B:xyz(17,1,3),C:xyz(3,16,2),D:xyz(5,6,23)},
  edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
  faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]
 }
};
const general=[g,t],polyhedra=[];
for(const [index,geometry] of general.entries()){
 const proof=verifiedConvexMeshHalfspaces(geometry);
 assert.equal(proof.status,'validated-closed-convex-mesh');
 const at=performance.now();
 const cad=computeC1OcjsVisibleSegments({oc,geometry,revision:40+index});
 assert.equal(cad.sourceCandidateOnly,true);
 assert.equal(cad.v5Authorized,false);
 assert.equal(cad.proofScope,'reviewed-closed-convex-polyhedral-shell');
 assert.deepEqual(Object.keys(cad.views).sort(),['H','V','W']);
 let count=0;
 const valid=new Set(geometry.data.edges.map(edge=>
  geometry.id+'::'+[...edge].sort().join('|')));
 for(const view of Object.values(cad.views)){
  assert.ok(view.length>=3);
  for(const seg of view){
   assert.ok(seg.projectedOriginalEdgeCandidates.length>0);
   assert.ok(seg.projectedOriginalEdgeCandidates.every(id=>valid.has(id)));
   assert.ok([seg.from.u,seg.from.v,seg.to.u,seg.to.v].every(Number.isFinite));
   count++;
  }
 }
 // The existing M3 point reconstruction -> M0/M5 positive theorem ->
 // canonical original V5 is the ONLY signing authority. Real OCJS source
 // edges must cover each positively signed contour, and unrelated visible
 // CAD creases must stay outside the issued ConstructionStep DAG.
 const reviewedInput={
  geometryId:geometry.id,confirmedBy:'user',topologyConfirmed:true,
  revision:40+index,unit:'mm',
  vertices:Object.entries(geometry.data.points).map(([id,p])=>{
   const paper=project(p);
   return {id,knownViews:{V:[paper.V.u,paper.V.v],
     H:[paper.H.u,paper.H.v]}};
  }),edges:geometry.data.edges.map(e=>[...e]),
  faces:geometry.data.faces.map(e=>[...e])
 };
 const m5=compileC1WithOcjsHLR({oc,input:reviewedInput,
  sheetTransform:{origin:{x:350,y:195},scale:3}});
 assert.equal(m5.c1CadRuntime.revision,40+index);
 assert.equal(m5.c1CadRuntime.supportedScope,'reviewed-closed-convex-polyhedral-shell');
 assert.equal(m5.c1CadRuntime.nonContourCADDrawingActionsSigned,0);
 assert.equal(m5.c1CadRuntime.secondV5,false);
 assert.equal(m5.wholeSolidV5Ready,false);
 assert.equal(m5.officialSolidLineStylesVerified,false);
 assert.equal(m5.verifiedLineIntentAndOriginalSingleV5Parity,true);
 assert.ok(m5.certifiedVisibleContourLineActionCount>=9);
 assert.ok(m5.c1CadRuntime.perView.V.sourceAndCoverageAgreement);
 assert.ok(m5.c1CadRuntime.perView.H.sourceAndCoverageAgreement);
 assert.ok(m5.c1CadRuntime.perView.W.sourceAndCoverageAgreement);
 const extra=Object.values(m5.c1CadRuntime.perView)
  .reduce((n,v)=>n+v.unsignedInteriorCadLines,0);
 const signedIds=new Set(m5.certifiedVisibleContourLineActionIds);
 assert.equal(signedIds.size,m5.certifiedVisibleContourLineActionCount);
 assert.ok(m5.steps.flatMap(s=>s.actions)
  .filter(a=>signedIds.has(a.id)).every(a=>a.kind==='line'));
 m5.player.invalidate(41+index,0);
 assert.equal(m5.player.canRender(40+index),false);
 polyhedra.push({geometryId:geometry.id,revision:40+index,
  authenticCadVisibleSegments:count,
  elapsedMs:Math.round(performance.now()-at),
  m5Signed:true,scopedOfficialVisibleContourLines:signedIds.size,
  unsignedInteriorCadLines:extra,uniqueV5:true});
}
// Preserve strict unsupported/degenerate source refusal.
assert.throws(()=>computeC1OcjsVisibleSegments({oc,
 geometry:{...t,data:{...t.data,faces:t.data.faces.slice(1)}},revision:55}),
 /convex|closed|face|Euler/i);
const report={
 schema:'draftai-c1-ocjs-runtime-compute-m5-consumer/1',
 wasmPackage:manifest.name,version:key,wasmBytes:bytes,
 initializedActualWasm:true,initializationMs:Math.round(initMs),
 computationalConsumers:records.length,records,
 genericConvexWasmConsumers:polyhedra.length,polyhedra,
 originalM5AuthorityPreserved:true,extraV5Players:0,
 productionBrowserBundled:false,androidAccepted:false
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');

}
main().catch(error=>{
 process.stderr.write('C1 OCJS CONSUMER FAILED: '+String(error?.message??error)+'\\n');
 process.stderr.write(String(error?.stack??'').split('\\n').slice(0,5).join('\\n')+'\\n');
 process.exitCode=1;
});
