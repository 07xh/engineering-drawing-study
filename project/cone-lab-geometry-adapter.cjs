'use strict';
/**
 * Cone Lab -> the EXISTING canonical Geometry Scene and local C2 workbench.
 * No renderer, second solver, inferred silhouette, contact proof, or V5.
 *
 * Exact first scope: free-lab oriented box/cube primitives only. Unsupported
 * shapes/cutters/sections explicitly fail instead of silently disappearing.
 */
const Bridge=require('../labs/cone-lab/model-bridge.js');
const {prismMesh}=require('./unified-workbench-session.cjs');
const {validateGeometry}=require('../core/contracts/geometry.js');
const {deriveGeometryScene}=require('../core/projection/geometry-scene-views.cjs');
const {newProject,validateProject}=require('./project-coordinator.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');

const RAD=Math.PI/180,EPS=1e-9;
const SOURCE_MAIN_SHA=Bridge.SOURCE_SHA;
const P2_SCOPE='cone-lab-exact-box-mesh/1';
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
function sourceBoxMesh(pr,index){
 const dims=pr.k==='cube'?{w:pr.a,h:pr.a,d:pr.a}:pr;
 const w=dims.w,h=dims.h,d=dims.d;
 if(![w,h,d].every(x=>finite(x)&&x>EPS&&x<=100000))
   fail('第 '+(index+1)+' 个长方体尺寸不合法');
 const raw=prismMesh({solid:{
  min:{x:-w/2,y:-h/2,z:-d/2},
  max:{x:w/2,y:h/2,z:d/2}
 }});
 const q=sourcePartQuaternion(pr),points={};
 for(const [id,origin] of Object.entries(raw.data.points)){
  const rotated=rotate(q,origin);
  const point=toDraftXYZ({
   x:rotated.x+pr.x,y:rotated.y+pr.y,z:rotated.z+pr.z
  });
  if(Object.values(point).some(v=>!finite(v)||Math.abs(v)>100000))
   fail('第 '+(index+1)+' 个部件的变换后顶点越界');
  points[id]=point;
 }
 // Distinct source-part IDs are needed even where two bodies share ink.
 const id='ConePart'+String(index+1);
 const geometry={id,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges:raw.data.edges,faces:raw.data.faces}};
 const check=validateGeometry(geometry);
 if(!check.ok)fail('第 '+(index+1)+' 个部件网格无效：'+check.errors.join('；'));
 return geometry;
}
function parseExactCandidate(text){
 const doc=Bridge.parseDocument(text),s=doc.model;
 if(s.shape!=='lab')fail('仅接入“实验室·自由拼装”中的独立实体；主立体仍留在原实验室');
 if(s.flipped)fail('实验室主立体倒放状态需要单独复核');
 if(s.faces.length||s.cyls.length)fail('含截切面或相贯体的模型仍需 C3 几何映射，不能只导入部件');
 if(Object.keys(s.pickSel).length)fail('分块选择状态尚不能表达为精确独立实体');
 if(s.parts.length<1)fail('模型没有任何拼装部件');
 if(s.parts.some(p=>!p.on||p.hidden))fail('含隐藏/禁用部件的模型需先在原实验室恢复完整实体');
 if(s.parts.some(p=>p.k!=='box'&&p.k!=='cube'))
  fail('当前仅精确接入长方体、正方体；曲面/锥体仍留在原实验室');
 return {doc,geometry:s.parts.map(sourceBoxMesh)};
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
module.exports={P2_SCOPE,sourcePartQuaternion,sourceBoxMesh,
 toDraftXYZ,toSourceXYZ,OBSERVER_SOURCE,
 previewExactScene,draftProjectFromConeLab};
