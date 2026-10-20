// Copy only public site assets into dist; never publish source, workflow or docs.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const files = ['index.html','content.js','question-strategies.js','app.js','styles.css','favicon.svg','robots.txt','labs/v7.html','labs/constraints.html','labs/analysis.html','labs/constraint-engine.js','labs/constraint-explorer.js','labs/teaching-steps.js','labs/line-projection.html','labs/line-projection.js','labs/line-workbench-layout.js','labs/chapter-26-29.html','labs/chapter-drawing.html','labs/chapter-drawing.js','labs/chapter-dof.js','labs/verified-exercises.js','labs/method-library.js','knowledge/index.html','knowledge/knowledge-data.js','knowledge/knowledge-app.js','knowledge/visual-model.js','knowledge/visual-ui.js','knowledge/research-core.js','knowledge/research-ui.js','lessons/plane-projection.html'];
fs.rmSync(out, { recursive: true, force: true });
for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error('Missing site asset: ' + file);
  const dest = path.join(out, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
}
console.log('Workers static assets ready:', files.length, 'files in dist/');
