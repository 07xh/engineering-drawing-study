'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeLocalSystem:N}=
 require('../../core/numeric/dimensionless-jacobian.cjs');
const variable=(id,unit='mm',scale=1)=>({id,unit,scale});
const coefficient=(v=1,unit='mm/mm')=>({unit,value:v});
const constraint=(derivatives)=>({id:'C',unit:'mm',scale:1,
 residual:0,absoluteTolerance:1e-7,derivatives});
test('M0 rejects sparse derivative holes; absence cannot be assumed to mean zero',()=>{
 const derivatives=[coefficient(1),coefficient(2)];
 delete derivatives[1];
 assert.throws(()=>N({variables:[variable('X'),variable('Y')],
  constraints:[constraint(derivatives)]}),/missing derivative/);
 const inherited=[coefficient(1),,];
 Object.setPrototypeOf(inherited,{1:coefficient(2)});
 assert.throws(()=>N({variables:[variable('X'),variable('Y')],
  constraints:[constraint(inherited)]}),/missing derivative/);
});
test('M0 snapshots source variable and derivative getters before normalization',()=>{
 let reads=0,scaleReads=0;
 const v=variable('X');
 Object.defineProperty(v,'scale',{get(){scaleReads++;return scaleReads===1?2:Infinity;}});
 const derivative=coefficient();
 Object.defineProperty(derivative,'value',{
  get(){reads++;return reads===1?5:Infinity;}
 });
 const c=constraint([derivative]);
 const out=N({variables:[v],constraints:[c]});
 assert.deepEqual(out.normalizedJacobian,[[10]]);
 assert.equal(scaleReads,1);assert.equal(reads,1);
 assert.deepEqual(out.variableScales,[{id:'X',unit:'mm',scale:2}]);
 assert.equal(out.globallyUnique,null);assert.equal(out.proofOfExistence,false);
});
test('caller getter mutation after validation cannot inject changed residual or units',()=>{
 let residualReads=0,unitReads=0;
 const c=constraint([coefficient(2)]);
 Object.defineProperty(c,'residual',{get(){residualReads++;return residualReads===1?0:1e9;}});
 Object.defineProperty(c,'unit',{get(){unitReads++;return unitReads===1?'mm':'sheet-px';}});
 const r=N({variables:[variable('X')],constraints:[c]});
 assert.deepEqual(r.normalizedJacobian,[[2]]);
 assert.equal(r.atProvidedConfiguration,true);
 assert.equal(r.residualChecks[0].unit,'mm');
 assert.equal(residualReads,1);assert.equal(unitReads,1);
});
test('valid 2D/3D-sized rows preserve units and local-only rank evidence',()=>{
 const inputs={variables:[variable('X'),variable('Y'),variable('Z')],
  constraints:[
   {...constraint([coefficient(1),coefficient(0),coefficient(0)]),id:'Xfixed'},
   {...constraint([coefficient(0),coefficient(1),coefficient(0)]),id:'Yfixed'},
   {...constraint([coefficient(0),coefficient(0),coefficient(1)]),id:'Zfixed'}
  ]};
 const original=JSON.stringify(inputs);
 const out=N(inputs);
 assert.deepEqual(out.normalizedJacobian,[[1,0,0],[0,1,0],[0,0,1]]);
 assert.equal(out.atProvidedConfiguration,true);
 assert.equal(out.rankEstimate,null);
 assert.equal(out.proofOfGlobalUniqueness,false);
 assert.equal(JSON.stringify(inputs),original);
});
test('sparse variable/constraint arrays are rejected before producing any status',()=>{
 const vars=[variable('X')];delete vars[0];
 const rows=[constraint([coefficient(1)])];delete rows[0];
 assert.throws(()=>N({variables:vars,constraints:[constraint([coefficient(1)])]}));
 assert.throws(()=>N({variables:[variable('X')],constraints:rows}));
});
