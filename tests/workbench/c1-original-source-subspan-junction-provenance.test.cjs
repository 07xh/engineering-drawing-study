'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1OriginalSourceSubspanJunctions:audit,
 certifyCanonicalOriginalM4SourcePartition:certifyPartition}=
 require('../../workbench/c1-original-source-subspan-junction-provenance.cjs');
const xyz=(x,y,z)=>({x,y,z});
const box=()=>{
 const g=prismMesh({solid:{min:xyz(-4,2,-6),max:xyz(21,17,30)}});
 return {...g,id:'C1JunctionBox'};
};
const tetra=()=>({
 id:'C1JunctionTetra',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{A:xyz(0,0,0),B:xyz(17,1,3),
 C:xyz(3,16,2),D:xyz(5,6,23)},
 edges:[['A','B'],['A','C'],['A','D'],
 ['B','C'],['B','D'],['C','D']],
 faces:[['A','B','C'],['A','B','D'],
 ['A','C','D'],['B','C','D']]}
});
function assertLedger(g,revision){
 const r=audit({geometry:g,revision});
 assert.equal(r.sourceGeometryId,g.id);
 assert.equal(r.revision,revision);
 assert.equal(r.signedV5ActionCount,0);
 assert.equal(r.constructionIntentAuthorized,false);
 assert.equal(r.wholeSolidV5Ready,false);
 assert.equal(r.m5OriginalContourAvailable,true);
 assert.equal(r.counts.originalSourceSubspanCount,
  r.rows.reduce((n,e)=>n+e.spans.length,0));
 assert.equal(r.counts.sourceEdgeViewCount,g.data.edges.length*3);
 assert.equal(r.counts.exactFullOriginalSourceViewPartitionsProven+
  r.counts.noncollapsedSourceViewPartitionsWithPositiveParameterGapsHeld+
  r.counts.collapsedSourceViewPartitionsConservativelyHeld,
  g.data.edges.length*3);
 assert.equal(r.allNoncollapsedCanonicalM4SourcePartitionsPositivelyCovered,
  r.counts.noncollapsedSourceViewPartitionsWithPositiveParameterGapsHeld===0);
 assert.equal(r.allOriginalSourceViewsAccountedIncludingCollapsed,true);
 assert.equal(r.allCanonicalOriginalM4SourceParameterPartitionsPositivelyCovered,
  r.counts.collapsedSourceViewPartitionsConservativelyHeld===0&&
  r.counts.noncollapsedSourceViewPartitionsWithPositiveParameterGapsHeld===0);
 assert.equal(r.nativeHLRGeneratedSourceIdentityAndM5VisibilityStillUnproven,true);
 assert.equal(new Set(r.rows.map(x=>x.view+'@'+x.sourceEdgeId)).size,
  g.data.edges.length*3);
 for(const row of r.rows){
  const partition=row.canonicalOriginalM4SourcePartition;
  assert.equal(row.allCanonicalOriginalSourceParameterSubspansCovered,
   partition.entireOriginalM4SourceParameterPartitionPositivelyProven);
  assert.equal(partition.entireOriginalM4SourceParameterPartitionPositivelyProven,
   partition.exactOriginalSourceParameterCoverage.entireOriginalParameterIntervalCovered);
  if(row.collapsedProjection){
   assert.deepEqual(partition.exactOriginalSourceParameterCoverage.
    positiveLengthUncoveredIntervals,[[0,1]]);
   assert.deepEqual(partition.exactOriginalSourceParameterCoverage.
    positiveLengthCoveredIntervals,[]);
  }else if(partition.entireOriginalM4SourceParameterPartitionPositivelyProven){
   assert.deepEqual(partition.exactOriginalSourceParameterCoverage.
    positiveLengthUncoveredIntervals,[]);
   assert.deepEqual(partition.exactOriginalSourceParameterCoverage.
    positiveLengthCoveredIntervals,[[0,1]]);
  }else{
   assert.ok(partition.exactOriginalSourceParameterCoverage.
    positiveLengthUncoveredIntervals.length>0);
   assert.ok(partition.projectedTinyButPositiveOriginalSourceIntervalsHeld.length>0);
  }
  assert.equal(partition.collapsedOriginalSourceProjection,row.collapsedProjection);
  assert.equal(partition.continuousM5VisibilityProven,false);
  assert.equal(partition.signedV5Action,false);
 }
 assert.ok(r.counts.originalVertexEndpointWitnesses>0);
 for(const row of r.rows)for(const s of row.spans){
  assert.equal(s.officialEngineeringLineStyle,'undetermined');
  assert.equal(s.signedV5Action,false);
  assert.equal(s.fromEndpoint.authorizedAsV5Junction,false);
  assert.equal(s.toEndpoint.authorizedAsV5Junction,false);
  assert.equal(s.allOtherPhysicalSourceIntersectionsCertified,false);
  assert.ok(s.fromEndpoint.trueCrossSourceOriginalVertexIds.every(e=>
   e.sameOriginalVertexId===s.fromEndpoint.originalVertexId));
  assert.ok(s.toEndpoint.trueCrossSourceOriginalVertexIds.every(e=>
   e.sameOriginalVertexId===s.toEndpoint.originalVertexId));
 }
 assert.ok(Object.isFrozen(r));
 return r;
}
test('current reviewed box can prove original physical vertex identities without certifying line styles',()=>{
 const g=box(),result=assertLedger(g,17);
 assert.ok(result.counts.authenticatedForeignOriginalVertexEncounters>0);
 assert.ok(result.rows.some(e=>e.spans.some(s=>
  s.fromEndpoint.trueCrossSourceOriginalVertexIds.length>0||
  s.toEndpoint.trueCrossSourceOriginalVertexIds.length>0)));
});
test('one source graph works on unbalanced true tetrahedron, no special cases',()=>{
 const g=tetra(),result=assertLedger(g,25);
 assert.ok(result.counts.originalVertexEndpointWitnesses>0);
 assert.ok(result.counts.paperOnlyForeignSourceEncounters>=0);
});
test('a 2D diagonal crossing has SAME-edge continuity but NEVER a different-edge 3D junction',()=>{
 // V=(x,z): AC and BD diagonal lines intersect on paper; their
 // original 3D y coordinates differ. M5 whole contour is intentionally
 // not accepted for this source; forensic M4 mode cannot sign styles.
 const g={id:'C1PaperOnlyDiagonals',kind:'mesh',
  space:'model-3d',unit:'mm',data:{
   points:{A:xyz(0,0,0),B:xyz(20,0,0),
    C:xyz(20,15,20),D:xyz(0,12,20)},
   edges:[['A','B'],['A','C'],['A','D'],
    ['B','C'],['B','D'],['C','D']],
   faces:[['A','B','C'],['A','B','D'],
    ['A','C','D'],['B','C','D']]}}
 const result=audit({geometry:g,revision:9,
  proofMode:'m4-projected-events-only'});
 assert.equal(result.m5OriginalContourAvailable,false);
 assert.equal(result.signedV5ActionCount,0);
 const ac=g.id+'::A|C',bd=g.id+'::B|D';
 const row=result.rows.find(x=>x.view==='V'&&x.sourceEdgeId===ac);
 assert.ok(row&&row.spans.length>=2,
  'real M4 projected diagonal intersection must split the same 3D edge');
 const [first,second]=row.spans;
 assert.equal(second.sameOriginalSource3DContinuityFromPriorPiece,true);
 assert.deepEqual(first.to3D,second.from3D);
 assert.ok(second.fromEndpoint.paperOnlyOtherSourceEdgeIds.includes(bd));
 assert.equal(second.fromEndpoint.trueCrossSourceOriginalVertexIds.length,0);
 assert.equal(second.fromEndpoint.anotherOriginalSource3DPointInferred,false);
 assert.equal(second.signedV5Action,false);
});
test('invalid current geometry and revision fail before certifying physical connections',()=>{
 const g=box();
 assert.throws(()=>audit({geometry:g,revision:0}),/revision/);
 assert.throws(()=>audit({geometry:{...g,
  data:{...g.data,faces:g.data.faces.slice(1)}},revision:8}),
 /closed|face|Euler/);
 assert.throws(()=>audit({geometry:{...g,
  data:{...g.data,edges:[...g.data.edges,[...g.data.edges[0]]]}},revision:8}),
 /duplicate|declared|explicit finite|Euler/);
});

