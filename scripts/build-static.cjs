// Copy only public site assets into dist; never publish source, workflow or docs.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const files = ['index.html','site-ui.css','favicon.svg','robots.txt','labs/constraints.html','labs/analysis.html','labs/constraint-engine.js','labs/dof-lab-geometry.js','labs/dof-lab-visibility.js','labs/dof-lab-sheet.js','labs/dof-lab-state.js','labs/dof-lab-spatial-svg.js','labs/dof-lab-v2-ui.js','labs/dof-lab-v2.html','labs/constraint-explorer.js','labs/teaching-steps.js','labs/chapter-26-29.html','labs/chapter-drawing.html','labs/chapter-drawing.js','labs/source-inspector.js','labs/source-inspector-ui.js','labs/exercise-261-evidence.js','labs/exercise-261-ui.js','labs/source-fidelity.html','labs/source-fidelity-audit.js','labs/source-fidelity-ui.js','labs/point-construction.html','labs/point-construction-core.js','labs/point-construction-ui.js','labs/tangent-constraint.html','labs/tangent-constraint-core.js','labs/tangent-constraint-ui.js','labs/paper-geometry.html','labs/paper-geometry-core.js','labs/paper-geometry-ui.js','labs/composite-geometry.html','labs/composite-geometry-core.js','labs/composite-geometry-ui.js','labs/chapter-dof.js','labs/verified-exercises.js','labs/method-library.js','knowledge/index.html','knowledge/knowledge-ui.css','knowledge/knowledge-data.js','knowledge/lesson-depth.js','knowledge/textbook-examples.js','knowledge/textbook-example-geometry.js','knowledge/textbook-example-ui.js','knowledge/drawing-player.html','knowledge/problem-schema.js','knowledge/drawing-action-renderer.js','knowledge/textbook-action-adapter.js','knowledge/planar-point-constraints.js','knowledge/planar-intersections.js','knowledge/constraint-analysis.js','knowledge/nonlinear-local-dof.js','knowledge/nonlinear-step-trace.js','knowledge/player-dof-summary.js','knowledge/drawing-player-ui.js','knowledge/knowledge-app.js','knowledge/visual-model.js','knowledge/projection-labels.js','knowledge/projection-constraint-lessons.js','knowledge/lesson-stage-mapping.js','knowledge/visual-ui.js','knowledge/research-core.js','knowledge/research-ui.js','knowledge/solution-gate.js','labs/verified-solutions.js'];
fs.rmSync(out, { recursive: true, force: true });
for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error('Missing site asset: ' + file);
  const dest = path.join(out, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
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

console.log('Textbook-only public site ready:',files.length,'assets');
