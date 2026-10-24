'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyConvexSegmentClearance:clear}=
 require('../../core/numeric/convex-segment-clearance.cjs');
const {certifyConvexSegmentOcclusion:hide}=
 require('../../core/numeric/convex-segment-occlusion.cjs');
const P=(x,y,z)=>({x,y,z}),H=(id,normal,offsetMm)=>({id,normal,offsetMm});
const cube=()=>[
 H('xmin',P(-1,0,0),0),H('xmax',P(1,0,0),10),
 H('ymin',P(0,-1,0),0),H('ymax',P(0,1,0),10),
 H('zmin',P(0,0,-1),-2),H('zmax',P(0,0,1),4)
];
const line=()=>({id:'Seg',from:P(-5,5,0),to:P(15,5,0)});
const cfg=(source=line(),solid={id:'Box',halfspaces:cube()},extra={})=>
 ({source,solid,observerDirection:P(0,0,1),...extra});
test('M0 source-point and observer getters read exactly once across continuous occlusion',()=>{
 const input=cfg();let fromX=0,toX=0,dz=0;
 Object.defineProperty(input.source.from,'x',{enumerable:true,
  get(){return ++fromX===1?-5:Infinity;}});
 Object.defineProperty(input.source.to,'x',{enumerable:true,
  get(){return ++toX===1?15:-15;}});
 Object.defineProperty(input.observerDirection,'z',{enumerable:true,
  get(){return ++dz===1?1:-1;}});
 const r=hide(input);
 assert.equal(r.status,'certified-open-interval');
 assert.ok(r.openSourceParameterRange[0]>0.25&&r.openSourceParameterRange[0]<0.26);
 assert.ok(r.openSourceParameterRange[1]<0.75&&r.openSourceParameterRange[1]>0.74);
 assert.equal(fromX,1);assert.equal(toX,1);assert.equal(dz,1);
 assert.equal(r.occlusionComplete,false);
 assert.equal(r.officialLineStyleVerified,false);
 assert.equal(r.v5Verified,false);
});
test('M0 continuous clearance interval and sourceParameterRange are immutable source snapshots',()=>{
 const input=cfg();
 input.sourceParameterRange=[0,.1];
 let rangeReads=0,pointReads=0;
 Object.defineProperty(input.sourceParameterRange,1,{enumerable:true,
  get(){return ++rangeReads===1?.1:.7;}});
 Object.defineProperty(input.source.from,'x',{enumerable:true,
  get(){return ++pointReads===1?-5:Infinity;}});
 const r=clear(input);
 assert.equal(r.status,'certified-clear');
 assert.equal(r.sourceOpenIntervalVerified,true);
 assert.equal(r.officialLineStyleVerified,false);
 assert.equal(r.v5Ready,false);
 assert.equal(rangeReads,1);assert.equal(pointReads,1);
});
test('M0 plane normal/offset and solid identity are single-read for both continuous modules',()=>{
 for(const algorithm of [clear,hide]){
  const input=cfg(),face=input.solid.halfspaces[3];
  let n=0,off=0,solidId=0,faces=0,sourceId=0;
  Object.defineProperty(face.normal,'y',{enumerable:true,
   get(){return ++n===1?1:Infinity;}});
  Object.defineProperty(face,'offsetMm',{enumerable:true,
   get(){return ++off===1?10:-10;}});
  const faceList=input.solid.halfspaces;
  Object.defineProperty(input.solid,'halfspaces',{enumerable:true,
   get(){return ++faces===1?faceList:[];}});
  Object.defineProperty(input.solid,'id',{enumerable:true,
   get(){return ++solidId===1?'Box':'Forged';}});
  Object.defineProperty(input.source,'id',{enumerable:true,
   get(){return ++sourceId===1?'Seg':'Forged';}});
  const r=algorithm(input);
  assert.equal(n,1);assert.equal(off,1);
  assert.equal(faces,1);assert.equal(solidId,1);assert.equal(sourceId,1);
  assert.equal(r.sourceId,'Seg');assert.equal(r.solidId,'Box');
  if(algorithm===hide)assert.equal(r.status,'certified-open-interval');
  else assert.equal(r.status,'undetermined');
 }
});
test('M0 first-read bad source, sparse support arrays and duplicate IDs fail closed',()=>{
 for(const algorithm of [clear,hide]){
  const a=cfg();let reads=0;
  Object.defineProperty(a.observerDirection,'z',{enumerable:true,
   get(){return ++reads===1?Infinity:1;}});
  assert.throws(()=>algorithm(a),TypeError);
  assert.equal(reads,1);
  const b=cfg();delete b.solid.halfspaces[2];
  assert.throws(()=>algorithm(b),TypeError);
  const c=cfg();c.solid.halfspaces[3].id='xmin';
  assert.throws(()=>algorithm(c),TypeError);
 }
 const span=cfg();span.sourceParameterRange=[0,,];
 assert.throws(()=>clear(span),TypeError);
});
test('M0 existing box analytic occlusion/clearance and nearparallel conservatism preserved',()=>{
 const obscured=hide(cfg());
 assert.equal(obscured.status,'certified-open-interval');
 const visible=clear(cfg(line(),{id:'Box',halfspaces:cube()},
  {sourceParameterRange:[0,.1]}));
 assert.equal(visible.status,'certified-clear');
 const blocked=clear(cfg(line(),{id:'Box',halfspaces:cube()},
  {sourceParameterRange:[.4,.6]}));
 assert.equal(blocked.status,'undetermined');
 const tangent=cfg();
 tangent.source.from=P(-5,0,0);tangent.source.to=P(15,0,0);
 assert.notEqual(hide(tangent).status,'certified-open-interval');
});
