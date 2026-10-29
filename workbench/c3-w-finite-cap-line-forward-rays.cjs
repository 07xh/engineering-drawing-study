'use strict';
/**
 * Independent first-angle W (+X) strict-volume ray and projection
 * certification for ALL genuine finite-cylinder source CAP face-pair lines.
 *
 * Pair families:
 *  Z cap / Y lateral: source x is constant, z is EXACT Z cap plane.
 *   Z strict interior along +X is empty. Y cylinder has open strict
 *   interior t in (0,2*(Y.xCenter-x)) iff x<Y.xCenter and y is in
 *   its open axial slab. These are valid for EVERY open line point.
 *
 *  Y cap / Z lateral: analogous, with Z source radial and Y cap plane.
 *
 *  Z cap / Y cap: y,z are BOTH fixed cap values. The line runs along X
 *   and collapses to a SINGLE W(y,z) paper point. Both cylinders have
 *   empty STRICT W-ray interiors at their cap planes. This cannot be a
 *   positive W drawing stroke.
 *
 * For UNION the other lateral source may contribute strict volume ahead.
 * For INTERSECTION no cap-source open line has strict interior ahead
 * because one of its source cylinders remains on an axial cap PLANE for
 * every W-ray parameter. The resulting independent witness is cross-
 * checked against current selected Boolean M5 rays and 3D M4 source
 * graph identity, not any existing solver-supplied expected result.
 *
 * Cap face plane contact is not strict volume. Hence the result does
 * NOT prove global occlusion, boundary-on-boundary surface masking,
 * closed junctions, finished GB line styles or authorized V5.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditC3CapBoundaryIncidence}=
 require('./c3-cap-boundary-incidence.cjs');
const {auditC3Merged3DSourceGraph}=
 require('./c3-merged-3d-source-graph.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS,project}=
 require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC3WFiniteCapLineForwardRays({input,revision,selectedRayEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    selectedRayEvidence?.schema!=='draftai-c3-boolean-VHW-open-rays/1'||
    selectedRayEvidence.revision!==revision||
    selectedRayEvidence.officialLineStylesVerified!==false||
    selectedRayEvidence.finalV5CurveAuthorized!==false)
  throw new TypeError('current unsigned selected finite C3 source rays required');
 const op=selectedRayEvidence.solidOperation;
 const blocked=reason=>freeze({schema:'draftai-c3-w-finite-cap-line-forward-rays/1',
  revision,solidOperation:op,status:'not-covered',reason,
  lineSourceRays:[],capLateralSourceCount:0,capCapWCollapsedSourceCount:0,
  strictlyOpaqueLineCount:0,strictlyClearLineCount:0,
  allPhysicalCapSourceLinesIndependentlyVerified:false,
  allProjectedCapLinesHavePositiveWLength:false,
  allCompositeSourceDepthAndSurfaceContactsProven:false,
  closedJunctionsAndLineStylesCertified:false,
  officialLineStylesVerified:false,officialV5Authorized:false});
 if(selectedRayEvidence.fullSourceOpenEdgeRayCoverageVerified!==true){
  if(selectedRayEvidence.intervals?.length)
   throw new RangeError('partially selected C3 source rays cannot certify W cap lines');
  return blocked('explicit complete finite Boolean source rays not available');
 }
 if(!['intersection','union'].includes(op)||
    selectedRayEvidence.undeterminedCount!==0||
    !Array.isArray(selectedRayEvidence.intervals))
  throw new RangeError('complete selected intersection or union Boolean rays required');
 const observer=FIRST_ANGLE_OBSERVER_RAYS.W;
 if(observer.x!==1||observer.y!==0||observer.z!==0||
    project({x:7,y:5,z:3}).W.u!==5||
    project({x:7,y:5,z:3}).W.v!==3)
  throw new RangeError('first-angle W cap source projection and direction changed');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 const cap=auditC3CapBoundaryIncidence({input,revision});
 const graph=auditC3Merged3DSourceGraph({input,revision});
 if(m3.status!=='scoped-analytic-ready'||m3.sourceConfirmed!==true||
    m3.verifiedCapClipping!==true||
    m3.analyticallyCompleteWithinScope!==true||
    !['scoped-analytic-cap-junction-incidence',
      'undetermined-unmatched-lateral-cap-junction'].includes(cap.status)||
    cap.capSourceStatus!=='scoped-analytic-cap-boundary-pairs'||
    !graph.allLateralBranchesAndCapSegmentsCovered)
  return blocked('real current M3 cap-face pair and 3D original source graph unavailable');
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder;
 const physical=new Map(cap.capSegments.map(s=>[s.id,s]));
 const graphLines=graph.edges.filter(e=>e.kind==='line');
 const lineMap=new Map(graphLines.map(e=>[e.sourceId,e]));
 const selected=selectedRayEvidence.intervals.filter(e=>e.view==='W'&&e.sourceKind==='line');
 if(physical.size!==cap.capSegments.length||
    lineMap.size!==graphLines.length||
    lineMap.size!==physical.size||
    selected.length!==physical.size||physical.size>128)
  throw new RangeError('incomplete genuine original cap-source W graph and selected ray inventory');
 const seen=new Set(),rows=[];
 for(const segment of cap.capSegments){
  const edge=lineMap.get(segment.id);
  const ray=selected.find(e=>e.sourceId===segment.id);
  if(seen.has(segment.id)||!edge||!ray||ray.edgeId!==edge.id||
     ray.parameterKind!=='cap-source-unit-interval'||
     !Array.isArray(ray.openParameterRange)||
     !Array.isArray(edge.sourceRange)||
     ray.openParameterRange.length!==2||
     edge.sourceRange.length!==2||
     ray.openParameterRange.some((v,i)=>v!==edge.sourceRange[i])||
     ray.sourceFirstAngleRayEntireIntervalProven!==true||
     ray.standardLineStyle!=='undetermined'||
     ray.finalV5StrokeAuthorized!==false||
     segment.officialLineStyle!=='undetermined'||
     segment.v5OfficialCurveAuthorized!==false||
     segment.continuousSegmentCertifiedByDiskConvexity!==true||
     segment.sourcePairImplicitAndAxialConstraintsVerified!==true)
   throw new RangeError('C3 W native finite cap-source M3/M5 line identity or source interval mismatch');
  seen.add(segment.id);
  const from=segment.from,to=segment.to;
  if(!from||!to||!['x','y','z'].every(k=>
     Number.isFinite(from[k])&&Number.isFinite(to[k])))
   throw new RangeError('invalid original finite cap 3D source endpoints');
  const zFace=segment.sourceFaces.filter(f=>f.startsWith('zCylinder.'));
  const yFace=segment.sourceFaces.filter(f=>f.startsWith('yCylinder.'));
  if(zFace.length!==1||yFace.length!==1)
   throw new RangeError('incomplete original C3 cap-face pair identities');
  const zCap=zFace[0].startsWith('zCylinder.cap.');
  const yCap=yFace[0].startsWith('yCylinder.cap.');
  if(!zCap&&!yCap||!zCap&&zFace[0]!=='zCylinder.lateral'||
     !yCap&&yFace[0]!=='yCylinder.lateral')
   throw new RangeError('unknown source cap/lateral surface pair');
  const bothCaps=zCap&&yCap;
  const fromW=project(from).W,toW=project(to).W;
  const collapsed=fromW.u===toW.u&&fromW.v===toW.v;
  const constantX=from.x===to.x;
  // A cap/lateral generator has x fixed, the other source axial
  // coordinate linearly varies over its VALID OPEN slab. A cap/cap pair
  // runs only in x, so it is a projected point in W, not a stroke.
  const lineAxis=bothCaps?'x':zCap?'y':'z';
  if(segment.sourceFreeCoordinate!==lineAxis||
     (bothCaps?(!collapsed||constantX):(!constantX||collapsed))||
     !(to[lineAxis]!==from[lineAxis]))
   throw new RangeError('C3 cap source projected to wrong W dimension or free source axis');
  const strictAxial=bothCaps?false:zCap?
   [from.y,to.y].every(v=>v>=Y.yMin&&v<=Y.yMax):
   [from.z,to.z].every(v=>v>=Z.zMin&&v<=Z.zMax);
  // On the CAP plane of a cylinder an observer ray parallel to +X
  // cannot enter that cylinder's strict volume anywhere along the ray.
  // The OTHER lateral cylinder has strict radial interior at +t iff x
  // is on its back half AND its axial cap slab is open on this line.
  const radialId=bothCaps?null:zCap?'yCylinder':'zCylinder';
  const axialCenter=radialId==='yCylinder'?Y.xCenter:
   radialId==='zCylinder'?Z.xCenter:null;
  const inward=radialId!==null&&constantX&&strictAxial&&
   from.x<axialCenter;
  const expected=op==='union'&&inward?
   'opaque-interior-ahead':'strict-interior-ray-clear';
  const zSign=zCap?0:from.x<Z.xCenter?-1:from.x>Z.xCenter?1:0;
  const ySign=yCap?0:from.x<Y.xCenter?-1:from.x>Y.xCenter?1:0;
  if(ray.openInteriorVolumeRayStatus!==expected||
     ray.zCylinderOutwardRaySign!==zSign||
     ray.yCylinderOutwardRaySign!==ySign)
   throw new RangeError('C3 native cap-plane source ray contradicts independent finite cylinder quadratic');
  const firstExit=op==='union'&&inward?2*axialCenter-from.x:null;
  if(firstExit!==null&&(!(firstExit>from.x)||
      !Number.isFinite(firstExit)))
   throw new RangeError('C3 finite cap-source ray first exit is not strictly ahead');
  rows.push({sourceCapFeatureId:segment.id,sourceM4EdgeId:edge.id,
   sourceFacePairKinds:[zFace[0],yFace[0]],
   sourceType:bothCaps?'cap-cap-collapsed-W-point':
    'cap-lateral-positive-W-source-line',
   original3DFrom:{...from},original3DTo:{...to},
   originalSourceUnitOpenRange:[...edge.sourceRange],
   originalWProjectedFrom:{...fromW},originalWProjectedTo:{...toW},
   WProjectionCollapsedToSinglePaperPoint:collapsed,
   originalSourceAxialCapStrictInteriorThroughoutOpenLine:strictAxial,
   finiteCapPlaneNeverHasStrictWInterior:true,
   oppositeLateralSourceId:radialId,
   independentlyDerivedSelectedBooleanRayStatus:expected,
   independentFirstAngleWSourceRayMatched:true,
   strictOpaqueAhead:expected==='opaque-interior-ahead',
   positiveRayParameterOpenRange:firstExit===null?null:
    [0,2*(axialCenter-from.x)],
   frontExitOriginal3DX:firstExit,
   allOtherProjectedCapAndCompositeFaceOcclusionProven:false,
   closedSourceCapTerminalVisibilityVerified:false,
   engineeringLineStyle:'undetermined',v5ActionAuthorized:false});
 }
 const opaque=rows.filter(x=>x.strictOpaqueAhead).length;
 return freeze({schema:'draftai-c3-w-finite-cap-line-forward-rays/1',
  revision,solidOperation:op,
  status:'scoped-all-real-W-cap-source-open-rays',
  lineSourceRays:rows,
  capLateralSourceCount:rows.filter(x=>!x.WProjectionCollapsedToSinglePaperPoint).length,
  capCapWCollapsedSourceCount:rows.filter(x=>x.WProjectionCollapsedToSinglePaperPoint).length,
  strictlyOpaqueLineCount:opaque,strictlyClearLineCount:rows.length-opaque,
  allPhysicalCapSourceLinesIndependentlyVerified:rows.length===cap.capSegments.length,
  allProjectedCapLinesHavePositiveWLength:
   rows.every(x=>!x.WProjectionCollapsedToSinglePaperPoint),
  allCompositeSourceDepthAndSurfaceContactsProven:false,
  closedJunctionsAndLineStylesCertified:false,
  officialLineStylesVerified:false,officialV5Authorized:false});
}
module.exports={auditC3WFiniteCapLineForwardRays};
