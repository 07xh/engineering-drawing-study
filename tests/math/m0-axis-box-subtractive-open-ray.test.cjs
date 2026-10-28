'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {certifyAxisBoxSubtractiveOpenRay:prove}=
 require('../../core/numeric/axis-box-source-open-ray.cjs');
const stock={id:'Stock',type:'box',min:[0,0,0],max:[10,10,10]};
const cutter={id:'Bore',type:'box',min:[4,4,-1],max:[6,6,11]};
const line=(name,from,to)=>({id:name,from,to});
const p=(x,y,z)=>({x,y,z});

test('Cut front stock face retains a strict outward M0 ray proof by set inclusion, no V5',()=>{
 const r=prove({source:line('ExteriorFront',p(0,0,10),p(10,0,10)),
  stock,cutter,view:'H'});
 assert.equal(r.status,'certified-clear');
 assert.equal(r.reason,'subtracted-material-is-subset-of-original-stock');
 assert.equal(r.originalStockRayStatus,'certified-clear');
 assert.equal(r.constructionIntentAuthorized,false);
 assert.equal(r.fullSubtractiveSceneEngineeringLinesCertified,false);
 assert.equal(r.signedV5Action,false);
});
test('Cut back stock edge separated from bore in perpendicular axis has an entire open source hidden ray',()=>{
 const r=prove({source:line('ExteriorBack',p(0,0,0),p(10,0,0)),
  stock,cutter,view:'H'});
 assert.equal(r.status,'certified-strictly-hidden');
 assert.equal(r.cutterPerpendicularStrictSeparationAxis,'y');
 assert.equal(r.eachSourceOpenInteriorRayProved,true);
 assert.equal(r.signedV5Action,false);
});
test('one boundary endpoint and strictly outside open interior is enough; cutter wall equality is not',()=>{
 const out=prove({source:line('PartialBack',p(3,5,0),p(4,5,0)),
  stock,cutter,view:'H'});
 assert.equal(out.status,'certified-strictly-hidden');
 assert.equal(out.cutterPerpendicularStrictSeparationAxis,'x');
 const wall=prove({source:line('BoreWall',p(4,5,0),p(4,6,0)),
  stock,cutter,view:'H'});
 assert.equal(wall.status,'undetermined');
 assert.equal(wall.cutterPerpendicularStrictSeparationAxis,null);
 assert.equal(wall.signedV5Action,false);
});
test('through-cutter projected crossing is not rounded away to a false hidden ray',()=>{
 const r=prove({source:line('CrossBore',p(3,5,0),p(5,5,0)),
  stock,cutter,view:'H'});
 assert.equal(r.status,'undetermined');
 assert.equal(r.eachSourceOpenInteriorRayProved,false);
 assert.equal(r.signedV5Action,false);
});
test('invalid original boxes, observer, and same stock/cutter identity are rejected',()=>{
 assert.throws(()=>prove({source:line('Bad',p(0,0,0),p(10,0,0)),
  stock,cutter:{...cutter,id:'Stock'},view:'H'}),/identities/);
 assert.throws(()=>prove({source:line('Bad',p(0,0,0),p(10,0,0)),
  stock,cutter:{...cutter,min:[4,4,NaN]},view:'H'}),/finite|bounded/);
 assert.throws(()=>prove({source:line('Bad',p(0,0,0),p(10,0,0)),
  stock,cutter,view:'Q'}),/first-angle/);
});
