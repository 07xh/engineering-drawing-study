'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {suggestMillimetresPerImagePixel:suggest}=
 require('../../labs/manual-raster-scale-calibration.cjs');
const img={width:1200,height:900};
const base={image:img,sourceId:'line_1',explicitlyReviewed:true};
test('user-reviewed 3-4-5 ruler baseline converts real mm to image-pixel scale',()=>{
 const r=suggest({...base,from:{x:100,y:200},to:{x:130,y:240},knownLengthMm:25});
 assert.equal(r.pixelLength,50);
 assert.equal(r.knownLengthMm,25);
 assert.equal(r.mmPerPx,0.5);
 assert.equal(r.calibrationFrame,'original-image-px');
 assert.equal(r.verifiedDrawingScale,false);
 assert.equal(r.assumesUniformImageScale,true);
 assert.equal(r.perspectiveAndDistortionNotVerified,true);
 assert.equal(r.status,'human-reviewed-single-baseline-proposal');
 assert.deepEqual(Object.keys(r).includes('globallyUnique'),false);
});
test('endpoint order and image Y direction do not change Euclidean scale',()=>{
 const a=suggest({...base,from:{x:100,y:200},to:{x:130,y:240},knownLengthMm:25});
 const b=suggest({...base,from:{x:130,y:240},to:{x:100,y:200},knownLengthMm:25});
 assert.equal(a.mmPerPx,b.mmPerPx);
});
test('unreviewed OCR-like guessed dimension, missing units and wrong baseline fail closed',()=>{
 const from={x:100,y:100},to={x:200,y:100};
 assert.throws(()=>suggest({...base,from,to,knownLengthMm:20,explicitlyReviewed:false}),/human review/);
 assert.throws(()=>suggest({...base,from,to,knownLengthMm:'20'}),/positive mm/);
 assert.throws(()=>suggest({...base,from,to,knownLengthMm:NaN}),/positive mm/);
 assert.throws(()=>suggest({...base,from,to,knownLengthMm:0}),/positive mm/);
 assert.throws(()=>suggest({...base,from,to,knownLengthMm:-4}),/positive mm/);
 assert.throws(()=>suggest({...base,from,to,knownLengthMm:Infinity}),/positive mm/);
 assert.throws(()=>suggest({...base,from,to,knownLengthMm:1e9}),/positive mm/);
 assert.throws(()=>suggest({...base,from,to,sourceId:'line/../../private',knownLengthMm:20}));
});
test('invalid original image points, extreme foreshortening or tiny baseline are rejected',()=>{
 assert.throws(()=>suggest({...base,from:{x:-1,y:100},to:{x:50,y:100},knownLengthMm:10}),/outside/);
 assert.throws(()=>suggest({...base,from:{x:100,y:100},to:{x:1300,y:100},knownLengthMm:10}),/outside/);
 assert.throws(()=>suggest({...base,from:{x:100,y:100},to:{x:105,y:105},knownLengthMm:10}),/at least 10/);
 assert.throws(()=>suggest({...base,from:{x:100,y:100},to:{x:300,y:100},knownLengthMm:0.0000001}),/outside numeric limits/);
 assert.throws(()=>suggest({...base,image:{width:1000000,height:900},from:{x:100,y:100},to:{x:200,y:100},knownLengthMm:10}));
 assert.throws(()=>suggest({...base,from:{x:NaN,y:20},to:{x:200,y:100},knownLengthMm:20}));
});
test('same 40 mm of human-known line mapped to 80 original image px yields 0.5mm/px',()=>{
 const r=suggest({...base,sourceId:'line-2',
  from:{x:200,y:250},to:{x:280,y:250},knownLengthMm:40});
 assert.equal(r.mmPerPx,0.5);
 assert.equal(r.knownLengthMm/r.mmPerPx,r.pixelLength);
});
test('actual R0 solver page exposes opt-in reviewed calibration UI without math shortcuts',()=>{
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const js=fs.readFileSync('labs/local-raster-geometry-review-ui.cjs','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 for(const id of ['rasterScaleSource','rasterScaleLength','rasterScaleReviewed',
  'rasterScaleCalculate','rasterScaleStatus'])
  assert.match(html,new RegExp('id="'+id+'"'));
 for(const name of ['scaleSource','scaleLength','scaleReviewed','scaleCalculate','scaleStatus'])
  assert.match(entry,new RegExp(name+':\\$\\('));
 assert.match(js,/suggestMillimetresPerImagePixel/);
 assert.match(js,/source\?\.kind!=='segment'/);
 assert.match(js,/explicitlyReviewed:scaleReviewed\.checked/);
 assert.match(js,/mmPerPx\.value=String\(suggestion\.mmPerPx\)/);
 assert.match(js,/input\.addEventListener\('input',invalidateDerivedScale\)/);
 assert.match(js,/scaleLength\.addEventListener\('input',invalidateDerivedScale\)/);
 assert.match(js,/scaleSource\.addEventListener\('change',\(\)=>\{\s*invalidateDerivedScale\(\);updateCrossSources\(\);/);
 assert.match(js,/accepted\.checked=false/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|localStorage|solveFiniteFillet/);
});
