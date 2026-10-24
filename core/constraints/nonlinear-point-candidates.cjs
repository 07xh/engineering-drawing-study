'use strict';
/**
 * M3 exploratory NONLINEAR point-constraint candidates. Reuses M0 Euclidean
 * and independently recomputed M0 Jacobian rank evidence. No claim of global
 * existence, uniqueness, tangent multiplicity, topological or V5 proof.
 *
 * Explicit reviewed initial guesses are required: solver never guesses a
 * geometric branch or upgrades numerical convergence to verified geometry.
 */
const M0=require('../numeric/euclidean-kernel.cjs');
const {diagnoseJacobian}=require('../numeric/jacobian-rank-evidence.cjs');
const {validateSolveResult}=require('../contracts/solve-result.js');
const {deriveTwoDistanceSubgraphEvidence}=
 require('./nonlinear-distance-branch-graph.cjs');
const ID=/^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const number=n=>typeof n==='number'&&Number.isFinite(n);
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const LIMIT=1e5,MAX_POINTS=4,MAX_SEEDS=6,MAX_EQUATIONS=40,RESIDUAL_TOL=1e-6;
function fail(s){throw new TypeError('M3 nonlinear point constraint: '+s);}
function exact(obj,fields){
 if(!plain(obj)||Object.keys(obj).length!==fields.length||
   Object.keys(obj).some(k=>!fields.includes(k)))fail('unexpected or forged input fields');
}
function frozen(o){if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;}
function solveLinear(a,b){
 const n=b.length,m=a.map((row,i)=>[...row,b[i]]);
 for(let i=0;i<n;i++){
  let k=i;for(let j=i+1;j<n;j++)if(Math.abs(m[j][i])>Math.abs(m[k][i]))k=j;
  if(!number(m[k][i])||Math.abs(m[k][i])<1e-14)return null;
  [m[i],m[k]]=[m[k],m[i]];
  const p=m[i][i];
  for(let j=i;j<=n;j++)m[i][j]/=p;
  for(let row=0;row<n;row++){
   if(row===i)continue;
   const t=m[row][i];
   for(let j=i;j<=n;j++)m[row][j]-=t*m[i][j];
  }
 }
 const out=m.map(row=>row[n]);
 return out.every(number)?out:null;
}
function solveNonlinearPointCandidates(input={}){
 exact(input,['frame','unit','points','constraints','seeds','revision']);
 const {frame,unit,points,constraints,seeds,revision}=input;
 if(unit!=='mm'||!['model-mm-2d','model-mm-3d'].includes(frame)||
   !Number.isSafeInteger(revision)||revision<0)
  fail('explicit model-mm frame and current revision required');
 const axes=frame==='model-mm-3d'?['x','y','z']:['x','y'];
 const d=axes.length;
 if(!Array.isArray(points)||!points.length||points.length>MAX_POINTS||
   !Array.isArray(constraints)||!constraints.length||constraints.length>MAX_EQUATIONS||
   !Array.isArray(seeds)||!seeds.length||seeds.length>MAX_SEEDS)
  fail('bounded points, equations and human-picked seeds required');
 const ids=new Map();
 for(const p of points){
  exact(p,['id']);
  if(typeof p.id!=='string'||!ID.test(p.id)||ids.has(p.id))
   fail('duplicate or invalid point ID');
  ids.set(p.id,ids.size);
 }
 const validPoint=id=>{if(typeof id!=='string'||!ids.has(id))fail('unknown point '+id);};
 const coords=v=>{
  exact(v,axes);
  const a=axes.map(k=>v[k]);
  if(a.some(n=>!number(n)||Math.abs(n)>LIMIT))
   fail('nonfinite or unbounded model-mm coordinate');
  return a;
 };
 const factors=[],fids=new Set();
 for(const c of constraints){
  if(!plain(c)||typeof c.id!=='string'||!ID.test(c.id)||fids.has(c.id))
   fail('duplicate or invalid constraint ID');
  fids.add(c.id);
  if(c.kind==='fixed'){exact(c,['id','kind','point','at']);validPoint(c.point);coords(c.at);}
  else if(c.kind==='axis'){
   exact(c,['id','kind','point','axis','value']);
   validPoint(c.point);
   if(!axes.includes(c.axis)||!number(c.value)||Math.abs(c.value)>LIMIT)
    fail('invalid axis constraint');
  }else if(c.kind==='coincident'){
   exact(c,['id','kind','a','b']);validPoint(c.a);validPoint(c.b);
   if(c.a===c.b)fail('same-point coincidence invalid');
  }else if(c.kind==='offset'){
   exact(c,['id','kind','from','to','delta']);validPoint(c.from);validPoint(c.to);
   if(c.from===c.to)fail('same-point displacement invalid');coords(c.delta);
  }else if(c.kind==='midpoint'){
   exact(c,['id','kind','mid','a','b']);
   for(const id of [c.mid,c.a,c.b])validPoint(id);
   if(new Set([c.mid,c.a,c.b]).size!==3)fail('midpoint requires distinct points');
  }else if(c.kind==='distance'){
   exact(c,['id','kind','a','b','value']);validPoint(c.a);validPoint(c.b);
   if(c.a===c.b||!number(c.value)||c.value<=0||c.value>LIMIT)
    fail('distance needs two different points and positive mm');
  }else if(c.kind==='angle'){
   exact(c,['id','kind','a','vertex','b','degrees']);
   for(const id of [c.a,c.vertex,c.b])validPoint(id);
   if(new Set([c.a,c.vertex,c.b]).size!==3||
      !number(c.degrees)||c.degrees<=0||c.degrees>=180)
    fail('angle requires three different points and angle strictly between 0° and 180°');
  }else fail('unsupported nonlinear factor '+String(c.kind));
  factors.push(c);
 }
 const scalarCount=factors.reduce((sum,c)=>
   sum+(c.kind==='fixed'||c.kind==='offset'||c.kind==='coincident'||
     c.kind==='midpoint'?d:1),0);
 if(scalarCount>64)fail('too many independent scalar equation rows for M0 Jacobian');
 const guesses=[];
 for(const seed of seeds){
  exact(seed,['id','coordinates']);
  if(typeof seed.id!=='string'||!ID.test(seed.id)||guesses.some(s=>s.id===seed.id))
   fail('duplicate or invalid seed identity');
  if(!plain(seed.coordinates)||Object.keys(seed.coordinates).length!==ids.size)
   fail('every initial guess must cover exactly the declared point IDs');
  const flat=[];
  for(const id of ids.keys())flat.push(...coords(seed.coordinates[id]));
  guesses.push({id:seed.id,flat});
 }
 const n=ids.size*d;
 const evaluation=x=>{
  if(!Array.isArray(x)||x.length!==n||x.some(v=>!number(v)||Math.abs(v)>LIMIT*2))
   throw new RangeError('nonfinite or out-of-bound iteration');
  const pos=id=>x.slice(ids.get(id)*d,(ids.get(id)+1)*d);
  const dif=(a,b)=>M0.subtract(pos(a),pos(b));
  const residuals=[];
  for(const c of factors){
   const push=v=>{if(!number(v))throw new RangeError('nonfinite nonlinear residual');residuals.push(v);};
   if(c.kind==='fixed'){
    const p=pos(c.point);for(let j=0;j<d;j++)push(p[j]-c.at[axes[j]]);
   }else if(c.kind==='axis')push(pos(c.point)[axes.indexOf(c.axis)]-c.value);
   else if(c.kind==='coincident'){
    for(const v of dif(c.a,c.b))push(v);
   }else if(c.kind==='offset'){
    const v=dif(c.to,c.from);for(let j=0;j<d;j++)push(v[j]-c.delta[axes[j]]);
   }else if(c.kind==='midpoint'){
    const mid=pos(c.mid),a=pos(c.a),b=pos(c.b);
    for(let j=0;j<d;j++)push(mid[j]-(a[j]+b[j])/2);
   }else if(c.kind==='distance')push(M0.norm(dif(c.a,c.b))-c.value);
   else if(c.kind==='angle'){
    const u=dif(c.a,c.vertex),v=dif(c.b,c.vertex),
      lu=M0.norm(u),lv=M0.norm(v);
    if(lu<1e-10||lv<1e-10)
     throw new RangeError('degenerate angle ray');
    const dot=M0.dot(u,v)/(lu*lv);
    const theta=Math.acos(Math.max(-1,Math.min(1,dot)));
    // Convert radians using an explicit 1mm/rad numeric
    // residual scale; not an exact physical angle-length identity.
    push(theta-c.degrees*Math.PI/180);
   }
  }
  return residuals;
 };
 const jacobian=(x)=>{
  const base=evaluation(x),rows=base.map(()=>Array(n).fill(0));
  for(let j=0;j<n;j++){
   const h=1e-5*Math.max(1,Math.abs(x[j]));
   const plus=x.slice(),minus=x.slice();plus[j]+=h;minus[j]-=h;
   const p=evaluation(plus),m=evaluation(minus);
   for(let i=0;i<rows.length;i++){
    const value=(p[i]-m[i])/(2*h);
    if(!number(value))throw new RangeError('nonfinite Jacobian');
    rows[i][j]=value;
   }
  }
  return rows;
 };
 const inf=r=>Math.max(...r.map(Math.abs)),cost=r=>r.reduce((s,v)=>s+v*v,0);
 const reports=[],candidates=[];
 for(const seed of guesses){
  let x=seed.flat.slice(),lambda=1e-2,status='not-converged',
    steps=0,residual=null,jacobianRank=null,degreeEstimate=null,rankState=null;
  try{
   let fx=evaluation(x),objective=cost(fx);
   for(let k=0;k<85;k++){
    steps=k+1;
    if(inf(fx)<=RESIDUAL_TOL){status='locally-consistent';break;}
    const j=jacobian(x);
    const a=Array.from({length:n},()=>Array(n).fill(0)),b=Array(n).fill(0);
    for(let row=0;row<j.length;row++)
     for(let col=0;col<n;col++){
      b[col]-=j[row][col]*fx[row];
      for(let other=0;other<n;other++)a[col][other]+=j[row][col]*j[row][other];
     }
    for(let col=0;col<n;col++)a[col][col]+=lambda;
    const dx=solveLinear(a,b);
    if(!dx)break;
    const next=x.map((v,i)=>v+dx[i]);
    if(next.some(v=>!number(v)||Math.abs(v)>LIMIT*2)){lambda*=10;continue;}
    const proposed=evaluation(next),nextCost=cost(proposed);
    if(!number(nextCost))break;
    if(nextCost<objective){
     x=next;fx=proposed;objective=nextCost;lambda=Math.max(1e-10,lambda/3);
    }else lambda=Math.min(1e12,lambda*8);
   }
   fx=evaluation(x);residual=inf(fx);
   if(residual<=RESIDUAL_TOL){
    const j=jacobian(x);
    const rank=diagnoseJacobian({rows:j,normalized:true});
    rankState=rank.status;
    if(rank.converged&&!rank.thresholdSensitive&&
       !rank.numericUnderflowDetected&&rank.status!=='undetermined'){
      jacobianRank=rank.rankEstimate;degreeEstimate=rank.localDegreesEstimate;
    }
    if(!candidates.some(c=>Math.hypot(...c.flat.map((v,i)=>v-x[i]))<1e-4)){
     const points=Object.fromEntries([...ids].map(([id,i])=>
      [id,Object.fromEntries(axes.map((axis,j)=>[axis,x[i*d+j]]))]));
     candidates.push({seedId:seed.id,maxScaledResidual:residual,points,flat:x.slice(),
      rank:jacobianRank,localDegreesEstimate:degreeEstimate,
      rankStatus:rankState});
    }
    status='locally-consistent';
   }
  }catch(e){status='degenerate-or-numeric-failure';}
  reports.push({seedId:seed.id,status,iterations:steps,
   maxScaledResidual:residual,rank:jacobianRank,
   localDegreesEstimate:degreeEstimate,rankStatus:rankState});
 }
 // Critically, even a full-column local Jacobian is NOT global uniqueness
 // evidence. Several seeds finding only one branch proves nothing about
 // missing branches. Keep canonical SolveResult explicitly undetermined.
 // Independent algebraic witness can prove completeness only for the
 // projected pair of anchored distance factors, not the full input graph.
 const analyticSubgraphEvidence=deriveTwoDistanceSubgraphEvidence({
  frame,unit,points,constraints,revision});
 const solveResult={id:'NonlinearPointSystem',status:'undetermined',
  scope:frame+'-nonlinear-seeded-point-candidates',
  solutions:[],solutionCount:null,degrees:null,localDegrees:null,rank:null,
  globallyUnique:null,maxResidual:null,proofLevel:'local-first-order',
  diagnostics:[
   'Candidate seeds are explicit user inputs, not an exhaustive branch enumeration.',
   'A low residual and local Jacobian rank are numerical evidence only.',
   'No global existence, uniqueness, completeness, source review or V5 eligibility.'
  ]};
 const valid=validateSolveResult(solveResult);
 if(!valid.ok)fail('canonical SolveResult invalid: '+valid.errors.join('; '));
 return frozen({schema:'draftai-m3-nonlinear-point-candidates/1',revision,
  frame,unit,kind:'point-constraint-system',status:candidates.length?
   candidates.length>1?'distinct-local-candidates':'local-candidate':'undetermined',
  variableCount:n,scalarConstraintCount:scalarCount,
  constraintIds:factors.map(c=>c.id),
  toleranceScaled:RESIDUAL_TOL,
  // Angle rows use an explicit 1 mm/radian residual normalization;
  // maxScaledResidual must not be mistaken for a pure physical mm residual.
  residualScale:'distance-mm-angle-1mm-per-radian',
  localCandidates:candidates.map(({flat,...c})=>c),
  seedReports:reports,solveResult,analyticSubgraphEvidence,
  geometry:[],mathematicallyVerified:false,
  sourceProblemConfirmed:false,globalBranchEnumerationComplete:false,
  fullEngineeringDrawingVerified:false,constructionIntents:[],
  constructionSteps:[],v5Ready:false});
}
module.exports={solveNonlinearPointCandidates};
