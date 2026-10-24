'use strict';
/**
 * One CURRENT C3 M3/V5 mathematical source -> existing canonical Geometry
 * Scene -> V/H/W + 3D. Only genuine analytic stations and exact finite cap
 * face-pair straight segments and exact source-bounded analytic curves
 * reuse the canonical Geometry contract. Curves are never fake polylines. No second solver, player or engineering-line signature.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditC3CapBoundaryIncidence}=require('./c3-cap-boundary-incidence.cjs');
const {deriveGeometryScene,projectSelectionLinks}=
 require('../core/projection/geometry-scene-views.cjs');
const {project,toSheet,VIEWS}=require('../core/projection/conventions.js');
const finite=Number.isFinite;
const fail=s=>{throw new TypeError('C3 shared 3D/VHW Scene: '+s);};
const close=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=
  1e-8*Math.max(1,Math.abs(a),Math.abs(b));
const same3=(a,b)=>a&&b&&['x','y','z'].every(k=>close(a[k],b[k]));
const same2=(a,b)=>a&&b&&['u','v'].every(k=>close(a[k],b[k]));
const sameSheet=(a,b)=>a&&b&&close(a.x,b.x)&&close(a.y,b.y);
function buildC3LinkedGeometryScene({input,revision,compiled,viewTransforms}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    !compiled||compiled.schema!=='draftai-c3-finite-cylinder-point-v5/1'||
    compiled.revision!==revision||compiled.mathematicalSourceVerified!==true||
    compiled.singleOriginalV5Player!==true||
    compiled.standardVisibleHiddenLineStylesVerified!==false||
    compiled.wholeDrawingVerified!==false||
    compiled.canExportCertifiedDrawing!==false||
    !compiled.player?.canRender(revision))
  fail('requires current real M3 and original unsigned V5 session');
 if(!viewTransforms||!VIEWS.every(v=>viewTransforms[v]))
  fail('all three first-angle view transforms required');
 // Recheck the CURRENT authoritative specialist, not caller-provided scene
 // data. Validation also rejects edited input, stale revision and fake M3.
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 if(m3.status!=='scoped-analytic-ready'||m3.sourceConfirmed!==true||
    m3.geometryVerifiedWithinSpecialistScope!==true||
    m3.verifiedCapClipping!==true||
    m3.officialLineStylesVerified!==false||
    JSON.stringify(compiled.sourceM3)!==JSON.stringify(m3))
  fail('source M3 changed or substituted');
 const count=compiled.stationCountPerBranch;
 if(!Number.isSafeInteger(count)||count<0||count>2)
  fail('unsupported analytic station budget');
 const expected=[];
 for(const branch of m3.branches)
  for(const [j,e] of branch.endpoints.entries())
   expected.push({branchId:branch.id,role:j?'to':'from',point:e.point});
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder;
 for(const b of m3.branches)for(let k=1;k<=count;k++){
  const x=b.xRange[0]+(b.xRange[1]-b.xRange[0])*k/(count+1);
  const q=(Z.radius-Math.abs(x-Z.xCenter))*
   (Z.radius+Math.abs(x-Z.xCenter));
  const r=(Y.radius-Math.abs(x-Y.xCenter))*
   (Y.radius+Math.abs(x-Y.xCenter));
  if(!(q>0&&r>0))fail('interior analytic radical support lost');
  expected.push({branchId:b.id,role:'interior-'+k,point:{
   x,y:Z.yCenter+b.signY*Math.sqrt(q),
   z:Y.zCenter+b.signZ*Math.sqrt(r)}});
 }
 if(!Array.isArray(compiled.bindings)||
    compiled.bindings.length!==expected.length*3||
    compiled.signedEndpointPointActionCount!==m3.branches.length*6||
    compiled.verifiedInteriorStationCount!==m3.branches.length*count)
  fail('C3 source stations and V5 triple count differ');
 const actions=new Map(compiled.constructionSteps?.flatMap(s=>s.actions||[])
  .map(a=>[a.id,a]));
 const geometry=[],groups=[];
 for(const [i,station] of expected.entries()){
  const uv=project(station.point);
  const id='C3Station3D'+i, v5Ids={};
  for(const view of VIEWS){
   const b=compiled.bindings[3*i+VIEWS.indexOf(view)];
   const prefix=station.role.startsWith('interior-')?'C3Station':'C3Endpoint';
   const actionId=prefix+i+view+'Point';
   const a=actions.get(actionId);
   const at=toSheet(view,uv[view],viewTransforms[view]);
   if(!b||b.id!==actionId||b.view!==view||
      b.branchId!==station.branchId||b.endpointRole!==station.role||
      !same3(b.point3D,station.point)||
      !same2(b.projectedMm,uv[view])||!sameSheet(b.sheetPoint,at)||
      b.sourceBranchParameterX!==station.point.x||
      b.standardLineStyleVerified!==false||
      b.completeCurveVisibilityVerified!==false||
      a?.kind!=='point'||!sameSheet(a.geometry?.center,at))
    fail('three-view point is not one real M3 station and original V5 action');
   v5Ids[view]=actionId;
  }
  geometry.push({id,kind:'point',space:'model-3d',
   unit:'mm',data:{...station.point}});
  groups.push({geometryId:id,branchId:station.branchId,role:station.role,
   v5ActionIds:v5Ids,sourceMathVerified:true,
   certifiedEngineeringStroke:false});
 }
 // C3 analytic M3 branches are genuine 3D curves. Bind only where the
 // ORIGINAL V5 already has source-matched W curve action(s); a missing
 // guide never creates a substitute timeline. V/H analytic arcs may share
 // multiple real 3D branches, which must remain separate source objects.
 const wGuideRows=compiled.wAnalyticCurveGuides||[];
 const vhRows=compiled.projectedSeamArcGuides||[];
 let analyticCount=0;
 if(wGuideRows.length){
  for(const [i,branch] of m3.branches.entries()){
   const sorted=wGuideRows.filter(row=>row.branchId===branch.id)
    .sort((a,b)=>a.sourceXOpenRange[0]-b.sourceXOpenRange[0]);
   if(!sorted.length||sorted[0].sourceXOpenRange[0]!==branch.xRange[0]||
      sorted.at(-1).sourceXOpenRange[1]!==branch.xRange[1]||
      sorted.some((row,j)=>j&&
       row.sourceXOpenRange[0]!==sorted[j-1].sourceXOpenRange[1]))
    fail('analytic 3D curve source-to-V5 interval partition incomplete');
   const coords={
    x:{kind:'affine',offset:0,slope:1},
    y:{kind:'signed-circle-radical',center:Z.xCenter,
     offset:Z.yCenter,radius:Z.radius,sign:branch.signY},
    z:{kind:'signed-circle-radical',center:Y.xCenter,
     offset:Y.zCenter,radius:Y.radius,sign:branch.signZ}
   };
   const W=[];
   for(const row of sorted){
    const a=actions.get(row.id+'Shape');
    const target={parameter:{from:row.xRange[0],to:row.xRange[1]},
     u:coords.y,v:coords.z};
    if(row.sourceM3BranchVerified!==true||
       row.exactAnalyticSourceVerified!==true||
       row.officialStandardLineStyleVerified!==false||
       row.continuousSourceParameterV5GuideAuthorized!==true||
       a?.kind!=='analytic-curve'||
       JSON.stringify(a.geometry?.parameter)!==
        JSON.stringify(target.parameter)||
       JSON.stringify(a.geometry?.u)!==JSON.stringify(target.u)||
       JSON.stringify(a.geometry?.v)!==JSON.stringify(target.v))
      fail('analytic source curve no longer matches original W V5 action');
    W.push(row.id+'Shape');
   }
   const vh=view=>vhRows.filter(row=>
    row.view===view&&row.sourceBranchIds.includes(branch.id))
    .map(row=>{
     const a=actions.get(row.id+'Shape');
     if(row.officialStandardLineStyleVerified!==false||
        row.exactProjectedCircleArcVerified!==true||a?.kind!=='arc')
      fail('C3 shared projected analytic arc lacks trusted V5 source');
     return row.id+'Shape';
    });
   const id='C3Branch3D'+i;
   geometry.push({id,kind:'analytic-curve',space:'model-3d',unit:'mm',
    data:{parameter:{from:branch.xRange[0],to:branch.xRange[1]},
     coordinates:coords}});
   groups.push({geometryId:id,role:'analytic-lateral-intersection',
    branchId:branch.id,v5ActionIds:{V:vh('V'),H:vh('H'),W},
    sourceMathVerified:true,certifiedEngineeringStroke:false});
   analyticCount++;
  }
  if(wGuideRows.length!==groups.filter(g=>
     g.role==='analytic-lateral-intersection')
    .reduce((sum,g)=>sum+g.v5ActionIds.W.length,0))
   fail('3D branches failed to consume every original W curve action');
 }
 const cap=auditC3CapBoundaryIncidence({input,revision});
 if(!['scoped-analytic-cap-junction-incidence',
        'undetermined-unmatched-lateral-cap-junction'].includes(cap.status))
  fail('finite cap-pair mathematical source unavailable');
 const rows=compiled.capFacePairGuides;
 if(!Array.isArray(rows)||rows.length!==cap.capSegments.length*3)
  fail('cap source features and projected V5 actions differ');
 for(const [i,segment] of cap.capSegments.entries()){
  const projA=project(segment.from),projB=project(segment.to);
  const v5Ids={};
  for(const view of VIEWS){
   const row=rows[3*i+VIEWS.indexOf(view)];
   const a=actions.get(row?.actionId);
   const q=projA[view],t=projB[view];
   const collapsed=Math.hypot(q.u-t.u,q.v-t.v)<=1e-10;
   const transform=viewTransforms[view];
   const aSheet=toSheet(view,q,transform),bSheet=toSheet(view,t,transform);
   if(!row||row.view!==view||row.sourceFeatureId!==segment.id||
      row.sourceExactCapFacePairMathVerified!==true||
      row.officialStandardLineStyleVerified!==false||
      !same3(row.originalSegment3D?.from,segment.from)||
      !same3(row.originalSegment3D?.to,segment.to)||
      !same2(row.projectedModelMm?.from,q)||
      !same2(row.projectedModelMm?.to,t)||
      row.sourceProjectionCollapsedToPoint!==collapsed||
      a?.kind!==(collapsed?'point':'line')||
      (collapsed?!sameSheet(a.geometry?.center,aSheet):
       !sameSheet(a.geometry?.from,aSheet)||
       !sameSheet(a.geometry?.to,bSheet)))
    fail('cap source triple does not match one verified 3D segment and V5');
   v5Ids[view]=row.actionId;
  }
  const id='C3Cap3D'+i;
  geometry.push({id,kind:'segment',space:'model-3d',unit:'mm',
   data:{start:{...segment.from},end:{...segment.to}}});
  groups.push({geometryId:id,sourceFeatureId:segment.id,
   role:'finite-cap-pair-auxiliary',v5ActionIds:v5Ids,
   sourceMathVerified:true,certifiedEngineeringStroke:false});
 }
 // The shared Scene is a read-only projection of independently recomputed
 // geometry, NEVER a signed SolveResult or a certified V5 line-style.
 const scene=deriveGeometryScene({geometry,revision,
  resultId:'C3SpatialAuxiliaryEvidence'});
 const selected=projectSelectionLinks(scene);
 return Object.freeze({schema:'draftai-c3-3d-vhw-linked-scene/1',revision,
  status:analyticCount?
   'scoped-source-points-caps-and-analytic-curves':
   'scoped-source-points-and-cap-segments-only',
  scene,links:selected,groups:Object.freeze(groups.map(g=>Object.freeze(g))),
  spatialObjectCount:geometry.length,analyticCurveInScene:analyticCount>0,
  analyticCurveCount:analyticCount,
  entireCurveV5Ready:false,officialLineStylesVerified:false,
  createsSecondSolver:false,createsSecondPlayer:false});
}
module.exports={buildC3LinkedGeometryScene};
