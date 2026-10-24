'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {intersectConvexRayHalfspaces:intersect,traceConvexRayDepth:trace}=
 require('../../core/numeric/convex-ray-depth.cjs');
const {certifyConvexPointRayClearance:clear}=
 require('../../core/numeric/convex-point-ray-clearance.cjs');
const P=(x,y,z)=>({x,y,z}),H=(id,normal,offsetMm)=>({id,normal,offsetMm});
const cube=()=>[
 H('x0',P(-1,0,0),0),H('x1',P(1,0,0),10),
 H('y0',P(0,-1,0),0),H('y1',P(0,1,0),10),
 H('z0',P(0,0,-1),0),H('z1',P(0,0,1),10)
];
const ray=(p,dir,faces=cube())=>
 intersect({point:p,observerDirection:dir,halfspaces:faces});
test('M0 ray input point and direction coordinates are read once before slab intersection',()=>{
 const point=P(-5,5,5),direction=P(1,0,0);let x=0,dx=0;
 Object.defineProperty(point,'x',{enumerable:true,get(){return ++x===1?-5:Infinity;}});
 Object.defineProperty(direction,'x',{enumerable:true,get(){return ++dx===1?1:-1;}});
 const r=ray(point,direction);
 assert.equal(x,1);assert.equal(dx,1);
 assert.equal(r.status,'hit');
 assert.equal(r.entryMm,5);assert.equal(r.exitMm,15);
});
test('M0 face normal and offset cannot change after validation or forge depth',()=>{
 const faces=cube();let reads=0,offsetReads=0;
 Object.defineProperty(faces[0].normal,'x',{
  enumerable:true,get(){return ++reads===1?-1:Infinity;}
 });
 Object.defineProperty(faces[1],'offsetMm',{
  enumerable:true,get(){return ++offsetReads===1?10:-10;}
 });
 const r=ray(P(-5,5,5),P(1,0,0),faces);
 assert.equal(reads,1);assert.equal(offsetReads,1);
 assert.equal(r.status,'hit');assert.equal(r.entryMm,5);
 assert.equal(r.exitMm,15);
});
test('M0 supplied solid identity and halfspace source are read once for depth ordering',()=>{
 const solid={id:'Cube',halfspaces:cube()};let ids=0,faces=0;
 const safe=solid.halfspaces;
 Object.defineProperty(solid,'id',{
  enumerable:true,get(){return ++ids===1?'Cube':'Forged';}
 });
 Object.defineProperty(solid,'halfspaces',{
  enumerable:true,get(){return ++faces===1?safe:[];}
 });
 const r=trace({point:P(-5,5,5),observerDirection:P(1,0,0),solids:[solid]});
 assert.equal(ids,1);assert.equal(faces,1);
 assert.equal(r.status,'occluded');assert.equal(r.nearestSolidId,'Cube');
 assert.equal(r.nearestDepthMm,5);
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.officialLineStyleVerified,false);
});
test('M0 true first-read NaN and sparse halfspace arrays fail closed',()=>{
 const p=P(-5,5,5);let reads=0;
 Object.defineProperty(p,'x',{enumerable:true,get(){return ++reads===1?Infinity:-5;}});
 assert.throws(()=>ray(p,P(1,0,0)),TypeError);assert.equal(reads,1);
 const half=cube();delete half[2];
 assert.throws(()=>ray(P(-5,5,5),P(1,0,0),half),TypeError);
 const c={id:'Cube',halfspaces:cube()};
 delete c.halfspaces[1];
 assert.throws(()=>clear({point:P(5,5,10),observerDirection:P(0,0,1),solid:c}),TypeError);
});
test('M0 point-ray genuine +Z open-clear proof uses same single source snapshot',()=>{
 const point=P(5,5,10),d=P(0,0,1),solid={id:'Cube',halfspaces:cube()};
 let px=0,dz=0,nz=0,sid=0;
 Object.defineProperty(point,'x',{enumerable:true,get(){return ++px===1?5:Infinity;}});
 Object.defineProperty(d,'z',{enumerable:true,get(){return ++dz===1?1:-1;}});
 Object.defineProperty(solid.halfspaces[5].normal,'z',{
  enumerable:true,get(){return ++nz===1?1:-1;}
 });
 Object.defineProperty(solid,'id',{enumerable:true,get(){return ++sid===1?'Cube':'Forged';}});
 const r=clear({point,observerDirection:d,solid});
 assert.equal(r.status,'certified-clear');
 assert.equal(r.reason,'outward-support-positive-open-ray');
 assert.equal(r.solidId,'Cube');
 assert.equal(px,1);assert.equal(dz,1);assert.equal(nz,1);assert.equal(sid,1);
 assert.equal(r.positiveOpenRayClearVerified,true);
 assert.equal(r.completeSceneVerified,false);assert.equal(r.v5Ready,false);
});
test('M0 strict missing or duplicate source face remains rejected and no fallback fake clear',()=>{
 const faces=cube(),point=P(5,5,10),dir=P(0,0,1);
 faces[3].id='x0';
 assert.throws(()=>ray(point,dir,faces),TypeError);
 assert.throws(()=>clear({point,observerDirection:dir,solid:{id:'Cube',halfspaces:faces}}),TypeError);
});
