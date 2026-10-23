'use strict';
/** 04 mathematical rectangular-pyramid section -> genuine V5 construction.
 * Explicit model geometry only; source lines and result visibility are not
 * certified as formal first-angle or engineering-standard line styles. */
const {pyramidPlaneSection}=require('./rectangular-pyramid-plane.cjs');
const Timeline=require('../../../workbench/teaching-timeline-v5.js');
const Motion=require('../../../workbench/teaching-motion-v5.js');
const VIEWS=['V','H','W'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const at=(x,y)=>({x,y});
const blocked=result=>({status:'blocked',reason:result.reason||'unverified pyramid cut',
 sourceStatus:result.status,steps:[],givens:[],timing:null,stations:[],
 v5PreviewReady:false,visibilityVerified:false,globallyUnique:null});
function shape(id,a,b){
 if(!a||!b||![a.x,a.y,b.x,b.y].every(finite))
  throw new TypeError('finite pyramid paper coordinates required');
 if(Math.hypot(a.x-b.x,a.y-b.y)<1e-8)
  return {id,kind:'point',geometry:{center:{...a},radius:3.5}};
 return {id,kind:'line',geometry:{from:{...a},to:{...b}}};
}
function pyramidSectionV5Preview(pyramid,plane){
 const proof=pyramidPlaneSection(pyramid,plane);
 if(proof.status!=='ready'||!proof.verified||!proof.perimeterVerified||
    proof.vertices.length<3||proof.vertices.length>5||
    proof.perimeter.length!==proof.vertices.length)return blocked(proof);
 const b=pyramid.base,apex=pyramid.apex;
 const dx=b.maxX-b.minX,dy=b.maxY-b.minY,dz=apex.z-b.z;
 const scale=Math.min(13,260/dx,245/dy,250/dz);
 if(!finite(scale)||scale<=0)throw new RangeError('unsupported pyramid scale');
 const sheet={width:960,height:680,scale,V:{left:85,top:40},
  H:{left:85,top:382},W:{left:542,top:40},
  transferCorner:at(542,382),
  convention:'unreviewed model first-angle layout'};
 function place(view,point){
  if(!point||!['x','y','z'].every(k=>finite(point[k])))
   throw new TypeError('finite 3D source point required');
  const q=view==='V'?
   at(85+scale*(point.x-b.minX),40+scale*(apex.z-point.z)):
   view==='H'?
   at(85+scale*(point.x-b.minX),382+scale*(point.y-b.minY)):
   view==='W'?
   at(542+scale*(point.y-b.minY),40+scale*(apex.z-point.z)):null;
  if(!q||q.x<0||q.y<0||q.x>sheet.width||q.y>sheet.height)
   throw new RangeError('pyramid projection is outside fixed paper');
  return q;
 }
 const source=[
  {x:b.minX,y:b.minY,z:b.z},{x:b.maxX,y:b.minY,z:b.z},
  {x:b.maxX,y:b.maxY,z:b.z},{x:b.minX,y:b.maxY,z:b.z},
  {...apex}
 ];
 const sourceEdges=[
  ...[0,1,2,3].map(i=>({id:'base-edge-'+i,from:i,to:(i+1)%4})),
  ...[0,1,2,3].map(i=>({id:'apex-edge-'+i,from:i,to:4}))
 ];
 const givens=[];
 for(const view of VIEWS)for(const edge of sourceEdges){
  givens.push({...shape('pyramid-given-'+view+'-'+edge.id,
   place(view,source[edge.from]),place(view,source[edge.to])),
   sourcePyramidEdgeId:edge.id,sourceView:view});
 }
 const corner=sheet.transferCorner;
 const transfer=shape('pyramid-transfer-45deg',corner,
  at(corner.x+dy*scale,corner.y+dy*scale));
 const steps=[{id:'pyramid-guide-45',role:'guide',dependsOn:[],
  title:'绘制真实模型深度的 45° 辅助线',
  explanation:'由已知 Y 向底边尺寸在同一图纸比例上推导，不是示意模板。',
  actions:[transfer]}];
 const stations=[];
 for(const [i,q] of proof.vertices.entries()){
  if(!/^(base|apex)-edge-[0-3]$/.test(q.sourceEdgeId))
   throw new TypeError('section point lacks finite source pyramid edge');
  const P=q.point,V=place('V',P),H=place('H',P),W=place('W',P);
  const T=at(corner.x+(H.y-corner.y),H.y);
  if([V.x-H.x,V.y-W.y,T.x-W.x,
   (T.x-corner.x)-(T.y-corner.y)].some(n=>Math.abs(n)>1e-7))
   throw new RangeError('pyramid three-view projection-transfer identity failed');
  const key='pyramid-cut-point-'+(i+1);
  const marks=VIEWS.map(view=>({
   id:key+'-'+view,kind:'point',
   geometry:{center:{...{V,H,W}[view]},radius:3.5}
  }));
  const markId='pyramid-mark-'+(i+1);
  steps.push({id:markId,role:'guide',dependsOn:[steps.at(-1).id],
   title:'投影第 '+(i+1)+' 个真实截点',
   explanation:'截平面与有限空间棱 '+q.sourceEdgeId+' 的解析交点。',
   actions:marks});
  steps.push({id:'pyramid-link-'+(i+1),role:'guide',dependsOn:[markId],
   title:'联动第 '+(i+1)+' 点的三视投影与 45° 深度',
   explanation:'V/H 共 X，V/W 共 Z，H/W 经 45° 等比例转移相同的 Y。',
   actions:[
    shape(key+'-VH',V,H),shape(key+'-VW',V,W),
    shape(key+'-H45',H,T),shape(key+'-45W',T,W)
   ]});
  stations.push({id:q.id,sourceEdgeId:q.sourceEdgeId,
   sourceFaces:[...q.sourceFaces],modelMm:{...P},
   V,H,W,transfer:T,planeResidualMm:q.planeResidualMm});
 }
 for(const [i,edge] of proof.perimeter.entries()){
  const a=stations[i],z=stations[(i+1)%stations.length];
  if(edge.fromId!==a.id||edge.toId!==z.id||
     !/^(base|side-[0-3])$/.test(edge.sourceFaceId))
   throw new RangeError('source-face-verified pyramid polygon mismatches V5 station order');
  steps.push({id:'pyramid-draw-edge-'+(i+1),role:'result',
   dependsOn:[steps.at(-1).id],
   title:'逐视图描画第 '+(i+1)+' 条真实截交线',
   explanation:'两端来自源棱平面求交，结果边位于 '+edge.sourceFaceId+
    '；遮挡和制图国标线型尚未证明。',
   actions:VIEWS.map(view=>({
    ...shape('pyramid-section-'+(i+1)+'-'+view,a[view],z[view]),
    sourceSectionEdgeId:edge.id,
    sourcePyramidFaceId:edge.sourceFaceId,
    visibility:'undetermined'
   }))});
 }
 const timing=Timeline.compileTimeline(steps);
 for(const action of [...givens,...steps.flatMap(s=>s.actions)])
  Motion.actionShapeAttrs(action,1);
 return {status:'ready',sheet,givens,steps,timing,stations,
  modelUnit:'mm',sectionEdgeCount:proof.edgeCount,
  areaMm2:proof.areaMm2,perimeterMm:proof.perimeterMm,
  mathematicalPerimeterVerified:true,v5PreviewReady:true,
  visibilityVerified:false,firstAngleConventionSignedOff:false,
  completeEngineeringDrawingVerified:false,globallyUnique:null,
  proof:{sourcePyramidEdges:8,polygonDegreeTwo:true,
   sourceSectionFaces:proof.perimeter.map(e=>e.sourceFaceId),
   maxResidualMm:proof.maxResidualMm,
   paperProjectionOnly:true,sourceSectionInteriorVerified:false}
 };
}
module.exports={pyramidSectionV5Preview};
