/* 第三期：与题库共用 DrawingConstraints 的交互式空间点约束探索 */
(function(){
'use strict';
const engine=window.DrawingConstraints,root=document.getElementById('constraintExplorer');
if(!root||!engine)return;
const $=id=>document.getElementById(id);
const plane={type:'plane',normal:{x:-.3,y:-.4,z:1},offset:10};
const current=()=>({x:Number($('kx').value),y:Number($('ky').value),z:Number($('freeHeight').value)});
const state={H:false,P:false,Z:false};
const label={H:'已知水平投影 k（固定 x、y）',P:'K 在 ABC 平面上',Z:'已知高度 z（固定 z）'};
const buttons=['H','P','Z'];
function svgPoint(p,kind){const x=kind==='W'?p.y:p.x,y=kind==='H'?p.y:p.z;return [30+x*1.9,175+(kind==='H'?y:-y)*1.9]}
function dot(p,kind,color){const [x,y]=svgPoint(p,kind);return '<circle cx="'+x+'" cy="'+y+'" r="5" fill="'+color+'"/>'}
function line(a,b,kind,color,dash=''){const [x,y]=svgPoint(a,kind),[u,v]=svgPoint(b,kind);return '<line x1="'+x+'" y1="'+y+'" x2="'+u+'" y2="'+v+'" stroke="'+color+'" stroke-width="2.5" '+(dash?'stroke-dasharray="'+dash+'"':'')+'/>'}
function draw(result,trial){
 const xyz=p=>({x:p.x,y:p.y,z:10+.3*p.x+.4*p.y});
 const vertices=[xyz({x:10,y:10}),xyz({x:80,y:10}),xyz({x:20,y:80})];
 const kindNames={V:'正面 V',H:'水平 H',W:'侧面 W'};
 const hasPoint=result.degrees===0&&!result.inconsistent;
 const sample=hasPoint?{x:result.particular[0],y:result.particular[1],z:result.particular[2]}:trial;
 const free=result.directions;
 const lines=[];
 for(const kind of ['V','H','W']){
  const baseX=kind==='V'?0:kind==='H'?320:640;
  let body='<rect x="0" y="0" width="295" height="260" rx="12" fill="#f9fcfb" stroke="#d7e8e0"/><text x="12" y="25" fill="#31545c" font-size="17" font-weight="600">'+kindNames[kind]+'</text>';
  for(let i=0;i<3;i++)body+=line(vertices[i],vertices[(i+1)%3],kind,'#5b94b5');
  if(!result.inconsistent){
   if(result.degrees===2&&state.P){for(let i=0;i<3;i++)body+=line(vertices[i],vertices[(i+1)%3],kind,'#dc932e','6 3')}
   if(result.degrees===1){const d=free[0];const extent=60;const a={x:sample.x-d[0]*extent,y:sample.y-d[1]*extent,z:sample.z-d[2]*extent},b={x:sample.x+d[0]*extent,y:sample.y+d[1]*extent,z:sample.z+d[2]*extent};body+=line(a,b,kind,'#d98a1c','6 4')}
   body+=dot(sample,kind,'#d18118');
   const [tx,ty]=svgPoint(sample,kind);body+='<text x="'+(tx+8)+'" y="'+(ty-8)+'" font-size="13" fill="#955414">'+(hasPoint?'K':'K*')+'</text>';
  }else body+='<text x="40" y="120" font-size="22" fill="#b35e37">条件矛盾：无解</text>';
  lines.push('<g transform="translate('+baseX+',0)">'+body+'</g>');
 }
 $('explorerViews').innerHTML=lines.join('');
 // A compact oblique projection uses a single 3D coordinate set for all three views.
 const iso=p=>[185+(p.x-.65*p.y)*2.05,195+(p.y*.40-p.z)*2.05];
 const segment=(a,b,color,dash='')=>{const [x,y]=iso(a),[u,v]=iso(b);return '<line x1="'+x+'" y1="'+y+'" x2="'+u+'" y2="'+v+'" stroke="'+color+'" stroke-width="2.6" '+(dash?'stroke-dasharray="'+dash+'"':'')+'/>'};
 let scene='<rect width="400" height="310" rx="12" fill="#f9fcfb"/><polygon points="'+vertices.map(p=>iso(p).join(',')).join(' ')+'" fill="#f0bb7066" stroke="#c07b32" stroke-width="2"/>';
 const origin={x:0,y:0,z:0};
 for(const end of [{x:95,y:0,z:0},{x:0,y:95,z:0},{x:0,y:0,z:90}])scene+=segment(origin,end,'#829ca2');
 if(!result.inconsistent){
  if(result.degrees===1){const d=free[0],n=70;scene+=segment({x:sample.x-d[0]*n,y:sample.y-d[1]*n,z:sample.z-d[2]*n},{x:sample.x+d[0]*n,y:sample.y+d[1]*n,z:sample.z+d[2]*n},'#dc8a1c','7 4')}
  if(result.degrees===2&&state.Z){const h=sample.z,pts=[{x:0,y:0,z:h},{x:90,y:0,z:h},{x:90,y:90,z:h},{x:0,y:90,z:h}];scene+='<polygon points="'+pts.map(p=>iso(p).join(',')).join(' ')+'" fill="#eab15e44" stroke="#dc8a1c" stroke-dasharray="7 4"/>'}
  if(result.degrees===2&&state.P)scene+='<polygon points="'+vertices.map(p=>iso(p).join(',')).join(' ')+'" fill="#eab15e55" stroke="#dc8a1c" stroke-width="3" stroke-dasharray="7 4"/>';
  const [x,y]=iso(sample);scene+='<circle cx="'+x+'" cy="'+y+'" r="7" fill="#d18118" stroke="white" stroke-width="2"/><text x="'+(x+12)+'" y="'+(y-9)+'" fill="#955414" font-size="15">'+(hasPoint?'K':'K*')+'</text>';
 }else scene+='<text x="110" y="150" fill="#b35e37" font-size="20">无解</text>';
 $('explorerSpace').innerHTML=scene;
}
function update(){
 const trial=current(),conditions=[];
 if(state.H)conditions.push({type:'projection',plane:'H',value:[trial.x,trial.y]});
 if(state.P)conditions.push(plane);
 if(state.Z)conditions.push({type:'coordinate',axis:'z',value:trial.z});
 const analysis=engine.analyze(conditions),r=analysis.result;
 for(const key of buttons){$(('constraint'+key)).checked=state[key]}
 $('explorerDof').textContent=r.inconsistent?'无解：条件互相矛盾':'剩余 '+r.degrees+' 个自由度';
 const locus=r.inconsistent?'不存在同时满足条件的空间点':r.degrees===3?'三维空间（3 个方向）':r.degrees===2?'平面（2 个独立方向）':r.degrees===1?'直线（1 个独立方向）':'唯一空间点';
 $('explorerLocus').textContent='可行位置：'+locus+'。'+analysis.summary;
 $('explorerSteps').replaceChildren();
 let before=3;
 for(const [i,s] of analysis.steps.entries()){
  const p=document.createElement('p');p.className='step';
  p.textContent='第 '+(i+1)+' 步 · '+label[buttons.filter(k=>state[k])[i]]+'：'+(s.status==='contradiction'?'条件冲突':s.status==='redundant'?'重复条件':'新增独立约束')+'；'+(s.after===null?'无解':before+' → '+s.after+' 自由度')+'。'+s.explanation;
  $('explorerSteps').append(p);before=s.after;
 }
 if(!analysis.steps.length)$('explorerSteps').textContent='尚未添加条件：空间点有 3 个自由度。';
 $('explorerStrategy').textContent=r.inconsistent?'请核对高度 z 是否等于平面 ABC 在当前 (x,y) 的高度 '+(10+.3*trial.x+.4*trial.y).toFixed(2)+'；矛盾时不能画出满足全部条件的 K。':state.H&&state.P?'先由 k 确定 x、y，再沿 H 面投射线与平面 ABC 求交，得到 z；最后利用联系线绘制 k′、k″。':state.H?'由 k 固定 x、y，沿水平投射线改变高度 z；仅靠一个水平投影还不能确定正面、侧面投影的高度。':state.P&&state.Z?'已知平面及高度，交集通常是一条水平线。沿这条线选择试探点，再增加一个独立位置条件才可确定 K。':state.P?'K 在 ABC 平面内移动，z 随 x、y 改变；可以用平面内辅助直线求不同试探点的投影。':state.Z?'已知高度，只能在平行 H 面的定高平面内移动；还需要其他位置约束。':'先观察自由点在三维空间中的运动，再选择水平投影或平面从属条件。';
 const sample=r.inconsistent?trial:r.degrees===0?{x:r.particular[0],y:r.particular[1],z:r.particular[2]}:state.P&&state.Z?{x:(trial.z-10-.4*trial.y)/.3,y:trial.y,z:trial.z}:state.P?{x:trial.x,y:trial.y,z:10+.3*trial.x+.4*trial.y}:trial;
 draw(r,sample);
}
for(const key of buttons)$('constraint'+key).addEventListener('change',e=>{state[key]=e.target.checked;update()});
for(const id of ['kx','ky','freeHeight'])$(id).addEventListener('input',update);
$('constraintAll').onclick=()=>{state.H=true;state.P=true;state.Z=false;update()};
$('constraintNone').onclick=()=>{state.H=false;state.P=false;state.Z=false;update()};
$('constraintReset').onclick=()=>{state.H=true;state.P=false;state.Z=false;update()};
state.H=true;update();
})();
