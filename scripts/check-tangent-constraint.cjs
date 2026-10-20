'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=path=>fs.readFileSync(path,'utf8');
function moduleExports(path){const context={};vm.runInNewContext(source(path),context,{filename:path});return context}
const geo=moduleExports('labs/tangent-constraint-core.js').TangencyConstraint;
const kb=moduleExports('knowledge/knowledge-data.js').DrawingKnowledge;
assert(geo&&geo.compute&&geo.frame,'tangency model missing');
assert.deepEqual(Array.from(geo.degrees),[2,1,0,0,0],'DOF stages incorrect');
let checks=0;
for(let r=22;r<=52;r++){
 for(const side of ['left','right']){
  const m=geo.compute(r,side),f=geo.fixed;
  assert.equal(m.valid,true,'invalid tangency at '+r+side);
  assert.equal(m.discreteSolutions,2,'both candidate centers must remain until source conditions pick branch');
  assert(Math.abs(m.center.y-(f.lineY-r))<1e-9,'line tangency y incorrect');
  assert(Math.abs(Math.hypot(m.center.x-f.ox,m.center.y-f.oy)-(f.R+r))<1e-8,'outer tangent center distance wrong');
  assert(Math.abs(Math.hypot(m.contactCircle.x-f.ox,m.contactCircle.y-f.oy)-f.R)<1e-8,'known circle contact wrong');
  assert(Math.abs(Math.hypot(m.contactCircle.x-m.center.x,m.contactCircle.y-m.center.y)-r)<1e-8,'new circle contact wrong');
  assert.equal(m.contactLine.y,f.lineY,'line tangency point must be on known line');
  assert(m.contactLine.x===m.center.x,'line tangency must be perpendicular');
  assert(Object.values(m.residuals).every(value=>value<1e-8),'uncertainty residual incorrect');
  for(let step=0;step<=4;step++){
   const p=geo.frame(r,side,step);
   assert.equal(p.dof,geo.degrees[step],'stage DOF mismatch');
   assert(p.items.every(x=>(x.kind==='circle'?[x.cx,x.cy,x.r]:x.kind==='line'?[x.x1,x.y1,x.x2,x.y2]:[x.x,x.y]).every(Number.isFinite)),'NaN in SVG primitives');
   if(step<3)assert(!p.items.some(x=>x.style==='candidate'||x.style==='selected'),'unconfirmed candidates shown early');
   if(step===3)assert.equal(p.items.filter(x=>x.kind==='point'&&['candidate','selected'].includes(x.style)).length,2,'both circle center candidates must appear');
   if(step<4)assert(!p.items.some(x=>x.style==='solution'),'solution arc drawn before final step');
   if(step===4){
    assert.equal(p.items.filter(x=>x.kind==='circle'&&x.style==='solution').length,1,'missing final auxiliary solution circle');
    assert.equal(p.items.filter(x=>x.kind==='point'&&x.style==='selected').length,3,'chosen center and both contact points should be shown');
   }
   checks++;
  }
 }
}
assert.throws(()=>geo.compute(17,'left'),'invalid radius must not be accepted');
assert.throws(()=>geo.compute(32,'unknown'),'unrecognized branch must not be accepted');
assert.throws(()=>geo.frame(32,'left',5),'bad step must be rejected');
for(const id of ['ch01-circle-tangent-principle','ch01-fillet-straight-lines','ch01-arc-classification','ch01-drawing-workflow']){
 const item=kb.get(id);
 assert(item&&item.contentStatus==='page-reviewed','unreviewed chapter 1 lesson linked to lab: '+id);
 assert.equal(item.labLink,'../labs/tangent-constraint.html');
 assert.equal(item.visualMode,null,'do not mislabel planar 2D model as 3D V/H/W');
}
assert.equal(kb.get('ch01-s03').labLink,undefined,'unreviewed TOC entry should not contain a lab link');
const html=source('labs/tangent-constraint.html'),ui=source('labs/tangent-constraint-ui.js');
for(const id of ['tangentBoard','tangentRadius','tangentSide','tangentPrev','tangentNext','tangentRestart','tangentCounter','stepTitle','stepExplain','resultSummary','degree2','degree1','degree0']){
 assert(html.includes('id="'+id+'"'),'missing classroom interaction '+id);
}
assert(html.includes('不是教材原题'),'synthetic example must be identified');
assert(!ui.includes('VerifiedExerciseSolutions')&&!ui.includes('lineFocus')&&!ui.includes('verified-exercises'),'tangent lab must not access textbook answer data');
assert(ui.includes('picture.geometry')&&ui.includes('picture.items'),'UI should use actual numerical solver');
assert(html.includes('src="tangent-constraint-core.js"')&&html.includes('src="tangent-constraint-ui.js"'));
const known=source('knowledge/index.html'),app=source('knowledge/knowledge-app.js');
assert(known.includes('id="chapterLabLink"')&&app.includes("labLink==='../labs/tangent-constraint.html'"),'knowledge lab must use allowlisted link');
assert(app.includes('lab.hidden=!allowed'),'unverified lesson must not show lab');
for(const file of ['labs/tangent-constraint.html','labs/tangent-constraint-core.js','labs/tangent-constraint-ui.js'])assert(source('scripts/build-static.cjs').includes("'"+file+"'"),'build omitted '+file);
console.log('PASS: Chapter 1 tangible paper-geometry lab, '+checks+' traced stage cases, 31 radii × 2 branches with verified tangencies, explicit continuous DOF and safe public separation');
