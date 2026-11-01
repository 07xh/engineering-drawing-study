'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../../core/projection/conventions.js');
const G=require('../../labs/dof-lab-geometry.js');
const T={origin:G.ORIGIN,scale:G.SCALE};
const near=(a,b)=>Math.abs(a-b)<1e-8;
test('model orthographic coordinates are independent of SVG origin and scale',()=>{
 const p={x:15,y:10,z:12},views=P.project(p);
 assert.deepEqual(views,{V:{u:15,v:12},H:{u:15,v:10},W:{u:10,v:12}});
 assert.deepEqual(P.aligned(views),{sameX:true,sameHeight:true,sameDepth:true});
 assert.equal(P.aligned({...views,W:{u:9,v:12}}).sameDepth,false);
});
test('legacy first-angle V/H/W math stays exactly compatible',()=>{
 for(const x of [0,12,35,58])for(const y of [0,18,44])for(const z of [0,25,51]){
  const p={x,y,z};
  const now=P.sheetPoint(p,T),old=G.projectPoint(p);
  for(const view of ['V','H','W','M'])assert.deepEqual(now[view],old[view]);
  const uv=P.project(p);
  for(const view of P.VIEWS){
   const reverse=P.fromSheet(view,now[view],T);
   assert(near(reverse.u,uv[view].u));assert(near(reverse.v,uv[view].v));
  }
 }
});
test('45-degree transfer preserves depth and height correspondence',()=>{
 const p={x:35,y:22,z:51},trace=P.transferGuides(p,T);
 assert.deepEqual(trace.guides.map(g=>g.kind),
  ['VH','height-VW','depth-45','depth-HM','depth-MW']);
 const diagonal=trace.guides.find(g=>g.kind==='depth-45');
 assert.deepEqual(diagonal.from,T.origin);
 assert.deepEqual(diagonal.to,trace.points.M);
 assert.equal(diagonal.sourceModelAxis,'y');
 assert.equal(diagonal.sourceModelValue,p.y);
 assert.equal(diagonal.constructionOnly,true);
 const {V,H,W,M}=trace.points;
 assert(near(V.x,H.x)&&near(V.y,W.y));
 assert(near(H.y-T.origin.y,W.x-T.origin.x));
 assert(near(M.x-T.origin.x,M.y-T.origin.y));
});
test('screen transforms reject invalid scale and never affect model coordinates',()=>{
 const p={x:12,y:25,z:33},before=P.project(p);
 assert.throws(()=>P.sheetPoint(p,{origin:{x:0,y:0},scale:0}));
 assert.throws(()=>P.project({x:12,y:Infinity,z:33}));
 P.sheetPoint(p,{origin:{x:999,y:-10},scale:17});
 assert.deepEqual(P.project(p),before);
});

test('first-angle 45-degree construction is correctly directed for positive/negative depth and omitted for zero depth',()=>{
 for(const y of [22,-22]){
  const origin={x:317,y:-89},scale=3;
  const t=P.transferGuides({x:8,y,z:13},{origin,scale});
  const d=t.guides.find(g=>g.kind==='depth-45');
  assert.ok(d,'nonzero depth requires a real diagonal stroke');
  assert.deepEqual(d.from,origin);
  assert.deepEqual(d.to,{x:origin.x+y*scale,y:origin.y+y*scale});
  assert.equal(d.to.x-d.from.x,d.to.y-d.from.y);
  assert.equal(Math.sign(d.to.x-d.from.x),Math.sign(y),
   'reverse or mirrored 45-degree guide must not be accepted');
  assert.deepEqual(t.guides.find(g=>g.kind==='depth-HM').to,d.to);
  assert.deepEqual(t.guides.find(g=>g.kind==='depth-MW').from,d.to);
 }
 const zero=P.transferGuides({x:8,y:0,z:13},T);
 assert.equal(zero.guides.some(g=>g.kind==='depth-45'),false,
  'do not manufacture a zero-length decorative 45-degree action');
});
