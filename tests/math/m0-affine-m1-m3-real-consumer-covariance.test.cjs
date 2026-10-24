'use strict';
/** Live M1 / M3 mathematical consumers of the SINGLE M0 affine module.
 * Independent analytic transformation laws, not self-comparison of matrices.
 * Every input is explicitly model-mm; no scanned image source is authenticated.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {transformPoint,transformDirection,composeAffine}=
 require('../../core/numeric/affine-transform.cjs');
const {analyzeSegmentTopology:M1}=
 require('../../core/geometry/segment-topology2d.cjs');
const {prismPlaneSection:M3Prism}=
 require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {intersectCylinderSidePlane:M3Cylinder,intersectFiniteSegmentPlane:M3Segment}=
 require('../../engines/spatial/sections/axis-cylinder-plane.cjs');
const {inspectProjectedEdgeDepth:depth}=
 require('../../core/numeric/projected-edge-depth-events.cjs');
const {project}=require('../../core/projection/conventions.js');
const point=(x,y,z)=>({x,y,z});
const xy=(x,y)=>({x,y});
const mat2=(a,b,c,d,tx,ty)=>[[a,b,tx],[c,d,ty],[0,0,1]];
const mat3=(k,tx,ty,tz)=>[[k,0,0,tx],[0,k,0,ty],[0,0,k,tz],[0,0,0,1]];
const apply2=(matrix,p)=>{
 const v=transformPoint(matrix,[p.x,p.y]);return xy(v[0],v[1]);
};
const apply3=(matrix,p)=>{
 const v=transformPoint(matrix,[p.x,p.y,p.z]);return point(v[0],v[1],v[2]);
};
const vector3=(matrix,p)=>{
 const v=transformDirection(matrix,[p.x,p.y,p.z]);return point(v[0],v[1],v[2]);
};
const segment=(a,b)=>({frame:'model-mm-2d',unit:'mm',from:a,to:b});
const edge=(id,a,b)=>({id,from:a,to:b});
const near=(actual,expected,eps=1e-8)=>assert.ok(
 Number.isFinite(actual)&&Math.abs(actual-expected)<=eps,
 String(actual)+' vs '+String(expected));
test('real M1 proper crossing, endpoint touch, and collinear overlap invariant under invertible model-mm affine maps',()=>{
 const pairs=[
  ['proper-crossing',segment(xy(0,0),xy(8,8)),segment(xy(0,8),xy(8,0))],
  ['endpoint-touch',segment(xy(0,0),xy(10,0)),segment(xy(10,0),xy(10,10))],
  ['collinear-overlap',segment(xy(0,0),xy(10,0)),segment(xy(2,0),xy(8,0))],
  ['disjoint',segment(xy(0,0),xy(10,0)),segment(xy(0,4),xy(10,4))]
 ];
 // Includes negative-determinant reflection and anisotropic scaling.
 const matrices=[mat2(1,0,0,1,0,0),mat2(0,-2,2,0,100,-50),
  mat2(-1,0,0,1,16,-8),mat2(.5,0,0,4,-30,20),
  mat2(1,0,0,1,1000000,-2000000)];
 for(const [expected,a,b] of pairs){
  const baseline=M1({first:a,second:b});
  assert.equal(baseline.relation,expected);
  for(const matrix of matrices){
   const x=segment(apply2(matrix,a.from),apply2(matrix,a.to));
   const y=segment(apply2(matrix,b.from),apply2(matrix,b.to));
   const actual=M1({first:x,second:y});
   assert.equal(actual.relation,expected);
   assert.equal(actual.exactForBinary64Inputs,true);
   assert.equal(actual.sourceGeometryVerified,false);
   assert.equal(actual.globallyUnique,null);
   // Endpoint coordinates are transformed mathematical positions, not guesses.
   if(expected==='endpoint-touch')
    assert.deepEqual(actual.intersectionPoint,apply2(matrix,xy(10,0)));
  }
 }
});
test('real M3 rectangular prism planar cross section obeys analytic area/perimeter affine covariance and canonical V/H/W',()=>{
 const min=point(0,0,0),max=point(10,8,12),
  cut={point:point(0,0,6),normal:point(0,0,1)};
 for(const k of [.5,1,2,4]){
  for(const shift of [point(0,0,0),point(100,-40,24)]){
   const matrix=mat3(k,shift.x,shift.y,shift.z);
   const box={min:apply3(matrix,min),max:apply3(matrix,max)};
   const plane={point:apply3(matrix,cut.point),
    normal:vector3(matrix,cut.normal)};
   const result=M3Prism(box,plane);
   assert.equal(result.status,'ready');
   assert.equal(result.vertices.length,4);
   assert.equal(result.areaMm2,80*k*k);
   assert.equal(result.perimeterMm,36*k);
   assert.equal(result.modelUnit,'mm');
   assert.equal(result.visibilityVerified,false);
   assert.equal(result.v5StepsReady,false);
   for(const v of result.vertices){
    near(v.point.z,shift.z+6*k);
    assert.deepEqual(v.projection,project(v.point));
    for(const axis of ['x','y','z'])
     assert.ok(v.point[axis]>=box.min[axis]&&v.point[axis]<=box.max[axis]);
   }
  }
 }
});
test('real M3 finite cylinder and finite segment / plane preserve exact mm parameter under common affine translation + uniform scaling',()=>{
 const cylinder={baseCenter:point(2,-3,0),radiusMm:5,heightMm:30},
  plane={point:point(0,0,15),normal:point(0,0,1)};
 const source={a:point(0,0,0),b:point(0,0,20)},
  segmentPlane={point:point(0,0,5),normal:point(0,0,1)};
 for(const k of [.5,1,2,4]){
  for(const shift of [point(0,0,0),point(-50,40,-20)]){
   const m=mat3(k,shift.x,shift.y,shift.z);
   const shape={baseCenter:apply3(m,cylinder.baseCenter),
    radiusMm:5*k,heightMm:30*k};
   const sectionPlane={point:apply3(m,plane.point),
    normal:vector3(m,plane.normal)};
   const r=M3Cylinder(shape,sectionPlane,{samples:32});
   assert.equal(r.status,'ready');
   assert.equal(r.analyticCurveVerified,true);
   assert.equal(r.points.length,33);
   assert.equal(r.requiresSolidCapAnalysis,false);
   assert.equal(r.globallyUnique,null);
   for(const v of r.points){
    near(Math.hypot(v.x-shape.baseCenter.x,v.y-shape.baseCenter.y),5*k,1e-7);
    near(v.z,shift.z+15*k,1e-7);
   }
   const line={a:apply3(m,source.a),b:apply3(m,source.b)};
   const pl={point:apply3(m,segmentPlane.point),
    normal:vector3(m,segmentPlane.normal)};
   const t=M3Segment(line,pl);
   assert.equal(t.status,'intersect');
   assert.equal(t.parameter,.25);
   assert.deepEqual(t.projection,project(t.point));
   near(t.point.z,shift.z+5*k);
   assert.equal(t.globallyUnique,null);
  }
 }
});
test('real first-angle pairwise 3D edge depth compares scaled physical depths, never yields final line style',()=>{
 const samples=[
  ['H',edge('H1',point(-5,0,0),point(5,0,0)),
   edge('H2',point(0,-5,2),point(0,5,2))],
  ['V',edge('V1',point(-5,2,0),point(5,2,0)),
   edge('V2',point(0,-3,-5),point(0,-3,5))],
  ['W',edge('W1',point(1,-5,0),point(1,5,0)),
   edge('W2',point(3,0,-5),point(3,0,5))]
 ];
 for(const [view,a,b] of samples){
  const baseline=depth({first:a,second:b,view});
  assert.equal(baseline.status,'crossing');
  assert.equal(baseline.events[0].front,'second');
  for(const k of [.5,1,2,4]){
   const matrix=mat3(k,100,-30,20);
   const A=edge(a.id,apply3(matrix,a.from),apply3(matrix,a.to)),
    B=edge(b.id,apply3(matrix,b.from),apply3(matrix,b.to));
   const actual=depth({first:A,second:B,view});
   assert.equal(actual.status,'crossing');
   assert.equal(actual.events[0].front,'second');
   near(actual.events[0].depthDeltaMm,k*baseline.events[0].depthDeltaMm);
   assert.equal(actual.completeOcclusionVerified,false);
   assert.equal(actual.endpointJoinVerified,false);
   assert.equal(actual.contourLineStyleVerified,false);
   assert.equal(actual.v5Ready,false);
  }
 }
});
test('affine composition equals independent nested transform, directions never pick up translations',()=>{
 const m=mat3(2,20,-30,40),n=mat3(.5,-10,5,-7);
 const composed=composeAffine(m,n,3);
 for(const p of [point(1,2,3),point(-7,8,9)]){
  assert.deepEqual(apply3(composed,p),apply3(m,apply3(n,p)));
  const v=vector3(composed,p);
  assert.deepEqual(v,point(p.x,p.y,p.z));
 }
});
test('noninvertible, unlabeled pixels and unrepresentable lengths cannot acquire an M1/M3 mathematical signature',()=>{
 const flatten2=mat2(0,0,0,0,0,0);
 const a=segment(apply2(flatten2,xy(0,0)),apply2(flatten2,xy(10,10)));
 assert.throws(()=>M1({first:a,second:segment(xy(0,0),xy(5,0))}),/degenerate/);
 assert.throws(()=>M1({first:{...a,unit:'px'},second:segment(xy(0,0),xy(5,0))}),/model-mm/);
 const flatten3=mat3(0,0,0,0),min=apply3(flatten3,point(0,0,0)),
  max=apply3(flatten3,point(10,10,10));
 assert.throws(()=>M3Prism({min,max},{point:point(0,0,0),
  normal:point(0,0,1)}),/positive mm extents/);
 assert.throws(()=>transformPoint(mat3(1e308,0,0,0),[1e308,0,0]),RangeError);
});
