'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'project/linked-three-scene-entry.js'),'utf8');
const build=fs.readFileSync(path.join(root,'scripts/build-static.cjs'),'utf8');
const home=require('../../ui-next/home.cjs').homeHTML();
const {enhancePage}=require('../../ui-next/enhance-page.cjs');
test('Three.js source visualizer reuses the ONE geometry scene and matching source-feature identities',()=>{
 assert.match(source,/from 'three'/);
 assert.match(source,/OrbitControls\.js/);
 assert.match(source,/new THREE\.Raycaster\(/);
 assert.match(source,/sourceFeatureKey\(obj,extra\)/);
 assert.match(source,/placeLine\(obj,d\.points\[a\],d\.points\[b\],\{edgeIds:\[a,b\]\}\)/);
 assert.match(source,/\{segmentIndex:i\}/);
 assert.match(source,/sourceFeatureKey\(obj,\{\}\)/);
 assert.match(source,/scene\.schema!==SCHEMA/);
 assert.match(source,/certifiedEngineeringStroke:false/);
 assert.match(source,/onPick\(\{/);
 assert.match(source,/!canvas\.getContext\('webgl2'/);
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|https:\/\/cdn\./);
 assert.doesNotMatch(source,/ConstructionIntent|createPlayer\(/);
 assert.match(build,/project\/linked-three-scene-entry\.js/);
 assert.match(build,/project\/linked-three-scene-bundle\.js/);
});
test('production homepage loads local WebGL before main controller with accessible SVG fallback',()=>{
 assert.match(home,/id="v9-three-space"[^>]+hidden/);
 assert.match(home,/id="v7-3d"/);
 const html=enhancePage('<html><head></head><body><main></main></body></html>',
  {page:'index.html',preview:false});
 const webgl=html.indexOf('src="project/linked-three-scene-bundle.js"');
 const unified=html.indexOf('src="project/unified-workbench-bundle.js"');
 assert.ok(webgl>0&&unified>webgl,'defer script order must make bridge available before controller');
 assert.ok(html.includes('id="v9-three-space"'));
 assert.ok(html.includes('id="v7-3d"'));
});
test('WebGL mount is optional; production controller must continue rendering mathematical SVG when unavailable',()=>{
 const controller=fs.readFileSync(path.join(root,'project/unified-workbench-entry.cjs'),'utf8');
 assert.match(controller,/DraftAILinkedThreeViewer\?\.mount/);
 assert.match(controller,/if\(three&&out\.scene\.revision===snap\.revision\)/);
 assert.match(controller,/svg\.hidden=false/);
 assert.match(controller,/drawPrimitives\(svg,result\.spatial,'3D'/);
 assert.match(controller,/sceneSelectionGroup\(out\.scene,/);
 assert.match(controller,/selectedSourceFeature:selectedSourceFeature\?\.key\|\|null/);
 assert.match(controller,/coordinator\.selectSceneGeometry\(objectId\)/);
});
