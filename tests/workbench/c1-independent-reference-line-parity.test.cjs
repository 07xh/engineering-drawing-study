'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1IndependentReferenceLineParity,
 exactSameStylePaperCoverage}=
 require('../../workbench/c1-independent-reference-line-parity.cjs');
const VISIBLE='gb-t-4457.4-continuous-wide-visible-outline';
const HIDDEN='gb-t-4457.4-thin-dashed-hidden-edge';
const line=(a,b,y=0,style=VISIBLE)=>({
 from:{u:a,v:y},to:{u:b,v:y},standardLineStyle:style
});
test('continuous 2-piece reference can cover a differently segmented official result',()=>{
 assert.equal(exactSameStylePaperCoverage(line(0,10),[
  line(0,5),line(5,10)
 ]).fullyCovered,true);
 assert.equal(exactSameStylePaperCoverage(line(10,0),[
  line(0,5),line(5,10)
 ]).fullyCovered,true);
});
test('positive 1-ULP gap or partial reference line is a real failed blind residual',()=>{
 const tiny=Number.EPSILON;
 const r=exactSameStylePaperCoverage(line(0,1),[
  line(0,0.5),line(0.5+tiny,1)
 ]);
 assert.equal(r.fullyCovered,false);
 assert(r.uncoveredIntervals.length>0);
 assert.equal(exactSameStylePaperCoverage(line(0,10),[
  line(0,3),line(7,10)
 ]).fullyCovered,false);
});
test('hidden vs visible style and merely nearby parallel lines cannot alias',()=>{
 assert.equal(exactSameStylePaperCoverage(line(0,10),[
  line(0,10,0,HIDDEN)
 ]).fullyCovered,false);
 assert.equal(exactSameStylePaperCoverage(line(0,10),[
  line(0,10,0.00001)
 ]).fullyCovered,false);
});
function output(){
 return {
  schema:'draftai-c1-reviewed-solid-vertex-v5/1',revision:1,
  singleOriginalV5Player:true,
  sceneResult:{revision:1,missingView:'W',geometry:{id:'TestOriginal'}},
  globalVisibleContourProof:{allThreeViewsGlobalContourCertified:true},
  physicalEdgeProof:{allDrawablePhysicalEdgeStylesCertified:true},
  certifiedVisibleContourLineBindings:[{
   sourceEdgeId:'sourceA',actionId:'v5_visible1',view:'W',
   fromModelMm:{u:0,v:0},toModelMm:{u:10,v:0},
   standardLineStyle:VISIBLE
  }],
  certifiedPhysicalLineBindings:[{
   sourceEdgeId:'sourceB',actionId:'v5_hidden1',view:'W',
   fromModelMm:{u:0,v:5},toModelMm:{u:10,v:5},
   standardLineStyle:HIDDEN
  }],
  steps:[{actions:[{id:'v5_visible1'},{id:'v5_hidden1'}]}]
 };
}
test('bidirectional reference parity detects both missing and surplus formal strokes',()=>{
 const solved=output(),refs=[
  line(0,5),line(5,10),line(0,10,5,HIDDEN)
 ];
 const good=auditC1IndependentReferenceLineParity({
  solved,referenceStrokes:refs,view:'W'
 });
 assert.equal(good.strictlyStyledThirdViewPaperParityVerified,true);
 assert.equal(good.realTextbookBlindTestPassed,false);
 assert.equal(good.completeC1DeliveryAuthorized,false);
 const absent=auditC1IndependentReferenceLineParity({
  solved,referenceStrokes:[line(0,10)],view:'W'
 });
 assert.equal(absent.everySignedV5LineCoveredByReferenceLine,false);
 assert.equal(absent.strictlyStyledThirdViewPaperParityVerified,false);
 const wrong=auditC1IndependentReferenceLineParity({
  solved,referenceStrokes:[line(0,10),line(0,10,5,VISIBLE)],
  view:'W'
 });
 assert.equal(wrong.strictlyStyledThirdViewPaperParityVerified,false);
});
test('unsigned M5 edge proof cannot be upgraded by perfect answer agreement',()=>{
 const solved=output();solved.physicalEdgeProof.allDrawablePhysicalEdgeStylesCertified=false;
 const r=auditC1IndependentReferenceLineParity({
  solved,referenceStrokes:[line(0,10),line(0,10,5,HIDDEN)],view:'W'
 });
 assert.equal(r.strictlyStyledThirdViewPaperParityVerified,false);
});
