(function(){'use strict';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),fmt=v=>Number(v).toFixed(1);
const cases=[
{id:'2-5-1',title:'判断 AB 的空间位置',text:'正面投影倾斜，水平投影平行于 X 轴。判断直线与 V、H、W 面的关系。',type:'front',a:[18,30,25],b:[70,30,70],answer:'正平线：AB ∥ V 面。两端 y 相等，水平投影 ab ∥ X 轴；正面投影 a′b′反映实长。'},
{id:'2-5-2',title:'判断 AB 的空间位置',text:'两端 x、y、z 都不相同。判断直线是否平行或垂直于任一基本投影面。',type:'general',a:[20,18,24],b:[70,68,72],answer:'一般位置直线：对 H、V、W 三面均倾斜，三面投影一般均为斜线且不直接反映实长。'},
{id:'2-5-3',title:'判断 EF 的空间位置',text:'正面投影 e′、f′重合为一点；水平投影 ef 是线段。',type:'vnormal',a:[46,18,45],b:[46,78,45],answer:'正垂线：EF ⟂ V 面。因为 x、z 相同，正面投影积聚为一点；水平和侧面投影显示线段。'},
{id:'2-5-4',title:'已知 K 在 V 面，补全 GK',text:'点 K 位于 V 面，即 yK=0。拖动 G、K 观察三面投影及联系线，补全水平和侧面投影。',type:'konv',a:[18,65,22],b:[68,0,70],answer:'K 在 V 面，故 k 位于 X 轴上，k″ 位于 Z 轴上。先由 k′ 引垂直 X 轴的联系线，再由 yK=0 确定 k、k″，连接对应端点。'},
{id:'2-5-5',title:'侧平线 AB：已知长度和倾角',text:'AB ∥ W 面，教材给出 AB=26 mm、距 W 面 24 mm、α=60°。示意图以等比例可调参数表现同类关系，非纸面毫米比例。',type:'profile',a:[38,20,22],b:[38,69,69],answer:'侧平线：xA=xB。侧面投影 a″b″反映实长；正面投影 a′b′平行 Z 轴，水平投影 ab 平行 Y 轴。原题长度和角度需在纸面按比例尺作图。'},
{id:'2-5-6',title:'水平线 AB：补全三投影',text:'AB ∥ H 面。改变端点在水平面内的位置，观察 a′b′ 和 a″b″ 的特征。',type:'horizontal',a:[18,70,45],b:[75,25,45],answer:'水平线：zA=zB。正面投影 a′b′平行 X 轴；侧面投影 a″b″平行 YW 轴；水平投影 ab 反映实长。'},
{id:'2-5-7',title:'正平线 AB：补全三投影',text:'AB ∥ V 面。移动端点，观察三面投影与投影面倾角的关系。',type:'front',a:[20,36,20],b:[72,36,70],answer:'正平线：yA=yB。水平投影 ab 平行 X 轴；正面投影 a′b′反映实长，倾角可在 V 面投影中量取。'},
{id:'2-5-8',title:'正垂线 EF：补全三投影',text:'EF ⟂ V 面，教材给出距 W 面 22 mm。移动端点的深度，观察正面投影积聚为一点。',type:'vnormal',a:[38,18,48],b:[38,78,48],answer:'正垂线：xE=xF 且 zE=zF。正面投影 e′(f′)积聚为一点；水平和侧面投影是线段。距 W 面 22 mm 在纸面按比例尺设置共同的 x 坐标。'}];
let current=0,points=[],guides=true,showAnswer=false,drag=null;
const axis={V:[70,215],H:[70,265],W:[545,215]},scale=2.4;
const project=(p,plane)=>{const [ox,oy]=axis[plane];return plane==='V'?[ox+p[0]*scale,oy-p[2]*scale]:plane==='H'?[ox+p[0]*scale,oy+p[1]*scale]:[ox+p[1]*scale,oy-p[2]*scale]};
const line=(a,b,stroke='#3c735c',dash='',width=3)=>'<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+stroke+'" stroke-width="'+width+'" '+(dash?'stroke-dasharray="'+dash+'"':'')+'/>';
function constrain(p,index){const c=cases[current],q=points[1-index];p=p.map(v=>clamp(Math.round(v),0,90));if(c.type==='front')p[1]=q[1];if(c.type==='horizontal')p[2]=q[2];if(c.type==='profile')p[0]=q[0];if(c.type==='vnormal'){p[0]=q[0];p[2]=q[2]}if(c.type==='konv'&&index===1)p[1]=0;return p}
function setPoint(index,p){points[index]=constrain(p,index);draw()}
function labels(){return cases[current].type==='vnormal'?['e','f']:cases[current].type==='konv'?['g','k']:['a','b']}
function draw(){
const c=cases[current],names=labels();let out='<rect width="960" height="510" fill="#fbfdfb"/>';
for(const plane of ['V','H','W']){const [ox,oy]=axis[plane];out+='<text x="'+ox+'" y="26" font-size="18" fill="#416d59" font-weight="700">'+plane+' 面</text>';out+=line([ox-12,oy],[ox+240,oy],'#64756c','',1.5);out+='<text x="'+(ox+240)+'" y="'+(oy-7)+'" fill="#64756c">'+(plane==='W'?'Yw':'X')+'</text>'}
out+=line([500,42],[500,480],'#dce9df','4 6',1);
for(const plane of ['V','H','W']){const a=project(points[0],plane),b=project(points[1],plane);out+=line(a,b);for(let i=0;i<2;i++){const p=project(points[i],plane),label=names[i]+(plane==='V'?'′':plane==='W'?'″':'');out+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5.5" fill="#206c58" stroke="white" stroke-width="2"/><text x="'+(p[0]+9)+'" y="'+(p[1]-10)+'" fill="#245b49" font-size="17" paint-order="stroke" stroke="white" stroke-width="4">'+label+'</text>'}}if(guides)for(let i=0;i<2;i++){const v=project(points[i],'V'),h=project(points[i],'H'),w=project(points[i],'W');out+=line(v,h,'#c28a30','5 6',1.6);out+=line([500,v[1]],w,'#c28a30','5 6',1.6)}
// Handles are deliberately attached to H and V; the original geometry is editable, not a screenshot.
for(const plane of ['H','V'])for(let i=0;i<2;i++){const p=project(points[i],plane);out+='<g class="handle" data-index="'+i+'" data-plane="'+plane+'" tabindex="0" role="slider" aria-label="'+names[i]+' 点 '+plane+' 面投影，方向键可移动" aria-valuemin="0" aria-valuemax="90" aria-valuenow="'+points[i][0]+'"><circle class="hit" cx="'+p[0]+'" cy="'+p[1]+'" r="23"/><circle class="point" cx="'+p[0]+'" cy="'+p[1]+'" r="7" fill="#d99a35" stroke="white" stroke-width="2"/></g>'}
$('board').innerHTML=out;
$('status').textContent='A/G: ('+points[0].join(', ')+')；B/K: ('+points[1].join(', ')+')。拖动 H 图可修改 x、y；拖动 V 图可修改 x、z。特殊位置条件自动保持。';
const fields=$('fields');fields.replaceChildren();for(let i=0;i<2;i++)for(let k=0;k<3;k++){const lab=document.createElement('label'),id='p'+i+'c'+k;lab.htmlFor=id;lab.textContent=names[i].toUpperCase()+' 的 '+['x','y','z'][k]+'：'+points[i][k];const input=document.createElement('input');input.type='range';input.min='0';input.max='90';input.value=points[i][k];input.id=id;input.addEventListener('input',()=>{const next=points[i].slice();next[k]=+input.value;setPoint(i,next)});lab.append(input);fields.append(lab)}
const a=points[0],b=points[1],eq=(i)=>a[i]===b[i];let cls=eq(0)&&eq(2)?'正垂线（垂直 V）':eq(0)&&eq(1)?'铅垂线（垂直 H）':eq(1)&&eq(2)?'侧垂线（垂直 W）':eq(0)?'侧平线（平行 W）':eq(1)?'正平线（平行 V）':eq(2)?'水平线（平行 H）':'一般位置直线';if(a.every((v,i)=>v===b[i]))cls='两端重合，无法确定直线';
$('diagnosis').textContent='当前几何判断：'+cls+'。坐标差 Δx='+(b[0]-a[0])+'、Δy='+(b[1]-a[1])+'、Δz='+(b[2]-a[2])+'。';
$('solution').textContent=c.answer;$('solution').classList.toggle('hidden',!showAnswer);$('answer').textContent=showAnswer?'隐藏判断与步骤':'显示判断与作图步骤';$('guides').classList.toggle('active',guides);$('guides').setAttribute('aria-pressed',String(guides));
}
function choose(i){current=i;points=[cases[i].a.slice(),cases[i].b.slice()];showAnswer=false;for(const b of $('tasks').children)b.classList.toggle('active',+b.dataset.i===i);$('questionTitle').textContent=cases[i].id+' · '+cases[i].title;$('questionText').textContent=cases[i].text;$('questionHint').textContent='保留本题的几何约束；拖动或改变滑块后，其余投影由同一组三维坐标重新计算。';draw()}
cases.forEach((c,i)=>{const b=document.createElement('button');b.textContent=c.id;b.dataset.i=i;b.onclick=()=>choose(i);$('tasks').append(b)});
$('reset').onclick=()=>choose(current);$('guides').onclick=()=>{guides=!guides;draw()};$('answer').onclick=()=>{showAnswer=!showAnswer;draw()};$('random').onclick=()=>{const c=cases[current];points=[c.a.slice(),c.b.slice()];const d=Math.floor(Math.random()*23)-11;points[0]=points[0].map(v=>clamp(v+d,10,80));points[1]=points[1].map(v=>clamp(v+d,10,80));if(c.type==='konv')points[1][1]=0;if(c.type==='front')points[1][1]=points[0][1];if(c.type==='horizontal')points[1][2]=points[0][2];if(c.type==='profile'||c.type==='vnormal')points[1][0]=points[0][0];if(c.type==='vnormal')points[1][2]=points[0][2];draw()};
const svg=$('board');function svgXY(e){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const matrix=svg.getScreenCTM();return matrix?pt.matrixTransform(matrix.inverse()):null}
svg.addEventListener('pointerdown',e=>{const el=e.target.closest('[data-index]');if(!el)return;const p=svgXY(e);if(!p)return;drag={id:e.pointerId,index:+el.dataset.index,plane:el.dataset.plane,start:p,original:points[+el.dataset.index].slice()};svg.setPointerCapture(e.pointerId);e.preventDefault()});
svg.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const p=svgXY(e);if(!p)return;const dx=(p.x-drag.start.x)/scale,dy=(p.y-drag.start.y)/scale;const next=drag.original.slice();next[0]+=dx;if(drag.plane==='H')next[1]+=dy;else next[2]-=dy;setPoint(drag.index,next);e.preventDefault()});
for(const event of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(event,()=>{drag=null});
svg.addEventListener('keydown',e=>{const el=e.target.closest('[data-index]');if(!el||!e.key.startsWith('Arrow'))return;e.preventDefault();const i=+el.dataset.index,plane=el.dataset.plane,p=points[i].slice(),k=e.key;if(k==='ArrowLeft')p[0]--;if(k==='ArrowRight')p[0]++;if(k==='ArrowUp')p[plane==='H'?1:2]+=plane==='H'?-1:1;if(k==='ArrowDown')p[plane==='H'?1:2]+=plane==='H'?1:-1;setPoint(i,p);svg.querySelector('[data-index="'+i+'"][data-plane="'+plane+'"]')?.focus()});
choose(0);
})();