'use strict';
/**
 * 03-A first-angle projection, backed by the reviewed unified 01 math adapter.
 * All input/view coordinates are model-space mm; sheet transform is px/mm.
 * Never manufacture a third view when the point is underdetermined.
 */
const {solvePendingPoint}=require('../../core/adapters/pending-point.js');
const P=require('../../core/projection/conventions.js');

const PLANES=Object.freeze(['V','H','W']);
const COORDS=Object.freeze(['x','y','z']);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const POINT_ID='P';

function knownProjectionConstraints(views){
 if(views===undefined)views={};
 if(!object(views)||Object.keys(views).some(p=>!PLANES.includes(p)))
  throw new TypeError('仅支持 V、H、W 三面投影');
 return PLANES.filter(name=>Object.hasOwn(views,name)).map(name=>{
  const pair=views[name];
  if(!Array.isArray(pair)||pair.length!==2||!pair.every(finite))
   throw new TypeError(name+' 投影应为两个有限数值的 mm 坐标');
  return {id:'view_'+name,scope:'point-3d-linear',type:'projection',
   targetIds:[POINT_ID],source:'given',data:{plane:name,value:[...pair]}};
 });
}
function coordinateConstraints(point){
 if(point===undefined)return [];
 if(!object(point)||Object.keys(point).some(k=>!COORDS.includes(k))||
  !COORDS.every(k=>finite(point[k])))
  throw new TypeError('空间点必须包含有限数值 x、y、z');
 return COORDS.map(axis=>({
  id:'given_'+axis,scope:'point-3d-linear',type:'coordinate',
  targetIds:[POINT_ID],source:'given',data:{axis,value:point[axis]}
 }));
}
function solveProjection({knownViews={},knownPoint,sheetTransform={origin:{x:360,y:175},scale:4}}={}){
 const constraints=[...knownProjectionConstraints(knownViews),...coordinateConstraints(knownPoint)];
 const problem={id:'P0_POINT_PROJECTION',title:'用户给定空间点的第一角法投影',
  type:'point-projection',status:'source-verified',source:{kind:'user-input',confirmed:true},
  givens:[],geometry:[],unknowns:[{id:POINT_ID,kind:'point',space:'model-3d',unit:'mm'}],
  constraints,solveResults:[],steps:[],renderMode:'constraint-engine'};
 const solved=solvePendingPoint(problem,POINT_ID);
 const r=solved.result;
 const base={status:solved.status,solutionCount:r.solutionCount,
  degrees:r.degrees,globallyUnique:r.globallyUnique,maxResidual:r.maxResidual,
  proofLevel:r.proofLevel,diagnostics:[...r.diagnostics],
  knownViews:PLANES.filter(k=>Object.hasOwn(knownViews,k)),
  knownPoint:knownPoint!==undefined,unit:'mm',inputProblem:problem};
 if(!solved.candidateGeometry){
  return {...base,point:null,views:null,sheet:null,guides:[],
   steps:[],reason:solved.status==='none'?'给定条件互相矛盾，无法生成第三投影':
    '条件尚不足以唯一确定三维坐标，不得推测缺失的投影'};
 }
 const point=solved.candidateGeometry.data;
 const views=P.project(point),transfer=P.transferGuides(point,sheetTransform);
 const reasons={
  VH:'正面与水平投影具有相同的 x 值，沿同一竖联系线传递。',
  'height-VW':'正面与侧面投影保持相同高度 z。',
  'depth-HM':'使用 45°深度转移，水平投影的 y 值先传到等距辅助点 M。',
  'depth-MW':'由 M 引出竖联系线，将相同的深度 y 转给侧面投影。'
 };
 const steps=transfer.guides.map((guide,index)=>({
  id:'guide_'+(index+1),kind:guide.kind,
  dependsOn:index?['guide_'+index]:[],
  from:{...guide.from},to:{...guide.to},
  explanation:reasons[guide.kind],
  style:'auxiliary',unit:'px',resultScope:'point-3d-linear',
  source:'computed-first-angle-guides'
 }));
 return {...base,point:{...point},views, sheet:transfer.points,
  guides:transfer.guides,steps,reason:
  '空间坐标由真实线性约束唯一求解；辅助线来自第一角正交投影及45°深度转移',
  resultId:solved.result.id};
}
module.exports={PLANES,solveProjection,knownProjectionConstraints,coordinateConstraints};
