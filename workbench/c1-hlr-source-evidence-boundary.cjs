'use strict';
/** C1 boundary for genuine CAD HLR output. Never a visibility proof or V5 signer.
 * Caller must supply actual HLR output plus a trusted source-edge mapping.
 * No implicit nearest-edge or paper-coordinate source attribution is allowed.
 */
const {project,FIRST_ANGLE_OBSERVER_RAYS,VIEWS}=require('../core/projection/conventions.js');
const finite=Number.isFinite;
const frozen=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){for(const v of Object.values(x))frozen(v);Object.freeze(x);}return x;};
function ingestC1HlrCandidates({revision,sourceGeometry,hlrRuns,engine}={}){
 if(!Number.isSafeInteger(revision)||revision<0)throw TypeError('C1 HLR revision required');
 if(!engine||typeof engine.package!=='string'||!engine.package.trim()||
    typeof engine.version!=='string'||!engine.version.trim())throw TypeError('C1 HLR engine provenance required');
 if(!Array.isArray(sourceGeometry)||!sourceGeometry.length||!hlrRuns||typeof hlrRuns!=='object'||
    Object.keys(hlrRuns).sort().join(',')!=='H,V,W')throw TypeError('C1 HLR three views and source geometry required');
 const sources=new Map();
 for(const e of sourceGeometry){
  if(!e||typeof e.id!=='string'||!e.id||sources.has(e.id)||!e.start||!e.end||
     ![e.start.x,e.start.y,e.start.z,e.end.x,e.end.y,e.end.z].every(finite))
    throw TypeError('C1 HLR unique finite source edges required');
  sources.set(e.id,e);
 }
 const candidates=[];
 for(const view of VIEWS){
  const run=hlrRuns[view],expected=FIRST_ANGLE_OBSERVER_RAYS[view];
  if(!run||!run.observerRay||!['x','y','z'].every(k=>run.observerRay[k]===expected[k])||
     !Array.isArray(run.edges))throw TypeError('C1 HLR first-angle observer ray mismatch');
  for(const edge of run.edges){
   if(!edge||!['visible','hidden'].includes(edge.hlrClass)||
      !sources.has(edge.sourceEdgeId)||!edge.start||!edge.end||
      ![edge.start.u,edge.start.v,edge.end.u,edge.end.v].every(finite))
    throw TypeError('C1 HLR source mapping and finite paper endpoints required');
   const src=sources.get(edge.sourceEdgeId),a=project(src.start)[view],b=project(src.end)[view];
   const dist=(p,q)=>Math.hypot(p.u-q.u,p.v-q.v);
   const forward=dist(a,edge.start)<=1e-7&&dist(b,edge.end)<=1e-7;
   const backward=dist(b,edge.start)<=1e-7&&dist(a,edge.end)<=1e-7;
   // Only whole source edges are supported by this strict first integration.
   // Splits, curves and untraceable HLR generated edges must remain outside.
   if(!forward&&!backward)throw TypeError('C1 HLR projection/source mismatch or unsupported split');
   candidates.push({view,sourceEdgeId:edge.sourceEdgeId,
    hlrClass:edge.hlrClass,start:{...edge.start},end:{...edge.end},
    proofStatus:'undetermined',officialLineStyle:'undetermined',v5Ready:false});
  }
 }
 return frozen({schema:'draftai-c1-hlr-candidate-evidence/1',revision,
  engine:{package:engine.package,version:engine.version},
  status:'unverified-cad-candidates',officialLineStylesVerified:false,
  canonicalIntentVerified:false,v5Ready:false,candidates});
}
module.exports={ingestC1HlrCandidates};
