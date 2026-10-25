'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {createReviewedC2BooleanEndpointNeighborhood:create}=
 require('../../workbench/m5-c2-boolean-endpoint-octant-neighborhood.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const p=(x,y,z)=>({x,y,z});
const box=(id,lo,hi)=>({...prismMesh({solid:{min:lo,max:hi}}),id});
const A=()=>box('A',p(0,0,0),p(10,10,10));
const B=()=>box('B',p(5,5,5),p(15,15,15));
const scene=(b=A(),other=B(),rev=501)=>create({geometry:[b,other],revision:rev});
function octantMaskAnalytic(geometry,xyz){
 const boxes=geometry.map(g=>Object.values(g.data.points));
 const mask=[];
 for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){
  const signs={x:sx,y:sy,z:sz};
  const present=boxes.some(points=>['x','y','z'].every(k=>{
   const lo=Math.min(...points.map(q=>q[k])),
    hi=Math.max(...points.map(q=>q[k]));
   return xyz[k]>lo&&xyz[k]<hi||
    xyz[k]===lo&&signs[k]===1||
    xyz[k]===hi&&signs[k]===-1;
  }));
  mask.push(present);
 }
 return mask;
}
test('C2 independent 8-octant oracle: each accepted endpoint belongs to real CLOSED union boundary and outgoing axial exterior',()=>{
 const g=[A(),B()],reviewed=create({geometry:g,revision:505});
 const cases=[
  [p(0,0,0),p(0,0,5),true,1],
  [p(0,0,5),p(0,0,10),true,2],
  [p(10,10,10),p(10,10,5),false,8],
  [p(5,5,5),p(5,5,10),false,8],
  [p(10,5,5),p(10,5,9),true,5]
 ];
 for(const [node,toward,expected,count] of cases){
  const q=reviewed.inspect(node,toward);
  assert.equal(q.schema,'draftai-m5-c2-boolean-endpoint-octants/1');
  assert.equal(q.revision,505);
  assert.deepEqual(q.openOctantUnionOccupancy,
   octantMaskAnalytic(g,node));
  assert.equal(q.occupiedOctantCount,count);
  assert.equal(q.localSingleExteriorBooleanNeighborhoodVerified,expected);
  assert.equal(q.actualGlobalPhysicalFeatureContinuityVerified,false);
  assert.equal(q.closedEndpointCompleteEngineeringLinecapVerified,false);
  assert.equal(q.signedV5LineActions,0);
 }
 const valid=reviewed.inspect(p(0,0,0),p(0,0,10));
 assert.equal(valid.outgoingSourceAxis,'z');
 assert.equal(valid.outgoingSourceSign,1);
 assert.equal(valid.occupiedOutgoingQuadrantCount,1);
 assert.equal(valid.outgoingRealSourceBooleanExteriorOpenLimitVerified,true);
 assert.equal(valid.localClosedUnionBoundaryWithOutgoingSourceVerified,true);
 assert.ok(Object.isFrozen(valid.openOctantUnionOccupancy));
 const reverse=reviewed.inspect(p(0,0,10),p(0,0,0));
 assert.equal(reverse.outgoingSourceSign,-1);
 assert.equal(reverse.localClosedUnionBoundaryWithOutgoingSourceVerified,true);
});
test('C2 exact face contact and strictly nonmanifold edge/point contact cannot create false physical junction',()=>{
 const whole=create({geometry:[
  A(),box('B',p(10,0,0),p(20,10,10))],revision:502});
 const seam=whole.inspect(p(10,5,5),p(10,5,10));
 assert.equal(seam.occupiedOctantCount,8);
 assert.equal(seam.localClosedUnionBoundaryWithOutgoingSourceVerified,false);
 const edge=create({geometry:[
  A(),box('B',p(10,10,0),p(20,20,10))],revision:503});
 const touch=edge.inspect(p(10,10,5),p(10,10,10));
 assert.deepEqual(touch.openOctantUnionOccupancy,
  octantMaskAnalytic([A(),box('B',p(10,10,0),p(20,20,10))],p(10,10,5)));
 assert.equal(touch.occupiedFaceAdjacentComponentCount,2);
 assert.equal(touch.localSingleExteriorBooleanNeighborhoodVerified,false);
 const corner=create({geometry:[
  A(),box('B',p(10,10,10),p(20,20,20))],revision:504});
 const q=corner.inspect(p(10,10,10),p(10,10,9));
 assert.equal(q.occupiedOctantCount,2);
 assert.equal(q.occupiedFaceAdjacentComponentCount,2);
 assert.equal(q.localClosedUnionBoundaryWithOutgoingSourceVerified,false);
});
test('C2 interior-only, near-but-not-exact third-body face and diagonal/collapsed source direction fail closed',()=>{
 const region=create({geometry:[
  A(),box('B',p(-1,-1,-1),p(1,1,1))],revision:506});
 const interior=region.inspect(p(0,0,0),p(0,0,5));
 assert.equal(interior.occupiedOctantCount,8);
 assert.equal(interior.localClosedUnionBoundaryWithOutgoingSourceVerified,false);
 const near=create({geometry:[
  A(),box('B',p(10+2**-35,0,0),p(20,10,10))],revision:507});
 const almost=near.inspect(p(10,0,5),p(10,0,10));
 assert.ok(almost.nearCriticalNonExactBoxFaceCount>0);
 assert.equal(almost.localClosedUnionBoundaryWithOutgoingSourceVerified,false);
 const original=scene().inspect(p(0,0,0),p(1,1,0));
 assert.equal(original.outgoingSourceAxis,null);
 assert.equal(original.localClosedUnionBoundaryWithOutgoingSourceVerified,false);
 const collapsed=scene().inspect(p(0,0,0),p(0,0,0));
 assert.equal(collapsed.localClosedUnionBoundaryWithOutgoingSourceVerified,false);
 assert.throws(()=>scene().inspect(p(NaN,0,0),p(0,0,5)),/finite/);
});
test('C2 production final paper-line consumer joins current source ID + independently certified octants + local ray but does NOT sign V5',()=>{
 const geometry=[A(),B()],revision=508,
  depth=evaluateReviewedConvexMeshDepth({geometry,revision}),
  all=inspectFinalSourceStrokeObligations({geometry,revision,
   sceneDepthEvidence:depth}),
  lines=all.unifiedPaperLineReadinessEvidence,
  math=create({geometry,revision});
 let trueLocal=0,joint=0;
 for(const line of lines.lines){
  assert.equal(line.localClosed3DBooleanEndpointCount,
   line.physical3DEndpointIncidence.filter(e=>
    e.localClosedUnionEndpointBoundaryAndSourceDirectionVerified).length);
  assert.equal(line.bothEndpointLocalBooleanAndOpaqueRayAndRealSourceJoinVerified,
   line.physical3DEndpointIncidence.every(e=>
    e.jointSourceBooleanAndClosedNeighborhoodAndAllSolidOpenRayVerified));
  for(const e of line.physical3DEndpointIncidence){
   const proof=e.real3DBooleanClosedEndpointNeighborhoodWitness;
   if(proof){
    const current=line.booleanOriginalOrGeneratedFeatureWitness.find(x=>
     x.sourceSubspanId===line.selectedListed3DSourceSubspanId);
    const toward=current&&e.role==='from'?current.original3DTo:
     current?.original3DFrom;
    assert.deepEqual(proof.openOctantUnionOccupancy,
     octantMaskAnalytic(geometry,e.physicalSource3DPoint));
    assert.deepEqual(proof.openOctantUnionOccupancy,
     math.inspect(e.physicalSource3DPoint,toward).openOctantUnionOccupancy);
    assert.equal(proof.officialEngineeringLineStyle,'undetermined');
    assert.equal(proof.signedV5LineActions,0);
   }
   if(e.localClosedUnionEndpointBoundaryAndSourceDirectionVerified){
    trueLocal++;
    assert.equal(e.currentPhysical3DPointPositiveObserverOpenRayClearVerified===true||
     e.currentPhysical3DPointPositiveObserverOpenRayClearVerified===false,true);
   }
   if(e.jointSourceBooleanAndClosedNeighborhoodAndAllSolidOpenRayVerified){
    joint++;
    assert.equal(e.currentPhysical3DPointPositiveObserverOpenRayClearVerified,true);
    assert.ok(e.trulyExteriorBothSourceFeatureJoinIdsAtClosedNeighborhood.length>0);
   }
   assert.equal(e.actualGlobalFeatureAndEndpointVisibilityCertified,false);
   assert.equal(e.physical3DEndpointJoinAndDrawingLinecapCertified,false);
  }
  assert.equal(line.officialEngineeringSolidDashedStyle,'undetermined');
  assert.equal(line.formalV5StrokeSigned,false);
 }
 assert.equal(lines.locallyValidatedClosed3DBooleanEndpointCount,trueLocal);
 assert.equal(lines.fullyJointLocalBooleanAndOpaqueRayCandidateCount,joint);
 assert.ok(trueLocal>0);
 assert.ok(joint>0);
 assert.equal(lines.signedV5LineActions,0);
 assert.equal(all.signedCount,0);
});
