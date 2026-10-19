'use strict';
const assert=require('node:assert/strict');
const A={x:10,y:10},B={x:80,y:10},C={x:20,y:80};
const z=p=>10+.3*p.x+.4*p.y;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const cross=(a,b)=>a.x*b.y-a.y*b.x;
function intersection(p,q,r,s){const d=sub(q,p),e=sub(s,r),den=cross(d,e);if(Math.abs(den)<1e-9)return null;const t=cross(sub(r,p),e)/den;return {x:p.x+t*d.x,y:p.y+t*d.y}}
const vertices={A,B,C},others={A:[B,C],B:[A,C],C:[A,B]};
let count=0;
for(let x=12;x<=77;x+=5)for(let y=11;y<=77;y+=5){const k={x,y};for(const name of Object.keys(vertices)){
 const n=intersection(vertices[name],k,...others[name]);
 if(!n||Math.hypot(x-vertices[name].x,y-vertices[name].y)<1e-8)continue;
 const p=vertices[name];const t=Math.abs(n.x-p.x)>1e-7?(k.x-p.x)/(n.x-p.x):(k.y-p.y)/(n.y-p.y);
 const predicted=z(p)+t*(z(n)-z(p));
 assert(Math.abs(predicted-z(k))<1e-7,`inconsistent projection ${name} ${x},${y}`);count++;
}}
assert(count>100);console.log(`PASS ${count} auxiliary projection checks`);
