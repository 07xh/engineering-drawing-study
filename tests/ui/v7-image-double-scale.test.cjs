'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {reviewDoubleScale,validSavedCalibration}=
 require('../../project/source-calibration.cjs');
const {newProject,createCoordinator,exportProject,importProject}=
 require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const A={pixelDistance:100,mmDistance:20};
const B={pixelDistance:150,mmDistance:30};
test('two independent image scales must be numerically consistent and finite',()=>{
 const checked=reviewDoubleScale([A,B]);
 assert.equal(checked.mmPerPixel,0.2);
 assert.equal(checked.relativeDisagreement,0);
 assert.equal(checked.confirmedBy,'ManualTwoScale');
 assert.equal(validSavedCalibration(checked),true);
 assert.ok(Object.isFrozen(checked));
 assert.throws(()=>reviewDoubleScale([A,{pixelDistance:150,mmDistance:45}]),/比例不一致/);
 for(const bad of [0,-1,Infinity,NaN,1e10]){
  assert.throws(()=>reviewDoubleScale([{pixelDistance:bad,mmDistance:20},B]));
 }
 assert.throws(()=>reviewDoubleScale([A]),/两组/);
 assert.throws(()=>reviewDoubleScale([A,{pixelDistance:150,mmDistance:0}]),/有效正数/);
});
test('tampered ratio, forged second measurement or extra proof cannot survive local import',()=>{
 const c=reviewDoubleScale([A,B]);
 for(const forged of [
  {...c,mmPerPixel:0.23},
  {...c,relativeDisagreement:0.4},
  {...c,measurements:[A,{pixelDistance:150,mmDistance:45}]},
  {...c,extraVerified:true},
  {...c,confirmedBy:'MachineProof'}
 ])assert.equal(validSavedCalibration(forged),false);
 const original=newProject({id:'CalibrationP',task:'projection'});
 original.source.imageId='Img1';
 original.source.calibration={...c,mmPerPixel:0.25};
 assert.throws(()=>importProject(JSON.stringify(original)),/原图|比例校准/);
 assert.equal(validSavedCalibration({mmPerPixel:0.2,confirmedBy:'LegacyUser'}),true,
  'legacy one-scale projects are readable but not upgraded to dual review');
});
test('rotating or recalibrating image invalidates confirmed solver results and stores two checks only locally',()=>{
 const coord=createCoordinator(newProject({id:'SourceRevision',task:'projection'}));
 const solver=createUnifiedProjectSession();coord.attachSolver(solver);
 coord.setImage('Img1');
 coord.putObject({id:'Point1',kind:'point',spatialId:'Point1_3D',
  projections:{V:['Point1_V'],H:['Point1_H'],W:['Point1_W']}});
 coord.putCondition({id:'coords',objectId:'Point1',sourceCandidateId:null,
  confirmed:false,value:{type:'point-xyz',unit:'mm',xyz:[5,6,7],imageId:'Img1'}});
 coord.confirmCondition('coords');
 const result=solver.solve(),revision=coord.snapshot().revision;
 assert.equal(coord.canExport(),true);
 const c=reviewDoubleScale([A,B]);
 coord.setImageGeometry({rotationDeg:90,calibration:c});
 const p=coord.snapshot();
 assert.equal(p.revision,revision+1);
 assert.equal(p.source.rotationDeg,90);
 assert.equal(p.source.calibration.mmPerPixel,0.2);
 assert.equal(p.conditions[0].confirmed,false);
 assert.equal(coord.canExport(),false);
 assert.equal(result.clock.canRender(p.revision),false);
 assert.equal(solver.readSnapshot(),null);
 const restored=importProject(exportProject(p));
 assert.deepEqual(restored.source.calibration.measurements,[A,B]);
 assert.equal(restored.conditions[0].confirmed,false);
 coord.setImageGeometry({rotationDeg:90,calibration:null});
 assert.equal(coord.snapshot().source.calibration,null);
 assert.equal(coord.snapshot().revision,p.revision+1);
 coord.dispose();
});
