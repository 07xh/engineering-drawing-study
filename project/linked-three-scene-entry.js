/* WebGL presentation of the ONE canonical Geometry Scene.
 * Reuses the already pinned Three.js + OrbitControls + Raycaster from the
 * DOF lab. No new geometry solver, visibility classifier or V5 timeline.
 * SVG remains the supported fallback if this viewer cannot mount.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Consumer from './geometry-scene-consumer.cjs';
import Analytic from '../core/geometry/analytic-curve-3d.cjs';
import Views from '../core/projection/geometry-scene-views.cjs';
const {sourceFeatureKey}=Consumer;
const {atAnalyticCurve3D}=Analytic;
const {SCHEMA}=Views;
const validPoint=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const vec=p=>new THREE.Vector3(p.x,p.y,p.z);
const MAX_FEATURES=25000;

function mount(container,{onPick}={}){
 if(!container||typeof onPick!=='function')return null;
 const canvas=document.createElement('canvas');
 canvas.setAttribute('aria-label','三维几何交互视图：拖动旋转，点击棱线与 V/H/W 联动');
 canvas.setAttribute('role','img');
 canvas.style.cssText='width:100%;height:100%;display:block;touch-action:none';
 let renderer=null;
 try{
  if(!canvas.getContext('webgl2',{antialias:true}))return null;
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,
   powerPreference:'low-power'});
 }catch(_){renderer?.dispose();return null;}
 const threeScene=new THREE.Scene();
 threeScene.background=new THREE.Color(0xf5f9ff);
 const camera=new THREE.OrthographicCamera(-100,100,70,-70,.01,100000);
 camera.up.set(0,0,1);
 const controls=new OrbitControls(camera,canvas);
 controls.enablePan=false;controls.enableDamping=true;
 controls.dampingFactor=.12;controls.minZoom=.3;controls.maxZoom=8;
 const root=new THREE.Group();
 threeScene.add(root);
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 let pickable=[],features=[],currentScene=null,disposed=false;
 let pending=false,center=new THREE.Vector3(),extent=40,angles=null;
 const active=new Set();
 function schedule(){
  if(disposed||pending)return;pending=true;
  window.requestAnimationFrame(()=>{
   pending=false;if(disposed)return;
   controls.update();renderer.render(threeScene,camera);
  });
 }
 controls.addEventListener('change',schedule);
 function destroyNode(node){
  node.traverse(child=>{
   child.geometry?.dispose();
   const mat=child.material;
   if(mat)(Array.isArray(mat)?mat:[mat]).forEach(x=>x.dispose());
  });
 }
 function clear(){
  while(root.children.length){
   const child=root.children[0];root.remove(child);destroyNode(child);
  }
  pickable=[];features=[];active.clear();
 }
 function resize(){
  if(disposed)return;
  const width=Math.max(220,container.clientWidth||460);
  const height=Math.max(180,container.clientHeight||240);
  const aspect=width/height,span=Math.max(20,extent*0.85);
  camera.left=-span*aspect;camera.right=span*aspect;
  camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(width,height,false);schedule();
 }
 function cameraAngle(input){
  if(!Number.isFinite(input?.yaw)||!Number.isFinite(input?.pitch))return;
  const key=input.yaw+':'+input.pitch;
  if(key===angles)return;
  angles=key;
  const yaw=input.yaw*Math.PI/180,pitch=input.pitch*Math.PI/180;
  const radial=extent*2.4;
  camera.position.set(center.x+Math.cos(yaw)*Math.cos(pitch)*radial,
   center.y+Math.sin(yaw)*Math.cos(pitch)*radial,
   center.z+Math.sin(pitch)*radial);
  camera.lookAt(center);controls.target.copy(center);controls.update();schedule();
 }
 function allPoints(scene){
  const points=[];
  const add=p=>{if(validPoint(p))points.push(vec(p));};
  for(const obj of scene.objects){
   if(obj.space!=='model-3d')continue;
   const d=obj.representations['3D']?.data;if(!d)continue;
   if(obj.kind==='point')add(d);
   else if(obj.kind==='segment'){add(d.start);add(d.end);}
   else if(obj.kind==='polyline')d.points.forEach(add);
   else if(obj.kind==='mesh')Object.values(d.points).forEach(add);
   else if(obj.kind==='line')add(d.point);
   else if(obj.kind==='analytic-curve'){
    for(const t of [0,.25,.5,.75,1])
     add(atAnalyticCurve3D(d,d.parameter.from+
      (d.parameter.to-d.parameter.from)*t));
   }
  }
  return points;
 }
 function placeLine(obj,a,b,extra={}){
  if(!validPoint(a)||!validPoint(b)||features.length>=MAX_FEATURES)return;
  const key=sourceFeatureKey(obj,extra);
  const geometry=new THREE.BufferGeometry().setFromPoints([vec(a),vec(b)]);
  const material=new THREE.LineBasicMaterial({color:0x587da4,
   transparent:true,opacity:.9});
  const line=new THREE.Line(geometry,material);
  line.userData={objectId:obj.id,sourceFeatureKey:key,
   presentationOnly:true,certifiedEngineeringStroke:false};
  root.add(line);pickable.push(line);features.push(line);
 }
 function placePoint(obj,p){
  if(!validPoint(p)||features.length>=MAX_FEATURES)return;
  const geometry=new THREE.SphereGeometry(Math.max(.4,extent*.012),10,7);
  const marker=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({
   color:0x476d93,depthTest:false}));
  marker.position.copy(vec(p));
  marker.userData={objectId:obj.id,sourceFeatureKey:sourceFeatureKey(obj,{}),
   presentationOnly:true,certifiedEngineeringStroke:false};
  root.add(marker);features.push(marker);pickable.push(marker);
 }
 // Only already supplied finite, coplanar CONVEX mesh faces are shaded.
 // Nonconvex/unknown faces remain wireframe, never invented triangles.
 function showSafeFaces(obj){
  const d=obj.representations['3D']?.data;
  if(!Array.isArray(d?.faces))return;
  for(const face of d.faces){
   const verts=face.map(id=>d.points[id]);
   if(verts.length<3||!verts.every(validPoint))continue;
   const coords=verts.map(vec),n=new THREE.Vector3()
    .subVectors(coords[1],coords[0]).cross(
     new THREE.Vector3().subVectors(coords[2],coords[0]));
   if(n.length()<1e-9)continue;
   n.normalize();
   const tol=1e-7*Math.max(1,extent),a=coords[0];
   let orientation=0,okay=true;
   for(let i=0;i<coords.length;i++){
    const b=coords[i],c=coords[(i+1)%coords.length],
     next=coords[(i+2)%coords.length];
    if(Math.abs(n.dot(new THREE.Vector3().subVectors(b,a)))>tol){okay=false;break;}
    const cross=new THREE.Vector3().subVectors(c,b)
     .cross(new THREE.Vector3().subVectors(next,c)).dot(n);
    if(Math.abs(cross)<tol)continue;
    if(orientation&&cross*orientation<0){okay=false;break;}
    orientation=cross;
   }
   if(!okay)continue;
   const arr=[];
   for(let i=1;i<coords.length-1;i++)for(const p of [coords[0],coords[i],coords[i+1]])
    arr.push(p.x,p.y,p.z);
   const g=new THREE.BufferGeometry();
   g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));
   g.computeVertexNormals();
   root.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({
    color:0x8ab9e9,transparent:true,opacity:.13,
    depthWrite:false,side:THREE.DoubleSide})));
  }
 }
 function build(scene){
  if(!scene||scene.schema!==SCHEMA||!Array.isArray(scene.objects)||
     !Number.isSafeInteger(scene.revision))throw Error('无效的几何场景版本');
  clear();
  const points=allPoints(scene),box=new THREE.Box3();
  points.forEach(p=>box.expandByPoint(p));
  center=box.isEmpty()?new THREE.Vector3():box.getCenter(new THREE.Vector3());
  extent=box.isEmpty()?40:Math.max(20,box.getSize(new THREE.Vector3()).length());
  raycaster.params.Line.threshold=Math.max(.5,extent*.018);
  for(const obj of scene.objects){
   if(obj.space!=='model-3d')continue;
   const d=obj.representations['3D']?.data;if(!d)continue;
   if(obj.kind==='point')placePoint(obj,d);
   else if(obj.kind==='segment')placeLine(obj,d.start,d.end);
   else if(obj.kind==='mesh'){
    showSafeFaces(obj);
    for(const [a,b] of d.edges)placeLine(obj,d.points[a],d.points[b],{edgeIds:[a,b]});
   }else if(obj.kind==='polyline'){
    const count=d.closed?d.points.length:d.points.length-1;
    for(let i=0;i<count;i++)placeLine(obj,d.points[i],
     d.points[(i+1)%d.points.length],{segmentIndex:i});
   }else if(obj.kind==='analytic-curve'){
    let prev=null;
    // A render-only tessellation; 3D geometry & M3 analytic identity unchanged.
    for(let i=0;i<=96;i++){
     const t=d.parameter.from+(d.parameter.to-d.parameter.from)*i/96;
     const pt=atAnalyticCurve3D(d,t);
     if(prev)placeCurvePiece(obj,prev,pt);
     prev=pt;
    }
   }else if(obj.kind==='line'){
    const dir=vec(d.direction),start=vec(d.point);
    if(dir.length()>1e-9){
     dir.normalize().multiplyScalar(extent*.7);
     placeLine(obj,start.clone().sub(dir),start.clone().add(dir));
    }
   }
  }
  controls.target.copy(center);
  angles=null;currentScene=scene;
  resize();
 }
 function placeCurvePiece(obj,a,b){
  if(!validPoint(a)||!validPoint(b)||features.length>=MAX_FEATURES)return;
  const g=new THREE.BufferGeometry().setFromPoints([vec(a),vec(b)]);
  const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x587da4}));
  line.userData={objectId:obj.id,sourceFeatureKey:sourceFeatureKey(obj,{}),
   presentationOnly:true,svgApproximationOnly:true,
   certifiedEngineeringStroke:false};
  root.add(line);features.push(line);pickable.push(line);
 }
 function update(scene,{selectedIds=[],selectedSourceFeature=null,camera:inputCamera}={}){
  if(disposed)return;
  if(!scene){clear();currentScene=null;schedule();return;}
  if(scene!==currentScene)build(scene);
  const owners=new Set(selectedIds);
  for(const feature of features){
   const {objectId,sourceFeatureKey:key}=feature.userData;
   const precise=!!selectedSourceFeature&&key===selectedSourceFeature;
   const selected=owners.has(objectId);
   const hex=precise?0x0866ef:selected?0xef6730:0x587da4;
   feature.material.color.setHex(hex);
  }
  cameraAngle(inputCamera);
  schedule();
 }
 let down=null;
 canvas.addEventListener('pointerdown',e=>{down={id:e.pointerId,x:e.clientX,y:e.clientY};});
 canvas.addEventListener('pointercancel',()=>{down=null;});
 canvas.addEventListener('pointerup',e=>{
  if(!down||down.id!==e.pointerId)return;
  const start=down;down=null;
  if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>6)return;
  const b=canvas.getBoundingClientRect();
  if(!b.width||!b.height)return;
  pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(pickable,false)[0]?.object?.userData;
  if(hit?.objectId&&hit.sourceFeatureKey)onPick({
   objectId:hit.objectId,sourceFeatureKey:hit.sourceFeatureKey});
 });
 container.append(canvas);
 const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
 observer?.observe(container);
 window.addEventListener('resize',resize);
 function dispose(){
  if(disposed)return;disposed=true;
  observer?.disconnect();window.removeEventListener('resize',resize);
  controls.dispose();clear();renderer.dispose();canvas.remove();
 }
 resize();
 return {update,dispose,resize};
}
window.DraftAILinkedThreeViewer=Object.freeze({mount});
