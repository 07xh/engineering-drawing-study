'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {listGivenSourceProjectionIndices,stringifyReviewedSourcePairs,
 withEditedReviewedSourcePairs}=
 require('../../workbench/c1-local-review-correspondence-editor.cjs');
const points=[];for(const x of [-2,3])for(const y of [-3,4])for(const z of [0,5])
 points.push({x,y,z});
function source(){
 const views={H:[],V:[]};
 for(const view of Object.keys(views))for(const p of points){
  const q=project(p)[view];
  if(!views[view].some(a=>a.u===q.u&&a.v===q.v))views[view].push(q);
 }
 return {schema:'draftai-c1-authenticated-dxf-reviewed-given/1',
  sourceSha256:'a'.repeat(64),convertedDxfSha256:'b'.repeat(64),
  views,missingView:'W',
  givenOriginalHandleEndpoints:Object.fromEntries(Object.keys(views).map(v=>[
   v,views[v].map((_,i)=>({handle:v+(i+1),endpoint:'point'}))
  ])),assumedScope:'all-extreme-vertices-of-one-closed-convex-opaque-solid',
  humanSelectedFullExtremeVertexSet:true,
  originalSourceCompletenessIndependentlyProved:false,
  sourceImageRecognitionVerified:false,
  referenceWasNotExportedAsSolverInput:true,
  sourceIsNotYetConfirmedForProduction:true,textbookBlindSolveAccepted:false
 };
}
function links(given=source()){
 return points.map(p=>({
  firstIndex:given.views.H.findIndex(q=>{
   const a=project(p).H;return q.u===a.u&&q.v===a.v;
  }),
  secondIndex:given.views.V.findIndex(q=>{
   const a=project(p).V;return q.u===a.u&&q.v===a.v;
  })
 }));
}
test('actual 4+4 first-angle CAD source points can be human paired into eight original 3D corners without JSON editing',()=>{
 const p=source(),reviewed=links(p);
 assert.equal(p.views.H.length,4);assert.equal(p.views.V.length,4);
 const numbered=listGivenSourceProjectionIndices(p);
 assert.match(numbered,/H视图/);
 assert.match(numbered,/V视图/);
 assert.match(numbered,/原始 CAD H1:point/);
 assert.match(numbered,/H编号, V编号/);
 const text=reviewed.map(x=>x.firstIndex+','+x.secondIndex).join('\n');
 const out=withEditedReviewedSourcePairs(p,text);
 assert.deepEqual(out.reviewedCorrespondences,reviewed);
 assert.equal(stringifyReviewedSourcePairs(out),text);
 assert.equal(Object.hasOwn(p,'reviewedCorrespondences'),false);
 assert.equal(out.referenceWasNotExportedAsSolverInput,true);
 assert.equal(JSON.stringify(out).includes('referenceStrokes'),false);
});
test('removing the human pair mapping returns only to the ORIGINAL fail-closed automatic unique-check path',()=>{
 const p=source(),rows=links(p).map(x=>x.firstIndex+','+x.secondIndex).join('\n');
 const linked=withEditedReviewedSourcePairs(p,rows);
 const reverted=withEditedReviewedSourcePairs(linked,'\n');
 assert.equal(reverted.reviewedCorrespondences,undefined);
 assert.equal(stringifyReviewedSourcePairs(reverted),'');
 assert.equal(Object.keys(reverted).length,Object.keys(p).length);
});
test('invalid, repeated, out-of-range, orphan, and answer-bearing reviewed relations are rejected',()=>{
 const p=source(),raw=links(p).map(x=>x.firstIndex+','+x.secondIndex);
 for(const wrong of [
  raw.slice(0,3).join('\n'),
  [...raw.slice(0,7),raw[0]].join('\n'),
  [...raw.slice(0,7),'99,99'].join('\n'),
  raw.map((x,i)=>i===4?'not-a-pair':x).join('\n'),
  raw.map((x,i)=>i%2?'0,0':x).join('\n'),
  raw.map((x,i)=>i===0?'0, 1, 2':x).join('\n')
 ]){
  assert.throws(()=>withEditedReviewedSourcePairs(p,wrong),
   /reviewed|duplicate|line|point|original 2D/);
 }
 const leaked=structuredClone(p);leaked.referenceStrokes=[{status:'answer'}];
 assert.throws(()=>withEditedReviewedSourcePairs(leaked,raw.join('\n')),
  /answer-bearing/);
});
test('original full source pair list remains bounded and a typed override never edits the original given object',()=>{
 const p=source(),before=JSON.stringify(p);
 assert.throws(()=>withEditedReviewedSourcePairs(p,'0,1\n'.repeat(33)),
  /bounded|4\.\.32/);
 assert.equal(JSON.stringify(p),before);
});
