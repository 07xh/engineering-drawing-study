'use strict';
/** Probe actual OCCT WASM package layout and exports without granting V5 proof.
 * Avoid importing the package root: upstream main may point at raw .wasm.
 */
(async()=>{
 const fs=require('node:fs');
 const path=require('node:path');
 const root=path.dirname(require.resolve('opencascade.js/package.json'));
 const pkg=require(path.join(root,'package.json'));
 const entries=fs.readdirSync(path.join(root,'dist')).filter(x=>x.endsWith('.js')||x.endsWith('.mjs')||x.endsWith('.wasm'));
 console.log('OCCT package layout:',JSON.stringify({version:pkg.version,main:pkg.main,entries}));
 const js=entries.filter(x=>x.endsWith('.js')||x.endsWith('.mjs'));
 if(!js.length)throw Error('Upstream package has no executable JavaScript glue; raw WASM cannot be imported as an ES module');
 const entry=js.includes('node.js')?'node.js':js[0];
 console.log('OCCT JS glue entry:',entry);
 const {pathToFileURL}=require('node:url');
 const module=await import(pathToFileURL(path.join(root,'dist',entry)).href);
 const factory=module.default;
 if(typeof factory!=='function')throw Error('OCCT JavaScript glue does not export a default WASM factory');
 const oc=await factory();
 const required=['BRepPrimAPI_MakeBox','HLRBRep_Algo','HLRBRep_HLRToShape','HLRAlgo_Projector'];
 const found={};for(const key of required)found[key]=Object.keys(oc).filter(k=>k===key||k.startsWith(key+'_'));
 console.log('OCCT WASM runtime API:',JSON.stringify({required:found}));
 if(Object.values(found).some(keys=>keys.length===0))throw Error('HLR API absent in selected OCCT WASM distribution; custom build required');
 console.log('HLR API availability verified; no shape projected yet; not a V5 proof');
})().catch(e=>{console.error(e);process.exitCode=1;});
