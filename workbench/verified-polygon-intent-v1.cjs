'use strict';
/**
 * F2 / 02 -> 07. Verified, opt-in circle-inscribed triangle/hexagon
 * construction using the existing M3 analytic solver, canonical 2D
 * ConstructionIntent and the ONE existing V5 timeline and motion engine.
 *
 * Explicit reviewed inputs are not image/OCR proof. This adapter never
 * upgrades an unchosen orientation or a numerically unresolved answer.
 * Vertex marks and edges are real M3 outputs, NOT inferred from animation.
 */
const {regularPolygonInCircle}=require('../engines/planar/inscribed-regular-polygon.cjs');
const {CONSTRUCTION_INTENT_VERSION:VERSION,validateConstructionIntentDAG}=
 require('../core/contracts/construction-intent.js');
const {verifiedTeachingActionToV5}=require('./construction-step-v5-adapter.cjs');
const Timeline=require('./teaching-timeline-v5.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>p&&typeof p==='object'&&finite(p.x)&&finite(p.y);
const copy=p=>({x:p.x,y:p.y});
const blocked=(revision,reason,solverStatus='undetermined')=>({
 status:'not-verified',revision,reason,solverStatus,mathematicallyVerified:false,
 constructionIntents:[],steps:[],timing:null
});
function verifySource(s){
 if(s.status!=='ready'||s.verified!==true||s.solveResult?.status!=='unique'||
    s.solveResult.globallyUnique!==true||
    s.globallyUniqueWithinConfirmedInputs!==true||
    s.proofScope!=='selected-circle-and-orientation'||
    s.windingVerified!==true||s.constructionReady!==false||
    ![3,6].includes(s.sideCount)||s.vertices?.length!==s.sideCount||
    s.edges?.length!==s.sideCount||!finite(s.radiusMm)||
    !finite(s.relativeAreaError)||s.relativeAreaError>1e-8||
    !finite(s.maxResidualMm)||s.maxResidualMm>1e-8*s.radiusMm)
  return false;
 const n=s.sideCount,r=s.radiusMm;
 const chord=2*r*Math.sin(Math.PI/n);
 const expectedArea=n*r*r*Math.sin(2*Math.PI/n)/2;
 let doubleArea=0;
 for(let i=0;i<n;i++){
  const v=s.vertices[i],next=s.vertices[(i+1)%n],edge=s.edges[i];
  if(v.id!=='v'+(i+1)||next.id!=='v'+((i+1)%n+1)||
     edge.id!=='e'+(i+1)||edge.fromId!==v.id||edge.toId!==next.id||
     !point(v)||!point(next)||!finite(edge.lengthMm))return false;
  if(Math.abs(Math.hypot(v.x-s.center.x,v.y-s.center.y)-r)>1e-8*r||
     Math.abs(Math.hypot(v.x-next.x,v.y-next.y)-chord)>1e-8*r||
     Math.abs(edge.lengthMm-chord)>1e-8*r)return false;
  doubleArea+=(v.x-s.center.x)*(next.y-s.center.y)-
   (next.x-s.center.x)*(v.y-s.center.y);
 }
 const measured=Math.abs(doubleArea)/2;
 return Number.isFinite(measured)&&
  Math.abs(measured-expectedArea)<=1e-8*expectedArea&&
  (s.direction==='ccw'?doubleArea>0:doubleArea<0);
}
function verifiedPolygonIntentTimeline(input,sheet){
 if(!input||typeof input!=='object'||Array.isArray(input))
  throw new TypeError('reviewed polygon inputs required');
 const allowed=['unit','center','radiusMm','sideCount','firstVertexAngleDeg',
  'direction','revision','sourceConfirmed'];
 if(Object.keys(input).some(key=>!allowed.includes(key)))
  throw new TypeError('unknown polygon presentation field');
 const revision=input.revision;
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('nonnegative revision required');
 if(!sheet||!point(sheet.origin)||!finite(sheet.scale)||sheet.scale<=0)
  throw new TypeError('finite positive model-to-sheet mapping required');
 if(input.sourceConfirmed!==true)
  return blocked(revision,'source geometry and orientation not confirmed');
 // Pass ONLY M3's existing model-mm inputs, never caller-supplied claims of
 // proof, step geometry, pixels, area, status or correctness.
 const sourceInput={unit:input.unit,center:input.center,
  radiusMm:input.radiusMm,sideCount:input.sideCount,
  firstVertexAngleDeg:input.firstVertexAngleDeg,
  direction:input.direction,revision};
 const computed=regularPolygonInCircle(sourceInput);
 if(!verifySource(computed))
  return blocked(revision,computed.reason||'M3 polygon proof unavailable',
   computed.status);
 // A mathematically sound tiny feature need not be drawable at this sheet
 // resolution; never claim an invisible/subpixel V5 drawing is complete.
 const sheetRadius=computed.radiusMm*sheet.scale;
 if(!finite(sheetRadius)||sheetRadius<0.5||sheetRadius>1e7)
  return blocked(revision,'polygon under-resolved or overflowing in sheet-px');
 const solver='engines/planar/inscribed-regular-polygon';
 const evidence={solver,revision,unit:'mm',
  proofScope:computed.proofScope,proofLevel:'analytic',
  resultId:null,branchId:null,status:'unique',evidenceSource:solver};
 const intents=[];
 function add(id,purpose,role,inputs,operations){
  intents.push({schema:VERSION,id,purpose,role,
   dependsOn:intents.length?[intents.at(-1).id]:[],
   inputEntityIds:inputs,outputEntityIds:operations.map(op=>op.id),
   operations,source:{...evidence}});
 }
 add('polygon-circle','confirmed-circle-locus','given',[],[{
  id:'polygon-circle-entity',kind:'circle',coordinateSpace:'model-mm',
  geometry:{center:copy(computed.center),radius:computed.radiusMm}
 }]);
 for(let i=0;i<computed.sideCount;i++){
  const v=computed.vertices[i];
  add('polygon-vertex-'+(i+1),'analytic-vertex-on-confirmed-circle',
   'auxiliary',['polygon-circle-entity'],[{
    id:'polygon-point-'+(i+1),kind:'point',coordinateSpace:'model-mm',
    geometry:{at:copy(v)}
   }]);
 }
 for(let i=0;i<computed.sideCount;i++){
  const a=computed.vertices[i],b=computed.vertices[(i+1)%computed.sideCount];
  add('polygon-edge-'+(i+1),'analytic-verified-edge','result',
   ['polygon-point-'+(i+1),'polygon-point-'+((i+1)%computed.sideCount+1)],[{
    id:'polygon-segment-'+(i+1),kind:'line',coordinateSpace:'model-mm',
    geometry:{from:copy(a),to:copy(b)}
   }]);
 }
 const verdict=validateConstructionIntentDAG(intents);
 if(!verdict.ok)
  throw new TypeError('polygon Intent DAG invalid: '+verdict.errors.join('; '));
 const steps=intents.map(i=>({
  id:i.id,dependsOn:[...i.dependsOn],
  title:i.purpose,explanation:i.purpose,role:i.role,
  actions:i.operations.map(op=>verifiedTeachingActionToV5({
   id:op.id,kind:op.kind,coordinateSpace:op.coordinateSpace,...op.geometry
  },sheet))
 }));
 const timing=Timeline.compileTimeline(steps);
 return {status:'ready',revision,schema:VERSION,constructionIntents:intents,
  steps,timing,mathematicallyVerified:true,canonicalVerified:true,
  selectedBranchId:null,proofScope:computed.proofScope,
  sourceConfirmation:'caller-reviewed-parameters',
  solverResult:computed.solveResult,
  modelVertices:computed.vertices.map(v=>({...v})),
  modelEdges:computed.edges.map(e=>({...e})),
  // This is opt-in verified playback data, not an OCR/browser deployment.
  publicWorkbenchConnected:false};
}
module.exports={verifiedPolygonIntentTimeline};
