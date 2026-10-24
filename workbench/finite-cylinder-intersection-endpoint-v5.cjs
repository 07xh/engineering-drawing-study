'use strict';
/**
 * C3: release ONLY analytically proven finite lateral-lateral intersection
 * ENDPOINT POINTS and optional independently proven INTERIOR AUXILIARY
 * POINTS, plus optional source-cylinder circle guides, to the original
 * 07 V5 (ConstructionIntent → Step DAG).
 *
 * No parametric curve interpolation or standard hidden/visible stroke action
 * is signed: neither branch junction topology nor M5 contour/occlusion proof
 * is available. The specialist is recomputed within THIS trusted boundary;
 * no caller-supplied point, SolveResult, step, intent or V5 action is accepted.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditFiniteCylinderWRayIntervals}=
 require('./m5-finite-cylinder-w-ray-intervals.cjs');
const {auditFiniteCylinderVHAxisRays}=
 require('./m5-finite-cylinder-vh-axis-rays.cjs');
const {auditFiniteCylinderEndpointIncidence}=
 require('./m5-analytic-cylinder-endpoint-incidence.cjs');
const {buildC3VHProjectionDedup,evaluateC3VHProjectedSpan}=
 require('./c3-vh-projection-dedup.cjs');
const {project,toSheet,VIEWS}=require('../core/projection/conventions.js');
const {CONSTRUCTION_INTENT_VERSION:VERSION}=require('../core/contracts/construction-intent.js');
const {verifiedTeachingActionToV5}=require('./construction-step-v5-adapter.cjs');
const {assertM3ToV5Consistency}=require('./m3-v5-consistency-gate.cjs');
const Timeline=require('./teaching-timeline-v5.js');
const finite=Number.isFinite;
const deepFreeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))deepFreeze(v);Object.freeze(x);
}return x;};
function compileFiniteCylinderEndpointV5({input,revision,sheetTransform,
 stationCountPerBranch=0,viewTransforms=null,
 includeSourceCircleGuides=false,includeProjectedSeamArcGuides=false}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    !sheetTransform||!sheetTransform.origin||
    !finite(sheetTransform.origin.x)||!finite(sheetTransform.origin.y)||
    !finite(sheetTransform.scale)||sheetTransform.scale<=0||
    sheetTransform.scale>100)
  throw new TypeError('current reviewed source and bounded shared V5 transform required');
 if(typeof includeSourceCircleGuides!=='boolean')
  throw new TypeError('reviewed source-circle guide toggle must be boolean');
 if(typeof includeProjectedSeamArcGuides!=='boolean')
  throw new TypeError('analytic projected seam-arc guide toggle must be boolean');
 if(!Number.isSafeInteger(stationCountPerBranch)||
    stationCountPerBranch<0||stationCountPerBranch>2)
  throw new RangeError('0..2 independently proven interior stations per branch required');
 if(viewTransforms!==null&&(
    typeof viewTransforms!=='object'||Array.isArray(viewTransforms)||
    Object.keys(viewTransforms).sort().join(',')!=='H,V,W'||
    !VIEWS.every(v=>{
     const t=viewTransforms[v];
     return t&&t.origin&&finite(t.origin.x)&&finite(t.origin.y)&&
      finite(t.scale)&&t.scale>0&&t.scale<=100;
    })))
  throw new TypeError('three bounded first-angle V/H/W paper transforms required');
 const proof=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 if(proof.status!=='scoped-analytic-ready'||
    proof.geometryVerifiedWithinSpecialistScope!==true||
    proof.analyticallyCompleteWithinScope!==true||
    proof.verifiedCapClipping!==true||
    proof.sourceConfirmed!==true||
    proof.officialLineStylesVerified!==false||
    proof.v5Ready!==false)
  throw new RangeError('finite cylinder analytic lateral-lateral endpoint proof unavailable');
 const continuousCurveWRayEvidence=auditFiniteCylinderWRayIntervals({input,revision});
 if(continuousCurveWRayEvidence.status!=='source-bounded-W-open-rays'||
    !continuousCurveWRayEvidence.sourceBranchCoverageVerified||
    continuousCurveWRayEvidence.sourceBranchCount!==proof.branchCount||
    continuousCurveWRayEvidence.continuousCurveV5Ready!==false||
    continuousCurveWRayEvidence.standardLineStylesVerified!==false)
  throw new RangeError('independently recomputed M5 W-view curve spans incomplete');
 const continuousCurveVHAxisRayEvidence=auditFiniteCylinderVHAxisRays({input,revision});
 if(continuousCurveVHAxisRayEvidence.status!==
      'scoped-analytic-VH-strict-volume-occlusion'||
    continuousCurveVHAxisRayEvidence.sourceBranchCount!==proof.branchCount||
    continuousCurveVHAxisRayEvidence.sourceBranchCoverageVerified!==true||
    continuousCurveVHAxisRayEvidence.completeCurveV5Ready!==false||
    continuousCurveVHAxisRayEvidence.officialLineStylesVerified!==false)
  throw new RangeError('independently recomputed M5 V/H axis-ray proof unavailable');
 const sourceM5JunctionEvidence=auditFiniteCylinderEndpointIncidence({input,revision});
 if(sourceM5JunctionEvidence.status!=='scoped-analytic-3d-endpoint-incidence'||
    sourceM5JunctionEvidence.sourceM3BranchCount!==proof.branchCount||
    sourceM5JunctionEvidence.standardLineStylesVerified!==false||
    sourceM5JunctionEvidence.v5CurveReady!==false)
  throw new RangeError('source analytic 3D endpoint incidence proof incomplete');
 const branchEndpoints=proof.branches.flatMap((b,i)=>
  b.endpoints.map((e,j)=>({branchIndex:i,branchId:b.id,role:j===0?'from':'to',
   point:e.point,events:e.events})));
 // No caller-provided point geometry. Derive interior stations from CURRENT
 // signed-radical M3 source, then independently check both finite surfaces.
 const branchStations=proof.branches.flatMap((b,i)=>{
  const result=[],Z=proof.source.zCylinder,Y=proof.source.yCylinder;
  for(let k=1;k<=stationCountPerBranch;k++){
   const x=b.xRange[0]+(b.xRange[1]-b.xRange[0])*
     k/(stationCountPerBranch+1);
   const yy=(Z.radius-Math.abs(x-Z.xCenter))*
     (Z.radius+Math.abs(x-Z.xCenter));
   const zz=(Y.radius-Math.abs(x-Y.xCenter))*
     (Y.radius+Math.abs(x-Y.xCenter));
   if(!(yy>0&&zz>0)||!(x>b.xRange[0]&&x<b.xRange[1]))
    throw new RangeError('analytic station too close to singular source');
   const point={x,y:Z.yCenter+b.signY*Math.sqrt(yy),
    z:Y.zCenter+b.signZ*Math.sqrt(zz)};
   const capTol=1e-10*Math.max(1,Z.radius,Y.radius);
   if(!(point.y>Y.yMin+capTol&&point.y<Y.yMax-capTol&&
     point.z>Z.zMin+capTol&&point.z<Z.zMax-capTol))
    throw new RangeError('interior station not strictly inside finite axial caps');
   result.push({branchIndex:i,branchId:b.id,role:'interior-'+k,point,
    events:{interiorOnly:true,sourceBranchId:b.id}});
  }
  return result;
 });
 if(!branchEndpoints.length||branchEndpoints.length>48)
  throw new RangeError('finite cylinder endpoint budget exceeded');
 const allStations=[...branchEndpoints,...branchStations];
 if(allStations.length*3>300)
  throw new RangeError('C3 stations exceed the canonical construction DAG budget');
 const Z=proof.source.zCylinder,Y=proof.source.yCylinder;
 const scale=Math.max(1,Z.radius*Z.radius,Y.radius*Y.radius);
 const intents=[],steps=[],bindings=[],sourceCircleGuides=[],
  projectedSeamArcGuides=[];
 const sheetByIntentId={};
 const source={solver:'05-finite-orthogonal-cylinder-analytic-M3',
  revision,unit:'mm',proofScope:includeProjectedSeamArcGuides?
   'finite-cylinder-projected-arcs-and-analytic-points':
   includeSourceCircleGuides?'finite-cylinder-original-circles-and-analytic-points':
   stationCountPerBranch>0?'finite-lateral-lateral-branch-points-only':
   'finite-lateral-lateral-branch-endpoint-only',
  proofLevel:'analytic',resultId:null,branchId:null,status:'unique',
  evidenceSource:'independent-M3-implicit-surfaces-and-cap-clipping'};
 // The Y-axis cylinder has a true circular V view in model (x,z).
 // The Z-axis cylinder has a true circular H view in model (x,y).
 // These are KNOWN original geometric construction guides, not intersection
 // curves or source-visible/hidden line-style conclusions.
 if(includeSourceCircleGuides){
  const guides=[
   {view:'V',solid:'yCylinder',
    center:{x:Y.xCenter,y:Y.zCenter},radius:Y.radius},
   {view:'H',solid:'zCylinder',
    center:{x:Z.xCenter,y:Z.yCenter},radius:Z.radius}
  ];
  for(const guide of guides){
   const id='C3SourceCircle'+guide.view;
   const op={id:id+'Shape',kind:'circle',coordinateSpace:'model-mm',
    geometry:{center:{...guide.center},radius:guide.radius}};
   const transform=viewTransforms?.[guide.view]||sheetTransform;
   const action=verifiedTeachingActionToV5({
    id:op.id,kind:'circle',coordinateSpace:'model-mm',
    center:guide.center,radius:guide.radius
   },transform);
   const intent={schema:VERSION,id,
    purpose:'construct-original-finite-cylinder-circular-view-guide',
    role:'given',dependsOn:[],inputEntityIds:[],
    outputEntityIds:[op.id],operations:[op],source:{...source}};
   const step={id,role:'given',dependsOn:[],
    title:'原始有限圆柱 '+guide.solid+' · '+guide.view+' 面真实圆形投影',
    explanation:'由已确认的半径和轴心精确投影生成原始辅助圆；叠加实体的工程可见轮廓和正式实虚线仍未签收。',
    actions:[action]};
   // Every Intent within the canonical DAG has IDENTICAL source metadata.
   // The one combined trust scope was selected before creating any steps.
   intents.push(intent);steps.push(step);
   sheetByIntentId[id]=transform;
   sourceCircleGuides.push({view:guide.view,
    sourceSolid:guide.solid,centerModelMm:{...guide.center},
    radiusModelMm:guide.radius,
    centerSheetPx:{...action.geometry.center},
    radiusSheetPx:action.geometry.radius,
    firstAngleSourceGeometryVerified:true,
    sourceProjectionGuideV5Authorized:true,
    officialContourLineStyleVerified:false,
    interpenetrationCurveLineStyleVerified:false});
  }
 }
 // Projection in V=(x,z) or H=(x,y) eliminates one of the signed
 // radicals. A verified finite M3 lateral/lateral branch therefore projects
 // to a true SUBARC of its owning source cylinder's exact model-mm circle.
 // Reuse the original directed-arc operation and V5 Motion, NOT sampled
 // line chords. De-duplicate exact same projected arcs across 3D branches.
 if(includeProjectedSeamArcGuides){
  const audit=buildC3VHProjectionDedup({input,revision});
  if(audit.status!=='scoped-projected-analytic-interval-deduplicated'||
     audit.sourceBranchCount!==proof.branchCount||
     audit.originalCylinderContourCoincidenceProven!==true||
     audit.projectionOwnershipVerified!==true||
     audit.officialLineStylesVerified!==false||
     audit.v5CurveActionsAuthorized!==false)
   throw new RangeError('analytic projected V/H seam source not independently proven');
  for(const [index,row] of audit.spans.entries()){
   const [lo,hi]=row.xOpenRange;
   const start=evaluateC3VHProjectedSpan(row,lo),
     end=evaluateC3VHProjectedSpan(row,hi),
     circle=row.projectedSourceCircle;
   const angle=uv=>Math.atan2(
    uv.v-circle.coordinateCenter,uv.u-circle.xCenter)*180/Math.PI;
   const startAngle=angle(start),endAngle=angle(end);
   const direction=row.retainedSign===1?'cw':'ccw';
   const sweep=endAngle-startAngle;
   if(!(Number.isFinite(sweep)&&Math.abs(sweep)>1e-9&&
      Math.abs(sweep)<360-1e-9&&
      (sweep>0)===(direction==='ccw')))
    throw new RangeError('analytic projected circle arc has singular sweep');
   const id='C3ProjectedArc'+index+row.view;
   const geometry={center:{x:circle.xCenter,y:circle.coordinateCenter},
    radius:circle.radius,startAngle,endAngle,direction};
   const op={id:id+'Shape',kind:'directed-arc',
    coordinateSpace:'model-mm',geometry};
   const intent={schema:VERSION,id,
    purpose:'construct-analytic-intersection-projection-as-source-circle-arc',
    role:'auxiliary',dependsOn:[],inputEntityIds:[],
    outputEntityIds:[op.id],operations:[op],source:{...source}};
   const transform=viewTransforms?.[row.view]||sheetTransform;
   const action=verifiedTeachingActionToV5({
    id:op.id,kind:'arc',coordinateSpace:'model-mm',...geometry
   },transform);
   const step={id,role:'auxiliary',dependsOn:[],
    title:'相贯解析投影 · '+row.view+' 面 · 去重真实圆弧 '+(index+1),
    explanation:'由 M3 解析曲线在原始圆柱上的精确圆形投影构成，不使用折线采样；该弧尚未获得实体交汇、国标虚实线及最终相贯曲线答案签收。',
    actions:[action]};
   intents.push(intent);steps.push(step);
   sheetByIntentId[id]=transform;
   projectedSeamArcGuides.push({
    id,view:row.view,sourceCylinder:row.sourceCylinder,
    sourceBranchIds:[...row.sourceBranchIds],
    retainedSign:row.retainedSign,
    xRange:[...row.xOpenRange],centerModelMm:{...geometry.center},
    radiusModelMm:geometry.radius,
    startAngleDegrees:startAngle,endAngleDegrees:endAngle,
    modelDirection:direction,
    exactProjectedCircleArcVerified:true,
    duplicateSourceProjectionRemoved:true,
    canonicalDirectedArcV5Authorized:true,
    originalFeatureContourVisibilityVerified:false,
    officialStandardLineStyleVerified:false
   });
  }
 }
 for(const [index,ep] of allStations.entries()){
  const p=ep.point;
  if(!p||!['x','y','z'].every(k=>finite(p[k])))throw new RangeError('invalid specialist endpoint');
  const residualZ=((p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2-Z.radius**2)/scale;
  const residualY=((p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2-Y.radius**2)/scale;
  const tol=Math.max(1e-8,1e-9*Math.max(1,Z.radius,Y.radius));
  if(Math.abs(residualZ)>1e-9||Math.abs(residualY)>1e-9||
    p.z<Z.zMin-tol||p.z>Z.zMax+tol||
    p.y<Y.yMin-tol||p.y>Y.yMax+tol)
   throw new RangeError('endpoint violates independently checked finite cylinder source');
  const orthographic=project(p);
  for(const view of VIEWS){
   const interior=ep.role.startsWith('interior-');
   const id=(interior?'C3Station':'C3Endpoint')+index+view;
   const point=toSheet(view,orthographic[view],
    viewTransforms?.[view]||sheetTransform);
   const op={id:id+'Point',kind:'point',coordinateSpace:'sheet-px',
    geometry:{at:{...point}}};
   const intent={schema:VERSION,id,purpose:interior?
    'construct-verified-analytic-branch-interior-point':
    'project-analytic-branch-endpoint',
    role:'result',dependsOn:[],inputEntityIds:[],
    outputEntityIds:[op.id],operations:[op],source:{...source}};
   const step={id,role:'result',dependsOn:[],
    title:interior?'解析分支 '+ep.branchId+' · 辅助求点 · '+view+' 面':
     '第 '+(index+1)+' 个解析分支端点 · '+view+' 面',
    explanation:interior?
     '当前解析分支的真实公共点，已复核两柱曲面及有限端盖；不是连续曲线或虚实线证明。':
     '已核实两有限圆柱侧面方程及端盖范围的端点投影；不是曲线虚实线证明。',
    actions:[verifiedTeachingActionToV5({id:op.id,kind:'point',
      coordinateSpace:'sheet-px',at:point},sheetTransform)]};
   intents.push(intent);steps.push(step);
   bindings.push({id:op.id,branchId:ep.branchId,endpointRole:ep.role,
    view,point3D:{...p},projectedMm:{...orthographic[view]},
    sheetPoint:{...point},analyticEndpointPointVerified:!interior,
    analyticInteriorStationVerified:interior,sourceBranchParameterX:p.x,
    physicalJunctionTopologyVerified:false,
    completeCurveVisibilityVerified:false,
    standardLineStyleVerified:false});
  }
 }
 if(intents.length>300)throw new RangeError('too many C3 endpoint V5 actions');
 const timing=Timeline.compileTimeline(steps);
 assertM3ToV5Consistency({revision,intents,steps,timing,sheet:sheetTransform,
  sheetByIntentId:includeSourceCircleGuides||includeProjectedSeamArcGuides?
   sheetByIntentId:null});
 const player=Timeline.createPlayer(timing,{revision});
 return deepFreeze({schema:'draftai-c3-finite-cylinder-point-v5/1',
  revision,status:includeProjectedSeamArcGuides?
   'analytic-vh-projection-arc-guides-and-points':
   includeSourceCircleGuides?'analytic-point-actions-and-original-circle-guides':
   'analytic-endpoint-point-actions-only',
  sourceM3:proof,continuousCurveWRayEvidence,continuousCurveVHAxisRayEvidence,
  sourceM5JunctionEvidence,
  constructionIntents:intents,constructionSteps:steps,
  timing,player,bindings,sourceCircleGuides,projectedSeamArcGuides,
  provenAnalyticVHArcV5ActionCount:projectedSeamArcGuides.length,
  exactAnalyticVHArcV5Ready:projectedSeamArcGuides.length>0,
  provenOriginalSourceCircleV5ActionCount:sourceCircleGuides.length,
  originalSourceCircleGuidesV5Ready:sourceCircleGuides.length===2,
  independentlyProvenEndpointCount:branchEndpoints.length,
  signedEndpointPointActionCount:branchEndpoints.length*VIEWS.length,
  signedInteriorAuxiliaryPointActionCount:branchStations.length*VIEWS.length,
  verifiedInteriorStationCount:branchStations.length,stationCountPerBranch,
  mathematicalSourceVerified:true,singleOriginalV5Player:true,
  endpointPointV5Ready:true,interiorStationPointV5Ready:stationCountPerBranch>0,
  branchJunctionsVerified:false,
  lateralCapAndCapCapIntersectionsVerified:false,
  entireCurveV5Ready:false,
  standardVisibleHiddenLineStylesVerified:false,
  wholeDrawingVerified:false,canExportCertifiedDrawing:false});
}
module.exports={compileFiniteCylinderEndpointV5};
