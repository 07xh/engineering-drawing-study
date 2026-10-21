'use strict';
const oldSchema=require('../../knowledge/problem-schema.js');
const {validateProblem}=require('../contracts/problem.js');
const {SCHEMA_VERSION}=require('../contracts/common.js');
const {validateGeometry}=require('../contracts/geometry.js');
function adaptLegacyProblem(problem){
 const old=oldSchema.validate(problem);
 if(!old.ok)throw Error('旧题目格式校验失败：'+old.errors.join('；'));
 const result={...problem,schemaVersion:SCHEMA_VERSION,source:{...problem.source},
  givens:[...problem.givens],geometry:[],constraints:[],
  steps:problem.steps.map(s=>({...s,actions:s.actions.map(a=>({...a}))}))};
 const check=validateProblem(result);
 if(!check.ok)throw Error('统一题目格式校验失败：'+check.errors.join('；'));
 return result;
}
function adaptLegacyModel(model){
 if(!model||typeof model.id!=='string'||!model.points||!Array.isArray(model.edges)||!Array.isArray(model.faces))throw Error('旧模型缺少点棱面');
 const g={id:model.id,kind:'mesh',space:'model-3d',unit:'unitless',
  data:{points:JSON.parse(JSON.stringify(model.points)),edges:model.edges.map(x=>[...x]),faces:model.faces.map(x=>[...x])}};
 const check=validateGeometry(g);
 if(!check.ok)throw Error('旧模型无效：'+check.errors.join('；'));
 return g;
}
module.exports={adaptLegacyProblem,adaptLegacyModel};
