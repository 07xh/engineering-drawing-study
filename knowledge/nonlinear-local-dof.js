/* Local differential DOF of planar point configurations.
 * Jacobian rank is NOT a global uniqueness or solvability proof.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingLocalDof=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EPS=1e-9,finite=x=>typeof x==='number'&&Number.isFinite(x);
function analyze(input){
 if(!input||!input.points||typeof input.points!=='object'||Array.isArray(input.points)||!Array.isArray(input.constraints))throw Error('需要点坐标与约束数组');
 const ids=Object.keys(input.points),n=ids.length*2,loc=new Map(ids.map((id,i)=>[id,2*i]));
 if(!ids.length)throw Error('至少需要一个点');
 for(const id of ids){const p=input.points[id];if(!p||![p.x,p.y].every(finite))throw Error('无效点坐标：'+id)}
 const rows=[],residuals=[];
 function get(id){if(!loc.has(id))throw Error('未知点：'+id);return input.points[id]}
 function add(entries,residual){if(!finite(residual))throw Error('非有限约束残差');const row=Array(n).fill(0);for(const [id,axis,value] of entries){if(!finite(value))throw Error('非有限导数');row[loc.get(id)+(axis==='y'?1:0)]+=value}rows.push(row);residuals.push(residual)}
 for(const c of input.constraints){
  if(!c||typeof c!=='object')throw Error('无效约束');
  if(c.type==='fixed'){const p=get(c.point);if(!['x','y'].includes(c.axis)||!finite(c.value))throw Error('固定坐标无效');add([[c.point,c.axis,1]],p[c.axis]-c.value)}
  else if(c.type==='distance'){
   const a=get(c.a),b=get(c.b);if(!finite(c.value)||c.value<0)throw Error('距离参数无效');
   const dx=a.x-b.x,dy=a.y-b.y;
   add([[c.a,'x',2*dx],[c.a,'y',2*dy],[c.b,'x',-2*dx],[c.b,'y',-2*dy]],dx*dx+dy*dy-c.value*c.value);
  }else if(c.type==='horizontal'||c.type==='vertical'){
   const a=get(c.a),b=get(c.b),axis=c.type==='horizontal'?'y':'x';
   add([[c.a,axis,1],[c.b,axis,-1]],a[axis]-b[axis]);
  }else if(c.type==='coincident'){
   const a=get(c.a),b=get(c.b);
   for(const axis of ['x','y'])add([[c.a,axis,1],[c.b,axis,-1]],a[axis]-b[axis]);
  }else throw Error('暂不支持的非线性约束：'+c.type);
 }
 const matrix=rows.map(row=>[...row]);let rank=0;
 for(let col=0;col<n&&rank<matrix.length;col++){
  let best=rank;for(let i=rank+1;i<matrix.length;i++)if(Math.abs(matrix[i][col])>Math.abs(matrix[best][col]))best=i;
  if(Math.abs(matrix[best][col])<EPS)continue;
  [matrix[rank],matrix[best]]=[matrix[best],matrix[rank]];
  const scale=matrix[rank][col];for(let j=col;j<n;j++)matrix[rank][j]/=scale;
  for(let i=rank+1;i<matrix.length;i++){const factor=matrix[i][col];for(let j=col;j<n;j++)matrix[i][j]-=factor*matrix[rank][j]}
  rank++;
 }
 const maxResidual=Math.max(0,...residuals.map(Math.abs)),tolerance=finite(input.tolerance)&&input.tolerance>0?input.tolerance:1e-7;
 return {scope:'multi-point-2d-local-jacobian',rank,variables:n,localDegrees:n-rank,atProvidedConfiguration:maxResidual<=tolerance?'satisfied':'violated',maxResidual,warning:'局部一阶自由度只在所给构型附近有效；奇异点、距离平方约束退化及多分支可能使结果不同于真实解空间维数，不能据此断言全局唯一或无解。'};
}
return {analyze};
});
