'use strict';
/**
 * Exact M0 original-vertex vs ORIGINAL second source segment proof for an
 * already-known M4 endpoint event. This is NOT a second paper event finder.
 * It refines only canonical source events at true t=0/1 M0 vertices.
 *
 * All binary64 inputs are interpreted EXACTLY as dyadics. The projected
 * source parameter is a rational numerator/denominator; never round it to
 * a float or grant a native HLR generated-endpoint/TopoDS source identity.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {dyadic:d,difference:sub,product:mul,sum,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
const point3=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const dot=(xyz,ray)=>['x','y','z'].reduce((acc,k)=>
 sum(acc,mul(xyz[k],d(ray[k]))),d(0));
const difference3=(a,b)=>({
 x:sub(d(a.x),d(b.x)),y:sub(d(a.y),d(b.y)),z:sub(d(a.z),d(b.z))
});
const cross=(a,b)=>sub(mul(a.u,b.v),mul(a.v,b.u));
const pair=(a,b)=>({u:sub(d(a.u),d(b.u)),v:sub(d(a.v),d(b.v))});
function certifyExactM4OriginalVertexVsOtherSourceDepth({
 geometry,view,vertexSourceEdge,originalSourceParameter,otherSourceEdge
}={}){
 if(!VIEWS.includes(view)||!geometry?.data?.points||
    !Array.isArray(vertexSourceEdge)||vertexSourceEdge.length!==2||
    !Array.isArray(otherSourceEdge)||otherSourceEdge.length!==2||
    ![0,1].includes(originalSourceParameter))
  throw new TypeError('original model vertex t=0/1 and both source edges in V/H/W required');
 const pts=geometry.data.points,vertexId=vertexSourceEdge[originalSourceParameter];
 const vertex=pts[vertexId],first=pts[otherSourceEdge[0]],
  second=pts[otherSourceEdge[1]];
 if(![vertex,first,second].every(point3))
  throw new RangeError('finite authentic original M0 3D source vertices required');
 const p=project(vertex)[view],a=project(first)[view],b=project(second)[view];
 const direction=pair(b,a),from=pair(p,a);
 const notOnLine=sign(cross(direction,from))!==0;
 const axis=sign(direction.u)!==0?'u':sign(direction.v)!==0?'v':null;
 if(notOnLine||axis===null)return freeze({
  exactOriginalVertexOnOtherProjectedLine:false,
  exactOriginalVertexOnOtherProjectedClosedSource:false,
  exactOtherOriginalSourceInteriorAtVertex:false,
  exactOtherOriginalSourceParameterEndpoint:null,
  exactOriginalVertexDepthRelativeOtherSourceSign:null,
  exactOriginal3DPhysicalVertexSharedBySourceEdges:false,
  actualNativeHLRGeneratedPaperAlignmentCertified:false,
  generatedHLRToOriginalSourceTopoDSHistoryProven:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
 const num=from[axis],den=direction[axis],s=sign(den);
 const within=sign(num)*s>=0&&sign(sub(den,num))*s>=0;
 const strictlyWithin=sign(num)*s>0&&sign(sub(den,num))*s>0;
 const endpoint=within?(sign(num)===0?0:
  sign(sub(den,num))===0?1:null):null;
 const ray=FIRST_ANGLE_OBSERVER_RAYS[view];
 // sign of depth(vertex - (a + (num/den)*(b-a))) toward observer
 const depthNum=sub(mul(den,dot(difference3(vertex,first),ray)),
  mul(num,dot(difference3(second,first),ray)));
 const observerDepth=within?sign(depthNum)*s:null;
 const sameOriginalVertex=within&&endpoint!==null&&
  vertexId===otherSourceEdge[endpoint];
 return freeze({
  view,original3DVertexId:vertexId,
  exactOriginalVertexOnOtherProjectedLine:true,
  exactOriginalVertexOnOtherProjectedClosedSource:within,
  exactOtherOriginalSourceInteriorAtVertex:within&&strictlyWithin,
  exactOtherOriginalSourceParameterEndpoint:endpoint,
  exactOriginalVertexDepthRelativeOtherSourceSign:observerDepth,
  exactOriginal3DPhysicalVertexSharedBySourceEdges:sameOriginalVertex,
  samePaperAndExactObserverDepthTie:within&&observerDepth===0,
  // The generated HLR may have a one-ULP paper displacement even
  // when the ORIGINAL two M0 edges share the very same 3D vertex.
  actualNativeHLRGeneratedPaperAlignmentCertified:false,
  generatedHLRToOriginalSourceTopoDSHistoryProven:false,
  globalSceneAndJunctionDepthProofCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}
module.exports={certifyExactM4OriginalVertexVsOtherSourceDepth};
