/* Bundled locally at build time with pinned Three.js. No runtime CDN dependencies.
 * WebGL is optional; the SVG spatial preview remains the supported fallback.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function(){
'use strict';
const G=window.DrawingLabGeometry;
function mount(container,onSelect){
 if(!container||!G)return null;
 const canvas=document.createElement('canvas');
 canvas.setAttribute('aria-label','可旋转、缩放并选取顶点的三维参考立体');
 canvas.style.width='100%';canvas.style.height='100%';canvas.style.display='block';
 let renderer;
 try{
  if(!canvas.getContext('webgl2',{antialias:true}))return null;
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 }catch(error){return null}
 const scene=new THREE.Scene();
 scene.background=new THREE.Color(0xf8fcf9);
 const camera=new THREE.OrthographicCamera(-165,165,100,-100,.1,1500);
 camera.up.set(0,0,1);camera.position.set(180,180,180);
 const controls=new OrbitControls(camera,canvas);
 controls.target.set(36,33,31);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.09;
 controls.minZoom=.5;controls.maxZoom=4.0;controls.update();
 const solidRoot=new THREE.Group(),pointRoot=new THREE.Group();
 scene.add(solidRoot,pointRoot);
 scene.add(new THREE.AxesHelper(76));
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 let markers=[],modelId=null,disposed=false,framePending=false;
 container.append(canvas);
 const disposeItem=item=>{
  if(item.geometry)item.geometry.dispose();
  if(item.material){for(const m of Array.isArray(item.material)?item.material:[item.material])m.dispose()}
 };
 function clear(group){
  while(group.children.length){
   const item=group.children[0];
   group.remove(item);
   item.traverse(disposeItem);
  }
 }
 function requestDraw(){
  if(disposed||framePending)return;
  framePending=true;
  window.requestAnimationFrame(()=>{
   framePending=false;if(disposed)return;
   controls.update();renderer.render(scene,camera);
  });
 }
 controls.addEventListener('change',requestDraw);
 function resize(){
  if(disposed)return;
  const width=Math.max(220,container.clientWidth||560),height=Math.max(220,container.clientHeight||350);
  const aspect=width/height,extent=100;
  camera.left=-extent*aspect;camera.right=extent*aspect;camera.top=extent;camera.bottom=-extent;
  camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(width,height,false);requestDraw();
 }
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
 observer?.observe(container);window.addEventListener('resize',resize);
 function faceGeometry(face,points){
  const coords=[];
  for(let i=1;i<face.length-1;i++)for(const id of [face[0],face[i],face[i+1]]){
   const p=points[id];coords.push(p.x,p.y,p.z)
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
  geometry.computeVertexNormals();
  return geometry;
 }
 function buildModel(model){
  G.validate(model);
  if(modelId===model.id)return;
  clear(solidRoot);markers=[];modelId=model.id;
  for(const [index,face] of model.faces.entries()){
   const mesh=new THREE.Mesh(faceGeometry(face,model.points),new THREE.MeshBasicMaterial({
    color:index%2?0x75ab8b:0x9accb2,transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false
   }));
   solidRoot.add(mesh);
  }
  const lineCoords=[];
  for(const [a,b] of model.edges)for(const id of [a,b]){
   const p=model.points[id];lineCoords.push(p.x,p.y,p.z);
  }
  const edges=new THREE.BufferGeometry();
  edges.setAttribute('position',new THREE.Float32BufferAttribute(lineCoords,3));
  solidRoot.add(new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:0x2e674a})));
  for(const [name,p] of Object.entries(model.points)){
   const marker=new THREE.Mesh(new THREE.SphereGeometry(2.4,12,9),
    new THREE.MeshBasicMaterial({color:0x47785c,depthTest:false}));
   marker.position.set(p.x,p.y,p.z);marker.userData.vertexId=name;
   markers.push(marker);solidRoot.add(marker);
  }
 }
 function vec(p){return new THREE.Vector3(p.x,p.y,p.z)}
 function drawLine(a,b,color=0xd98a25){
  const geometry=new THREE.BufferGeometry().setFromPoints([a,b]);
  const line=new THREE.Line(geometry,new THREE.LineDashedMaterial({color,dashSize:4,gapSize:2}));
  line.computeLineDistances();pointRoot.add(line);
 }
 function drawLocus(result){
  clear(pointRoot);
  if(result.kind==='none'||!G.pointValid(result.example))return;
  const p=vec(result.example),dirs=(result.directions||[]).map(d=>new THREE.Vector3(...d).normalize());
  if(result.degrees===1&&dirs[0])drawLine(p.clone().addScaledVector(dirs[0],-130),p.clone().addScaledVector(dirs[0],130));
  else if(result.degrees===2&&dirs.length>=2){
   const u=dirs[0],v=dirs[1].clone().addScaledVector(u,-dirs[1].dot(u)).normalize();
   const vertices=[];
   for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
    vertices.push(p.clone().addScaledVector(u,a*65).addScaledVector(v,b*65));
   }
   const positions=[];for(const i of [0,1,2,0,2,3])positions.push(...vertices[i].toArray());
   const g=new THREE.BufferGeometry();
   g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
   const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xe8a43f,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));
   pointRoot.add(mesh);
   for(let i=0;i<4;i++)drawLine(vertices[i],vertices[(i+1)%4]);
  }else if(result.degrees===3){
   for(const d of [[1,0,0],[0,1,0],[0,0,1]]){
    const v=new THREE.Vector3(...d);
    drawLine(p.clone().addScaledVector(v,-24),p.clone().addScaledVector(v,24));
   }
  }
  const marker=new THREE.Mesh(new THREE.SphereGeometry(3.3,16,12),new THREE.MeshBasicMaterial({color:0xf19a27,depthTest:false}));
  marker.position.copy(p);pointRoot.add(marker);
 }
 function update(model,locus,opts={}){
  if(disposed)return;
  buildModel(model);
  for(const marker of markers)marker.material.color.setHex(marker.userData.vertexId===opts.selectedVertex?0xe18b26:0x47785c);
  drawLocus(locus);requestDraw();
 }
 let pointerDown=null;
 canvas.addEventListener('pointerdown',event=>{pointerDown={id:event.pointerId,x:event.clientX,y:event.clientY}});
 canvas.addEventListener('pointerup',event=>{
  if(!pointerDown||pointerDown.id!==event.pointerId)return;
  const down=pointerDown;pointerDown=null;
  if(Math.hypot(event.clientX-down.x,event.clientY-down.y)>7)return;
  const bounds=canvas.getBoundingClientRect();
  if(!bounds.width||!bounds.height)return;
  pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(markers,false)[0];
  if(hit?.object.userData.vertexId)onSelect?.(hit.object.userData.vertexId);
 });
 canvas.addEventListener('pointercancel',()=>{pointerDown=null});
 function zoom(factor){camera.zoom=Math.max(controls.minZoom,Math.min(controls.maxZoom,camera.zoom*factor));camera.updateProjectionMatrix();requestDraw()}
 function turn(angle){
  camera.position.sub(controls.target).applyAxisAngle(new THREE.Vector3(0,0,1),angle).add(controls.target);
  controls.update();requestDraw();
 }
 function resetCamera(){camera.position.set(180,180,180);camera.zoom=1;controls.target.set(36,33,31);camera.updateProjectionMatrix();controls.update();requestDraw()}
 function dispose(){
  if(disposed)return;disposed=true;
  observer?.disconnect();window.removeEventListener('resize',resize);
  controls.dispose();clear(solidRoot);clear(pointRoot);renderer.dispose();canvas.remove();
 }
 resize();
 return {update,zoom,turn,resetCamera,dispose};
}
window.DrawingLabThreeViewer={mount};
})();
