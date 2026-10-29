'use strict';
/**
 * V7 user-facing adapter to the ALREADY deployed 03 M3->Intent->DAG->V5
 * pipeline and the canonical Geometry scene. No secondary solver or player.
 * Explicit human-reviewed model-mm point input only; raster is a reference.
 */
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {evaluateUnifiedMath}=require('../workbench/unified-math-pipeline.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');
const {deriveGeometryScene,projectSelectionLinks}=
  require('../core/projection/geometry-scene-views.cjs');
const Timeline=require('../workbench/teaching-timeline-v5.js');
const {compileReviewedSolidVertexV5}=require('../workbench/reviewed-solid-vertex-v5.cjs');
const {compileScopedFullyProvenConvexC1}=
 require('../workbench/c1-fully-proven-convex-third-view-delivery.cjs');
const {compileFiniteCylinderEndpointV5}=
 require('../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {buildC3LinkedGeometryScene}=require('../workbench/c3-linked-geometry-scene.cjs');
const {reviewC3AnalyticBooleanRayPaper}=
 require('./c3-analytic-boolean-ray-paper-review.cjs');
const {auditC3M0M3M5AnalyticSources}=
 require('../workbench/c3-m0-m3-m5-analytic-source-acceptance.cjs');
const {buildC3WIntervalPreview}=require('../workbench/c3-w-ray-preview.cjs');
const {auditC3WMirrorSourceOutlineUnion}=
 require('../workbench/c3-w-mirror-source-outline-union.cjs');
const {auditC3WMirrorExitOutlineConcordance}=
 require('../workbench/c3-w-mirror-exit-outline-concordance.cjs');
const {auditC3WAllLateralProjectionCollisions}=
 require('../workbench/c3-w-lateral-projection-collision-inventory.cjs');
const {auditC3WGlobalSourceCurveSolidDepth}=
 require('../workbench/c3-w-global-source-curve-solid-depth.cjs');
const {auditC3WCenterClosedFoldVisibility}=
 require('../workbench/c3-w-center-closed-fold-visibility.cjs');
const {buildC3VHProjectionDedup}=require('../workbench/c3-vh-projection-dedup.cjs');
const {auditC3JointTopologyVisibility}=
 require('../workbench/c3-joint-topology-visibility.cjs');
const {makeReviewedC3Input,c3SheetTransforms}=require('./c3-reviewed-input.cjs');
const {IDS:REVIEWED_C1_IDS}=require('./c1-reviewed-input.cjs');
const {analyzeConfirmedRelations}=require('../core/constraints/multiobject-relation-evidence.cjs');
const {evaluateReviewedBoxContacts}=require('../core/geometry/reviewed-box-contact-evidence.cjs');
const {evaluateReviewedCompositeInterfaces}=
 require('../workbench/reviewed-composite-interface-evidence.cjs');
const {proveReviewedCompositeSeamRays}=
 require('../workbench/m5-reviewed-composite-seam-rays.cjs');
const {auditReviewedMultiBodyWholePhysicalEdgeRays}=
 require('../workbench/m5-reviewed-multibody-original-edge-rays.cjs');
const {reviewC2OrthogonalBooleanFeatures,reviewC2FullPaperStrokeReadiness}=
 require('./c2-orthogonal-boolean-feature-review.cjs');
const {buildC2GeneratedLinkedScene}=
 require('./c2-generated-linked-scene.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../workbench/reviewed-convex-scene-depth.cjs');
const {auditM0M3M4M5OriginalSources}=
 require('../workbench/m0-m3-m4-m5-original-source-acceptance.cjs');
const {inspectSpatialV5Readiness}=
 require('../workbench/spatial-v5-evidence-readiness.cjs');
const {auditReviewedM4V5Motion}=
 require('../workbench/m4-existing-v5-motion-parity.cjs');
const {auditSpatialStrokeConstructionDAG}=
 require('../workbench/spatial-stroke-construction-dag-parity.cjs');
const {inspectSpatialV5ActionRelease}=
 require('../workbench/spatial-v5-per-action-release-gate.cjs');
const {compileGeometryScene}=
 require('./geometry-scene-consumer.cjs');
const {validateGeometry}=require('../core/contracts/geometry.js');
const SHEET=Object.freeze({origin:{x:360,y:208},scale:5});
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function verifiedPointFromInputs(data){
  if(!data||data.task!=='projection'||!Number.isSafeInteger(data.revision)||
     !Array.isArray(data.conditions)||data.conditions.length!==1)
    throw new Error('仅支持一条人工确认的空间点毫米条件');
  const c=data.conditions[0],v=c?.value;
  if(c.confirmed!==true||c.objectId!=='Point1'||v?.type!=='point-xyz'||
     v.unit!=='mm'||!Array.isArray(v.xyz)||v.xyz.length!==3||
     !v.xyz.every(finite)||v.xyz.some(n=>Math.abs(n)>100000))
    throw new Error('请人工确认空间点 P 的 x/y/z（mm），不能使用未经确认的识图候选');
  if(v.imageId!==undefined&&v.imageId!==data.source?.imageId)
    throw new Error('标注已不属于当前原图，必须重新核对');
  if(data.objects?.length!==1||data.objects[0]?.id!=='Point1')
    throw new Error('点对象身份与求解输入不一致');
  return {x:v.xyz[0],y:v.xyz[1],z:v.xyz[2]};
}

const P=(x,y,z)=>({x,y,z});
const pair=(a)=>({x:a[0],y:a[1]});
function verifiedInput(data,{task,type,objectId}){
 if(!data||data.task!==task||!Number.isSafeInteger(data.revision)||
    !Array.isArray(data.conditions)||data.conditions.length!==1||
    data.objects?.length!==1||data.objects[0]?.id!==objectId)
  throw new Error('当前项目对象或已确认的求解条件不完整');
 const c=data.conditions[0],v=c?.value;
 if(c.confirmed!==true||c.objectId!==objectId||
    v?.type!==type||v?.unit!=='mm'||
    v.imageId!==data.source?.imageId)
  throw new Error('必须人工确认与当前原图对应的模型 mm 条件');
 return v;
}
const okPair=a=>Array.isArray(a)&&a.length===2&&a.every(finite)&&
 a.every(n=>Math.abs(n)<=100000);
const okTriple=a=>Array.isArray(a)&&a.length===3&&a.every(finite);
function verifiedPlanarFillet(data){
 const v=verifiedInput(data,{task:'planar',type:'segment-fillet',objectId:'Fillet1'});
 if(![v.first,v.second].every(a=>Array.isArray(a)&&a.length===2&&a.every(okPair))||
   !finite(v.filletRadius)||v.filletRadius<=0||v.filletRadius>100000||
   !['s++','s+-','s-+','s--'].includes(v.branchId)||
   !['cw','ccw'].includes(v.direction)||
   !['forward','reverse'].includes(v.firstTravel)||
   !['forward','reverse'].includes(v.secondTravel))
  throw new Error('二维线段端点、连接半径或已选择的数学分支无效');
 return {
   first:{a:pair(v.first[0]),b:pair(v.first[1])},
   second:{a:pair(v.second[0]),b:pair(v.second[1])},
   filletRadius:v.filletRadius,branchId:v.branchId,direction:v.direction,
   firstTravel:v.firstTravel,secondTravel:v.secondTravel
 };
}
function verifiedPrismSection(data){
 const v=verifiedInput(data,{task:'exploration',type:'prism-section',objectId:'Solid1'});
 if(!okTriple(v.size)||v.size.some(x=>x<=0||x>100000)||
   !okTriple(v.planePoint)||v.planePoint.some(x=>Math.abs(x)>100000)||
   !okTriple(v.planeNormal)||Math.hypot(...v.planeNormal)<=1e-9)
  throw new Error('长方体尺寸和截平面必须是有限、非退化的毫米条件');
 if(v.retainedHalfspace!==undefined&&
    !['unreviewed','positive','negative'].includes(v.retainedHalfspace))
  throw new Error('截切保留材料侧无效，不能获得射线证明');
 return {kind:'rectangular-prism',
  solid:{min:P(0,0,0),max:P(...v.size)},
  plane:{point:P(...v.planePoint),normal:P(...v.planeNormal)},
  frame:'model-mm-3d',unit:'mm'};
}
function prismMesh(data){
 const min=data.solid.min,max=data.solid.max;
 const points={};
 for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++){
  const id='V'+a+b+c;
  points[id]=P(a?max.x:min.x,b?max.y:min.y,c?max.z:min.z);
 }
 const ids=Object.keys(points),edges=[];
 for(const [i,k] of ids.entries())for(const l of ids.slice(i+1)){
  const distance=[0,1,2].filter(j=>k[j+1]!==l[j+1]).length;
  if(distance===1)edges.push([k,l]);
 }
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id:'Solid1',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges,faces}};
}

