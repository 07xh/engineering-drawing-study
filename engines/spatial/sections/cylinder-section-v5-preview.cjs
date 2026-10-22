'use strict';
/**
 * 04 isolated FIRST-ANGLE paper-space V5 preview for a mathematically verified
 * complete finite Z-axis cylinder lateral plane section.
 *
 * No production UI, no shared M2/ConstructionStep schema change, no claim of
 * hidden-line, cap faces, scan/OCR recognition, or exact SVG conic rendering.
 */
const {cylinderSectionStations}=require('./cylinder-construction-stations.cjs');
const {intersectCylinderSidePlane}=require('./axis-cylinder-plane.cjs');
const Timeline=require('../../../workbench/teaching-timeline-v5.js');
const Motion=require('../../../workbench/teaching-motion-v5.js');

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const P=(x,y)=>({x,y});
const safePoint=p=>p&&finite(p.x)&&finite(p.y)&&Math.abs(p.x)<1e8&&Math.abs(p.y)<1e8;
const copy=p=>P(p.x,p.y);
function makeSheet(c){
 const r=c.radiusMm,h=c.heightMm,b=c.baseCenter;
 if(!b||!finite(r)||!finite(h)||!finite(b.x)||!finite(b.y)||!finite(b.z)||
    r<=0||h<=0)throw new TypeError('finite cylinder model is required');
 const xMin=b.x-r,yMin=b.y-r,zMax=b.z+h;
 const sx=Math.min(16,290/(2*r),205/(2*r),235/h);
 if(!finite(sx)||sx<=0)throw new RangeError('invalid first-angle scale');
 const sheet={
  width:960,height:680,scale:sx,
  V:{left:88,top:48},H:{left:88,top:395},
  W:{left:550,top:48},transferCorner:P(550,395),
  modelBounds:{xMin,yMin,zMax},
  layout:'first-angle-V-over-H-W-right'
 };
 const asScreen=(view,coords)=>{
  if(!coords||!finite(coords.u)||!finite(coords.v))
   throw new TypeError('invalid model-mm projected point');
  let out;
  if(view==='V')out=P(sheet.V.left+sx*(coords.u-xMin),
    sheet.V.top+sx*(zMax-coords.v));
  else if(view==='H')out=P(sheet.H.left+sx*(coords.u-xMin),
    sheet.H.top+sx*(coords.v-yMin));
  else if(view==='W')out=P(sheet.W.left+sx*(coords.u-yMin),
    sheet.W.top+sx*(zMax-coords.v));
  else throw new TypeError('unsupported orthographic projection');
  if(!safePoint(out)||out.x<0||out.y<0||out.x>sheet.width||out.y>sheet.height)
   throw new RangeError('first-angle model point outside bounded sheet');
  return out;
 };
 return {sheet,asScreen};
}
function line(id,from,to){
 if(!safePoint(from)||!safePoint(to)||Math.hypot(from.x-to.x,from.y-to.y)<1e-8)
  throw new RangeError('zero-length or nonfinite projected construction line '+id);
 return {id,kind:'line',geometry:{from:copy(from),to:copy(to)}};
}
function point(id,center){
 if(!safePoint(center))throw new TypeError('nonfinite paper point');
 return {id,kind:'point',geometry:{center:copy(center),radius:3.5}};
}
function proofBlocked(raw){
 return {status:'blocked',sourceStatus:raw.status,reason:raw.reason||
  'analytic section has no complete verified lateral intersection',
  steps:[],givens:[],timing:null,proof:null,
  v5PreviewReady:false,mathematicallyVerified:false,
  completeEngineeringDrawingVerified:false,globallyUnique:null};
}
function cylinderSectionV5Preview(cylinder,plane,{ordinaryDivisions=8,samples=64}={}){
 if(!Number.isSafeInteger(samples)||samples<16||samples>128||samples%4!==0)
  throw new RangeError('samples must be multiple of four in 16..128');
 const facts=cylinderSectionStations(cylinder,plane,{ordinaryDivisions});
 if(facts.status!=='ready'||facts.modelGeometryVerified!==true)return proofBlocked(facts);
 const section=intersectCylinderSidePlane(cylinder,plane,{samples});
 if(section.status!=='ready'||section.verified!==true||
    section.analyticCurveVerified!==true||!section.closedCurve||
    section.points.length!==samples+1)
  return proofBlocked(section);
 const {sheet,asScreen}=makeSheet(cylinder);
 const convert=(view,model)=>asScreen(view,model);
 const xy=b=>({u:b.x,v:b.y}),xz=b=>({u:b.x,v:b.z}),
  yz=b=>({u:b.y,v:b.z});
 const bounds=cylinder.baseCenter,r=cylinder.radiusMm,
  bottom=bounds.z,top=bottom+cylinder.heightMm;
 // Derived first-angle given-cylinder contours (no hand-drawn fixture).
 const givens=[];
 for(const view of ['V','W']){
  const low=view==='V'?bounds.x:bounds.y;
  const fn=view==='V'?xz:yz;
  const a=convert(view,fn({x:bounds.x-r,y:bounds.y-r,z:bottom})),
   b=convert(view,fn({x:bounds.x+r,y:bounds.y+r,z:bottom})),
   c=convert(view,fn({x:bounds.x-r,y:bounds.y-r,z:top})),
   d=convert(view,fn({x:bounds.x+r,y:bounds.y+r,z:top}));
  if(!finite(low))throw new RangeError('bad cylinder outline');
  givens.push(line('given-'+view+'-left',a,c),
   line('given-'+view+'-right',b,d),
   line('given-'+view+'-base',a,b),
   line('given-'+view+'-top',c,d));
 }
 const hCenter=convert('H',{u:bounds.x,v:bounds.y});
 givens.push({id:'given-H-circle',kind:'circle',
  geometry:{center:hCenter,radius:r*sheet.scale}});
 const depthMax=2*r*sheet.scale;
 const diagonal=line('transfer-45deg',sheet.transferCorner,
  P(sheet.transferCorner.x+depthMax,sheet.transferCorner.y+depthMax));
 const steps=[{
  id:'draw-transfer-45',dependsOn:[],title:'绘制 45° 深度转移辅助线',
  role:'guide',explanation:'45° 线仅进行 H→W 深度转移，不替代数学投影验证。',
  actions:[diagonal]
 }];
 const stationViews=[];
 for(const [index,s] of facts.stations.entries()){
  const v=convert('V',s.projectedPoint.V),
    h=convert('H',s.projectedPoint.H),
    w=convert('W',s.projectedPoint.W);
  // The H horizontal depth at a given station equals W horizontal depth:
  // xW - cornerX === yH - cornerY (metric first-angle transfer).
  const diagonalTarget=P(sheet.transferCorner.x+(h.y-sheet.transferCorner.y),h.y);
  if(Math.abs(diagonalTarget.x-w.x)>1e-7)
   throw new RangeError('first-angle H/W depth-transfer invariant failed');
  const gen=s.projectedGenerator;
  const gvA=convert('V',gen.a.V),gvB=convert('V',gen.b.V);
  const gwA=convert('W',gen.a.W),gwB=convert('W',gen.b.W);
  const prefix='s'+String(index+1);
  const baseId=steps.at(-1).id;
  const idA=prefix+'-generators',idB=prefix+'-projectors';
  steps.push({
   id:idA,dependsOn:[baseId],role:'guide',
   title:'由第 '+(index+1)+' 个解析截点确定辅助母线',
   explanation:'圆柱母线和对应投影由同一个经过曲面/平面残差验证的三维点计算。',
   actions:[
    line(prefix+'-V-generator',gvA,gvB),
    line(prefix+'-W-generator',gwA,gwB),
    point(prefix+'-H-point',h),
    point(prefix+'-V-point',v),
    point(prefix+'-W-point',w)
   ]
  });
  steps.push({
   id:idB,dependsOn:[idA],role:'guide',
   title:'核对第 '+(index+1)+' 个截点的三视联系线',
   explanation:'V/H 同 x、V/W 同高度、H/W 经 45° 深度转移，截点本身来自解析求交。',
   actions:[
    line(prefix+'-VH',v,h),
    line(prefix+'-VW',v,w),
    line(prefix+'-depth',h,diagonalTarget),
    line(prefix+'-depth-to-W',diagonalTarget,w)
   ]
  });
  stationViews.push({
   id:s.id,labels:[...s.labels],thetaRadians:s.thetaRadians,
   V:v,H:h,W:w,transfer:diagonalTarget,
   modelMm:{...s.intersectionMm},residualsMm:{
    plane:s.planeResidualMm,side:s.sideResidualMm,cap:s.capResidualMm}
  });
 }
 // The analytic conic is proven by the 04 math engine, while the V5
 // renderer uses a sampled polyline approximation with an explicit bound.
 const components=section.analytic;
 const chordErrorUpperBoundMm=Math.hypot(
  components.cosine.x,components.cosine.y,components.cosine.z,
  components.sine.x,components.sine.y,components.sine.z)*
  (1-Math.cos(Math.PI/samples));
 for(const view of ['V','H','W']){
  const actions=[];
  for(let j=0;j<samples;j++){
   const a=convert(view,section.projections[j][view]);
   const b=convert(view,section.projections[j+1][view]);
   if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)
    actions.push(line('curve-'+view+'-'+(j+1),a,b));
  }
  // V5 intentionally caps each step to 100 actions. Subdivide longer
  // presentation polylines without weakening that shared safety limit.
  const chunks=Math.ceil(actions.length/64);
  if(!chunks)throw new RangeError('analytic projection has no visible curve edges');
  for(let part=0;part<chunks;part++){
   const last=part===chunks-1;
   const id='sampled-section-'+view+(last?'':'-part-'+(part+1));
   steps.push({id,dependsOn:[steps.at(-1).id],role:'result',
    title:view+' 面截线（解析求交的折线近似）'+(chunks>1?' · '+(part+1)+'/'+chunks:''),
    explanation:'解析交线已经经过模型级验证；屏幕折线是有限分段近似，未计算遮挡线型。',
    actions:actions.slice(part*64,(part+1)*64)});
  }
 }
 const timing=Timeline.compileTimeline(steps);
 // Presentation actions can be exercised through original V5 renderer; no
 // shared 03/07 adapters or public pages are modified.
 for(const step of steps)for(const a of step.actions)
  Motion.actionShapeAttrs(a,1);
 for(const a of givens)Motion.actionShapeAttrs(a,1);
 return {status:'ready',sourceStatus:'ready',sheet,givens,
  steps,timing,stations:stationViews,
  v5PreviewReady:true,mathematicallyVerified:true,
  completeEngineeringDrawingVerified:false,
  firstAngleDepthTransferVerified:true,
  modelUnit:'mm',sampledPolylineOnly:true,
  chordErrorUpperBoundMm,globallyUnique:null,
  proof:{scope:'finite Z-axis cylinder lateral-plane analytic intersection and V/H/W model projections',
   maxResidualMm:Math.max(facts.maxResidualMm,section.maxResidualMm),
   stations:facts.stations.length,curveKind:section.curveKind,
   firstAngleLayout:'V over H; W right of V; 45-degree depth transfer',
   hiddenLineVisibilityVerified:false,solidCapContourVerified:false,
   sharedM2ContractSigned:false}};
}
module.exports={cylinderSectionV5Preview};
