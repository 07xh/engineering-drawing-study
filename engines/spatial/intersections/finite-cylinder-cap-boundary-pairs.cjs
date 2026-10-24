'use strict';
/**
 * M3 finite orthogonal-cylinder CAP boundary pairs, analytic (not sampled).
 *
 * Z-axis finite cylinder: (x-Xz)^2+(y-Yz)^2<=Rz^2, z in [z0,z1].
 * Y-axis finite cylinder: (x-Xy)^2+(z-Zy)^2<=Ry^2, y in [y0,y1].
 *
 * The two solid BOUNDARIES each consist of the lateral surface and two
 * closed end disks. This enumerates the three not-yet-covered face pairs:
 *  Z cap disk ∩ Y lateral: z=cap, x=Xy±sqrt(Ry²-(cap-Zy)²);
 *  Y cap disk ∩ Z lateral: y=cap, x=Xz±sqrt(Rz²-(cap-Yz)²);
 *  Z cap disk ∩ Y cap disk: y=capY, z=capZ, x in BOTH disk chords.
 *
 * In this orthogonal-axis family these are straight 3D segments, with
 * exact algebraic endpoints. Strictly positive intervals certify the
 * entire face-pair contact, not merely midpoint samples. Radial tangent,
 * zero-length, almost-coincident and under-resolved contacts fail closed.
 * No claim about union/intersection-solid retained features, graph joins,
 * visibility, standard line styles or final V5 authorization is made.
 */
const {evaluateFiniteOrthogonalCylinderIntersection}=
 require('./finite-orthogonal-cylinders.cjs');
