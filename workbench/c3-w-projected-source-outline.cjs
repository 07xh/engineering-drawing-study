'use strict';
/**
 * C3 W first-angle finite-cylinder source-outline crossing theorem.
 *
 * W=(y,z), observer +x. The orthographic projection of each finite
 * axis-aligned cylinder is a CLOSED RECTANGLE in the yz plane:
 *  Z cylinder: y=Yz±Rz silhouette, z=zMin/zMax cap edges.
 *  Y cylinder: z=Zy±Ry silhouette, y=yMin/yMax cap edges.
 * Thus every source outline boundary lies on a constant-y or constant-z
 * straight segment. On an M3 lateral/lateral branch, y(x) and z(x) obey
 * two positive-radius circular equations. At a FIXED y or z value,
 * the equation admits at most TWO x roots; an analytic branch therefore
 * cannot coincide with any source outline for a nonzero x interval.
 *
 * Enumerate all true branch contacts with those eight source lines.
 * Verify that each falls at an existing C3 W partition boundary; an
 * internal contact refuses the certificate (no guessed line-style cuts).
 * This is NOT proof of cap/lateral 3D topology, depth and official style.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditC3JointTopologyVisibility}=require('./c3-joint-topology-visibility.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS,project}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const a of Object.values(x))freeze(a);Object.freeze(x);
}return x;};
function auditC3WProjectedSourceEdges({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current reviewed model revision required');
 const source=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 const notCovered=()=>freeze({schema:'draftai-c3-w-source-outline/1',
  revision,status:'not-covered',events:[],sourceOutlineOpenOverlapExcluded:false,
  everyProjectedEventAtExistingWPartitionBoundary:false,
  officialLineStylesVerified:false,continuousCurveV5Ready:false});
 if(source.status!=='scoped-analytic-ready'||
    source.sourceConfirmed!==true||
    source.geometryVerifiedWithinSpecialistScope!==true||
    source.analyticallyCompleteWithinScope!==true||
    source.verifiedCapClipping!==true)return notCovered();
 const W=FIRST_ANGLE_OBSERVER_RAYS.W;
 const originProjection=project({x:1,y:2,z:3}).W;
 if(W.x!==1||W.y!==0||W.z!==0||
    originProjection.u!==2||originProjection.v!==3)
  throw new RangeError('C3 W first-angle projection convention changed');
 const joint=auditC3JointTopologyVisibility({input,revision});
 if(joint.status!=='scoped-open-interval-joint-evidence'||
    joint.sourceBranchCount!==source.branchCount)
  throw new RangeError('current C3 W M3/M5 source identity mismatch');
 const Z=source.source.zCylinder,Y=source.source.yCylinder;
 const tol=1e-8*Math.max(1,Z.radius,Y.radius,
   Math.abs(Z.xCenter),Math.abs(Y.xCenter),
   Math.abs(Z.yCenter),Math.abs(Y.zCenter),
   Math.abs(Z.zMin),Math.abs(Z.zMax),
   Math.abs(Y.yMin),Math.abs(Y.yMax));
 const specs=[
  {id:'z-silhouette-minus',solid:'zCylinder',kind:'silhouette',coordinate:'y',value:Z.yCenter-Z.radius},
  {id:'z-silhouette-plus',solid:'zCylinder',kind:'silhouette',coordinate:'y',value:Z.yCenter+Z.radius},
  {id:'z-cap-low',solid:'zCylinder',kind:'finite-cap-edge',coordinate:'z',value:Z.zMin},
  {id:'z-cap-high',solid:'zCylinder',kind:'finite-cap-edge',coordinate:'z',value:Z.zMax},
  {id:'y-silhouette-minus',solid:'yCylinder',kind:'silhouette',coordinate:'z',value:Y.zCenter-Y.radius},
  {id:'y-silhouette-plus',solid:'yCylinder',kind:'silhouette',coordinate:'z',value:Y.zCenter+Y.radius},
  {id:'y-cap-low',solid:'yCylinder',kind:'finite-cap-edge',coordinate:'y',value:Y.yMin},
  {id:'y-cap-high',solid:'yCylinder',kind:'finite-cap-edge',coordinate:'y',value:Y.yMax}
 ];
 const rootsFor=spec=>{
  const vertical=spec.coordinate==='y';
  const c=vertical?Z:Y,axis=vertical?Z.yCenter:Y.zCenter;
  const d=spec.value-axis;
  if(Math.abs(d)>c.radius)return [];
  const t=Math.sqrt(Math.max(0,
   (c.radius-Math.abs(d))*(c.radius+Math.abs(d))));
  const roots=[c.xCenter-t,c.xCenter+t];
  return [...new Set(roots)];
 };
 function pointAt(b,x){
  const yy=(Z.radius-Math.abs(x-Z.xCenter))*
   (Z.radius+Math.abs(x-Z.xCenter));
  const zz=(Y.radius-Math.abs(x-Y.xCenter))*
   (Y.radius+Math.abs(x-Y.xCenter));
  if(yy< -tol||zz< -tol)return null;
  return {x,y:Z.yCenter+b.signY*Math.sqrt(Math.max(0,yy)),
   z:Y.zCenter+b.signZ*Math.sqrt(Math.max(0,zz))};
 }
 const events=[];
 for(const b of source.branches){
  const parts=joint.intervals.filter(i=>i.view==='W'&&i.branchId===b.id);
  if(!parts.length||parts[0].xOpenRange[0]!==b.xRange[0]||
     parts.at(-1).xOpenRange[1]!==b.xRange[1]||
     parts.some((p,i)=>i>0&&
      p.xOpenRange[0]!==parts[i-1].xOpenRange[1]))
   throw new RangeError('source W branch missing complete partition');
  for(const spec of specs)for(const rawX of rootsFor(spec)){
   if(rawX<b.xRange[0]-tol||rawX>b.xRange[1]+tol)continue;
   const x=Math.max(b.xRange[0],Math.min(b.xRange[1],rawX));
   const p=pointAt(b,x);
   if(!p||Math.abs(p[spec.coordinate]-spec.value)>tol||
      p.y<Y.yMin-tol||p.y>Y.yMax+tol||
      p.z<Z.zMin-tol||p.z>Z.zMax+tol)continue;
   const boundary=parts.some(row=>
    Math.abs(x-row.xOpenRange[0])<=tol||
    Math.abs(x-row.xOpenRange[1])<=tol);
   events.push({id:spec.id,sourceSolid:spec.solid,
    sourceFeatureKind:spec.kind,sourceBranchId:b.id,
    x,point3D:p,projectedW:project(p).W,
    sourceLineCoordinate:spec.coordinate,
    sourceLineValue:spec.value,
    existingWPartitionBoundaryVerified:boundary,
    exactSurfaceEventWithinFloatingTolerance:true,
    officialLineStyle:'undetermined',
    v5CurveActionAuthorized:false});
  }
 }
 const atBoundaries=events.every(e=>e.existingWPartitionBoundaryVerified);
 return freeze({schema:'draftai-c3-w-source-outline/1',revision,
  status:atBoundaries?'scoped-analytic-source-outline-event-partition':
   'undetermined-unpartitioned-source-outline-event',
  originalM3BranchCount:source.branchCount,
  eventCount:events.length,events,
  sourceOutlineTypes:['z-and-y-cylinder-W-silhouettes',
    'z-and-y-cylinder-finite-cap-boundaries'],
  projectedSourceOutlinesHaveOnlyCoordinateConstantEdges:true,
  sourceOutlineOpenOverlapExcluded:true,
  everyProjectedEventAtExistingWPartitionBoundary:atBoundaries,
  allOtherFeatureAndIntersectionTopologyVerified:false,
  officialLineStylesVerified:false,continuousCurveV5Ready:false});
}
module.exports={auditC3WProjectedSourceEdges};
