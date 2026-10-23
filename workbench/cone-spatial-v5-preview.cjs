'use strict';
/**
 * 04/07: existing M3 -> verified 3D Spatial Intent -> the ONE V5 Timeline.
 * A sampled-curve PROJECTION PREVIEW, not proven compass construction, solid
 * interior, hidden-line visibility or a standards-approved first-angle sheet.
 * The new split-sheet mode is opt-in; legacy single-transform mode remains.
 */
const {verifiedConeSpatialIntent}=require('./verified-cone-spatial-intent.cjs');
const {toSheet,fromSheet}=require('../core/projection/conventions.js');
const Timeline=require('./teaching-timeline-v5.js');
const Motion=require('./teaching-motion-v5.js');
const VIEWS=['V','H','W'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const point=p=>({x:p.x,y:p.y});
function separateTransforms(cone){
 const b=cone.baseCenter,r=cone.radiusMm,h=cone.heightMm;
 if(!b||!['x','y','z'].every(k=>finite(b[k]))||
    !finite(r)||!finite(h)||r<=0||h<=0||!finite(b.z+h))
  throw new TypeError('finite model-mm cone required for split sheet');
 const scale=Math.min(12,260/(2*r),240/(2*r),250/h);
 if(!finite(scale)||scale<=0)
  throw new RangeError('unrepresentable cone on split sheet');
 // Explicit signed first-angle MODEL projection, using the common
 // core/projection toSheet policy instead of hardcoded second conventions.
 const transforms={
  V:{origin:{x:85+(b.x+r)*scale,y:40+(b.z+h)*scale},scale},
  H:{origin:{x:85+(b.x+r)*scale,y:382+(r-b.y)*scale},scale},
  W:{origin:{x:542+(r-b.y)*scale,y:40+(b.z+h)*scale},scale}
 };
 return {transforms,sheet:{
  width:960,height:680,scale,transferCorner:{x:542,y:382},
  convention:'preview-only: V above H; W right of V, 45-degree depth'
 }};
}
function action(id,from,to,meta={}){
 if(![from?.x,from?.y,to?.x,to?.y].every(finite))
  throw new TypeError('nonfinite cone V5 geometry');
 const shape=distance(from,to)<1e-8
  ?{id,kind:'point',geometry:{center:point(from),radius:2.8}}
  :{id,kind:'line',geometry:{from:point(from),to:point(to)}};
 const a={...shape,...meta,durationMs:150};
 Motion.actionShapeAttrs(a,0.5);
 return a;
}
function coneSpatialV5Preview(cone,plane,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))
  throw new TypeError('finite reviewed cone options required');
 const allowed=['kind','sourceConfirmed','revision','sheetTransform',
  'samples','presentationMode'];
 if(Object.keys(options).some(k=>!allowed.includes(k)))
  throw new TypeError('untrusted caller-supplied proof or drawing input');
 const {kind='full-ellipse',sourceConfirmed=false,revision=0,samples=64,
  presentationMode='single-transform'}=options;
 if(!['single-transform','split-sheet'].includes(presentationMode))
  throw new TypeError('unsupported cone V5 presentation mode');
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('nonnegative source revision required');
 if(!Number.isSafeInteger(samples)||samples<32||samples>256)
  throw new RangeError('cone visualization samples must be 32..256');
 const proofOptions={kind,sourceConfirmed,revision,samples,
  sheetTransform:options.sheetTransform||(
   presentationMode==='split-sheet'?{origin:{x:0,y:0},scale:1}:undefined)};
 const result=verifiedConeSpatialIntent(cone,plane,proofOptions);
 if(result.status!=='ready')
  return {...result,steps:[],timing:null,player:null,
   v5ProjectionPreviewReady:false};
 if(!result.mathematicallyVerified||
    !result.firstAngleCoordinateMappingVerified||
    result.v5StepsReady!==false||result.firstAngleLayoutVerified!==false||
    result.spatialIntent.source.visibilityVerified!==false||
    result.spatialIntent.operation.samplePoints.length!==samples+1)
  throw new RangeError('spatial source proof scope mismatch');
 const source=result.spatialIntent;
 const split=presentationMode==='split-sheet';
 const layout=split?separateTransforms(cone):null;
 const position={V:[],H:[],W:[]};
 const tol=Math.max(1e-7*Math.max(1,cone.radiusMm,cone.heightMm),
  128*Number.EPSILON*Math.max(1,
   ...Object.values(cone.baseCenter).map(Math.abs)));
 for(const view of VIEWS){
  for(let i=0;i<=samples;i++){
   const q=source.operation.samplePoints[i],uv=result.projectionSamples[view][i];
   const expected=view==='V'?[q.x,q.z]:
    view==='H'?[q.x,q.y]:[q.y,q.z];
   if(Math.hypot(uv.u-expected[0],uv.v-expected[1])>tol)
    throw new RangeError('3D source projection disagreement');
   const xy=split?toSheet(view,uv,layout.transforms[view]):
    result.sheetViews[view][i];
   if(split){
    const back=fromSheet(view,xy,layout.transforms[view]);
    if(Math.hypot(back.u-uv.u,back.v-uv.v)>tol||
       xy.x<0||xy.y<0||xy.x>960||xy.y>680)
     throw new RangeError('split first-angle model mapping out of bounds');
   }
   if(!finite(xy.x)||!finite(xy.y))
    throw new RangeError('nonfinite spatial source point');
   position[view].push(point(xy));
  }
 }
 const signature=JSON.stringify({cone,plane,kind,sourceConfirmed,revision,samples,
  presentationMode,sheetTransform:options.sheetTransform});
 if(signature.length>10000)throw new RangeError('unbounded cone input');
 const steps=[];
 const append=(id,title,role,actions)=>{
  steps.push({id,title,role,
   dependsOn:steps.length?[steps.at(-1).id]:[],
   sourceSpatialIntentId:source.id,sourceRevision:revision,actions});
 };
 if(split){
  const corner=layout.sheet.transferCorner;
  append('cone_45_guide','45° source-depth transfer (model-mm)','guide',[
   action('cone_45_diagonal',corner,{
    x:corner.x+2*cone.radiusMm*layout.sheet.scale,
    y:corner.y+2*cone.radiusMm*layout.sheet.scale
   },{visibility:'undetermined'})
  ]);
  const indices=[0,Math.floor(samples/4),Math.floor(samples/2),
   Math.floor(3*samples/4),...(kind==='clipped-ellipse'?[samples]:[])];
  for(const [j,index] of [...new Set(indices)].entries()){
   const V=position.V[index],H=position.H[index],W=position.W[index];
   const corner=layout.sheet.transferCorner;
   const t={x:corner.x+(H.y-corner.y),y:H.y};
   if(Math.max(Math.abs(V.x-H.x),Math.abs(V.y-W.y),
     Math.abs(t.x-W.x),Math.abs((t.x-corner.x)-(t.y-corner.y)))>1e-6)
    throw new RangeError('45-degree projected depth invariant failed');
   const name='cone_station_'+j;
   append(name+'_marks','Proven model point '+(j+1),'guide',
    [V,H,W].map((q,k)=>({
     id:name+'_point_'+VIEWS[k],kind:'point',
     geometry:{center:point(q),radius:3.2},durationMs:150
    })));
   append(name+'_transfer','Proven V/H/W point transfer '+(j+1),'guide',[
    action(name+'_VH',V,H),action(name+'_VW',V,W),
    action(name+'_H45',H,t),action(name+'_45W',t,W)
   ]);
  }
 }
 // A V5 step can hold at most 100 actions. Chunk the actual source segments
 // instead of constraining the specialist solver to a lower sample budget.
 const GROUP=96;
 for(const view of VIEWS){
  const actions=[];
  for(let i=1;i<=samples;i++){
   const from=position[view][i-1],to=position[view][i];
   if(distance(from,to)<1e-9)continue;
   actions.push(action('cone_'+view+'_lateral_'+i,from,to,{
    sourceBoundary:'analytic-cone-lateral',
    sourceSpatialIntentId:source.id,sourceRevision:revision,
    visibility:'undetermined',sampledPolylineOnly:true
   }));
  }
  if(kind==='clipped-ellipse'){
   const chord=source.operation.capChord;
   const first=source.operation.samplePoints[0],last=source.operation.samplePoints.at(-1);
   const dist3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
   if(!chord||dist3(last,chord.start)>tol||dist3(first,chord.end)>tol)
    throw new RangeError('directed cone cap chord lacks verified topology');
   const from=position[view][samples],to=position[view][0];
   if(distance(from,to)>=1e-9||split)
    actions.push(action('cone_'+view+'_cap_chord',from,to,{
     sourceBoundary:'verified-cone-cap-chord',sourceSpatialIntentId:source.id,
     sourceRevision:revision,visibility:'undetermined'
    }));
  }
  if(!actions.length)throw new RangeError('no drawable cone projection');
  for(let i=0;i<actions.length;i+=GROUP){
   const batch=actions.slice(i,i+GROUP),part=i/GROUP;
   // Keep backward-compatible step identifiers for the 64-sample default.
   const id=actions.length<=GROUP?'cone_'+view:'cone_'+view+'_'+(part+1);
   append(id,view+' sampled analytic cone section, visibility unknown',
    'result',batch);
  }
 }
 if(steps.length>300)throw new RangeError('single V5 step budget exceeded');
 for(const s of steps)for(const a of s.actions)Motion.actionShapeAttrs(a,.5);
 const timing=Timeline.compileTimeline(steps,{durations:{line:65},gapMs:120});
 const stillCurrent=(currentRevision=revision)=>currentRevision===revision&&
  JSON.stringify({cone,plane,kind,sourceConfirmed,revision,samples,
   presentationMode,sheetTransform:options.sheetTransform})===signature;
 return {status:'preview-only',revision,spatialIntent:source,
  mathematicallyVerified:true,firstAngleCoordinateMappingVerified:true,
  firstAngleLayoutVerified:false,visibilityVerified:false,
  constructionStepsReady:false,publicWorkbenchConnected:false,
  v5ProjectionPreviewReady:true,
  presentationMode,splitSheet:split?layout.sheet:null,
  viewPositions:split?position:null,
  steps,timing,player:Timeline.createPlayer(timing,{revision}),
  stillCurrent,
  createPlayer({speed=1}={}){
   if(!stillCurrent())throw new RangeError('stale source: recompute spatial Intent');
   return Timeline.createPlayer(timing,{revision,speed});
  },
  presentationKind:'sampled-projection-polyline-not-exact-compass-construction'};
}
module.exports={coneSpatialV5Preview};