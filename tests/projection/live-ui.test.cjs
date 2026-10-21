'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('labs/point-projection-live.html');
const script=read('labs/point-projection-live-entry.cjs');
const build=read('scripts/build-static.cjs');
const home=read('index.html');
const {solveProjection}=require('../../engines/projection/point-projection.cjs');

test('live P0 projection page uses local bundled solver and not a fake static answer',()=>{
 assert.match(html,/point-projection-live-bundle\.js/);
 assert.doesNotMatch(html,/https?:\/\//i);
 assert.match(script,/require\('\.\.\/engines\/projection\/point-projection\.cjs'\)/);
 assert.match(script,/solveProjection\(given\)/);
 assert.doesNotMatch(script,/innerHTML\s*=/);
 assert.doesNotMatch(script,/fetch\(|XMLHttpRequest|localStorage|sessionStorage/);
});
test('input revision invalidation happens before recompute; no stale computed points',()=>{
 assert.match(script,/revision\+\+/);
 assert.match(script,/solution=null;shownStep=0/);
 assert.match(script,/if\(s\.status==='unique'\)/);
 assert.match(script,/\.guides\.slice\(0,shownStep\)/);
 assert.match(script,/if\(shownStep===s\.steps\.length\)/);
});
test('input and keyboard accessible live controls are wired',()=>{
 for(const id of ['paperSvg','pairSelect','firstU','firstV','secondU','secondV','scaleInput',
   'recompute','resetExample','previous','next','restart','solveStatus','stepExplanation']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  assert.match(script,new RegExp(id));
 }
 assert.match(html,/aria-live="polite"/);
 assert.match(html,/@media\(max-width:900px\)/);
 assert.match(html,/min-height:44px/);
 assert.match(script,/createElementNS/);
});
test('production home links exact public page, build packages it without publishing source',()=>{
 assert.match(home,/href="labs\/point-projection-live\.html"/);
 assert.match(build,/'labs\/point-projection-live\.html'/);
 assert.match(build,/labs\/point-projection-live-entry\.cjs/);
 assert.match(build,/labs\/point-projection-live-bundle\.js/);
 assert.doesNotMatch(build,/'tests\/projection\/point-projection\.test\.cjs'/);
 assert.doesNotMatch(build,/'core\/contracts\/geometry\.js'/);
});
test('live solver uses true point projection and fails closed on contradictory data',()=>{
 const success=solveProjection({knownViews:{V:[15,12],H:[15,10]}});
 assert.equal(success.status,'unique');
 assert.deepEqual(success.point,{x:15,y:10,z:12});
 assert.equal(success.steps.length,4);
 const bad=solveProjection({knownViews:{V:[15,12],H:[16,10]}});
 assert.equal(bad.status,'none');
 assert.deepEqual(bad.steps,[]);
});

test('direct XYZ input and guide toggle are present in the published UI',()=>{
 for(const id of ['spaceInputs','spaceX','spaceY','spaceZ','showGuides']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.match(html,/<option value="XYZ">/);
 assert.match(script,/knownPoint:\{x:xyz\[0\],y:xyz\[1\],z:xyz\[2\]\}/);
 assert.match(script,/knownPoint\?'已按空间点坐标计算/);
 assert.match(script,/\.classList\.toggle\('hidden',pair/);
 assert.match(script,/\$\('showGuides'\)\.addEventListener\('change',render\)/);
});

function createInteractivePage(){
 const vm=require('node:vm');
 const values={pairSelect:'XYZ',firstU:'15',firstV:'12',secondU:'15',
  secondV:'10',spaceX:'15',spaceY:'10',spaceZ:'12',scaleInput:'4'};
 const ids=['paperSvg','pairSelect','spaceInputs','projectionInputs','firstU',
  'firstV','secondU','secondV','spaceX','spaceY','spaceZ','scaleInput','showGuides',
  'firstULabel','firstVLabel','secondULabel','secondVLabel','recompute','resetExample',
  'previous','next','restart','solveStatus','stepTitle','stepExplanation','stepCounter'];
 const elements=new Map(ids.map(id=>[id,{
  id,value:values[id]??'',checked:id==='showGuides',listeners:{},children:[],
  firstChild:{textContent:''},classList:{toggle(){}},
  addEventListener(kind,callback){this.listeners[kind]=callback},
  replaceChildren(...nodes){this.children=[...nodes]},
  append(...nodes){this.children.push(...nodes)},
  get valueAsNumber(){return this.value.trim()===''?NaN:Number(this.value)},
  textContent:'',disabled:false
 }]));
 const document={
  getElementById(id){
   if(!elements.has(id))throw Error('missing mock control: '+id);
   return elements.get(id);
  },
  createElementNS(_namespace,tag){
   return {tag,attributes:{},children:[],textContent:'',
    setAttribute(name,value){this.attributes[name]=String(value)},
    append(...nodes){this.children.push(...nodes)}
   };
  }
 };
 const nodeRequire=id=>{
  if(id==='../engines/projection/point-projection.cjs')
   return require('../../engines/projection/point-projection.cjs');
  if(id==='../core/projection/conventions.js')
   return require('../../core/projection/conventions.js');
  throw Error('unexpected runtime module '+id);
 };
 vm.runInNewContext(script,{require:nodeRequire,document});
 const get=id=>elements.get(id);
 const fire=(id,event)=>{const el=get(id);assert.equal(typeof el.listeners[event],'function');
  el.listeners[event]()};
 const allSvgNodes=()=>{
  const out=[],visit=node=>{
   out.push(node);
   for(const child of node.children??[])visit(child);
  };
  for(const n of get('paperSvg').children)visit(n);
  return out;
 };
 return {get,fire,allSvgNodes};
}

test('real UI computes XYZ, all three V/H/W results, and mathematical guide toggle',()=>{
 const page=createInteractivePage();
 const {get,fire,allSvgNodes}=page;
 assert.match(get('solveStatus').textContent,/15, 10, 12/);
 assert.match(get('stepExplanation').textContent,/空间点 P/);
 for(let i=0;i<4;i++)fire('next','click');
 assert.equal(get('stepCounter').textContent,'4 / 4');
 let nodes=allSvgNodes();
 assert.equal(nodes.filter(n=>n.tag==='line'&&n.attributes.stroke==='#c28133').length,4);
 assert.equal(nodes.filter(n=>n.tag==='text'&&n.textContent.startsWith('由空间点投影 ')).length,3);
 get('showGuides').checked=false;fire('showGuides','change');
 nodes=allSvgNodes();
 assert.equal(nodes.filter(n=>n.tag==='line'&&n.attributes.stroke==='#c28133').length,0);
 assert.equal(nodes.filter(n=>n.tag==='text'&&n.textContent.startsWith('由空间点投影 ')).length,3);
 assert.match(get('solveStatus').textContent,/15, 10, 12/);
 get('spaceX').value='-7';fire('spaceX','input');
 assert.equal(get('stepCounter').textContent,'0 / 4');
 assert.match(get('solveStatus').textContent,/-7, 10, 12/);
 assert.equal(allSvgNodes().some(n=>n.tag==='text'&&n.textContent.startsWith('由空间点投影 ')),false);
});

test('UI mode switch recalculates via real VH solver and rejects invalid XYZ without stale guides',()=>{
 const {get,fire,allSvgNodes}=createInteractivePage();
 get('pairSelect').value='VH';fire('pairSelect','change');
 assert.match(get('solveStatus').textContent,/15, 10, 12/);
 for(let i=0;i<4;i++)fire('next','click');
 let nodes=allSvgNodes();
 assert.equal(nodes.filter(n=>n.tag==='text'&&n.textContent==='求得 W').length,1);
 assert.equal(nodes.filter(n=>n.tag==='text'&&n.textContent.startsWith('已知 ')).length,2);
 get('pairSelect').value='XYZ';fire('pairSelect','change');
 for(let i=0;i<4;i++)fire('next','click');
 get('spaceY').value='';fire('spaceY','input');
 assert.match(get('solveStatus').textContent,/输入尚未有效/);
 assert.equal(get('stepCounter').textContent,'0 / 0');
 assert.equal(get('next').disabled,true);
 assert.equal(allSvgNodes().some(n=>n.tag==='text'&&n.textContent.startsWith('由空间点投影 ')),false);
 get('spaceY').value='10';fire('spaceY','input');
 assert.match(get('solveStatus').textContent,/15, 10, 12/);
 get('scaleInput').value='0';fire('scaleInput','input');
 assert.match(get('solveStatus').textContent,/显示比例/);
 assert.equal(get('next').disabled,true);
});
