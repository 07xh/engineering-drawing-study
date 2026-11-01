'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {reviewC1M5FinalStrokeObligations:review}=
 require('../../workbench/c1-m5-final-source-obligation-review.cjs');
const required=[
 'realPhysicalCreaseNotProven','existingOuterContourHasOriginalV5Authority',
 'wholeSingleConvexOpenRayNotPositivelyClear','strictWholeSingleConvexOpenRayHidden',
 'originalSourceUniquenessNotProvenEvenAfterExactM0Pruning',
 'alreadyBehindAnotherOriginalPhysicalSource',
 'exactOriginal3DDuplicateNeedsCanonicalReduction',
 'sourceListFrontmostNotEstablished',
 'sourceCrossEdgeJunctionsNotGloballyCertified',
 'projectedPaperOnlyEncountersNeedGlobalResolution',
 'completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified',
 'applicableStandardEngineeringLineStyleNotCertified',
 'originalConstructionIntentDAGAndSingleV5NotAuthorized'
];
function span(overrides={}){
 const blockers=Object.fromEntries(required.map(x=>[x,false]));
 for(const key of [
  'sourceCrossEdgeJunctionsNotGloballyCertified',
  'completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified',
  'applicableStandardEngineeringLineStyleNotCertified',
  'originalConstructionIntentDAGAndSingleV5NotAuthorized'
 ])blockers[key]=true;
 return {sourceGeometryId:'G',revision:1,view:'V',sourceEdgeId:'G::A|B',
  originalSourceParameterRange:[0,1],blockers,
  positiveLineLikeGeometryReadyForFurtherM5Proof:true,
  formalStandardLineStyle:'undetermined',
  certifiedEngineeringSolidLine:false,certifiedEngineeringDashedLine:false,
  constructionIntentAuthorized:false,signedV5Action:false,...overrides};
}
function ledger(rows=[span()],overrides={}){
 return {schema:'draftai-c1-m5-recomputed-real-wasm-final-source-obligations/1',
  sourceGeometryId:'G',revision:1,
  realCADAndM5RecomputedFromCurrentOriginalReviewedSource:true,
  signedV5ActionCount:0,wholeSolidV5Ready:false,
  counts:{totalOriginalSourceEdgeViewSubspans:rows.length},
  subspans:rows,...overrides};
}
test('positive local geometry remains unsigned and exposes independent global proof gaps',()=>{
 const result=review(ledger());
 assert.equal(result.localPositiveCount,1);
 assert.equal(result.fullyCertifiedCount,0);
 assert.equal(result.signedV5ActionCount,0);
 assert.equal(result.rows[0].formalLineStyle,'undetermined');
 assert.ok(result.rows[0].blockingReasons.includes(
  'completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified'));
 assert.deepEqual(result.rows[0].independentGlobalProofGaps,{
  original3DSourceIdentity:true,
  completeIntervalVisibility:true,
  endpointAndProjectionTopology:true,
  engineeringLineStandard:true,
  soleConstructionIntentDAGV5:true
 });
 assert.ok(Object.isFrozen(result.rows[0].blockingReasons));
 assert.ok(Object.isFrozen(result.rows[0].independentGlobalProofGaps));
});
test('forged official line style, V5 action or missing global blocker is rejected',()=>{
 assert.throws(()=>review(ledger([span({signedV5Action:true})])),/signed/);
 assert.throws(()=>review(ledger([span({formalStandardLineStyle:'solid'})])),/signed/);
 for(const key of [
  'applicableStandardEngineeringLineStyleNotCertified',
  'originalConstructionIntentDAGAndSingleV5NotAuthorized',
  'completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified',
  'sourceCrossEdgeJunctionsNotGloballyCertified'
 ]){
  const row=span();row.blockers[key]=false;
  assert.throws(()=>review(ledger([row])),/global signoff/);
 }
});
test('missing blocker, stale revision and ledger count mismatch fail closed',()=>{
 const missing=span();delete missing.blockers.sourceCrossEdgeJunctionsNotGloballyCertified;
 assert.throws(()=>review(ledger([missing])),/invalid/);
 const stale=span({revision:2});
 assert.throws(()=>review(ledger([stale])),/stale/);
 assert.throws(()=>review(ledger([span()],{counts:{totalOriginalSourceEdgeViewSubspans:2}})),
  /count mismatch/);
});
test('source intervals must be finite, positive and within the original M0 [0,1] domain',()=>{
 for(const interval of [[0,Infinity],[-Number.MIN_VALUE,1],[0,1+Number.EPSILON],[0,0],[1,0]]){
  assert.throws(()=>review(ledger([span({originalSourceParameterRange:interval})])),
   /invalid original source parameter domain|invalid, stale or prematurely signed/);
 }
});
test('duplicated canonical source intervals are rejected instead of inflating completeness',()=>{
 const row=span();
 assert.throws(()=>review(ledger([row,{...row,blockers:{...row.blockers},
  originalSourceParameterRange:[...row.originalSourceParameterRange]}])),
  /duplicate original 3D source interval/);
});
test('disjoint source pieces remain separately represented and never gain global V5 authority',()=>{
 const first=span({originalSourceParameterRange:[0,.4]});
 const second=span({originalSourceParameterRange:[.4,1]});
 const result=review(ledger([first,second]));
 assert.equal(result.total,2);
 assert.equal(result.rows.length,2);
 assert.equal(result.fullyCertifiedCount,0);
 assert.equal(result.signedV5ActionCount,0);
 assert.ok(result.rows.every(x=>x.formalLineStyle==='undetermined'&&
  x.constructionIntentAuthorized===false&&x.signedV5Action===false));
});

