'use strict';
/**
 * Shared M4 exact circle subarc / projected straight source intersection.
 *
 * Parametrize projected straight source by p(t)=a+t(b-a), 0<=t<=1.
 * Circle equation yields a quadratic with at most two roots.
 * Signed half and bounded x interval select the actual source subarc.
 * Tangent/near-tangent contacts are returned as unresolved candidates.
 *
 * Exact means source algebra (not SVG sampling); finite floating precision
 * still requires bounded residual tests. No final source ownership, true
 * 3D contact, forward depth or engineering line-style claims.
 */
const finite=Number.isFinite;
function intersectCircleSubarcWithLine({
 circle,sign,xRange,from,to,tolerance=1e-8}={}){
 if(!circle||![circle.xCenter,circle.coordinateCenter,circle.radius].every(finite)||
    circle.radius<=0||![-1,1].includes(sign)||
    !Array.isArray(xRange)||xRange.length!==2||
    !xRange.every(finite)||xRange[1]<=xRange[0]||
    !from||!to||![from.u,from.v,to.u,to.v].every(finite)||
    !finite(tolerance)||tolerance<=0||tolerance>1)
  throw new TypeError('bounded signed analytic circle subarc and projected line required');
 const a=from.u-circle.xCenter,b=from.v-circle.coordinateCenter,
  dx=to.u-from.u,dy=to.v-from.v,
  A=dx*dx+dy*dy,B=2*(a*dx+b*dy),
  C=a*a+b*b-circle.radius*circle.radius;
 if(A<=tolerance*tolerance)throw new RangeError('projected source line collapsed to a point');
 const disc=B*B-4*A*C,scale=Math.max(1,B*B,4*Math.abs(A*C),
  A*circle.radius*circle.radius);
 const tolDisc=1e-11*scale;
 if(disc<-tolDisc)return Object.freeze({
  classification:'strictly-disjoint',contacts:Object.freeze([]),
  discriminant:disc,sourceAlgebraVerified:true});
 if(Math.abs(disc)<=tolDisc)return Object.freeze({
  classification:'tangent-or-near-degenerate-undetermined',
  contacts:Object.freeze([]),discriminant:disc,
  sourceAlgebraVerified:false});
 const sqrtD=Math.sqrt(disc);
 const q=-.5*(B+(B>=0?1:-1)*sqrtD);
 const roots=q===0?[-B/(2*A)]:[q/A,C/q];
 const results=[];
 for(const t of roots){
  if(!finite(t)||t< -tolerance/Math.sqrt(A)||
     t>1+tolerance/Math.sqrt(A))continue;
  const u=Math.min(1,Math.max(0,t));
  const x=from.u+u*dx,y=from.v+u*dy;
  if(x<xRange[0]-tolerance||x>xRange[1]+tolerance||
     sign*(y-circle.coordinateCenter)<-tolerance)continue;
  const residual=(x-circle.xCenter)**2+
   (y-circle.coordinateCenter)**2-circle.radius**2;
  if(!finite(residual)||Math.abs(residual)>
      1e-8*Math.max(1,circle.radius**2))
   throw new RangeError('analytically derived circle-line contact fails residual');
  if(results.some(v=>Math.hypot(v.uv.u-x,v.uv.v-y)<=tolerance))
   continue;
  const onSignedRoot=Math.abs(
   y-circle.coordinateCenter-sign*Math.sqrt(Math.max(0,
    (circle.radius-Math.abs(x-circle.xCenter))*
    (circle.radius+Math.abs(x-circle.xCenter)))))<=
     tolerance*10;
  if(!onSignedRoot)throw new RangeError('wrong signed source arc branch');
  results.push(Object.freeze({parameter:u,uv:Object.freeze({u:x,v:y}),
   exactCircleLineEquationVerified:true,
   signedBranchAndFiniteXRangeVerified:true,
   atSourceArcTerminal:x<=xRange[0]+tolerance||
     x>=xRange[1]-tolerance,
   atSourceLineTerminal:u<=tolerance/Math.sqrt(A)||
     u>=1-tolerance/Math.sqrt(A),
   officialLineStyle:'undetermined'}));
 }
 results.sort((a,b)=>a.uv.u-b.uv.u||a.parameter-b.parameter);
 return Object.freeze({
  classification:results.length?'strictly-transverse-source-contacts':
   'no-in-scope-signed-arc-contact',
  contacts:Object.freeze(results),discriminant:disc,
  sourceAlgebraVerified:true,
  finalVisibilityAndEngineeringLineStyleVerified:false});
}
module.exports={intersectCircleSubarcWithLine};
