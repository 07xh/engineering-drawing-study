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
test('Cut back stock surface source away from side walls has an entire open source hidden ray',()=>{
 const r=prove({source:line('ExteriorBack',p(1,5,0),p(3,5,0)),
  stock,cutter,view:'H'});
 assert.equal(r.status,'certified-strictly-hidden');
 assert.equal(r.cutterPerpendicularStrictSeparationAxis,'x');
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

test('V side view: through-bore vertical inner wall has a common strict front-stock slab, not a guessed hidden line',()=>{
 const ray=prove({source:line('BoreV',p(4,4,0),p(4,4,10)),
  stock,cutter,view:'V'});
 assert.equal(ray.originalStockRayStatus,'undetermined');
 assert.equal(ray.status,'certified-strictly-hidden');
 assert.equal(ray.reason,'common-front-stock-material-slab-outside-subtractive-cutter');
 assert.deepEqual(ray.commonFrontSubtractiveMaterialSlab,{
  axis:'y',lowerExclusiveMm:0,upperExclusiveMm:4,
  fixedCommonFrontMaterialDepthExists:true,
  allOriginalOpenSourcePerpendicularCoordinatesStrictlyWithinStock:true
 });
 assert.equal(ray.everyOpenSourcePointHasCommonStrictFrontMaterialDepth,true);
 assert.equal(ray.closedEndpointAndAllProjectedNativeJunctionsCertified,false);
 assert.equal(ray.signedV5Action,false);
});
test('W side view: observer +X proves identical Cut wall depth with opposite native edge orientation',()=>{
 for(const [a,b] of [[p(6,6,0),p(6,6,10)],
                     [p(6,6,10),p(6,6,0)]]){
  const r=prove({source:line('BoreW',a,b),stock,cutter,view:'W'});
  assert.equal(r.status,'certified-strictly-hidden');
  assert.equal(r.commonFrontSubtractiveMaterialSlab.axis,'x');
  assert.equal(r.commonFrontSubtractiveMaterialSlab.lowerExclusiveMm,6);
  assert.equal(r.commonFrontSubtractiveMaterialSlab.upperExclusiveMm,10);
  assert.equal(r.constructionIntentAuthorized,false);
 }
});
test('H through-axis has NO fictional material slab: cutter traverses entire axial stock',()=>{
 const r=prove({source:line('BoreH',p(4,5,1),p(4,5,9)),
  stock,cutter,view:'H'});
 assert.equal(r.commonFrontSubtractiveMaterialSlab,null);
 assert.equal(r.status,'undetermined');
 assert.equal(r.signedV5Action,false);
});
test('a coincident exterior stock wall must NOT be mislabeled strict interior by the new slab lemma',()=>{
 const r=prove({source:line('StockTangency',p(0,4,3),p(0,4,7)),
  stock,cutter,view:'V'});
 assert.equal(r.commonFrontSubtractiveMaterialSlab,null);
 assert.equal(r.status,'undetermined');
});
test('when cutter reaches the observer-facing outer stock plane there is no separate front-material slab',()=>{
 const frontCut={...cutter,min:[4,0,-1]};
 const r=prove({source:line('NoSlabV',p(4,4,0),p(4,4,10)),
  stock,cutter:frontCut,view:'V'});
 assert.equal(r.commonFrontSubtractiveMaterialSlab,null);
 assert.equal(r.status,'undetermined');
});
test('one positive binary64 step of front material is NOT silently snapped away',()=>{
 const q={...cutter,min:[4,Number.MIN_VALUE,-1],max:[6,6,11]};
 const source=line('ExactGap',p(4,4,0),p(4,4,10));
 const r=prove({source,stock,cutter:q,view:'V'});
 assert.equal(r.status,'certified-strictly-hidden');
 assert.equal(r.commonFrontSubtractiveMaterialSlab.lowerExclusiveMm,0);
 assert.equal(r.commonFrontSubtractiveMaterialSlab.upperExclusiveMm,Number.MIN_VALUE);
 const touching={...q,min:[4,0,-1]};
 const held=prove({source,stock,cutter:touching,view:'V'});
 assert.equal(held.commonFrontSubtractiveMaterialSlab,null);
 assert.equal(held.status,'undetermined');
 assert.equal(held.signedV5Action,false);
});
