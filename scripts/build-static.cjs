// Copy only public site assets into dist; never publish source, workflow or docs.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const uiPreview = process.argv.includes('--ui-preview');
const uiRelease = !uiPreview;
const out = path.join(root, uiPreview ? 'dist-ui-next' : 'dist');
// Public distribution contains geometry learning tools only. Textbook-related source
// and user-submitted traced exercise data stay out of the published assets.
const files = [
  'index.html',
  'public-use.html',
  'site-ui.css',
  'favicon.svg',
  'robots.txt',
  'labs/point-coach.html',
  'labs/point-projection-live.html',
  'labs/circle-fillet-live.html',
  'labs/auto-fillet-live.html',
  'labs/cylinder-cut-live.html',
  'labs/prism-cut-live.html',
  'labs/recognition-qa.html',
  'labs/point-coach.css',
  'labs/point-coach-core.js',
  'labs/point-coach-ui.js',
  'labs/point-construction.html',
  'labs/point-construction-core.js',
  'labs/point-construction-ui.js',
  'labs/dof-lab-v2.html',
  'labs/dof-lab-v2-ui.js',
  'labs/dof-lab-geometry.js',
  'labs/dof-lab-visibility.js',
  'labs/dof-lab-sheet.js',
  'labs/dof-lab-state.js',
  'labs/dof-lab-spatial-svg.js',
  'labs/free-modeler.html',
  'labs/free-modeler-ui.js',
  'labs/free-geometry-core.js',
  'labs/free-geometry-sheet.js',
  'labs/free-geometry-spatial-svg.js',
  'labs/tangent-constraint.html',
  'labs/tangent-constraint-core.js',
  'labs/tangent-constraint-ui.js',
  'labs/paper-geometry.html',
  'labs/paper-geometry-core.js',
  'labs/paper-geometry-ui.js',
  'labs/composite-geometry.html',
  'labs/composite-geometry-core.js',
  'labs/composite-geometry-ui.js',
  'labs/constraints.html',
  'labs/analysis.html',
  'labs/constraint-engine.js',
  'labs/constraint-explorer.js',
  'labs/teaching-steps.js',
  'labs/method-library.js'
];
fs.rmSync(out, { recursive: true, force: true });
for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error('Missing site asset: ' + file);
  const dest = path.join(out, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
}
// Existing geometry lab pages still contain some legacy links to source-review
// pages. Do not ship those pages: route their links to the public-use disclosure.
const publicFiles=new Set(files);
for(const file of files.filter(name=>name.endsWith('.html'))){
 const dest=path.join(out,file),html=fs.readFileSync(dest,'utf8');
 const adjusted=html.replace(/(\bhref=["'])([^"']+)(["'])/g,(whole,head,href,tail)=>{
  if(/^(?:#|\/\/|https?:|mailto:|tel:|javascript:|data:)/i.test(href))return whole;
  const local=href.split(/[?#]/,1)[0];
  if(!/\.html?$/i.test(local))return whole;
  const normalized=path.posix.normalize(local.startsWith('/')?local.slice(1):path.posix.join(path.posix.dirname(file),local));
  if(publicFiles.has(normalized))return whole;
  const target=path.posix.relative(path.posix.dirname(file),'public-use.html');
  return head+target+tail;
 });
 if(adjusted!==html)fs.writeFileSync(dest,adjusted);
}

const forbidden=["content.js","question-strategies.js","app.js","styles.css","labs/v7.html","labs/line-projection.html","labs/line-projection.js","labs/line-workbench-layout.js","lessons/plane-projection.html"];
for(const file of forbidden){
 if(fs.existsSync(path.join(out,file)))throw new Error('Retired course/quiz asset leaked into public build: '+file);
}

/* Bundle pinned Three.js at build time. The published page never requests a CDN.
 * Only V2 needs WebGL; unsupported devices retain the existing SVG fallback.
 */
const esbuild=require('esbuild');
esbuild.buildSync({
 entryPoints:[path.join(root,'labs/dof-lab-three-entry.js')],
 outfile:path.join(out,'labs/dof-lab-three-bundle.js'),
 platform:'browser',format:'iife',bundle:true,minify:true,
 target:['es2020'],legalComments:'inline',sourcemap:false
});

/* Only the P0 point engine and its verified dependencies are bundled for the
 * public interactive page. The source files, synthetic fixtures, math tests,
 * internal docs and private textbook content remain outside dist.
 */
esbuild.buildSync({
 entryPoints:[path.join(root,'labs/point-projection-live-entry.cjs')],
 outfile:path.join(out,'labs/point-projection-live-bundle.js'),
 platform:'browser',format:'iife',bundle:true,minify:true,
 target:['es2020'],legalComments:'inline',sourcemap:false
});

/* Verified P0 two-circle tangency is bundled into a public standalone tool.
 * Internal source/tests, private textbook records and synthetic fixtures stay out.
 */
esbuild.buildSync({
 entryPoints:[path.join(root,'labs/circle-fillet-live-entry.cjs')],
 outfile:path.join(out,'labs/circle-fillet-live-bundle.js'),
 platform:'browser',format:'iife',bundle:true,minify:true,
 target:['es2020'],legalComments:'inline',sourcemap:false
});

console.log('DraftAI public geometry site ready:',files.length,'assets');

/* V3.1 opt-in public local-only confirmed geometry editor. No upload/OCR or
 * private user files: bundle only explicitly reviewed math/V5 consumers.
 */
esbuild.buildSync({
 entryPoints:[path.join(root,'labs/auto-fillet-live-entry.cjs')],
 outfile:path.join(out,'labs/auto-fillet-live-bundle.js'),
 platform:'browser',format:'iife',bundle:true,minify:true,
 target:['es2020'],legalComments:'inline',sourcemap:false
});


/* Explicit local-only QA view. No uploaded image assets, benchmark fixture
 * sources or private datasets are distributed with this browser bundle.
 * Images stay inside the visitor's device, via object URL and local Canvas.
 */
esbuild.buildSync({
 entryPoints:[path.join(root,'labs/recognition-qa-entry.cjs')],
 outfile:path.join(out,'labs/recognition-qa-bundle.js'),
 platform:'browser',format:'iife',bundle:true,minify:true,
 target:['es2020'],legalComments:'inline',sourcemap:false
});

/* Independent V3.8 cylinder-cut geometry experiment. Bundled entirely
 * client-side; no user image, private textbook or raw math files in dist.
 */
esbuild.buildSync({
 entryPoints:[path.join(root,'labs/cylinder-cut-live-entry.cjs')],
 outfile:path.join(out,'labs/cylinder-cut-live-bundle.js'),
 platform:'browser',format:'iife',bundle:true,minify:true,
 target:['es2020'],legalComments:'inline',sourcemap:false
});


/* Local-only, proof-backed finite rectangular prism section V5 lab.
 * Uncertified line visibility remains visibly undetermined.
 */
esbuild.buildSync({
 entryPoints:[path.join(root,'labs/prism-cut-live-entry.cjs')],
 outfile:path.join(out,'labs/prism-cut-live-bundle.js'),
 platform:'browser',format:'iife',bundle:true,minify:true,
 target:['es2020'],legalComments:'inline',sourcemap:false
});

// Unified UI is production default; preview output remains isolated.
if(uiPreview || uiRelease){
 require('../ui-next/enhance-page.cjs').applyPreview(out, {preview: !uiRelease});
 console.log('DraftAI unified UI ready:', out);
}

// Identity-only asset: whoever can read deployed dist can compare this SHA
// with protected GitHub main. Never confuse an artifact manifest with a
// verified live deployment, and never emit CI environment secrets.
const info=require('./public-build-provenance.cjs').writePublicBuildInfo(out,{
 repoRoot:root,preview:uiPreview
});
console.log('DraftAI public asset commit:',info.sourceCommit||'unavailable');

