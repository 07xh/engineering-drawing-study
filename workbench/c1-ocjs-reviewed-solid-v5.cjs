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
// Conservative positive-length intersection test: CAD-visible interior creases
// must not be treated as false exterior hull omissions. A visible CAD segment
// that actually intersects a signed hull stroke needs authentic source IDs;
// unrelated visible interior lines remain unsigned M5 candidates.
function positiveCollinearOverlap(a,b,c,d,tol=1e-6){
 const dx=b.u-a.u,dy=b.v-a.v,L=Math.hypot(dx,dy);
 if(!(L>1e-9))return false;
 const lineError=p=>Math.abs(dx*(p.v-a.v)-dy*(p.u-a.u))/L;
 if(lineError(c)>tol||lineError(d)>tol)return false;
 const fraction=p=>((p.u-a.u)*dx+(p.v-a.v)*dy)/(L*L);
 const [lo,hi]=[fraction(c),fraction(d)].sort((x,y)=>x-y);
 return Math.min(1,hi)-Math.max(0,lo)>tol/Math.max(1,L);
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
  throw new RangeError('current authoritative C1 scoped M5/V5 not available: '+
   canonical.globalVisibleContourProof.views.map(v=>v.view+':'+
    v.allContourLinesVerified+'/'+v.blockedAtomicIntervalCount).join(',')+
   '; canonicalV5='+canonical.verifiedLineIntentAndOriginalSingleV5Parity);
 const resolved=canonical.certifiedVisibleContourLineBindings;
 const out={};
 for(const view of VIEWS){
  const signed=resolved.filter(x=>x.view===view),
   generated=cad.views[view];
  let unsignedInteriorCadLines=0;
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
  // Source-aware *reverse* coverage on the SIGNED contour only. The CAD
  // engine can rightly see other physical creases on an oblique convex
  // surface: those remain undetermined, NEVER minted as V5 strokes.
  for(const seg of generated){
   const overlapping=signed.filter(bind=>positiveCollinearOverlap(
    bind.fromModelMm,bind.toModelMm,seg.from,seg.to));
   if(!overlapping.length){
    unsignedInteriorCadLines++;
    continue;
   }
   // Projected overlap alone can alias front and rear 3D sources. Only
   // canonical M5 may prove which ORIGINAL source generated an action.
   const matching=overlapping.filter(bind=>
    seg.projectedOriginalEdgeCandidates.includes(bind.sourceEdgeId));
   if(!matching.length||!intervalCoverage(seg.from,seg.to,
     matching.map(b=>({from:b.fromModelMm,to:b.toModelMm}))))
    throw new RangeError('real C1 HLR projected alias disagrees with signed M5 source');
  }
  out[view]={cadVisibleSegments:generated.length,
   m5SignedVisibleIntervals:signed.length,
   unsignedInteriorCadLines,sourceAndCoverageAgreement:true};
 }
 return Object.freeze({...canonical,
  c1CadRuntime:{
   schema:'draftai-c1-ocjs-m5-gated-runtime/1',
   compute:'real OpenCascade.js HLR visible B-Rep geometry',
   engine:'opencascade.js',revision:rev,geometryId:g.id,
   supportedScope:cad.proofScope,
   perView:out,sourceIdsMappedByExistingM5:true,
   independentCadComputedSegments:cad,
   nonContourCADDrawingActionsSigned:0,
   // The old proof remains the ONLY formal certification authority.
   newOfficialLineStyleSigner:false,secondV5:false
  }});
}
module.exports={compileC1WithOcjsHLR,intervalCoverage,positiveCollinearOverlap};
