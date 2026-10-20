'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const pages=[
 ['labs/point-construction.html','constructionBoard','prev','next','status'],
 ['labs/paper-geometry.html','paperBoard','paperPrev','paperNext','paperWhy'],
 ['labs/tangent-constraint.html','tangentBoard','tangentPrev','tangentNext','stepExplain'],
 ['labs/composite-geometry.html','compositeBoard','compPrev','compNext','compStepExplain']
];
for(const [path,board,prev,next,explain] of pages){
 const html=fs.readFileSync(path,'utf8');
 const workspace=html.indexOf('class="unified-animation-workspace"');
 const figure=html.indexOf('class="unified-animation-figure"',workspace);
 const drawing=html.indexOf('id="'+board+'"',figure);
 const guide=html.indexOf('class="animation-side-explanation"',drawing);
 const first=html.indexOf('id="'+prev+'"',guide);
 const second=html.indexOf('id="'+next+'"',guide);
 const text=html.indexOf('id="'+explain+'"',guide);
 assert(workspace>=0&&figure>workspace&&drawing>figure&&guide>drawing&&first>guide&&second>first&&text>second,
  path+' drawing, navigation and step explanation must be in left/right order');
 const tags=[...html.matchAll(/<\/?(?:div|section)\b[^>]*>/g)].map(x=>x[0]);
 const stack=[];
 for(const tag of tags){
  const name=tag.match(/^<\/?(div|section)/)[1];
  if(tag.startsWith('</'))assert.equal(stack.pop(),name,path+' invalid closing '+tag);
  else stack.push(name);
 }
 assert.equal(stack.length,0,path+' unclosed container');
 assert(html.includes('../site-ui.css'),path+' shared stylesheet missing');
}
const css=fs.readFileSync('site-ui.css','utf8');
assert(css.includes('.unified-animation-workspace{display:grid;grid-template-columns:'));
assert(css.includes('@media(max-width:850px)'));
assert(css.includes('.unified-animation-figure svg'));
console.log('PASS four animated learning labs: left drawing, right step controls and explanation, balanced HTML containers, responsive shared style');
