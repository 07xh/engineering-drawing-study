'use strict';
/**
 * Non-signing, typed SPATIAL ConstructionIntent companion for original
 * source-edge subspans. This is deliberately separate from the FROZEN 2D
 * ConstructionIntent/1.0.0 and the analytic-cone spatial Intent.
 *
 * Structure and source/action parity can be proven without lying about
 * signed M3 source results, complete projected joins or final line styles.
 */
const {report,identifier,finite,object}=require('./common.js');
const {VIEWS,project}=require('../projection/conventions.js');
const SCHEMA='draftai-spatial-stroke-construction-intent/1.0.0';
const exact=(o,keys)=>object(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const xyz=v=>exact(v,['x','y','z'])&&['x','y','z'].every(k=>finite(v[k]));
const uv=v=>exact(v,['u','v'])&&finite(v.u)&&finite(v.v);
function validateSpatialStrokeConstructionIntent(a){
 const errors=[];
 if(!exact(a,['schema','id','revision','source','operation','dependsOn','proof']))
  return report(['noncanonical spatial stroke intent object']);
 if(a.schema!==SCHEMA)errors.push('spatial stroke schema mismatch');
 if(!identifier(a.id)||!Number.isSafeInteger(a.revision)||a.revision<0)
  errors.push('intent identity or current revision invalid');
 const s=a.source;
 if(!exact(s,['geometryId','edgeId','view','parameterRange','unit'])||
    !identifier(s.geometryId)||typeof s.edgeId!=='string'||
    !s.edgeId.startsWith(s.geometryId+'::')||
    !VIEWS.includes(s.view)||s.unit!=='mm'||
    !Array.isArray(s.parameterRange)||s.parameterRange.length!==2||
    !s.parameterRange.every(t=>finite(t)&&t>=0&&t<=1)||
    !(s.parameterRange[1]>s.parameterRange[0]))
  errors.push('original reviewed source edge and parameter range required');
 const op=a.operation;
 if(!exact(op,['kind','coordinateSpace','fromModelMm','toModelMm',
   'fromProjectedMm','toProjectedMm','v5ActionId'])||
    op.kind!=='project-source-subspan'||op.coordinateSpace!=='model-mm-3d'||
    !xyz(op.fromModelMm)||!xyz(op.toModelMm)||
    !uv(op.fromProjectedMm)||!uv(op.toProjectedMm)||
    !identifier(op.v5ActionId))
  errors.push('noncanonical model 3D / V5 operation');
 else if(s&&VIEWS.includes(s.view)){
  const from=project(op.fromModelMm)[s.view],
    to=project(op.toModelMm)[s.view];
  if(from.u!==op.fromProjectedMm.u||from.v!==op.fromProjectedMm.v||
     to.u!==op.toProjectedMm.u||to.v!==op.toProjectedMm.v||
     Math.hypot(to.u-from.u,to.v-from.v)<=1e-9)
   errors.push('3D source and first-angle V/H/W projection disagree');
 }
 if(!Array.isArray(a.dependsOn)||a.dependsOn.some(x=>!identifier(x))||
    new Set(a.dependsOn).size!==a.dependsOn.length)
  errors.push('invalid spatial ConstructionIntent dependencies');
 const p=a.proof;
 if(!exact(p,['status','openInteriorVisibility','wholeStrokeVisibility',
   'sourceReviewRevision','sourceEndpointJoinsVerified',
   'multiBodyContourVerified','officialLineStyleVerified',
   'constructionOrderVerified','v5Approved'])||
    p.status!=='evidence-only'||
    !['visible','hidden','undetermined'].includes(p.openInteriorVisibility)||
    p.wholeStrokeVisibility!=='undetermined'||
    p.sourceReviewRevision!==a.revision||
    p.sourceEndpointJoinsVerified!==false||
    p.multiBodyContourVerified!==false||
    p.officialLineStyleVerified!==false||
    p.constructionOrderVerified!==false||
    p.v5Approved!==false)
  errors.push('missing/non-honest line style or source proof flags');
 return report(errors);
}
function validateSpatialStrokeIntentDAG(intents){
 if(!Array.isArray(intents)||!intents.length||intents.length>300)
  return report(['1..300 bounded spatial stroke intents required']);
 const errors=[],seenSteps=new Set(),seenActions=new Set();
 let revision=null;
 for(const [i,intent] of intents.entries()){
  const c=validateSpatialStrokeConstructionIntent(intent);
  if(!c.ok){errors.push('intent '+i+': '+c.errors.join('; '));continue;}
  if(seenSteps.has(intent.id))errors.push('duplicate intent id');
  if(seenActions.has(intent.operation.v5ActionId))
   errors.push('duplicate V5 source action');
  if(intent.dependsOn.some(id=>!seenSteps.has(id)))
   errors.push('missing/forward DAG dependency');
  if(revision!==null&&revision!==intent.revision)
   errors.push('mixed Geometry source revisions');
  seenSteps.add(intent.id);seenActions.add(intent.operation.v5ActionId);
  revision=intent.revision;
 }
 return report(errors);
}
module.exports={SCHEMA,validateSpatialStrokeConstructionIntent,
 validateSpatialStrokeIntentDAG};
