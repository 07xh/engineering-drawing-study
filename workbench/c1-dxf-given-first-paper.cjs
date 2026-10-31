'use strict';
/**
 * C1 original-first paper contract: render ONLY coordinates supplied by
 * authenticated local GIVEN packet. Never derive any missing-view paper
 * geometry from inferred M3, a reference answer or a V5 preview.
 *
 * Original DXF packet contains endpoint point clouds, not authenticated
 * strokes; circles are source-point evidence, NEVER engineering lines.
 */
const {validateGivenPacket}=
 require('./c1-authenticated-dxf-to-reviewed-v5.cjs');
const {VIEWS,toSheet}=require('../core/projection/conventions.js');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))freeze(v);
  Object.freeze(o);
 }
 return o;
};
function buildC1DxfGivenFirstPaper(packet){
 validateGivenPacket(packet);
 // One identical first-angle paper origin and scale for all three views.
 // The missing view is excluded from scale calculation by construction.
 const originals=Object.values(packet.views).flat();
 const extent=Math.max(1,...originals.flatMap(p=>[Math.abs(p.u),Math.abs(p.v)]));
 const transform={origin:{x:390,y:290},scale:Math.min(5,215/extent)};
 const views={};
 for(const view of VIEWS){
  const supplied=Object.hasOwn(packet.views,view);
  views[view]={
   view,
   state:supplied?'original-given-only':'intentionally-blank-missing-view',
   sourceRole:supplied?'GIVEN':'UNKNOWN',
   points:supplied?packet.views[view].map((uv,index)=>({
    index,uv:{...uv},paper:toSheet(view,uv,transform),
    originalCADSourceHandle:packet.givenOriginalHandleEndpoints[view][index].handle,
    originalCADSourceEndpoint:packet.givenOriginalHandleEndpoints[view][index].endpoint
   })):[]
  };
 }
 return freeze({
  schema:'draftai-c1-private-dxf-given-first-original-paper/1',
  knownViewPair:Object.keys(packet.views).sort(),
  missingView:packet.missingView,
  transform,views,
  candidateGeometryAvailable:false,
  recoveredMissingPaperPoints:0,
  derived3DEdges:0,
  originalPointCloudIsNotOriginalDXFStrokeTopology:true,
  missingViewMustRemainBlankUntilExplicitUserReview:true,
  generated2DHLREdgeHistoryCertified:false,
  formalEngineeringLinesCertified:false,
  officialV5Authorized:false
 });
}
module.exports={buildC1DxfGivenFirstPaper};
