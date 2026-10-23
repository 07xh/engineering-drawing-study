'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {photoFit,clientToPhoto,measuredPixels}=
 require('../../project/photo-measurements.cjs');
const {reviewDoubleScale,validSavedCalibration}=
 require('../../project/source-calibration.cjs');
const {newProject,importProject,exportProject}=
 require('../../project/project-coordinator.cjs');
test('object-fit contained image maps client clicks to immutable original pixels',()=>{
 const rect={left:100,top:50,width:400,height:300};
 const fit=photoFit(rect,1000,500);
 assert.deepEqual(fit,{factor:0.4,left:100,top:100,width:400,height:200});
 assert.deepEqual(clientToPhoto({clientX:300,clientY:200,rect,
  naturalWidth:1000,naturalHeight:500}),{x:500,y:250});
 assert.throws(()=>clientToPhoto({clientX:300,clientY:70,rect,
  naturalWidth:1000,naturalHeight:500}),/留白/);
 assert.throws(()=>clientToPhoto({clientX:Infinity,clientY:200,rect,
  naturalWidth:1000,naturalHeight:500}),/坐标无效/);
 assert.throws(()=>photoFit({...rect,width:0},1000,500),/无效/);
});
test('pixel endpoints yield real Euclidean length and reject zero or forged spans',()=>{
 const p1=[{x:10,y:20},{x:70,y:100}];
 const p2=[{x:15,y:15},{x:15,y:165}];
 assert.equal(measuredPixels(p1),100);
 assert.equal(measuredPixels(p2),150);
 assert.throws(()=>measuredPixels([p1[0],p1[0]]),/零长度/);
 assert.throws(()=>measuredPixels([{x:-1,y:0},p1[1]]),/有效/);
 const reviewed=reviewDoubleScale([
  {pixelDistance:100,mmDistance:20,pixelPoints:p1},
  {pixelDistance:150,mmDistance:30,pixelPoints:p2}
 ]);
 assert.equal(reviewed.mmPerPixel,0.2);
 assert.equal(validSavedCalibration(reviewed),true);
 assert.equal(reviewed.measurements[0].pixelPoints.length,2);
 assert.ok(Object.isFrozen(reviewed.measurements[0].pixelPoints));
 assert.throws(()=>reviewDoubleScale([
  {pixelDistance:99,mmDistance:20,pixelPoints:p1},
  {pixelDistance:150,mmDistance:30,pixelPoints:p2}
 ]),/端点与记录长度不一致/);
 const fake={...reviewed,measurements:[
  {...reviewed.measurements[0],pixelPoints:[{x:10,y:20},{x:50,y:20}]},
  reviewed.measurements[1]
 ]};
 assert.equal(validSavedCalibration(fake),false);
});
test('local project roundtrip preserves original pixel landmarks without inheriting verified solver results',()=>{
 const cal=reviewDoubleScale([
  {pixelDistance:100,mmDistance:20,pixelPoints:[{x:0,y:0},{x:100,y:0}]},
  {pixelDistance:150,mmDistance:30,pixelPoints:[{x:0,y:0},{x:0,y:150}]}
 ]);
 const p=newProject({id:'PhotoReviewed',task:'projection'});
 p.source={imageId:'Photo1',rotationDeg:90,calibration:cal};
 const restored=importProject(exportProject(p));
 assert.deepEqual(restored.source.calibration.measurements[0].pixelPoints,
  [{x:0,y:0},{x:100,y:0}]);
 assert.equal(Object.hasOwn(restored,'verified'),false);
 assert.equal(Object.hasOwn(restored,'playerState'),false);
 assert.throws(()=>importProject(JSON.stringify({...p,verified:true})),/已验证/);
});
