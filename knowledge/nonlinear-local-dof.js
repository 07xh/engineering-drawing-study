/* Local differential degrees for explicit planar multi-point constraints.
 * Jacobian rank is LOCAL ONLY: it does not prove global uniqueness or solution existence.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingNonlinearDOF=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EPS=1e-8,finite=n=>typeof n==='number'&&Number.isFinite(n);
function analyze({points,constraints}={}){
 if(!points||typeof points!=='object'||Array.isArray(points)||!Array.isArray(constraints))throw Error('必须提供坐标点表和约束');
 const ids=Object.keys(points),index=new Map(ids.map((id,i)=>[id,i*2])),n=ids.length*2;
 if(ids.some(id=>!id||!points[id]||![points[id].x,points[id].y].every(finite)))throw Error('点坐标无效');
 const rows=[],residuals=[];
 function p(id){if(!index.has(id))throw Error('未知点：'+id);return points[id]}
 function add(terms,residual){const row=Array(n).fill(0);for(const [id,x,y] of terms){const i=index.get(id);row[i]+=x;row[i+1]+=y}rows.push(row);residuals.push(residual)}
 for(const c of constraints){
  if(!c||typeof c!=='object')throw Error('无效约束');
  if(c.type==='distance'){
   const a=p(c.a),b=p(c.b),dx=a.x-b.x,dy=a.y-b.y;
   if(!finite(c.value)||c.value<0)throw Error('距离参数无效');
   add([[c.a,2*dx,2*dy],[c.b,-2*dx,-2*dy]],dx*dx+dy*dy-c.value*c.value);
  }else if(c.type==='perpendicular'||c.type==='parallel'){
   const a=p(c.a),b=p(c.b),d=p(c.c),e=p(c.d);
   const ux=b.x-a.x,uy=b.y-a.y,vx=e.x-d.x,vy=e.y-d.y;
   if(c.type==='perpendicular'){
    add([[c.a,-vx,-vy],[c.b,vx,vy],[c.c,-ux,-uy],[c.d,ux,uy]],ux*vx+uy*vy);
   }else{
    add([[c.a,-vy,vx],[c.b,vy,-vx],[c.c,uy,-ux],[c.d,-uy,ux]],ux*vy-uy*vx);
   }
  }else if(c.type==='angle'){
   // Unoriented angle between nonzero segments AB and CD, in radians [0, PI].
   const a=p(c.a),b=p(c.b),d=p(c.c),e=p(c.d);
   if(!finite(c.value)||c.value<0||c.value>Math.PI)throw Error('角度必须在0到π之间（弧度）');
   const ux=b.x-a.x,uy=b.y-a.y,vx=e.x-d.x,vy=e.y-d.y;
   const lu=Math.hypot(ux,uy),lv=Math.hypot(vx,vy);
   if(lu<EPS||lv<EPS)throw Error('角度约束不能使用零长度线段');
   const cosine=(ux*vx+uy*vy)/(lu*lv),target=Math.cos(c.value);
   const gux=vx/(lu*lv)-cosine*ux/(lu*lu),guy=vy/(lu*lv)-cosine*uy/(lu*lu);
   const gvx=ux/(lu*lv)-cosine*vx/(lv*lv),gvy=uy/(lu*lv)-cosine*vy/(lv*lv);
   add([[c.a,-gux,-guy],[c.b,gux,guy],[c.c,-gvx,-gvy],[c.d,gvx,gvy]],cosine-target);
  }else if(c.type==='circle-tangent-line'){
   // Circle center is a point variable; radius and fixed line are constants.
   const center=p(c.center),l=c.line;
   if(!l||![l.a,l.b,l.offset,c.radius].every(finite)||Math.hypot(l.a,l.b)<EPS||c.radius<=0)throw Error('相切直线或半径无效');
   const norm=Math.hypot(l.a,l.b),signed=(l.a*center.x+l.b*center.y-l.offset)/norm;
   // Squared signed distance avoids absolute-value nondifferentiability.
   add([[c.center,2*signed*l.a/norm,2*signed*l.b/norm]],signed*signed-c.radius*c.radius);
  }else if(c.type==='circle-tangent-circle'){
   // Fixed radii, variable centers. Mode distinguishes external/internal tangency.
   const a=p(c.a),b=p(c.b);
   if(![c.radiusA,c.radiusB].every(finite)||c.radiusA<=0||c.radiusB<=0||!['external','internal'].includes(c.mode))throw Error('双圆相切参数无效');
   if(c.mode==='internal'&&Math.abs(c.radiusA-c.radiusB)<EPS)throw Error('等半径圆不存在非重合的内切构型');
   const target=c.mode==='external'?c.radiusA+c.radiusB:Math.abs(c.radiusA-c.radiusB);
   const dx=a.x-b.x,dy=a.y-b.y;
   add([[c.a,2*dx,2*dy],[c.b,-2*dx,-2*dy]],dx*dx+dy*dy-target*target);
  }else if(c.type==='fixed'){
   const point=p(c.point);if(!['x','y'].includes(c.axis)||!finite(c.value))throw Error('固定坐标无效');
   const gradient=c.axis==='x'?[1,0]:[0,1];add([[c.point,...gradient]],point[c.axis]-c.value);
  }else throw Error('暂不支持非线性约束：'+c.type);
 }
 const matrix=rows.map(row=>[...row]);let rank=0;
 for(let col=0;col<n&&rank<matrix.length;col++){
  let best=rank;for(let i=rank+1;i<matrix.length;i++)if(Math.abs(matrix[i][col])>Math.abs(matrix[best][col]))best=i;
  if(Math.abs(matrix[best][col])<EPS)continue;
  [matrix[rank],matrix[best]]=[matrix[best],matrix[rank]];
  const d=matrix[rank][col];for(let j=col;j<n;j++)matrix[rank][j]/=d;
  for(let i=rank+1;i<matrix.length;i++){const f=matrix[i][col];for(let j=col;j<n;j++)matrix[i][j]-=f*matrix[rank][j]}
  rank++;
 }
 const maxResidual=Math.max(0,...residuals.map(Math.abs));
 return {scope:'multi-point-2d-local-jacobian',pointCount:ids.length,rank,localDegrees:n-rank,atProvidedConfiguration:maxResidual<=EPS,maxResidual,
  globallyUnique:null,solutionCount:null,warning:'局部雅可比秩仅描述输入构型的一阶自由度；不证明全局唯一性、解存在性或奇异位置附近的真实维数。'};
}
return {analyze};
});
