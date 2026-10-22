'use strict';
/**
 * DraftAI 04: internal V5 presentation for the rigorously verified 1D
 * perimeter of a plane-sectioned finite Z-axis right cylinder.
 *
 * Recomputes cap chords and lateral arcs from math; never trusts caller SVG.
 * Geometry/closedness is proven; occlusion, hatching, model interpretation,
 * source-image OCR and production construction-contract certification are not.
 */
const {finiteCylinderSectionBoundary}=
 require('./finite-cylinder-section-boundary.cjs');
const Timeline=require('../../../workbench/teaching-timeline-v5.js');
const Motion=require('../../../workbench/teaching-motion-v5.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const P=(x,y)=>({x,y});
const valid=p=>p&&finite(p.x)&&finite(p.y);
const copy=p=>P(p.x,p.y);
function paper(cylinder){
 const {baseCenter:b,radiusMm:r,heightMm:h}=cylinder;
 const scale=Math.min(16,245/(2*r),230/h);
 if(!finite(scale)||scale<=0)throw new RangeError('invalid first-angle paper scale');
 const config={
  width:960,height:680,scale,
  V:{left:88,top:45},H:{left:88,top:390},W:{left:540,top:45},
  transferCorner:P(540,390),
  convention:'first-angle-V-above-H-W-right'
 };
 function place(view,p){
  if(!p||!finite(p.u)||!finite(p.v))throw new TypeError('finite model view coordinate required');
  const out=view==='V'?P(88+scale*(p.u-b.x+r),45+scale*(b.z+h-p.v)):
    view==='H'?P(88+scale*(p.u-b.x+r),390+scale*(p.v-b.y+r)):
    view==='W'?P(540+scale*(p.u-b.y+r),45+scale*(b.z+h-p.v)):null;
  if(!valid(out)||out.x<0||out.y<0||out.x>960||out.y>680)
   throw new RangeError('unbounded first-angle drawing coordinates');
  return out;
 }
 return {config,place};
}
function segment(id,a,b){
 if(!valid(a)||!valid(b))throw new TypeError('nonfinite line geometry');
 const len=Math.hypot(a.x-b.x,a.y-b.y);
 if(len<=1e-8)return {id,kind:'point',geometry:{center:copy(a),radius:3}};
 return {id,kind:'line',geometry:{from:copy(a),to:copy(b)}};
}
const mark=(id,center)=>({id,kind:'point',geometry:{center:copy(center),radius:3.5}});
function blocked(proof){
 return {status:'blocked',sourceStatus:proof.status,
  reason:proof.reason||'unverified plane-section perimeter',
  steps:[],givens:[],timing:null,
  modelGeometryVerified:false,v5PreviewReady:false,
  completeEngineeringDrawingVerified:false,globallyUnique:null};
}
function cylinderCapSectionV5Preview(cylinder,plane,{samplesPerTurn=64}={}){
 const proof=finiteCylinderSectionBoundary(cylinder,plane,{samplesPerTurn});
 if(proof.status!=='ready'||proof.solidSectionPerimeterVerified!==true||
    proof.boundaryVerified!==true||proof.contourLoops.length!==1)
  return blocked(proof);
 const {config:sheet,place}=paper(cylinder);
 const b=cylinder.baseCenter,r=cylinder.radiusMm,h=cylinder.heightMm;
 const V=p=>place('V',{u:p.x,v:p.z});
 const H=p=>place('H',{u:p.x,v:p.y});
 const W=p=>place('W',{u:p.y,v:p.z});
 const source=[];
 // Source outline is geometrically derived, NOT a visibility declaration.
 for(const [view,xmin,xmax] of [
  ['V',b.x-r,b.x+r],['W',b.y-r,b.y+r]]){
  const xy=(u,z)=>place(view,{u,v:z});
  const a=xy(xmin,b.z),d=xy(xmax,b.z),
    c=xy(xmin,b.z+h),e=xy(xmax,b.z+h);
  source.push(segment('given-'+view+'-left',a,c),
   segment('given-'+view+'-right',d,e),
   segment('given-'+view+'-bottom',a,d),
   segment('given-'+view+'-top',c,e));
 }
 source.push({id:'given-H-round',kind:'circle',
  geometry:{center:H(b),radius:r*sheet.scale}});
 const diagonal=segment('cap-transfer-45deg',sheet.transferCorner,
  P(sheet.transferCorner.x+2*r*sheet.scale,
    sheet.transferCorner.y+2*r*sheet.scale));
 const steps=[{
  id:'cap-45-transfer',dependsOn:[],
  role:'guide',title:'绘制 45° 深度转移辅助线',
  explanation:'H/W 的深度对应来自当前已知有限圆柱的毫米坐标。',
  actions:[diagonal]
 }];
 const nodeScreens=[];
 for(const [i,node] of proof.nodes.entries()){
  const id='cap-node-'+(i+1),v=V(node),hh=H(node),w=W(node);
  const q=P(sheet.transferCorner.x+(hh.y-sheet.transferCorner.y),hh.y);
  if(Math.abs(v.x-hh.x)>1e-7||Math.abs(v.y-w.y)>1e-7||
     Math.abs(w.x-q.x)>1e-7||Math.abs(q.y-hh.y)>1e-7||
     Math.abs((q.x-sheet.transferCorner.x)-(q.y-sheet.transferCorner.y))>1e-7)
   throw new RangeError('first-angle V/H/W or 45-degree transfer invariant failed');
  const marks='mark-'+id,links='guide-'+id;
  steps.push({id:marks,dependsOn:[steps.at(-1).id],role:'guide',
   title:'投影解析截面边界端点 '+(i+1),
   explanation:'此三维点来自真正的圆柱侧面及端盖弦线连接，数学上已验证。',
   actions:[mark('p-'+id+'-V',v),mark('p-'+id+'-H',hh),mark('p-'+id+'-W',w)]});
  const guideActions=[
   segment(id+'-VH',v,hh),segment(id+'-VW',v,w),
   segment(id+'-H45',hh,q),segment(id+'-45W',q,w)
  ];
  steps.push({id:links,dependsOn:[marks],role:'guide',
   title:'核验第 '+(i+1)+' 点三视联系线及深度转移',
   explanation:'V/H 同横坐标、V/W 同高度、H/W 经过 45° 等尺度转移。',
   actions:guideActions});
  nodeScreens.push({id,modelMm:{...node},V:v,H:hh,W:w,transfer:q});
 }
 let totalResultActions=0;
 for(const [index,edge] of proof.boundaryEdges.entries()){
  for(const view of ['V','H','W']){
   const draw=[];
   if(edge.kind==='cap-chord'){
    const a=place(view,edge.projectedEndpoints.start[view]);
    const b2=place(view,edge.projectedEndpoints.end[view]);
    draw.push(segment('cap-edge-'+index+'-'+view,a,b2));
   }else{
    for(let j=0;j<edge.pointProjections.length-1;j++){
     const a=place(view,edge.pointProjections[j][view]);
     const b2=place(view,edge.pointProjections[j+1][view]);
     draw.push(segment('side-edge-'+index+'-'+view+'-'+j,a,b2));
    }
   }
   // V5 imposes <=100 actions/step. Use 64 to allow safe future metadata.
   for(let start=0;start<draw.length;start+=64){
    const chunk=draw.slice(start,start+64);
    const id='draw-edge-'+index+'-'+view+'-'+Math.floor(start/64);
    steps.push({id,dependsOn:[steps.at(-1).id],role:'result',
     title:(edge.kind==='cap-chord'?'绘制圆柱端盖真实截线':'逐笔绘制解析侧面截弧')+
       ' · '+view,
     explanation:edge.kind==='cap-chord'?
      '弦线属于截平面与真实端盖圆盘；端点已与侧面交线拓扑闭合。':
      '曲线有解析数学依据，屏幕仅为有限折线近似；不判定可见与隐藏线。',
     actions:chunk});
    totalResultActions+=chunk.length;
   }
  }
 }
 const timing=Timeline.compileTimeline(steps);
 for(const a of source)Motion.actionShapeAttrs(a,1);
 for(const s of steps)for(const a of s.actions)Motion.actionShapeAttrs(a,1);
 return {
  status:'ready',sourceStatus:proof.sourceStatus,
  v5PreviewReady:true,modelGeometryVerified:true,
  mathematicalPerimeterVerified:true,
  completeEngineeringDrawingVerified:false,
  steps,givens:source,timing,sheet,nodes:nodeScreens,
  boundaryEdgeCount:proof.boundaryEdges.length,
  lateralArcCount:proof.lateralArcCount,capChordCount:proof.capChordCount,
  resultActions:totalResultActions,
  sampledLateralPolylinesOnly:true,
  chordErrorUpperBoundMm:proof.chordErrorUpperBoundMm,
  globallyUnique:null,
  proof:{scope:'verified 1D finite-cylinder plane-section perimeter projected to first-angle preview',
   maxResidualMm:proof.maxResidualMm,
   maxJoinMismatchMm:proof.maxJoinMismatchMm,
   topologyClosed:true,
   3dSolidSectionInteriorVerified:false,
   hiddenLineVisibilityVerified:false,
   sharedM2ContractSigned:false}
 };
}
module.exports={cylinderCapSectionV5Preview};
