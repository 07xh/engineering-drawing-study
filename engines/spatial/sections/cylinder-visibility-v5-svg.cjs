'use strict';
/**
 * DraftAI 04 private visibility-aware V5 presentation adapter.
 *
 * Mathematical section, first-angle sketch coordinates and all visibility
 * partitions are RECOMPUTED from the trusted solvers. Only explicitly chosen
 * observer directions and retained solid side determine style.
 *
 * Existing V5 ActionShapeAttrs doesn't apply visibility dashes. To avoid
 * silently drawing hidden curves as solid, renderVisibilityActionSvg() is an
 * isolated SVG presentation primitive that performs genuine stroke styling.
 */
const {cylinderCapSectionV5Preview}=
 require('./cylinder-cap-section-v5-preview.cjs');
const {classifyCylinderSectionVisibility}=
 require('./cylinder-cut-ray-visibility.cjs');
const {normalizePlane}=require('./axis-cylinder-plane.cjs');
const Timeline=require('../../../workbench/teaching-timeline-v5.js');
const Motion=require('../../../workbench/teaching-motion-v5.js');

const TAU=2*Math.PI;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const PLANES=['V','H','W'];
const STYLE=Object.freeze({
 visible:Object.freeze({lineStyle:'solid',strokeDasharray:'none',stroke:'#222222'}),
 hidden:Object.freeze({lineStyle:'dashed',strokeDasharray:'6 4',stroke:'#424242'}),
 undetermined:Object.freeze({lineStyle:'uncertain',strokeDasharray:'1.5 5',stroke:'#a16207'})
});
function place(view,p,model,sheet){
 const b=model.baseCenter,r=model.radiusMm,h=model.heightMm,s=sheet.scale;
 const v=view==='V'?{x:88+s*(p.x-b.x+r),y:45+s*(b.z+h-p.z)}:
  view==='H'?{x:88+s*(p.x-b.x+r),y:390+s*(p.y-b.y+r)}:
  view==='W'?{x:540+s*(p.y-b.y+r),y:45+s*(b.z+h-p.z)}:null;
 if(!v||![v.x,v.y].every(finite)||v.x<0||v.y<0||
    v.x>sheet.width||v.y>sheet.height)
  throw new RangeError('invalid section point projected onto first-angle preview');
 return v;
}
const pointAt=(angle,model,pl)=>{
 const b=model.baseCenter,r=model.radiusMm,n=pl.normal;
 const x=b.x+r*Math.cos(angle),y=b.y+r*Math.sin(angle);
 const z=pl.point.z-(n.x*(x-pl.point.x)+n.y*(y-pl.point.y))/n.z;
 if(![x,y,z].every(finite))throw new RangeError('nonfinite conic presentation point');
 return {x,y,z};
};
function makeAction(id,p,q,style,run,view){
 const a=place(view,p,run.model,run.sheet);
 const b=place(view,q,run.model,run.sheet);
 const primitive=Math.hypot(a.x-b.x,a.y-b.y)<1e-8?{
  id,kind:'point',geometry:{center:a,radius:3}
 }:{id,kind:'line',geometry:{from:a,to:b}};
 return {...primitive,visibility:run.visibility,
  sourceEdgeId:run.edgeId,observerView:view,
  style:STYLE[run.visibility],
  endpointVisibilityVerified:false};
}
function blocked(reason,status='blocked'){
 return {status:'blocked',reason,sourceStatus:status,
  givens:[],steps:[],timing:null,visibilityByView:{},
  v5PreviewReady:false,visibilityLineStylesFullyVerified:false,
  independentVisibilitySvgRendererReady:false,
  productionUiIntegrated:false,globallyUnique:null};
}
function cylinderVisibilityV5Preview(cylinder,plane,{retainedHalfspace,
  observerDirections,samplesPerTurn=64}={}){
 if(!observerDirections||typeof observerDirections!=='object'||
    Array.isArray(observerDirections)||PLANES.some(k=>!observerDirections[k]))
  throw new TypeError('explicit V/H/W observerDirections required');
 if(!['positive','negative'].includes(retainedHalfspace))
  throw new TypeError('explicit retainedHalfspace required');
 const original=cylinderCapSectionV5Preview(cylinder,plane,{samplesPerTurn});
 if(original.status!=='ready'||original.mathematicalPerimeterVerified!==true)
  return blocked(original.reason||'geometry proof rejected',original.sourceStatus);
 const pl=normalizePlane(plane);
 const visibilityByView={},steps=original.steps.filter(s=>s.role!=='result');
 let totalVisibilityActions=0,unknownRuns=0;
 for(const view of PLANES){
  const evidence=classifyCylinderSectionVisibility(cylinder,plane,{
   retainedHalfspace,observerDirection:observerDirections[view],samplesPerTurn
  });
  if(evidence.status!=='ready'||!evidence.sourcePerimeterVerified)
   return blocked('observer visibility evidence incomplete',evidence.sourceStatus);
  visibilityByView[view]={
   counts:{...evidence.counts},runCount:evidence.totalRuns,
   observerDirection:{...evidence.observerDirection},
   openIntervalsVerified:evidence.visibilityVerified
  };
  unknownRuns+=evidence.counts.undetermined;
  for(const [i,interval] of evidence.runs.entries()){
   const presentationSource={...interval,model:cylinder,sheet:original.sheet};
   const samples=[];
   if(interval.kind==='cap-chord'){
    samples.push(interval.from,interval.to);
   }else{
    const [start,end]=interval.angularInterval;
    const n=Math.max(1,Math.ceil(samplesPerTurn*(end-start)/TAU));
    for(let j=0;j<=n;j++)
     samples.push(pointAt(start+(end-start)*j/n,cylinder,pl));
   }
   const actions=[];
   for(let j=0;j<samples.length-1;j++){
    const a=makeAction('vis-'+view+'-'+(i+1)+'-'+(j+1),
      samples[j],samples[j+1],STYLE[interval.visibility],
      presentationSource,view);
    Motion.actionShapeAttrs(a,1);
    actions.push(a);
   }
   for(let idx=0;idx<actions.length;idx+=48){
    const name='vis-'+view+'-'+(i+1)+'-part-'+(1+Math.floor(idx/48));
    steps.push({id:name,dependsOn:[steps.at(-1).id],
     role:'result',title:view+'：'+
      (interval.visibility==='visible'?'可见实线':
       interval.visibility==='hidden'?'被遮挡虚线':'待确认线型'),
     explanation:'由三维视线与保留实体交点求证；未知区间不可当成标准虚线。',
     actions:actions.slice(idx,idx+48)});
    totalVisibilityActions+=Math.min(48,actions.length-idx);
   }
  }
 }
 if(!totalVisibilityActions)return blocked('zero-length projected construction');
 const timing=Timeline.compileTimeline(steps);
 return {
  status:'ready',sourceStatus:original.sourceStatus,
  givens:original.givens,sheet:original.sheet,steps,timing,
  retainedHalfspace,
  visibilityByView,totalVisibilityActions,unknownRuns,
  visibilityLineStylesFullyVerified:unknownRuns===0,
  v5PreviewReady:true,independentVisibilitySvgRendererReady:true,
  existingV5RendererHonorsCustomDashStyle:false,
  productionUiIntegrated:false,
  completeEngineeringDrawingVerified:false,
  mathematicalPerimeterVerified:true,
  firstAngleObserverConventionsSignedOff:false,
  standardLineStyleSignedOff:false,
  globallyUnique:null,
  proofScope:'verified 1D cut-cylinder perimeter; explicit per-view rays; SVG dash rendering optional, not production first-angle standard'
 };
}
const numeric=x=>{
 if(!finite(x)||Math.abs(x)>1e9)throw new RangeError('invalid SVG numeric attribute');
 return String(Number(x.toFixed(6)));
};
function renderVisibilityActionSvg(action,progress=1){
 if(!action||!['line','point'].includes(action.kind)||
    !['visible','hidden','undetermined'].includes(action.visibility)||
    !/^vis-[VHW]-[0-9]+-[0-9]+$/.test(action.id))
  throw new TypeError('only visibility-verified or explicitly uncertain 04 drawing actions supported');
 const s=STYLE[action.visibility];
 if(action.style?.lineStyle!==s.lineStyle||
    action.style?.strokeDasharray!==s.strokeDasharray)
  throw new TypeError('inconsistent declared visibility stroke style');
 const attrs=Motion.actionShapeAttrs(action,progress);
 const common=' data-visibility="'+action.visibility+'" data-source="'+
  action.sourceEdgeId.replace(/[^a-zA-Z0-9_-]/g,'')+'"';
 if(action.kind==='point')return '<circle cx="'+numeric(attrs.cx)+
  '" cy="'+numeric(attrs.cy)+'" r="'+numeric(attrs.r)+
  '" fill="'+s.stroke+'" opacity="'+numeric(attrs.opacity)+'"'+common+'/>';
 return '<line x1="'+numeric(attrs.x1)+'" y1="'+numeric(attrs.y1)+
  '" x2="'+numeric(attrs.x2)+'" y2="'+numeric(attrs.y2)+
  '" stroke="'+s.stroke+'" stroke-width="1.7" fill="none"'+
  ' stroke-dasharray="'+s.strokeDasharray+'"'+common+'/>';
}
module.exports={cylinderVisibilityV5Preview,renderVisibilityActionSvg};
