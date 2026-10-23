'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {proposeDimensionPaths:propose,reviewDimensionPath:review}=
 require('../../recognition/reviewed-dimension-path.cjs');
const {normalizeNativeDetections}=
 require('../../recognition/browser-native-dimension-ocr.cjs');
const image={width:600,height:400};
const dimension=normalizeNativeDetections([{rawValue:'R8',
 boundingBox:{x:40,y:35,width:60,height:25}}],
 image,image)[0];
const box=(a,b)=>[
 Math.min(a.x,b.x),Math.min(a.y,b.y),
 Math.max(1,Math.abs(a.x-b.x)),Math.max(1,Math.abs(a.y-b.y))
];
const line=(id,a,b)=>({id,kind:'line',
 coordinateSpace:'original-image-px',from:a,to:b,bbox:box(a,b),
 confirmed:false});
const curve=(id,b,kind='circle')=>({id,kind,
 coordinateSpace:'original-image-px',bbox:b,confirmed:false});
const direct=line('line_1',{x:100,y:50},{x:205,y:90});
const circle=curve('curve_1',[160,85,100,100]);
const second=curve('curve_2',[195,85,100,100],'arc');
const arrow={shaftCandidateId:'line_1',endpoint:'to',
 coordinateSpace:'original-image-px',arrowheadVerified:false,
 requiresHumanReview:true,heuristicScore:.81};
const source=(extra={})=>({dimension,image,lines:[direct],
 curves:[circle,second],arrows:[arrow],...extra});
const approved=(selectedPathId,extra={})=>({...source(),
 selectedPathId,sourceEpoch:9,currentSourceEpoch:9,
 revision:4,expectedRevision:4,reviewedTextValueMm:8,
 unitsConfirmed:true,textConfirmed:true,pathConfirmed:true,
 curveConfirmed:true,arrowReviewed:true,finalAccepted:true,
 answerMark:'contains-answers',...extra});
