'use strict';
/**
 * M0 reusable analytic TWO-CIRCLE locus branch classification (model mm, 2D).
 *
 * Proof scope: two explicit Euclidean distance loci ONLY. Their difference
 * gives the radical axis; intersection with either circle gives at most two
 * transverse points. Strict numerical separation guards are mandatory.
 * Near tangencies and nearly concentric data are UNDETERMINED rather than
 * claiming exact multiplicity. This is not a general nonlinear equation
 * solver, formal interval arithmetic, source confirmation or V5 clearance.
 */
const {norm,subtract}=require('../numeric/euclidean-kernel.cjs');
const ID=/^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);
  Object.freeze(x);
 }
 return x;
};
function reject(s){throw new TypeError('M0 two-circle algebraic branches: '+s);}
function keys(value,expected){
 if(!plain(value)||Object.keys(value).length!==expected.length||
    Object.keys(value).some(k=>!expected.includes(k)))
  reject('input fields are not the exact source circle contract');
}
function circle(x){
 keys(x,['id','center','radiusMm']);
 if(typeof x.id!=='string'||!ID.test(x.id))reject('invalid circle source ID');
 keys(x.center,['x','y']);
 if(!finite(x.center.x)||!finite(x.center.y)||
    Math.max(Math.abs(x.center.x),Math.abs(x.center.y))>1e5||
    !finite(x.radiusMm)||x.radiusMm<=0||x.radiusMm>1e5)
  reject('finite bounded model-mm circle required');
 return x;
}
function classifyTwoCircleLoci({first,second,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  reject('current source revision required');
 const a=circle(first),b=circle(second);
 if(a.id===b.id)reject('two distinct source circle IDs required');
 const delta=subtract([b.center.x,b.center.y],[a.center.x,a.center.y]);
 const d=norm(delta),r=a.radiusMm,s=b.radiusMm;
 const scale=Math.max(1,Math.abs(a.center.x),Math.abs(a.center.y),
   Math.abs(b.center.x),Math.abs(b.center.y),r,s,d);
 // Widen enough for FP cancellation, while declaring nearby topological
 // transitions undecidable. Never snap near-tangent roots into a double root.
 const guard=Math.max(1e-8,scale*2e-10);
 const common={schema:'draftai-m0-two-circle-branches/1',revision,
  sourceCircleIds:[a.id,b.id],unit:'mm',
  scope:'two-reviewed-2d-distance-loci-only',centerSeparationMm:d,
  boundaryGuardMm:guard,
  proofMethod:'radical-axis-and-quadratic-discriminant-with-separation-guard',
  globalConstraintSystemVerified:false,
  originalImageSourceConfirmed:false,
  completeEngineeringDrawingVerified:false,
  constructionIntentReady:false,officialLineStylesVerified:false,v5Ready:false};
 const report=(status,count,branches=[],reason=null)=>{
  const ready=['two-separated-roots','strictly-disjoint','coincident-continuum'].includes(status);
  return freeze({...common,status,reason,branches,
   branchCount:count,
   exhaustiveAlgebraicTopologyWithinTwoLoci:ready,
   // Topology of just these circles, NOT an arbitrary surrounding M3 graph.
   rootsNumericallyRechecked:branches.length===2,
   branchCoverageForOtherConstraintsVerified:false});
 };
 if(d===0){
  if(r===s)return report('coincident-continuum',null,[],
   'the two input loci are identical: an infinite 1D set');
  return report('strictly-disjoint',0,[],
   'concentric circles have unequal positive radii');
 }
 if(d<=guard)return report('undetermined',null,[],
  'nearly coincident centers have unstable radical-axis direction');
 const outer=r+s,inner=Math.abs(r-s);
 if(d>outer+guard)return report('strictly-disjoint',0,[],
  'distance between centers exceeds sum of radii by a strict margin');
 if(d<inner-guard)return report('strictly-disjoint',0,[],
  'one circle is strictly inside the other without boundary contact');
 if(Math.abs(d-outer)<=guard||Math.abs(d-inner)<=guard)
  return report('undetermined',null,[],
   'tangency or near tangency: floating-point inputs cannot prove multiplicity');
 const axis=delta.map(v=>v/d);
 const along=(r*r-s*s+d*d)/(2*d);
 const heightSquared=r*r-along*along;
 if(!finite(along)||!finite(heightSquared)||
    heightSquared<=Math.max(guard*scale*8,guard*guard))
  return report('undetermined',null,[],
   'radical-axis discriminant is not separated from zero');
 const height=Math.sqrt(heightSquared);
 if(!finite(height)||height<=guard)return report('undetermined',null,[],
  'intersection pair could be numerically coincident');
 const foot=[a.center.x+along*axis[0],a.center.y+along*axis[1]];
 const perp=[-axis[1],axis[0]];
 const roots=[
  {x:foot[0]+height*perp[0],y:foot[1]+height*perp[1]},
  {x:foot[0]-height*perp[0],y:foot[1]-height*perp[1]}
 ].sort((p,q)=>p.x-q.x||p.y-q.y);
 if(roots.some(p=>!finite(p.x)||!finite(p.y))||
    norm([roots[0].x-roots[1].x,roots[0].y-roots[1].y])<=2*guard)
  return report('undetermined',null,[],
   'two numerically computed roots are not demonstrably separated');
 const branches=roots.map((p,i)=>{
  const residualA=norm(subtract([p.x,p.y],[a.center.x,a.center.y]))-r,
    residualB=norm(subtract([p.x,p.y],[b.center.x,b.center.y]))-s;
  return {id:'TwoCircleBranch'+(i+1),pointModelMm:p,
   circleResidualsMm:{[a.id]:residualA,[b.id]:residualB},
   maxAbsResidualMm:Math.max(Math.abs(residualA),Math.abs(residualB)),
   sourceCircleIds:[a.id,b.id],
   globallyVerifiedOutsideTheseTwoLoci:false};
 });
 if(branches.some(x=>x.maxAbsResidualMm>guard))
  return report('undetermined',null,[],
   'independent circle residual checks exceeded geometric guard');
 return report('two-separated-roots',2,branches,
  'strict radical-axis separation; two opposite quadratic roots rechecked');
}
module.exports={classifyTwoCircleLoci};
