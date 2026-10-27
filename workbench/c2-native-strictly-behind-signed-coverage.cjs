'use strict';
/**
 * C2 M5 candidate-de-duplication theorem for same-paper source edges:
 * an ORIGINAL 3D physical BRep edge hidden STRICTLY behind a distinct
 * real native physical edge need not be drawn AGAIN where the front
 * already-signed GB engineering stroke fully covers its projection.
 *
 * Require all three independent positive witnesses:
 *   (1) authentic current M4 source parameter interval and identical
 *       native edge ordinal/view lookup;
 *   (2) every positive projected physical source alias is STRICTLY in
 *       front of this candidate over its entire original 3D interval
 *       (not a midpoint ray or merely a 2D coincidence);
 *   (3) an ALREADY SIGNED formal V5 foreground action from the proven
 *       depth-front source covers the ENTIRE candidate paper interval
 *       with zero positive-length gaps, same official line style.
 *
 * No forgiveness for 1-ULP gaps, mixed visible/hidden layers, partial
 * overlays, ties, near-collinearity, unverified 3D source or paper-only
 * crossings. Reuse the previously independently proven C1 exact dyadic
 * paper-interval coverage; do NOT build another geometry/animation engine.
 *
 * This helper is math-only and can receive caller JSON; the authoritative
 * sole-V5 signer calls it PRIVATE after executing actual native OCP +
 * recomputing all original M0/M4/M5 in the same process tree.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {exactSameStylePaperCoverage}=
 require('./c1-independent-reference-line-parity.cjs');
const VISIBLE='gb-t-4457.4-continuous-wide-visible-outline';
const HIDDEN='gb-t-4457.4-thin-dashed-hidden-edge';
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
 a.length===2&&b.length===2&&a[0]===b[0]&&a[1]===b[1];
function auditC2StrictNativeBehindSignedPaperCoverage({
 unsigned,m4Rows,signed
}={}){
 if(!Array.isArray(unsigned)||unsigned.length>512||
    !Array.isArray(m4Rows)||m4Rows.length>256||
    !Array.isArray(signed)||signed.length>512)
  throw new TypeError('bounded original native source and official V5 paper inventories required');
 const key=(view,id)=>view+'@'+id;
 const index=new Map();
 for(const row of m4Rows){
  const id=row?.sourceNativeResultEdgeOrdinal;
  if(!VIEWS.includes(row?.view)||!Number.isSafeInteger(id)||id<1||
     !Array.isArray(row.subspans)||row.subspans.length>128||
     index.has(key(row.view,id)))
   throw new RangeError('nonunique or incomplete M4 original native result line inventory');
  index.set(key(row.view,id),row);
 }
 const officialIds=new Set();
 for(const source of signed){
  if(!VIEWS.includes(source?.view)||
     !Number.isSafeInteger(source.sourceNativeResultEdgeOrdinal)||
     source.sourceNativeResultEdgeOrdinal<1||
     typeof source.actionId!=='string'||!source.actionId||
     officialIds.has(source.actionId)||
     ![VISIBLE,HIDDEN].includes(source.standardEngineeringLineStyle)||
     !source.projectedFromModelMm||!source.projectedToModelMm||
     source.fullOriginalC2NativeM0M4M5ProofVerifiedInFreshRun!==true)
   throw new RangeError('only previously signed original native source lines may support suppression');
  officialIds.add(source.actionId);
 }
 const suppressed=[],held=[],seen=new Set();
 for(const candidate of unsigned){
  const id=candidate?.sourceNativeResultEdgeOrdinal,view=candidate?.view,
   range=candidate?.originalGeneratedEdgeParameterRange,
   token=key(view,id)+'@'+JSON.stringify(range);
  if(!VIEWS.includes(view)||!Number.isSafeInteger(id)||id<1||
     !Array.isArray(range)||range.length!==2||
     !range.every(Number.isFinite)||!(range[1]>range[0])||
     range[0]<0||range[1]>1||seen.has(token))
   throw new RangeError('unbound original physical C2 source interval');
  seen.add(token);
  const row=index.get(key(view,id));
  const originals=row?.subspans?.filter(x=>
   same(x.originalGeneratedEdgeParameterRange,range));
  if(originals?.length!==1||
     !originals[0].projectedFromModelMm||
     !originals[0].projectedToModelMm||
     JSON.stringify(candidate.projectedFromModelMm)!==
      JSON.stringify(originals[0].projectedFromModelMm)||
     JSON.stringify(candidate.projectedToModelMm)!==
      JSON.stringify(originals[0].projectedToModelMm))
   throw new RangeError('unverified original M4 candidate-to-physical-source paper interval');
  const source=originals[0],witnesses=
   source.coProjectedOriginalNative3DDepthWitnesses;
  const peers=[];
  if(row.unresolvedNearDegenerateOriginalSourceEvents===false&&
     source.status==='unresolved-projected-depth-or-collinear-source-alias'&&
     candidate.reason===source.status&&
     Array.isArray(witnesses)&&witnesses.length>0){
   for(const w of witnesses){
    const match=/^NativeC2Peer([1-9]\d*)$/.exec(w?.peerSourceId);
    if(!match||w.view!==view||
       w.status!=='candidate-strictly-behind'||
       w.independentOriginal3DWholeOpenDepthOrderCertified!==true||
       !Array.isArray(w.signedObserverDepthDifferenceAtEndsMm)||
       w.signedObserverDepthDifferenceAtEndsMm.length!==2||
       !Number.isFinite(w.strictlyPositiveOriginalDepthMarginMm)||
       w.strictlyPositiveOriginalDepthMarginMm<=0||
       !w.signedObserverDepthDifferenceAtEndsMm.every(
        x=>Number.isFinite(x)&&x< -w.strictlyPositiveOriginalDepthMarginMm)){
     peers.length=0;break;
    }
    peers.push(Number(match[1]));
   }
  }
  if(!peers.length){
   held.push({...candidate,
    suppressionProofStatus:'unresolved-original-3d-affine-depth'});
   continue;
  }
  let coverage=null,covering=[],chosenStyle=null;
  for(const style of [VISIBLE,HIDDEN]){
   const rows=signed.filter(s=>
    s.view===view&&peers.includes(s.sourceNativeResultEdgeOrdinal)&&
    s.standardEngineeringLineStyle===style);
   const actual=rows.map(s=>({from:s.projectedFromModelMm,
    to:s.projectedToModelMm,standardLineStyle:style}));
   if(!actual.length)continue;
   const r=exactSameStylePaperCoverage({
    from:candidate.projectedFromModelMm,
    to:candidate.projectedToModelMm,
    standardLineStyle:style
   },actual);
   if(r.fullyCovered){
    coverage=r;covering=rows.map(s=>s.actionId);chosenStyle=style;
    break;
   }
  }
  if(!coverage){
   held.push({...candidate,
    suppressionProofStatus:'front-signed-stroke-does-not-cover-exact-paper-interval',
    strictlyInFrontNativeSourceOrdinals:peers});
   continue;
  }
  suppressed.push({
   ...candidate,
   status:'certified-behind-strictly-front-existing-signed-native-line',
   suppressedInsteadOfDrawingDuplicateV5:true,
   actual3DBackToFrontSourceDepthOrdersVerified:true,
   exactCompleteForegroundPaperIntervalCoverageVerified:true,
   allSignedForegroundActionIds:covering,
   coveringOriginalNativeSourceOrdinals:peers,
   inheritedPaperLineStyleFromAlreadySignedForeground:chosenStyle,
   additionalNewV5ActionCount:0
  });
 }
 if(suppressed.length+held.length!==unsigned.length)
  throw new RangeError('full unsigned native source ledger must remain accounted');
 return freeze({
  schema:'draftai-c2-m5-proven-strictly-behind-signed-foreground/1',
  examinedOriginalUnsignedPhysicalIntervals:unsigned.length,
  suppressed,held,
  foregroundNativeSourceOriginal3DAndExactPaperCoverageCrossChecked:true,
  onlyMathematicalSourceLedgerProvidedByCaller:true,
  independentOCCTNativeExecutionAuthenticatedHere:false,
  independentlyAuthorizedToEmitV5:false,
  supplementaryV5ActionCount:0
 });
}
module.exports={auditC2StrictNativeBehindSignedPaperCoverage};
