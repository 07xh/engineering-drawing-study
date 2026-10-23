'use strict';
/**
 * Metadata-only DXF import acceptance. Private CAD entities and reference
 * answers are never stored in the public repository.
 * This audit consumes a converter-produced inventory, not raw DWG bytes.
 */
const SUPPORTED=new Set(['LINE','ARC','CIRCLE','ELLIPSE','LWPOLYLINE','POLYLINE','SPLINE','POINT','INSERT','DIMENSION','TEXT','MTEXT','HATCH']);
function auditDxfInventory(inventory){
 if(!inventory||typeof inventory!=='object'||inventory.format!=='DXF')
  return {status:'not-verified',reason:'DXF inventory missing'};
 if(!Number.isInteger(inventory.insunits)||inventory.insunits<=0)
  return {status:'not-verified',reason:'DXF insertion units absent or unitless'};
 if(!Array.isArray(inventory.layers)||!Array.isArray(inventory.entities)||
    !Array.isArray(inventory.blocks))
  return {status:'not-verified',reason:'DXF layers/entities/blocks inventory missing'};
 if(inventory.entities.some(e=>!e||typeof e.type!=='string'||typeof e.layer!=='string'))
  return {status:'not-verified',reason:'malformed DXF entity inventory'};
 const layers=new Set(inventory.layers);
 if(inventory.entities.some(e=>!layers.has(e.layer)))
  return {status:'not-verified',reason:'entity refers to unknown layer'};
 const unknown=[...new Set(inventory.entities.map(e=>e.type).filter(t=>!SUPPORTED.has(t)))];
 const dimensions=inventory.entities.filter(e=>e.type==='DIMENSION').length;
 const inserts=inventory.entities.filter(e=>e.type==='INSERT').length;
 const text=inventory.entities.filter(e=>e.type==='TEXT'||e.type==='MTEXT').length;
 return {status:'requires-human-problem-answer-separation',
  unitsCode:inventory.insunits,layers:inventory.layers.length,
  blockCount:inventory.blocks.length,entityCount:inventory.entities.length,
  dimensionCount:dimensions,insertCount:inserts,textCount:text,
  unsupportedEntityTypes:unknown,
  allEntitiesInterpreted:unknown.length===0,
  dimensionsVerified:false,blockTransformsVerified:false,
  problemConditionsConfirmed:false,referenceAnswerIsolated:false,
  mathSolved:false,constructionDagVerified:false,singleV5Verified:false};
}
module.exports={auditDxfInventory};