const SUPPORTED_MANUAL_KINDS=new Set(['point','segment','circle','arc','polyline','mesh']);
function confirmedCompositionGeometry(data){
 if(!data||data.task!=='composition'||!Number.isSafeInteger(data.revision)||
   !Array.isArray(data.objects)||!Array.isArray(data.conditions)||
   !data.objects.length||data.objects.length>100||
   data.objects.length!==data.conditions.length)
  throw new Error('多对象项目必须逐项提供已确认的几何输入');
 const refs=new Map(data.objects.map(o=>[o.id,o]));
 if(refs.size!==data.objects.length)throw new Error('几何对象身份重复');
 const seen=new Set(),geometry=[];
 for(const c of data.conditions){
  const g=c?.value?.geometry;
  if(!c||c.confirmed!==true||c.sourceCandidateId!==null||
    c.value?.type!=='manual-geometry'||c.value?.imageId!==data.source?.imageId||
    !g||c.value.unit!=='mm'||Object.keys(c.value).some(k=>
      !['type','geometry','unit','imageId'].includes(k)))
   throw new Error('多对象必须逐项由人工核对并确认当前原图');
  const object=refs.get(c.objectId);
  if(!object||g.id!==object.id||seen.has(g.id)||
    !SUPPORTED_MANUAL_KINDS.has(g.kind)||g.unit!=='mm'||
    !['drawing-2d','model-3d'].includes(g.space))
   throw new Error('多对象身份、空间或受限类型无效');
  const check=validateGeometry(g);
  if(!check.ok)throw new Error('手工几何输入不合法：'+check.errors.join('；'));
  seen.add(g.id);
  // Project conditions are user-provided facts, not mathematically solved
  // results: never mark them verified or schedule ConstructionStep/V5.
  geometry.push(g);
 }
 return geometry;
}

function resultBase(data){return {projectId:data.projectId,inputRevision:data.revision};}

