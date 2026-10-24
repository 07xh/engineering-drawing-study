'use strict';
/**
 * Common M4 FIRST-ANGLE 2D projected-contact → true 3D source concordance.
 * Reconcile existing independent view witnesses without pretending a
 * projected crossing is a space junction or a certified engineering edge.
 * This is a source identity join, NOT a solver, visibility or V5 executor.
 */
const {project,VIEWS}=require('./conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const finite=Number.isFinite;
const valid3=p=>p&&['x','y','z'].every(k=>finite(p[k]));
const valid2=p=>p&&finite(p.u)&&finite(p.v);
const xyz=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const uv=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
function reconcileThreeViewSourceContacts({revision,records,tolerance=1e-8}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    !Array.isArray(records)||records.length>2000||
    !finite(tolerance)||tolerance<=0||tolerance>1)
  throw new TypeError('bounded current source contact records required');
 const used=new Set(),sources=[];
 for(const row of records){
  if(!row||!VIEWS.includes(row.view)||
     typeof row.eventId!=='string'||!row.eventId||
     typeof row.branchId!=='string'||!row.branchId||
     typeof row.featureId!=='string'||!row.featureId||
     !valid3(row.curvePoint3D)||!valid3(row.capPoint3D)||
     !valid2(row.projectedUV)||
     typeof row.capSourceDomainVerified!=='boolean')
   throw new TypeError('full source provenance and true 3D points required');
  const key=row.view+'|'+row.eventId+'|'+row.branchId;
  if(used.has(key))throw new RangeError('duplicate 3D branch source witness');
  used.add(key);
  const a=project(row.curvePoint3D)[row.view];
  const b=project(row.capPoint3D)[row.view];
  if(uv(a,row.projectedUV)>tolerance*5||
     uv(b,row.projectedUV)>tolerance*5)
   throw new RangeError('projected source witness disagrees with original 3D geometry');
  const distance=xyz(row.curvePoint3D,row.capPoint3D);
  const physical=row.capSourceDomainVerified&&distance<=tolerance;
  sources.push({view:row.view,eventId:row.eventId,
   branchId:row.branchId,featureId:row.featureId,
   projectedUV:{...row.projectedUV},curvePoint3D:{...row.curvePoint3D},
   capPoint3D:{...row.capPoint3D},
   source3DGap:distance,true3DSourceContactCandidate:physical,
   paperOnlyOrOutOfSourceDomain:!physical,
   sourceDomainVerified:row.capSourceDomainVerified,
   physicalGraphJunctionApproved:false,standardLineStyle:'undetermined'});
 }
 const physical=sources.filter(r=>r.true3DSourceContactCandidate);
 const contacts=[];
 for(const r of physical){
  const matches=contacts.filter(x=>x.branchId===r.branchId&&
    x.featureId===r.featureId&&xyz(x.point3D,r.curvePoint3D)<=tolerance);
  if(matches.length>1)throw new RangeError('nonunique physical source contact grouping');
  let g=matches[0];
  if(!g){
   g={id:'sourceContact'+contacts.length,branchId:r.branchId,
    featureId:r.featureId,point3D:{...r.curvePoint3D},
    views:{V:[],H:[],W:[]}};
   contacts.push(g);
  }
  g.views[r.view].push(r.eventId);
 }
 const complete=contacts.map(g=>{
  const covered=VIEWS.every(v=>g.views[v].length>0);
  return {...g,viewCoverage:VIEWS.filter(v=>g.views[v].length>0),
   allThreeSourceViewIncidencesObserved:covered,
   completePhysicalSourceFeatureGraphJoinVerified:false,
   officialLineStyle:'undetermined',finalV5StrokeAuthorized:false};
 });
 return freeze({schema:'draftai-m4-three-view-source-contact-concordance/1',
  revision,status:'scoped-physical-contact-identity-concordance',
  sourceWitnessCount:sources.length,
  paperOnlyOrDepthSeparatedWitnessCount:sources.filter(x=>
   x.paperOnlyOrOutOfSourceDomain).length,
  spatialContactCount:complete.length,
  allThreeViewWitnessCount:complete.filter(x=>
   x.allThreeSourceViewIncidencesObserved).length,
  incompleteViewWitnessCount:complete.filter(x=>
   !x.allThreeSourceViewIncidencesObserved).length,
  witnesses:sources,spatialContacts:complete,
  groupedOnlyWhenOriginal3DSourcesAgree:true,
  inferred3DJoinsFrom2DPosition:false,
  sourceWViewCollapseHandledWithoutFakeLine:true,
  completePhysicalFeatureGraphJoinsVerified:false,
  endpointAndProjectedContourContinuityVerified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
}
module.exports={reconcileThreeViewSourceContacts};
