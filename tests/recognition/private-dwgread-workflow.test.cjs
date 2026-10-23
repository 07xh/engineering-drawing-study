'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {convertPrivateDwg}=
 require('../../scripts/convert-private-dwg-for-review.cjs');
const pair=(a,b)=>String(a)+'\n'+String(b)+'\n';
const dxf=pair(0,'SECTION')+pair(2,'HEADER')+pair(9,'$INSUNITS')+
 pair(70,4)+pair(0,'ENDSEC')+pair(0,'SECTION')+pair(2,'ENTITIES')+
 pair(0,'LINE')+pair(5,'AB')+pair(8,'model')+pair(10,1)+pair(20,2)+
 pair(11,10)+pair(21,20)+pair(0,'ENDSEC')+pair(0,'EOF');
function fixture(root,code){
 const dwg=path.join(root,'图3-12 私人斜截;source.dwg');
 const bin=path.join(root,'dwgread');
 const b=Buffer.alloc(1200);
 b.write('AC1018',0,'ascii');
 b.writeUInt32LE(448,13);b[468]=1;b[469]=2;
 b.writeUInt32LE(600,470);b.writeUInt32LE(60,474);
 b.writeUInt32LE(40,600);b.writeInt32LE(184,604);
 b.writeInt32LE(95,608);b.writeUInt16LE(1,612);b.writeUInt16LE(8,614);
 fs.writeFileSync(dwg,b);
 fs.writeFileSync(bin,'#!/usr/bin/env node\n'+code,{mode:0o700});
 fs.chmodSync(bin,0o700);
 return {dwg,bin};
}
function inTemp(fn){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-dwgread-test-'));
 try{return fn(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('08 native offline trusted tool emits candidate-only review without leaking CAD path or proving answer',()=>inTemp(root=>{
 const js="const fs=require('node:fs'); const a=process.argv.slice(2);"+
  "if(a[0]!=='--format'||a[1]!=='DXF'||a[2]!=='--file') process.exit(9);"+
  "fs.writeFileSync(a[3],"+JSON.stringify(dxf)+");";
 const {dwg,bin}=fixture(root,js);
 const r=convertPrivateDwg({dwgPath:dwg,dwgreadPath:bin});
 assert.equal(r.source.converterExecutedOffline,true);
 assert.equal(r.source.dwgPreflightStatus,'thumbnail-only');
 assert.equal(r.source.independentDwgToDxfEntityEquivalenceVerified,false);
 assert.equal(r.audit.entityCount,1);
 assert.equal(r.entities[0].geometry.from.x,1);
 assert.equal(r.entities[0].geometry.to.y,20);
 assert.equal(r.entities[0].reviewStatus,'unconfirmed');
 assert.equal(r.audit.trustedConverterOutputRequiresEntityReview,true);
 assert.equal(r.audit.readyForM3,false);
 assert.equal(r.audit.readyForV5,false);
 assert.equal(r.audit.independentTextbookResultComparison,false);
 assert.equal(JSON.stringify(r).includes(root),false);
 assert.equal(JSON.stringify(r).includes('私人斜截'),false);
}));
test('09 process failures and unknown executable cannot export untrusted CAD conditions',()=>inTemp(root=>{
 const {dwg,bin}=fixture(root,'process.exit(7);');
 assert.throws(()=>convertPrivateDwg({dwgPath:dwg,dwgreadPath:bin}),/converter failed/);
 assert.throws(()=>convertPrivateDwg({dwgPath:'relative.dwg',dwgreadPath:bin}),/absolute/);
 assert.throws(()=>convertPrivateDwg({dwgPath:dwg,dwgreadPath:'dwgread'}),/absolute/);
 const other=path.join(root,'arbitrary');
 fs.copyFileSync(bin,other);
 assert.throws(()=>convertPrivateDwg({dwgPath:dwg,dwgreadPath:other}),/only an independently/);
}));
