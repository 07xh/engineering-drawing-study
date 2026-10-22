'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {detectCurveCandidates:detect}=require('../../recognition/local-curve-candidates.cjs');
const fs=require('node:fs');
function blank(w=160,h=160,v=255){
 const data=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<data.length;i+=4){
  data[i]=v;data[i+1]=v;data[i+2]=v;data[i+3]=255;
 }
 return {width:w,height:h,data};
}
function dot(frame,x,y){
 x=Math.round(x);y=Math.round(y);
 if(x<0||y<0||x>=frame.width||y>=frame.height)return;
 const i=4*(frame.width*y+x);
 frame.data[i]=0;frame.data[i+1]=0;frame.data[i+2]=0;
}
function curve(frame,cx,cy,r,from=0,to=360){
 for(let degrees=from;degrees<=to;degrees+=.32){
  const a=degrees*Math.PI/180;
  dot(frame,cx+r*Math.cos(a),cy+r*Math.sin(a));
 }
}
function line(frame,x0,y0,x1,y1){
 const steps=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*3;
 for(let i=0;i<=steps;i++){
  const t=i/steps;dot(frame,x0+(x1-x0)*t,y0+(y1-y0)*t);
 }
}
test('closed circle candidate preserves pixel center radius, bounded error and untrusted confidence',()=>{
 const frame=blank();
 curve(frame,75,68,39);
 const detected=detect(frame,{minRadius:15});
 assert.ok(detected.length>=1,JSON.stringify(detected));
 const circle=detected.find(c=>c.kind==='circle'&&Math.abs(c.radius-39)<2);
 assert.ok(circle,JSON.stringify(detected));
 assert.ok(Math.abs(circle.center.x-75)<1.5);
 assert.ok(Math.abs(circle.center.y-68)<1.5);
 assert.ok(circle.radialRmsPx<1.4);
 assert.equal(circle.coordinateSpace,'image-px');
 assert.equal(circle.method,'connected-ink-circlefit-candidate/0.1');
 assert.ok(circle.confidence<1);
 assert.ok(!Object.hasOwn(circle,'unit'));
 assert.ok(!Object.hasOwn(circle,'globallyUnique'));
});
test('finite quarter arc returns candidate with bounded arc range, not a full-circle claim',()=>{
 const frame=blank();
 curve(frame,72,75,45,10,135);
 const detected=detect(frame,{minRadius:15,minArcDegrees:75});
 const arc=detected.find(c=>c.kind==='arc'&&Math.abs(c.radius-45)<2);
 assert.ok(arc,JSON.stringify(detected));
 assert.ok(arc.coverageDeg>100&&arc.coverageDeg<155);
 assert.equal(arc.sweepDirection,'cw-screen');
 assert.ok(arc.sweepDeg<180&&arc.sweepDeg>90);
 assert.ok(Math.abs(arc.center.x-72)<3&&Math.abs(arc.center.y-75)<3);
});
test('clean straight line is not mistaken for a circular arc or solved geometry',()=>{
 const frame=blank();
 line(frame,10,20,145,20);
 assert.deepEqual(detect(frame,{minRadius:10}),[]);
});
test('multiple non-touching circles are independently recognized',()=>{
 const frame=blank(220,150);
 curve(frame,55,72,26);
 curve(frame,162,68,33);
 const curves=detect(frame,{minRadius:15,maxCandidates:6});
 assert.ok(curves.filter(c=>c.kind==='circle').length>=2,JSON.stringify(curves));
});
test('blank, filled dark and malformed images fail safely without math output',()=>{
 assert.deepEqual(detect(blank()),[]);
 assert.deepEqual(detect(blank(120,120,0)),[]);
 assert.throws(()=>detect({width:901,height:50,data:new Uint8Array(901*50*4)}));
 assert.throws(()=>detect({width:80,height:80,data:new Uint8Array(400)}));
 assert.throws(()=>detect(blank(),{maxCandidates:30}));
 assert.throws(()=>detect(blank(),{minArcDegrees:10}));
 assert.throws(()=>detect(blank(),{minRadius:0}));
});
test('the local overlay cannot submit candidates directly as model-mm constraints',()=>{
 const source=fs.readFileSync('recognition/local-curve-candidates.cjs','utf8');
 const ui=fs.readFileSync('labs/local-curve-candidates-ui.cjs','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 assert.match(html,/id="detectedCurveOverlay"/);
 assert.match(html,/id="detectCurves"/);
 assert.match(entry,/attachLocalCurveCandidates/);
 assert.match(ui,/getImageData/);
 assert.match(ui,/data-unconfirmed-curve/);
 assert.doesNotMatch(source,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b/);
 assert.doesNotMatch(ui,/solveFiniteFillet|session\.replace/);
});
