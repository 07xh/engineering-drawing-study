'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ingestC1HlrCandidates}=require('../../workbench/c1-hlr-source-evidence-boundary.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS,VIEWS}=require('../../core/projection/conventions.js');
const sourceGeometry=[{id:'edge-A',start:{x:0,y:0,z:0},end:{x:10,y:0,z:0}},
{id:'edge-B',start:{x:0,y:5,z:0},end:{x:10,y:5,z:0}}];
const engine={package:'opencascade.js',version:'runtime-version-required'};
function fixture(){const hlrRuns={};for(const view of VIEWS){
 const src=sourceGeometry[0];hlrRuns[view]={observerRay:FIRST_ANGLE_OBSERVER_RAYS[view],
 edges:[{sourceEdgeId:src.id,hlrClass:'visible',start:project(src.start)[view],end:project(src.end)[view]}]};}
 return {revision:1,sourceGeometry,hlrRuns,engine};}
test('C1 actual-HLR boundary preserves V/H/W source identity but never signs V5',()=>{
 const r=ingestC1HlrCandidates(fixture());
 assert.equal(r.candidates.length,3);
 assert.ok(r.candidates.every(c=>c.sourceEdgeId==='edge-A'&&
  c.officialLineStyle==='undetermined'&&c.v5Ready===false));
 assert.equal(r.v5Ready,false);assert.equal(r.officialLineStylesVerified,false);
});
test('C1 rejects mismatched observer rays, fake sources and paper-only depth aliases',()=>{
 const f=fixture();f.hlrRuns.V.observerRay=FIRST_ANGLE_OBSERVER_RAYS.H;
 assert.throws(()=>ingestC1HlrCandidates(f),/observer ray/);
 const g=fixture();g.hlrRuns.V.edges[0].sourceEdgeId='unknown';
 assert.throws(()=>ingestC1HlrCandidates(g),/source mapping/);
 const h=fixture();h.hlrRuns.H.edges[0].sourceEdgeId='edge-B';
 assert.throws(()=>ingestC1HlrCandidates(h),/projection\/source mismatch/);
});
test('C1 rejects invented partial-edge attribution until explicit split mapping exists',()=>{
 const f=fixture();f.hlrRuns.V.edges[0].end.u=5;
 assert.throws(()=>ingestC1HlrCandidates(f),/unsupported split/);
});
