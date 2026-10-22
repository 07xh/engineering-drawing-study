'use strict';
/**
 * DA-08/R0 image-to-math smoke with real unmodified pixel detectors.
 * Three newly rasterized diagrams are generated from basic strokes, not
 * precomputed detector shapes, SolveResult fixtures or scripted V5 paths.
 * Synthetic smoke != independent photographed-image OCR acceptance.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {detectLineCandidates}=
 require('../../recognition/local-line-candidates.cjs');
const {detectCurveCandidates}=
 require('../../recognition/local-curve-candidates.cjs');
const {candidateDraftFromRaster}=
 require('../../recognition/raster-primitive-draft.cjs');
const {prepareReviewedRasterImport}=
 require('../../labs/local-raster-fillet-import.cjs');
const {solveFiniteFillet}=
 require('../../engines/constraints-2d/finite-fillet-gate.cjs');
const {buildConfirmedInput}=
 require('../../labs/auto-fillet-form.cjs');
const {confirmedFilletTimeline}=
 require('../../workbench/v31-confirmed-fillet-v5.cjs');

const W=220,H=200,EPS=1e-7;
function white(){
 const data=new Uint8ClampedArray(W*H*4);
 for(let i=0;i<data.length;i+=4)data.fill(255,i,i+4);
 return {width:W,height:H,data};
}
function pixel(frame,x,y){
 x=Math.round(x);y=Math.round(y);
 if(x<0||y<0||x>=frame.width||y>=frame.height)return;
 const i=4*(y*frame.width+x);
 frame.data[i]=0;frame.data[i+1]=0;frame.data[i+2]=0;
}
function stroke(frame,x0,y0,x1,y1){
 const steps=3*Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
 for(let i=0;i<=steps;i++){
  const t=i/steps;pixel(frame,x0+(x1-x0)*t,y0+(y1-y0)*t);
 }
}
function circle(frame,cx,cy,r,start=0,end=360){
 for(let a=start;a<=end;a+=.32){
  const rad=a*Math.PI/180;pixel(frame,cx+r*Math.cos(rad),cy+r*Math.sin(rad));
 }
}
function drawScene(type){
 const frame=white();
 if(type==='two-segments'){
  stroke(frame,22,66,196,66);
  stroke(frame,116,19,116,171);
 }else if(type==='segment-circle'){
  stroke(frame,15,40,205,40);
  circle(frame,110,115,29);
 }else if(type==='two-circles'){
  circle(frame,80,108,25);
  circle(frame,153,108,30);
 }else throw Error('unsupported synthetic layout');
 return frame;
}
const length=s=>Math.hypot(s.to.x-s.from.x,s.to.y-s.from.y);
const horizontal=s=>Math.abs(s.from.y-s.to.y)<4;
const vertical=s=>Math.abs(s.from.x-s.to.x)<4;
function discover(frame,type){
 const rawLines=type==='two-circles'?[]:
  detectLineCandidates(frame,{minLength:65,maxCandidates:16});
 const rawCurves=type==='two-segments'?[]:
  detectCurveCandidates(frame,{minRadius:16,maxCandidates:12});
 let lines=[],curves=[];
 if(type==='two-segments'){
  const h=rawLines.filter(horizontal).sort((a,b)=>length(b)-length(a))[0];
  const v=rawLines.filter(vertical).sort((a,b)=>length(b)-length(a))[0];
  assert.ok(h&&v&&h.id!==v.id,'real Hough detector must propose both strokes');
  lines=[h,v];
 }else if(type==='segment-circle'){
  const h=rawLines.filter(horizontal).sort((a,b)=>length(b)-length(a))[0];
  assert.ok(h,'real Hough detector must find separate finite line');
  lines=[h];
  const cc=rawCurves.filter(c=>c.kind==='circle'&&c.radialRmsPx<1.6)
   .sort((a,b)=>b.coverageDeg-a.coverageDeg)[0];
  assert.ok(cc,'real connected-ink detector must find complete circle');
  curves=[cc];
 }else{
  curves=rawCurves.filter(c=>c.kind==='circle'&&c.radialRmsPx<1.6)
   .sort((a,b)=>a.center.x-b.center.x);
  assert.ok(curves.length>=2,'real detector must distinguish the two separate circles');
  curves=curves.slice(0,2);
 }
 return {lines,curves};
}
function reviewed(type,frame){
 const {lines,curves}=discover(frame,type);
 const wrapped=candidateDraftFromRaster({
  image:{width:W,height:H,mediaType:'image/png',byteLength:4096},
  analysis:{width:W,height:H},lines,curves
 });
 assert.equal(wrapped.solverReady,false);
 assert.equal(wrapped.geometryVerified,false);
 const draft=wrapped.draft,accepted=draft.candidates;
 assert.equal(accepted.length,2);
 const edits={};
 for(const c of accepted){
  edits[c.id]=c.kind==='segment'
   ?{from:{...c.geometry.from},to:{...c.geometry.to}}
   :{center:{...c.geometry.center},radiusPx:c.geometry.radiusPx};
 }
 const signedNormal=type==='segment-circle'
  ?(curves[0].center.x-lines[0].from.x)*
    (lines[0].from.y-lines[0].to.y)+
   (curves[0].center.y-lines[0].from.y)*
    (lines[0].to.x-lines[0].from.x)
  :null;
 const lineSide=type==='segment-circle'?(signedNormal>=0?1:-1):undefined;
 const radius=type==='two-circles'?11:type==='segment-circle'?25:12;
 const result=prepareReviewedRasterImport({
  draft,expectedRevision:draft.revision,
  kind:type,firstId:accepted[0].id,secondId:accepted[1].id,
  edits,accepted:true,mmPerPx:1,originX:110,originY:100,
  yAxis:'down',filletRadiusMm:radius,lineSide
 });
 assert.equal(result.metricCalibrationMathematicallyProven,false);
 assert.equal(result.sourceCandidateProof,false);
 return {draft,edits,accepted,result,radius};
}
function chooseVerified(type,review){
 const baseline=buildConfirmedInput(type,review.fields,
  {side:review.lineSide},review.reviewedDraftRevision);
 const geometries=solveFiniteFillet(baseline.problem).candidates;
 assert.ok(geometries.length>0,'02 finite solver must derive real candidates');
 const travelKeys=type==='two-segments'?['firstTravel','secondTravel']:
   type==='segment-circle'?['lineTravel','knownCircleTravel']:
    ['knownFirstTravel','knownSecondTravel'];
 const a=type==='two-segments'?['forward','reverse']:
  type==='segment-circle'?['forward','reverse']:['cw','ccw'];
 const b=type==='two-segments'?['forward','backward']:['cw','ccw'];
 const diagnostics=[];
 // Exercise the true directed G1 verifier, not precomputed branch IDs or paths.
 for(const candidate of geometries)
  for(const dir of ['cw','ccw'])
   for(const one of a)
    for(const two of b){
     const selection={branchId:candidate.branchId,direction:dir,
      ...(type==='segment-circle'?{side:review.lineSide}:{}),
      [travelKeys[0]]:one,[travelKeys[1]]:two};
     try{
      const input=buildConfirmedInput(type,review.fields,selection,
       review.reviewedDraftRevision);
      const output=confirmedFilletTimeline(input);
      if(type==='segment-circle')assert.equal(input.problem.options.side,review.lineSide);
      if(output.mathematicallyVerified===true&&output.status==='ready'&&
        output.typedMathEvidence?.g1Verified===true)return output;
      diagnostics.push({branch:candidate.branchId,dir,one,two,
       status:output.status,reason:output.reason,verified:output.mathematicallyVerified});
     }catch(e){diagnostics.push({branch:candidate.branchId,dir,one,two,error:e.message});}
    }
 assert.fail('no verified G1 branch; '+JSON.stringify({problem:baseline.problem,
  geometricCandidates:geometries,diagnostics:diagnostics.slice(0,12)}));
}
for(const type of ['two-segments','segment-circle','two-circles']){
 test('R0 raw RGBA '+type+' -> actual detector -> human-metric ProblemDraft -> real G1/V5',()=>{
  const frame=drawScene(type),r=reviewed(type,frame);
  assert.equal(r.result.geometrySourceReviewed,true);
  assert.equal(r.result.globallyUnique,null);
  const output=chooseVerified(type,r.result);
  assert.ok(output.steps.length>0);
  assert.equal(output.typedMathEvidence.g1Verified,true);
  assert.equal(output.typedMathEvidence.globallyUnique,null);
  assert.ok(output.typedMathEvidence.maxResidualMm<EPS,
   'tangent intersection residual must remain independently small');
 });
}
test('blank and heavily occluded photo never fabricate complete raster geometry',()=>{
 const blank=white();
 assert.deepEqual(detectLineCandidates(blank),[]);
 assert.deepEqual(detectCurveCandidates(blank),[]);
 const frame=white();
 // An insufficient disconnected arc is never a complete source circle.
 circle(frame,92,98,34,30,105);
 const curves=detectCurveCandidates(frame,{minRadius:15,minArcDegrees:70});
 assert.ok(!curves.some(c=>c.kind==='circle'),'short arc cannot be whole circle');
});
test('unreviewed/unscaled/contradictory pixel evidence never reaches verified timeline',()=>{
 const type='two-circles',frame=drawScene(type);
 const candidates=discover(frame,type);
 const draft=candidateDraftFromRaster({
  image:{width:W,height:H,mediaType:'image/png',byteLength:4096},
  analysis:{width:W,height:H},
  lines:candidates.lines,curves:candidates.curves
 }).draft;
 const edits={};
 for(const c of draft.candidates)edits[c.id]={
  center:{...c.geometry.center},radiusPx:c.geometry.radiusPx
 };
 const firstId=draft.candidates[0].id,secondId=draft.candidates[1].id;
 const opts={draft,expectedRevision:draft.revision,kind:type,firstId,secondId,
  edits,originX:110,originY:100,yAxis:'down',mmPerPx:1,filletRadiusMm:11};
 assert.throws(()=>prepareReviewedRasterImport({...opts,accepted:false}),/human/);
 assert.throws(()=>prepareReviewedRasterImport({...opts,accepted:true,mmPerPx:0}),/scale/);
 assert.throws(()=>prepareReviewedRasterImport({...opts,accepted:true,
  edits:{...edits,[firstId]:{...edits[firstId],radiusPx:1e4}}}),/outside|beyond/);
 assert.throws(()=>prepareReviewedRasterImport({...opts,accepted:true,
  expectedRevision:draft.revision+1}),/stale/);
});
