'use strict';

/**
 * M0-C opt-in numerical rank evidence using a one-sided Jacobi SVD.
 * Only accepts caller-normalized, dimensionless Jacobian entries.
 * Never supplies a proof of existence, global uniqueness or true manifold dimension.
 * No existing solver imports this module.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const DEFAULT_RELATIVE_THRESHOLD=1e-10;
const MIN_THRESHOLD=64*Number.EPSILON;
const PAIR_COS_TOLERANCE=16*Number.EPSILON;

function diagnoseJacobian({rows,normalized=false,relativeThreshold=DEFAULT_RELATIVE_THRESHOLD,maxSweeps=60}={}){
  if(normalized!==true)
    throw new TypeError('Jacobian rows must be explicitly normalized to dimensionless entries');
  if(!Array.isArray(rows)||rows.length<1||rows.length>64||
      !Object.hasOwn(rows,0))
    throw new RangeError('Jacobian must be a nonempty matrix of at most 64x64');
  // Only one read of the first row, including its shape. Subsequent reads
  // must use these detached coefficients, not caller-controlled getters.
  const first=rows[0];
  if(!Array.isArray(first)||first.length<1||first.length>64)
    throw new RangeError('Jacobian must be a nonempty matrix of at most 64x64');
  const m=rows.length,n=first.length;
  // Map/some/flat skip sparse indices. Snapshot EVERY row and coefficient
  // once before computing scales, singular values, or rank estimates.
  const values=Array.from({length:m},(_,i)=>{
    if(!Object.hasOwn(rows,i))
      throw new TypeError('Jacobian rows must be rectangular and finite');
    const row=i===0?first:rows[i];
    if(!Array.isArray(row)||row.length!==n)
      throw new TypeError('Jacobian rows must be rectangular and finite');
    return Array.from({length:n},(_,j)=>{
      if(!Object.hasOwn(row,j))
        throw new TypeError('Jacobian entries must be present and finite');
      const entry=row[j];
      if(!finite(entry))
        throw new TypeError('Jacobian entries must be present and finite');
      return entry;
    });
  });
  if(!finite(relativeThreshold)||relativeThreshold<MIN_THRESHOLD||relativeThreshold>=1)
    throw new RangeError('relativeThreshold must be finite and between 64*EPS and 1');
  if(!Number.isInteger(maxSweeps)||maxSweeps<1||maxSweeps>100)
    throw new RangeError('maxSweeps must be an integer in 1..100');

  const scale=Math.max(...values.flat().map(Math.abs));
  const base={kind:'normalized-jacobian-rank-evidence',rows:m,columns:n,
    relativeThreshold,normalized:true,proofOfExistence:false,
    proofOfGlobalUniqueness:false,globallyUnique:null,solutionCount:null};
  if(scale===0)return {...base,matrixMaxEntry:0,singularRatios:Array(n).fill(0),
    rankEstimate:0,localDegreesEstimate:n,conditionEstimate:null,
    converged:true,sweeps:0,thresholdSensitive:false,status:'rank-deficient'};

  // Scaling the whole matrix first avoids overflow in column inner products.
  // Singular values are returned as ratios; no absolute unit is implied.
  // A small nonzero Jacobian coefficient can vanish while scaling by
  // the largest entry (e.g. 1e-308 / 1e308 -> 0). Once lost, a rank claim
  // based on this scaled matrix would be unsupported.
  let numericUnderflowDetected=false;
  const a=values.map(row=>row.map(v=>{
    const normalized=v/scale;
    if(v!==0&&normalized===0)numericUnderflowDetected=true;
    return normalized;
  }));
  let converged=false,sweeps=0;
  for(let sweep=0;sweep<maxSweeps;sweep++){
    sweeps=sweep+1;
    let rotated=false;
    for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){
      let alpha=0,beta=0,gamma=0;
      for(let i=0;i<m;i++){
        const x=a[i][p],y=a[i][q];
        alpha+=x*x; beta+=y*y; gamma+=x*y;
      }
      if(alpha===0||beta===0||gamma===0){
        // Squared column norms and dot products can underflow even when
        // entries are finite and nonzero (e.g. 1e-200). Do not certify
        // convergence or a condition number for this unresolved pair.
        if((alpha===0&&a.some(row=>row[p]!==0))||
           (beta===0&&a.some(row=>row[q]!==0))||
           (gamma===0&&a.some(row=>row[p]!==0&&row[q]!==0&&row[p]*row[q]===0)))
          numericUnderflowDetected=true;
        continue;
      }
      if(Math.abs(gamma)<=PAIR_COS_TOLERANCE*Math.sqrt(alpha)*Math.sqrt(beta))continue;
      rotated=true;
      const tau=(beta-alpha)/(2*gamma);
      const t=Math.sign(tau||1)/(Math.abs(tau)+Math.hypot(1,tau));
      const c=1/Math.hypot(1,t),s=t*c;
      for(let i=0;i<m;i++){
        const x=a[i][p],y=a[i][q];
        a[i][p]=c*x-s*y;
        a[i][q]=s*x+c*y;
      }
    }
    if(!rotated){converged=true;break;}
  }
  // A one-sided Jacobi rotation orthogonalizes columns; their norms estimate
  // the singular values. This is only numeric evidence, not a verified SVD.
  const singular=Array.from({length:n},(_,j)=>Math.hypot(...a.map(row=>row[j]))).sort((a,b)=>b-a);
  const top=singular[0];
  if(!finite(top)||top===0)throw new RangeError('numeric rank computation underflowed');
  const ratios=singular.map(v=>v/top);
  if(ratios.some(v=>!finite(v)))throw new RangeError('nonfinite singular ratio');
  const rank=ratios.filter(v=>v>relativeThreshold).length;
  const sensitive=ratios.some(v=>v>0&&v>=relativeThreshold/8&&v<=relativeThreshold*8);
  const smallest=ratios[ratios.length-1];
  const estimate=smallest===0?null:1/smallest;
  return {...base,matrixMaxEntry:scale,singularRatios:ratios,
    rankEstimate:rank,localDegreesEstimate:n-rank,
    conditionEstimate:!numericUnderflowDetected&&finite(estimate)?estimate:null,
    converged:converged&&!numericUnderflowDetected,sweeps,
    thresholdSensitive:sensitive,numericUnderflowDetected,
    status:(!converged||sensitive||numericUnderflowDetected)?'undetermined':
      (rank<n?'rank-deficient':'full-column-rank')};
}
module.exports={diagnoseJacobian,DEFAULT_RELATIVE_THRESHOLD,MIN_THRESHOLD};
