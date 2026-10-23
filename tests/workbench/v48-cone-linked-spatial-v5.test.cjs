'use strict';
/**
 * 09: source-backed spatial preview is ONE existing M3/V5 solution consumer,
 * not a second geometric result or timeline. Independent view transforms
 * may not change the referenced 3D model/ID/segment ordering.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {verifiedConeSpatialIntent}=
 require('../../workbench/verified-cone-spatial-intent.cjs');
const {coneSpatialV5Preview}=
 require('../../workbench/cone-spatial-v5-preview.cjs');
const {coneLinkedSpatialScene}=
 require('../../workbench/cone-linked-spatial-view.cjs');
const P=(x,y,z)=>({x,y,z});
const cone={baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane=z=>({point:P(0,0,z),normal:P(1,0,3),modelUnit:'mm'});
const preview=(kind,z,revision=21)=>coneSpatialV5Preview(cone,plane(z),{
 kind,revision,samples:64,sourceConfirmed:true,
 presentationMode:'split-sheet',provenGuideDag:true
});
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8');
const near=(a,b,eps=1e-7)=>assert.ok(
 Number.isFinite(a)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)));
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test('07 '+kind+' scene preserves all M3 xyz and canonical V5 segment identity',()=>{
  const out=preview(kind,z),model=JSON.stringify(out.spatialIntent);
  const side=coneLinkedSpatialScene(out.spatialIntent,{azimuthDeg:55,elevationDeg:40});
  const front=coneLinkedSpatialScene(out.spatialIntent,{azimuthDeg:-45,elevationDeg:65});
  assert.equal(out.player.canRender(21),true);
  assert.equal(out.timing.steps.length,out.steps.length);
  assert.equal(side.revision,out.revision);
  assert.equal(side.sourceSpatialIntentId,out.spatialIntent.id);
  assert.equal(JSON.stringify(out.spatialIntent),model,'camera must not mutate source');
  assert.equal(side.sourcePoints.length,65);
  assert.equal(side.segments.length,64);
  assert.equal(side.anchors.length,4);
  assert.equal(side.cuttingPlanePatch.length,4);
  assert.equal(side.rim.length,65);
  assert.equal(side.visibilityVerified,false);
  assert.equal(side.physicalCutSolidVerified,false);
  assert.equal(side.trueSilhouetteVerified,false);
  assert.equal(side.constructionStepTimelineOwnedByV5,true);
  assert.deepEqual(side.sourcePoints.map(p=>p.world),
   out.spatialIntent.operation.samplePoints);
  assert.deepEqual(side.anchors.map(a=>a.index),[0,16,32,48]);
  for(const a of side.anchors){
   assert.ok(out.steps.some(s=>s.sourceStepId===a.sourceStepId));
   assert.deepEqual(a.point.world,out.spatialIntent.operation.samplePoints[a.index]);
  }
  for(let i=0;i<64;i++){
   const line=side.segments[i],other=front.segments[i];
   assert.equal(line.index,i+1);
   assert.equal(line.sourceActionId,'cone_V_lateral_'+(i+1));
   assert.ok(out.steps.some(s=>s.actions.some(a=>a.id===line.sourceActionId)));
   assert.equal(other.sourceActionId,line.sourceActionId);
   near(line.from.x,side.sourcePoints[i].screen.x);
   near(line.to.y,side.sourcePoints[i+1].screen.y);
  }
  assert.notDeepEqual(side.rim,front.rim,'rotating must change presentation');
  for(const p of [side.apex,...side.rim,...side.cuttingPlanePatch,
   ...side.sourcePoints.map(v=>v.screen)])
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&
    p.x>=0&&p.x<=360&&p.y>=0&&p.y<=300);
  assert.equal(Boolean(side.capChord),kind==='clipped-ellipse');
 });
}
test('09 unconfirmed, stale or malformed spatial evidence never makes a scene',()=>{
 const unconfirmed=verifiedConeSpatialIntent(cone,plane(6),{
  kind:'full-ellipse',revision:3,sourceConfirmed:false,
  sheetTransform:{origin:{x:0,y:0},scale:1}});
 assert.equal(unconfirmed.status,'not-verified');
 assert.throws(()=>coneLinkedSpatialScene(unconfirmed.spatialIntent),/validated/);
 const out=preview('full-ellipse',6).spatialIntent;
 assert.throws(()=>coneLinkedSpatialScene({...out,revision:22}),/validated/);
 assert.throws(()=>coneLinkedSpatialScene({...out,source:{
  ...out.source,visibilityVerified:true}}),/validated/);
 for(const bad of [{azimuthDeg:181},{elevationDeg:0},{width:0},
  {height:Infinity},{azimuthDeg:NaN}]){
  assert.throws(()=>coneLinkedSpatialScene(out,bad),/camera/);
 }
});
test('07 live page uses a 3D viewport driven by the existing V5 frame',()=>{
 const html=read('labs/cone-cut-live.html');
 const src=read('labs/cone-cut-live-entry.cjs');
 for(const id of ['cone3dSvg','cone3dDraw','cone3dStatus','coneOrbit','coneTilt'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(src,/require\('\.\.\/workbench\/cone-linked-spatial-view\.cjs'\)/);
 assert.match(src,/function paintSpatial\(frame\)/);
 assert.match(src,/paintSpatial\(frame\);/);
 assert.match(src,/frame\.actionFractions\[segment\.sourceActionId\]/);
 assert.match(src,/player\.seekStep\(index\+1,now\(\)\)/);
 assert.match(src,/data-cone-3d-point/);
 assert.match(src,/player\.canRender\(revision\)/);
 assert.doesNotMatch(src,/innerHTML|localStorage|WebSocket|sendBeacon|fetch\s*\(/i);
 const scene=read('workbench/cone-linked-spatial-view.cjs');
 assert.doesNotMatch(scene,/createPlayer|compileTimeline|requestAnimationFrame/);
});
