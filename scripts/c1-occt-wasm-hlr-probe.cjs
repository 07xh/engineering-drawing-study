'use strict';
/** Executable OCCT WASM HLR availability gate, not a substitute HLR algorithm.
 * Runs in a disposable CI workspace; never affects app dependencies or V5.
 */
(async()=>{
 const pkg=await import('opencascade.js');
 const factory=pkg.default;
 if(typeof factory!=='function')throw Error('opencascade.js default WASM factory missing');
 const oc=await factory();
 const required=['BRepPrimAPI_MakeBox','HLRBRep_Algo','HLRBRep_HLRToShape','HLRAlgo_Projector'];
 const found={};for(const key of required)found[key]=Object.keys(oc).filter(k=>k===key||k.startsWith(key+'_'));
 console.log('OCCT WASM runtime API:',JSON.stringify({required:found}));
 if(Object.values(found).some(keys=>keys.length===0))throw Error('HLR API absent in selected OCCT WASM distribution; custom build required');
 console.log('HLR API availability verified; no shape projected yet; not a V5 proof');
})().catch(e=>{console.error(e);process.exitCode=1;});
