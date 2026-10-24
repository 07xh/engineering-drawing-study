'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../../core/projection/conventions.js');
const xyz=(x,y,z)=>({x,y,z});
function flip(o,key,first,second){
 let reads=0;Object.defineProperty(o,key,{enumerable:true,configurable:true,
  get(){return ++reads===1?first:second;}});
 return ()=>reads;
}
test('one 3D source is used for all three first-angle V/H/W model projections',()=>{
 const p=xyz(15,10,12);
 const reads=[flip(p,'x',15,Infinity),flip(p,'y',10,-500),flip(p,'z',12,NaN)];
 assert.deepEqual(P.project(p),{
  V:{u:15,v:12},H:{u:15,v:10},W:{u:10,v:12}
 });
 assert.deepEqual(reads.map(f=>f()),[1,1,1]);
});
test('all V/H/W sheet views, transfer guides and 45-degree point use the SAME source + sheet transform',()=>{
 const p=xyz(15,10,12);
 const origin={x:100,y:200},config={origin,scale:2};
 const reads=[flip(p,'x',15,-900),flip(p,'y',10,Infinity),
  flip(p,'z',12,Infinity),
  flip(origin,'x',100,-10000),flip(origin,'y',200,-10000),
  flip(config,'origin',origin,xyz(-1,-1,0)),flip(config,'scale',2,-1)];
 const result=P.transferGuides(p,config);
 assert.deepEqual(result.points,{
  V:{x:70,y:176},H:{x:70,y:220},
  W:{x:120,y:176},M:{x:120,y:220}
 });
 assert.deepEqual(result.guides.map(g=>g.kind),
  ['VH','height-VW','depth-HM','depth-MW']);
 assert.deepEqual(reads.map(f=>f()),[1,1,1,1,1,1,1]);
});
test('single inverse/projection views never re-read source coordinates or scale',()=>{
 const uv={u:8,v:-3},origin={x:100,y:200},
  transform={origin,scale:5};
 const reads=[flip(uv,'u',8,Infinity),flip(uv,'v',-3,Infinity),
  flip(origin,'x',100,Infinity),flip(transform,'scale',5,-5)];
 const paper=P.toSheet('H',uv,transform);
 assert.deepEqual(paper,{x:60,y:185});
 assert.deepEqual(reads.map(f=>f()),[1,1,1,1]);
 const q={x:60,y:185},reverseTransform={origin:{x:100,y:200},scale:5};
 const count=flip(q,'x',60,Infinity);
 assert.deepEqual(P.fromSheet('H',q,reverseTransform),{u:8,v:-3});
 assert.equal(count(),1);
});
test('verified first-angle observer rays cannot switch normal after validation or reorder top-level sources',()=>{
 const observers={
  V:xyz(0,-1,0),H:xyz(0,0,1),W:xyz(1,0,0)
 };
 const H=observers.H;let before=0;
 const counts=[
  flip(observers.V,'y',-1,1),
  flip(observers.H,'z',1,-1),
  flip(observers.W,'x',1,-1)
 ];
 Object.defineProperty(observers,'H',{enumerable:true,configurable:true,
  get(){return ++before===1?H:xyz(0,0,-1);}});
 const result=P.validateFirstAngleObserverRays(observers);
 assert.equal(result.H.z,1);
 assert.equal(result.V.y,-1);
 assert.equal(result.W.x,1);
 assert.equal(before,1);
 assert.deepEqual(counts.map(f=>f()),[1,1,1]);
});
test('alignment comparison uses a stable absolute-mm snapshot for all views',()=>{
 const views={V:{u:1e12,v:12},H:{u:1e12+10,v:20},W:{u:20,v:12}};
 const read=flip(views.V,'u',1e12,1e12+10);
 assert.deepEqual(P.aligned(views),
  {sameX:false,sameHeight:true,sameDepth:true});
 assert.equal(read(),1);
});
test('bad FIRST reads, mismatched model views, invalid scale and overflowing pixel results fail closed',()=>{
 const p=xyz(3,5,7),read=flip(p,'x',Infinity,3);
 assert.throws(()=>P.project(p));assert.equal(read(),1);
 assert.throws(()=>P.sheetPoint(xyz(1,2,3),{
  origin:{x:100,y:100},scale:0}));
 assert.throws(()=>P.toSheet('H',{u:1e308,v:2},
  {origin:{x:0,y:0},scale:1e308}),/溢出/);
 assert.equal(P.aligned({V:{u:1,v:2},H:{u:11,v:3},W:{u:3,v:2}}).sameX,false);
});
