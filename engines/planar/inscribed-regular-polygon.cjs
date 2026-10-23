'use strict';
/**
 * 02 opt-in M3 specialist: regular 3-/6-gons inscribed in a confirmed circle.
 * Input/output lengths are model-mm. No OCR, book answer, renderer, or V5
 * player is involved. Canonical SolveResult is validated, not redefined.
 *
 * A center, radius and side-count alone admit continuously many rotations:
 * NEVER claim a unique polygon until the source vertex angle and traversal
 * have both been explicitly chosen by the user/reviewed ProblemDraft.
 */
const {validateSolveResult}=require('../../core/contracts/solve-result.js');
const TAU=2*Math.PI;
const DEGREES=Math.PI/180;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const boundedPoint=p=>p&&typeof p==='object'&&!Array.isArray(p)&&
 Object.keys(p).length===2&&['x','y'].every(k=>finite(p[k])&&Math.abs(p[k])<=1e6);
const point=p=>({x:p.x,y:p.y});
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function checkedSolveResult(data){
 const check=validateSolveResult(data);
 if(!check.ok)throw new TypeError('canonical SolveResult invalid: '+check.errors.join('; '));
 return data;
}
function unresolved(status,reason,degrees=null,proofLevel='none'){
 return {status,reason,unit:'mm',verified:false,vertices:[],edges:[],
  constructionReady:false,globallyUnique:status==='continuous'?false:null,
  solveResult:checkedSolveResult({status,
   scope:'02/inscribed-regular-polygon',
   solutions:[],solutionCount:null,degrees,localDegrees:degrees,rank:null,
   globallyUnique:status==='continuous'?false:null,maxResidual:null,
   proofLevel,diagnostics:[reason]})};
}
function regularPolygonInCircle(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))
  throw new TypeError('confirmed finite model geometry object required');
 const allowed=['center','radiusMm','sideCount','firstVertexAngleDeg','direction','revision','unit'];
 for(const key of Object.keys(input))
  if(!allowed.includes(key))throw new TypeError('unknown polygon field '+key);
 if(input.unit!=='mm'||!boundedPoint(input.center)||
    !finite(input.radiusMm)||input.radiusMm<=1e-6||input.radiusMm>1e6||
    !Number.isSafeInteger(input.revision)||input.revision<0)
  throw new TypeError('confirmed mm circle and revision required');
 if(!Number.isSafeInteger(input.sideCount)||input.sideCount<3||
    input.sideCount>24)throw new RangeError('sideCount must be an integer from 3 to 24');
 if(![3,6].includes(input.sideCount))
  return {...unresolved('unsupported','only regular triangles and hexagons are certified'),
   sideCount:input.sideCount,revision:input.revision};
 if(input.firstVertexAngleDeg!==undefined&&
    (!finite(input.firstVertexAngleDeg)||input.firstVertexAngleDeg<0||
     input.firstVertexAngleDeg>=360))
  throw new RangeError('firstVertexAngleDeg must be finite in [0, 360)');
 if(input.direction!==undefined&&!['cw','ccw'].includes(input.direction))
  throw new RangeError('direction must be cw or ccw');
 if(input.firstVertexAngleDeg===undefined)
  return {...unresolved('continuous','circle alone leaves an arbitrary rotation',
   1,'analytic'),sideCount:input.sideCount,revision:input.revision};
 if(input.direction===undefined)
  return {...unresolved('undetermined','explicit vertex traversal is required'),
   sideCount:input.sideCount,revision:input.revision};
 const n=input.sideCount,r=input.radiusMm,center=point(input.center);
 const sign=input.direction==='ccw'?1:-1;
 const step=sign*TAU/n,start=input.firstVertexAngleDeg*DEGREES;
 const vertices=Array.from({length:n},(_,i)=>{
  const angle=start+i*step;
  return {id:'v'+(i+1),x:center.x+r*Math.cos(angle),
   y:center.y+r*Math.sin(angle)};
 });
 const expectedSide=2*r*Math.sin(Math.PI/n);
 const expectedArea=n*r*r*Math.sin(TAU/n)/2;
 const edges=vertices.map((v,i)=>{
  const next=vertices[(i+1)%n],actual=length(v,next);
  return {id:'e'+(i+1),fromId:v.id,toId:next.id,
   lengthMm:actual};
 });
 const maxRadiusError=Math.max(...vertices.map(v=>
  Math.abs(length(v,center)-r)));
 const maxChordError=Math.max(...edges.map(e=>Math.abs(e.lengthMm-expectedSide)));
 const sumX=vertices.reduce((s,v)=>s+(v.x-center.x),0);
 const sumY=vertices.reduce((s,v)=>s+(v.y-center.y),0);
 const centroidError=Math.hypot(sumX/n,sumY/n);
 let signedDoubleArea=0;
 for(let i=0;i<n;i++){
  const a=vertices[i],b=vertices[(i+1)%n];
  signedDoubleArea+=(a.x-center.x)*(b.y-center.y)-
    (b.x-center.x)*(a.y-center.y);
 }
 const actualArea=Math.abs(signedDoubleArea/2);
 const areaErrorMm2=Math.abs(actualArea-expectedArea);
 const mmResidual=Math.max(maxRadiusError,maxChordError,centroidError,
  areaErrorMm2/Math.max(1,r));
 const toleranceMm=1e-8*Math.max(1,r);
 const windingVerified=sign*signedDoubleArea>0;
 if(!finite(mmResidual)||!windingVerified||mmResidual>toleranceMm)
  return {...unresolved('undetermined','regular-polygon residual/winding proof failed'),
   sideCount:n,revision:input.revision};
 const solveResult=checkedSolveResult({
  status:'unique',scope:'02/inscribed-regular-polygon/fixed-orientation',
  solutions:[{centerX:center.x,centerY:center.y,radiusMm:r,
   sideLengthMm:expectedSide,areaMm2:expectedArea}],
  solutionCount:1,degrees:0,localDegrees:0,rank:null,globallyUnique:true,
  maxResidual:mmResidual,proofLevel:'analytic',
  diagnostics:['Only unique under a confirmed first vertex AND traversal']});
 return {status:'ready',unit:'mm',verified:true,
  revision:input.revision,sideCount:n,center,radiusMm:r,
  firstVertexAngleDeg:input.firstVertexAngleDeg,direction:input.direction,
  proofScope:'selected-circle-and-orientation',
  globallyUniqueWithinConfirmedInputs:true,
  // Semantic source geometry for future 07 canonical Intent conversion.
  // Do NOT claim these edges are already V5 animated or OCR solved.
  vertices,edges,sideLengthMm:expectedSide,
  perimeterMm:n*expectedSide,areaMm2:expectedArea,
  maxRadiusErrorMm:maxRadiusError,maxChordErrorMm:maxChordError,
  centroidErrorMm,areaErrorMm2,maxResidualMm:mmResidual,
  toleranceMm,windingVerified,constructionReady:false,
  solveResult};
}
module.exports={regularPolygonInCircle};
