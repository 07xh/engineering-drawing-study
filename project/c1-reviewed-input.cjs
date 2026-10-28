'use strict';
// UI-to-existing-solver input contract for a manually checked C1 convex cuboid.
// The 8 row IDs are fixed topology. Their 2-view coordinates come ONLY from
// the user's explicitly reviewed input and are never inferred from a photo.
const IDS=Object.freeze(['V000','V001','V010','V011','V100','V101','V110','V111']);
const PAIRS=Object.freeze(['VH','VW','HW']);
function parseReviewedC1Rows(raw,pair){
 if(!PAIRS.includes(pair))throw new Error('请选择有效的两张已知视图');
 if(typeof raw!=='string'||raw.length>16000)throw new Error('原题角点输入太长');
 const lines=raw.trim().split(/\r?\n/);
 if(lines.length!==8)throw new Error('请填写完整的 8 个对应角点，每行一个');
 const seen=new Set();
 const rows=lines.map(line=>{
  const fields=line.split(/[,，]/).map(s=>s.trim());
  if(fields.length!==5||!IDS.includes(fields[0])||seen.has(fields[0]))
   throw new Error('角点编号必须且只能包含 V000 至 V111 各一次');
  const numbers=fields.slice(1).map(s=>s.length?Number(s):NaN);
  if(numbers.some(n=>!Number.isFinite(n)||Math.abs(n)>100000))
   throw new Error('已知视图坐标必须为 ±100000 mm 内的有限数值');
  seen.add(fields[0]);
  return {id:fields[0],knownViews:{
   [pair[0]]:numbers.slice(0,2),[pair[1]]:numbers.slice(2,4)}};
 });
 if(IDS.some(id=>!seen.has(id)))throw new Error('8 个原始顶点必须全部对应');
 return IDS.map(id=>rows.find(r=>r.id===id));
}
function serializeReviewedC1Rows(vertices,pair){
 if(!Array.isArray(vertices)||!PAIRS.includes(pair))throw new Error('输入不存在');
 return IDS.map(id=>{
  const row=vertices.find(v=>v.id===id);
  if(!row)return '';
  return [id,...row.knownViews[pair[0]],...row.knownViews[pair[1]]].join(',');
 }).join('\n');
}
module.exports={IDS,PAIRS,parseReviewedC1Rows,serializeReviewedC1Rows};
