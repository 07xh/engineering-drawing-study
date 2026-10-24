'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {build3DSourceFeatureGraph:graph}=
 require('../../core/topology/source-feature-graph-3d.cjs');
const {auditC3Merged3DSourceGraph:audit}=
 require('../../workbench/c3-merged-3d-source-graph.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const p=(x,y,z)=>({x,y,z});
test('generic M4 spatial graph splits true crossing straight sources and never signs a line',()=>{
 const r=graph({lineSources:[
  {id:'horizontal',from:p(-2,0,0),to:p(2,0,0)},
  {id:'vertical',from:p(0,-2,0),to:p(0,2,0)}
 ],curveSources:[],curveVertices:[]});
 assert.equal(r.sourceCrossingCount,1);
 assert.equal(r.sourceLineCount,2);
 assert.equal(r.edges.length,4);
 assert.equal(r.vertices.length,5);
 assert.equal(r.components.length,1);
 assert.equal(r.components[0].sourceGraphShape,'branched-source-network');
 const center=r.vertices.find(v=>v.point3D.x===0&&v.point3D.y===0);
 assert.equal(center.incidentEdgeIds.length,4);
 assert.equal(r.allSourceEdgesCoveredExactlyOnce,true);
 assert.ok(r.edges.every(e=>e.officialLineStyle==='undetermined'&&
   e.v5CertifiedStrokeAuthorized===false));
 assert.equal(r.fullCompositeBoundaryTopologyVerified,false);
});
test('curve vertex lying INSIDE line splits true T junction, without inventing curve-interior proof',()=>{
 const r=graph({lineSources:[{
  id:'line',from:p(-2,0,0),to:p(2,0,0)
 }],curveSources:[{id:'c',from:p(0,0,0),to:p(0,1,1)}],
 curveVertices:[{id:'trueCurveVertex',point3D:p(0,0,0)}]});
 assert.equal(r.curveVertexOnLineCount,1);
 assert.equal(r.edges.length,3);
 const center=r.vertices.find(v=>v.point3D.x===0&&v.point3D.y===0);
 assert.equal(center.incidentEdgeIds.length,3);
 assert.equal(r.components.length,1);
 assert.ok(r.edges.filter(e=>e.kind==='line').every(e=>e.sourceId==='line'));
});
test('identical W projection does NOT join separate true 3D curve vertices',()=>{
 const r=graph({lineSources:[],curveSources:[
  {id:'front',from:p(0,2,3),to:p(0,3,4)},
  {id:'behind',from:p(5,2,3),to:p(5,3,4)}
 ],curveVertices:[]});
 assert.equal(r.components.length,2);
 assert.equal(r.vertices.length,4);
 assert.ok(r.projectedCoincidences.some(x=>x.view==='W'));
 assert.ok(r.projectedCoincidences.every(x=>
  x.distinct3DPoints&&x.mayJoinFrom2DProjection===false));
});
test('3D skew, separated and parallel lines cannot falsely connect',()=>{
 const skew=graph({lineSources:[
  {id:'a',from:p(-2,0,0),to:p(2,0,0)},
  {id:'b',from:p(0,-2,1),to:p(0,2,1)}
 ],curveSources:[],curveVertices:[]});
 assert.equal(skew.sourceCrossingCount,0);
 assert.equal(skew.components.length,2);
 const parallel=graph({lineSources:[
  {id:'a',from:p(0,0,0),to:p(2,0,0)},
  {id:'b',from:p(0,1,0),to:p(2,1,0)}
 ],curveSources:[],curveVertices:[]});
 assert.equal(parallel.components.length,2);
});
test('positive-length collinear overlap and invalid sources must remain unsignable',()=>{
 assert.throws(()=>graph({lineSources:[
  {id:'a',from:p(0,0,0),to:p(2,0,0)},
  {id:'b',from:p(1,0,0),to:p(3,0,0)}
 ],curveSources:[],curveVertices:[]}),/collinear positive-length/);
 assert.throws(()=>graph({lineSources:[
  {id:'a',from:p(0,0,0),to:p(0,0,0)}
 ],curveSources:[],curveVertices:[]}),/nonzero 3D/);
 assert.throws(()=>graph({lineSources:[],curveSources:[
  {id:'same',from:p(0,0,0),to:p(1,0,0)}
 ],curveVertices:[{id:'same',point3D:p(0,0,0)}]}),/unique source/);
});
test('C3 baseline fully accounts all 3D lateral sources, with no fictional cap edges',()=>{
 const s=model(),r=audit({input:s,revision:8});
 assert.equal(r.status,'scoped-complete-3d-source-incidence');
 assert.equal(r.originalCapLineSourceCount,0);
 assert.equal(r.originalAnalyticCurveSourceCount,r.sourceCurveCount);
 assert.equal(r.edges.length,r.originalAnalyticCurveSourceCount);
 assert.equal(r.allLateralBranchesAndCapSegmentsCovered,true);
 assert.equal(r.allFiniteCapTerminalsPhysicallyJoined,true);
 assert.equal(r.fullSolidBoundaryTopologyVerified,false);
 assert.equal(r.finalV5CurveAuthorized,false);
 assert.equal(r.standardLineStylesVerified,false);
 assert.ok(Object.isFrozen(r.vertices));
 const j=joint({input:s,revision:8});
 assert.equal(j.sourceFeature3DIncidenceGraphCovered,true);
 assert.equal(j.merged3DSourceGraph.sourceCurveCount,r.sourceCurveCount);
 assert.equal(j.fullCurveTopologyVerified,false);
 assert.equal(j.officialLineStylesVerified,false);
});
test('finite clipped-Y cap/lateral endpoints connect to original M3 curves in one true 3D graph',()=>{
 const s=model();s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const r=audit({input:s,revision:9});
 assert.equal(r.status,'scoped-complete-3d-source-incidence');
 assert.equal(r.originalCapLineSourceCount,2);
 assert.equal(r.lateralCapTerminalCount,4);
 assert.equal(r.lateralCapTerminal3DJoinCount,4);
 assert.ok(r.terminalEvidence.every(t=>
  t.sourceFeatureJoinAtOneTrue3DPoint&&
  t.capFeatureSourceIds.length>0&&
  t.analyticLateralSourceBranchIds.length>0));
 assert.ok(r.edges.some(e=>e.kind==='analytic-curve'));
 assert.ok(r.edges.some(e=>e.kind==='line'));
 assert.equal(r.fullSolidBoundaryTopologyVerified,false);
 const j=joint({input:s,revision:9});
 assert.equal(j.sourceFeature3DIncidenceGraphCovered,true);
 assert.equal(j.sourceFeatureFiniteCapTerminalsJoined,true);
 assert.equal(j.v5CurveReady,false);
});
test('simultaneous Y and Z cap cuts and cap-cap line crossings split source edges safely',()=>{
 const s=model();s.zCylinder.zMin=-5;s.zCylinder.zMax=5;
 s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const r=audit({input:s,revision:7});
 assert.equal(r.status,'scoped-complete-3d-source-incidence');
 assert.equal(r.originalCapLineSourceCount,10);
 assert.equal(r.sourceLineCount,10);
 assert.equal(r.allLateralBranchesAndCapSegmentsCovered,true);
 assert.equal(r.allFiniteCapTerminalsPhysicallyJoined,true);
 assert.ok(r.edges.length>=r.originalAnalyticCurveSourceCount+10);
 assert.ok(r.vertices.every(v=>v.incidentEdgeIds.length>0));
 assert.equal(new Set(r.edges.map(e=>e.id)).size,r.edges.length);
 assert.equal(r.standardLineStylesVerified,false);
 assert.equal(r.fullSolidBoundaryTopologyVerified,false);
});
test('rigid 3D translation preserves graph degree distribution and independent source identities',()=>{
 const a=model(),b=model();
 a.yCylinder.yMin=-6;a.yCylinder.yMax=6;
 b.yCylinder.yMin=-6+14;b.yCylinder.yMax=6+14;
 b.zCylinder.xCenter+=35;b.yCylinder.xCenter+=35;
 b.zCylinder.yCenter+=14;
 b.zCylinder.zMin-=5;b.zCylinder.zMax-=5;
 b.yCylinder.zCenter-=5;
 const A=audit({input:a,revision:4}),B=audit({input:b,revision:5});
 assert.equal(A.status,B.status);
 assert.equal(A.vertices.length,B.vertices.length);
 assert.equal(A.edges.length,B.edges.length);
 assert.equal(A.components.length,B.components.length);
 assert.deepEqual(A.vertices.map(v=>v.incidentEdgeIds.length).sort((x,y)=>x-y),
  B.vertices.map(v=>v.incidentEdgeIds.length).sort((x,y)=>x-y));
 assert.ok(B.allFiniteCapTerminalsPhysicallyJoined);
});
test('near-tangent disallowed source stays undetermined, never creates graph strokes',()=>{
 const s=model();s.zCylinder.zMax=9;
 const r=audit({input:s,revision:2});
 assert.equal(r.status,'not-covered');
 assert.equal(r.edges.length,0);
 assert.equal(r.finalV5CurveAuthorized,false);
});