test('exact M4 cut-to-source-subspan bijection certifies a complete original edge without signing visibility or V5',()=>{
 const r=certifyPartition([0,.25,.5,1],[
  {originalParameterRange:[0,.25]},
  {originalParameterRange:[.25,.5]},
  {originalParameterRange:[.5,1]}
 ]);
 assert.equal(r.entireOriginalM4SourceParameterPartitionPositivelyProven,true);
 assert.equal(r.everyCanonicalM4CutHasExactlyOneAdjacentSourceSubspan,true);
 assert.deepEqual(r.exactOriginalSourceParameterCoverage.
  positiveLengthCoveredIntervals,[[0,1]]);
 assert.equal(r.generatedHLRSourceIdentityProven,false);
 assert.equal(r.continuousM5VisibilityProven,false);
 assert.equal(r.engineeringLineStyleSigned,false);
 assert.equal(r.signedV5Action,false);
 assert.equal(Object.isFrozen(r.exactOriginalSourceParameterCoverage),true);
});
test('missing a positive one-ULP original 3D parameter cut interval cannot be concealed by subspan count',()=>{
 const half=.5,next=half+Number.EPSILON/2; // exact next binary64 above 0.5
 assert.throws(()=>certifyPartition([0,half,next,1],[
  {originalParameterRange:[0,half]},
  {originalParameterRange:[next,1]}
 ]),/missing, duplicated, overlapping or reordered/);
 // Same number of pieces but duplicate first interval and omit the ULP
 // interval: count-only ledgers would have accepted this.
 assert.throws(()=>certifyPartition([0,half,next,1],[
  {originalParameterRange:[0,half]},
  {originalParameterRange:[0,half]},
  {originalParameterRange:[next,1]}
 ]),/missing, duplicated, overlapping or reordered/);
});
test('canonical M4 coverage rejects reordered, overlapping, forged, truncated and nonfinite original 3D source partitions',()=>{
 const span=(a,b)=>({originalParameterRange:[a,b]});
 const cuts=[0,.4,1];
 assert.throws(()=>certifyPartition(cuts,[span(.4,1),span(0,.4)]),
  /reordered/);
 assert.throws(()=>certifyPartition(cuts,[span(0,.5),span(.4,1)]),
  /overlapping/);
 assert.throws(()=>certifyPartition(cuts,[span(0,.4),span(.4,.9)]),
  /missing/);
 assert.throws(()=>certifyPartition(cuts,[span(0,.4),span(.4,1),span(.4,1)]),
  /incomplete canonical/);
 assert.throws(()=>certifyPartition([0,NaN,1],[span(0,.4),span(.4,1)]),
  /incomplete canonical/);
 assert.throws(()=>certifyPartition([0,.4,.4,1],[
  span(0,.4),span(.4,.4),span(.4,1)
 ]),/incomplete canonical/);
});

