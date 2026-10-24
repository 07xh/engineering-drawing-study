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
const {analyzeConfirmedRelations}=require('../core/constraints/multiobject-relation-evidence.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../workbench/reviewed-convex-scene-depth.cjs');
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
    const scene=deriveGeometryScene({geometry,
      revision:latest.revision,resultId:'ManualGeometryEvidence'});
    // Preserve already-merged generic M5 multi-mesh first-angle depth
    // witnesses and overlapping projected edge evidence. Scoped math only.
    const sceneDepthEvidence=evaluateReviewedConvexMeshDepth({
      geometry,revision:latest.revision});
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
    current=Object.freeze({...resultBase(latest),kind:'composition-evidence',
      verified:false,status:'confirmed-input-only',scene,relationEvidence,sceneDepthEvidence,spatialV5Readiness,
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
