'use strict';
/**
 * C2 M0/M5 certified OPEN new face-intersection segments -> the EXISTING
 * immutable Geometry Scene. This is a display-only projection adapter:
 * neither V/H/W nor Three.js can issue a standard stroke or a V5 action.
 * Recompute with the original M5 proof and compare full revision-bound rows;
 * never trust arbitrary externally supplied renderer lines.
 */
const {deriveGeometryScene,projectSelectionLinks}=
 require('../core/projection/geometry-scene-views.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const {proveGeneratedOrthogonalUnionCreases}=
 require('../workbench/m5-generated-orthogonal-union-creases.cjs');
function fail(m){throw new Error('C2 三维新棱联动：'+m);}
function buildC2GeneratedLinkedScene({geometry,revision,orthogonalBooleanFeatureAudit}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
   !Array.isArray(geometry)||geometry.length<2||geometry.length>8||
   new Set(geometry.map(g=>g?.id)).size!==geometry.length)
  fail('已确认来源实体或修订无效');
 const proof=orthogonalBooleanFeatureAudit;
 if(!proof||
   proof.schema!=='draftai-c2-workbench-original-plus-generated-union-evidence/1'||
   proof.revision!==revision||
   JSON.stringify(proof.sourceGeometryIds)!==JSON.stringify(geometry.map(g=>g.id))||
   proof.officialDrawingLineStylesVerified!==false||
   proof.completeV5DrawingAuthorized!==false)
  fail('没有来自同一修订 M5 的可信新生棱审计');
 // Reuse exactly the pre-existing M5 theorem. No duplicate boolean or
 // projection mathematics and no rendering-specific interpretation of faces.
 const actual=proveGeneratedOrthogonalUnionCreases({geometry,revision});
 if(actual.status!=='scoped-pairwise-new-perpendicular-face-open-features'||
   JSON.stringify(proof.generated)!==JSON.stringify(actual)||
   actual.officialLineStylesVerified!==false||
   actual.generatedFeatureV5Ready!==false)
  fail('新棱来源数学与当前原始实体不一致');
 const derived=[],groups=[];
 for(const [i,s] of actual.segments.entries()){
  if(!s.positiveNewConcaveUnionOpenFeatureVerified)continue;
  if(s.revision!==revision||s.status!=='certified-new-concave-union-open-crease'||
    s.generatedByTwoSourceFacePlanes!==true||
    s.originalSourceMeshEdgeId!==null||
    s.supportingFacePlaneIncidenceIndependentlyVerified!==true||
    s.originalAndNovelFeatureEndpointTopologyVerified!==false||
    s.officialEngineeringLineStyle!=='undetermined'||
    s.officialConstructionStepV5ActionAuthorized!==false)
   fail('新生棱缺少三维开放区间来源或不当晋升线型');
  if(!VIEWS.every(v=>{
   const a=project(s.source3DFrom)[v],b=project(s.source3DTo)[v],p=s.projected[v];
   return p&&p.from.u===a.u&&p.from.v===a.v&&
    p.to.u===b.u&&p.to.v===b.v&&
    p.standardLineStyle==='undetermined'&&
    p.completeForwardRayAndEndpointProofVerified===false&&
    p.kind===(a.u===b.u&&a.v===b.v?'collapsed-point':'source-line-candidate');
  }))fail('第一角法三视图与真实新生棱的毫米来源不一致');
  // This ID is safe for Geometry contracts and does not attempt to encode
  // the M5 source id (which contains colons and other invalid characters).
  const id='C2NewOpenEdge'+i;
  if(geometry.some(g=>g.id===id))fail('计算棱身份与已确认对象冲突');
  derived.push({id,kind:'segment',space:'model-3d',unit:'mm',
   sourceFeatureId:s.id,sourceGeometryIds:[...s.sourceGeometryIds],
   data:{start:{...s.source3DFrom},end:{...s.source3DTo}}});
  groups.push(Object.freeze({geometryId:id,sourceFeatureId:s.id,
   sourceGeometryIds:Object.freeze([...s.sourceGeometryIds]),
   // Publish the exact M5-authenticated 3D interval to consumers that need
   // to join independently split paper subspans back to this one source.
   // This is identity metadata only; it grants no visibility or V5 status.
   source3DFrom:Object.freeze({...s.source3DFrom}),
   source3DTo:Object.freeze({...s.source3DTo}),
   revision,role:'locally-proven-open-generated-concave-crease',
   visibility:'undetermined',certifiedEngineeringStroke:false,
   constructionIntentAuthorized:false,v5ActionAuthorized:false}));
 }
 if(groups.length!==actual.certifiedNewConcaveOpenCount)
  fail('新增源棱数量与 M5 开区间正向证明不一致');
 const scene=deriveGeometryScene({geometry:[...geometry,...derived],
  revision,resultId:'C2OriginalAndNovelOpenEvidence'});
 const ids=new Set(scene.objects.map(o=>o.id));
 if(scene.objects.length!==geometry.length+groups.length||
   groups.some(g=>!ids.has(g.geometryId)))
  fail('新生棱的可信三维 Scene 身份丢失');
 return Object.freeze({schema:'draftai-c2-novel-source-linked-scene/1',
  revision,scene,links:projectSelectionLinks(scene),
  groups:Object.freeze(groups),generatedGeometryCount:groups.length,
  mathematicalScope:'bounded-orthogonal-boolean-open-creases',
  wholeDrawingLineStylesVerified:false,completeV5Authorized:false,
  createsSecondSolver:false,createsSecondPlayer:false});
}
module.exports={buildC2GeneratedLinkedScene};