test('legitimate observer-axis collapsed 3D source edge remains a point, not a falsely certified projected line',()=>{
 const r=certifyPartition([0,1],[],{collapsedProjection:true});
 assert.equal(r.collapsedOriginalSourceProjection,true);
 assert.equal(r.sourceOpenParameterCoverageNotRepresentableAsPaperLine,true);
 assert.equal(r.entireOriginalM4SourceParameterPartitionPositivelyProven,false);
 assert.deepEqual(r.exactOriginalSourceParameterCoverage.
  positiveLengthUncoveredIntervals,[[0,1]]);
 assert.equal(r.engineeringLineStyleSigned,false);
 assert.equal(r.signedV5Action,false);
 assert.throws(()=>certifyPartition([0,1],[
  {originalParameterRange:[0,1]}
 ],{collapsedProjection:true}),/collapsed original source/);
});

test('independent 3D V/H/W reprojection rejects forged collapsed flags while preserving real near-axis conservative holds',()=>{
 const from=xyz(0,0,0),axis=xyz(0,7,0),
  nearAxis=xyz(5e-9,7,0),full=xyz(1,7,0);
 const evidence=(to,collapsed,view='V')=>({
  collapsedProjection:collapsed,original3DFrom:from,
  original3DTo:to,view
 });
 const trulyPoint=certifyPartition([0,1],[],evidence(axis,true));
 assert.equal(trulyPoint.entireOriginalM4SourceParameterPartitionPositivelyProven,false);
 assert.deepEqual(trulyPoint.exactOriginalSourceParameterCoverage.
  positiveLengthUncoveredIntervals,[[0,1]]);
 // A real nonzero 5e-9 mm first-angle paper edge is still conservatively
 // held by the upstream 1e-8 mm budget, not certified as a drawable line.
 const near=certifyPartition([0,1],[],evidence(nearAxis,true));
 assert.equal(near.entireOriginalM4SourceParameterPartitionPositivelyProven,false);
 assert.equal(near.signedV5Action,false);
 // Same exact physical source projects to an ordinary noncollapsed line
 // in H, where the y coordinate remains on the paper.
 assert.throws(()=>certifyPartition([0,1],[],evidence(axis,true,'H')),
  /contradicts independently recomputed/);
 assert.throws(()=>certifyPartition([0,1],[],evidence(full,true)),
  /contradicts independently recomputed/);
 assert.throws(()=>certifyPartition([0,1],[
  {originalParameterRange:[0,1]}
 ],evidence(axis,false)),/contradicts independently recomputed/);
 assert.throws(()=>certifyPartition([0,1],[],evidence(nearAxis,false)),
  /contradicts independently recomputed/);
 assert.throws(()=>certifyPartition([0,1],[],{
  collapsedProjection:true,original3DFrom:from,
  original3DTo:xyz(NaN,7,0),view:'V'
 }),/independent original M4 source projection evidence/);
 assert.throws(()=>certifyPartition([0,1],[],{
  collapsedProjection:true,original3DFrom:from,
  original3DTo:axis,view:'X'
 }),/independent original M4 source projection evidence/);
});
test('tiny projected M4 cut may be omitted for display but positive original 3D one-ULP parameter gap remains held',()=>{
 const half=.5,next=half+Number.EPSILON/2;
 const r=certifyPartition([0,half,next,1],[
  {originalParameterRange:[0,half]},
  {originalParameterRange:[next,1]}
 ],{
  original3DFrom:xyz(0,0,0),original3DTo:xyz(1,0,0),view:'V'
 });
 assert.equal(r.entireOriginalM4SourceParameterPartitionPositivelyProven,false);
 assert.deepEqual(r.projectedTinyButPositiveOriginalSourceIntervalsHeld,[[half,next]]);
 assert.deepEqual(r.exactOriginalSourceParameterCoverage.
  positiveLengthUncoveredIntervals,[[half,next]]);
 assert.equal(r.continuousM5VisibilityProven,false);
 assert.equal(r.signedV5Action,false);
});
test('a missing macroscopic source interval cannot be disguised as a tiny projected M4 omission',()=>{
 const r=[{originalParameterRange:[0,.4]},
  {originalParameterRange:[.6,1]}];
 assert.throws(()=>certifyPartition([0,.4,.6,1],r,{
  original3DFrom:xyz(0,0,0),original3DTo:xyz(10,0,0),view:'V'
 }),/missing, duplicated, overlapping or reordered/);
});
