'use strict';
// UI-to-existing-solver input contract for a manually checked C1 convex cuboid.
// The 8 row IDs are fixed topology. Their 2-view coordinates come ONLY from
// the user's explicitly reviewed input and are never inferred from a photo.
const IDS=Object.freeze(['V000','V001','V010','V011','V100','V101','V110','V111']);
const PAIRS=Object.freeze(['VH','VW','HW']);
// These are NECESSARY consistency checks on the user-entered first-angle
// view pair, not a replacement for the canonical 03 M3 point solver.
// V=(x,z), H=(x,y), W=(y,z) as defined by shared projection conventions.
const SHARED=Object.freeze({
 VH:Object.freeze({first:0,second:0,axis:'x'}),
 VW:Object.freeze({first:1,second:1,axis:'z'}),
 HW:Object.freeze({first:1,second:0,axis:'y'})
});
const MAX_REVIEW_MISMATCH_MM=1e-8;
const DECIMAL_MM=/^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
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
  const numbers=fields.slice(1).map(s=>DECIMAL_MM.test(s)?Number(s):NaN);
  if(numbers.some(n=>!Number.isFinite(n)||Math.abs(n)>100000))
   throw new Error('角点 '+fields[0]+' 的四项视图坐标必须是 ±100000 mm 内的十进制有限数值');
  const shared=SHARED[pair],first=numbers[shared.first],
   second=numbers[2+shared.second];
  if(Math.abs(first-second)>MAX_REVIEW_MISMATCH_MM)
   throw new Error('角点 '+fields[0]+' 的 '+pair[0]+'/'+pair[1]+
    ' 视图公共 '+shared.axis+' 坐标不一致：'+first+' 与 '+second+
    ' mm。请对照原题检查对应点或尺寸');
  seen.add(fields[0]);
  return {id:fields[0],knownViews:{
   [pair[0]]:numbers.slice(0,2),[pair[1]]:numbers.slice(2,4)}};
 });
 if(IDS.some(id=>!seen.has(id)))throw new Error('8 个原始顶点必须全部对应');
 const ordered=IDS.map(id=>rows.find(r=>r.id===id));
 // Two orthogonal views determine all three axes. If both 2D pairs
 // coincide for two IDs, they cannot represent distinct physical 3D
 // model vertices in the fixed eight-vertex closed-source topology.
 // Treat near-equality only as a UI preflight hold: M3 and M0 still
 // independently recompute the exact source geometry upon submission.
 for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
  const a=ordered[i].knownViews,b=ordered[j].knownViews;
  if([...a[pair[0]],...a[pair[1]]].every((v,k)=>
    Math.abs(v-[...b[pair[0]],...b[pair[1]]][k])<=MAX_REVIEW_MISMATCH_MM))
   throw new Error('角点 '+ordered[i].id+' 与 '+ordered[j].id+
    ' 在两张已知视图中重合，不能作为固定拓扑的两个不同三维顶点');
 }
 return ordered;
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
