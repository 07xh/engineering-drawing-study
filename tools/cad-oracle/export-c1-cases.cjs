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
 const r=make('C1RotatedBox'),theta=Math.PI/7;
 for(const p of Object.values(r.data.points)){
  const x=p.x+12,y=p.y-19;
  p.x=x*Math.cos(theta)-y*Math.sin(theta);
  p.y=x*Math.sin(theta)+y*Math.cos(theta);
  p.z+=3;
 }
 const f=make('C1TriangulatedCoplanar');
 const ix=f.data.faces.findIndex(face=>face.every(id=>
  f.data.points[id].z===31));
 if(ix<0)throw new RangeError('expected real source face missing');
 const face=f.data.faces.splice(ix,1)[0];
 f.data.faces.push([face[0],face[1],face[2]],[face[0],face[2],face[3]]);
 f.data.edges.push([face[0],face[2]]);
 const scaled=make('C1ScaledBox');
 for(const p of Object.values(scaled.data.points)){
  p.x*=3;p.y*=3;p.z*=3;
 }
 return [a,t,r,f,scaled].map(geometry=>{
  const revision=23;
  const proof=auditC1ConvexContourSourceCoverage({geometry,revision});
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
  return {id:geometry.id,geometry,reference};
 });
}
function exportCases(){
 return {schema:'draftai-c1-occt-offline-cases/1',cases:makeCases()};
}
if(require.main===module)process.stdout.write(JSON.stringify(exportCases())+'\n');
module.exports={makeCases,exportCases};
