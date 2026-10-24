'use strict';
/**
 * M5 source-identity JOIN for the existing lateral/lateral M3 graph and the
 * independently enumerated finite end-cap face-pair M3 segments. Keeps
 * geometrically coincident 3D source vertices distinct from coincident
 * 2D V/H/W projected positions. This is still NOT an engineering stroke gate.
 */
const {evaluateFiniteCylinderCapBoundaryPairs}=
 require('../engines/spatial/intersections/finite-cylinder-cap-boundary-pairs.cjs');
const {auditFiniteCylinderEndpointIncidence}=
 require('./m5-analytic-cylinder-endpoint-incidence.cjs');
const {project}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const t of Object.values(x))freeze(t);Object.freeze(x);
}return x;};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function auditC3CapBoundaryIncidence({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current reviewed cap-boundary source revision required');
 const cap=evaluateFiniteCylinderCapBoundaryPairs({input,revision});
 const empty=(reason)=>freeze({schema:'draftai-c3-cap-boundary-incidence/1',
  revision,status:'not-covered',reason,capSourceStatus:cap.status,
  capSegments:[],capJunctions:[],sourceLateralCapTerminalCount:0,
  joinedLateralCapTerminalCount:0,unmatchedLateralCapTerminalIds:[],
  fullCompositeBoundaryTopologyVerified:false,
  standardLineStylesVerified:false,finalV5CurveAuthorized:false});
 if(cap.status!=='scoped-analytic-cap-boundary-pairs'||
    !cap.capRelatedBoundaryPairsCompleteWithinScope||
    !cap.allEndpointsOnSourceFacesVerified)
  return empty('M3 cap face pair topology unsupported');
 const lateral=auditFiniteCylinderEndpointIncidence({input,revision});
 const modelCovered=lateral.status==='scoped-analytic-3d-endpoint-incidence';
 const tol=1e-8*Math.max(1,input.zCylinder.radius,input.yCylinder.radius);
 const groups=[];
 for(const s of cap.segments){
  for(const [end,p] of [['from',s.from],['to',s.to]]){
   let row=groups.find(g=>distance(p,g.point3D)<=tol);
   if(!row){
    row={id:'capJunction'+groups.length,point3D:{...p},
     incidentCapSegmentEnds:[],sourceLateralJunctionIds:[]};
    groups.push(row);
   }
   row.incidentCapSegmentEnds.push({segmentId:s.id,role:end,
    pairKind:s.pairKind,sourceFaces:[...s.sourceFaces]});
  }
 }
 const capTerminals=modelCovered?lateral.junctions.filter(j=>
  j.finiteCapTermination===true):[];
 const unmatched=[];
 for(const j of capTerminals){
  const found=groups.filter(g=>distance(j.point3D,g.point3D)<=tol);
  if(found.length!==1){unmatched.push(j.id);continue;}
  found[0].sourceLateralJunctionIds.push(j.id);
 }
 // A single grouped cap feature must not merge two DISTINCT physical
 // junctions just because they project to the same paper coordinates.
 if(groups.some(g=>g.sourceLateralJunctionIds.length>1))
  throw new RangeError('cap segment endpoint grouped different lateral junctions');
 const vertices=groups.map(g=>{
  const projected=project(g.point3D);
  return {id:g.id,point3D:{...g.point3D},
   projections:projected,
   incidentCapSegmentEnds:g.incidentCapSegmentEnds,
   sourceLateralJunctionIds:g.sourceLateralJunctionIds,
   capSourceIdentityWithinToleranceVerified:true,
   lateralCapTerminationSourceIdentityVerified:
    g.sourceLateralJunctionIds.length===1,
   entire3DSurfaceGraphJoinVerified:false,
   officialLineStyle:'undetermined',v5CurveActionAuthorized:false};
 });
 const allMatched=modelCovered&&unmatched.length===0;
 return freeze({schema:'draftai-c3-cap-boundary-incidence/1',revision,
  status:modelCovered?(allMatched?
   'scoped-analytic-cap-junction-incidence':
   'undetermined-unmatched-lateral-cap-junction'):
   'scoped-cap-pairs-without-lateral-source',
  capSourceStatus:cap.status,
  sourceM3LateralJunctionStatus:lateral.status,
  capSegments:cap.segments,
  capJunctions:vertices,
  capPairSourceSegmentCount:cap.segments.length,
  sourceLateralCapTerminalCount:capTerminals.length,
  joinedLateralCapTerminalCount:capTerminals.length-unmatched.length,
  unmatchedLateralCapTerminalIds:unmatched,
  allLateralCapTerminalsIdentifiedWithinSourceScope:allMatched,
  source3DFeatureCoincidenceUsedInsteadOfProjected2DPosition:true,
  sourceCapDiskPairingVerified:true,
  fullCompositeBoundaryTopologyVerified:false,
  standardLineStylesVerified:false,finalV5CurveAuthorized:false});
}
module.exports={auditC3CapBoundaryIncidence};