const {project}=require('../../../core/projection/conventions.js');
const finite=Number.isFinite;
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const child of Object.values(x))freeze(child);Object.freeze(x);
}return x;};
function evaluateFiniteCylinderCapBoundaryPairs({input,revision}={}){
 // Delegate shape, source confirmation, bounds and unit validation to the
 // existing M3 specialist, never create a second geometry input contract.
 const lateral=evaluateFiniteOrthogonalCylinderIntersection({input,revision});
 const empty=(status,reason)=>freeze({
  schema:'draftai-m3-finite-cap-boundary-pairs/1',revision,status,reason,
  sourceLateralM3Status:lateral.status,
  capLateralSegments:[],capCapSegments:[],segments:[],
  capRelatedBoundaryPairsCompleteWithinScope:false,
  regularNonzeroSegmentCount:0,allEndpointsOnSourceFacesVerified:false,
  originalLateralLateralTopologyJoined:false,
  fullSolidBoundaryTopologyVerified:false,
  officialLineStylesVerified:false,finalCurveV5Authorized:false});
 if(!['scoped-analytic-ready','none'].includes(lateral.status))
  return empty('not-covered','current lateral M3 geometry is degenerate');
 const Z=input.zCylinder,Y=input.yCylinder;
 const radialScale=Math.max(1,Z.radius,Y.radius);
 const lenTol=1e-8*radialScale;
 const sqTol=1e-11*Math.max(1,Z.radius**2,Y.radius**2);
 const contactSegments=[];
 let uncertain=null;
 const delta=(radius,offset)=>(
  radius-Math.abs(offset))*(radius+Math.abs(offset));
 function sqrtStrict(radical,label){
  if(radical < -sqTol)return null; // provably no contact
  if(radical <=sqTol){uncertain='singular radial tangency at '+label;return null;}
  return Math.sqrt(radical);
 }
 const clips=(low,high,a,b)=>{
  const lo=Math.max(low,a),hi=Math.min(high,b);
  if(hi < lo-lenTol)return null;
  if(hi-lo<=lenTol){
   uncertain='zero-length or near-tangent cap/face intersection';
   return null;
  }
  return [lo,hi];
 };
 function point(x,y,z){return {x,y,z};}
 function append(type,label,faces,from,to,freeAxis,clipSource){
  if(![from.x,from.y,from.z,to.x,to.y,to.z].every(finite))
   throw new RangeError('nonfinite analytic finite-cap boundary');
  const distance=Math.hypot(from.x-to.x,from.y-to.y,from.z-to.z);
  if(!(distance>lenTol))throw new RangeError('collapsed finite-cap source segment');
  if(!['x','y','z'].includes(freeAxis)||
     !faces.length||!faces.every(x=>typeof x==='string'))
   throw new RangeError('missing analytic source face');
  // Independently recompute the constraint on EACH selected face.
  const boundary=faces.includes('zCylinder.lateral')?
   p=>(p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2-Z.radius**2:
   faces.includes('yCylinder.lateral')?
    p=>(p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2-Y.radius**2:
    p=>0;
  const residual=Math.max(Math.abs(boundary(from)),
   Math.abs(boundary(to)))/Math.max(1,Z.radius**2,Y.radius**2);
  if(!finite(residual)||residual>1e-9)
   throw new RangeError('cap-feature surface boundary residual exceeds scope');
  const inside=p=>
   (p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2<=Z.radius**2+sqTol&&
   (p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2<=Y.radius**2+sqTol&&
   p.y>=Y.yMin-lenTol&&p.y<=Y.yMax+lenTol&&
   p.z>=Z.zMin-lenTol&&p.z<=Z.zMax+lenTol;
  if(!inside(from)||!inside(to))
   throw new RangeError('cap boundary segment endpoint outside both solids');
  const mid=point((from.x+to.x)/2,(from.y+to.y)/2,(from.z+to.z)/2);
  if(!inside(mid))throw new RangeError('analytic cap segment not inside both finite solids');
  contactSegments.push({
   id:'capPair'+contactSegments.length,
   pairKind:type,label,sourceFaces:[...faces],
   sourceFreeCoordinate:freeAxis,sourceClipRule:clipSource,
   from:{...from},to:{...to},
   lengthModelMm:distance,
   witnesses:[from,mid,to].map(p=>({point3D:{...p},projections:project(p)})),
   continuousSegmentCertifiedByDiskConvexity:true,
   sourcePairImplicitAndAxialConstraintsVerified:true,
   finiteBoundaryContactVerified:true,
   completeCompositeFeatureContinuationVerified:false,
   officialLineStyle:'undetermined',v5OfficialCurveAuthorized:false
  });
 }
 // Z cap plane meets the *other* finite Y lateral along y, at TWO x
 // radical roots. Clip each against the Z cap disk chord and Y axial caps.
 for(const [capName,capZ] of [['zMin',Z.zMin],['zMax',Z.zMax]]){
  const half=sqrtStrict(delta(Y.radius,capZ-Y.zCenter),
   'Z.'+capName+'/Y.lateral');
  if(half===null)continue;
  for(const side of [-1,1]){
   const x=Y.xCenter+side*half;
   const width=sqrtStrict(delta(Z.radius,x-Z.xCenter),
    'Z.'+capName+'/Y.lateral cap disk chord');
   if(width===null)continue;
   const span=clips(Y.yMin,Y.yMax,Z.yCenter-width,Z.yCenter+width);
   if(!span)continue;
   append('z-cap-to-y-lateral',capName+':'+side,
    ['zCylinder.cap.'+capName,'yCylinder.lateral'],
    point(x,span[0],capZ),point(x,span[1],capZ),'y',
    'intersection of exact Z disk chord and finite Y axial slab');
  }
 }
 // Y cap plane meets Z lateral along z. Clip against Y cap disk and
 // the finite Z axial slab.
 for(const [capName,capY] of [['yMin',Y.yMin],['yMax',Y.yMax]]){
  const half=sqrtStrict(delta(Z.radius,capY-Z.yCenter),
   'Y.'+capName+'/Z.lateral');
  if(half===null)continue;
  for(const side of [-1,1]){
   const x=Z.xCenter+side*half;
   const width=sqrtStrict(delta(Y.radius,x-Y.xCenter),
    'Y.'+capName+'/Z.lateral cap disk chord');
   if(width===null)continue;
   const span=clips(Z.zMin,Z.zMax,Y.zCenter-width,Y.zCenter+width);
   if(!span)continue;
   append('y-cap-to-z-lateral',capName+':'+side,
    ['yCylinder.cap.'+capName,'zCylinder.lateral'],
    point(x,capY,span[0]),point(x,capY,span[1]),'z',
    'intersection of exact Y disk chord and finite Z axial slab');
  }
 }
 // The two cap disks intersect on a constant-y, constant-z line.
 for(const [zName,zCap] of [['zMin',Z.zMin],['zMax',Z.zMax]]){
  for(const [yName,yCap] of [['yMin',Y.yMin],['yMax',Y.yMax]]){
   const zChord=sqrtStrict(delta(Z.radius,yCap-Z.yCenter),
    'cap-cap Z disk '+zName+'/'+yName);
   const yChord=sqrtStrict(delta(Y.radius,zCap-Y.zCenter),
    'cap-cap Y disk '+zName+'/'+yName);
   if(zChord===null||yChord===null)continue;
   const span=clips(Z.xCenter-zChord,Z.xCenter+zChord,
    Y.xCenter-yChord,Y.xCenter+yChord);
   if(!span)continue;
   append('z-cap-to-y-cap',zName+':'+yName,
    ['zCylinder.cap.'+zName,'yCylinder.cap.'+yName],
    point(span[0],yCap,zCap),point(span[1],yCap,zCap),'x',
    'intersection of two exact finite cap disk chord intervals');
  }
 }
 if(uncertain)return empty('degenerate-undetermined',uncertain);
 if(contactSegments.length>32)
  throw new RangeError('finite-cap source face pair count exceeded');
 const capLateral=contactSegments.filter(s=>s.pairKind!=='z-cap-to-y-cap');
 const capCap=contactSegments.filter(s=>s.pairKind==='z-cap-to-y-cap');
 return freeze({
  schema:'draftai-m3-finite-cap-boundary-pairs/1',
  revision,status:'scoped-analytic-cap-boundary-pairs',
  sourceLateralM3Status:lateral.status,
  scope:'three finite orthogonal-cylinder cap-related surface face pair families',
  enumerationIdentity:'two radical fixed-x generators and four cap-plane disk chords',
  capLateralSegments:capLateral,capCapSegments:capCap,
  segments:contactSegments,
  capRelatedBoundaryPairsCompleteWithinScope:true,
  regularNonzeroSegmentCount:contactSegments.length,
  allEndpointsOnSourceFacesVerified:true,
  sourceProofUsesExactCapDiskConvexity:true,
  originalLateralLateralTopologyJoined:false,
  fullSolidBoundaryTopologyVerified:false,
  officialLineStylesVerified:false,finalCurveV5Authorized:false
 });
}
module.exports={evaluateFiniteCylinderCapBoundaryPairs};
