'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1OriginalStrokeFinalPreconditions:audit}=
 require('../../workbench/c1-m5-final-source-stroke-preconditions.cjs');
const p=(x,y,z)=>({x,y,z});
function box(){
 const g=prismMesh({solid:{min:p(0,0,0),max:p(2,4,9)}});
 return {...g,id:'C1FinalPreconditionOblique',data:{
  ...g.data,points:Object.fromEntries(Object.entries(g.data.points).map(
   ([id,v])=>[id,{x:v.x+v.y/2,y:v.y,z:v.z}]))}};
}
const opts=(oc,geometry,revision)=>({oc,geometry,revision});
test('cannot accept mocked real OCJS or a stale original source revision',()=>{
 const g=box();
 assert.throws(()=>audit(opts(null,g,1)),/real OpenCascade/);
 assert.throws(()=>audit(opts({},g,0)),/revision/);
 assert.throws(()=>audit(opts({},{
  ...g,data:{...g.data,faces:g.data.faces.slice(1)}
 },1)),/closed|face|Euler/);
});
test('fake caller CAD/M5 proof cannot replace genuine real kernel computation',()=>{
 const g=box();
 const attempted={sourceGeometryId:g.id,revision:1,
  CADComputedGenuineOpenCascadeWasm:true,
  officialV5ActionCount:42,standardEngineeringStylesCertified:true};
 assert.throws(()=>audit({...opts({},g,1),
  physicalEvidence:attempted}),/OCJS|OpenCascade|TopAbs|BRep/);
});
test('source line obligations never assume a source priority or CAD hit certifies a whole engineering line',()=>{
 const g=box();
 assert.throws(()=>audit({...opts({},g,1),
  physicalEvidence:{signedV5ActionCount:1}}),/OCJS|OpenCascade|TopAbs|BRep/);
});
