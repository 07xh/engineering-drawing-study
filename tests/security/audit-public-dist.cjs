'use strict';
/**
 * Static artifact inventory verification for DraftAI.
 * These are the ONLY authorized files in the public dist payload.
 * They must stay synchronized with the audited build-static.cjs allowlist.
 * NOTE: verifying file names does not prove the contents are secret-free.
 */
const fs = require('node:fs');
const path = require('node:path');
const PUBLIC_ASSETS = Object.freeze([
  'index.html', 'public-use.html', 'site-ui.css', 'favicon.svg', 'robots.txt',
  'labs/point-coach.html', 'labs/point-coach.css', 'labs/point-coach-core.js', 'labs/point-coach-ui.js',
  'labs/point-construction.html', 'labs/point-construction-core.js', 'labs/point-construction-ui.js',
  'labs/dof-lab-v2.html', 'labs/dof-lab-v2-ui.js', 'labs/dof-lab-geometry.js',
  'labs/dof-lab-visibility.js', 'labs/dof-lab-sheet.js', 'labs/dof-lab-state.js',
  'labs/dof-lab-spatial-svg.js', 'labs/free-modeler.html', 'labs/free-modeler-ui.js',
  'labs/free-geometry-core.js', 'labs/free-geometry-sheet.js', 'labs/free-geometry-spatial-svg.js',
  'labs/tangent-constraint.html', 'labs/tangent-constraint-core.js', 'labs/tangent-constraint-ui.js',
  'labs/paper-geometry.html', 'labs/paper-geometry-core.js', 'labs/paper-geometry-ui.js',
  'labs/composite-geometry.html', 'labs/composite-geometry-core.js', 'labs/composite-geometry-ui.js',
  'labs/constraints.html', 'labs/analysis.html', 'labs/constraint-engine.js',
  'labs/constraint-explorer.js', 'labs/teaching-steps.js', 'labs/method-library.js',
  'labs/dof-lab-three-bundle.js'
]);
const EXPECTED = new Set(PUBLIC_ASSETS);
if (EXPECTED.size !== PUBLIC_ASSETS.length) throw Error('duplicate public asset entries in security policy');
function auditPublicDist(root) {
  const errors=[], found=[];
  if (typeof root !== 'string' || !root.trim())
    return {ok:false,files:[],errors:['dist root must be a nonempty path']};
  const absolute = path.resolve(root);
  let info;
  try { info = fs.lstatSync(absolute); } catch (error) {
    return {ok:false,files:[],errors:['dist root cannot be read: '+error.code]};
  }
  if (!info.isDirectory() || info.isSymbolicLink())
    return {ok:false,files:[],errors:['dist root must be a real directory']};
  function visit(directory, relative='') {
    for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
      const rel=relative ? relative+'/'+entry.name : entry.name;
      const full=path.join(directory,entry.name);
      if (entry.isSymbolicLink()) { errors.push('symbolic link forbidden: '+rel); continue; }
      if (entry.isDirectory()) { visit(full,rel); continue; }
      if (!entry.isFile()) { errors.push('non-regular file forbidden: '+rel); continue; }
      found.push(rel);
      if (!EXPECTED.has(rel)) errors.push('unexpected public asset: '+rel);
    }
  }
  try { visit(absolute); } catch(error) {
    errors.push('dist traversal failed: '+error.code);
  }
  const present=new Set(found);
  for(const required of PUBLIC_ASSETS) if(!present.has(required))errors.push('missing public asset: '+required);
  found.sort();
  return {ok:errors.length===0,files:found,errors};
}
if (require.main===module) {
  const result=auditPublicDist(process.argv[2]||path.join(__dirname,'../../dist'));
  if(!result.ok) {
    for(const error of result.errors) console.error('BLOCK: '+error);
    process.exitCode=1;
  } else console.log('PASS: public dist contains exactly '+result.files.length+' allowlisted regular assets');
}
module.exports={PUBLIC_ASSETS,auditPublicDist};
