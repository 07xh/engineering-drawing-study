'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1OriginalClosedEdgeRayContinuity:audit}=
 require('../../workbench/c1-m5-closed-original-edge-ray-continuity.cjs');
const {auditC1OriginalSourceSubspanJunctions}=
 require('../../workbench/c1-original-source-subspan-junction-provenance.cjs');
const P=(x,y,z)=>({x,y,z});
const makeBox=()=>{
 const g=prismMesh({solid:{min:P(0,0,0),max:P(10,10,10)}});
 return {...g,id:'C1ClosedEdgeRayBox'};
};
const makeOblique=()=>{
 const g=prismMesh({solid:{min:P(0,0,0),max:P(2,4,9)}});
 return {...g,id:'C1ClosedEdgeRaySkewHex',data:{...g.data,
  points:Object.fromEntries(Object.entries(g.data.points).map(
   ([id,p])=>[id,{x:p.x+p.y/2,y:p.y,z:p.z}]))}};
};
const makeTetra=()=>({id:'C1ClosedEdgeRayTetra',kind:'mesh',
 space:'model-3d',unit:'mm',data:{
 points:{A:P(0,0,0),B:P(17,1,3),C:P(3,16,2),D:P(5,6,23)},
 edges:[['A','B'],['A','C'],['A','D'],
  ['B','C'],['B','D'],['C','D']],
 faces:[['A','B','C'],['A','B','D'],
  ['A','C','D'],['B','C','D']]}
});
const edge=(g,a,b)=>g.id+'::'+[a,b].sort().join('|');
function check(g){
 const result=audit({geometry:g,revision:19});
 assert.equal(result.schema,
  'draftai-c1-m5-exact-closed-original-edge-ray-and-cut-continuity/1');
 assert.equal(result.sourceGeometryId,g.id);
 assert.equal(result.counts.originalSourceEdgeViews,g.data.edges.length*3);
 assert.equal(result.counts.original3DVertexRayEndpointWitnesses,
  g.data.edges.length*6);
 assert.equal(result.signedV5ActionCount,0);
 assert.equal(result.wholeSolidV5Ready,false);
 assert.equal(result.doesNotInfer3DVerticesAtPaperOnlyCuts,true);
 // The production M5 edge ray and real-OCCT final stroke consumers must
 // now use the SAME M4 original-source [0,1] positive coverage witness.
 assert.equal(result.counts.canonicalM4Original3DParameterPartitionsConsumed,
  g.data.edges.length*3);
 assert.equal(result.counts.canonicalM4PositiveLengthGapsHeld,
  result.rows.reduce((n,row)=>n+
   row.originalM4Canonical3DSourceParameterCoverage.
    positiveLengthUncoveredIntervals.length,0));
 assert.ok(Object.isFrozen(result));
 for(const row of result.rows){
  const proof=row.originalM4Canonical3DSourceParameterCoverage;
  assert.deepEqual(proof.originalParameterRange,[0,1]);
  assert.equal(row.originalM4PaperParameterPartitionComplete,
   row.originalM4Canonical3DSourcePartitionPositivelyProven&&
   !row.originalM4Canonical3DSourceCollapsedToPoint);
  if(!row.originalM4Canonical3DSourceCollapsedToPoint){
   assert.deepEqual(proof.positiveLengthUncoveredIntervals,
    row.missingProjectedPaperSourceParameterRanges);
   assert.equal(proof.entireOriginalParameterIntervalCovered,
    row.originalM4PaperParameterPartitionComplete);
  }else{
   assert.deepEqual(proof.positiveLengthUncoveredIntervals,[[0,1]]);
   assert.equal(row.fullProjectedVisibleSourceLineProven,false);
  }
  assert.equal(row.officialEngineeringLineStyle,'undetermined');
  assert.equal(row.signedV5Action,false);
  assert.equal(row.completePaperSceneAndFeatureTopologyProven,false);
  assert.ok(row.originalCutSubspans.every(c=>
   c.signedV5Action===false&&
   c.applicableLineType==='undetermined'&&
   c.physicalCrossSourceJunctionAtPaperCutsAuthorized===false));
  if(row.fullProjectedVisibleSourceLineProven){
   assert.equal(row.originalM4PaperParameterPartitionComplete,true);
   assert.equal(row.completeSourceOriginal3DRayClosedIntervalClear,true);
   assert.deepEqual(row.sourceOriginalVertexRayStatus,
    ['certified-clear','certified-clear']);
  }
 }
 return result;
}
test('box V FRONT physical edge ray closed clear through both exact vertices while back tangent never promoted',()=>{
 const g=makeBox(),result=check(g);
 const front=result.rows.find(x=>x.view==='V'&&
  x.originalPhysicalSourceEdgeId===edge(g,'V000','V001'));
 assert.ok(front,'actual first-angle front source edge');
 assert.equal(front.fullProjectedVisibleSourceLineProven,true);
 assert.equal(front.exactlyBothOriginalVertexForwardRaysClear,true);
 assert.ok(front.originalCutSubspans.length>=1);
 const back=result.rows.find(x=>x.view==='V'&&
  x.originalPhysicalSourceEdgeId===edge(g,'V010','V011'));
 assert.equal(back.fullProjectedVisibleSourceLineProven,false);
 assert.ok(back.sourceOriginalVertexRayStatus.every(s=>s==='undetermined'));
 assert.equal(back.completeSourceOriginal3DRayClosedIntervalClear,false);
});
test('oblique hexa preserves exact M4/M5 source continuity across subpixel endpoint tails without signing V5',()=>{
 const r=check(makeOblique());
 // The shared M4 source graph now RETAINS positive binary64 source tails.
 // M5 must not silently drop them or round [nextDown(1),1] away.
 assert.ok(r.counts.nonoriginalPaperCutEndpointsHeld>0);
 assert.ok(r.counts.same3DOriginalSourceCutJoinsPreserved>0);
 assert.equal(r.counts.nonCollapsedProjectionPartitionIncomplete,0);
 assert.equal(r.counts.missingPaperSourceParameterGapCount,0);
 assert.ok(r.rows.every(x=>x.projectionCollapsed||
  (x.originalM4Canonical3DSourcePartitionPositivelyProven===true&&
   x.originalM4PaperParameterPartitionComplete===true&&
   x.missingProjectedPaperSourceParameterRanges.length===0)));
 assert.ok(r.rows.some(x=>x.fullProjectedVisibleSourceLineProven));
 assert.ok(r.rows.some(x=>x.originalOpenEdgeStrictInteriorOcclusionProven));
 assert.ok(r.rows.every(x=>x.originalCutSubspans.every(y=>
  y.physicalCrossSourceJunctionAtPaperCutsAuthorized===false&&
  y.applicableLineType==='undetermined'&&y.signedV5Action===false)));
 assert.equal(r.signedV5ActionCount,0);
 assert.equal(r.wholeSolidV5Ready,false);
});
test('actual crossing diagonals in V paper view preserve ONE true 3D source edge through nonvertex M4 cut',()=>{
 // These genuine opposite tetra edges AC and BD cross in V(x,z)
 // while having different Y coordinates at the crossing.
 // Forensic M4-only M0 mode is mandatory here: no unproved hull,
 // engineering line style or V5 is signed as a result.
 const g={id:'C1PaperCrossOnlyForensic',kind:'mesh',
  space:'model-3d',unit:'mm',data:{
   points:{A:P(0,0,0),B:P(20,0,0),
    C:P(20,15,20),D:P(0,12,20)},
   edges:[['A','B'],['A','C'],['A','D'],
    ['B','C'],['B','D'],['C','D']],
   faces:[['A','B','C'],['A','B','D'],
    ['A','C','D'],['B','C','D']]}};
 const r=auditC1OriginalSourceSubspanJunctions({
  geometry:g,revision:7,proofMode:'m4-projected-events-only'});
 const ac=r.rows.find(x=>x.view==='V'&&
  x.sourceEdgeId===edge(g,'A','C'));
 assert.ok(ac&&ac.spans.length>=2);
 assert.ok(r.counts.sharedOriginalSourceNeighborJoins>0);
 assert.equal(ac.spans[1].sameOriginalSource3DContinuityFromPriorPiece,true);
 assert.deepEqual(ac.spans[0].to3D,ac.spans[1].from3D);
 assert.equal(ac.spans[1].fromEndpoint.originalVertexId,null);
 assert.equal(ac.spans[1].fromEndpoint.authorizedAsV5Junction,false);
 assert.equal(ac.spans[1].officialEngineeringLineStyle,'undetermined');
 assert.equal(r.m5OriginalContourAvailable,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('skew tetra full original face-support ray and endpoints agree without authorizing GB dashed or V5',()=>{
 const r=check(makeTetra());
 assert.ok(r.rows.some(x=>x.fullProjectedVisibleSourceLineProven));
 assert.ok(r.rows.some(x=>x.originalOpenEdgeStrictInteriorOcclusionProven));
 const hidden=r.rows.filter(x=>x.originalOpenEdgeStrictInteriorOcclusionProven);
 assert.ok(hidden.every(x=>x.signedV5Action===false&&
  x.officialEngineeringLineStyle==='undetermined'));
 assert.equal(r.counts.signedV5Actions,0);
});
test('nonpositive revision and fake closed convex topology never receive complete original 3D edge rays',()=>{
 const g=makeBox();
 assert.throws(()=>audit({geometry:g,revision:0}),/revision/);
 assert.throws(()=>audit({geometry:{...g,data:{...g.data,
  faces:g.data.faces.slice(1)}},revision:9}),/closed|Euler|face/);
});