test('overlapping positive original source intervals cannot inflate M5 review completeness',()=>{
 const first=span({originalSourceParameterRange:[0,.5]});
 const overlap=span({originalSourceParameterRange:[.5-Number.EPSILON,1]});
 assert.throws(()=>review(ledger([first,overlap])),/overlapping original 3D source intervals/);
 const distinct=span({view:'H',originalSourceParameterRange:[.5-Number.EPSILON,1]});
 assert.equal(review(ledger([first,distinct])).total,2);
});

test('blank geometry and original edge identifiers never enter the unsigned proof ledger',()=>{
 assert.throws(()=>review(ledger([span()],{sourceGeometryId:'  '})),/canonical unsigned/);
 for(const sourceEdgeId of ['', '  '])
  assert.throws(()=>review(ledger([span({sourceEdgeId})])),/invalid, stale/);
});

test('source IDs containing delimiters cannot collide with source interval keys',()=>{
 const a=span({sourceEdgeId:'edge@0@1',originalSourceParameterRange:[0,1]});
 const b=span({sourceEdgeId:'edge',originalSourceParameterRange:[0,1]});
 assert.equal(review(ledger([a,b])).total,2);
 const c=span({sourceEdgeId:'edge@part',originalSourceParameterRange:[0,.5]});
 const d=span({sourceEdgeId:'edge@part',originalSourceParameterRange:[.5,1]});
 assert.equal(review(ledger([c,d])).total,2);
});

test('audited view coverage is derived from actual rows, not a claimed V/H/W completion',()=>{
 const result=review(ledger([
  span({view:'W',sourceEdgeId:'G::A|B'}),
  span({view:'V',sourceEdgeId:'G::A|B'})
 ]));
 assert.deepEqual(result.viewsRepresented,['V','W']);
 assert.equal(result.fullyCertifiedCount,0);
 assert.equal(result.signedV5ActionCount,0);
 assert.ok(Object.isFrozen(result.viewsRepresented));
});

test('M5 reports exact positive [0,1] original-source holes without epsilon or a signed line',()=>{
 const tiny=Number.MIN_VALUE;
 const result=review(ledger([
  span({view:'W',sourceEdgeId:'G::A|C',
   originalSourceParameterRange:[tiny,.5]}),
  span({view:'W',sourceEdgeId:'G::A|C',
   originalSourceParameterRange:[.5,1-tiny]}),
  span({view:'H',sourceEdgeId:'G::A|D',
   originalSourceParameterRange:[0,.25]}),
  span({view:'H',sourceEdgeId:'G::A|D',
   originalSourceParameterRange:[.75,1]})
 ]));
 // 1 - Number.MIN_VALUE rounds to 1 in binary64. The leading
 // positive subnormal gap must nevertheless survive unchanged.
 assert.deepEqual(result.uncoveredOriginalParameterRanges,[
  {view:'W',sourceEdgeId:'G::A|C',originalSourceParameterRange:[0,tiny]},
  {view:'H',sourceEdgeId:'G::A|D',originalSourceParameterRange:[.25,.75]}
 ]);
 assert.equal(result.observedSourceViewsWithUncoveredOriginalParameters,2);
 assert.equal(result.fullyCertifiedCount,0);
 assert.equal(result.signedV5ActionCount,0);
 assert.ok(Object.isFrozen(result.uncoveredOriginalParameterRanges));
 assert.ok(Object.isFrozen(result.uncoveredOriginalParameterRanges[0].originalSourceParameterRange));
});

