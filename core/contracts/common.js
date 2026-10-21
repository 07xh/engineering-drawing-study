'use strict';
const SCHEMA_VERSION = '1.0.0';
const finite = n => typeof n === 'number' && Number.isFinite(n);
const object = v => !!v && typeof v === 'object' && !Array.isArray(v);
const identifier = v => typeof v === 'string' && /^[A-Za-z\p{L}][A-Za-z0-9_\p{L}-]{0,79}$/u.test(v) && !['__proto__','constructor','prototype'].includes(v);
function report(errors){ return {ok:errors.length===0,errors}; }
function noDuplicateIds(values){return new Set(values).size===values.length;}
function vec(value,axes){return object(value) && axes.every(k=>finite(value[k]));}
function finiteTree(v){if(typeof v==='number')return finite(v);if(Array.isArray(v))return v.every(finiteTree);if(object(v))return Object.values(v).every(finiteTree);return typeof v==='string'||typeof v==='boolean'||v===null;}
module.exports = {SCHEMA_VERSION,finite,object,identifier,report,noDuplicateIds,vec,finiteTree};
