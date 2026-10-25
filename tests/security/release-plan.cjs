'use strict';
/**
 * Pure planning only. A privileged release controller must independently query
 * GitHub/Cloudflare and must NEVER execute these stages from PR-supplied input.
 */
const {evaluateReleaseReadiness}=require('./release-readiness.cjs');
const SHA=/^[a-f0-9]{40}$/;
const VERSION=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function createReleasePlan({readiness,release}={}){
 const reasons=[];
 // The pure policy is preliminary only; it does not certify evidence authenticity.
 const gate=evaluateReleaseReadiness(readiness);
 if(!gate.eligible) reasons.push(...gate.reasons);
 if(!release||typeof release!=='object'||Array.isArray(release))
  reasons.push('immutable Worker release metadata missing');
 else {
  if(release.worker!=='engineering-drawing-study'||release.environment!=='production')
   reasons.push('unexpected Worker or environment');
  if(!VERSION.test(release.candidateVersionId||''))reasons.push('invalid candidate Worker version ID');
  if(!VERSION.test(release.previousVersionId||''))reasons.push('invalid prior active Worker version ID');
  if(release.candidateVersionId===release.previousVersionId)
   reasons.push('candidate version already active; cannot plan update');
  if(!SHA.test(release.sourceSha||'')||release.sourceSha!==readiness?.headSha||
     release.sourceSha!==readiness?.artifactSha)
   reasons.push('candidate version source SHA does not match tested source');
  if(release.uploadVerified!==true||release.previousVersionActiveVerified!==true)
   reasons.push('Cloudflare version and existing active version must be independently verified');
  if(release.rollbackPreviouslyTested!==true)
   reasons.push('rollback procedure must be demonstrated before unattended promotion');
  if(release.uniqueDeploymentLock!==true)
   reasons.push('release controller must hold unique production concurrency lock');
  if(release.previousVersionId!==readiness?.previousActiveVersionId)
   reasons.push('previous active version differs from verified rollback snapshot');
 }
 if(reasons.length)return {ready:false,status:'blocked',reasons,stages:[]};
 return {ready:true,status:'plan-only-not-authorized',reasons:[],
  worker:release.worker,sourceSha:release.sourceSha,
  candidateVersionId:release.candidateVersionId,previousVersionId:release.previousVersionId,
  stages:[
   {action:'revalidate-trusted-evidence',requires:'trusted-github-and-cloudflare-read'},
   {action:'activate-immutable-worker-version',versionId:release.candidateVersionId},
   {action:'run-read-only-production-smoke',requires:'all-public-and-private-route-checks'},
   {action:'rollback-on-smoke-failure',versionId:release.previousVersionId},
   {action:'record-final-sha-version-and-smoke',requires:'immutable-release-audit-log'}
  ]
 };
}
module.exports={createReleasePlan};
