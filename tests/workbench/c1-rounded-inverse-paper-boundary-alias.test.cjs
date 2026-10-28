'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1RoundedInversePaperBoundaryAlias:audit}=
 require('../../workbench/c1-rounded-inverse-paper-boundary-alias.cjs');
const p=(u,v=0)=>({u,v});
const run=(from,to,measuredFrom,measuredTo,ts)=>
 audit({sourceFrom:from,sourceTo:to,measuredFrom,measuredTo,
  roundedInverseParameters:ts});

test('positive subnormal interior native paper endpoint is not original t=0 vertex',()=>{
 const tiny=Number.MIN_VALUE;
 assert.equal(tiny/10,0);
 const r=run(p(0),p(10),p(tiny),p(10),[0,1]);
 assert.equal(r.anyRoundedInverseBoundaryAlias,true);
 assert.deepEqual(r.rows[0].exactBinary64PaperDeltaSigns,{u:1,v:0});
 assert.equal(r.rows[0].roundedInverseAliasesDifferentReceivedPaperPoint,true);
 assert.equal(r.generatedHLREdgeToOriginalTopoDSHistoryCertified,false);
 assert.equal(r.signedV5Action,false);
});

test('reversed HLR edge detects rounded t=0 at the opposite native endpoint',()=>{
 const r=run(p(0),p(10),p(10),p(Number.MIN_VALUE),[1,0]);
 assert.equal(r.rows[0].roundedInverseAliasesDifferentReceivedPaperPoint,false);
 assert.equal(r.rows[1].roundedInverseAliasesDifferentReceivedPaperPoint,true);
 assert.equal(r.rows[1].roundedInverseOriginalBoundary,'from');
});

test('a claimed t=1 at the last interior representable paper point is held',()=>{
 const last=9.999999999999998;
 assert.ok(last<10);
 const r=run(p(0),p(10),p(0),p(last),[0,1]);
 assert.equal(r.anyRoundedInverseBoundaryAlias,true);
 assert.deepEqual(r.rows[1].exactBinary64PaperDeltaSigns,{u:-1,v:0});
});

test('exact original endpoints are not aliases and do not grant V5',()=>{
 const r=run(p(0,1),p(10,3),p(0,1),p(10,3),[0,1]);
 assert.equal(r.anyRoundedInverseBoundaryAlias,false);
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.signedV5Action,false);
 assert.ok(Object.isFrozen(r.rows)&&Object.isFrozen(r.rows[0]));
});

test('cross-axis paper drift cannot masquerade as an exact original vertex',()=>{
 const r=run(p(0,0),p(10,10),p(0,Number.MIN_VALUE),p(10,10),[0,1]);
 assert.equal(r.anyRoundedInverseBoundaryAlias,true);
 assert.deepEqual(r.rows[0].exactBinary64PaperDeltaSigns,{u:0,v:1});
 const interior=run(p(0,0),p(10,10),p(2,2),p(8,8),[0.2,0.8]);
 assert.equal(interior.anyRoundedInverseBoundaryAlias,false);
});

test('malformed, nonfinite, collapsed and out-of-domain inverse claims fail closed',()=>{
 assert.throws(()=>run(p(0),p(0),p(0),p(0),[0,1]),/collapsed/);
 assert.throws(()=>run(p(0),p(10),p(NaN),p(10),[0,1]),/finite/);
 assert.throws(()=>run(p(0),p(10),p(0),p(10),[0,1.1]),/bounded/);
 assert.throws(()=>run(p(0),p(10),p(0),p(10),[0]),/bounded/);
});
