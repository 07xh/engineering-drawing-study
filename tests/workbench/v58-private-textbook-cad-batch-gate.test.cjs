'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {auditPrivateCadBatch,cli}=
 require('../../scripts/audit-private-cad-batch.cjs');
const pair=(code,value)=>code+'\n'+value+'\n';
const mockDwg=()=>{
 const b=Buffer.alloc(1200);b.write('AC1018',0,'ascii');
 b.writeUInt32LE(448,13);b[468]=1;b[469]=2;
 b.writeUInt32LE(600,470);b.writeUInt32LE(60,474);
 b.writeUInt32LE(40,600);b.writeInt32LE(184,604);b.writeInt32LE(95,608);
 b.writeUInt16LE(1,612);b.writeUInt16LE(8,614);return b;
};
const mockDxf=()=>Buffer.from(
 pair(0,'SECTION')+pair(2,'HEADER')+pair(9,'$INSUNITS')+
 pair(70,4)+pair(0,'ENDSEC')+pair(0,'SECTION')+
 pair(2,'ENTITIES')+pair(0,'LINE')+pair(8,'source')+
 pair(10,1)+pair(20,2)+pair(11,10)+pair(21,20)+
 pair(0,'ENDSEC')+pair(0,'EOF'));
const tmp=fn=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-three-private-'));
 try{return fn(root);}finally{fs.rmSync(root,{recursive:true,force:true});}
};
test('09 three actual-looking original DWG sources preflight independently without manufacturing math givens',()=>tmp(root=>{
 const items=[];
 for(let i=0;i<3;i++){
  const dwgPath=path.join(root,'private-original-'+i+'.dwg');
  fs.writeFileSync(dwgPath,mockDwg());
  items.push({dwgPath});
 }
 const dir=path.join(root,'audit-3');
 const m=auditPrivateCadBatch({items,outDir:dir});
 assert.equal(m.count,3);
 assert.equal(m.status,'input-evidence-only');
 assert.equal(m.sourceGeometryEntirelyDecoded,false);
 assert.equal(m.answerIsolationVerified,false);
 assert.equal(m.anyTextbookWholeProblemVerified,false);
 assert.equal(m.items.every(x=>x.stage==='source-only'),true);
 assert.ok(m.items.every(x=>!x.M3Verified&&!x.singleV5Verified));
 assert.equal(fs.readdirSync(dir).length,4);
 for(let i=1;i<=3;i++){
  const p=path.join(dir,'source-'+String(i).padStart(3,'0')+'.json');
  const payload=JSON.parse(fs.readFileSync(p,'utf8'));
  assert.equal(payload.evidence.status,'thumbnail-only');
  assert.equal(payload.evidence.embeddedPreview.width,184);
  assert.equal(payload.gates.dwgSourceVerified,true);
  assert.equal(payload.gates.knownAndReferenceIsolated,false);
  assert.equal(payload.gates.allStagesComplete,false);
  if(process.platform!=='win32')assert.equal(fs.statSync(p).mode&0o077,0);
 }
 if(process.platform!=='win32')
  assert.equal(fs.statSync(dir).mode&0o077,0);
}));
test('08 user-supplied local DXF preview preserves actual candidates but blocks textbook solver admission',()=>tmp(root=>{
 const dwg=path.join(root,'real-source.dwg'),dxf=path.join(root,'private-export.dxf');
 fs.writeFileSync(dwg,mockDwg());
 fs.writeFileSync(dxf,mockDxf());
 const m=cli(['--dwg',dwg,'--dxf',dxf,'--out',path.join(root,'audit')]);
 assert.equal(m.count,1);
 assert.equal(m.items[0].stage,'cad-candidates-require-review');
 assert.equal(m.items[0].CADCount,1);
 assert.equal(m.items[0].unsupportedCADCount,0);
 assert.equal(m.items[0].independentTextbookResultVerified,false);
 const r=JSON.parse(fs.readFileSync(path.join(root,'audit','source-001.json')));
 assert.equal(r.evidence.entities[0].geometry.from.x,1);
 assert.equal(r.evidence.entities[0].reviewStatus,'unconfirmed');
 assert.equal(r.gates.dimensionsAndUnitsApproved,false);
 assert.equal(r.gates.M3SolverVerified,false);
 assert.equal(r.gates.singleV5PlaybackVerified,false);
 assert.equal(r.evidence.audit.readyForM3,false);
}));
test('09 duplicate source, unsafe output and conflicting conversion methods fail closed',()=>tmp(root=>{
 const src=path.join(root,'original.dwg'),dxf=path.join(root,'export.dxf');
 fs.writeFileSync(src,mockDwg());fs.writeFileSync(dxf,mockDxf());
 assert.throws(()=>cli(['--dwg',src]),/output/);
 assert.throws(()=>cli(['--dwg',src,'--out','relative']),/absolute/);
 assert.throws(()=>cli(['--dwg',src,'--dwg',src,'--out',path.join(root,'dup')]),/duplicated/);
 assert.equal(fs.existsSync(path.join(root,'dup')),false);
 assert.throws(()=>cli(['--dwg',src,'--out',path.join(root,'bad'),'--dxf',dxf,
   '--dwgread','/opt/bin/dwgread']),/choose private exported DXF/);
 assert.equal(fs.existsSync(path.join(root,'bad')),false);
 assert.throws(()=>cli(['--dwg',src,'--out',path.join(root,'conflict'),'--out','/x']),/repeat/);
 const taken=path.join(root,'exists');fs.mkdirSync(taken);
 assert.throws(()=>cli(['--dwg',src,'--out',taken]),/must not already exist/);
}));
