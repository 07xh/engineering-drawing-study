'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {diagnoseJacobian:raw}=require(require('node:path').resolve(process.env.DRAFTAI_AUDIT_ROOT||process.cwd(),'core/numeric/jacobian-rank-evidence.cjs'));
const legacy=require(require('node:path').resolve(process.env.DRAFTAI_AUDIT_ROOT||process.cwd(),'knowledge/nonlinear-local-dof.js'));
const rank=(rows,options={})=>raw({rows,normalized:true,...options});
let state=20261022;
const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
function orthogonal(n){
 const q=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
 for(let k=0;k<4*n;k++){if(n===1)break;const p=k%n,r=(p+1+Math.floor(random()*(n-1)))%n;
 const angle=(random()-.5)*Math.PI,c=Math.cos(angle),s=Math.sin(angle);
 for(let i=0;i<n;i++){const x=q[i][p],y=q[i][r];q[i][p]=c*x-s*y;q[i][r]=s*x+c*y;}}
 return q;
}
test('known singular spectra: 320 deterministic dense rectangular matrices',()=>{
 let count=0,undetermined=0,maxError=0;
 for(let m=1;m<=8;m++)for(let n=1;n<=8;n++)for(let sample=0;sample<5;sample++){
  const k=Math.min(m,n),u=orthogonal(m),v=orthogonal(n);
  const spectrum=Array.from({length:k},(_,i)=>i===0?1:sample===0?0:10**(-i));
  const a=Array.from({length:m},(_,i)=>Array.from({length:n},(_,j)=>
   spectrum.reduce((sum,x,t)=>sum+u[i][t]*x*v[j][t],0)));
  const result=rank(a);
  const expected=spectrum.filter(x=>x>1e-10).length;
  assert.equal(result.rankEstimate,expected,'m='+m+' n='+n+' sample='+sample);
  if(!result.converged){assert.equal(result.status,'undetermined');undetermined++;}
  for(let i=0;i<n;i++){
   const error=Math.abs(result.singularRatios[i]-(spectrum[i]||0));
   maxError=Math.max(maxError,error);assert.ok(error<1e-12);
  }
  assert.ok(result.rankEstimate<=Math.min(m,n));count++;
 }
 console.log(JSON.stringify({knownSpectrumCases:count,undetermined,maxAbsoluteRatioError:maxError}));
});
test('uniform scale and row/column sign/permutation preserve rank',()=>{
 const a=[[1,2,3],[2,5,8],[0,1,1]];
 const baseline=rank(a);
 for(const scale of [1e-250,-1e-100,1,1e100,1e250]){
  const r=rank(a.slice().reverse().map(row=>row.slice().reverse().map(x=>-x*scale)));
  assert.equal(r.rankEstimate,baseline.rankEstimate);
  assert.equal(r.status,baseline.status);
  r.singularRatios.forEach((x,i)=>assert.ok(Math.abs(x-baseline.singularRatios[i])<1e-12));
 }
});
test('real legacy distance residual and gradient normalization are checked separately',()=>{
 for(const d of [1e-12,1e-9,1e-6,1,1e6]){
  const old=legacy.analyze({points:{A:{x:d,y:0},B:{x:0,y:0}},
   constraints:[{type:'distance',a:'A',b:'B',value:d}]});
  assert.equal(old.atProvidedConfiguration,true);assert.equal(old.maxResidual,0);
  assert.equal(old.rank,d<1e-8?0:1);
  const next=rank([[2*d,0,-2*d,0]]);
  assert.equal(next.rankEstimate,1);assert.equal(next.localDegreesEstimate,3);
  assert.equal(next.proofOfExistence,false);
 }
});
test('two circle candidates satisfy independent equations but neither is globally certified',()=>{
 for(const y of [-3,3]){
  assert.equal(4**2+y*y-25,0);assert.equal((4-8)**2+y*y-25,0);
  const r=rank([[8,2*y],[-8,2*y]]);
  assert.equal(r.rankEstimate,2);assert.equal(r.localDegreesEstimate,0);
  assert.equal(r.globallyUnique,null);assert.equal(r.solutionCount,null);
 }
});
test('nonzero residual does not acquire an existence claim from full rank',()=>{
 const r=rank([[1,0],[0,1]]);
 const residual=[10,20];assert.ok(Math.hypot(...residual)>0);
 assert.equal(r.status,'full-column-rank');assert.equal(r.proofOfExistence,false);
});
test('normalization promise does not automatically equalize residual scales',()=>{
 const a=rank([[1,0],[0,1e-12]]),b=rank([[1,0],[0,1]]);
 assert.equal(a.rankEstimate,1);assert.equal(b.rankEstimate,2);
 assert.equal(a.normalized,true);assert.equal(b.normalized,true);
 assert.equal(a.globallyUnique,null);
});
test('boundary around threshold is conservative and one sweep cannot certify convergence',()=>{
 for(const s of [1e-10/8,1e-10,1e-10*8]){
  assert.equal(rank([[1,0],[0,s]]).status,'undetermined');
 }
 assert.equal(rank([[1,2,3],[4,5,6],[7,8,10]],{maxSweeps:1}).status,'undetermined');
});
test('largest advertised 64x64 dense orthogonal matrix is accepted without input mutation',()=>{
 const q=orthogonal(64),before=JSON.stringify(q),r=rank(q);
 assert.equal(r.rankEstimate,64);assert.equal(r.converged,true);
 assert.equal(JSON.stringify(q),before);
 assert.equal(r.proofOfGlobalUniqueness,false);
});

