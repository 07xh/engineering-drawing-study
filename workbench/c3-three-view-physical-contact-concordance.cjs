'use strict';
/**
 * C3 M4 read-only fusion of EXISTING exact V/H quadratic contacts (#693)
 * and W inverse-radical + cap collapsed-source points (#695).
 * No second M3, no independent curve renderer and no new V5 action.
 */
const {auditC3VHArcCapLineContacts}=
 require('./c3-vh-arc-cap-line-contacts.cjs');
const {auditC3WAnalyticCurveCapContacts}=
 require('./c3-w-analytic-curve-cap-contacts.cjs');
const {reconcileThreeViewSourceContacts}=
 require('../core/projection/three-view-source-contact-concordance.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC3ThreeViewPhysicalContactConcordance({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current C3 source revision required');
 const vh=auditC3VHArcCapLineContacts({input,revision});
 const w=auditC3WAnalyticCurveCapContacts({input,revision});
 const blocked=reason=>freeze({
  schema:'draftai-c3-three-view-source-contact-concordance/1',
  revision,status:'not-covered',reason,
  spatialContacts:[],witnesses:[],allSourceViewsEnumerated:false,
  sourceJunctionTopologyCertified:false,officialLineStylesVerified:false,
  finalV5StrokeAuthorized:false});
 if(!vh.status.startsWith('scoped-')||
    w.status!=='scoped-exact-W-analytic-curve-cap-line-events'||
    w.allWCurveCapPairsEnumerated!==true||
    vh.officialLineStylesVerified!==false||
    w.officialLineStylesVerified!==false)
  return blocked('V/H or W exact current source contacts not available');
 const rows=[];
 for(const contact of vh.contacts){
  if(contact.exactQuadraticArcLineEquationVerified!==true||
     contact.firstAnglePhysicalDepthAtIntersectionCompared!==true||
     !['V','H'].includes(contact.view)||
     contact.officialLineStyle!=='undetermined')
   throw new RangeError('unsigned current V/H branch-depth witness required');
  for(const branch of contact.sourceBranchDepths){
   if(branch.sourceBranchIdentityVerified!==true||
      branch.adjacentIntervalDepthOrderProven!==false)
    throw new RangeError('untrusted distinct 3D branch witness');
   rows.push({view:contact.view,
    eventId:contact.id,branchId:branch.sourceBranchId,
    featureId:contact.sourceCapFeatureId,
    curvePoint3D:branch.point3D,
    capPoint3D:contact.sourceCap3DPoint,
    projectedUV:contact.projectedUV,capSourceDomainVerified:true});
  }
 }
 for(const contact of w.events){
  if(contact.projectedSourceOnlyNotPhysicalJoin===
      contact.pointwiseTrue3DSourceCoincidenceVerified||
     contact.officialLineStyle!=='undetermined')
   throw new RangeError('untrusted original W physical/source-depth distinction');
  rows.push({view:'W',eventId:contact.id,branchId:contact.sourceBranchId,
   featureId:contact.sourceCapFeatureId,
   curvePoint3D:contact.sourceCurve3DPoint,
   capPoint3D:contact.sourceCap3DPoint,
   projectedUV:contact.projectedUV,
   capSourceDomainVerified:contact.sourceCap3DXDomainContainsCurveX});
 }
 const tol=1e-8*Math.max(1,input.zCylinder.radius,input.yCylinder.radius);
 const agreed=reconcileThreeViewSourceContacts({
  revision,records:rows,tolerance:tol});
 if(agreed.sourceWitnessCount!==rows.length||
    !agreed.groupedOnlyWhenOriginal3DSourcesAgree||
    agreed.officialLineStylesVerified!==false)
  throw new RangeError('three-view physical source records lost or forged');
 return freeze({...agreed,
  schema:'draftai-c3-three-view-source-contact-concordance/1',
  revision,status:'scoped-C3-source-VHW-contact-concordance',
  originalVHQuadraticContactCount:vh.contacts.length,
  originalWInverseRadicalContactCount:w.events.length,
  unresolvedVHTangencyCount:vh.tangentBlockers.length,
  allSourceViewsEnumerated:vh.allVHCircularArcLineContactsResolved&&
   w.allWCurveCapPairsEnumerated,
  sourceJunctionTopologyCertified:false,
  allProjectedCurvesAndOutlineCrossingsCertified:false,
  standardEngineeringVisibleHiddenLinesAuthorized:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
}
module.exports={auditC3ThreeViewPhysicalContactConcordance};
