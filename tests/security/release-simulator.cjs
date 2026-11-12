'use strict';
/**
 * Deterministic IN-MEMORY rehearsal of the Worker promotion lifecycle.
 * This module has no network, cloud SDK, secrets, filesystem or deploy command.
 * It cannot activate a real Cloudflare version. No production transport is accepted.
 */
const {createReleasePlan}=require('./release-plan.cjs');
const SIMULATOR_BRAND=Symbol('draftai/in-memory-release-simulator');
const VERSION=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[a-f0-9]{40}$/;
function makeInMemoryWorker({activeVersionId,versions=[],smoke='pass',failActivate=false,failRollback=false}={}){
  if(!VERSION.test(activeVersionId||''))throw Error('invalid in-memory active version');
  if(!Array.isArray(versions)||versions.some(v=>!v||!VERSION.test(v.id||'')||!SHA.test(v.sourceSha||''))||
     new Set(versions.map(v=>v.id)).size!==versions.length)
    throw Error('invalid in-memory uploaded versions');
  if(!['pass','fail','throw'].includes(smoke))throw Error('invalid simulated smoke outcome');
  let active=activeVersionId, locked=false;
  const uploaded=new Map(versions.map(v=>[v.id,v.sourceSha])),events=[];
  return Object.freeze({
    [SIMULATOR_BRAND]:true,
    get activeVersionId(){return active},
    get locked(){return locked},
    get events(){return events.map(e=>Object.freeze({...e}))},
    acquireLock(){if(locked)return false;locked=true;events.push({operation:'lock'});return true},
    releaseLock(){if(!locked)throw Error('lock not acquired');locked=false;events.push({operation:'unlock'})},
    lookupVersion(id){events.push({operation:'lookup',id});return uploaded.get(id)||null},
    promote(id){if(!locked)throw Error('lock required');if(failActivate)throw Error('simulated activation failure');
      if(!uploaded.has(id))throw Error('candidate not uploaded');active=id;events.push({operation:'promote',id})},
    checkSmoke(){events.push({operation:'smoke'});if(smoke==='throw')throw Error('simulated smoke connection failure');return smoke==='pass'},
    rollback(id){if(!locked)throw Error('lock required');if(failRollback)throw Error('simulated rollback failure');
      active=id;events.push({operation:'rollback',id})}
  });
}
function rehearseRelease({readiness,release,simulator}={}){
  const plan=createReleasePlan({readiness,release});
  if(!plan.ready)return {status:'blocked',reasons:plan.reasons,events:[]};
  if(!simulator||simulator[SIMULATOR_BRAND]!==true)
    return {status:'blocked',reasons:['only sealed in-memory simulator is allowed'],events:[]};
  if(!simulator.acquireLock())return {status:'blocked',reasons:['simulation production lock is busy'],events:simulator.events};
  let state='blocked',reasons=[];
  try{
    if(simulator.activeVersionId!==plan.previousVersionId)
      reasons.push('active version changed since snapshot');
    else if(simulator.lookupVersion(plan.candidateVersionId)!==plan.sourceSha)
      reasons.push('uploaded Worker version does not match trusted source SHA');
    else {
      try{
        simulator.promote(plan.candidateVersionId);
        if(simulator.checkSmoke())state='simulated-success';
        else throw Error('simulated production smoke rejected new version');
      }catch(error){
        reasons.push(String(error?.message||'simulated promotion/smoke failure'));
        if(simulator.activeVersionId!==plan.previousVersionId){
          try{
            simulator.rollback(plan.previousVersionId);
            state='simulated-rolled-back';
          }catch(rollbackError){
            reasons.push('simulation rollback failed: '+String(rollbackError?.message||'Error'));
            state='manual-intervention-needed';
          }
        }
      }
    }
  }finally{simulator.releaseLock()}
  return {status:state,reasons,activeVersionId:simulator.activeVersionId,events:simulator.events,
    simulated:true,productionDeploymentOccurred:false};
}
module.exports={makeInMemoryWorker,rehearseRelease};
