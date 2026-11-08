'use strict';
/**
 * Cone Lab -> the EXISTING canonical Geometry Scene and local C2 workbench.
 * No renderer, second solver, inferred silhouette, contact proof, or V5.
 *
 * Exact polyhedral scope: oriented box/cube/triangular-pyramid primitives.
 * Curved solids and any cut operations explicitly fail rather than turning
 * sampled surfaces or missing edges into source-certified topology.
 */
const Bridge=require('../labs/cone-lab/model-bridge.js');
const {prismMesh}=require('./unified-workbench-session.cjs');
const {validateGeometry}=require('../core/contracts/geometry.js');
const {deriveGeometryScene}=require('../core/projection/geometry-scene-views.cjs');
const {newProject,validateProject}=require('./project-coordinator.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');

const RAD=Math.PI/180,EPS=1e-9;
const SOURCE_MAIN_SHA=Bridge.SOURCE_SHA;
const P2_SCOPE='cone-lab-exact-polyhedron-mesh/2';
const fail=msg=>{throw new Error('Cone Lab 模型预览：'+msg);};
const finite=n=>typeof n==='number'&&Number.isFinite(n);

function sourceNormal(type,deg){
 const s=Math.sin(deg*RAD),c=Math.cos(deg*RAD);
 if(type==='frontal')return [0,0,1];
 if(type==='horiz')return [0,1,0];
 if(type==='lat')return [1,0,0];
 if(type==='fv')return [s,c,0];
 if(type==='pv')return [c,0,s];
 if(type==='lv')return [0,c,s];
 fail('不支持的部件轴向');
}
// Same quaternion convention as upstream THREE.Quaternion.setFromUnitVectors(Y,n).
function sourcePartQuaternion(p){
 const [nx,ny,nz]=sourceNormal(p.type,p.ang);
 if(ny < -1+1e-6) return [0,0,1,0];
 const q=[nz,0,-nx,1+ny],len=Math.hypot(...q);
 if(!finite(len)||len<=EPS)fail('部件旋转四元数退化');
 return q.map(n=>n/len);
}
function rotate(q,p){
 const [x,y,z,w]=q,[px,py,pz]=[p.x,p.y,p.z];
 // Quaternion rotation without Matrix4/Three.js; only input topology moves.
 const tx=2*(y*pz-z*py),ty=2*(z*px-x*pz),tz=2*(x*py-y*px);
 return {x:px+w*tx+y*tz-z*ty,
         y:py+w*ty+z*tx-x*tz,
         z:pz+w*tz+x*ty-y*tx};
}
// This is a PROPER rotation (determinant +1), not a reflection:
// draftflow x = source X; y = -source Z; z = source Y.
// V observer (-y) = source +Z, H observer (+z) = source +Y,
// W observer (+x) = source +X (Cone Lab's "right" rather than its "left").
function toDraftXYZ(p){return {x:p.x,y:p.z===0?0:-p.z,z:p.y};}
function toSourceXYZ(p){return {x:p.x,y:p.z,z:p.y===0?0:-p.y};}
// Upstream automatically assigns _id to edited parts. Prefer this stable source
// identity over array order so reordering a saved model cannot swap features.
function partGeometryId(pr,index){
 if(pr._id!==undefined)return 'ConePartSrc_'+String(pr._id);
 return 'ConePart'+String(index+1); // older files without source IDs
}
function meshFromLocalPoints(pr,index,raw){
 const q=sourcePartQuaternion(pr),points={};
 for(const [vertexId,origin] of Object.entries(raw.points)){
  const rotated=rotate(q,origin);
  const point=toDraftXYZ({
   x:rotated.x+pr.x,y:rotated.y+pr.y,z:rotated.z+pr.z
  });
  if(Object.values(point).some(v=>!finite(v)||Math.abs(v)>100000))
   fail('第 '+(index+1)+' 个部件的变换后顶点越界');
  points[vertexId]=point;
 }
 const geometry={id:partGeometryId(pr,index),kind:'mesh',space:'model-3d',
  unit:'mm',data:{points,edges:raw.edges,faces:raw.faces}};
 const check=validateGeometry(geometry);
 if(!check.ok)fail('第 '+(index+1)+' 个部件网格无效：'+check.errors.join('；'));
 return geometry;
}
function sourceBoxMesh(pr,index){
 const dims=pr.k==='cube'?{w:pr.a,h:pr.a,d:pr.a}:pr;
 const w=dims.w,h=dims.h,d=dims.d;
 if(![w,h,d].every(x=>finite(x)&&x>EPS&&x<=100000))
   fail('第 '+(index+1)+' 个长方体尺寸不合法');
 // Reuse canonical axis box topology, not an independently invented mesh.
 const raw=prismMesh({solid:{
  min:{x:-w/2,y:-h/2,z:-d/2},
  max:{x:w/2,y:h/2,z:d/2}
 }});
 return meshFromLocalPoints(pr,index,raw.data);
}
// Cone Lab creates "pyr3" as THREE.CylinderGeometry(0,r,h,3).
// Its original mathematical solid is a TRIANGULAR pyramid with a point apex
// at +Y and an equilateral circumradius-r triangle at -Y, thetaStart=0.
// These are the exact four source corners; no triangulation approximates curves.
function sourcePyramidMesh(pr,index){
 const r=pr.r,h=pr.h;
 if(![r,h].every(x=>finite(x)&&x>EPS&&x<=100000))
  fail('第 '+(index+1)+' 个三棱锥尺寸不合法');
 const points={Apex:{x:0,y:h/2,z:0}};
 for(let i=0;i<3;i++){
  const angle=i*2*Math.PI/3;
  const xv=r*Math.sin(angle),zv=r*Math.cos(angle);
  points['Base'+i]={x:Math.abs(xv)<1e-12?0:xv,y:-h/2,
                      z:Math.abs(zv)<1e-12?0:zv};
 }
 const edges=[
  ['Base0','Base1'],['Base1','Base2'],['Base2','Base0'],
  ['Apex','Base0'],['Apex','Base1'],['Apex','Base2']
 ];
 const faces=[
  ['Base0','Base2','Base1'],
  ['Apex','Base0','Base1'],
  ['Apex','Base1','Base2'],
  ['Apex','Base2','Base0']
 ];
 return meshFromLocalPoints(pr,index,{points,edges,faces});
}
function sourceExactPolyMesh(pr,index){
 if(pr.k==='pyr3')return sourcePyramidMesh(pr,index);
 if(pr.k==='box'||pr.k==='cube')return sourceBoxMesh(pr,index);
 fail('第 '+(index+1)+' 个实体没有经过签收的精确棱面拓扑');
}
function parseExactCandidate(text){
 const doc=Bridge.parseDocument(text),s=doc.model;
 if(s.shape!=='lab')fail('仅接入“实验室·自由拼装”中的独立实体；主立体仍留在原实验室');
 if(s.flipped)fail('实验室主立体倒放状态需要单独复核');
 if(s.faces.length||s.cyls.length)fail('含截切面或相贯体的模型仍需 C3 几何映射，不能只导入部件');
 if(Object.keys(s.pickSel).length)fail('分块选择状态尚不能表达为精确独立实体');
 if(s.parts.length<1)fail('模型没有任何拼装部件');
 if(s.parts.some(p=>!p.on||p.hidden))fail('含隐藏/禁用部件的模型需先在原实验室恢复完整实体');
 if(s.parts.some(p=>!['box','cube','pyr3'].includes(p.k)))
  fail('当前精确棱面接入支持长方体、正方体、正三棱锥；圆柱、圆锥和曲面实体仍留在原实验室');
 const geometry=s.parts.map(sourceExactPolyMesh);
 if(new Set(geometry.map(g=>g.id)).size!==geometry.length)
  fail('拼装部件来源 ID 重复，不允许合并或覆盖不同实体');
 return {doc,geometry};
}
function previewExactScene(text,{revision=0}={}){
 const candidate=parseExactCandidate(text);
 const scene=deriveGeometryScene({
   geometry:candidate.geometry,revision,branchId:null,resultId:null
 });
 if(scene.evidence.visibility!=='undetermined'||scene.evidence.v5==='verified')
  fail('预览场景错误获得认证状态');
 return {
  source:SOURCE_MAIN_SHA,
  adapterScope:P2_SCOPE,
  geometry:candidate.geometry,
  scene,
  warnings:['模型来自 Cone Lab 本机文件；截切/相贯曲线和工程线型未获得证明。',
    'W 方向对应 Cone Lab 的右视（+X），不是其左视（−X）。']
 };
}
// Create a NEW local project atomically in memory (validate before saving).
// Imported objects are pending, so the original coordinator cannot solve
// them until the user explicitly confirms each geometry condition.
function draftProjectFromConeLab(text,{projectId,title='Cone Lab 拼装模型（待确认）'}={}){
 if(!projectId)fail('必须提供新项目 ID');
 const converted=previewExactScene(text);
 const next=newProject({id:projectId,title,task:'composition'});
 next.objects=converted.geometry.map(g=>({
  id:g.id,kind:'solid',spatialId:g.id+'_3D',
  projections:{V:[g.id+'_V'],H:[g.id+'_H'],W:[g.id+'_W']}
 }));
 next.conditions=converted.geometry.map(g=>({
  id:'geo_'+g.id,objectId:g.id,sourceCandidateId:null,confirmed:false,
  value:{type:'manual-geometry',unit:'mm',imageId:null,geometry:g}
 }));
 const checked=validateProject(next);
 if(!checked.ok)fail('无法创建本机草稿：'+checked.errors.join('；'));
 return {project:next,scene:converted.scene,geometry:converted.geometry,
         adapterScope:P2_SCOPE,warnings:converted.warnings};
}
// Explicitly demonstrate canonical first-angle direction contract.
const OBSERVER_SOURCE=Object.freeze({
 V:Object.freeze(toSourceXYZ(FIRST_ANGLE_OBSERVER_RAYS.V)),
 H:Object.freeze(toSourceXYZ(FIRST_ANGLE_OBSERVER_RAYS.H)),
 W:Object.freeze(toSourceXYZ(FIRST_ANGLE_OBSERVER_RAYS.W))
});
module.exports={P2_SCOPE,sourcePartQuaternion,sourceBoxMesh,sourcePyramidMesh,partGeometryId,
 toDraftXYZ,toSourceXYZ,OBSERVER_SOURCE,
 previewExactScene,draftProjectFromConeLab};
