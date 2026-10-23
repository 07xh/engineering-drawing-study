'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeLocalSystem:N}=require('../../core/numeric/dimensionless-jacobian.cjs');
const variable=(id,scale=1,unit='mm')=>({id,scale,unit});
const constraint=(id,derivatives,residual=0,rest={})=>({
  id,unit:'mm',scale:10,residual,absoluteTolerance:1e-6,
  derivatives:derivatives.map(value=>({value,unit:'mm/mm'})),...rest
});

test('fixed x and y rows remain independent and dimensionless',()=>{
  const out=N({variables:[variable('x',10),variable('y',10)],constraints:[
    constraint('xIs', [1,0]),constraint('yIs',[0,1])
  ]});
  assert.deepEqual(out.normalizedJacobian,[[1,0],[0,1]]);
  assert.deepEqual(out.normalizedResiduals,[0,0]);
  assert.equal(out.status,'within-declared-tolerances');
  assert.equal(out.globallyUnique,null);
  assert.equal(out.rankEstimate,null);
  assert.equal(out.proofOfExistence,false);
});

test('squared distance Jacobian becomes dimensionless across geometric sizes',()=>{
  // f=|A-B|^2-d^2 [mm2]; df/dAx=2d [mm2/mm].
  for(const distance of [1e-12,1e-9,1e-5,1,1e6,1e12]){
    const out=N({variables:[variable('ax',distance),variable('ay',distance),
      variable('bx',distance),variable('by',distance)],constraints:[{
      id:'length',unit:'mm2',scale:distance*distance,residual:0,
      absoluteTolerance:distance*distance*1e-8,
      derivatives:[2*distance,0,-2*distance,0].map(value=>({value,unit:'mm2/mm'}))
    }]});
    assert.ok(Math.abs(out.normalizedJacobian[0][0]-2)<1e-12,'d='+distance);
    assert.ok(Math.abs(out.normalizedJacobian[0][2]+2)<1e-12,'d='+distance);
    assert.equal(out.atProvidedConfiguration,true);
  }
});

test('declared local residual scale is not the absolute global coordinate origin',()=>{
  const x=N({variables:[variable('x',10)],constraints:[
    constraint('line',[1],10,{scale:10,absoluteTolerance:1e-6})
  ]});
  assert.equal(x.residualChecks[0].status,'outside-tolerance');
  assert.equal(x.atProvidedConfiguration,false);
  assert.equal(x.proofOfGlobalUniqueness,false);
});

test('a violated constraint never becomes a claimed solution',()=>{
  const o=N({variables:[variable('x',1)],constraints:[constraint('x',[1],0.01)]});
  assert.equal(o.status,'residual-outside-tolerance');
  assert.equal(o.solutionCount,null);
  assert.equal(o.globallyUnique,null);
});

test('relative tolerance is local scale weighted',()=>{
  const o=N({variables:[variable('x')],constraints:[constraint('x',[1],0.009,
    {absoluteTolerance:0.001,relativeTolerance:0.001,scale:10})]});
  assert.equal(o.residualChecks[0].allowedDifference,0.011);
  assert.equal(o.residualChecks[0].status,'within-tolerance');
});

test('mixed distance and square distance and angle rows require explicit derivative tags',()=>{
  const o=N({variables:[variable('x'),variable('theta',1,'rad')],constraints:[
    {id:'length2',unit:'mm2',scale:100,residual:0,absoluteTolerance:1e-4,
      derivatives:[{value:20,unit:'mm2/mm'},{value:0,unit:'mm2/rad'}]},
    {id:'orientation',unit:'rad',scale:1,residual:0,absoluteTolerance:1e-6,
      derivatives:[{value:0,unit:'rad/mm'},{value:1,unit:'rad/rad'}]}
  ]});
  assert.deepEqual(o.normalizedJacobian,[[0.2,0],[0,1]]);
  assert.equal(o.constraintScales[0].unit,'mm2');
  assert.equal(o.constraintScales[1].unit,'rad');
});

test('unit mismatch rejects mm2/mm vs mm/mm and mm2/deg vs mm2/rad',()=>{
  for(const wrong of ['mm/mm','mm2/deg','mm2/sheet-px']){
    assert.throws(()=>N({variables:[variable('x')],constraints:[{
      id:'bad',unit:'mm2',scale:1,residual:0,absoluteTolerance:0.001,
      derivatives:[{value:2,unit:wrong}]
    }]}),/unit mismatch/);
  }
});

test('screen px and unscoped units cannot enter model math silently',()=>{
  assert.throws(()=>N({variables:[variable('x',1,'sheet-px')],constraints:[constraint('r',[1])]}));
  assert.throws(()=>N({variables:[variable('x')],constraints:[constraint('r',[1],0,{unit:'pixels'})]}));
});