test('08 actual existing leader/curve/V-wing modules retain multiple competing paths, never auto-select',()=>{
 const result=propose(source());
 assert.equal(result.status,'reviewable-image-paths');
 assert.equal(result.automaticallySelected,false);
 assert.equal(result.solverReady,false);
 assert.equal(result.modelUnitVerified,false);
 const straight=result.proposals.filter(x=>x.pathKind==='straight');
 assert.equal(straight.length,2);
 assert.deepEqual(straight.map(x=>x.curveCandidateId).sort(),['curve_1','curve_2']);
 assert.equal(straight[0].leaderCandidateIds[0],'line_1');
 assert.equal(straight[0].arrowHint.shaftCandidateId,'line_1');
 assert.equal(straight[0].arrowHint.endpoint,'to');
 assert.equal(straight[0].arrowheadVerified,false);
 assert.equal(straight[0].geometryConfirmed,false);
 assert.ok(result.proposals.some(x=>x.pathKind==='proximity'));
 assert.equal(result.globallyUnique,null);
});
test('08 manual review of R8 -> finite leader -> V-wing hint -> selected circle is source-only',()=>{
 const path=propose(source()).proposals.find(x=>x.pathKind==='straight'&&
  x.curveCandidateId==='curve_1');
 const output=review(approved(path.id));
 assert.equal(output.status,'reviewed-source-association');
 assert.equal(output.selectedPathId,path.id);
 assert.equal(output.curveCandidateId,'curve_1');
 assert.equal(output.curveKind,'circle');
 assert.equal(output.pathKind,'straight');
 assert.deepEqual([...output.leaderCandidateIds],['line_1']);
 assert.equal(output.dimensionKind,'radius');
 assert.equal(output.proposedRadiusMm,8);
 assert.equal(output.sourceLinkManuallyAccepted,true);
 assert.equal(output.arrowEvidenceReviewed,true);
 assert.equal(output.arrowheadMathematicallyProven,false);
 for(const field of ['geometryMetricScaleCertified','coneBaseIdentityCertified',
   'mathematicalConstraintReady','solveTriggered','v5Triggered',
   'independentBlindTestPassed','answerIsolationVerified',
   'mathematicalProof'])assert.equal(output[field],false,field);
 assert.equal(output.answerMark,'contains-answers');
 assert.equal(output.globallyUnique,null);
});
test('08 two separate finite lines and curve arc are kept as BENT candidates',()=>{
 const l1=line('line_2',{x:100,y:50},{x:150,y:50});
 const l2=line('line_3',{x:150,y:50},{x:205,y:90});
 const candidates=propose(source({lines:[l1,l2],
  curves:[second],arrows:[]}));
 const bent=candidates.proposals.find(x=>x.pathKind==='bent');
 assert.ok(bent);
 assert.deepEqual([...bent.leaderCandidateIds],['line_2','line_3']);
 assert.equal(bent.curveKind,'arc');
 assert.equal(bent.arrowHint,null);
 const proof=review(approved(bent.id,{lines:[l1,l2],curves:[second],
  arrows:[],arrowReviewed:false,answerMark:'unknown'}));
 assert.equal(proof.pathKind,'bent');
 assert.equal(proof.curveKind,'arc');
 assert.equal(proof.sourceLinkManuallyAccepted,true);
 assert.equal(proof.geometryMetricScaleCertified,false);
});
test('09 reverse-arrow tip/shaft and forged evidence cannot promote a different geometry',()=>{
 const p=propose(source()).proposals.find(x=>x.pathKind==='straight');
 for(const bad of [
  {selectedPathId:'review:straight:ocr_1:line_1:curve_99'},
  {sourceEpoch:8},{currentSourceEpoch:11},
  {expectedRevision:5},{revision:-1},
  {unitsConfirmed:false},{textConfirmed:false},
  {pathConfirmed:false},{curveConfirmed:false},
  {arrowReviewed:false},{finalAccepted:false},
  {answerMark:'certified-no-answers'},
  {reviewedTextValueMm:0},{reviewedTextValueMm:NaN},
  {reviewedTextValueMm:100001},
  {arrows:[{...arrow,arrowheadVerified:true}]},
  {arrows:[{...arrow,endpoint:'from'}]}
 ]){
  const patch={...approved(p.id),...bad};
  if(bad.arrows?.[0]?.endpoint==='from'){
   // A wrong-end wing is NOT a reason to reject the straight line candidate;
   // it simply removes the arrow hint and cannot be claimed as reviewed.
   const result=review(patch);
   assert.equal(result.arrowEvidenceReviewed,false);
  }else assert.throws(()=>review(patch),undefined,String(Object.keys(bad)));
 }
});
test('09 forged OCR/circle/segment, invalid image and duplicate detector IDs fail closed',()=>{
 for(const bad of [
  {dimension:{...dimension,confirmed:true}},
  {dimension:{...dimension,mathematicalProof:true}},
  {dimension:{...dimension,sourceText:'R999'}},
  {image:{width:20000,height:400}},
  {lines:[direct,direct]},
  {lines:[{...direct,coordinateSpace:'model-mm'}]},
  {lines:[{...direct,from:{x:-5,y:50}}]},
  {curves:[circle,circle]},
  {curves:[{...circle,confirmed:true}]},
  {curves:[{...circle,bbox:[590,85,100,100]}]},
  {arrows:Array(31).fill(arrow)}
 ])assert.throws(()=>propose(source(bad)));
});
test('09 no leader is only a manually reviewable proximity hypothesis, never confirmed arrow',()=>{
 const p=propose(source({lines:[],arrows:[]}));
 assert.ok(p.proposals.length>0);
 assert.ok(p.proposals.every(x=>x.pathKind==='proximity'));
 const choice=p.proposals[0];
 const q=review(approved(choice.id,{lines:[],arrows:[],
  arrowReviewed:false,answerMark:'no-visible-answers'}));
 assert.equal(q.leaderCandidateIds.length,0);
 assert.equal(q.arrowEvidenceReviewed,false);
 assert.equal(q.answerIsolationVerified,false);
 assert.equal(q.independentBlindTestPassed,false);
});
test('09 no parallel detector, solver, network or V5 stack built in evidence coordinator',()=>{
 const fs=require('node:fs');
 const text=fs.readFileSync('recognition/reviewed-dimension-path.cjs','utf8');
 for(const name of ['rankLeaderLineLinks','bentLeaderCandidates',
  'rankDimensionLinks','leaderArrowHint','validateOcrDimension'])
  assert.ok(text.includes(name));
 assert.doesNotMatch(text,/fetch\s*\(|XMLHttpRequest|localStorage|WebSocket/);
 assert.doesNotMatch(text,/compileTimeline|solveFinite|createPlayer|solveResult/);
});
