'use strict';
/*
 * One canonical Geometry object -> all first-angle orthographic views.
 *
 * This is a pure presentation of ALREADY COMPUTED mathematical geometry.
 * It does not solve missing geometry, prove a section, establish visibility,
 * issue a SolveResult, certify an Intent or create a V5 player.
 * The sole projection convention is core/projection/conventions.js.
 */
const {validateGeometry} = require('../contracts/geometry.js');
const {identifier, finite} = require('../contracts/common.js');
const {project, VIEWS} = require('./conventions.js');

const SCHEMA = 'draftai-geometry-scene-views/1.0.0';
const COPY = value => JSON.parse(JSON.stringify(value));
const EPS = 1e-12;
function fail(message) { throw new Error(message); }
function xyz(point) { return {x:point.x, y:point.y, z:point.z}; }
function addVector(a, b) {
  const p = {x:a.x+b.x,y:a.y+b.y,z:a.z+b.z};
  if (!Object.values(p).every(finite)) fail('空间直线坐标超出有限计算范围');
  return p;
}
function viewPoint(p, view) { return project(p)[view]; }
function viewSegment(start, end, view) {
  const a = viewPoint(start,view),b = viewPoint(end,view);
  const span = Math.hypot(a.u-b.u,a.v-b.v);
  if (!finite(span)) fail('投影线段超出数值范围');
  // A 3D edge seen along the viewing direction collapses to a 2D point.
  return span <= EPS
    ? {kind:'point', at:a, collapsedFrom:'segment'}
    : {kind:'segment', start:a, end:b};
}
function viewLine(data, view) {
  const p = viewPoint(data.point,view),q = viewPoint(addVector(data.point,data.direction),view);
  const delta = {u:q.u-p.u,v:q.v-p.v};
  const span = Math.hypot(delta.u,delta.v);
  if (!finite(span)) fail('投影直线方向超出数值范围');
  return span <= EPS
    ? {kind:'point', at:p, collapsedFrom:'line'}
    : {kind:'line', point:p, direction:delta};
}
function viewMesh(data,view) {
  const points = Object.create(null);
  for(const [vertexId,p] of Object.entries(data.points))
    points[vertexId] = viewPoint(p,view);
  // Preserve exact topology from the canonical 3D geometry. No silhouette or
  // visibility claims can be made from the projected edge list alone.
  const edges=data.edges.map(([a,b]) => ({
    fromId:a, toId:b,
    projection:viewSegment(data.points[a],data.points[b],view)
  }));
  return {kind:'mesh-projection',points,edges,
    faces:data.faces.map(face => [...face]),visibility:'undetermined'};
}
function deriveOne(g) {
  const c=validateGeometry(g);
  if(!c.ok)fail('不合法的几何对象 '+String(g?.id)+': '+c.errors.join('；'));
  if(g.space==='drawing-2d') {
    return {id:g.id,kind:g.kind,space:g.space,model:COPY(g),
      representations:{drawing:COPY(g),V:null,H:null,W:null,'3D':null},
      projectableViews:[]};
  }
  const representations={drawing:null,V:null,H:null,W:null,'3D':COPY(g)};
  for(const view of VIEWS) {
    if(g.kind==='point') representations[view]={kind:'point',at:viewPoint(g.data,view)};
    else if(g.kind==='segment')
      representations[view]=viewSegment(g.data.start,g.data.end,view);
    else if(g.kind==='line') representations[view]=viewLine(g.data,view);
    else if(g.kind==='mesh') representations[view]=viewMesh(g.data,view);
    else if(g.kind==='plane') {
      // An infinite plane has no finite 2D boundary. Deriving a clipped sheet
      // polygon would invent a viewport-dependent geometric construction.
      representations[view]={kind:'unbounded-plane',outline:null,
        reason:'三维平面仅有法向与偏移，未给出有限边界'};
    } else fail('尚不能从该空间对象计算投影 '+g.kind);
  }
  return {id:g.id,kind:g.kind,space:g.space,model:COPY(g),
    representations,projectableViews:[...VIEWS]};
}
function deriveGeometryScene({geometry,revision,branchId=null,resultId=null}={}) {
  if (!Array.isArray(geometry) || geometry.length>2000)
    fail('统一场景需要有限数量的已计算 Geometry 对象');
  if (!Number.isSafeInteger(revision) || revision<0)
    fail('统一场景缺少有效的输入版本');
  if (branchId!==null && !identifier(branchId)) fail('场景分支 ID 不合法');
  if (resultId!==null && !identifier(resultId)) fail('结果引用 ID 不合法');
  const ids = new Set(), objects = [];
  for(const g of geometry){
    if(ids.has(g?.id))fail('统一场景 Geometry.id 不允许重复: '+g.id);
    const entity=deriveOne(g);
    ids.add(entity.id);
    objects.push(entity);
  }
  return {schema:SCHEMA,revision,branchId,resultId,coordinateUnit:'mm',
    viewMethod:'first-angle-orthographic',objects,
    evidence:{
      math:'requires-canonical-solve-result',
      visibility:'undetermined',
      v5:'requires-verified-construction-intent'
    }};
}
function projectSelectionLinks(scene) {
  if(!scene || scene.schema!==SCHEMA || !Array.isArray(scene.objects))
    fail('仅可映射统一场景中的真实 Geometry 对象');
  // All output keys are view-scoped; a stable object ID owns one projection
  // representation per plane, without recomputing 3D geometry in the view UI.
  return scene.objects.map(obj => ({
    objectId: obj.id,kind:obj.kind,
    representations: Object.fromEntries(['drawing','V','H','W','3D'].map(view => [
      view, obj.representations[view]===null ? null : {
        objectId:obj.id,view,entityKey:JSON.stringify([obj.id,view])
      }
    ]))
  }));
}
module.exports={SCHEMA,deriveGeometryScene,projectSelectionLinks};
