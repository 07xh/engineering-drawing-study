'use strict';
/**
 * C3: release ONLY analytically proven finite lateral-lateral intersection
 * ENDPOINT POINTS to the original 07 V5 (ConstructionIntent → Step DAG).
 *
 * No parametric curve interpolation or standard hidden/visible stroke action
 * is signed: neither branch junction topology nor M5 contour/occlusion proof
 * is available. The specialist is recomputed within THIS trusted boundary;
 * no caller-supplied point, SolveResult, step, intent or V5 action is accepted.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditFiniteCylinderWRayIntervals}=
 require('./m5-finite-cylinder-w-ray-intervals.cjs');
const {auditFiniteCylinderEndpointIncidence}=
 require('./m5-analytic-cylinder-endpoint-incidence.cjs');
const {project,toSheet,VIEWS}=require('../core/projection/conventions.js');
const {CONSTRUCTION_INTENT_VERSION:VERSION}=require('../core/contracts/construction-intent.js');
const {verifiedTeachingActionToV5}=require('./construction-step-v5-adapter.cjs');
const {assertM3ToV5Consistency}=require('./m3-v5-consistency-gate.cjs');
const Timeline=require('./teaching-timeline-v5.js');
const finite=Number.isFinite;
const deepFreeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))deepFreeze(v);Object.freeze(x);
}return x;};
function compileFiniteCylinderEndpointV5({input,revision,sheetTransform}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    !sheetTransform||!sheetTransform.origin||
    !finite(sheetTransform.origin.x)||!finite(sheetTransform.origin.y)||
    !finite(sheetTransform.scale)||sheetTransform.scale<=0||
    sheetTransform.scale>100)
  throw new TypeError('current reviewed source and bounded shared V5 transform required');
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
 const sourceM5JunctionEvidence=auditFiniteCylinderEndpointIncidence({input,revision});
 if(sourceM5JunctionEvidence.status!=='scoped-analytic-3d-endpoint-incidence'||
    sourceM5JunctionEvidence.sourceM3BranchCount!==proof.branchCount||
    sourceM5JunctionEvidence.standardLineStylesVerified!==false||
    sourceM5JunctionEvidence.v5CurveReady!==false)
  throw new RangeError('source analytic 3D endpoint incidence proof incomplete');
 const branchEndpoints=proof.branches.flatMap((b,i)=>
  b.endpoints.map((e,j)=>({branchIndex:i,branchId:b.id,role:j===0?'from':'to',
   point:e.point,events:e.events})));
 if(!branchEndpoints.length||branchEndpoints.length>48)
  throw new RangeError('finite cylinder endpoint budget exceeded');
 const Z=proof.source.zCylinder,Y=proof.source.yCylinder;
 const scale=Math.max(1,Z.radius*Z.radius,Y.radius*Y.radius);
 const intents=[],steps=[],bindings=[];
 const source={solver:'05-finite-orthogonal-cylinder-analytic-M3',
  revision,unit:'mm',proofScope:'finite-lateral-lateral-branch-endpoint-only',
  proofLevel:'analytic',resultId:null,branchId:null,status:'unique',
  evidenceSource:'independent-M3-implicit-surfaces-and-cap-clipping'};
 for(const [index,ep] of branchEndpoints.entries()){
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
   const id='C3Endpoint'+index+view,point=toSheet(view,orthographic[view],sheetTransform);
   const op={id:id+'Point',kind:'point',coordinateSpace:'sheet-px',
    geometry:{at:{...point}}};
   const intent={schema:VERSION,id,purpose:'project-analytic-branch-endpoint',
    role:'result',dependsOn:[],inputEntityIds:[],
    outputEntityIds:[op.id],operations:[op],source:{...source}};
   const step={id,role:'result',dependsOn:[],
    title:'第 '+(index+1)+' 个解析分支端点 · '+view+' 面',
    explanation:'已核实两有限圆柱侧面方程及端盖范围的端点投影；不是曲线虚实线证明。',
    actions:[verifiedTeachingActionToV5({id:op.id,kind:'point',
      coordinateSpace:'sheet-px',at:point},sheetTransform)]};
   intents.push(intent);steps.push(step);
   bindings.push({id:op.id,branchId:ep.branchId,endpointRole:ep.role,
    view,point3D:{...p},projectedMm:{...orthographic[view]},
    sheetPoint:{...point},analyticEndpointPointVerified:true,
    physicalJunctionTopologyVerified:false,
    completeCurveVisibilityVerified:false,
    standardLineStyleVerified:false});
  }
 }
 if(intents.length>300)throw new RangeError('too many C3 endpoint V5 actions');
 const timing=Timeline.compileTimeline(steps);
 assertM3ToV5Consistency({revision,intents,steps,timing,sheet:sheetTransform});
 const player=Timeline.createPlayer(timing,{revision});
 return deepFreeze({schema:'draftai-c3-finite-cylinder-point-v5/1',
  revision,status:'analytic-endpoint-point-actions-only',
  sourceM3:proof,continuousCurveWRayEvidence,sourceM5JunctionEvidence,
  constructionIntents:intents,constructionSteps:steps,
  timing,player,bindings,
  independentlyProvenEndpointCount:branchEndpoints.length,
  signedEndpointPointActionCount:bindings.length,
  mathematicalSourceVerified:true,singleOriginalV5Player:true,
  endpointPointV5Ready:true,branchJunctionsVerified:false,
  lateralCapAndCapCapIntersectionsVerified:false,
  entireCurveV5Ready:false,
  standardVisibleHiddenLineStylesVerified:false,
  wholeDrawingVerified:false,canExportCertifiedDrawing:false});
}
module.exports={compileFiniteCylinderEndpointV5};
