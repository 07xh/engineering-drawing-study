'use strict';
/**
 * Cone Lab -> EXISTING C3 finite orthogonal-cylinder input FORM ONLY.
 * No invocation of M3, no "sourceConfirmed" token, no solved intersection,
 * no M4/M5 proof and no alternate V5. A human must separately stage, confirm,
 * and run the existing C3 specialist through the original workbench.
 */
const Bridge=require('../labs/cone-lab/model-bridge.js');
const {sourceRevolvedSolid}=require('./cone-lab-geometry-adapter.cjs');
const {makeReviewedC3Input}=require('./c3-reviewed-input.cjs');

const fail=s=>{throw new Error('Cone Lab C3 候选：'+s);};
const PROJECT='gugugaga-design/cone-lab';
const SCHEMA='draftflow.conelab.c3-review-candidate.v1';
function c3CandidateFromConeLab(text){
 const doc=Bridge.parseDocument(text),model=doc.model;
 if(model.shape!=='lab'||model.flipped)
  fail('只能从未翻转的自由拼装实验室导入');
 if(model.faces.length||model.cyls.length||Object.keys(model.pickSel).length)
  fail('包含切割、相贯体或分块的模型不能只提取两个圆柱，避免遗漏原题条件');
 if(model.parts.length!==2)fail('必须恰好包含两个圆柱，不能忽略其它组合体');
 if(model.parts.some(p=>p.k!=='cyl'||p.on!==true||p.hidden===true))
  fail('两个部件都必须是完整、启用的有限圆柱');
 // Limit the first scoped adapter to the EXACT Cone Lab axis choices whose
 // normals map without trigonometric tolerance to the source +Y and +Z.
 if(model.parts.some(p=>p.ang!==0||
   !['horiz','frontal'].includes(p.type)))
  fail('当前只接入一根竖直与一根正面轴向的正交圆柱，不接受斜向近似');
 const vertical=model.parts.filter(p=>p.type==='horiz');
 const front=model.parts.filter(p=>p.type==='frontal');
 if(vertical.length!==1||front.length!==1)
  fail('两个圆柱必须沿互相正交的 Y/Z 源轴，不能同轴或同向');
 // The single canonical source transform is (x,y,z)=(X,-Z,Y).
 const Z=sourceRevolvedSolid(vertical[0],model.parts.indexOf(vertical[0]));
 const Y=sourceRevolvedSolid(front[0],model.parts.indexOf(front[0]));
 const z=Z.data,y=Y.data;
 const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=1e-12;
 if(z.profile!=='cylinder'||y.profile!=='cylinder'||
    !near(z.axis.x,0)||!near(z.axis.y,0)||!near(z.axis.z,1)||
    !near(y.axis.x,0)||!near(y.axis.y,-1)||!near(y.axis.z,0))
  fail('原版圆柱轴向与绘序有限圆柱求解范围不一致');
 const dimensions={
  zRadius:z.radiusBottom,
  zX:z.center.x,zY:z.center.y,
  zMin:z.center.z-z.height/2,zMax:z.center.z+z.height/2,
  yRadius:y.radiusBottom,
  yX:y.center.x,yZ:y.center.z,
  yMin:y.center.y-y.height/2,yMax:y.center.y+y.height/2
 };
 // Existing shape/units validator ONLY, its sourceConfirmed:true result is
 // NOT returned or stored. The UI must explicitly require fresh user review.
 makeReviewedC3Input(dimensions);
 return Object.freeze({
  schema:SCHEMA,status:'requires-human-review',sourceRepository:PROJECT,
  sourceCommit:Bridge.SOURCE_SHA,
  sourcePartIds:Object.freeze([Z.id,Y.id]),
  dimensions:Object.freeze(dimensions),
  axesConfirmed:false,capsConfirmed:false,
  solidOperation:null,verification:'unverified-preview',
  analysis:null,canSolve:false,canExport:false,canPlayV5:false
 });
}
module.exports={SCHEMA,c3CandidateFromConeLab};
