'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {describeSourceFeature:describe}=require('../../project/source-feature-selection-label.cjs');
test('precise original mesh source has readable endpoints without inferred engineering line style',()=>{
 assert.equal(describe({objectId:'Cube',key:JSON.stringify(['Cube','mesh-edge','A','B'])}),
  '实体棱线 A—B');
 assert.equal(describe({objectId:'Curve1',key:JSON.stringify(['Curve1','polyline-span',7])}),
  '折线第 8 段');
 assert.equal(describe({objectId:'C3Branch3D1',key:JSON.stringify(['C3Branch3D1','analytic-curve'])}),
  '空间相贯曲线来源');
 assert.equal(describe({objectId:'P',key:JSON.stringify(['P','point'])}),'空间点');
});
test('source feature display cannot accept a forged other object or unsafe/free text source key',()=>{
 assert.equal(describe({objectId:'Cube',key:JSON.stringify(['Other','mesh-edge','A','B'])}),null);
 assert.equal(describe({objectId:'Cube',key:'not json'}),null);
 assert.equal(describe({objectId:'Cube',key:JSON.stringify(['Cube','mesh-edge','A\nB','C'])}),null);
 assert.equal(describe({objectId:'Cube',key:JSON.stringify(['Cube','polyline-span',-1])}),null);
 assert.equal(describe({objectId:'Cube',key:JSON.stringify(['Cube','mesh-edge','A'])}),null);
 assert.equal(describe({objectId:'Cube',key:'a'.repeat(1025)}),null);
});
