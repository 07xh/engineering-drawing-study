'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {classifyMultiBodyProjectedUnion:union}=
 require('../../core/verification/multibody-projected-union.cjs');
const {evaluateReviewedConvexMeshDepth:evaluate}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,a,b){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?b.x:a.x,y?b.y:a.y,z?b.z:a.z);
 const edges=[],ids=Object.keys(points);
 for(const [i,k]of ids.entries())for(const v of ids.slice(i+1))
  if([1,2,3].filter(n=>k[n]!==v[n]).length===1)edges.push([k,v]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
const a=box('One',P(0,0,0),P(10,10,10));
test('one convex solid supplies V/H/W four mathematical projected union open boundaries',()=>{
 const r=union({geometry:[a],revision:33});
 assert.equal(r.status,'open-boundary-geometry-only');
 assert.equal(r.segmentCount,12);
 assert.equal(r.openBoundaryCount,12);
 assert.equal(r.coveredBoundaryCount,0);
 assert.equal(r.undeterminedCount,0);
 assert.ok(['V','H','W'].every(v=>r.segments.filter(s=>s.view===v).length===4));
 assert.ok(r.segments.every(s=>s.projectedOpenInteriorBoundaryVerified&&
  !s.multiBodyDepthVisibilityVerified&&!s.officialLineStyleVerified));
 assert.equal(r.unionClosedContourVerified,false);
 assert.equal(r.v5Ready,false);
 assert.ok(Object.isFrozen(r.segments[0].sourceParameterRange));
});
test('two separated convex bodies remain two sets of geometric projection outer boundaries, not certified hidden-line styles',()=>{
 const b=box('Far',P(20,22,24),P(30,32,34));
 const r=union({geometry:[a,b],revision:12});
 assert.equal(r.openBoundaryCount,24);
 assert.equal(r.coveredBoundaryCount,0);
 assert.equal(r.undeterminedCount,0);
 assert.equal(r.multiBody3DVisibilityVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
});
test('overlapping projected bodies split source outer edges into covered and retained open intervals',()=>{
 const b=box('Offset',P(5,4,3),P(15,14,13));
 const r=union({geometry:[a,b],revision:24});
 assert.ok(r.segmentCount>24,'intersections must partition multiple hull sides');
 assert.ok(r.coveredBoundaryCount>0,'some source hull edges project strictly inside another solid');
 assert.ok(r.openBoundaryCount>0,'some union boundary parts remain exterior');
 assert.ok(r.segments.some(s=>s.sourceParameterRange[0]>0&&
   s.sourceParameterRange[0]<1));
 assert.equal(r.unionClosedContourVerified,false);
 assert.equal(r.multiBody3DVisibilityVerified,false);
});
test('coincident projections and touching common outer borders never become falsely certified visible contours',()=>{
 const sameXY=box('SameProjection',P(0,0,20),P(10,10,30));
 const r=union({geometry:[a,sameXY],revision:25});
 assert.ok(r.undeterminedCount>0);
 assert.ok(r.segments.some(s=>s.view==='H'&&s.status==='undetermined'));
 assert.ok(r.segments.every(s=>s.officialLineStyleVerified===false));
});
test('invalid meshes, stale source revision, duplicate ids and unsupported mixed 2D reject closed proof',()=>{
 const bad=box('Bad',P(0,0,0),P(1,2,3));
 bad.data.faces.pop();
 assert.throws(()=>union({geometry:[bad],revision:5}),/closed convex/);
 assert.throws(()=>union({geometry:[a],revision:-1}),/revision/);
 assert.throws(()=>union({geometry:[a,a],revision:5}),/duplicate/);
 const not3d={id:'TwoD',kind:'point',space:'drawing-2d',unit:'mm',data:{x:1,y:2}};
 const r=evaluate({geometry:[a,not3d],revision:4});
 assert.equal(r.projectedUnionOutlines.status,'not-covered');
});
test('existing M5 source scene carries geometric interval classification alongside real ray-depth and stroke partitions',()=>{
 const b=box('Shifted',P(5,4,3),P(15,14,13));
 const result=evaluate({geometry:[a,b],revision:92});
 assert.equal(result.projectedUnionOutlines.status,'open-boundary-geometry-only');
 assert.equal(result.projectedUnionOutlines.revision,92);
 assert.ok(result.projectedUnionOutlines.segmentCount>24);
 assert.equal(result.projectedUnionOutlines.officialLineStylesVerified,false);
 assert.equal(result.projectedStrokePartitions.v5Ready,false);
 assert.equal(result.v5Ready,false);
});
