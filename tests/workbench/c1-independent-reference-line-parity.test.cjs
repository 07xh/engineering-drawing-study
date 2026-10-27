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
const nextUpPositive=n=>{
 const bits=new DataView(new ArrayBuffer(8));
 bits.setFloat64(0,n,false);
 bits.setBigUint64(0,bits.getBigUint64(0,false)+1n,false);
 return bits.getFloat64(0,false);
};
test('exact dyadic support rejects a tiny but real offset and a skew crossing',()=>{
 // The previous 1e-8 distance allowance silently certified this false match.
 const almost=line(0,10,1e-10);
 const r=exactSameStylePaperCoverage(line(0,10),[almost]);
 assert.equal(r.fullyCovered,false);
 assert.deepEqual(r.uncoveredIntervals,[[0,10]]);
 const diagonal={from:{u:0,v:0},to:{u:10,v:10},
  standardLineStyle:VISIBLE};
 const shifted={from:{u:0,v:1e-12},to:{u:10,v:10+1e-12},
  standardLineStyle:VISIBLE};
 assert.equal(exactSameStylePaperCoverage(diagonal,[shifted]).fullyCovered,false);
 const crossing={from:{u:5,v:-5},to:{u:5,v:5},
  standardLineStyle:VISIBLE};
 assert.equal(exactSameStylePaperCoverage(line(0,10),[crossing]).fullyCovered,false);
});
test('1-ULP source gap at a large paper offset survives exact axis union',()=>{
 const cut=65538,after=nextUpPositive(cut);
 const r=exactSameStylePaperCoverage(line(65536,65540),[
  line(65536,cut),line(after,65540)
 ]);
 assert.equal(r.fullyCovered,false);
 assert.equal(r.uncoveredIntervalPaperAxis,'u');
 assert.deepEqual(r.uncoveredIntervals,[[cut,after]]);
 assert.equal(exactSameStylePaperCoverage(line(65540,65536),[
  line(65536,cut),line(after,65540)
 ]).fullyCovered,false);
});
test('exact vertical and diagonal segmented lines still match in both directions',()=>{
 const v=(a,b)=>({from:{u:2,v:a},to:{u:2,v:b},
  standardLineStyle:VISIBLE});
 assert.equal(exactSameStylePaperCoverage(v(10,0),[
  v(0,5),v(5,10)
 ]).fullyCovered,true);
 const d=(a,b)=>({from:{u:a,v:a},to:{u:b,v:b},
  standardLineStyle:VISIBLE});
 assert.equal(exactSameStylePaperCoverage(d(10,0),[
  d(0,5),d(5,10)
 ]).fullyCovered,true);
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
