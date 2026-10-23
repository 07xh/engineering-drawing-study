'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {externalLineCircleFillets:solve}=
 require('../../engines/planar/offset-tangency.cjs');
const line={a:{x:0,y:0},b:{x:20,y:0}},circle={center:{x:8,y:6},radius:2};
const near=(a,b,tol=1e-7)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,
 String(a)+' should equal '+String(b));
const solveOriginal=()=>solve({line,circle,filletRadius:3,side:1});
const byX=r=>[...r.candidates].sort((a,b)=>a.center.x-b.center.x);
function independentG0Evidence(r,originalLine,originalCircle,R,scale=1){
 assert.equal(r.status,'multiple');assert.equal(r.candidateCount,2);
 assert.equal(r.continuousDegreesOfFreedom,0);
 for(const c of r.candidates){
  const {center,lineContact,circleContact}=c;
  near(lineContact.y,originalLine.a.y,1e-8*scale);
  near(Math.hypot(center.x-lineContact.x,center.y-lineContact.y),R,1e-8*scale);
  near(Math.hypot(center.x-circleContact.x,center.y-circleContact.y),R,1e-8*scale);
  near(Math.hypot(circleContact.x-originalCircle.center.x,
   circleContact.y-originalCircle.center.y),originalCircle.radius,1e-8*scale);
  near(Math.hypot(center.x-originalCircle.center.x,
   center.y-originalCircle.center.y),R+originalCircle.radius,1e-8*scale);
  assert.ok(c.maxResidual<=1e-8*scale);
 }
}
test('02 real external line-circle solver preserves two analytic contact branches',()=>{
 const r=solveOriginal();independentG0Evidence(r,line,circle,3);
 const cs=byX(r);near(cs[0].center.x,4);near(cs[1].center.x,12);
 near(cs[0].center.y,3);near(cs[1].center.y,3);
});
test('02 translation and common scaling preserve branch geometry and contact residuals',()=>{
 const original=byX(solveOriginal());
 for(const s of [.001,.5,2,1000]){
  const tr=p=>({x:p.x*s+100,y:p.y*s-200});
  const l={a:tr(line.a),b:tr(line.b)};
  const c={center:tr(circle.center),radius:circle.radius*s};
  const r=solve({line:l,circle:c,filletRadius:3*s,side:1});
  independentG0Evidence(r,l,c,3*s,s);
  for(const [i,candidate] of byX(r).entries()){
   near(candidate.center.x,original[i].center.x*s+100,1e-7*Math.max(1,s));
   near(candidate.center.y,original[i].center.y*s-200,1e-7*Math.max(1,s));
  }
 }
});
test('02 line reversal and side inversion preserve the same center branches',()=>{
 const original=byX(solveOriginal());
 const reverse={a:line.b,b:line.a};
 const result=solve({line:reverse,circle,filletRadius:3,side:-1});
 assert.equal(result.status,'multiple');
 for(const [i,c] of byX(result).entries()){
  near(c.center.x,original[i].center.x);near(c.center.y,original[i].center.y);
 }
});
test('02 remote circle returns no fabricated tangent candidates',()=>{
 const r=solve({line,circle:{center:{x:8,y:30},radius:2},filletRadius:3,side:1});
 assert.equal(r.status,'none');assert.equal(r.candidates.length,0);
 assert.equal(r.candidateCount,0);
});
test('02 malformed tangency input fails closed',()=>{
 assert.throws(()=>solve({line:{a:{x:0,y:0},b:{x:0,y:0}},circle,filletRadius:3,side:1}));
 assert.throws(()=>solve({line,circle,filletRadius:0,side:1}));
 assert.throws(()=>solve({line,circle,filletRadius:3,side:0}));
});
