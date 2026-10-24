'use strict';
/**
 * 07 integration of EXISTING 04 open-interval ray proofs (#432) into the
 * EXISTING cone V5 plan (#428/#431). Not a second geometry/visibility solver.
 *
 * A ray points from the source boundary TOWARD the observer. We accept only
 * the explicit axis rays matching the shared V/H/W projection coordinates;
 * a different camera direction must not borrow those view names.
 *
 * A straight V5 stroke approximates an analytic lateral arc. Its visibility
 * label describes only the OPEN source arc, never a certified endpoint,
 * silhouette root, 2D chord occlusion, entire section or official line style.
 */
const {classifyConeSectionVisibility}=
 require('../engines/spatial/sections/cone-cut-ray-visibility.cjs');
const {VIEWS,FIRST_ANGLE_OBSERVER_RAYS:DIRS,
 validateFirstAngleObserverRays:validatedDirections}=
 require('../core/projection/conventions.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const statuses=Object.freeze(['visible','hidden','undetermined']);
function coneV5OpenRayEvidence(cone,plane,{
 kind,samples,sourceConfirmed,retainedHalfspace,observerDirections,analytic
}={}){
 if(sourceConfirmed!==true)
  throw new TypeError('confirmed M3 spatial source required');
 if(!['positive','negative'].includes(retainedHalfspace))
  throw new TypeError('explicit retainedHalfspace required');
 if(!['full-ellipse','clipped-ellipse'].includes(kind))
  throw new TypeError('unsupported cone proof scope');
 if(!Number.isSafeInteger(samples)||samples<32||samples>256||
    !analytic||!Array.isArray(analytic.parameterRadians)||
    analytic.parameterRadians.length!==2)
  throw new TypeError('bounded, verified cone analytic parameter range required');
 const directions=validatedDirections(observerDirections);
 const [begin,end]=analytic.parameterRadians,step=(end-begin)/samples;
 if(!finite(begin)||!finite(end)||!finite(step)||step<=0||
    end-begin>2*Math.PI+1e-8)
  throw new RangeError('nonfinite/invalid cone curve parameter domain');
 const views={},counts={visible:0,hidden:0,undetermined:0};
 for(const view of VIEWS){
  const proof=classifyConeSectionVisibility(cone,plane,{
   kind,sourceConfirmed:true,retainedHalfspace,
   observerDirection:directions[view],samples
  });
  if(proof.status!=='ready'||proof.modelUnit!=='mm'||
     proof.sourceBoundaryVerified!==true||
     proof.boundaryEndpointsVerified!==false||
     proof.standardViewMappingVerified!==false||
     proof.v5LineStylesReady!==false||
     proof.visibilityVerified!==false)
   throw new RangeError('section visibility evidence is not scope-safe');
  const laterals=proof.runs.filter(x=>x.kind==='lateral-arc');
  const chords=proof.runs.filter(x=>x.kind==='cap-chord');
  if(!laterals.length||chords.length!==(kind==='clipped-ellipse'?1:0)||
     laterals.some(x=>!Array.isArray(x.angularInterval)||
      x.angularInterval.length!==2||!statuses.includes(x.visibility)))
   throw new RangeError('invalid cone visibility interval partition');
  // Independent coverage check: runs must partition the source curve,
  // and a gap cannot be silently colored as visible or hidden.
  const tol=2e-8,margin=1e-8;
  let prior=begin;
  for(const run of laterals){
   if(Math.abs(run.angularInterval[0]-prior)>tol||
      !finite(run.angularInterval[1])||
      run.angularInterval[1]<=prior)
    throw new RangeError('gapped/reordered ray visibility intervals');
   prior=run.angularInterval[1];
  }
  if(Math.abs(prior-end)>tol)
   throw new RangeError('incomplete cone visibility intervals');
  const lateral=[];
  for(let i=1;i<=samples;i++){
   const lo=begin+(i-1)*step,hi=begin+i*step;
   // Strict containment avoids promoting strokes touching silhouette
   // roots, cap joins or uncertain interval boundaries.
   const inside=laterals.filter(run=>
    run.openIntervalCertified===true&&
    lo>run.angularInterval[0]+margin&&
    hi<run.angularInterval[1]-margin);
   const label=inside.length===1?inside[0].visibility:'undetermined';
   if(!statuses.includes(label))throw new TypeError('invalid ray label');
   lateral.push(label);
   counts[label]++;
  }
  const cap=kind==='clipped-ellipse'&&
    chords[0].openIntervalCertified===true&&
    ['visible','hidden'].includes(chords[0].visibility)
    ?chords[0].visibility:'undetermined';
  if(kind==='clipped-ellipse')counts[cap]++;
  views[view]=Object.freeze({
   lateral:Object.freeze(lateral),
   capChord:kind==='clipped-ellipse'?cap:null,
   observerDirection:Object.freeze(directions[view]),
   intervalCount:laterals.length,
   allOpenIntervalsCertified:proof.openIntervalsVerified===true,
   sourceScope:'open-analytic-boundary-interval'
  });
 }
 return Object.freeze({
  status:'open-ray-evidence',
  retainedHalfspace,
  observerDirections:Object.freeze(directions),
  views:Object.freeze(views),counts:Object.freeze(counts),
  partitionCoverageVerified:true,
  allViewOpenIntervalsCertified:VIEWS.every(v=>views[v].allOpenIntervalsCertified),
  sourceBoundaryEndpointsVerified:false,
  projectedChordOcclusionVerified:false,
  completeVisibilityVerified:false,
  engineeringDrawingLineStylesCertified:false
 });
}
module.exports={coneV5OpenRayEvidence,validatedDirections,DIRS};
