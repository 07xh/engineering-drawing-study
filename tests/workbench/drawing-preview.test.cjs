'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Core=require('../../workbench/workbench-core.js');
const fixtures=require('../../workbench/fixture-data.js');
const script=fs.readFileSync(path.join(__dirname,'../../workbench/workbench-ui.js'),'utf8');

function setup(){
  function node(tag,id){
    return {tag,id,children:[],listeners:{},attributes:{},value:'',hidden:false,disabled:false,
      checked:false,dataset:{},textContent:'',classList:{toggle(){}},
      addEventListener(kind,callback){this.listeners[kind]=callback;},
      setAttribute(key,value){this.attributes[key]=String(value);},
      append(...kids){for(const kid of kids){kid.parent=this;this.children.push(kid);}},
      replaceChildren(...kids){this.children=[];this.append(...kids);},
      remove(){if(this.parent)this.parent.children=this.parent.children.filter(item=>item!==this);},
      getBoundingClientRect(){return {left:0,top:0,width:720,height:430};},
      setPointerCapture(){}
    };
  }
  const ids=['drawingBoard','fixtureSelect','stepTitle','stepExplanation','paperNote',
    'previous','next','playPause','stepCounter','nextHint','hintCounter','undoDraw',
    'redoDraw','drawCounter','drawingHint','threePane','toggleThree','statusProbe',
    'residual','degree','status','reset','mutateInput'];
  const elements=new Map(ids.map(id=>[id,node('div',id)]));
  const modeButtons=['full','hint','draw'].map(mode=>{const button=node('button');button.dataset.mode=mode;return button;});
  const panels=new Map(['.playback-controls','.hint-controls','.draw-controls'].map(x=>[x,node('div')]));
  const document={
    getElementById(id){if(!elements.has(id))throw Error('Mock element missing: '+id);return elements.get(id);},
    querySelectorAll(selector){return selector==='[data-mode]'?modeButtons:[];},
    querySelector(selector){return panels.get(selector);},
    createElement:tag=>node(tag),createElementNS:(_ns,tag)=>node(tag),
    addEventListener(){}
  };
  const window={DA07WorkbenchCore:Core,DA07SyntheticFixtures:fixtures,
    matchMedia(){return {matches:false,addEventListener(){}};}};
  vm.runInNewContext(script,{window,document});
  const get=id=>elements.get(id);
  const fire=(id,kind,event={})=>get(id).listeners[kind](event);
  const strokes=(kind)=>get('drawingBoard').children.filter(n=>n.attributes[kind]==='true');
  return {get,fire,modeButtons,strokes};
}

test('tablet pen preview follows pointer without committing geometry before release',()=>{
  const p=setup();p.modeButtons[2].listeners.click();
  p.fire('drawingBoard','pointerdown',{pointerId:7,button:0,clientX:10,clientY:20});
  assert.equal(p.strokes('data-student-preview').length,1);
  assert.equal(p.strokes('data-student').length,0);
  p.fire('drawingBoard','pointermove',{pointerId:7,clientX:110,clientY:120});
  const preview=p.strokes('data-student-preview')[0];
  assert.equal(preview.attributes.x2,'110');
  assert.equal(preview.attributes.y2,'120');
  p.fire('drawingBoard','pointercancel',{pointerId:7});
  assert.equal(p.strokes('data-student-preview').length,0);
  assert.equal(p.strokes('data-student').length,0);
});

test('short strokes are ignored; pen release commits once; stale input clears everything',()=>{
  const p=setup();p.modeButtons[2].listeners.click();
  p.fire('drawingBoard','pointerdown',{pointerId:2,button:0,clientX:12,clientY:20});
  p.fire('drawingBoard','pointerup',{pointerId:2,clientX:14,clientY:20});
  assert.equal(p.strokes('data-student').length,0);
  p.fire('drawingBoard','pointerdown',{pointerId:3,button:0,clientX:10,clientY:20});
  p.fire('drawingBoard','pointermove',{pointerId:99,clientX:300,clientY:300});
  assert.equal(p.strokes('data-student-preview')[0].attributes.x2,'10');
  p.fire('drawingBoard','pointerup',{pointerId:3,clientX:70,clientY:85});
  assert.equal(p.strokes('data-student-preview').length,0);
  assert.equal(p.strokes('data-student').length,1);
  assert.equal(p.get('drawCounter').textContent,'1 条学生线');
  p.fire('drawingBoard','pointerdown',{pointerId:4,button:0,clientX:20,clientY:30});
  p.fire('mutateInput','click');
  assert.equal(p.strokes('data-student-preview').length,0);
  assert.equal(p.strokes('data-student').length,0);
});

test('mode switch and lost pointer capture discard temporary student strokes',()=>{
  const p=setup();p.modeButtons[2].listeners.click();
  p.fire('drawingBoard','pointerdown',{pointerId:8,button:0,clientX:40,clientY:40});
  p.fire('drawingBoard','lostpointercapture',{pointerId:8});
  assert.equal(p.strokes('data-student-preview').length,0);
  p.fire('drawingBoard','pointerdown',{pointerId:9,button:0,clientX:50,clientY:50});
  p.modeButtons[0].listeners.click();
  assert.equal(p.strokes('data-student-preview').length,0);
  assert.equal(p.strokes('data-student').length,0);
});
