'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const run=args=>cp.spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
function build(args){const p=run(['scripts/build-static.cjs',...args]);assert.equal(p.status,0,p.stderr);}
test('preview output is isolated, application bundles match production and private sources never ship',()=>{
 build([]);const before=fs.readFileSync(path.join(root,'dist/index.html'));
 build(['--ui-preview']);
 assert.deepEqual(fs.readFileSync(path.join(root,'dist/index.html')),before,'preview must not touch production output');
 assert.match(before.toString(),/next-home-hero/);
 assert.doesNotMatch(before.toString(),/新版预览/);
 const html=fs.readFileSync(path.join(root,'dist-ui-next/index.html'),'utf8');
 assert.match(html,/next-home-hero/);assert.match(html,/ui-next\.js/);
 for(const bundle of ['auto-fillet-live','point-projection-live','circle-fillet-live'])
  assert.deepEqual(fs.readFileSync(path.join(root,'dist-ui-next/labs/'+bundle+'-bundle.js')),fs.readFileSync(path.join(root,'dist/labs/'+bundle+'-bundle.js')),'math bundle identical: '+bundle);
 for(const dir of ['dist','dist-ui-next'])for(const banned of ['knowledge','recognition','engines','core','tests','docs','ui-next','labs/local-native-ocr-ui.cjs','labs/local-raster-geometry-review-ui.cjs'])
  assert.equal(fs.existsSync(path.join(root,dir,banned)),false,dir+' private '+banned);
 for(const args of [[],['--ui-preview']]){
  const check=run(['scripts/check-static-site-dependencies.cjs',...args]);assert.equal(check.status,0,check.stderr);
 }
 const asset=path.join(root,'dist-ui-next/ui-next.js'),bytes=fs.readFileSync(asset);
 try{
  fs.unlinkSync(asset);
  const check=run(['scripts/check-static-site-dependencies.cjs','--ui-preview']);
  assert.notEqual(check.status,0,'preview dependency scan must reject a missing preview script');
 }finally{fs.writeFileSync(asset,bytes);}
});

test('release candidate uses production directory and removes preview badge',()=>{
 build(['--ui-release']);
 const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 assert.match(html,/next-home-hero/);
 assert.doesNotMatch(html,/新版预览/);
 assert.equal(run(['scripts/check-static-site-dependencies.cjs']).status,0);
});
