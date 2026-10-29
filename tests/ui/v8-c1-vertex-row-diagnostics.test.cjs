'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {IDS,parseReviewedC1Rows}=require('../../project/c1-reviewed-input.cjs');
const valid=()=>IDS.map((id,i)=>[id,i,0,i,3*i].join(','));
function invalidRow(rows,pattern,index){
 let error;try{parseReviewedC1Rows(rows.join('\n'),'VH');}catch(e){error=e;}
 assert.ok(error,'invalid C1 input must fail closed');
 assert.match(error.message,pattern);
 assert.equal(error.lineNumber,index);
}
test('C1 manual vertex review identifies the exact malformed, repeated or mismatched row',()=>{
 const a=valid();assert.equal(parseReviewedC1Rows(a.join('\n'),'VH').length,8);
 const malformed=valid();malformed[2]='V010,2,0,2';
 invalidRow(malformed,/第 3 行：每行必须包含角点编号和四个视图坐标/,3);
 const duplicate=valid();duplicate[5]=duplicate[0];
 invalidRow(duplicate,/第 6 行：重复角点 V000/,6);
 const broken=valid();broken[4]='V100,4,0,5,0';
 invalidRow(broken,/第 5 行：角点 V100.*V\/H 视图公共 x 坐标不一致/,5);
 const badNumber=valid();badNumber[3]='V011,3,0,3,Infinity';
 invalidRow(badNumber,/第 4 行：角点 V011.*四项视图坐标/,4);
 const repeatedPoint=valid();repeatedPoint[7]='V111,0,0,0,0';
 invalidRow(repeatedPoint,/第 8 行：角点 V000 与 V111.*不同三维顶点/,8);
 const missing=valid().slice(0,7);
 assert.throws(()=>parseReviewedC1Rows(missing.join('\n'),'VH'),/请填写完整的 8 个对应角点/);
});
