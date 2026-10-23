'use strict';
/**
 * #372 optional 3D semantic companion to the FROZEN 2D ConstructionIntent.
 * This is a structural contract ONLY: validating it NEVER proves a section,
 * 3D visibility, a first-angle sheet layout, or V5 drawable steps.
 * Existing core/contracts/construction-intent.js remains unchanged.
 */
const {object,finite,report}=require('./common.js');
const SPATIAL_INTENT_VERSION='draftai-spatial-construction-intent/1.0.0';
const exact=(o,keys)=>object(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const xyz=v=>exact(v,['x','y','z'])&&['x','y','z'].every(k=>finite(v[k]));
const uv=v=>exact(v,['u','v'])&&finite(v.u)&&finite(v.v);
const bounds=b=>exact(b,['min','max'])&&finite(b.min)&&
 finite(b.max)&&b.min>0&&b.max>=b.min;
function validateSpatialConstructionIntent(intent){
 const errors=[];
 if(!exact(intent,['schema','id','revision','coordinateSpace','modelUnit',
  'operation','projectionSamples','source']))
  return report(['unexpected spatial intent fields']);
 if(intent.schema!==SPATIAL_INTENT_VERSION)errors.push('unknown 3D intent schema');
 if(typeof intent.id!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(intent.id))
  errors.push('invalid spatial intent id');
 if(!Number.isSafeInteger(intent.revision)||intent.revision<0)
  errors.push('invalid source revision');
 if(intent.coordinateSpace!=='model-mm-3d'||intent.modelUnit!=='mm')
  errors.push('spatial unit or coordinate frame mismatch');
 const g=intent.operation;
 if(!exact(g,['kind','geometryKind','cone','plane','analytic',
  'samplePoints','capChord']))return report([...errors,'invalid 3D operation structure']);
 if(g.kind!=='analytic-cone-plane-section'||
    !['full-ellipse','clipped-ellipse'].includes(g.geometryKind))
  errors.push('unsupported spatial analytic operation');
 if(!exact(g.cone,['baseCenter','radiusMm','heightMm'])||
    !xyz(g.cone.baseCenter)||!finite(g.cone.radiusMm)||g.cone.radiusMm<=0||
    !finite(g.cone.heightMm)||g.cone.heightMm<=0)
  errors.push('invalid finite cone model');
 if(!exact(g.plane,['point','normal'])||
    !xyz(g.plane.point)||!xyz(g.plane.normal)||
    Math.hypot(g.plane.normal.x,g.plane.normal.y,g.plane.normal.z)<=1e-12)
  errors.push('invalid plane model');
 const a=g.analytic;
 if(!exact(a,['kind','apex','normal','numeratorMm','denominator',
  'radialBoundsMm','parameterRadians','closed'])||
    !xyz(a.apex)||!xyz(a.normal)||!finite(a.numeratorMm)||
    !exact(a.denominator,['constant','cosCoeff','sinCoeff'])||
    !['constant','cosCoeff','sinCoeff'].every(k=>finite(a.denominator[k]))||
    !bounds(a.radialBoundsMm)||
    !Array.isArray(a.parameterRadians)||a.parameterRadians.length!==2||
    !a.parameterRadians.every(finite)||a.parameterRadians[1]<=a.parameterRadians[0]||
    typeof a.closed!=='boolean')
  errors.push('invalid analytic cone curve');
 else if(a.kind!==(g.geometryKind==='full-ellipse'?'complete-lateral-ellipse':
   'finite-lateral-arc')||
    a.closed!==(g.geometryKind==='full-ellipse'))
  errors.push('analytic curve scope mismatch');
 if(!Array.isArray(g.samplePoints)||g.samplePoints.length<33||
    g.samplePoints.length>257||!g.samplePoints.every(xyz))
  errors.push('unbounded/nonfinite spatial presentation samples');
 if(g.geometryKind==='full-ellipse'&&g.capChord!==null)
  errors.push('complete lateral ellipse must not invent a base chord');
 if(g.geometryKind==='clipped-ellipse'&&
    (!exact(g.capChord,['start','end'])||
     !xyz(g.capChord.start)||!xyz(g.capChord.end)))
  errors.push('clipped ellipse requires verified chord endpoints');
 const views=intent.projectionSamples;
 if(!exact(views,['V','H','W'])||
   !['V','H','W'].every(k=>Array.isArray(views[k])&&
     views[k].length===g.samplePoints?.length&&views[k].every(uv)))
  errors.push('invalid V/H/W first-angle model-unit projections');
 const src=intent.source;
 if(!exact(src,['solver','revision','proofScope','proofLevel','mathStatus',
  'visibilityVerified','sectionInteriorVerified','firstAngleLayoutVerified',
  'v5StepsReady'])||
    src.solver!=='engines/spatial/sections/finite-cone-plane'||
    src.revision!==intent.revision||
    typeof src.proofScope!=='string'||!src.proofScope||
    src.proofLevel!=='analytic'||src.mathStatus!=='ready'||
    src.visibilityVerified!==false||src.sectionInteriorVerified!==false||
    src.firstAngleLayoutVerified!==false||src.v5StepsReady!==false)
  errors.push('unsupported proof provenance or dishonest release flags');
 return report(errors);
}
module.exports={SPATIAL_INTENT_VERSION,validateSpatialConstructionIntent};
