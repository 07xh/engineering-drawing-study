'use strict';
/**
 * DraftAI 04 math research: millimetre-space finite segment/plane intersection
 * and analytic intersection of a Z-axis finite cylinder's LATERAL surface with
 * a plane. Geometry is recomputed, never taken from OCR or a canned SVG.
 *
 * Independent of shared M2 contracts; no claim of cap-cut solid, visibility,
 * full first-angle sheet layout or automatic construction steps.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const point=p=>plain(p)&&['x','y','z'].every(k=>finite(p[k])&&Math.abs(p[k])<=1e8);
const copy=p=>({x:p.x,y:p.y,z:p.z});
const minus=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const length=v=>Math.hypot(v.x,v.y,v.z);
const at=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const E=1e-8;
function normalizePlane(plane){
  if(!plain(plane)||!point(plane.point)||!point(plane.normal))
    throw new TypeError('plane requires finite mm point and normal');
  const magnitude=length(plane.normal);
  if(!finite(magnitude)||magnitude<=1e-12)
    throw new RangeError('degenerate plane normal');
  return {point:copy(plane.point),normal:{
    x:plane.normal.x/magnitude,y:plane.normal.y/magnitude,
    z:plane.normal.z/magnitude
  }};
}
function checkCylinder(c){
  if(!plain(c)||!point(c.baseCenter)||!finite(c.radiusMm)||
    !finite(c.heightMm)||c.radiusMm<=1e-7||c.heightMm<=1e-7||
    c.radiusMm>1e7||c.heightMm>1e7)
    throw new TypeError('finite Z-axis right circular cylinder with positive radius and height in mm required');
  return {baseCenter:copy(c.baseCenter),radiusMm:c.radiusMm,heightMm:c.heightMm};
}
function planeResidual(p,plane){return dot(plane.normal,minus(p,plane.point));}
function sideResidual(p,c){
  const d=Math.hypot(p.x-c.baseCenter.x,p.y-c.baseCenter.y);
  return d-c.radiusMm;
}
function projections(p){
  // Model projections only; no first-angle paper offsets or visibility claims.
  return {V:{u:p.x,v:p.z},H:{u:p.x,v:p.y},W:{u:p.y,v:p.z}};
}
function intersectFiniteSegmentPlane(segment,plane){
  const pl=normalizePlane(plane);
  if(!plain(segment)||!point(segment.a)||!point(segment.b))
    throw new TypeError('finite segment endpoints in model-mm required');
  const a=copy(segment.a),b=copy(segment.b),len=length(minus(a,b));
  if(!finite(len)||len<=1e-9)throw new RangeError('degenerate segment');
  const da=planeResidual(a,pl),db=planeResidual(b,pl);
  const eps=E*Math.max(1,len);
  if(Math.abs(da)<=eps&&Math.abs(db)<=eps)
    return {status:'coincident',point:null,parameter:null,residualMm:null,
      solutionSet:'continuous-segment',globallyUnique:null};
  const denom=db-da;
  if(Math.abs(denom)<=eps)
    return {status:'parallel',point:null,parameter:null,residualMm:null,
      solutionSet:'none',globallyUnique:null};
  const t=-da/denom;
  const teps=eps/Math.max(Math.abs(denom),1e-12);
  if(t < -teps||t>1+teps)
    return {status:'outside-segment',point:null,parameter:null,
      residualMm:null,solutionSet:'none',globallyUnique:null};
  const clamped=Math.max(0,Math.min(1,t));
  const hit=at(a,b,clamped),res=Math.abs(planeResidual(hit,pl));
  if(!point(hit)||res>eps*4)
    return {status:'undetermined',point:null,parameter:null,residualMm:null,
      solutionSet:'numeric-uncertainty',globallyUnique:null};
  return {status:'intersect',point:hit,parameter:clamped,residualMm:res,
    solutionSet:'one-finite-point',globallyUnique:null,
    projection:projections(hit)};
}
function blocked(status,reason,more={}){
  return {status,reason,verified:false,points:[],projections:[],
    globallyUnique:null,modelUnit:'mm',...more};
}
function intersectCylinderSidePlane(cylinder,plane,{samples=64}={}){
  const c=checkCylinder(cylinder),pl=normalizePlane(plane);
  if(!Number.isSafeInteger(samples)||samples<16||samples>256)
    throw new RangeError('analytic curve visualization requires 16..256 samples');
  const radius=c.radiusMm,base=c.baseCenter,top=base.z+c.heightMm;
  if(!finite(top)||Math.abs(top)>1e9)
    throw new RangeError('cylinder exceeds bounded model coordinates');
  const n=pl.normal;
  const eps=E*Math.max(1,radius,c.heightMm);
  const dzResidual=planeResidual(base,pl);
  // Strictly vertical planes produce at most two true straight generators.
  // Near vertical nonzero n.z is not secretly treated as mathematically vertical.
  if(n.z===0){
    const lateral=Math.hypot(n.x,n.y);
    const signedDistance=dzResidual/lateral;
    if(Math.abs(signedDistance)>radius+eps)
      return blocked('none','vertical plane misses cylindrical side');
    const root=Math.sqrt(Math.max(0,radius*radius-signedDistance*signedDistance));
    const cx=base.x-signedDistance*n.x/lateral;
    const cy=base.y-signedDistance*n.y/lateral;
    const ox=-n.y/lateral,oy=n.x/lateral;
    const tangent=root<=eps;
    const signs=tangent?[0]:[-1,1];
    const generators=signs.map((sgn,index)=>{
      const a={x:cx+sgn*root*ox,y:cy+sgn*root*oy,z:base.z};
      const b={x:a.x,y:a.y,z:top};
      return {id:'generator-'+(index+1),a,b,
        residualMm:Math.max(Math.abs(planeResidual(a,pl)),
          Math.abs(planeResidual(b,pl)),
          Math.abs(sideResidual(a,c)),Math.abs(sideResidual(b,c))),
        projectedEndpoints:{a:projections(a),b:projections(b)}};
    });
    if(generators.some(g=>!point(g.a)||!point(g.b)||g.residualMm>eps*4))
      return blocked('undetermined','numeric residual exceeds model tolerance');
    return {status:tangent?'tangent-generator':'two-generators',
      verified:true,modelUnit:'mm',globallyUnique:null,
      geometryKind:'vertical-plane-lateral-generators',
      generators,points:[],projections:[],closedCurve:false,
      completeLateralIntersection:true,
      requiresSolidCapAnalysis:true,
      maxResidualMm:Math.max(...generators.map(g=>g.residualMm)),
      proofScope:'analytic Z-axis cylinder lateral surface + vertical plane'};
  }
  if(Math.abs(n.z)<1e-10)
    return blocked('undetermined','near-vertical plane requires separate numerically stable solver');
  // Exact analytic parameterization: x=cx+r*cos(t), y=cy+r*sin(t),
  // z=cz-[n·(base-plane.point)+r(nx*cos(t)+ny*sin(t))]/nz.
  const zCenter=base.z-dzResidual/n.z;
  const zAmplitude=radius*Math.hypot(n.x,n.y)/Math.abs(n.z);
  if(!finite(zCenter)||!finite(zAmplitude)||Math.abs(zCenter)>1e10||
    zAmplitude>1e10)
    return blocked('undetermined','ill-conditioned section exceeds safe coordinate range');
  const zRange={min:zCenter-zAmplitude,max:zCenter+zAmplitude};
  if(zRange.max<base.z-eps||zRange.min>top+eps)
    return blocked('none','plane misses finite cylindrical side',{zRange});
  if(zRange.min<base.z-eps||zRange.max>top+eps)
    return blocked('clipped','section reaches one or both finite cylinder caps; full clipped topology is not yet solved',
      {zRange,requiresSolidCapAnalysis:true});
  const center={x:base.x,y:base.y,z:zCenter};
  const cosine={x:radius,y:0,z:-radius*n.x/n.z};
  const sine={x:0,y:radius,z:-radius*n.y/n.z};
  const points=[],views=[];let maxResidualMm=0;
  for(let i=0;i<=samples;i++){
    const theta=2*Math.PI*i/samples,cs=Math.cos(theta),sn=Math.sin(theta);
    const q={x:center.x+cosine.x*cs+sine.x*sn,
      y:center.y+cosine.y*cs+sine.y*sn,
      z:center.z+cosine.z*cs+sine.z*sn};
    if(!point(q))return blocked('undetermined','nonfinite sampled section point');
    const r=Math.max(Math.abs(planeResidual(q,pl)),Math.abs(sideResidual(q,c)),
      Math.max(0,base.z-q.z,q.z-top));
    if(!finite(r)||r>eps*4)
      return blocked('undetermined','analytic section failed independent residual verification');
    maxResidualMm=Math.max(maxResidualMm,r);
    points.push(q);views.push(projections(q));
  }
  // Closed mathematical curve is proven by the analytic parameterization;
  // points alone are only an approximate drawing of it.
  return {status:'ready',verified:true,modelUnit:'mm',
    geometryKind:'closed-lateral-plane-section',
    curveKind:Math.hypot(n.x,n.y)<=1e-12?'circle':'ellipse',
    analytic:{center,cosine,sine,parameterRadians:[0,2*Math.PI],zRange},
    points,projections:views,
    sampledPolylineOnly:true,analyticCurveVerified:true,
    closedCurve:true,completeLateralIntersection:true,
    requiresSolidCapAnalysis:false,maxResidualMm,
    globallyUnique:null,
    proofScope:'analytic Z-axis finite right-cylinder lateral intersection; no hidden-line or engineering-sheet proof'};
}
module.exports={normalizePlane,intersectFiniteSegmentPlane,intersectCylinderSidePlane};
