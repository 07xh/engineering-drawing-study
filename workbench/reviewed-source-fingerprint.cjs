'use strict';
// Deterministic, synchronous browser-compatible change detector.
// Not a cryptographic signature and never an authorization proof.
function fingerprint(str){
 if(typeof str!=='string')throw new TypeError('string required');
 let h=2166136261;
 for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
 return (h>>>0).toString(16).padStart(8,'0');
}
module.exports={fingerprint};
