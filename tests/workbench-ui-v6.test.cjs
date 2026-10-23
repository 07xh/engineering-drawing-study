// DraftAI V6 UI-only regression checks. Run: node tests/workbench-ui-v6.test.cjs
// No third-party dependencies; does not change or simulate geometry.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = [
  'index.html',
  'labs/auto-fillet-live.html',
  'labs/cone-cut-live.html',
  'labs/circle-fillet-live.html',
  'labs/point-projection-live.html',
  'labs/polygon-live.html',
];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const ids = html => Array.from(html.matchAll(/\bid="([^"]+)"/g), x => x[1]);
const requireOneId = (html, name) => assert.equal(
  ids(html).filter(x => x === name).length, 1,
  'missing or duplicated id: ' + name,
);
const tags = ['div','section','details','aside','nav'];
for (const page of pages) {
  const html = read(page);
  assert.match(html, /class="[^"]*workbench-blue[^"]*"/, page + ' must opt into blue UI');
  assert.match(html, /href="(?:\.\.\/)?workbench-blue\.css"/, page + ' must load shared CSS');
  assert.equal(new Set(ids(html)).size, ids(html).length, page + ' has duplicated IDs');
  for (const tag of tags) {
    const opens = (html.match(new RegExp('<' + tag + '(?=[ >])', 'g')) || []).length;
    const closes = (html.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    assert.equal(opens, closes, page + ' ' + tag + ' tags unbalanced');
  }
}
const home = read('index.html');
assert.match(home, /id="ai"/, 'keep existing deep links');
assert.match(home, /图片自动识别仍在开发中/, 'do not promise unavailable AI upload');
const fillet = read('labs/auto-fillet-live.html');
for (const id of ['kind','fields','photoPreview','rasterDraftPanel','localVectorPanel','paper','prev','play','next','progress','stepList']) requireOneId(fillet,id);
assert.match(fillet, /class="draftai-playdock"/);
assert.match(fillet, /class="workbench-step-rail"/);
const cone = read('labs/cone-cut-live.html');
for (const id of ['coneSvg','cone3dSvg','coneBack','conePlay','coneForward','coneSeek','coneSteps','coneSpatialDrawer']) requireOneId(cone,id);
const coneSheet = cone.split('id="coneSvg"')[1].split('</svg>')[0];
for (const label of ['V 主视','H 俯视','W 侧视']) assert.ok(coneSheet.includes(label), 'one SVG paper must contain ' + label);
assert.match(cone, /class="workbench-step-rail"/);
assert.match(cone, /<details[^>]+id="coneSpatialDrawer"/, 'keep 3D as optional linked view');
const circle = read('labs/circle-fillet-live.html');
for (const id of ['drawingWrap','diagram','fullControls','filletScrubBar','prev','next']) requireOneId(circle,id);
assert.ok(circle.indexOf('id="drawingWrap"') < circle.indexOf('id="fullControls"'), 'controls must follow visible drawing');
const point = read('labs/point-projection-live.html');
for (const id of ['projectionViewport','paperSvg','fullControls','previous','next']) requireOneId(point,id);
assert.ok(point.indexOf('id="projectionViewport"') < point.indexOf('id="fullControls"'), 'play next to projection sheet');
const polygon = read('labs/polygon-live.html');
for (const id of ['polygonSvg','polygonPlay','polygonForward','polygonBack','polygonStepList']) requireOneId(polygon,id);
const css = read('workbench-blue.css');
for (const pattern of [/--wb-blue:#0866ef/, /@media \(max-width:880px\)/, /@media \(min-width:1200px\)/, /\.workbench-step-rail/, /--wb-border:/]) {
 assert.match(css, pattern, 'missing shared theme/layout contract');
}
console.log('DraftAI V6 UI source checks passed: ' + pages.length + ' pages, IDs, one-sheet V/H/W, responsive blue controls.');
