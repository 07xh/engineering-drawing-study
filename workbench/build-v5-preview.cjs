'use strict';
/**
 * Build only the isolated local V5 preview page. Never writes dist, deploys,
 * modifies package.json, or copies textbook/private/synthetic fixtures.
 * Run: node workbench/build-v5-preview.cjs
 */
const path=require('node:path');
const fs=require('node:fs');
const esbuild=require('esbuild');
const root=__dirname;
const outfile=path.join(root,'v5-preview-bundle.js');
esbuild.buildSync({
 entryPoints:[path.join(root,'v5-preview-entry.cjs')],
 outfile,bundle:true,platform:'browser',format:'iife',target:['es2020'],
 minify:false,sourcemap:false,legalComments:'none'
});
if(!fs.existsSync(outfile)||fs.statSync(outfile).size===0)
 throw new Error('V5 preview bundle not produced');
console.log('V5 local preview ready: workbench/v5-preview.html');
