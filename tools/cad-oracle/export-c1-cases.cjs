'use strict';
/**
 * C1 independent CAD oracle DATA EXPORT, NOT a geometry/visibility solver.
 * Export only synthetic reviewed M0 meshes and existing unsigned M5 hull
 * support sides. This read-only output may be compared offline to OCCT HLR;
 * it must never be fed back into SolveResult, ConstructionIntent or V5.
 */
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1ConvexContourSourceCoverage}=
 require('../../workbench/m5-c1-convex-contour-source-coverage.cjs');
const {compileReviewedSolidVertexV5}=
 require('../../workbench/reviewed-solid-vertex-v5.cjs');
const {project}=require('../../core/projection/conventions.js');
const P=(x,y,z)=>({x,y,z});
function make(id,min=P(-4,5,-9),max=P(24,18,31)){
 const g=prismMesh({solid:{min,max}});
 return {...g,id,data:{
  points:Object.fromEntries(Object.entries(g.data.points).map(([k,p])=>[k,{...p}])),
  edges:g.data.edges.map(e=>[...e]),faces:g.data.faces.map(f=>[...f])
 }};
}
function makeCases(){
 const a=make('C1StandardBox');
 const t=make('C1TranslatedBox');
 for(const p of Object.values(t.data.points)){
  p.x+=53;p.y-=23;p.z+=11;
 }
 const r=make('C1RotatedBox',P(-4,7,-12),P(23,18,31)),theta=Math.PI/6;
 for(const p of Object.values(r.data.points)){
  const x=p.x+35,y=p.y-11;
  p.x=x*Math.cos(theta)-y*Math.sin(theta);
  p.y=x*Math.sin(theta)+y*Math.cos(theta);
  p.z+=7;
 }
 const f=make('C1TriangulatedCoplanar');
 const ix=f.data.faces.findIndex(face=>face.every(id=>
  f.data.points[id].z===31));
 if(ix<0)throw new RangeError('expected real source face missing');
 const face=f.data.faces.splice(ix,1)[0];
 f.data.faces.push([face[0],face[1],face[2]],[face[0],face[2],face[3]]);
 f.data.edges.push([face[0],face[2]]);
 const tetra={
  id:'C1Tetrahedron',kind:'mesh',space:'model-3d',unit:'mm',
  data:{
   points:{A:P(0,0,0),B:P(12,0,0),C:P(0,11,0),D:P(4,4,14)},
   edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
   faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]
  }
 };
 const scaled=make('C1ScaledBox');
 for(const p of Object.values(scaled.data.points)){
  p.x*=3;p.y*=3;p.z*=3;
 }
 return [a,t,r,f,scaled,tetra].map(geometry=>{
  const revision=23;
  let proof;
  try{proof=auditC1ConvexContourSourceCoverage({geometry,revision});}
  catch(error){throw new TypeError('C1 CAD source '+geometry.id+
   ' was rejected by existing M5: '+error.message);}
  if(proof.status!=='scoped-convex-hull-physical-source-coverage'||
     !proof.fullPhysicalSourceContourCoverageVerified||
     proof.officialLineStylesVerified!==false||proof.completeSolidV5Ready!==false)
   throw new RangeError('C1 source contour was not independently verified');
  const reference=Object.fromEntries(proof.views.map(row=>[
   row.view,{
    completePhysicalSourceCoverageVerified:row.everyHullSideCoveredByPhysicalSourceEdges,
    boundarySides:row.sides.map(s=>({from:s.fromModelMm,to:s.toModelMm}))
   }
  ]));
  // The FIRST actual signed, scoped C1 -> canonical Intent/DAG/one-V5
  // consumer is independently checked against real OCCT HLR. Other cases
  // stay unsigned geometric controls, not inferred certification.
  if(geometry.id==='C1StandardBox'){
   const input={geometryId:geometry.id,confirmedBy:'user',
    topologyConfirmed:true,revision,unit:'mm',
    vertices:Object.entries(geometry.data.points).map(([id,p])=>{
     const views=project(p);
     return {id,knownViews:{V:[views.V.u,views.V.v],
      H:[views.H.u,views.H.v]}};
    }),edges:geometry.data.edges.map(e=>[...e]),
    faces:geometry.data.faces.map(f=>[...f])};
   const result=compileReviewedSolidVertexV5({input,
    sheetTransform:{origin:{x:350,y:195},scale:4}});
   if(result.certifiedVisibleContourLineActionCount!==12||
      result.verifiedLineIntentAndOriginalSingleV5Parity!==true||
      result.wholeSolidV5Ready!==false||
      result.sceneResult.geometry.id!==geometry.id)
    throw new RangeError('independently verified current C1 V5 contour unavailable');
   const actions=new Map(result.steps.flatMap(step=>step.actions)
    .map(action=>[action.id,action]));
   const signedVisibleContourActions=
    result.certifiedVisibleContourLineBindings.map(binding=>{
     const action=actions.get(binding.actionId);
     if(!action||action.kind!=='line'||
        JSON.stringify(action.geometry)!==
         JSON.stringify({from:binding.fromSheetPx,to:binding.toSheetPx})||
        !binding.signedFormalLineV5||
        binding.hiddenOrInternalFeatureLineAuthorized!==false||
        binding.revision!==revision||
        binding.sourceGeometryId!==geometry.id)
      throw new RangeError('C1 official V5 line does not match authenticated source');
     return {actionId:binding.actionId,view:binding.view,
      sourceEdgeId:binding.sourceEdgeId,
      from:{...binding.fromModelMm},to:{...binding.toModelMm}};
    });
   return {id:geometry.id,geometry,reference,signedVisibleContourActions};
  }
  return {id:geometry.id,geometry,reference};
 });
}
function exportCases(){
 return {schema:'draftai-c1-occt-offline-cases/1',cases:makeCases()};
}
if(require.main===module)process.stdout.write(JSON.stringify(exportCases())+'\n');
module.exports={makeCases,exportCases};