test('input is not mutated',()=>{
  const input={variables:[variable('x')],constraints:[constraint('r',[1])]};
  const original=JSON.stringify(input);
  const res=N(input);
  res.normalizedJacobian[0][0]=999;
  assert.equal(JSON.stringify(input),original);
});

test('empty, duplicates, unmatched and ragged rows fail closed',()=>{
  const base={variables:[variable('x')],constraints:[constraint('r',[1])]};
  for(const bad of [
    {...base,variables:[]},{...base,constraints:[]},
    {...base,variables:[variable('x'),variable('x')]},
    {...base,constraints:[constraint('r',[1]),constraint('r',[1])]},
    {...base,constraints:[constraint('r',[])]},
    {...base,constraints:[constraint('r',[1,2])]},
  ])assert.throws(()=>N(bad));
});

test('negative/zero/nonfinite scales and tolerance are rejected',()=>{
  for(const scale of [0,-1,NaN,Infinity])
    assert.throws(()=>N({variables:[variable('x',scale)],constraints:[constraint('r',[1])]}));
  for(const abs of [0,-1,NaN,Infinity])
    assert.throws(()=>N({variables:[variable('x')],constraints:[constraint('r',[1],0,{absoluteTolerance:abs})]}));
  for(const scale of [0,-2,NaN,Infinity])
    assert.throws(()=>N({variables:[variable('x')],constraints:[constraint('r',[1],0,{scale})]}));
});

test('nonfinite derivatives and residuals fail closed',()=>{
  for(const bad of [NaN,Infinity,-Infinity]){
    assert.throws(()=>N({variables:[variable('x')],constraints:[constraint('r',[bad])]}));
    assert.throws(()=>N({variables:[variable('x')],constraints:[constraint('r',[1],bad)]}));
  }
});

test('normalization catches overflow and underflow of nonzero derivatives',()=>{
  assert.throws(()=>N({variables:[variable('x',1e300)],constraints:[constraint('r',[1e300],0,{scale:1})]}),/normalization/);
  assert.throws(()=>N({variables:[variable('x',1e-300)],constraints:[constraint('r',[1e-300],0,{scale:1})]}),/normalization/);
});

test('safe multiplication order handles large numerator with large denominator',()=>{
  const o=N({variables:[variable('x',1e200)],constraints:[constraint('r',[1e200],0,{scale:1e200})]});
  assert.ok(Number.isFinite(o.normalizedJacobian[0][0]));
  assert.equal(o.normalizedJacobian[0][0],1e200);
});

test('independent zero derivatives are allowed without fabricated rank',()=>{
  const o=N({variables:[variable('x')],constraints:[constraint('r',[0])]});
  assert.deepEqual(o.normalizedJacobian,[[0]]);
  assert.equal(o.rankEstimate,null);
  assert.equal(o.localDegreesEstimate,null);
});

test('a relativeTolerance cannot be negative or NaN',()=>{
  for(const r of [-0.1,NaN,Infinity])
    assert.throws(()=>N({variables:[variable('x')],constraints:[constraint('r',[1],0,{relativeTolerance:r})]}));
});

test('constraint tolerance addition overflow fails closed',()=>{
  assert.throws(()=>N({variables:[variable('x')],constraints:[constraint('r',[1],0,
    {absoluteTolerance:1e308,relativeTolerance:1e308,scale:1e308})]}));
});

test('no implicit angular conversion between deg and rad',()=>{
  const o=N({variables:[variable('angle',1,'deg')],constraints:[{
    id:'orientation',unit:'deg',scale:360,residual:3,absoluteTolerance:0.5,
    derivatives:[{value:1,unit:'deg/deg'}]
  }]});
  assert.equal(o.constraintScales[0].unit,'deg');
  assert.equal(o.normalizedResiduals[0],3/360);
  assert.equal(o.residualChecks[0].status,'outside-tolerance');
});

test('zero Jacobian and nonzero residual remain visibly unverified',()=>{
  const o=N({variables:[variable('x')],constraints:[constraint('notSolved',[0],2)]});
  assert.deepEqual(o.normalizedJacobian,[[0]]);
  assert.equal(o.status,'residual-outside-tolerance');
  assert.equal(o.proofOfExistence,false);
});

test('one failed condition blocks locally-within-tolerance across all rows',()=>{
  const o=N({variables:[variable('x'),variable('y')],constraints:[
    constraint('x',[1,0],0),constraint('y',[0,1],0.5)]});
  assert.equal(o.residualChecks[0].status,'within-tolerance');
  assert.equal(o.residualChecks[1].status,'outside-tolerance');
  assert.equal(o.atProvidedConfiguration,false);
});
