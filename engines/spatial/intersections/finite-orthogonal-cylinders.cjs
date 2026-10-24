'use strict';
/**
 * 05/C3. Finite lateral-lateral intersection of two perpendicular cylinders:
 *  z-axis cylinder (x-cz.x)^2+(y-cz.y)^2=rz^2, z in [zMin,zMax];
 *  y-axis cylinder (x-cy.x)^2+(z-cy.z)^2=ry^2, y in [yMin,yMax].
 * The axes may have distinct X centers (offset axes).
 *
 * Four exact sign choices solve y(x),z(x). Break at EVERY lateral-domain
 * endpoint and cap-plane crossing, plus both radial stationary X centers.
 * On each open cell both radicals are monotonic; midpoint inclusion and
 * endpoint witness checks give COMPLETE lateral-lateral finite-domain
 * classification in the supported nondegenerate algebraic scope.
 * Output is ANALYTIC parametric curve arcs, NOT sampled polylines,
 * not lateral-cap/cap-cap intersections, no opaque-body visibility, official
 * line styles, ConstructionIntent or V5 actions.
 */
const {project}=require('../../../core/projection/conventions.js');
const finite=Number.isFinite;
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){
 for(const x of Object.values(v))freeze(x);Object.freeze(v);
}return v;};
function fail(message){throw new TypeError('M3 finite orthogonal cylinder: '+message);}
function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||
    Object.keys(input).sort().join(',')!=='kind,sourceConfirmed,unit,yCylinder,zCylinder'||
    input.kind!=='finite-orthogonal-cylinder-intersection'||
    input.sourceConfirmed!==true||input.unit!=='mm')
  fail('human-confirmed finite y/z cylinders required');
 const Z=input.zCylinder,Y=input.yCylinder;
 for(const [obj,names] of [[Z,['radius','xCenter','yCenter','zMin','zMax']],
                           [Y,['radius','xCenter','zCenter','yMin','yMax']]]){
  if(!obj||typeof obj!=='object'||Array.isArray(obj)||
     Object.keys(obj).sort().join(',')!==names.sort().join(',')||
     names.some(n=>!finite(obj[n])||Math.abs(obj[n])>1e5)||
     obj.radius<=1e-7||obj.radius>1e5)
   fail('explicit bounded model-mm cylinder radius, axes and caps required');
 }
 if(!(Z.zMax>Z.zMin)&&finite(Z.zMax))fail('z-axis cylinder must have positive finite axial length');
 if(!(Y.yMax>Y.yMin)&&finite(Y.yMax))fail('y-axis cylinder must have positive finite axial length');
 return {Z,Y};
}
function evaluateFiniteOrthogonalCylinderIntersection({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)fail('current source revision required');
 const {Z,Y}=validate(input);
 const minX=Math.max(Z.xCenter-Z.radius,Y.xCenter-Y.radius);
 const maxX=Math.min(Z.xCenter+Z.radius,Y.xCenter+Y.radius);
 const epsX=Math.max(1e-10,1e-11*Math.max(1,
  Math.abs(minX),Math.abs(maxX),Z.radius,Y.radius));
 const domain={minX,maxX};
 const blocked=(status,reason)=>freeze({schema:'draftai-m3-finite-orthogonal-cylinder/1',
   revision,status,reason,scope:'finite-lateral-lateral-only',domain,
   branches:[],branchCount:0,junctionCandidates:[],
   analyticallyCompleteWithinScope:status==='none',
   verifiedCapClipping:status==='none',maxScaledResidual:0,
   projectionWitnessCount:0,sourceConfirmed:true,geometryVerifiedWithinSpecialistScope:status==='none',
   canonicalConstructionReady:false,verifiedVisibility:false,
   constructionIntents:[],steps:[],v5Ready:false,realExerciseAccepted:false});
 if(maxX < minX-epsX)return blocked('none','disjoint radial X supports');
 if(maxX-minX<=epsX)return blocked('degenerate-undetermined',
  'zero-width or near-tangent radial domain needs independent singular topology proof');
 const roots=[minX,maxX,Z.xCenter,Y.xCenter];
 const add=x=>{if(finite(x)&&x>minX+epsX&&x<maxX-epsX)roots.push(x);};
 function capRoots(radialRadius,xCenter,radialCenter,bound){
  const d=bound-radialCenter,r=radialRadius;
  if(Math.abs(d)>r)return;
  const squared=(r-Math.abs(d))*(r+Math.abs(d));
  if(squared<0)return;
  const t=Math.sqrt(Math.max(0,squared));
  add(xCenter-t);add(xCenter+t);
 }
 // y is an AXIAL coordinate of cylinder Y but a radial coordinate of Z.
 for(const y of [Y.yMin,Y.yMax])capRoots(Z.radius,Z.xCenter,Z.yCenter,y);
 // z is axial for cylinder Z and radial for Y.
 for(const z of [Z.zMin,Z.zMax])capRoots(Y.radius,Y.xCenter,Y.zCenter,z);
 const splits=roots.filter(x=>x>=minX&&x<=maxX).sort((a,b)=>a-b)
  .filter((x,i,a)=>i===0||x-a[i-1]>epsX);
 if(splits.length<2)return blocked('degenerate-undetermined','no stable analytic subinterval');
 const coordTol=Math.max(1e-8,1e-9*Math.max(1,Z.radius,Y.radius));
 const maxRadialRemainder=Math.max(1e-7,1e-10*
   Math.max(Z.radius*Z.radius,Y.radius*Y.radius));
 function at(x,signY,signZ){
  const a=(Z.radius-Math.abs(x-Z.xCenter))*
    (Z.radius+Math.abs(x-Z.xCenter));
  const b=(Y.radius-Math.abs(x-Y.xCenter))*
    (Y.radius+Math.abs(x-Y.xCenter));
  if(a < -maxRadialRemainder||b < -maxRadialRemainder)return null;
  const p={x,y:Z.yCenter+signY*Math.sqrt(Math.max(0,a)),
             z:Y.zCenter+signZ*Math.sqrt(Math.max(0,b))};
  if(!Object.values(p).every(finite))return null;
  return p;
 }
 const inside=p=>p&&p.y>=Y.yMin-coordTol&&p.y<=Y.yMax+coordTol&&
   p.z>=Z.zMin-coordTol&&p.z<=Z.zMax+coordTol;
 const residual=p=>{
  const q=(p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2-Z.radius**2;
  const t=(p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2-Y.radius**2;
  return Math.max(Math.abs(q),Math.abs(t))/
   Math.max(1,Z.radius**2,Y.radius**2);
 };
 const branchData=[];
 let maxScaledResidual=0,projectionWitnessCount=0;
 for(const signY of [-1,1])for(const signZ of [-1,1]){
  const kept=[];
  for(let i=0;i<splits.length-1;i++){
   const lo=splits[i],hi=splits[i+1],mid=(lo+hi)/2;
   if(hi-lo<=epsX)continue;
   const center=at(mid,signY,signZ);
   if(!inside(center))continue;
   const from=at(lo,signY,signZ),to=at(hi,signY,signZ);
   if(!inside(from)||!inside(to))return blocked('degenerate-undetermined',
     'cap crossing or singular branch endpoint cannot be independently certified');
   // Numeric witness checks are NOT substituted for the analytic monotonic
   // partition completeness proof; they independently reject unstable bounds.
   const m=Math.max(residual(from),residual(center),residual(to));
   if(!finite(m)||m>1e-9)return blocked('degenerate-undetermined',
     'lateral surface equation residual exceeded proven precision');
   maxScaledResidual=Math.max(maxScaledResidual,m);
   const previous=kept.at(-1);
   if(previous&&Math.abs(previous.to.x-lo)<=epsX)
    previous.to=to; // a stationary radial X split is not a physical endcap
   else kept.push({from,to});
  }
  for(const interval of kept){
   const witnesses=[interval.from,at((interval.from.x+interval.to.x)/2,signY,signZ),interval.to]
    .map(p=>({point:p,projections:project(p)}));
   projectionWitnessCount+=witnesses.length;
   const classifyEndpoint=p=>{
    const yCap=Math.abs(p.y-Y.yMin)<=coordTol||Math.abs(p.y-Y.yMax)<=coordTol;
    const zCap=Math.abs(p.z-Z.zMin)<=coordTol||Math.abs(p.z-Z.zMax)<=coordTol;
    const radialTurn=Math.abs(Math.abs(p.x-Z.xCenter)-Z.radius)<=coordTol||
      Math.abs(Math.abs(p.x-Y.xCenter)-Y.radius)<=coordTol;
    return {yCylinderCap:yCap,zCylinderCap:zCap,radialSignCoalescence:radialTurn,
      needsGlobalJunctionProof:true};
   };
   branchData.push({id:'sy'+(signY<0?'m':'p')+'-sz'+(signZ<0?'m':'p')+
      '-'+branchData.length,signY,signZ,
    analyticFormula:'y=Z.yCenter+sy*sqrt(Z.r²-(x-Z.xCenter)²); z=Y.zCenter+sz*sqrt(Y.r²-(x-Y.xCenter)²)',
    xRange:[interval.from.x,interval.to.x],
    endpoints:[{point:interval.from,events:classifyEndpoint(interval.from)},
      {point:interval.to,events:classifyEndpoint(interval.to)}],
    witnesses,finiteDomainVerified:true,
    completeSegmentVisibilityVerified:false,officialLineStyle:'undetermined',
    vertexJunctionTopologyVerified:false});
  }
 }
 if(!branchData.length)return blocked('none','no lateral-lateral curve lies inside both finite axial extents');
 if(branchData.length>64)return blocked('degenerate-undetermined','branch complexity budget exceeded');
 const junctionCandidates=[];
 for(const b of branchData)for(const endpoint of b.endpoints){
  let row=junctionCandidates.find(t=>Math.hypot(
    t.point.x-endpoint.point.x,t.point.y-endpoint.point.y,
    t.point.z-endpoint.point.z)<=coordTol);
  if(!row){row={point:endpoint.point,incidentBranchIds:[],
      globalTopologyVerified:false};junctionCandidates.push(row);}
  if(!row.incidentBranchIds.includes(b.id))row.incidentBranchIds.push(b.id);
 }
 return freeze({schema:'draftai-m3-finite-orthogonal-cylinder/1',revision,
  status:'scoped-analytic-ready',reason:null,scope:'finite-lateral-lateral-only',
  domain,source:{zCylinder:{...Z},yCylinder:{...Y}},branches:branchData,
  branchCount:branchData.length,junctionCandidates,
  derivation:'two squared lateral equations + four sign branches; analytic cap and radical roots partition monotonic x cells',
  analyticallyCompleteWithinScope:true,verifiedCapClipping:true,
  maxScaledResidual,projectionWitnessCount,
  sourceConfirmed:true,geometryVerifiedWithinSpecialistScope:true,
  lateralCapAndCapCapIntersectionsVerified:false,
  globalJunctionTopologyVerified:false,officialLineStylesVerified:false,
  canonicalConstructionReady:false,verifiedVisibility:false,
  constructionIntents:[],steps:[],v5Ready:false,realExerciseAccepted:false});
}
module.exports={evaluateFiniteOrthogonalCylinderIntersection};
