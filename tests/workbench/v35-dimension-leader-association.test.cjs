'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {mapLeaderCandidate:map,rankLeaderLineLinks:rank}=
 require('../../recognition/dimension-leader-association.cjs');
const image={width:600,height:400};
const notation={id:'ocr_1',kind:'dimension',confirmed:false,
 coordinateSpace:'original-image-px',bbox:[40,35,60,25]};
const line=(id,from,to)=>({id,kind:'line',
 coordinateSpace:'original-image-px',from,to,
 bbox:[Math.min(from.x,to.x),Math.min(from.y,to.y),
  Math.max(1,Math.abs(from.x-to.x)),Math.max(1,Math.abs(from.y-to.y))]});
const curve=(id,bbox)=>({id,kind:'circle',
 coordinateSpace:'original-image-px',bbox});
const good=line('line_1',{x:100,y:50},{x:205,y:90});
const circle=curve('curve_1',[160,85,100,100]);
test('downsampled line endpoints are preserved as original-image pixels',()=>{
 const original=map({
  id:'line_2',kind:'line',coordinateSpace:'image-px',
  bbox:[50,60,60,30],from:{x:50,y:60},to:{x:110,y:90}
 },{width:600,height:400},{width:1200,height:800});
 assert.deepEqual(original.from,{x:100,y:120});
 assert.deepEqual(original.to,{x:220,y:180});
 assert.deepEqual([...original.bbox],[100,120,120,60]);
 assert.equal(original.coordinateSpace,'original-image-px');
 assert.equal(original.leaderEvidence,'finite-line-endpoints-unconfirmed');
 assert.equal(original.displayOnly,true);
 assert.equal(original.confirmed,false);
});
test('nearby text endpoint and near-boundary curve endpoint make an unverified leader hypothesis',()=>{
 const results=rank(notation,[good],[circle],image);
 assert.equal(results.length,1);
 assert.equal(results[0].leaderCandidateId,'line_1');
 assert.equal(results[0].geometryCandidateId,'curve_1');
 assert.equal(results[0].textEndpointDistancePx,0);
 assert.equal(results[0].curveOutlineDistancePx,5);
 assert.equal(results[0].orientation,'from-text-to-tip');
 assert.equal(results[0].arrowheadVerified,false);
 assert.equal(results[0].geometryConfirmed,false);
 assert.equal(results[0].requiresHumanReview,true);
 assert.equal(results[0].hypothesis,'unverified-leader-endpoint-to-bbox-outline');
});
test('reversed leader endpoint order is treated identically',()=>{
 const reversed=line('line_3',{x:205,y:90},{x:100,y:50});
 const result=rank(notation,[reversed],[circle],image);
 assert.equal(result.length,1);
 assert.equal(result[0].orientation,'to-text-to-tip');
 assert.equal(result[0].totalEndpointErrorPx,5);
});
test('multiple plausible curves remain separate suggestions, never auto-pick unique',()=>{
 const second=curve('curve_2',[195,85,110,110]);
 const matches=rank(notation,[good],[second,circle],image);
 assert.equal(matches.length,2);
 assert.deepEqual(matches.map(x=>x.geometryCandidateId),['curve_1','curve_2']);
 assert.ok(matches.every(x=>x.geometryConfirmed===false));
});
test('unrelated lines and unrelated circles must not look like label leaders',()=>{
 const lines=[
  line('line_2',{x:130,y:190},{x:205,y:90}),
  line('line_4',{x:51,y:46},{x:65,y:55}),
  line('line_5',{x:350,y:40},{x:430,y:150})
 ];
 const remote=curve('curve_7',[400,260,90,90]);
 assert.deepEqual(rank(notation,lines,[circle,remote],image),[]);
 assert.deepEqual(rank(notation,[good],[remote],image),[]);
});
test('fail closed on forged text, invalid pixels, dishonest source geometry and inputs',()=>{
 const malformed=[
  {id:'line_1',kind:'line',coordinateSpace:'image-px',bbox:[50,60,60,30],
   from:{x:NaN,y:60},to:{x:110,y:90}},
  {id:'line_1',kind:'line',coordinateSpace:'image-px',bbox:[50,60,60,30],
   from:{x:50,y:60},to:{x:4000,y:90}}
 ];
 for(const candidate of malformed)
  assert.throws(()=>map(candidate,image,image));
 assert.throws(()=>rank({...notation,confirmed:true},[],[],image));
 assert.throws(()=>rank({...notation,bbox:[590,10,100,40]},[],[],image));
 assert.throws(()=>rank(notation,[],[],{width:10001,height:400}));
 assert.throws(()=>rank(notation,Array(41).fill(good),[],image));
 assert.throws(()=>rank(notation,[],[],image,{maxOutlineDistance:Infinity}));
});
test('leader rank never invokes mathematical verification or passes OCR into solver',()=>{
 const fs=require('node:fs');
 const src=fs.readFileSync('recognition/dimension-leader-association.cjs','utf8');
 const ui=fs.readFileSync('labs/local-line-candidates-ui.cjs','utf8');
 assert.match(ui,/mapLeaderCandidate/);
 assert.doesNotMatch(src,/\bfetch\s*\(|XMLHttpRequest|localStorage|session\.replace/);
 assert.doesNotMatch(src,/solveFiniteFillet|globallyUnique|G1Verified/);
});
