'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {leaderArrowHint:hint}=
 require('../../recognition/arrow-leader-evidence.cjs');
const arrow=(shaftCandidateId,endpoint)=>({
 shaftCandidateId,endpoint,coordinateSpace:'original-image-px',
 arrowheadVerified:false,requiresHumanReview:true,heuristicScore:.72
});
test('single finite leader only matches its geometric far-end shaft tip',()=>{
 const line={hypothesis:'unverified-leader-endpoint-to-bbox-outline',
  leaderCandidateId:'line_1',orientation:'from-text-to-tip'};
 const result=hint(line,[arrow('line_1','to')]);
 assert.ok(result);
 assert.equal(result.shaftCandidateId,'line_1');
 assert.equal(result.endpoint,'to');
 assert.equal(result.arrowheadVerified,false);
 assert.equal(result.dimensionConfirmed,false);
 assert.equal(hint(line,[arrow('line_1','from')]),null);
 assert.equal(hint(line,[arrow('line_2','to')]),null);
});
test('reverse line orientation associates only arrow on from endpoint',()=>{
 const line={hypothesis:'unverified-leader-endpoint-to-bbox-outline',
  leaderCandidateId:'line_4',orientation:'to-text-to-tip'};
 assert.equal(hint(line,[arrow('line_4','to')]),null);
 assert.ok(hint(line,[arrow('line_4','from')]));
});
test('two-stroke leader arrow belongs to second stroke terminal endpoint',()=>{
 const bent={hypothesis:'two-finite-stroke-bent-leader-unverified',
  firstLeaderCandidateId:'line_1',secondLeaderCandidateId:'line_2',
  finalTipEndpoint:'to'};
 assert.equal(hint(bent,[arrow('line_1','to')]),null);
 const r=hint(bent,[arrow('line_2','to')]);
 assert.equal(r.shaftCandidateId,'line_2');
 assert.equal(r.hypothesis,'local-v-wing-pixel-evidence-only');
 assert.equal(r.arrowheadVerified,false);
});
test('unknown, forged or already certified visual proposals fail closed',()=>{
 const line={hypothesis:'unverified-leader-endpoint-to-bbox-outline',
  leaderCandidateId:'line_1',orientation:'from-text-to-tip'};
 for(const invalid of [
  {...arrow('line_1','to'),arrowheadVerified:true},
  {...arrow('line_1','to'),coordinateSpace:'mm'},
  {...arrow('line_1','to'),heuristicScore:Infinity},
  {...arrow('line_1','to'),heuristicScore:-1},
  {...arrow('line_1','to'),requiresHumanReview:false}
 ])assert.equal(hint(line,[invalid]),null);
 assert.equal(hint({...line,orientation:'unknown'},[arrow('line_1','to')]),null);
 assert.equal(hint(line,Array(31).fill(arrow('line_1','to'))),null);
});
test('OCR UI keeps pixel arrow evidence separate from geometry and math proof',()=>{
 const fs=require('node:fs');
 const code=fs.readFileSync('recognition/arrow-leader-evidence.cjs','utf8');
 const ui=fs.readFileSync('labs/local-native-ocr-ui.cjs','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 assert.match(ui,/leaderArrowHint\(x,getArrowHints\(\)\)/);
 assert.match(entry,/getArrowHints:\(\)=>arrowHints/);
 assert.match(entry,/sourceMeta\?\.arrowHints/);
 assert.match(ui,/非箭头证明/);
 assert.doesNotMatch(code,/solveFiniteFillet|session\.replace|globallyUnique/);
});
