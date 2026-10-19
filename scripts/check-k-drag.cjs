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
  '\n({z,iso,planeMove,candidatePosition,setConstraint:(o,n,h)=>{order=o;step=n;freeHeight=h},setCamera:(a,b,c)=>{yaw=a;pitch=b;zoom=c}})',
  {document:{getElementById:id=>sliders[id]}}
);
const startPt={x:35,y:35};
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
geometry.setConstraint('P',0,65);
assert.equal(geometry.candidatePosition(startPt).z,geometry.z(startPt),'known plane constrains trial height');
geometry.setConstraint('H',1,65);
assert.equal(geometry.candidatePosition(startPt).z,geometry.z(startPt),'combined constraints lock point to intersection');
console.log('PASS draggable K inverse projection and constrained candidate positions');
