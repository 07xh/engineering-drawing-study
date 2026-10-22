'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {detectLineCandidates:detect}=
 require('../../recognition/local-line-candidates.cjs');
const fs=require('node:fs');
function blank(w=128,h=128,gray=255){
 const data=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<data.length;i+=4){
  data[i]=gray;data[i+1]=gray;data[i+2]=gray;data[i+3]=255;
 }
 return {width:w,height:h,data};
}
function line(img,x0,y0,x1,y1){
 let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),
 sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx+dy;
 while(true){
  const i=4*(y0*img.width+x0);
  img.data[i]=0;img.data[i+1]=0;img.data[i+2]=0;
  if(x0===x1&&y0===y1)break;
  const e=2*err;
  if(e>=dy){err+=dy;x0+=sx;}
  if(e<=dx){err+=dx;y0+=sy;}
 }
}
const length=s=>Math.hypot(s.from.x-s.to.x,s.from.y-s.to.y);
test('horizontal and vertical finite strokes are proposed as image-px candidates',()=>{
 const img=blank();line(img,10,30,110,30);line(img,80,60,80,120);
 const r=detect(img,{minLength:35});
 assert.ok(r.length>=2,JSON.stringify(r));
 assert.ok(r.some(x=>length(x)>85&&Math.abs(x.from.y-x.to.y)<4&&
  Math.abs(x.from.y-30)<5),JSON.stringify(r));
 assert.ok(r.some(x=>length(x)>48&&Math.abs(x.from.x-x.to.x)<4&&
  Math.abs(x.from.x-80)<5),JSON.stringify(r));
 for(const x of r){assert.equal(x.coordinateSpace,'image-px');
  assert.equal(x.method,'binary-hough-candidate/0.1');
  assert.ok(x.confidence>=0&&x.confidence<1);}
});
test('oblique 45 degree line can be proposed without assuming horizontal axes',()=>{
 const img=blank();line(img,20,20,110,110);
 const r=detect(img,{minLength:55});
 assert.ok(r.some(s=>length(s)>70&&
  Math.abs((s.to.y-s.from.y)/(s.to.x-s.from.x)-1)<.2),JSON.stringify(r));
});
test('blank or sparse non-line image never yields a verified geometry result',()=>{
 const img=blank();
 assert.deepEqual(detect(img),[]);
 for(const [x,y] of [[5,5],[30,42],[42,22],[72,113],[120,7]]){
  const i=4*(y*img.width+x);
  img.data[i]=0;img.data[i+1]=0;img.data[i+2]=0;
 }
 assert.deepEqual(detect(img),[]);
});
test('bad buffers and heavy black fill are safely rejected',()=>{
 assert.throws(()=>detect({width:2000,height:50,data:new Uint8Array(400000)}));
 assert.throws(()=>detect({width:100,height:100,data:new Uint8Array(40)}));
 assert.throws(()=>detect(blank(),{minLength:0}));
 assert.throws(()=>detect(blank(),{maxCandidates:100}));
 const black=blank(128,128,0);
 assert.deepEqual(detect(black),[]);
});
test('candidates are never math-mm verified answers and image stays on device',()=>{
 const source=fs.readFileSync('recognition/local-line-candidates.cjs','utf8');
 const ui=fs.readFileSync('labs/local-line-candidates-ui.cjs','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 assert.match(ui,/getImageData/);
 assert.match(ui,/drawImage/);
 assert.match(ui,/coordinateSpace|detectLineCandidates/);
 assert.match(ui,/候选/);
 assert.match(html,/id="detectedLineOverlay"/);
 assert.match(html,/id="detectLines"/);
 assert.match(html,/id="clearLines"/);
 assert.match(entry,/attachLocalLineCandidates/);
 assert.doesNotMatch(source,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b/);
 assert.doesNotMatch(ui,/session\.replace|solveFiniteFillet/);
});
