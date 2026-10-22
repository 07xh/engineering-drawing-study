'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {bentLeaderCandidates:rank}=
 require('../../recognition/bent-leader-candidates.cjs');
const frame={width:600,height:400};
const label={id:'ocr_1',kind:'dimension',confirmed:false,
 coordinateSpace:'original-image-px',bbox:[20,20,55,20]};
function line(id,from,to){
 return {id,kind:'line',coordinateSpace:'original-image-px',from,to,
  bbox:[Math.min(from.x,to.x),Math.min(from.y,to.y),
   Math.max(1,Math.abs(from.x-to.x)),Math.max(1,Math.abs(from.y-to.y))]};
}
function curve(id,bbox){
 return {id,kind:'circle',coordinateSpace:'original-image-px',bbox};
}
const a=line('line_1',{x:60,y:30},{x:140,y:30});
const b=line('line_2',{x:140,y:30},{x:205,y:95});
const circle=curve('curve_1',[160,90,100,100]);
test('two segments connect OCR text through an elbow to a possible circular outline',()=>{
 const got=rank(label,[a,b],[circle],frame);
 assert.equal(got.length,1,JSON.stringify(got));
 const x=got[0];
 assert.equal(x.firstLeaderCandidateId,'line_1');
 assert.equal(x.secondLeaderCandidateId,'line_2');
 assert.equal(x.geometryCandidateId,'curve_1');
 assert.equal(x.textEndpointDistancePx,0);
 assert.equal(x.jointEndpointDistancePx,0);
 assert.equal(x.curveOutlineDistancePx,5);
 assert.equal(x.turnDegrees,45);
 assert.equal(x.totalEndpointErrorPx,5);
 assert.equal(x.arrowheadVerified,false);
 assert.equal(x.geometryConfirmed,false);
 assert.equal(x.requiresHumanReview,true);
});
test('reversed detection order and reversed stroke orientation do not change proposal',()=>{
 const first=line('line_1',a.to,a.from),second=line('line_2',b.to,b.from);
 const r=rank(label,[second,first],[circle],frame);
 assert.equal(r.length,1,JSON.stringify(r));
 assert.equal(r[0].totalEndpointErrorPx,5);
});
test('several possible circles remain explicit alternatives, no unique fit claimed',()=>{
 const second=curve('curve_2',[180,90,110,100]);
 const r=rank(label,[a,b],[second,circle],frame);
 assert.equal(r.length,2);
 assert.deepEqual(r.map(x=>x.geometryCandidateId),['curve_1','curve_2']);
 assert.ok(r.every(x=>!x.geometryConfirmed&&!x.jointsVerified));
});
test('reject unrelated strokes, straight duplicates, backtracking and faraway curves',()=>{
 const disconnected=line('line_3',{x:170,y:30},{x:205,y:95});
 const collinear=line('line_4',{x:140,y:30},{x:205,y:30});
 const backtrack=line('line_5',{x:140,y:30},{x:80,y:35});
 const remote=curve('curve_8',[420,300,120,80]);
 assert.deepEqual(rank(label,[a,disconnected],[circle],frame),[]);
 assert.deepEqual(rank(label,[a,collinear],[circle],frame),[]);
 assert.deepEqual(rank(label,[a,backtrack],[circle],frame),[]);
 assert.deepEqual(rank(label,[a,b],[remote],frame),[]);
});
test('reject forged reviewed OCR, invalid image, malformed bounds and excess candidates',()=>{
 assert.throws(()=>rank({...label,confirmed:true},[a,b],[circle],frame));
 assert.throws(()=>rank({...label,bbox:[580,30,70,20]},[a,b],[circle],frame));
 assert.throws(()=>rank(label,Array(41).fill(a),[],frame));
 assert.throws(()=>rank(label,[a,b],[circle],{width:0,height:400}));
 assert.throws(()=>rank(label,[a,b],[circle],frame,{maxJointGap:NaN}));
 assert.throws(()=>rank(label,[a,b],[circle],frame,{minTurnDeg:160,maxTurnDeg:50}));
 const invalid=line('line_3',{x:NaN,y:30},{x:205,y:95});
 assert.deepEqual(rank(label,[a,invalid],[circle],frame),[]);
});
test('implementation has no upload or solver call, only unverified pixels',()=>{
 const fs=require('node:fs');
 const code=fs.readFileSync('recognition/bent-leader-candidates.cjs','utf8');
 assert.doesNotMatch(code,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b/);
 assert.doesNotMatch(code,/session\.replace|solveFiniteFillet|globallyUnique/);
 assert.match(code,/arrowheadVerified:false/);
});
