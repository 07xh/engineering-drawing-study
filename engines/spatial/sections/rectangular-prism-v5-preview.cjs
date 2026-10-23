'use strict';
/**
 * 04: independently recomputed, verified rectangular-prism plane-section
 * polygon -> model-coherent first-angle three-view construction timeline.
 *
 * The V/H/W glyph locations and 45-degree transfer are mathematical model
 * projections only; no actual occlusion, line visibility, filled section or
 * official engineering drawing standard has been signed off.
 */
const {prismPlaneSection}=require('./rectangular-prism-plane.cjs');
const Timeline=require('../../../workbench/teaching-timeline-v5.js');
const Motion=require('../../../workbench/teaching-motion-v5.js');
const VIEWS=['V','H','W'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const coord=(x,y)=>({x,y});
function blocked(proof){
 return {status:'blocked',sourceStatus:proof.status,
  reason:proof.reason||'not a verified finite prism section',
  sheet:null,givens:[],steps:[],timing:null,stations:[],
  v5PreviewReady:false,visibilityVerified:false,
  firstAngleConventionSignedOff:false,globallyUnique:null};
}
function paper(box){
 const min=box.min,max=box.max,dx=max.x-min.x,
  dy=max.y-min.y,dz=max.z-min.z;
 const scale=Math.min(13,260/dx,245/dy,250/dz);
 if(!finite(scale)||scale<=0)throw new RangeError('invalid bounded prism presentation');
 const sheet={width:960,height:680,scale,
  V:{left:85,top:40},H:{left:85,top:382},
  W:{left:542,top:40},transferCorner:coord(542,382),
  convention:'first-angle-model-V-top-H-bottom-W-right'};
 function place(view,pr){
  if(!pr||!finite(pr.u)||!finite(pr.v))throw new TypeError('finite mm projection required');
  const xy=view==='V'?
   coord(85+scale*(pr.u-min.x),40+scale*(max.z-pr.v)):
   view==='H'?
   coord(85+scale*(pr.u-min.x),382+scale*(pr.v-min.y)):
   view==='W'?
   coord(542+scale*(pr.u-min.y),40+scale*(max.z-pr.v)):null;
  if(!xy||![xy.x,xy.y].every(finite)||
    xy.x<0||xy.y<0||xy.x>sheet.width||xy.y>sheet.height)
   throw new RangeError('prism orthographic projection outside bounded paper');
  return xy;
 }
 return {sheet,place};
}
function shape(id,a,b){
 if(!a||!b||![a.x,a.y,b.x,b.y].every(finite))
  throw new TypeError('finite paper endpoints required');
 if(Math.hypot(a.x-b.x,a.y-b.y)<1e-8)
  return {id,kind:'point',geometry:{center:{...a},radius:3.5}};
 return {id,kind:'line',geometry:{from:{...a},to:{...b}}};
}
function dot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z;}
function prismSectionV5Preview(box,plane){
 const proof=prismPlaneSection(box,plane);
 if(proof.status!=='ready'||!proof.verified||!proof.perimeterVerified||
  proof.vertices.length<3||proof.vertices.length>6||
  proof.perimeter.length!==proof.vertices.length)return blocked(proof);
 const {sheet,place}=paper(box),min=box.min,max=box.max;
 const xy=(view,p)=>place(view,
  view==='V'?{u:p.x,v:p.z}:view==='H'?{u:p.x,v:p.y}:{u:p.y,v:p.z});
 const given=[];
 // The *bounding rectangles* are projections of the actual prism extrema;
 // they do not claim a visibility/hidden-line classification.
 for(const view of VIEWS){
  const a=view==='W'?min.y:min.x,
   b=view==='W'?max.y:max.x,
   low=view==='H'?min.y:min.z,
   high=view==='H'?max.y:max.z;
  const q=[[a,low],[b,low],[b,high],[a,high]].map(([u,v])=>place(view,{u,v}));
  for(let i=0;i<4;i++)
   given.push(shape('prism-given-'+view+'-'+(i+1),q[i],q[(i+1)%4]));
 }
 const corner=sheet.transferCorner;
 const diag=shape('prism-guide-45deg',corner,
  coord(corner.x+(max.y-min.y)*sheet.scale,
   corner.y+(max.y-min.y)*sheet.scale));
 const steps=[{id:'prism-transfer-45',role:'guide',dependsOn:[],
  title:'绘制 H→W 的 45° 深度转移线',
  explanation:'45° 线来自相同的模型毫米尺度，不是预置截图。',
  actions:[diag]}];
 const stations=[];
 for(const [i,vertex] of proof.vertices.entries()){
  const actual=vertex.point,V=xy('V',actual),H=xy('H',actual),W=xy('W',actual);
  const transfer=coord(corner.x+(H.y-corner.y),H.y);
  if(Math.abs(V.x-H.x)>1e-7||Math.abs(V.y-W.y)>1e-7||
   Math.abs(W.x-transfer.x)>1e-7||
   Math.abs(transfer.x-corner.x-(transfer.y-corner.y))>1e-7)
   throw new RangeError('three-view prism transfer invariant failed');
  const prefix='prism-station-'+(i+1);
  const source=vertex.sourceEdgeIds;
  if(!source.length||!source.every(x=>/^edge-vertex-[01]{3}-axis-[012]$/.test(x)))
   throw new TypeError('missing verified source edge provenance');
  const marks=[
   {id:prefix+'-V',kind:'point',geometry:{center:V,radius:3.5}},
   {id:prefix+'-H',kind:'point',geometry:{center:H,radius:3.5}},
   {id:prefix+'-W',kind:'point',geometry:{center:W,radius:3.5}}
  ];
  const markId='prism-mark-'+(i+1);
  steps.push({id:markId,role:'guide',dependsOn:[steps.at(-1).id],
   title:'定位第 '+(i+1)+' 个真实空间截点',
   explanation:'求交来自长方棱柱实际有限棱边：'+source.join('、')+'。',
   actions:marks});
  steps.push({id:'prism-link-'+(i+1),role:'guide',
   dependsOn:[markId],title:'通过投影联系线转移第 '+(i+1)+' 点',
   explanation:'V/H 同 X，V/W 同 Z，H/W 以 45° 转移同一模型深度 Y。',
   actions:[
    shape(prefix+'-VH',V,H),shape(prefix+'-VW',V,W),
    shape(prefix+'-H45',H,transfer),shape(prefix+'-45W',transfer,W)
   ]});
  stations.push({
   id:vertex.id,sourceEdgeIds:[...source],
   modelMm:{...actual},V,H,W,transfer,
   planeResidualMm:vertex.planeResidualMm,
   boxOutsideMm:vertex.boxOutsideMm
  });
 }
 for(const [i,edge] of proof.perimeter.entries()){
  const a=stations[i],b=stations[(i+1)%stations.length];
  if(edge.fromId!==a.id||edge.toId!==b.id)
   throw new RangeError('section graph ordering does not match verified polygon');
  const actions=VIEWS.map(view=>({
   ...shape('prism-section-'+(i+1)+'-'+view,a[view],b[view]),
   sourceSectionEdgeId:edge.id,visibility:'undetermined'
  }));
  steps.push({id:'prism-draw-edge-'+(i+1),role:'result',
   dependsOn:[steps.at(-1).id],
   title:'逐笔连接截面多边形第 '+(i+1)+' 边',
   explanation:'三视投影均来自同一条经过平面/实体残差验证的真实截面边。尚未核验可见线型。',
   actions});
 }
 const timing=Timeline.compileTimeline(steps);
 for(const action of given)Motion.actionShapeAttrs(action,1);
 for(const step of steps)for(const action of step.actions)
  Motion.actionShapeAttrs(action,1);
 return {status:'ready',modelUnit:'mm',sheet,givens:given,
  steps,timing,stations,areaMm2:proof.areaMm2,
  perimeterMm:proof.perimeterMm,sectionEdgeCount:proof.edgeCount,
  v5PreviewReady:true,mathematicalPerimeterVerified:true,
  visibilityVerified:false,firstAngleConventionSignedOff:false,
  constructionStandardSignedOff:false,completeEngineeringDrawingVerified:false,
  globallyUnique:null,
  proof:{sourceEdges:proof.proof.sourcePrismEdges,
   planeResidualMm:proof.maxResidualMm,polygonDegreeTwo:true,
   sourcePlane:plane,viewConvention:'unreviewed first-angle model projection',
   occlusionVerified:false,sectionInteriorVerified:false}
 };
}
module.exports={prismSectionV5Preview};
