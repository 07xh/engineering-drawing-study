'use strict';
/**
 * Confirmed geometric conditions for the public, local-only V3.1 workbench.
 * Values are in mathematical millimetres; no OCR/pixel inputs or implicit
 * branch selection. Kept DOM-free to test every edit before rendering.
 */
const kinds=Object.freeze({
 'two-segments':Object.freeze({
  title:'两条有限线段',
  fields:[
   ['a1x','线段一 · 起点 X',-10],['a1y','起点 Y',0],
   ['b1x','终点 X',10],['b1y','终点 Y',0],
   ['a2x','线段二 · 起点 X',0],['a2y','起点 Y',-10],
   ['b2x','终点 X',0],['b2y','终点 Y',10]
  ],
  travels:[['firstTravel','线段一行进方向',['forward','reverse']],
   ['secondTravel','线段二行进方向',['forward','reverse']]],
  radius:3,defaultBranch:'s++',defaultDirection:'ccw',
  defaultTravels:['forward','forward']
 }),
 'segment-circle':Object.freeze({
  title:'线段与圆',
  fields:[
   ['a1x','线段 · 起点 X',-15],['a1y','起点 Y',0],
   ['b1x','终点 X',15],['b1y','终点 Y',0],
   ['c1x','已知圆 · 圆心 X',0],['c1y','圆心 Y',5],
   ['r1','已知圆半径',8]
  ],
  travels:[['lineTravel','线段行进方向',['forward','reverse']],
   ['knownCircleTravel','圆轮廓方向',['cw','ccw']]],
  radius:3,defaultBranch:'candidate-1',defaultDirection:'ccw',
  defaultTravels:['forward','cw']
 }),
 'two-circles':Object.freeze({
  title:'两个圆',
  fields:[
   ['c1x','圆一 · 圆心 X',0],['c1y','圆心 Y',0],['r1','圆一半径',5],
   ['c2x','圆二 · 圆心 X',20],['c2y','圆心 Y',0],['r2','圆二半径',5]
  ],
  travels:[['knownFirstTravel','圆一轮廓方向',['cw','ccw']],
   ['knownSecondTravel','圆二轮廓方向',['cw','ccw']]],
  radius:10,defaultBranch:'center-1',defaultDirection:'cw',
  defaultTravels:['ccw','ccw']
 })
});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function number(v,label){
 if(!finite(v))throw new TypeError(label+' must be a finite model-mm number');
 return v;
}
function buildConfirmedInput(kind,values,choice={},revision=0){
 const spec=kinds[kind];
 if(!spec)throw new RangeError('unsupported planar problem kind');
 if(!Number.isSafeInteger(revision)||revision<0)throw new RangeError('invalid revision');
 if(!values||typeof values!=='object')throw new TypeError('confirmed numeric fields required');
 const n=name=>number(values[name],name);
 const point=(x,y)=>({x:n(x),y:n(y)});
 const segment=(prefix)=>({a:point('a'+prefix+'x','a'+prefix+'y'),
  b:point('b'+prefix+'x','b'+prefix+'y')});
 const circle=i=>({center:point('c'+i+'x','c'+i+'y'),radius:n('r'+i)});
 const geometry=kind==='two-segments'
  ?{first:segment(1),second:segment(2)}
  :kind==='segment-circle'?{segment:segment(1),circle:circle(1)}
   :{first:circle(1),second:circle(2)};
 const selection={};
 for(const key of ['branchId','direction',...spec.travels.map(x=>x[0])]){
  const v=choice[key];
  if(v!==undefined&&v!=='')selection[key]=v;
 }
 return {problem:{kind,unit:'mm',revision,filletRadius:n('filletRadius'),
  geometry,options:kind==='segment-circle'?{side:1}:{}},
  selection,sheet:{origin:{x:360,y:220},scale:5}};
}
function defaultValues(kind){
 const spec=kinds[kind];
 if(!spec)throw new RangeError('unsupported planar kind');
 return Object.fromEntries([...spec.fields.map(([id,,v])=>[id,v]),
  ['filletRadius',spec.radius]]);
}
function defaultChoices(kind){
 const spec=kinds[kind];
 if(!spec)throw new RangeError('unsupported planar kind');
 return {branchId:spec.defaultBranch,direction:spec.defaultDirection,
  ...Object.fromEntries(spec.travels.map(([id],i)=>[id,spec.defaultTravels[i]]))};
}
module.exports={kinds,buildConfirmedInput,defaultValues,defaultChoices};
