'use strict';
/**
 * C2/M5: EXACT 3D duplicate-feature reduction in the existing first-angle
 * original+generated paper source registry.
 *
 * A reviewed source pair may occupy the identical finite 3D line locus.
 * Such duplicate records are one physical geometric candidate, regardless
 * of source enumeration order or orientation. Coincident PAPER coordinates
 * at DIFFERENT 3D depths are distinct classes: never deduplicate them.
 *
 * This is source identity reduction, NOT complete union-face topology,
 * opaque surface visibility, endpoint continuity, national standard style
 * or approval to issue a ConstructionIntent/DAG/V5 action.
 */
const {FIRST_ANGLE_OBSERVER_RAYS,project,VIEWS}=
 require('../core/projection/conventions.js');
const {auditUnifiedPaperSourceIdentity}=
 require('./m5-unified-paper-source-identity.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);
 Object.freeze(x);
}return x;};
const AXES=['x','y','z'];
const canonical=n=>Object.is(n,-0)?0:n;
const key3=p=>AXES.map(a=>canonical(p[a])).join(',');
const same3=(a,b)=>AXES.every(k=>canonical(a[k])===canonical(b[k]));
const close3=(a,b)=>Math.hypot(...AXES.map(k=>a[k]-b[k]))<=1e-8;
const normalizeId=s=>[
 s.kind,s.originalSourceFeatureId,[...s.sourceGeometryIds].sort().join('+'),
 key3(s.from3D),key3(s.to3D)
].join('|');
const depth=(p,ray)=>AXES.reduce((x,k)=>x+p[k]*ray[k],0);
function auditExactPhysicalFeatureDedup({geometry,revision,
 projectedStrokePartitions,generatedSubspanRayEvidence,
 unifiedProjectedFeatureEventEvidence,unifiedPaperSourceIdentityEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('reviewed source revision required for exact physical feature dedup');
 const current=auditUnifiedPaperSourceIdentity({geometry,revision,
  projectedStrokePartitions,generatedSubspanRayEvidence,
  unifiedProjectedFeatureEventEvidence});
 if(current.status!=='source-traced-canonical-projected-open-interval-registry'||
    JSON.stringify(current)!==JSON.stringify(unifiedPaperSourceIdentityEvidence)||
    current.officialLineStylesVerified!==false||
    current.signedV5LineActions!==0||current.v5Ready!==false)
  throw new TypeError('stale or forged original/new physical source paper ledger');
 let classesTotal=0,removed=0;
 const groups=[];
 for(const entry of current.groups){
  if(!VIEWS.includes(entry.view)||entry.revision!==revision||
     entry.sourceMultiplicity!==entry.sourceSubspans.length||
     entry.applicableEngineeringLineStyle!=='undetermined'||
     entry.formalConstructionIntentDAGAndV5Approved!==false)
   throw new TypeError('unreviewed paper source interval or forged line style');
  const sources=[...entry.sourceSubspans].sort((a,b)=>
   normalizeId(a).localeCompare(normalizeId(b)));
  if(new Set(sources.map(s=>s.sourceSubspanId)).size!==sources.length)
   throw new TypeError('a paper source interval repeats a source ID');
  const classes=[];
  for(const source of sources){
   if(source.source3DAndFirstAnglePaperCoordinatesVerified!==true||
      !AXES.every(k=>Number.isFinite(source.from3D[k])&&
       Number.isFinite(source.to3D[k]))||
      !AXES.every(k=>Number.isFinite(FIRST_ANGLE_OBSERVER_RAYS[entry.view][k])))
    throw new TypeError('non-reviewed 3D geometric feature source');
   const q=project(source.from3D)[entry.view],
    r=project(source.to3D)[entry.view];
   if(q.u!==entry.projectedFromModelMm.u||
      q.v!==entry.projectedFromModelMm.v||
      r.u!==entry.projectedToModelMm.u||
      r.v!==entry.projectedToModelMm.v)
    throw new TypeError('first-angle source interval does not share the canonical paper geometry');
   const existing=classes.find(c=>same3(c.from3D,source.from3D)&&
     same3(c.to3D,source.to3D));
   if(existing){
    existing.contributors.push(source);
   }else{
    classes.push({from3D:{...source.from3D},
     to3D:{...source.to3D},
     contributors:[source]});
   }
  }
  const ray=FIRST_ANGLE_OBSERVER_RAYS[entry.view];
  const records=classes.map(c=>{
   const members=[...c.contributors].sort((a,b)=>
    normalizeId(a).localeCompare(normalizeId(b)));
   const primary=members[0],key=entry.view+':'+
    key3(c.from3D)+'->'+key3(c.to3D);
   return {
    key,
    canonicalSourceFeatureId:normalizeId(primary),
    canonicalReviewed3DSourceSubspanId:primary.sourceSubspanId,
    contributors:members.map(x=>({
     kind:x.kind,
     originalSourceFeatureId:x.originalSourceFeatureId,
     sourceSubspanId:x.sourceSubspanId,
     sourceGeometryIds:[...x.sourceGeometryIds],
     observerRayScope:x.sourceObserverRayScope
    })),
    physical3DFrom:{...c.from3D},physical3DTo:{...c.to3D},
    exactlyOneFinitePhysical3DGeometricLineLocusVerified:true,
    duplicateSourceRecordCount:members.length-1,
    originalOrGeneratedProvenanceRetained:true,
    observerRayScopesConflict:members.some(x=>
     x.sourceObserverRayScope!==primary.sourceObserverRayScope),
    coveredCompleteUnionSurfaceAndJunctionsVerified:false,
    nationalStandardLineStyle:'undetermined',
    v5DrawingActionApproved:false
   };
  }).sort((a,b)=>a.key.localeCompare(b.key));
  const byClass=new Map(records.map(x=>[x.key,x]));
  if(byClass.size!==records.length)
   throw new TypeError('duplicate physical feature class keys');
  const pairs=[];
  for(let a=0;a<records.length;a++)for(let b=a+1;b<records.length;b++){
   const A=records[a],B=records[b];
   const da0=depth(A.physical3DFrom,ray)-depth(B.physical3DFrom,ray),
    da1=depth(A.physical3DTo,ray)-depth(B.physical3DTo,ray);
   const nearButNotSame=close3(A.physical3DFrom,B.physical3DFrom)&&
     close3(A.physical3DTo,B.physical3DTo);
   pairs.push({
    physicalFeatureKeys:[A.key,B.key],
    source3DStrictlyDistinctVerified:true,
    nearButNotExactlySame3D:nearButNotSame,
    observerDepthDifferenceAtBothEndsMm:[da0,da1],
    depthOrdering:
     nearButNotSame?'undetermined-near-distinct-3d-feature':
     da0>1e-8&&da1>1e-8?'source-A-front-whole-open-interval':
     da0< -1e-8&&da1< -1e-8?'source-B-front-whole-open-interval':
     'undetermined-tie-or-depth-switch',
    allSolidFacesAndProjectedContactsCleared:false
   });
  }
  const winners=records.filter(A=>records.every(B=>{
   if(A.key===B.key)return true;
   const pair=pairs.find(x=>x.physicalFeatureKeys.includes(A.key)&&
     x.physicalFeatureKeys.includes(B.key));
   if(!pair)return false;
   const aFirst=pair.physicalFeatureKeys[0]===A.key;
   return pair.depthOrdering===(aFirst?
    'source-A-front-whole-open-interval':
    'source-B-front-whole-open-interval');
  }));
  const uniqueFront=records.length===1||winners.length===1;
  const front=records.length===1?records[0]:
   uniqueFront?winners[0]:null;
  const duplicates=sources.length-records.length;
  classesTotal+=records.length;removed+=duplicates;
  groups.push({
   paperGroupId:entry.id,revision,view:entry.view,
   projectedFromModelMm:{...entry.projectedFromModelMm},
   projectedToModelMm:{...entry.projectedToModelMm},
   originalReviewedSourceRecordCount:sources.length,
   exact3DPhysicalFeatureClassCount:records.length,
   exact3DDuplicateSourceRecordsEliminated:duplicates,
   physicalFeatureClasses:records,
   pairwiseDistinctPhysicalDepthWitnesses:pairs,
   closestListed3DPhysicalFeatureClassKey:front?.key??null,
   exactlyOneNearestPhysicalFeatureClassWithinListedSources:uniqueFront,
   onlyPaperProjectionCoincidentWhenClassesRemainDistinct:
    records.length>1,
   nearDistinctOrDepthAmbiguity:pairs.some(x=>
    x.depthOrdering.startsWith('undetermined')),
   allReviewedPaperSourceRecordsAccountedFor:records.reduce((v,c)=>
    v+c.contributors.length,0)===sources.length,
   allBooleanExteriorFeaturesProvenComplete:false,
   allProjectiveJunctionsAndOpaqueFacesProvenComplete:false,
   nationalEngineeringStrokeStyle:'undetermined',
   canonicalV5ActionAuthorized:false
  });
 }
 if(groups.length!==current.paperIntervalCount||
    groups.some(x=>!x.allReviewedPaperSourceRecordsAccountedFor))
  throw new RangeError('lost reviewed physical source while de-duplicating');
 return freeze({schema:'draftai-m5-exact-physical-feature-dedup/1',
  revision,status:'exact-current-original-generated-3d-physical-feature-classes',
  sourceGeometryIds:geometry.map(x=>x.id),
  groups,paperIntervalCount:groups.length,
  distinctPhysical3DFeatureClassCount:classesTotal,
  exact3DDuplicateSourceRecordCount:removed,
  multi3DPhysicalClassPaperIntervalCount:groups.filter(x=>
   x.exact3DPhysicalFeatureClassCount>1).length,
  uniqueNearestListedPhysicalClassIntervalCount:groups.filter(x=>
   x.exactlyOneNearestPhysicalFeatureClassWithinListedSources).length,
  depthOrNearDistinctAmbiguousIntervalCount:groups.filter(x=>
   x.nearDistinctOrDepthAmbiguity).length,
  allReviewedSourceRecordsRetainedAndExactlyGrouped:true,
  allFinalBooleanExteriorFeatureSourcesEnumerated:false,
  globalPaperJunctionsAndOpaqueOcclusionVerified:false,
  engineeringStandardLineStylesVerified:false,
  officialLineStylesVerified:false,signedV5LineActions:0,v5Ready:false});
}
module.exports={auditExactPhysicalFeatureDedup};