function createUnifiedProjectSession(){
 let latest=null,current=null,clock=null;
 const listeners=new Set(),emit=()=>{for(const f of listeners)f();};
 const api={
  subscribe(f){listeners.add(f);return()=>listeners.delete(f);},
  stopPlayback(){if(clock)clock.pause(performance.now());},
  invalidate(){current=null;clock=null;emit();},
  loadInputs(data){latest=data;current=null;clock=null;emit();},
  readSnapshot(){return current;},
  dispose(){latest=null;current=null;clock=null;listeners.clear();},
  solve(){
   current=null;clock=null;
   if(latest?.task==='c3-intersection'){
    const c3=verifiedInput(latest,{task:'c3-intersection',
     type:'reviewed-c3-finite-cylinders',objectId:'C3Intersection'});
    if(c3.axesConfirmed!==true||c3.capsConfirmed!==true||
       !c3.dimensions||typeof c3.dimensions!=='object')
     throw new Error('C3 必须人工确认两正交圆柱的轴向、有限端盖及毫米条件');
    const solidOperation=c3.solidOperation??null;
    if(![null,'union','intersection'].includes(solidOperation))
     throw new Error('必须从未选择、实体并、实体交中选择真实题目运算');
    const input=makeReviewedC3Input(c3.dimensions);
    const viewTransforms=c3SheetTransforms(input);
    // The SAME specialist and original player used by the C3 public page.
    // These are mathematical guides and points, NOT a signed full curve.
    const compiled=compileFiniteCylinderEndpointV5({
      input,revision:latest.revision,
      stationCountPerBranch:1,sheetTransform:viewTransforms.V,
      viewTransforms,includeSourceCircleGuides:true,
      includeProjectedSeamArcGuides:true,
      includeWAnalyticCurveGuides:true,wRayPartitionedV5:true,
      includeCapFacePairGuides:true
    });
    const linked=buildC3LinkedGeometryScene({
      input,revision:latest.revision,compiled,viewTransforms
    });
    const wRay=buildC3WIntervalPreview({input,revision:latest.revision});
    const vhDedup=buildC3VHProjectionDedup({input,revision:latest.revision});
    const sourceAcceptance=auditC3M0M3M5AnalyticSources({
      input,revision:latest.revision,compiled,linked,
      viewTransforms,solidOperation
    });
    // Recompute M3 source graph, all real 3D cap/curve terminals,
    // V/H/W open ray intervals and their exact source contact provenance.
    // Never confuse a scoped original 3D proof with whole drawing styles.
    const joint=auditC3JointTopologyVisibility({
     input,revision:latest.revision,solidOperation
    });
    const selectedRays=joint.selectedBooleanRayEvidence;
    const rayConcordance=joint.booleanRayConcordance;
    const wCriticalPointRays=joint.selectedBooleanWCriticalPointEvidence;
    const wBooleanForwardExitDepth=joint.wBooleanForwardExitDepth;
    const wFiniteCapLineForwardRays=joint.wFiniteCapLineForwardRays;
    if(!wFiniteCapLineForwardRays||
       wFiniteCapLineForwardRays.revision!==latest.revision||
       wFiniteCapLineForwardRays.solidOperation!==(solidOperation||'unselected')||
       wFiniteCapLineForwardRays.officialV5Authorized!==false||
       wFiniteCapLineForwardRays.officialLineStylesVerified!==false||
       wFiniteCapLineForwardRays.allCompositeSourceDepthAndSurfaceContactsProven!==false||
       wFiniteCapLineForwardRays.closedJunctionsAndLineStylesCertified!==false||
       (solidOperation!==null?
        (wFiniteCapLineForwardRays.status!=='scoped-all-real-W-cap-source-open-rays'||
         wFiniteCapLineForwardRays.allPhysicalCapSourceLinesIndependentlyVerified!==true||
         wFiniteCapLineForwardRays.lineSourceRays.length!==
          selectedRays.intervals.filter(x=>x.view==='W'&&
            x.sourceKind==='line').length):
        (wFiniteCapLineForwardRays.status!=='not-covered'||
         wFiniteCapLineForwardRays.lineSourceRays.length!==0)))
     throw new Error('C3 当前真实有限端盖 W 射线与三维来源直线联合证明不一致');
    if(!wBooleanForwardExitDepth||
       wBooleanForwardExitDepth.revision!==latest.revision||
       wBooleanForwardExitDepth.solidOperation!==(solidOperation||'unselected')||
       wBooleanForwardExitDepth.officialV5Authorized!==false||
       wBooleanForwardExitDepth.engineeringLineStylesVerified!==false||
       wBooleanForwardExitDepth.closedEndpointVisibilityProven!==false||
       wBooleanForwardExitDepth.allProjectedFeatureDepthAndContactVisibilityProven!==false||
       (solidOperation!==null?
        (wBooleanForwardExitDepth.allWSourceOpenCellsAccountedFor!==true||
         wBooleanForwardExitDepth.originalM3AnalyticSourceBranchCount!==
          compiled.sourceM3.branchCount||
         wBooleanForwardExitDepth.provedOpaqueExitCellCount+
          wBooleanForwardExitDepth.provedClearForwardCellCount+
          wBooleanForwardExitDepth.unresolvedCapOrNumericalCellCount!==
          wBooleanForwardExitDepth.sourceOpenCells.length):
        (wBooleanForwardExitDepth.status!=='not-covered'||
         wBooleanForwardExitDepth.sourceOpenCells.length!==0)))
     throw new Error('C3 当前 W 真实有限实体射线退出深度与 M3–M5 来源不一致');
    const wMirrorDepthEvidence=joint.wExactMirrorDepthEvidence;
    const wMirrorCapContactPartition=joint.wMirrorCapContactPartition;
    const wMirrorSourceOutlineUnion=auditC3WMirrorSourceOutlineUnion({
     input,revision:latest.revision,
     capPartitionEvidence:wMirrorCapContactPartition,
     wRayPreview:wRay
    });
    const wMirrorExitOutlineConcordance=auditC3WMirrorExitOutlineConcordance({
     input,revision:latest.revision,
     exitEvidence:wBooleanForwardExitDepth,
     outlineEvidence:wMirrorSourceOutlineUnion
    });
    const wLateralCollisionInventory=auditC3WAllLateralProjectionCollisions({
     input,revision:latest.revision,
     mirrorExitEvidence:wMirrorExitOutlineConcordance
    });
    const wGlobalSourceCurveSolidDepth=auditC3WGlobalSourceCurveSolidDepth({
     input,revision:latest.revision,
     collisionEvidence:wLateralCollisionInventory,
     forwardExitEvidence:wBooleanForwardExitDepth
    });
    const wClosedInternalCenterFold=auditC3WCenterClosedFoldVisibility({
     input,revision:latest.revision,
     criticalPointEvidence:wCriticalPointRays,
     globalSourceCurveDepth:wGlobalSourceCurveSolidDepth
    });
    if(wClosedInternalCenterFold.revision!==latest.revision||
       wClosedInternalCenterFold.solidOperation!==(solidOperation||'unselected')||
       wClosedInternalCenterFold.finalV5Authorized!==false||
       wClosedInternalCenterFold.completeDrawingWLineStyleSigned!==false||
       wClosedInternalCenterFold.originalCurveTerminalAndCapContactVisibilityCertified!==false||
       (wGlobalSourceCurveSolidDepth.allOriginalM3WSourceCurveAtomsGloballyDepthProven===true&&
        (wClosedInternalCenterFold.allCurrentInternalSignedSourceCenterFoldsCertified!==true||
         wClosedInternalCenterFold.globallyFrontmostCenterPointCount!==
          wCriticalPointRays.internalSourceSwitchPointCount)))
     throw new Error('C3 W 内部轴心临界点与真实三维连续/完整实体深度联合证据不一致');
    if(wGlobalSourceCurveSolidDepth.revision!==latest.revision||
       wGlobalSourceCurveSolidDepth.solidOperation!==(solidOperation||'unselected')||
       wGlobalSourceCurveSolidDepth.officialV5Authorized!==false||
       wGlobalSourceCurveSolidDepth.standardEngineeringLineStylesVerified!==false||
       wGlobalSourceCurveSolidDepth.fullProjectedDrawingStrokeSetCertified!==false||
       wGlobalSourceCurveSolidDepth.closedEndpointsCapTouchesCertified!==false||
       (wLateralCollisionInventory.allPositiveWSourceCurveProjectionCollisionsClassified===true&&
        (wGlobalSourceCurveSolidDepth.allOriginalM3WSourceCurveAtomsGloballyDepthProven!==true||
         wGlobalSourceCurveSolidDepth.certifiedGlobalFrontmostCells!==
          wLateralCollisionInventory.checkedMirrorAtomicOpenCells)))
     throw new Error('C3 W 相贯曲线对整个有限实体的前后深度全开区间证明不一致');
    if(wLateralCollisionInventory.revision!==latest.revision||
       wLateralCollisionInventory.solidOperation!==(solidOperation||'unselected')||
       wLateralCollisionInventory.officialV5Authorized!==false||
       wLateralCollisionInventory.officialEngineeringLineStylesVerified!==false||
       wLateralCollisionInventory.otherFiniteCapAndCompositeContourOcclusionProven!==false||
       wLateralCollisionInventory.closedCenterAndRadicalEndpointTopologyCertified!==false||
       (wMirrorExitOutlineConcordance.checkedMirroredAtomicOpenCells>0&&
        (wLateralCollisionInventory.allPositiveWSourceCurveProjectionCollisionsClassified!==true||
         wLateralCollisionInventory.entireOriginalM3OpenSourceInventoryExactlyOnce!==true||
         wLateralCollisionInventory.currentM3LateralSourceBranchCount!==
           compiled.sourceM3.branchCount||
         wLateralCollisionInventory.checkedMirrorAtomicOpenCells!==
           wMirrorExitOutlineConcordance.checkedMirroredAtomicOpenCells)))
     throw new Error('C3 W 全来源相贯曲线投影重合与原始 M3 参数库存不一致');
    if(wMirrorExitOutlineConcordance.revision!==latest.revision||
       wMirrorExitOutlineConcordance.solidOperation!==(solidOperation||'unselected')||
       wMirrorExitOutlineConcordance.officialV5Authorized!==false||
       wMirrorExitOutlineConcordance.standardEngineeringLineStylesVerified!==false||
       wMirrorExitOutlineConcordance.completeCompositeSourceDepthRankingCertified!==false||
       wMirrorExitOutlineConcordance.allClosedCurveAndCapJunctionsCertified!==false||
       (wMirrorSourceOutlineUnion.allSourceOutlinePartitionOpenCellCount>0&&
        (wMirrorExitOutlineConcordance.allMirroredOpenSourceCellsCrossCertified!==true||
         wMirrorExitOutlineConcordance.checkedMirroredAtomicOpenCells!==
          wMirrorSourceOutlineUnion.allSourceOutlinePartitionOpenCellCount)))
     throw new Error('C3 W 全来源分区的前后曲线与有限实体射线退出深度不一致');
    if(!wMirrorSourceOutlineUnion||
       wMirrorSourceOutlineUnion.revision!==latest.revision||
       wMirrorSourceOutlineUnion.solidOperation!==(solidOperation||'unselected')||
       wMirrorSourceOutlineUnion.officialV5Authorized!==false||
       wMirrorSourceOutlineUnion.engineeringLineStylesCertified!==false||
       wMirrorSourceOutlineUnion.fullyGloballyFrontmostOutlineCertified!==false||
       (wMirrorCapContactPartition?.originalMirroredOpenCellCount>0&&
        (wMirrorSourceOutlineUnion.originalCapPartitionOpenCellCount!==
          wMirrorCapContactPartition.atomicMirroredOpenCellCount||
         wMirrorSourceOutlineUnion.allSourceOutlinePartitionOpenCellCount<
          wMirrorSourceOutlineUnion.originalCapPartitionOpenCellCount)))
     throw new Error('C3 W 全部原始投影轮廓交点与镜像端盖开区间切分证据不一致');
    if(!wMirrorCapContactPartition||
       wMirrorCapContactPartition.revision!==latest.revision||
       wMirrorCapContactPartition.solidOperation!==(solidOperation||'unselected')||
       wMirrorCapContactPartition.officialV5Authorized!==false||
       wMirrorCapContactPartition.engineeringLineStylesCertified!==false||
       wMirrorCapContactPartition.globalProjectedFeatureDepthVerified!==false||
       wMirrorCapContactPartition.closedSourceJunctionContinuityVerified!==false||
       (wMirrorDepthEvidence?.sameSignedLateralSourceWDepthOrderProven===true&&
        (wMirrorCapContactPartition.originalMirroredOpenCellCount!==
          wMirrorDepthEvidence.verifiedMirroredOpenDepthCellCount||
         wMirrorCapContactPartition.atomicMirroredOpenCellCount<
          wMirrorCapContactPartition.originalMirroredOpenCellCount)))
     throw new Error('C3 当前 W 镜像开区间与有限端盖投影接触切分证据不一致');
    if(!wMirrorDepthEvidence||
       wMirrorDepthEvidence.revision!==latest.revision||
       wMirrorDepthEvidence.solidOperation!==(solidOperation||'unselected')||
       wMirrorDepthEvidence.officialV5Authorized!==false||
       wMirrorDepthEvidence.standardEngineeringLineStylesVerified!==false||
       wMirrorDepthEvidence.otherProjectedFeatureDepthResolved!==false||
       wMirrorDepthEvidence.closedCenterAndCurveEndpointVisibilityProven!==false||
       (wMirrorDepthEvidence.sameSignedLateralSourceWDepthOrderProven===true&&
        (wMirrorDepthEvidence.status!=='scoped-exact-signed-W-lateral-mirror-depth'||
         wMirrorDepthEvidence.verifiedMirroredOpenDepthCellCount!==
          wMirrorDepthEvidence.mirroredOpenDepthCells.length)))
     throw new Error('C3 W 解析镜像前后深度与当前原始三维来源不一致');
    if(!wCriticalPointRays||
       wCriticalPointRays.revision!==latest.revision||
       wCriticalPointRays.solidOperation!==(solidOperation||'unselected')||
       wCriticalPointRays.officialEngineeringLineStylesVerified!==false||
       wCriticalPointRays.finalV5Authorized!==false||
       wCriticalPointRays.closedSourceCurveEndpointAndCapContactVisibilityCertified!==false||
       wCriticalPointRays.globalProjectedFeatureDepthAndOcclusionCertified!==false||
       (solidOperation!==null?
        (wCriticalPointRays.everyCurrentAnalyticWRootEnumerated!==true||
         wCriticalPointRays.internalSourceSwitchPointCount!==
          wCriticalPointRays.pointRays.length||
         wCriticalPointRays.certifiedPointRayCount+
          wCriticalPointRays.unresolvedPointRayCount!==
          wCriticalPointRays.internalSourceSwitchPointCount):
        (wCriticalPointRays.status!=='not-covered'||
         wCriticalPointRays.internalSourceSwitchPointCount!==0)))
     throw new Error('C3 W 临界解析点严格体积射线与当前来源修订不一致');
    if(!rayConcordance||
       rayConcordance.revision!==latest.revision||
       rayConcordance.solidOperation!==(solidOperation||'unselected')||
       rayConcordance.officialLineStylesVerified!==false||
       rayConcordance.finalV5CurveAuthorized!==false||
       rayConcordance.closedEndpointContinuityCertified!==false||
       rayConcordance.completeProjectedFeatureOcclusionCertified!==false||
       rayConcordance.sourceRayContradictions!==0||
       (solidOperation!==null?
        (rayConcordance.status!=='scoped-boolean-versus-geometric-open-ray-concordance'||
         rayConcordance.allAnalyticSourceBranchOpenCellsCrossChecked!==true||
         rayConcordance.checkedOpenCells<3*compiled.sourceM3.branchCount||
         rayConcordance.viewCounts.length!==3):
        (rayConcordance.status!=='boolean-ray-proof-not-available'||
         rayConcordance.checkedOpenCells!==0)))
     throw new Error('C3 当前三视图独立 M5 与布尔射线联合核验未通过');
    const analyticRayPaperReview=reviewC3AnalyticBooleanRayPaper({
     linked,sourceM3:compiled.sourceM3,selectedRays,
     revision:latest.revision,solidOperation
    });
    if(analyticRayPaperReview&&(
       analyticRayPaperReview.revision!==latest.revision||
       analyticRayPaperReview.solidOperation!==solidOperation||
       analyticRayPaperReview.originalBranchCount!==compiled.sourceM3.branchCount||
       analyticRayPaperReview.officialEngineeringLineStylesVerified!==false||
       analyticRayPaperReview.wholeCurveV5Approved!==false))
     throw new Error('C3 解析曲线射线辅助图与当前源修订不一致');
    if(joint.revision!==latest.revision||
       joint.status!=='scoped-open-interval-joint-evidence'||
       joint.sourceBranchCount!==compiled.sourceM3.branchCount||
       joint.allSourceBranchesAccountedFor!==true||
       joint.sourceFeature3DIncidenceGraphCovered!==true||
       joint.fullCurveTopologyVerified!==false||
       joint.allViewsContinuousVisibilityVerified!==false||
       joint.officialLineStylesVerified!==false||
       joint.v5CurveReady!==false||
       joint.constructionIntentAuthorized!==false||
       joint.merged3DSourceGraph?.revision!==latest.revision||
       joint.merged3DSourceGraph?.allLateralBranchesAndCapSegmentsCovered!==true||
       sourceAcceptance.revision!==latest.revision||
       sourceAcceptance.solidOperation!==(solidOperation||'unselected')||
       selectedRays?.revision!==latest.revision||
       selectedRays?.solidOperation!==(solidOperation||'unselected')||
       selectedRays?.officialLineStylesVerified!==false||
       selectedRays?.finalV5CurveAuthorized!==false||
       joint.BooleanSurfaceOperationSelected!==(solidOperation!==null))
      throw new Error('C3 三维源图、V/H/W 射线与当前数学输入不一致');
    if(compiled.singleOriginalV5Player!==true||
       compiled.mathematicalSourceVerified!==true||
       compiled.entireCurveV5Ready!==false||
       compiled.canExportCertifiedDrawing!==false||
       linked.officialLineStylesVerified!==false||
       linked.entireCurveV5Ready!==false||
       wRay.v5CurveReady!==false||
       vhDedup.v5CurveActionsAuthorized!==false||
       !Array.isArray(compiled.constructionSteps)||
       !compiled.constructionSteps.length||
       !compiled.player.canRender(latest.revision))
      throw new Error('C3 来源数学、唯一 V5 与线型授权范围不一致');
    clock=compiled.player;
    current=Object.freeze({...resultBase(latest),
     kind:'c3-reviewed-preview',verified:false,status:'geometry-only',
     evidence:compiled,sourceAcceptance,joint,selectedRays,rayConcordance,
     wCriticalPointRays,wBooleanForwardExitDepth,
     wFiniteCapLineForwardRays,wMirrorDepthEvidence,wMirrorCapContactPartition,
     wMirrorSourceOutlineUnion,wMirrorExitOutlineConcordance,
     wLateralCollisionInventory,wGlobalSourceCurveSolidDepth,
     wClosedInternalCenterFold,analyticRayPaperReview,
     solidOperation,
     wRay,vhDedup,
     viewTransforms,scene:linked.scene,links:linked.links,
     plan:{status:'preview-only',canPromoteToVerifiedResult:false,
      geometryId:'C3Intersection',steps:compiled.constructionSteps},
     clock});
    emit();return current;
   }
   if(latest?.task==='c1-third-view'){
    const c1=verifiedInput(latest,{task:'c1-third-view',
     type:'reviewed-c1-third-view',objectId:'C1Solid'});
    if(c1.topologyConfirmed!==true||
       !['VH','VW','HW'].includes(c1.pair)||
       !Array.isArray(c1.vertices)||c1.vertices.length!==8||
       c1.vertices.some(v=>!REVIEWED_C1_IDS.includes(v.id))||
       new Set(c1.vertices.map(v=>v.id)).size!==8)
     throw new Error('必须确认单个闭合凸体的八个对应角点及其真实拓扑');
    const primitive=prismMesh({solid:{min:P(0,0,0),max:P(1,1,1)}});
    const scopedProof=compileScopedFullyProvenConvexC1({
      input:{
       geometryId:'C1Solid',confirmedBy:'user',topologyConfirmed:true,
       revision:latest.revision,unit:'mm',vertices:c1.vertices,
       edges:primitive.data.edges,faces:primitive.data.faces
      },sheetTransform:SHEET,includeCanonicalSolution:true
    });
    // Hand off the EXACT SAME canonical solution/player used to prove each
    // original source interval: no second geometry math or V5 timeline.
    const certified=scopedProof.canonicalSolution;
    if(scopedProof.revision!==latest.revision||
       scopedProof.originalV5ReusablePlayer!==certified.player||
       scopedProof.originalV5Timeline!==certified.timeline||
       scopedProof.sourceGeometryId!==certified.sceneResult.geometry.id||
       scopedProof.originalV5TimelineStepCount!==certified.steps.length||
       scopedProof.scopedSingleConvexFullyCertified!==
        (scopedProof.missingObligations.length===0)||
       scopedProof.fullGenericC1ImagesOrNonconvexVerified!==false||
       scopedProof.realTextbookBlindTestPassed!==false||
       (scopedProof.scopedSingleConvexFullyCertified&&
        (scopedProof.allOriginalPositivePhysicalSourceRangesAccounted!==true||
         scopedProof.allThreeViewsGlobalContourCertified!==true||
         !scopedProof.firstAngleOfficialThirdViewSvg))||
       certified.singleOriginalV5Player!==true||
       certified.sceneResult.revision!==latest.revision||
       certified.geometryVerifiedWithinReviewedConvexScope!==true||
       certified.wholeSolidV5Ready!==false||
       certified.completeDrawingExportAllowed!==false||
       !Array.isArray(certified.steps)||!certified.steps.length)
     throw new Error('C1 数学与局部 V5 认证范围不一致');
    const scene=certified.sceneResult.scene;
    clock=certified.player;  // existing official V5 clock, no new player
    current=Object.freeze({...resultBase(latest),
      kind:'c1-reviewed-preview',verified:false,status:'geometry-only',
      evidence:certified,scopedProof,scene,links:projectSelectionLinks(scene),
      plan:{status:'preview-only',canPromoteToVerifiedResult:false,
       steps:certified.steps,geometryId:'C1Solid'},clock});
    emit();return current;
   }
   if(latest?.task==='composition'){
    if(latest.affinePending)
      throw new Error('未知点方程尚未经人工确认，禁止自动求解');
    if(latest.affineProblem){
      if(latest.objects?.length||latest.conditions?.length||
         latest.relations?.length||latest.totalRelationCount)
        throw new Error('不能把独立手工几何或 M2 非线性条件伪装为仿射解');
      const p=latest.affineProblem;
      if(p.confirmed!==true||p.imageId!==latest.source?.imageId||
         p.sourceStamp!==JSON.stringify([
           latest.source.imageId,latest.source.rotationDeg,latest.source.calibration]))
        throw new Error('未知量数学条件需要按当前原图和比例重新审核');
      const nonlinear=p.solverKind==='nonlinear';
      const evidence=evaluateUnifiedMath({
        kind:nonlinear?'point-constraint-system':'affine-point-system',
        revision:latest.revision,
        input:{frame:p.frame,unit:p.unit,points:p.points,constraints:p.constraints,
          ...(nonlinear?{seeds:p.seeds}:{})}
      });
      // Local nonlinear roots are NOT verified Geometry. Only exact,
      // stable affine scope can enter the canonical Geometry Scene.
      const scene=!nonlinear&&evidence.status==='unique'&&
        evidence.mathematicallyVerifiedWithinAffineScope===true?
         deriveGeometryScene({geometry:evidence.geometry,
          revision:latest.revision,resultId:'AffineScopedResult'}):null;
      current=Object.freeze({...resultBase(latest),
        kind:nonlinear?'nonlinear-evidence':'affine-evidence',
        verified:false,status:evidence.status,evidence,scene,
        links:scene?projectSelectionLinks(scene):null,plan:null,clock:null});
      emit();return current;
    }
    const geometry=confirmedCompositionGeometry(latest);
    if(latest.totalRelationCount!==(latest.relations?.length||0))
      throw new Error('存在待人工确认的对象关系，禁止出具一致性结论');
    const relationEvidence=analyzeConfirmedRelations(
      geometry,latest.relations||[],{revision:latest.revision});
    const compositionContactEvidence=evaluateReviewedBoxContacts({
      geometry,revision:latest.revision}); // scoped relation, never CSG or V5
    let scene=deriveGeometryScene({geometry,
      revision:latest.revision,resultId:'ManualGeometryEvidence'});
    // Preserve already-merged generic M5 multi-mesh first-angle depth
    // witnesses and overlapping projected edge evidence. Scoped math only.
    const sceneDepthEvidence=evaluateReviewedConvexMeshDepth({
      geometry,revision:latest.revision});
    // The SAME reviewed Geometry is now checked against M3 paper views,
    // independent M0 ray sources and original M4/M5 physical partitions.
    // This is an acceptance evidence consumer, never a new solver/player.
    const m0M3M5OriginalSourceAcceptance=auditM0M3M4M5OriginalSources({
      geometry,scene,sceneDepthEvidence,revision:latest.revision});
    const compositionInterfaceEvidence=evaluateReviewedCompositeInterfaces({
      geometry,revision:latest.revision,contactEvidence:compositionContactEvidence,
      sceneDepthEvidence});
    const compositionSeamRayEvidence=geometry.length>=2&&
      compositionInterfaceEvidence.contactBoundarySegmentCount>0?
      proveReviewedCompositeSeamRays({geometry,revision:latest.revision}):null;
    // All ORIGINAL 3D physical edges of 2..8 finite M0 convex bodies,
    // each checked against EVERY opaque body in all FIRST-ANGLE views.
    // This is independently proved, not inferred from SVG coincidences.
    // For mixed/manual non-mesh geometry the scope does not apply.
    const boundedConvexInventory=geometry.length>=2&&geometry.length<=8&&
      geometry.every(g=>g.kind==='mesh'&&g.space==='model-3d'&&
       g.unit==='mm'&&Array.isArray(g.data?.edges))&&
      geometry.reduce((n,g)=>n+g.data.edges.length,0)<=80;
    const originalMultiBodyEdgeRays=boundedConvexInventory?
      auditReviewedMultiBodyWholePhysicalEdgeRays({
        geometry,revision:latest.revision
      }):null;
    if(originalMultiBodyEdgeRays){
      const audit=originalMultiBodyEdgeRays;
      const edgeCount=geometry.reduce((n,g)=>n+g.data.edges.length,0);
      const counted=audit.counts.physicalProjected+audit.counts.collapsed+
       audit.counts.ambiguousSourceDihedral+
       audit.counts.coplanarMeshSubdivision;
      if(audit.revision!==latest.revision||
         audit.componentCount!==geometry.length||
         audit.originalSourceEdgeCount!==edgeCount||
         audit.projectedEdgeRowCount!==3*edgeCount||
         audit.rows.length!==counted||
         audit.allBodiesM0ClosedConvexVerified!==true||
         audit.allContinuousOriginalSourceRaysCheckedAgainstEveryComponent!==true||
         audit.compositeNonconvexBooleanBoundaryCertified!==false||
         audit.generatedIntersectionCurveEdgesCertified!==false||
         audit.combinedC2EngineeringLineStylesCertified!==false||
         audit.completedDrawingV5Authorized!==false||
         audit.signedV5ActionCount!==0)
       throw new Error('C2 原始棱全来源 M5 遮挡或正式线型门禁不一致');
    }
    // Positive original + generated physical 3D Boolean source proofs;
    // only for M0-reviewed axis-aligned cuboids. Nothing in this review
    // signs generated engineering lines or a new animation player.
    const orthogonalBooleanFeatureAudit=boundedConvexInventory?
      reviewC2OrthogonalBooleanFeatures({
       geometry,revision:latest.revision
      }):null;
    if(orthogonalBooleanFeatureAudit&&
       (orthogonalBooleanFeatureAudit.revision!==latest.revision||
        orthogonalBooleanFeatureAudit.sourceGeometryIds.length!==geometry.length||
        orthogonalBooleanFeatureAudit.officialDrawingLineStylesVerified!==false||
        orthogonalBooleanFeatureAudit.completeV5DrawingAuthorized!==false))
     throw new Error('C2 新交汇棱和当前 M5 作用域不一致');
    const c2PaperRayProof=orthogonalBooleanFeatureAudit&&geometry.length===2?
      reviewC2FullPaperStrokeReadiness({
       geometry,revision:latest.revision,sceneDepthEvidence,
       orthogonalBooleanFeatureAudit
      }):null;
    if(c2PaperRayProof&&(c2PaperRayProof.revision!==latest.revision||
       c2PaperRayProof.sourceGeometryIds.length!==geometry.length||
       c2PaperRayProof.paperIntervalCount!==c2PaperRayProof.entries.length||
       c2PaperRayProof.fullSourceCrossAudit!==true||
       c2PaperRayProof.officialDrawingLineStylesVerified!==false||
       c2PaperRayProof.completeV5DrawingAuthorized!==false))
     throw new Error('C2 原始/生成线 M5 全局遮挡与端点清单不可信');
    const spatialV5Readiness=inspectSpatialV5Readiness({
      sceneDepthEvidence,revision:latest.revision});
    // The existing Geometry Scene compiler already fixes first-angle
    // paper scale for the CURRENT source geometry. Use that SAME scale,
    // and the existing 07/V5 Motion geometry, never a new player or
    // independent solver. All candidate stroke styles stay unknown.
    const {scopedMotionParity,spatialStrokeConstructionDAG,
     spatialV5ActionRelease}=
      sceneDepthEvidence.projectedStrokePartitions
        ?.status==='preview-partition-evidence-only'?(()=>{
         const paper=compileGeometryScene(scene,{sheet:SHEET});
         const transform=paper.paperTransform;
         const viewTransforms={V:transform,H:transform,W:transform};
         const parity=auditReviewedM4V5Motion({geometry,
          sceneDepthEvidence,revision:latest.revision,viewTransforms});
         const dag=auditSpatialStrokeConstructionDAG({
          geometry,sceneDepthEvidence,revision:latest.revision,
          viewTransforms,motionParity:parity});
         const released=inspectSpatialV5ActionRelease({
          geometry,sceneDepthEvidence,revision:latest.revision,
          viewTransforms,motionParity:parity,
          spatialConstructionDAG:dag});
         return {scopedMotionParity:parity,
          spatialStrokeConstructionDAG:dag,spatialV5ActionRelease:released};
        })():{scopedMotionParity:null,spatialStrokeConstructionDAG:null,
         spatialV5ActionRelease:null};
    // Only the M0/M5-positive *OPEN* union creases become presentation
    // segments. No derived geometry enters the reviewed input inventory,
    // ray proof, M4 action graph or official V5 player.
    const linkedC2=orthogonalBooleanFeatureAudit?
      buildC2GeneratedLinkedScene({geometry,revision:latest.revision,
       orthogonalBooleanFeatureAudit}):null;
    if(linkedC2)scene=linkedC2.scene;
    current=Object.freeze({...resultBase(latest),kind:'composition-evidence',
      verified:false,status:'confirmed-input-only',scene,linkedC2,relationEvidence,
      compositionContactEvidence,compositionInterfaceEvidence,
      compositionSeamRayEvidence,originalMultiBodyEdgeRays,
      orthogonalBooleanFeatureAudit,c2PaperRayProof,sceneDepthEvidence,
      m0M3M5OriginalSourceAcceptance,spatialV5Readiness,
      scopedMotionParity,spatialStrokeConstructionDAG,spatialV5ActionRelease,
      links:projectSelectionLinks(scene),plan:null,clock:null});
    emit();return current;
   }
   if(latest?.task==='planar'){
    const input=verifiedPlanarFillet(latest);
    // Existing unified M3 proves this branch and independently matches
    // canonical ConstructionIntent -> DAG -> ONE V5. No local solver.
    const plan=evaluateUnifiedMath({kind:'segments',input,sheet:SHEET,revision:latest.revision});
    if(plan.status!=='ready'||plan.canonicalVerified!==true||
       plan.mathematicallyVerified!==true||!plan.timing||
       !Array.isArray(plan.steps)||!plan.steps.length)
      throw new Error('当前圆弧分支无法通过已有 M3 与统一 V5 数学审核');
    const arc=plan.originalLesson?.result?.arc;
    if(!arc||!finite(arc.radius)||!finite(arc.center?.x)||!finite(arc.center?.y)||
       !finite(arc.startAngle)||!finite(arc.endAngle)||
       !['cw','ccw'].includes(arc.direction))
      throw new Error('已验证圆弧缺少完整的模型 mm 几何证据');
    const geometry=[
     {id:'Given1',kind:'segment',space:'drawing-2d',unit:'mm',
      data:{start:input.first.a,end:input.first.b}},
     {id:'Given2',kind:'segment',space:'drawing-2d',unit:'mm',
      data:{start:input.second.a,end:input.second.b}},
     {id:'Fillet1',kind:'arc',space:'drawing-2d',unit:'mm',
      data:{center:arc.center,radius:arc.radius,startAngle:arc.startAngle,
       endAngle:arc.endAngle,direction:arc.direction}}
    ];
    const scene=deriveGeometryScene({geometry,revision:latest.revision,
      resultId:'FilletResult',branchId:plan.selectedBranchId});
    clock=Timeline.createPlayer(plan.timing,{revision:latest.revision});
    current=Object.freeze({...resultBase(latest),verified:true,kind:'planar-fillet',
     status:'unique',plan,scene,links:projectSelectionLinks(scene),clock,
     residualMm:plan.residualMm??null});
    emit();return current;
   }
   if(latest?.task==='exploration'){
    const input=verifiedPrismSection(latest);
    // Kept material is an explicitly human-reviewed condition. Shared
    // first-angle observer rays come from ONE existing projection authority.
    // The specialist only certifies OPEN edge intervals, never whole strokes.
    const side=latest.conditions[0].value.retainedHalfspace??'unreviewed';
    const visibilityReview=side==='unreviewed'?undefined:{
     retainedHalfspace:side,observerDirections:FIRST_ANGLE_OBSERVER_RAYS,
     sourceRevision:latest.revision
    };
    const evidence=evaluateUnifiedMath({kind:'spatial-section',input,
      revision:latest.revision,visibilityReview});
    if(evidence.status!=='geometry-only'||
       evidence.geometryVerifiedWithinSpecialistScope!==true)
      throw new Error('当前截切几何证据不充分；已拒绝显示推测截交线');
    // The specialist has already computed and independently checked these
    // actual finite intersection edges. The full 3D visibility and the V5
    // section-construction chain are still NOT verified.
    const perimeter=evidence.sectionPerimeterGeometry;
    if(perimeter?.kind!=='polyline'||perimeter.space!=='model-3d')
      throw new Error('M3 未提供已独立审核的截交多边形，不能显示猜测交线');
    const scene=deriveGeometryScene({
      geometry:[prismMesh(input),perimeter],
      revision:latest.revision,resultId:'PrismEvidence'});
    // One existing V5 player for a mathematical PREVIEW only. This cannot
    // pass the coordinator's verified/export gate or become a full SolveResult.
    const plan=evidence.sectionConstructionPreview;
    if(plan?.status!=='preview-only'||plan.revision!==latest.revision||
       plan.canPromoteToVerifiedResult!==false||!plan.timing||!plan.viewTransforms)
      throw new Error('空间求交步骤尚未通过共用 M3→V5 一致性审核');
    clock=Timeline.createPlayer(plan.timing,{revision:latest.revision});
    current=Object.freeze({...resultBase(latest),kind:'prism-evidence',
      verified:false,status:'geometry-only',evidence,scene,
      links:projectSelectionLinks(scene),plan,clock});
    emit();return current;
   }
   const point=verifiedPointFromInputs(latest);
   const knownViews={V:[point.x,point.z],H:[point.x,point.y]};
   const input={knownViews,sheetTransform:SHEET};
   const actual=solveProjection(input);
   const plan=evaluateUnifiedMath({kind:'point-projection',input,revision:latest.revision});
   const tolerance=1e-7;
   if(actual.status!=='unique'||actual.globallyUnique!==true||
      plan.status!=='ready'||plan.mathematicallyVerified!==true||
      plan.canonicalVerified!==true||plan.revision!==latest.revision||
      !['x','y','z'].every(k=>Math.abs(actual.point[k]-point[k])<=tolerance)||
      !Array.isArray(plan.steps)||!plan.steps.length||!plan.timing)
     throw new Error('数学结果、已确认坐标与唯一 V5 意图不一致，已拒绝播放');
   // Geometry is emitted from the specialist result, NEVER caller display data.
   const scene=deriveGeometryScene({
    geometry:[{id:'Point1',kind:'point',space:'model-3d',unit:'mm',data:actual.point}],
    revision:latest.revision,resultId:'PointSolve',branchId:plan.selectedBranchId||null
   });
   const links=projectSelectionLinks(scene);
   clock=Timeline.createPlayer(plan.timing,{revision:latest.revision});
   current=Object.freeze({
    projectId:latest.projectId,inputRevision:latest.revision,verified:true,
    status:'unique',point:actual.point,residualMm:actual.maxResidual,
    plan,scene,links,clock
   });
   emit();return current;
  }
 };
 return api;
}
module.exports={createUnifiedProjectSession,verifiedPointFromInputs,
 verifiedPlanarFillet,verifiedPrismSection,prismMesh,
 confirmedCompositionGeometry,SHEET};
