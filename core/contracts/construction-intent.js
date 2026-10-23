'use strict';
/**
 * ConstructionIntent 1.0.0 contract proposal — #372 / #341.
 * This is a STRUCTURAL validator, NOT a mathematical proof issuer.
 *
 * Only M3's re-computed, proof-checked specialist adapter may construct
 * trusted intents. Never accept a caller's "verified" boolean as proof.
 * M4 consumes semantic actions and the single existing V5 Timeline/Motion.
 */
const {object,finite,identifier,report,noDuplicateIds}=require('./common.js');
const CONSTRUCTION_INTENT_VERSION='draftai-construction-intent/1.0.0';
const KINDS=Object.freeze(['line','point','circle','directed-arc']);
const SPACES=Object.freeze(['model-mm','sheet-px']);
const PROOF_STATES=Object.freeze(['selected','unique']);
const PROOF_LEVELS=Object.freeze(['analytic','linear-algebra','selected-directed-g1']);
const branchIdentifier=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_+.-]{0,79}$/.test(x);
const isIdList=x=>Array.isArray(x)&&x.length<=300&&
 x.every(identifier)&&noDuplicateIds(x);
const point=p=>object(p)&&finite(p.x)&&finite(p.y);
const exactKeys=(x,keys)=>Object.keys(x).every(k=>keys.includes(k));
function validAction(a){
 if(!object(a)||!identifier(a.id)||!KINDS.includes(a.kind)||
    !SPACES.includes(a.coordinateSpace)||!object(a.geometry)||
    !exactKeys(a,['id','kind','coordinateSpace','geometry']))return false;
 const g=a.geometry;
 if(a.kind==='line')return exactKeys(g,['from','to'])&&
  point(g.from)&&point(g.to)&&
  Math.hypot(g.from.x-g.to.x,g.from.y-g.to.y)>1e-12;
 if(a.kind==='point')return exactKeys(g,['at'])&&point(g.at);
 if(a.kind==='circle')return a.coordinateSpace==='model-mm'&&
  exactKeys(g,['center','radius'])&&point(g.center)&&finite(g.radius)&&g.radius>0;
 if(a.kind==='directed-arc'){
  if(a.coordinateSpace!=='model-mm'||!exactKeys(g,
   ['center','radius','startAngle','endAngle','direction'])||
   !point(g.center)||!finite(g.radius)||g.radius<=0||
   !finite(g.startAngle)||!finite(g.endAngle)||
   !['cw','ccw'].includes(g.direction))return false;
  const sweep=g.endAngle-g.startAngle; // degrees in model y-up frame
  return Math.abs(sweep)>1e-9&&Math.abs(sweep)<360-1e-9&&
   (sweep>0)===(g.direction==='ccw');
 }
 return false;
}
function validSource(s){
 if(!object(s)||!exactKeys(s,['solver','revision','unit','proofScope',
  'proofLevel','resultId','branchId','status','evidenceSource']))return false;
 if(typeof s.solver!=='string'||!s.solver||s.solver.length>180||
  !Number.isSafeInteger(s.revision)||s.revision<0||s.unit!=='mm'||
  typeof s.proofScope!=='string'||!s.proofScope||s.proofScope.length>120||
  !PROOF_LEVELS.includes(s.proofLevel)||!PROOF_STATES.includes(s.status)||
  typeof s.evidenceSource!=='string'||!s.evidenceSource||
  s.evidenceSource.length>180||
  (s.resultId!==null&&!identifier(s.resultId))||
  (s.branchId!==null&&!branchIdentifier(s.branchId)))return false;
 if(s.status==='selected'&&s.branchId===null)return false;
 if(s.status==='unique'&&s.branchId!==null)return false;
 return true;
}
function validateConstructionIntent(intent){
 const errors=[];
 if(!object(intent))return report(['ConstructionIntent must be an object']);
 if(!exactKeys(intent,['schema','id','purpose','role','dependsOn',
  'inputEntityIds','outputEntityIds','operations','source']))
  errors.push('unknown or noncanonical intent field');
 if(intent.schema!==CONSTRUCTION_INTENT_VERSION)errors.push('schema version mismatch');
 if(!identifier(intent.id))errors.push('invalid intent ID');
 if(typeof intent.purpose!=='string'||!intent.purpose.trim()||
  intent.purpose.length>160)errors.push('invalid semantic purpose');
 if(!['auxiliary','given','result'].includes(intent.role))errors.push('invalid role');
 for(const k of ['dependsOn','inputEntityIds','outputEntityIds'])
  if(!isIdList(intent[k]))errors.push('invalid '+k);
 if(!validSource(intent.source))errors.push('invalid proof source metadata');
 if(!Array.isArray(intent.operations)||intent.operations.length<1||
    intent.operations.length>40||intent.operations.some(x=>!validAction(x)))
  errors.push('invalid geometry operations');
 if(Array.isArray(intent.operations)&&isIdList(intent.outputEntityIds)&&
    JSON.stringify(intent.outputEntityIds)!==
      JSON.stringify(intent.operations.map(x=>x.id)))
  errors.push('output IDs must match semantic actions exactly');
 if(isIdList(intent.dependsOn)&&isIdList(intent.inputEntityIds)&&
    intent.inputEntityIds.some(id=>intent.dependsOn.includes(id)))
  errors.push('dependency step IDs must not masquerade as geometry IDs');
 return report(errors);
}
function validateConstructionIntentDAG(intents){
 const errors=[];
 if(!Array.isArray(intents)||!intents.length||intents.length>300)
  return report(['1..300 intents required']);
 const steps=new Set(),entities=new Set();
 let source=null;
 for(const [index,intent] of intents.entries()){
  const check=validateConstructionIntent(intent);
  if(!check.ok){errors.push('intent '+index+': '+check.errors.join('; '));continue;}
  if(steps.has(intent.id))errors.push('duplicate intent ID '+intent.id);
  if(intent.dependsOn.some(dep=>!steps.has(dep)))
   errors.push('missing or forward dependency '+intent.id);
  for(const op of intent.operations){
   if(entities.has(op.id))errors.push('duplicate output entity '+op.id);
   entities.add(op.id);
  }
  const key=JSON.stringify(intent.source);
  if(source!==null&&key!==source)
   errors.push('mixed source revision/proof/branch in DAG');
  source=source??key;
  steps.add(intent.id);
 }
 return report(errors);
}
module.exports={CONSTRUCTION_INTENT_VERSION,KINDS,SPACES,validAction,
 validSource,validateConstructionIntent,validateConstructionIntentDAG};
