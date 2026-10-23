'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {candidateDraftFromRaster}=require('../../recognition/raster-primitive-draft.cjs');
const {detectLineCandidates}=require('../../recognition/local-line-candidates.cjs');
const {detectCurveCandidates}=require('../../recognition/local-curve-candidates.cjs');
const {reviewCandidate,draftReadiness}=require('../../recognition/problem-draft.cjs');
const white=(w,h)=>{const data=new Uint8ClampedArray(w*h*4);
 for(let p=0;p<data.length;p+=4){data[p]=255;data[p+1]=255;data[p+2]=255;data[p+3]=255}
 return {width:w,height:h,data};
};
function dot(a,x,y){x=Math.round(x);y=Math.round(y);
 if(x<0||y<0||x>=a.width||y>=a.height)return;
 const i=4*(y*a.width+x);a.data[i]=0;a.data[i+1]=0;a.data[i+2]=0;
}
function stroke(a,x1,y1,x2,y2){
 const n=3*Math.max(Math.abs(x2-x1),Math.abs(y2-y1));
 for(let i=0;i<=n;i++){const t=i/n;dot(a,x1+(x2-x1)*t,y1+(y2-y1)*t)}
}
function circle(a,cx,cy,r,start=0,end=360){
 for(let degrees=start;degrees<=end;degrees+=.32){
  const t=degrees*Math.PI/180;dot(a,cx+r*Math.cos(t),cy+r*Math.sin(t));
 }
}
const meta=(w,h)=>({width:w,height:h,byteLength:8192,mediaType:'image/png'});
test('real pixel Hough lines map into original pixels as unconfirmed finite ProblemDraft segments',()=>{
 const frame=white(128,128);
 stroke(frame,14,31,111,31);stroke(frame,76,59,76,118);
 const detected=detectLineCandidates(frame,{minLength:36});
 assert.ok(detected.length>=2);
 const output=candidateDraftFromRaster({
  image:meta(256,256),analysis:{width:128,height:128},lines:detected
 });
 assert.equal(output.draft.proofOfCorrectness,false);
 assert.equal(output.solverReady,false);
 assert.equal(output.sourceScaleMathematicallyProven,false);
 assert.equal(output.modelUnits,null);
 assert.equal(output.draft.candidates.length,detected.length);
 assert.ok(output.draft.candidates.every(x=>x.kind==='segment'&&
  x.reviewStatus==='unconfirmed'&&x.method==='detector'));
 assert.ok(output.draft.candidates.some(x=>Math.abs(x.geometry.from.y-62)<6&&
  Math.abs(x.geometry.from.y-x.geometry.to.y)<6));
 assert.equal(output.provenance[0].sourceCoordinateFrame,'image-px');
 assert.equal(output.provenance[0].mathematicallyVerified,false);
 const a=output.draft.candidates[0].id;
 const reviewed=reviewCandidate(output.draft,{id:a,
  expectedRevision:output.draft.revision,decision:'confirmed'});
 assert.equal(draftReadiness(reviewed).solverReady,false);
 assert.equal(draftReadiness(reviewed).globallyUnique,null);
});
test('actual connected-ink circle remains a pixel-radius proposal, not a confirmed mm value',()=>{
 const frame=white(160,160);circle(frame,76,69,39);
 const detected=detectCurveCandidates(frame,{minRadius:15});
 assert.ok(detected.some(x=>x.kind==='circle'));
 const d=candidateDraftFromRaster({
  image:meta(320,320),analysis:{width:160,height:160},
  curves:detected
 });
 const source=d.draft.candidates.find(x=>x.kind==='circle');
 assert.ok(source);
 assert.ok(Math.abs(source.geometry.center.x-152)<4);
 assert.ok(Math.abs(source.geometry.radiusPx-78)<4);
 assert.equal(source.geometry.frame,'drawing-px');
 assert.equal(source.reviewStatus,'unconfirmed');
 assert.equal(d.geometryVerified,false);
 assert.deepEqual(d.unsupportedToExistingFiniteSolver,[]);
});
test('genuine partial arc stays an unconfirmed arc; cannot be promoted to an entire circle',()=>{
 const frame=white(160,160);circle(frame,72,75,45,10,135);
 const detected=detectCurveCandidates(frame,{minRadius:15,minArcDegrees:75});
 assert.ok(detected.some(x=>x.kind==='arc'));
 const d=candidateDraftFromRaster({
  image:meta(160,160),analysis:{width:160,height:160},curves:detected
 });
 const partial=d.draft.candidates.find(x=>x.kind==='arc');
 assert.ok(partial);
 assert.equal(partial.geometry.direction,'cw');
 assert.ok(partial.geometry.startRad<partial.geometry.endRad);
 assert.ok(d.unsupportedToExistingFiniteSolver.includes(partial.id));
 assert.equal(draftReadiness(d.draft).solverReady,false);
});
test('image analysis scale must remain nearly isotropic before interpreting fitted circles',()=>{
 const c={id:'curve_1',kind:'circle',coordinateSpace:'image-px',
  bbox:[20,20,61,61],center:{x:50,y:50},radius:30,
  confidence:.65,method:'connected-ink-circlefit-candidate/0.1'};
 assert.throws(()=>candidateDraftFromRaster({
  image:meta(300,200),analysis:{width:100,height:100},curves:[c]
 }),/uniform image scaling/);
 const d=candidateDraftFromRaster({
  image:meta(200,200),analysis:{width:100,height:100},curves:[c]
 });
 assert.equal(d.draft.candidates[0].geometry.radiusPx,60);
});
test('malformed geometry, duplicate IDs, cropped circles and forged confidence never pass',()=>{
 const line={id:'line_1',kind:'line',coordinateSpace:'image-px',
  bbox:[10,20,51,1],from:{x:10,y:20},to:{x:60,y:20},
  confidence:.8,method:'binary-hough-candidate/0.1'};
 const circle={id:'curve_1',kind:'circle',coordinateSpace:'image-px',
  bbox:[20,20,41,41],center:{x:40,y:40},radius:20,
  confidence:.77,method:'connected-ink-circlefit-candidate/0.1'};
 const input={image:meta(100,100),analysis:{width:100,height:100}};
 for(const mutation of [
  {...line,id:'BAD'},
  {...line,from:{x:-1,y:20}},
  {...line,to:{x:10,y:20}},
  {...line,confidence:3},
  {...line,bbox:[99,20,51,1]},
  {...line,coordinateSpace:'model-mm'},
  {...line,method:42}
 ])assert.throws(()=>candidateDraftFromRaster({...input,lines:[mutation]}));
 assert.throws(()=>candidateDraftFromRaster({...input,lines:[line,line]}),/duplicate/);
 for(const mutation of [
  {...circle,center:{x:90,y:90}},
  {...circle,radius:0},
  {...circle,kind:'conic'},
  {...circle,id:'line_5'}
 ])assert.throws(()=>candidateDraftFromRaster({...input,curves:[mutation]}));
 assert.throws(()=>candidateDraftFromRaster({...input,
  lines:Array(31).fill(line)}),/bounded/);
});
test('ambiguous screen arc direction, invalid bounds and unknown shapes fail closed',()=>{
 const arc={id:'curve_1',kind:'arc',coordinateSpace:'image-px',
  bbox:[20,30,61,61],center:{x:50,y:60},radius:30,
  confidence:.62,method:'connected-ink-circlefit-candidate/0.1',
  startAngle:20,endAngle:140,sweepDeg:120,sweepDirection:'cw-screen'};
 const input={image:meta(120,120),analysis:{width:120,height:120}};
 const good=candidateDraftFromRaster({...input,curves:[arc]});
 assert.equal(good.draft.candidates[0].kind,'arc');
 for(const bad of [
  {...arc,sweepDirection:'ccw-proven'},
  {...arc,startAngle:Infinity},
  {...arc,sweepDeg:400},
  {...arc,kind:'circle',center:{x:115,y:60}}
 ])assert.throws(()=>candidateDraftFromRaster({...input,curves:[bad]}));
 assert.throws(()=>candidateDraftFromRaster({...input,image:meta(20000,120),curves:[arc]}));
});
test('adapter does not upload local rasters, set mm dimensions or feed a fake solver',()=>{
 const source=fs.readFileSync('recognition/raster-primitive-draft.cjs','utf8');
 assert.doesNotMatch(source,/(fetch\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|eval\()/);
 assert.doesNotMatch(source,/(solveFiniteFillet|confirmedFilletTimeline|session\.replace)/);
 assert.match(source,/reviewStatus:'unconfirmed'/);
 assert.match(source,/modelUnits:null/);
});
