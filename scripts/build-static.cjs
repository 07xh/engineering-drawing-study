// Copy only public site assets into dist; never publish source, workflow or docs.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
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
