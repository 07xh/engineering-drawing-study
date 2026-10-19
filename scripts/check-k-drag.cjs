'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('labs/constraints.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert(scripts.length>0,'missing inline script');
const script=scripts[0][1];
const start=script.indexOf('const z=p=>');
const end=script.indexOf('const unfoldPoint=');
assert(start>=0&&end>start,'geometry section not found');
const segment=script.slice(start,end);
const sliders={kx:{min:'12',max:'77'},ky:{min:'11',max:'77'}};
const geometry=vm.runInNewContext(
  'const $=id=>document.getElementById(id);\n'+segment+
  '\n({z,iso,planeMove,candidatePosition,coordinateState,VIEW_PRESETS,setConstraint:(o,n,h)=>{order=o;step=n;freeHeight=h},setCamera:(a,b,c)=>{yaw=a;pitch=b;zoom=c}})',
  {document:{getElementById:id=>sliders[id]}}
);
const startPt={x:35,y:35};
const equal2d=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-8);
for(const key of ['front','side','top']) {
 const view=geometry.VIEW_PRESETS[key];
 geometry.setCamera(view.yaw,view.pitch,1);
 const p={x:35,y:35,z:geometry.z(startPt)};
 const invisible=key==='front'?{...p,y:p.y+35}:key==='side'?{...p,x:p.x+35}:{...p,z:p.z+35};
 assert(equal2d(geometry.iso(p),geometry.iso(invisible)),key+' must collapse its depth coordinate');
 const start2d=geometry.iso(p);
 for(const xy of [{x:46,y:54},{x:20,y:18},{x:70,y:65}]){
   const end2d=geometry.iso({x:xy.x,y:xy.y,z:geometry.z(xy)});
   const moved=geometry.planeMove(startPt,end2d[0]-start2d[0],end2d[1]-start2d[1]);
   assert(moved,key+' plane drag must be invertible');
   assert.equal(moved.x,xy.x,key+' x drag');
   assert.equal(moved.y,xy.y,key+' y drag');
 }
}

for(const [yaw,pitch,zoom] of [[-.52,.47,1],[-.8,.5,.9],[.6,.7,1.1]]){
 geometry.setCamera(yaw,pitch,zoom);
 const a=geometry.iso({x:startPt.x,y:startPt.y,z:geometry.z(startPt)});
 for(const p of [{x:46,y:54},{x:20,y:18},{x:70,y:65}]){
  const b=geometry.iso({x:p.x,y:p.y,z:geometry.z(p)});
  const moved=geometry.planeMove(startPt,b[0]-a[0],b[1]-a[1]);
  assert(moved,'plane drag must be invertible in normal textbook views');
  assert.equal(moved.x,p.x,'horizontal coordinate must track drag');
  assert.equal(moved.y,p.y,'depth coordinate must track drag');
 }
}
geometry.setConstraint('H',0,65);
assert.equal(geometry.candidatePosition(startPt).z,65,'known H projection permits trial height');
const horizontal=geometry.coordinateState(startPt);
assert.equal(horizontal.degrees,1,'known horizontal projection leaves one degree of freedom');
assert(horizontal.x.includes('已知')&&horizontal.y.includes('已知'),'horizontal projection fixes x and y');
assert(horizontal.z.includes('?'),'horizontal projection does not determine z');
geometry.setConstraint('P',0,65);
assert.equal(geometry.candidatePosition(startPt).z,geometry.z(startPt),'known plane constrains trial height');
const plane=geometry.coordinateState(startPt);
assert.equal(plane.degrees,2,'plane alone leaves two degrees of freedom');
assert(plane.x.includes('可自由变化')&&plane.y.includes('可自由变化'));
geometry.setConstraint('H',1,65);
assert.equal(geometry.candidatePosition(startPt).z,geometry.z(startPt),'combined constraints lock point to intersection');
const fixed=geometry.coordinateState(startPt);
assert.equal(fixed.degrees,0,'combined constraints leave no free coordinate');
console.log('PASS draggable K inverse projection and constrained candidate positions');
