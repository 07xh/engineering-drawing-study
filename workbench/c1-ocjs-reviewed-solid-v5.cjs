'use strict';
/**
 * Opt-in C1 runtime consumer: REAL OpenCascade.js HLR projected strokes are
 * an indispensable geometric input, while authoritative topology / real 3D
 * source / continuous ray / GB line style stays with existing M0-M5.
 *
 * Without actual OCJS computed geometry (or with disagreement) this entry
 * fails closed. The original compileReviewedSolidVertexV5 remains unchanged
 * as the safe fallback and sole ConstructionIntent->DAG->V5 source.
 */
const {compileReviewedSolidVertexV5}=
 require('./reviewed-solid-vertex-v5.cjs');
const {computeC1OcjsVisibleSegments}=
 require('../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const {VIEWS}=require('../core/projection/conventions.js');
function intervalCoverage(a,b,segments,tol=1e-6){
 const dx=b.u-a.u,dy=b.v-a.v,den=dx*dx+dy*dy,len=Math.sqrt(den);
 if(!(len>1e-9))return false;
 const spans=[];
 const coordinate=p=>{
  const cross=dx*(p.v-a.v)-dy*(p.u-a.u);
  if(Math.abs(cross)>tol*len)return null;
  return ((p.u-a.u)*dx+(p.v-a.v)*dy)/den;
 };
 for(const s of segments){
  const x=coordinate(s.from),y=coordinate(s.to);
  if(x===null||y===null)continue;
  const [lo,hi]=[x,y].sort((a,b)=>a-b);
  if(lo>1+tol||hi< -tol)continue;
  spans.push([Math.max(0,lo),Math.min(1,hi)]);
 }
 spans.sort((a,b)=>a[0]-b[0]);
 let cursor=0;
 for(const [lo,hi] of spans){
  if(lo>cursor+tol)return false;
  cursor=Math.max(cursor,hi);
 }
 return cursor>=1-tol;
}
function compileC1WithOcjsHLR({input,sheetTransform,oc}={}){
 if(!oc||typeof oc!=='object')
  throw new TypeError('initialized real OpenCascade.js kernel required');
 // Recompute ORIGINAL source and M0–M5/V5 once, then reconcile the independent
 // B-Rep HLR in the same revision. Caller cannot supply verification booleans.
 const canonical=compileReviewedSolidVertexV5({input,sheetTransform});
 const g=canonical.sceneResult.geometry,rev=canonical.revision;
 const cad=computeC1OcjsVisibleSegments({oc,geometry:g,revision:rev});
 if(cad.revision!==rev||cad.sourceGeometryId!==g.id||
    !canonical.globalVisibleContourProof.allThreeViewsGlobalContourCertified||
    !canonical.verifiedLineIntentAndOriginalSingleV5Parity||
    canonical.wholeSolidV5Ready!==false||
    cad.lineStyleCertified!==false||cad.v5Authorized!==false)
  throw new RangeError('current authoritative C1 scoped M5/V5 not available');
 const resolved=canonical.certifiedVisibleContourLineBindings;
 const out={};
 for(const view of VIEWS){
  const signed=resolved.filter(x=>x.view===view),
   generated=cad.views[view];
  if(signed.length<3||!Array.isArray(generated)||generated.length<3)
   throw new RangeError('complete original signed V/H/W contour absent');
  for(const bind of signed){
   if(bind.revision!==rev||bind.sourceGeometryId!==g.id||
      bind.signedFormalLineV5!==true||
      bind.standardLineStyle!=='gb-t-4457.4-continuous-wide-visible-outline')
    throw new RangeError('unsigned M5 source cannot be promoted');
   const genuine=generated.filter(x=>
    x.projectedOriginalEdgeCandidates.includes(bind.sourceEdgeId));
   if(!intervalCoverage(bind.fromModelMm,bind.toModelMm,genuine))
    throw new RangeError('actual OCJS HLR does not cover certified C1 source '+bind.actionId);
  }
  // The CAD engine must also not supply an extra or uncovered visible
  // geometry line while the certified V5 omits it in this narrow box scope.
  for(const seg of generated){
   if(!intervalCoverage(seg.from,seg.to,signed.map(b=>({
    from:b.fromModelMm,to:b.toModelMm
   }))))throw new RangeError('unreconciled actual C1 OCJS visible edge');
  }
  out[view]={cadVisibleSegments:generated.length,
   m5SignedVisibleIntervals:signed.length,sourceAndCoverageAgreement:true};
 }
 return Object.freeze({...canonical,
  c1CadRuntime:{
   schema:'draftai-c1-ocjs-m5-gated-runtime/1',
   compute:'real OpenCascade.js HLR visible B-Rep geometry',
   engine:'opencascade.js',revision:rev,geometryId:g.id,
   supportedScope:'confirmed-axis-aligned-cuboid',
   perView:out,sourceIdsMappedByExistingM5:true,
   independentCadComputedSegments:cad,
   // The old proof remains the ONLY formal certification authority.
   newOfficialLineStyleSigner:false,secondV5:false
  }});
}
module.exports={compileC1WithOcjsHLR,intervalCoverage};
