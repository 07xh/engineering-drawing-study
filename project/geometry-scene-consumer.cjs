'use strict';
/*
 * V7 presentation-only consumer for the ONE immutable Geometry Scene.
 * No missing-geometry solver, no visibility inference and no V5 scheduling.
 * New specialist clients provide validated Geometry to deriveGeometryScene;
 * they do not add case-by-case drawing code to the homepage.
 */
const {SCHEMA}=require('../core/projection/geometry-scene-views.cjs');
const {toSheet,VIEWS}=require('../core/projection/conventions.js');
const TAU=Math.PI*2, RAD=Math.PI/180;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const EPS=1e-10, CAP=25000;
function fail(msg){throw new Error('场景显示：'+msg);}
function finiteAttrs(attrs){
 if(Object.entries(attrs).some(([k,v])=>k!=='d'&&!finite(v)))fail('画面坐标无效或溢出');
 return attrs;
}
function make(kind,attrs,obj,view,extra={}){
 return Object.freeze({kind,attrs:Object.freeze(finiteAttrs(attrs)),
  objectId:obj?.id??null,
  selectionObjectId:obj?.selectionObjectId??obj?.id??null,
  view,...extra});
}
function add(target,primitive){
 if(target.length>=CAP)fail('单页图元超过安全上限');
 target.push(primitive);
}
function segment(target,a,b,obj,view,extra={}){
 add(target,make('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y},obj,view,extra));
}
function point(target,p,obj,view,extra={}){
 add(target,make('circle',{cx:p.x,cy:p.y,r:5},obj,view,extra));
}
function planar(p,sheet){
 return {x:sheet.origin.x+p.x*sheet.scale,
  y:sheet.origin.y-p.y*sheet.scale};
}
function arcPath(center,radius,startAngle,endAngle){
 const start=-startAngle*RAD,sweep=-(endAngle-startAngle)*RAD;
 if(!finite(start)||!finite(sweep)||!finite(radius)||radius<=0||
    Math.abs(sweep)>TAU+EPS||Math.abs(sweep)<EPS)
  fail('模型圆弧角度超出显示范围');
 const at=a=>({x:center.x+radius*Math.cos(a),
  y:center.y+radius*Math.sin(a)});
 const begin=at(start);
 const arcs=[];
 const pieces=Math.abs(Math.abs(sweep)-TAU)<EPS?2:1;
 for(let i=0;i<pieces;i++){
  const a=start+sweep*i/pieces,b=start+sweep*(i+1)/pieces,finish=at(b);
  arcs.push('A '+radius+' '+radius+' 0 '+
    (Math.abs((b-a))>Math.PI+EPS?1:0)+' '+(sweep>0?1:0)+
    ' '+finish.x+' '+finish.y);
 }
 return 'M '+begin.x+' '+begin.y+' '+arcs.join(' ');
}
function planarObject(obj,paper,sheet,warnings){
 const d=obj.model.data;
 if(obj.kind==='point')return point(paper,planar(d,sheet),obj,'drawing');
 if(obj.kind==='segment')return segment(paper,planar(d.start,sheet),
   planar(d.end,sheet),obj,'drawing');
 if(obj.kind==='polyline'){
  const end=d.closed?d.points.length:d.points.length-1;
  for(let i=0;i<end;i++)
   segment(paper,planar(d.points[i],sheet),
    planar(d.points[(i+1)%d.points.length],sheet),obj,'drawing',
    {segmentIndex:i});
  return;
 }
 if(obj.kind==='circle'){
  const c=planar(d.center,sheet);
  return add(paper,make('circle',{cx:c.x,cy:c.y,r:d.radius*sheet.scale},
    obj,'drawing',{fill:'none'}));
 }
 if(obj.kind==='arc'){
  const c=planar(d.center,sheet);
  return add(paper,make('path',{d:arcPath(c,d.radius*sheet.scale,
    d.startAngle,d.endAngle)},obj,'drawing',{fill:'none',
      bounds:{minX:c.x-d.radius*sheet.scale,maxX:c.x+d.radius*sheet.scale,
       minY:c.y-d.radius*sheet.scale,maxY:c.y+d.radius*sheet.scale}}));
 }
 if(obj.kind==='line'){
  // A finite SVG segment depicts only a window on the INFINITE math line.
  const p=planar(d.point,sheet),n=Math.hypot(d.direction.x,d.direction.y);
  const direction={x:d.direction.x/n,y:d.direction.y/n};
  const radius=1000;
  return segment(paper,{x:p.x-radius*direction.x,y:p.y+radius*direction.y},
   {x:p.x+radius*direction.x,y:p.y-radius*direction.y},
   obj,'drawing',{viewportOnly:true});
 }
 warnings.push(obj.id+': 不支持的二维表示，未虚构轮廓');
}
function representationPaper(obj,paper,sheet,warnings,viewTransforms=null){
 for(const view of VIEWS){
  const rep=obj.representations[view];
  if(!rep)continue;
  const frame=viewTransforms?.[view]??sheet;
  const p=uv=>toSheet(view,uv,frame);
  if(rep.kind==='point')point(paper,p(rep.at),obj,view,
    rep.collapsedFrom?{collapsedFrom:rep.collapsedFrom}:{});
  else if(rep.kind==='segment')segment(paper,p(rep.start),p(rep.end),
    obj,view);
  else if(rep.kind==='line'){
   const at=p(rep.point),v=rep.direction;
   const dx=v.u*frame.scale*(view==='W'?1:-1);
   const dy=v.v*frame.scale*(view==='H'?1:-1);
   const dist=Math.hypot(dx,dy);
   if(dist<=EPS)fail('空间直线投影方向退化但未被几何场景标注');
   segment(paper,{x:at.x-180*dx/dist,y:at.y-180*dy/dist},
    {x:at.x+180*dx/dist,y:at.y+180*dy/dist},
    obj,view,{viewportOnly:true});
  }else if(rep.kind==='mesh-projection'){
   if(rep.visibility!=='undetermined')fail('不能接受未经证明的网格可见性');
   for(const edge of rep.edges){
    if(edge.projection.kind==='segment')
     segment(paper,p(edge.projection.start),p(edge.projection.end),
      obj,view,{visibility:'undetermined',edgeIds:[edge.fromId,edge.toId]});
    else if(edge.projection.kind==='point')
     point(paper,p(edge.projection.at),obj,view,{visibility:'undetermined',
      edgeIds:[edge.fromId,edge.toId],collapsedFrom:'segment'});
    else fail('未知网格棱投影');
   }
  }else if(rep.kind==='polyline-projection'){
   if(rep.visibility!=='undetermined')fail('不能升级未经证明的截线可见性');
   for(const edge of rep.spans){
    const extra={visibility:'undetermined',segmentIndex:edge.fromIndex};
    if(edge.projection.kind==='segment')
     segment(paper,p(edge.projection.start),p(edge.projection.end),obj,view,extra);
    else if(edge.projection.kind==='point')
     point(paper,p(edge.projection.at),obj,view,
      {...extra,collapsedFrom:'segment'});
    else fail('未知折线投影边类型');
   }
  }else if(rep.kind==='unbounded-plane'){
   warnings.push(obj.id+': 无限平面无可绘制有限边界');
  }else fail('不支持的正式投影类型 '+rep.kind);
 }
}
function modelVertices(scene){
 const points=[];
 function take(p){if(p&&['x','y','z'].every(k=>finite(p[k])))points.push(p);}
 for(const obj of scene.objects.filter(x=>x.space==='model-3d')){
  const d=obj.model.data;
  if(obj.kind==='point')take(d);
  else if(obj.kind==='segment'){take(d.start);take(d.end);}
  else if(obj.kind==='mesh')for(const p of Object.values(d.points))take(p);
  else if(obj.kind==='polyline')for(const p of d.points)take(p);
  else if(obj.kind==='line')take(d.point);
 }
 return points;
}
function span(points){
 let largest=1;
 for(const p of points)largest=Math.max(largest,Math.abs(p.x),Math.abs(p.y),Math.abs(p.z));
 return largest;
}
function spatialCamera(scene,camera,spatial,warnings){
 const vertices=modelVertices(scene),extent=span(vertices);
 const angle=camera.yaw*RAD,pitch=camera.pitch*RAD;
 const ca=Math.cos(angle),sa=Math.sin(angle),cp=Math.cos(pitch),sp=Math.sin(pitch);
 function oriented(p){
  const dx=p.x*ca-p.y*sa,depth=p.x*sa+p.y*ca;
  return {x:dx,y:-(p.z*cp-depth*sp)};
 }
 const orientedPoints=vertices.map(oriented);
 const low={x:0,y:0},high={x:0,y:0};
 for(const p of orientedPoints){
  low.x=Math.min(low.x,p.x);low.y=Math.min(low.y,p.y);
  high.x=Math.max(high.x,p.x);high.y=Math.max(high.y,p.y);
 }
 const factor=Math.min(7,180/Math.max(1,high.x-low.x),
  170/Math.max(1,high.y-low.y));
 const center={x:(low.x+high.x)/2,y:(low.y+high.y)/2};
 const project=p=>{const t=oriented(p);
  return {x:250+(t.x-center.x)*factor,
    y:110+(t.y-center.y)*factor};};
 for(const obj of scene.objects){
  const rep=obj.representations['3D'];
  if(!rep)continue;
  const d=rep.data;
  if(obj.kind==='point')point(spatial,project(d),obj,'3D');
  else if(obj.kind==='segment')segment(spatial,project(d.start),
   project(d.end),obj,'3D');
  else if(obj.kind==='mesh'){
   for(const [a,b] of d.edges)
    segment(spatial,project(d.points[a]),project(d.points[b]),
     obj,'3D',{visibility:'undetermined',edgeIds:[a,b]});
  }else if(obj.kind==='polyline'){
   const end=d.closed?d.points.length:d.points.length-1;
   for(let i=0;i<end;i++)
    segment(spatial,project(d.points[i]),
     project(d.points[(i+1)%d.points.length]),obj,'3D',
     {visibility:'undetermined',segmentIndex:i});
  }else if(obj.kind==='line'){
   const u=d.direction,n=Math.hypot(u.x,u.y,u.z);
   const half=extent/Math.max(n,EPS);
   segment(spatial,project({x:d.point.x-u.x*half,
    y:d.point.y-u.y*half,z:d.point.z-u.z*half}),
   project({x:d.point.x+u.x*half,y:d.point.y+u.y*half,
    z:d.point.z+u.z*half}),obj,'3D',{viewportOnly:true});
  }else if(obj.kind==='plane'){
   warnings.push(obj.id+': 未验证的无界空间平面不绘制虚构面片');
  }else fail('不支持的空间 Geometry '+obj.kind);
 }
}
function paperBounds(primitives){
 const x=[],y=[];
 const consider=(a,b)=>{if(finite(a)&&finite(b)){x.push(a);y.push(b);}};
 for(const p of primitives){
  const a=p.attrs;
  if(p.bounds){consider(p.bounds.minX,p.bounds.minY);
    consider(p.bounds.maxX,p.bounds.maxY);}
  else if(p.kind==='line'){consider(a.x1,a.y1);consider(a.x2,a.y2);}
  else if(p.kind==='circle'){consider(a.cx-a.r,a.cy-a.r);consider(a.cx+a.r,a.cy+a.r);}
 }
 if(!x.length)return null;
 const cx=(Math.min(...x)+Math.max(...x))/2,cy=(Math.min(...y)+Math.max(...y))/2;
 const width=Math.max(300,(Math.max(...x)-Math.min(...x))*1.24);
 const height=Math.max(220,(Math.max(...y)-Math.min(...y))*1.24);
 return {x:cx-width/2,y:cy-height/2,width,height};
}
function compileGeometryScene(scene,{sheet={origin:{x:360,y:208},scale:5},
 camera={yaw:0,pitch:25},hiddenObjectIds=[],selectedObjectId=null,
 viewTransforms=null}={}){
 if(!scene||scene.schema!==SCHEMA||!Array.isArray(scene.objects)||
   !scene.objects.every(o=>o&&o.model&&o.representations))
  fail('只能消费经过正式数学构建的 Geometry Scene');
 if(!sheet||!sheet.origin||!finite(sheet.origin.x)||!finite(sheet.origin.y)||
   !finite(sheet.scale)||sheet.scale<=0||!camera||
   !finite(camera.yaw)||!finite(camera.pitch))
  fail('投影纸面或相机参数无效');
 if(viewTransforms!==null&&(
    typeof viewTransforms!=='object'||Array.isArray(viewTransforms)||
    Object.keys(viewTransforms).sort().join(',')!=='H,V,W'||
    !VIEWS.every(v=>{
     const t=viewTransforms[v];
     return t&&t.origin&&finite(t.origin.x)&&finite(t.origin.y)&&
       finite(t.scale)&&t.scale>0&&t.scale<=1e8;
    })))fail('三视图必须由完整有效的 V/H/W 坐标变换共同驱动');
 const hidden=new Set(hiddenObjectIds);
 if(hiddenObjectIds.length>scene.objects.length||
  [...hidden].some(id=>typeof id!=='string'))fail('图元显示门禁无效');
 const objects=scene.objects.filter(o=>!hidden.has(o.id));
 const spatialPoints=modelVertices({objects});
 const scale=spatialPoints.length?Math.min(sheet.scale,135/span(spatialPoints)):sheet.scale;
 const paperTransform={origin:{...sheet.origin},scale};
 const paper=[],spatial=[],warnings=[];
 const subset={objects};
 for(const obj of objects){
  if(obj.space==='drawing-2d')planarObject(obj,paper,sheet,warnings);
  else representationPaper(obj,paper,paperTransform,warnings,viewTransforms);
 }
 spatialCamera(subset,camera,spatial,warnings);
 for(const primitive of [...paper,...spatial])
  if(primitive.visibility==='undetermined'&&primitive.fill)
   fail('无可见性证明的棱不得填充');
 return Object.freeze({paper:Object.freeze(paper),spatial:Object.freeze(spatial),
  paperTransform:Object.freeze(paperTransform),
  paperBounds:paperBounds(paper),warnings:Object.freeze(warnings),
  objectCount:objects.length,selectedObjectId,revision:scene.revision,
  projection:'first-angle-orthographic',proof:'display-only'});
}
module.exports={compileGeometryScene,arcPath};
