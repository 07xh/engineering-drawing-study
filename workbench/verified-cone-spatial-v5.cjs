'use strict';
/**
 * #372 M3 -> versioned 3D spatial Intent -> first-angle model projections
 * -> existing ONE 07 V5 Timeline/Motion. This is a projection-only PREVIEW:
 * finite analytic cone boundary source points are verified, the intersample
 * polyline is approximate, and visibility / hidden lines / official drawing
 * layout / solid interior remain unverified. No second solver or V5 player.
 */
const {verifiedConeSpatialIntent}=
 require('./verified-cone-spatial-intent.cjs');
const {validateSpatialConstructionIntent}=
 require('../core/contracts/spatial-construction-intent.js');
const {toSheet,fromSheet}=
 require('../core/projection/conventions.js');
const Timeline=require('./teaching-timeline-v5.js');
const Motion=require('./teaching-motion-v5.js');
const VIEWS=Object.freeze(['V','H','W']);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const xyz=p=>p&&['x','y','z'].every(k=>finite(p[k]));
const point=p=>({x:p.x,y:p.y});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const blocked=(revision,reason,solverStatus='undetermined')=>({
 status:'not-verified',revision,reason,solverStatus,spatialIntent:null,
 sheet:null,steps:[],timing:null,stations:[],
 mathematicallyVerified:false,v5ProjectionPreviewReady:false,
 visibilityVerified:false,firstAngleLayoutVerified:false,
 completeEngineeringDrawingVerified:false
});
function paperForCone(cone){
 const b=cone.baseCenter,r=cone.radiusMm,h=cone.heightMm;
 if(!xyz(b)||!finite(r)||!finite(h)||r<=0||h<=0)
  throw new TypeError('bounded finite cone required before sheet projection');
 const scale=Math.min(12,260/(2*r),240/(2*r),250/h);
 const apexZ=b.z+h;
 if(!finite(scale)||scale<=0||!finite(apexZ))
  throw new RangeError('unrepresentable spatial drawing scale');
 // Match the SAME signed V/H/W conventions used by core/projection,
 // with separate physical panels and one model-mm/pixel scale.
 const transforms={
  V:{origin:{x:85+(b.x+r)*scale,y:40+apexZ*scale},scale},
  H:{origin:{x:85+(b.x+r)*scale,y:382+(r-b.y)*scale},scale},
  W:{origin:{x:542+(r-b.y)*scale,y:40+apexZ*scale},scale}
 };
 const sheet={width:960,height:680,scale,
  transferCorner:{x:542,y:382},
  layout:'model-coherent-first-angle-preview-not-standard-certified'};
 return {transforms,sheet};
}
function v5Point(id,p){
 return {id,kind:'point',geometry:{center:point(p),radius:3.2},
  durationMs:140};
}
function v5Edge(id,a,b,source){
 if(![a.x,a.y,b.x,b.y].every(finite))
  throw new RangeError('nonfinite first-angle projected edge');
 const shape=dist(a,b)<1e-8?
  {id,kind:'point',geometry:{center:point(a),radius:2.5}}:
  {id,kind:'line',geometry:{from:point(a),to:point(b)}};
 return {...shape,durationMs:150,
  sourceSpatialIntentId:source.id,sourceRevision:source.revision,
  sourceBoundaryKind:source.kind,
  visibility:'undetermined',sampledPolylineOnly:true};
}
function verifiedConeThreeViewTimeline(cone,plane,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))
  throw new TypeError('reviewed cone section options required');
 const keys=['kind','revision','sourceConfirmed','samples'];
 if(Object.keys(options).some(k=>!keys.includes(k)))
  throw new TypeError('unexpected caller-supplied proof/animation field');
 const {kind='full-ellipse',revision=0,sourceConfirmed=false,samples=64}=options;
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('nonnegative source revision required');
 if(!Number.isSafeInteger(samples)||samples<32||samples>256)
  throw new RangeError('cone drawing samples must be 32..256');
 if(!['full-ellipse','clipped-ellipse'].includes(kind))
  throw new TypeError('unsupported cone section kind');
 if(sourceConfirmed!==true)
  return blocked(revision,'cone and plane parameters require user confirmation');
 // No caller-supplied spatial Intent, proof or sampled points are accepted.
 const verified=verifiedConeSpatialIntent(cone,plane,{
  kind,revision,sourceConfirmed,samples,
  sheetTransform:{origin:{x:0,y:0},scale:1}
 });
 if(verified.status!=='ready'||verified.mathematicallyVerified!==true||
    verified.firstAngleCoordinateMappingVerified!==true||
    !verified.spatialIntent)
  return blocked(revision,verified.reason||'trusted 3D source unavailable',
   verified.solverStatus);
 const source=verified.spatialIntent,geometry=source.operation;
 if(!validateSpatialConstructionIntent(source).ok||
    source.revision!==revision||source.source.v5StepsReady!==false||
    source.source.visibilityVerified!==false||
    geometry.geometryKind!==kind||
    geometry.samplePoints.length!==samples+1)
  throw new TypeError('stale or overstated 3D source evidence');
 const {sheet,transforms}=paperForCone(cone);
 const position={V:[],H:[],W:[]};
 const tolerance=Math.max(1e-7*Math.max(1,cone.radiusMm,cone.heightMm),
  128*Number.EPSILON*Math.max(1,
   ...Object.values(cone.baseCenter).map(Math.abs)));
 for(let i=0;i<geometry.samplePoints.length;i++){
  const q=geometry.samplePoints[i];
  for(const view of VIEWS){
   const uv=source.projectionSamples[view][i];
   const xy=toSheet(view,uv,transforms[view]);
   const back=fromSheet(view,xy,transforms[view]);
   if(!finite(xy.x)||!finite(xy.y)||
      xy.x<0||xy.x>sheet.width||xy.y<0||xy.y>sheet.height||
      Math.hypot(back.u-uv.u,back.v-uv.v)>tolerance)
    throw new RangeError('cone sheet mapping is not bounded/reversible');
   // Independent check against 3D source point and shared view axes.
   const expect=view==='V'?[q.x,q.z]:view==='H'?[q.x,q.y]:[q.y,q.z];
   if(Math.hypot(uv.u-expect[0],uv.v-expect[1])>tolerance)
    throw new RangeError('source projection disagrees with the 3D cone');
   position[view].push(point(xy));
  }
 }
 const steps=[],stations=[];
 function append(id,role,title,explanation,actions){
  const dep=steps.length?[steps.at(-1).id]:[];
  steps.push({id,role,dependsOn:dep,title,explanation,actions,
   sourceSpatialIntentId:source.id,sourceRevision:revision});
 }
 const corner=sheet.transferCorner;
 append('cone-guide-45','guide','45° 深度转移',
  'V/H/W 与真实模型共用毫米比例，但工程图纸版式与虚实线尚未验收。',[
  v5Edge('cone-guide-diagonal',corner,
   {x:corner.x+2*cone.radiusMm*sheet.scale,
    y:corner.y+2*cone.radiusMm*sheet.scale},
   {id:source.id,revision,kind:'auxiliary-transfer'})
 ]);
 const stationIndices=[0,Math.floor(samples/4),Math.floor(samples/2),
  Math.floor(3*samples/4),...(kind==='clipped-ellipse'?[samples]:[])];
 for(const [j,i] of [...new Set(stationIndices)].entries()){
  const V=position.V[i],H=position.H[i],W=position.W[i];
  const transfer={x:corner.x+(H.y-corner.y),y:H.y};
  if(Math.max(Math.abs(V.x-H.x),Math.abs(V.y-W.y),
   Math.abs(transfer.x-W.x),
   Math.abs(transfer.x-corner.x-(transfer.y-corner.y)))>1e-6)
   throw new RangeError('45-degree transfer of verified cone point failed');
  const prefix='cone-station-'+(j+1);
  append(prefix+'-marks','guide','定位真实圆锥截点 '+(j+1),
   '空间坐标来自已验证解析圆锥与截平面方程。',[
    v5Point(prefix+'-V',V),v5Point(prefix+'-H',H),
    v5Point(prefix+'-W',W)
   ]);
  append(prefix+'-transfer','guide','连接截点三视投影 '+(j+1),
   'V/H 同 X，V/W 同 Z，H/W 使用 45° 模型深度转移。',[
    v5Edge(prefix+'-VH',V,H,{id:source.id,revision,kind:'guide'}),
    v5Edge(prefix+'-VW',V,W,{id:source.id,revision,kind:'guide'}),
    v5Edge(prefix+'-H45',H,transfer,{id:source.id,revision,kind:'guide'}),
    v5Edge(prefix+'-45W',transfer,W,{id:source.id,revision,kind:'guide'})
   ]);
  stations.push({modelMm:{...geometry.samplePoints[i]},
   sampleIndex:i,V,H,W,transfer});
 }
 for(let i=0;i<samples;i++){
  append('cone-curve-'+(i+1),'result',
   '逐笔描绘解析圆锥截曲线 '+(i+1)+'/'+samples,
   '每个顶点有解析残差证据；相邻顶点之间是折线近似，不是解析曲线本身。'+
   '遮挡线型尚未验证。',
   VIEWS.map(view=>v5Edge('cone-curve-'+(i+1)+'-'+view,
    position[view][i],position[view][i+1],
    {id:source.id,revision,kind:'lateral-sampled-segment'})));
 }
 let capChordActions=0;
 if(kind==='clipped-ellipse'){
  const chord=geometry.capChord;
  if(!chord||!xyz(chord.start)||!xyz(chord.end))
   throw new TypeError('certified clipped cone base chord required');
  const last=geometry.samplePoints.at(-1),first=geometry.samplePoints[0];
  const dist3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  if(dist3(last,chord.start)>tolerance||
     dist3(first,chord.end)>tolerance)
   throw new RangeError('oriented cap chord does not close cone perimeter');
  append('cone-cap-chord','result','连接已证实的底面截弦',
   '底面圆与截平面的真交弦，从侧面截弧终点连回起点；遮挡未知。',
   VIEWS.map(view=>v5Edge('cone-cap-chord-'+view,
    position[view][samples],position[view][0],
    {id:source.id,revision,kind:'verified-base-chord'})));
  capChordActions=3;
 }
 if(steps.length>300)throw new RangeError('cone exceeds existing V5 step budget');
 const timing=Timeline.compileTimeline(steps,{gapMs:30});
 for(const action of steps.flatMap(s=>s.actions))
  Motion.actionShapeAttrs(action,.5);
 const signature=JSON.stringify({cone,plane,kind,revision,sourceConfirmed,samples});
 const isCurrent=currentRevision=>
  currentRevision===revision&&
  JSON.stringify({cone,plane,kind,revision,sourceConfirmed,samples})===signature;
 return {
  status:'ready',revision,sourceSpatialIntentId:source.id,
  spatialIntent:source,modelUnit:'mm',sheet,
  positions:position,stations,steps,timing,
  sectionKind:kind,strokeCount:samples*3+capChordActions,
  mathematicallyVerified:true,firstAngleCoordinateMappingVerified:true,
  v5ProjectionPreviewReady:true,
  // These are deliberately NOT promoted by projection-only animation:
  spatialIntentV5Certified:false,visibilityVerified:false,
  firstAngleLayoutVerified:false,completeEngineeringDrawingVerified:false,
  sourceConfirmation:'caller-reviewed-parameters',
  proofScope:verified.proofScope,
  isCurrent,
  createPlayer({speed=1}={}){
   if(!isCurrent(revision))
    throw new RangeError('source changed: recompute cone evidence before V5 playback');
   return Timeline.createPlayer(timing,{revision,speed});
  }
 };
}
module.exports={verifiedConeThreeViewTimeline};