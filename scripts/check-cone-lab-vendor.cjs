'use strict';
// P0 smoke: published Cone Lab must be the original, fully offline editor.
// This checks the integration contract, not computational accuracy or WebGL success.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const preview = process.argv.includes('--ui-preview');
const out = path.join(root, preview ? 'dist-ui-next' : 'dist');
const assets = [
  'labs/cone-lab/index.html',
  'labs/cone-lab/lib/three.min.js',
  'labs/cone-lab/lib/OrbitControls.js',
  'labs/cone-lab/LICENSE.txt',
  'labs/cone-lab/THREE-LICENSE.txt'
];
for (const file of assets) {
  assert.ok(fs.existsSync(path.join(root, file)), 'Missing vendored file: ' + file);
  assert.ok(fs.existsSync(path.join(out, file)), 'Missing published file: ' + file);
  assert.equal(
    fs.readFileSync(path.join(out, file), 'utf8'),
    fs.readFileSync(path.join(root, file), 'utf8'),
    'Build modified upstream content: ' + file
  );
}
const html = fs.readFileSync(path.join(out, assets[0]), 'utf8');
for (const tag of ['lib/three.min.js', 'lib/OrbitControls.js']) {
  assert.ok(html.includes('src="' + tag + '"'), 'Missing offline runtime: ' + tag);
}
for (const symbol of [
  'function partPairCurves(',
  'function splitByConnectivity(',
  'function buildCellVis(',
  'function setView(',
  'function tapPick('
]) assert.ok(html.includes(symbol), 'Missing core Cone Lab behavior: ' + symbol);
assert.ok(!/src=["']https?:\/\//i.test(html), 'Cone Lab must not load remote scripts');
const home = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
assert.ok(home.includes('labs/cone-lab/index.html'), 'Missing compiled homepage entry');
const modeler = fs.readFileSync(path.join(out, 'labs/free-modeler.html'), 'utf8');
assert.ok(modeler.includes('cone-lab/index.html'), 'Missing modeler link');
console.log('PASS Cone Lab isolated/offline/linked vendor integration (' + (preview ? 'preview' : 'public') + ')');
