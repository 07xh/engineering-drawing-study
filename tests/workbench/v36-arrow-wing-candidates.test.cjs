'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {detectArrowWingCandidates:detect}=
 require('../../recognition/local-arrow-wing-candidates.cjs');
function blank(w=180,h=180,dark=false){
 const data=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<data.length;i+=4){
  data[i]=data[i+1]=data[i+2]=dark?0:255;data[i+3]=255;
 }
 return {width:w,height:h,data};
}
function stroke(frame,a,b){
 const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)*3);
 for(let k=0;k<=n;k++){
  const t=k/n,x=Math.round(a.x*(1-t)+b.x*t),
   y=Math.round(a.y*(1-t)+b.y*t);
  if(x<0||y<0||x>=frame.width||y>=frame.height)continue;
  const i=4*(y*frame.width+x);
  frame.data[i]=frame.data[i+1]=frame.data[i+2]=0;
 }
}
const shaft={id:'line_1',kind:'line',coordinateSpace:'image-px',
 from:{x:20,y:90},to:{x:130,y:90}};
function withShaft(){
 const img=blank();stroke(img,shaft.from,shaft.to);return img;
}
test('two short angled wings at shaft tip produce an unverified pixel arrow candidate',()=>{
 const img=withShaft();
 stroke(img,{x:130,y:90},{x:116,y:82});
 stroke(img,{x:130,y:90},{x:116,y:98});
 const out=detect(img,[shaft]);
 const tip=out.find(x=>x.endpoint==='to');
 assert.ok(tip,JSON.stringify(out));
 assert.deepEqual(tip.tip,{x:130,y:90});
 assert.equal(tip.shaftCandidateId,'line_1');
 assert.equal(tip.coordinateSpace,'image-px');
 assert.equal(tip.hypothesis,'two-local-dark-v-wings-unverified');
 assert.equal(tip.arrowheadVerified,false);
 assert.equal(tip.geometryConfirmed,false);
 assert.equal(tip.requiresHumanReview,true);
 assert.ok(tip.heuristicScore>0&&tip.heuristicScore<1);
});
test('plain straight shaft has no paired V evidence',()=>{
 assert.deepEqual(detect(withShaft(),[shaft]),[]);
});
test('one diagonal wing cannot certify an arrowhead',()=>{
 const img=withShaft();
 stroke(img,{x:130,y:90},{x:116,y:82});
 assert.deepEqual(detect(img,[shaft]),[]);
});
test('sparse and fully dark images do not generate arrow candidates',()=>{
 assert.deepEqual(detect(blank(),[shaft]),[]);
 assert.deepEqual(detect(blank(180,180,true),[shaft]),[]);
});
test('out-of-bounds, invalid units, nonfinite segments and resource abuse fail closed',()=>{
 const img=withShaft();
 assert.throws(()=>detect({width:1000,height:200,data:img.data},[shaft]));
 assert.throws(()=>detect({...img,data:new Uint8Array(2)},[shaft]));
 assert.throws(()=>detect(img,Array(31).fill(shaft)));
 assert.throws(()=>detect(img,[shaft],{maxCandidates:40}));
 assert.throws(()=>detect(img,[shaft],{inkThreshold:999}));
 assert.deepEqual(detect(img,[{...shaft,coordinateSpace:'model-mm'}]),[]);
 assert.deepEqual(detect(img,[{...shaft,to:{x:NaN,y:90}}]),[]);
});
test('detector is local-only evidence and never a model-mm dimension or G1 proof',()=>{
 const fs=require('node:fs');
 const src=fs.readFileSync('recognition/local-arrow-wing-candidates.cjs','utf8');
 assert.doesNotMatch(src,/\bfetch\s*\(|XMLHttpRequest|localStorage/);
 assert.doesNotMatch(src,/solveFiniteFillet|session\.replace|globallyUnique/);
 assert.match(src,/arrowheadVerified:false/);
});
