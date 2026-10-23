'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditDxfInventory:audit}=require('../fixtures/private-dxf-inventory-audit.cjs');
test('DXF inventory preserves units, layers, blocks, dimensions without claiming solution',()=>{
 const r=audit({format:'DXF',insunits:4,layers:['0','DIM'],blocks:['TITLE'],entities:[
  {type:'LINE',layer:'0'},{type:'DIMENSION',layer:'DIM'},
  {type:'INSERT',layer:'0'},{type:'MTEXT',layer:'DIM'}]});
 assert.equal(r.status,'requires-human-problem-answer-separation');
 assert.equal(r.unitsCode,4);
 assert.equal(r.dimensionCount,1);
 assert.equal(r.insertCount,1);
 assert.equal(r.problemConditionsConfirmed,false);
 assert.equal(r.singleV5Verified,false);
});
test('unitless and invalid layer references fail closed',()=>{
 assert.equal(audit({format:'DXF',insunits:0,layers:['0'],blocks:[],entities:[]}).status,'not-verified');
 assert.equal(audit({format:'DXF',insunits:4,layers:['0'],blocks:[],entities:[{type:'LINE',layer:'MISSING'}]}).status,'not-verified');
});
test('unknown entity types are surfaced rather than silently discarded',()=>{
 const r=audit({format:'DXF',insunits:4,layers:['0'],blocks:[],entities:[{type:'3DSOLID',layer:'0'}]});
 assert.deepEqual(r.unsupportedEntityTypes,['3DSOLID']);
 assert.equal(r.allEntitiesInterpreted,false);
});