test('adjacent complete source pieces do not manufacture a positive M5 hole',()=>{
 const result=review(ledger([
  span({originalSourceParameterRange:[0,.25]}),
  span({originalSourceParameterRange:[.25,.5]}),
  span({originalSourceParameterRange:[.5,1]})
 ]));
 assert.deepEqual(result.uncoveredOriginalParameterRanges,[]);
 assert.equal(result.observedSourceViewsWithUncoveredOriginalParameters,0);
 assert.equal(result.signedV5ActionCount,0);
});

test('distinct view/source partitions never cover one another’s positive gap',()=>{
 const result=review(ledger([
  span({view:'V',sourceEdgeId:'G::A|B',originalSourceParameterRange:[0,.5]}),
  span({view:'H',sourceEdgeId:'G::A|B',originalSourceParameterRange:[.5,1]}),
  span({view:'V',sourceEdgeId:'G::A|C',originalSourceParameterRange:[0,1]})
 ]));
 assert.deepEqual(result.uncoveredOriginalParameterRanges,[
  {view:'V',sourceEdgeId:'G::A|B',originalSourceParameterRange:[.5,1]},
  {view:'H',sourceEdgeId:'G::A|B',originalSourceParameterRange:[0,.5]}
 ]);
 assert.equal(result.observedSourceViewsWithUncoveredOriginalParameters,2);
});

function originalGeometry(edges=[['A','B'],['A','C']]){
 return {id:'G',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points:{A:{x:0,y:0,z:0},B:{x:1,y:0,z:0},
   C:{x:0,y:1,z:0}},edges}};
}
test('real original M0 edge inventory exposes wholly missing V/H/W source pairs',()=>{
 const geometry=originalGeometry();
 const result=review(ledger([span()]),{geometry});
 assert.equal(result.independentOriginalM0InventoryAudited,true);
 assert.equal(result.expectedOriginalSourceViewCount,6);
 assert.equal(result.observedOriginalSourceViewCount,1);
 assert.equal(result.missingOriginalSourceViewCount,5);
 assert.deepEqual(result.missingOriginalSourceViews,[
  {view:'H',sourceEdgeId:'G::A|B',originalSourceParameterRange:[0,1]},
  {view:'W',sourceEdgeId:'G::A|B',originalSourceParameterRange:[0,1]},
  {view:'V',sourceEdgeId:'G::A|C',originalSourceParameterRange:[0,1]},
  {view:'H',sourceEdgeId:'G::A|C',originalSourceParameterRange:[0,1]},
  {view:'W',sourceEdgeId:'G::A|C',originalSourceParameterRange:[0,1]}
 ]);
 assert.equal(result.observedSourceViewsWithUncoveredOriginalParameters,0);
 assert.equal(result.allOriginalSourceViewsHaveCompleteParameterPartitions,false);
 assert.equal(result.signedV5ActionCount,0);
 assert.ok(Object.isFrozen(result.missingOriginalSourceViews));
});
test('even an empty M5 ledger cannot silently claim complete source inventory',()=>{
 const result=review(ledger([]),{geometry:originalGeometry([['A','B']])});
 assert.equal(result.total,0);
 assert.equal(result.missingOriginalSourceViewCount,3);
 assert.equal(result.allOriginalSourceViewsHaveCompleteParameterPartitions,false);
 assert.equal(result.signedV5ActionCount,0);
});
test('complete M0 source/view partitions are diagnostic only, never signed V5',()=>{
 const rows=['V','H','W'].flatMap(view=>
  ['G::A|B','G::A|C'].map(sourceEdgeId=>span({view,sourceEdgeId})));
 const result=review(ledger(rows),{geometry:originalGeometry()});
 assert.equal(result.expectedOriginalSourceViewCount,6);
 assert.equal(result.missingOriginalSourceViewCount,0);
 assert.equal(result.allOriginalSourceViewsHaveCompleteParameterPartitions,true);
 assert.equal(result.fullyCertifiedCount,0);
 assert.equal(result.signedV5ActionCount,0);
});
test('M5 cannot invent source IDs or reuse a stale/duplicated M0 inventory',()=>{
 assert.throws(()=>review(ledger([span({sourceEdgeId:'G::X|Y'})]),
  {geometry:originalGeometry()}),/no original M0 physical source/);
 assert.throws(()=>review(ledger(),{geometry:{...originalGeometry(),id:'old'}}),
  /current original M0 geometry/);
 assert.throws(()=>review(ledger(),{geometry:originalGeometry([['A','B'],['B','A']])}),
  /duplicate original M0 physical edge/);
 assert.throws(()=>review(ledger(),{geometry:originalGeometry([['A','missing']])}),
  /invalid original M0 physical edge/);
});
