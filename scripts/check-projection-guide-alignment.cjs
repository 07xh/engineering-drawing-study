'use strict';
/* Verify real geometry rather than screenshot alignment or hand-drawn previews. */
const assert=require('node:assert/strict');
const visual=require('../knowledge/visual-model.js');
const close=(a,b)=>Math.abs(a-b)<1e-8;
function eq(a,b,msg){assert(a.length===b.length&&a.every((n,i)=>close(n,b[i])),msg+' expected '+b+' got '+a)}
function find(shapes,label){const x=shapes.filter(s=>s.kind==='guide'&&s.label===label);assert.equal(x.length,1,'missing/duplicate '+label);return x[0].xy}
for(const [mode,model] of Object.entries(visual.modes)){
 const id=Object.entries({
  point:'ch02-point-projection',line:'ch02-line-two-points',plane:'ch02-plane-definition',
  prism:'ch02-three-view-system',pyramid:'ch02-polyhedra',cylinder:'ch02-cylinder',
  cone:'ch02-cone',sphere:'ch02-sphere'
 }).find(([,value])=>value==='ch02-'+mode)?.[1]||
 {point:'ch02-point-projection',line:'ch02-line-two-points',plane:'ch02-plane-definition',
 prism:'ch02-three-view-system',pyramid:'ch02-polyhedra',cylinder:'ch02-cylinder',
 cone:'ch02-cone',sphere:'ch02-sphere'}[mode];
 const p=model.points[Object.keys(model.points)[0]];
 const v=visual.projection(p,'V'),h=visual.projection(p,'H'),w=visual.projection(p,'W');
 const shapes=visual.svgShapes(id,'ch02',3).shapes;
 const mirror=[visual.origin.x+(h[1]-visual.origin.y),h[1]];
 eq(find(shapes,'长对正：同 x'),[...v,...h],mode+' long alignment');
 eq(find(shapes,'高平齐：同 z'),[...v,...w],mode+' height alignment');
 eq(find(shapes,'深度水平转移至 45° 线'),[...h,...mirror],mode+' depth transfer');
 eq(find(shapes,'宽相等：同 y'),[...mirror,...w],mode+' width alignment');
 assert(close(v[0],h[0]),mode+' V/H x mismatch');
 assert(close(v[1],w[1]),mode+' V/W height mismatch');
 assert(close(mirror[0],w[0]),mode+' H/W depth mismatch');
 assert(close(mirror[0]-visual.origin.x,mirror[1]-visual.origin.y),mode+' 45-degree mismatch');
 const diagonal=shapes.find(s=>s.kind==='transfer45');
 assert(diagonal&&close(diagonal.xy[2]-diagonal.xy[0],diagonal.xy[3]-diagonal.xy[1]),mode+' diagonal not 45 degrees');
 assert(visual.svgShapes(id,'ch02',1).shapes.every(s=>s.kind!=='guide'),mode+' early guide');
}
console.log('PASS: exact projection alignment, 45-degree transfer and auxiliary endpoints for all eight original models');
