'use strict';
const assert=require('node:assert/strict'),schema=require('../knowledge/problem-schema.js');
const sample={id:'source-example-1',title:'来源核验示例',type:'point-projection',status:'source-verified',source:{book:'待授权教材',page:34},givens:[],steps:[],renderMode:'manual-steps'};
assert(schema.validate(sample).ok);
assert(!schema.validate({...sample,source:{book:'',page:0}}).ok);
assert(!schema.validate({...sample,status:'solution-verified'}).ok);
assert(!schema.validate({...sample,status:'source-pending',renderMode:'geometry-engine'}).ok);
assert(schema.validate({...sample,status:'solution-verified',source:{...sample.source,answerRef:'verified-page'},steps:[{id:'s1',explanation:'经来源核验的步骤',actions:[]}]}).ok);
console.log('PASS: reusable textbook problem contract, source verification and solver safeguards');
