'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {extractSvgCandidates}=require('../../recognition/vector-svg-candidates.cjs');
const {reviewCandidate}=require('../../recognition/problem-draft.cjs');
const {prepareConfirmedFillet,runConfirmedSvgFillet}=require('../../integration/v31-confirmed-svg-fillet-v5.cjs');
const sheet={origin:{x:350,y:220},scale:5};
const wrap=(body)=>'<svg width="100" height="100" viewBox="0 0 100 100">'+body+'</svg>';
const make=(body)=>{
 const d=extractSvgCandidates(wrap(body)).draft;
 return d;
};
function reviewAllGeometry(d){
 for(const c of d.candidates.filter(c=>c.geometry))
  d=reviewCandidate(d,{id:c.id,expectedRevision:d.revision,decision:'confirmed'});
 return d;
}
const calibration=d=>({frame:'drawing-px',originPx:{x:40,y:40},
  mmPerPx:1,yAxis:'down',reviewedBy:'user',revision:d.revision});
const lines=()=>wrap('<line x1="30" y1="40" x2="50" y2="40"/><line x1="40" y1="30" x2="40" y2="50"/>');
const twoSegments=()=>{
 const draft=reviewAllGeometry(extractSvgCandidates(lines()).draft);
 return {draft,expectedRevision:draft.revision,calibration:calibration(draft),
  kind:'two-segments',sourceIds:{first:'segment-1',second:'segment-2'},
  filletRadiusMm:3,selection:{branchId:'s++',direction:'ccw',
    firstTravel:'forward',secondTravel:'forward'},sheet};
};
const circles=()=>{
 const draft=reviewAllGeometry(make('<circle cx="40" cy="40" r="5"/><circle cx="60" cy="40" r="5"/>'));
 return {draft,expectedRevision:draft.revision,calibration:calibration(draft),
  kind:'two-circles',sourceIds:{first:'circle-1',second:'circle-2'},
  filletRadiusMm:10,options:{firstMode:'external',secondMode:'external'},
  selection:{branchId:'center-1',direction:'cw',
    knownFirstTravel:'ccw',knownSecondTravel:'ccw'},sheet};
};
const mixed=()=>{
 const draft=reviewAllGeometry(make('<line x1="25" y1="40" x2="55" y2="40"/><circle cx="40" cy="45" r="8"/>'));
 return {draft,expectedRevision:draft.revision,calibration:calibration(draft),
  kind:'segment-circle',sourceIds:{segment:'segment-1',circle:'circle-2'},
  filletRadiusMm:3,options:{side:1},selection:{branchId:'candidate-1',
    direction:'ccw',lineTravel:'forward',knownCircleTravel:'cw'},sheet};
};
test('unseen SVG segments → reviewed mm geometry → real 02 G1 → existing V5 actions',()=>{
 const input=twoSegments();
 const output=runConfirmedSvgFillet(input);
 assert.equal(output.status,'ready');
 assert.equal(output.mathematicallyVerified,true);
 assert.equal(output.typedMathEvidence.g1Verified,true);
 assert.equal(output.steps.length,6);
 assert.deepEqual(output.typedMathEvidence.center,{x:-3,y:3});
 assert.equal(output.revision,input.draft.revision);
 assert.deepEqual(output.imageProvenance.sourceIds,input.sourceIds);
 assert.equal(output.imageProvenance.metricCalibrationMathematicallyProven,false);
 assert.equal(output.imageProvenance.recognizedCandidateProof,false);
 assert.equal(output.typedMathEvidence.globallyUnique,null);
});
test('new two-circle vector input follows existing candidate/G1 V5 (does not select globally unique)',()=>{
 const output=runConfirmedSvgFillet(circles());
 assert.equal(output.status,'ready');assert.equal(output.mathematicallyVerified,true);
 assert.equal(output.typedMathEvidence.branchCount,2);
 assert.equal(output.typedMathEvidence.globallyUnique,null);
 assert.equal(output.steps.at(-1).actions[0].kind,'arc');
});
test('new finite segment-circle vector input yields mathematical contacts and real V5',()=>{
 const output=runConfirmedSvgFillet(mixed());
 assert.equal(output.status,'ready');assert.equal(output.steps.length,5);
 assert.equal(output.typedMathEvidence.finishedArcVerified,true);
 assert.equal(output.typedMathEvidence.g1Verified,true);
});
test('radius edit causes a new revision and re-solves geometry; old output stays unchanged',()=>{
 const a=twoSegments(), first=runConfirmedSvgFillet(a);
 const d=reviewCandidate(a.draft,{id:'segment-1',expectedRevision:a.draft.revision,decision:'confirmed'});
 const change={...a,draft:d,expectedRevision:d.revision,calibration:calibration(d),filletRadiusMm:4};
 const fresh=runConfirmedSvgFillet(change);
 assert.equal(fresh.status,'ready');assert.equal(fresh.revision,d.revision);
 assert.deepEqual(fresh.typedMathEvidence.center,{x:-4,y:4});
 assert.equal(first.revision,a.draft.revision);
 assert.deepEqual(first.typedMathEvidence.center,{x:-3,y:3});
 assert.throws(()=>runConfirmedSvgFillet({...change,expectedRevision:a.draft.revision}),/stale/);
 assert.throws(()=>runConfirmedSvgFillet({...change,calibration:a.calibration}),/calibration/);
});
test('unconfirmed candidates and unresolved R label cannot enter verified solve',()=>{
 const src=extractSvgCandidates(lines()).draft;
 assert.throws(()=>runConfirmedSvgFillet({...twoSegments(),draft:src,expectedRevision:0,
  calibration:calibration(src)}),/unconfirmed/);
 const d=reviewAllGeometry(make('<line x1="30" y1="40" x2="50" y2="40"/>'+
   '<line x1="40" y1="30" x2="40" y2="50"/><text x="45" y="25">R3</text>'));
 assert.throws(()=>prepareConfirmedFillet({...twoSegments(),draft:d,expectedRevision:d.revision,
  calibration:calibration(d)}),/unconfirmed/);
});
test('missing scale review, invalid pixels-as-mm and nonuniform transform fail closed',()=>{
 const a=twoSegments();
 assert.throws(()=>runConfirmedSvgFillet({...a,calibration:{...a.calibration,reviewedBy:'detector'}}),/human-confirmed/);
 assert.throws(()=>runConfirmedSvgFillet({...a,calibration:{...a.calibration,mmPerPx:0}}),/metric scale/);
 assert.throws(()=>runConfirmedSvgFillet({...a,calibration:{...a.calibration,shear:0.2}}),/unsupported field/);
 assert.throws(()=>runConfirmedSvgFillet({...a,calibration:{...a.calibration,revision:a.expectedRevision+1}}),/calibration/);
 assert.throws(()=>runConfirmedSvgFillet({...a,filletRadiusMm:NaN}),/fillet radius/);
});
test('dimension R/Φ binding is verified against calibration instead of silently guessed',()=>{
 let d=make('<line x1="25" y1="40" x2="55" y2="40"/>'+
   '<circle cx="40" cy="45" r="8"/><text x="40" y="10">Φ16</text>');
 d=reviewAllGeometry(d);
 const label=d.candidates.find(c=>c.kind==='dimension');
 d=reviewCandidate(d,{id:label.id,expectedRevision:d.revision,decision:'confirmed',
   patch:{dimension:{...label.dimension,unit:'mm',refs:['circle-2']}}});
 const input={...mixed(),draft:d,expectedRevision:d.revision,calibration:calibration(d)};
 const result=runConfirmedSvgFillet(input);
 assert.equal(result.status,'ready');
 assert.equal(result.imageProvenance.dimensionResiduals.length,1);
 assert.equal(result.imageProvenance.dimensionResiduals[0].residualMm,0);
 const changed={...input,calibration:{...input.calibration,mmPerPx:1.3}};
 assert.throws(()=>runConfirmedSvgFillet(changed),/dimension conflicts/);
});
test('unrelated user-accepted measurement and unsupported angle cannot be silently ignored',()=>{
 let d=make('<line x1="30" y1="40" x2="50" y2="40"/>'+
  '<line x1="40" y1="30" x2="40" y2="50"/><text x="44" y="20">90°</text>');
 d=reviewAllGeometry(d);
 const label=d.candidates.find(c=>c.dimension);
 d=reviewCandidate(d,{id:label.id,expectedRevision:d.revision,decision:'confirmed',
  patch:{dimension:{...label.dimension,refs:['segment-1']}}});
 const input={...twoSegments(),draft:d,expectedRevision:d.revision,calibration:calibration(d)};
 assert.throws(()=>runConfirmedSvgFillet(input),/every accepted dimension must be mm/);
});
test('source swapping, pixel source duplication and unreviewed target block output',()=>{
 const a=twoSegments();
 assert.throws(()=>runConfirmedSvgFillet({...a,sourceIds:{first:'segment-1',second:'segment-1'}}),/distinct/);
 assert.throws(()=>runConfirmedSvgFillet({...a,sourceIds:{first:'segment-1',second:'unknown'}}),/user-confirmed/);
 assert.throws(()=>runConfirmedSvgFillet({...a,kind:'two-circles'}),/user-confirmed/);
});
test('missing G1 branch/direction and wrong tangent traversal do not emit V5 answer',()=>{
 const a=twoSegments();
 const noBranch=runConfirmedSvgFillet({...a,selection:{}});
 assert.equal(noBranch.status,'requires-branch');
 assert.deepEqual(noBranch.steps,[]);
 assert.equal(noBranch.mathematicallyVerified,false);
 const wrong=runConfirmedSvgFillet({...a,selection:{...a.selection,firstTravel:'reverse'}});
 assert.equal(wrong.status,'blocked');assert.deepEqual(wrong.steps,[]);
});
test('sheet presentation changes do not alter physical center, branches or source provenance',()=>{
 const a=circles(),first=runConfirmedSvgFillet(a);
 const b=runConfirmedSvgFillet({...a,sheet:{origin:{x:100,y:120},scale:12}});
 assert.deepEqual(first.typedMathEvidence,b.typedMathEvidence);
 assert.deepEqual(first.imageProvenance,b.imageProvenance);
 assert.notDeepEqual(first.steps.at(-1).actions[0].geometry,b.steps.at(-1).actions[0].geometry);
});
