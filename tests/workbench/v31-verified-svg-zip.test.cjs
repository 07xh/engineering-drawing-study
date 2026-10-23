'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {exportVerifiedFilletStepZip:run}=require('../../export/verified-fillet-step-zip.cjs');
const {exportVerifiedFilletStepSheets}=require('../../export/verified-fillet-step-sheets.cjs');

const p=(x,y)=>({x,y}),seg=(a,b,c,d)=>({a:p(a,b),b:p(c,d)});
const circle=(x,y,radius)=>({center:p(x,y),radius});
const sheet={origin:p(350,220),scale:5};
const fixtures=[
 ()=>({problem:{kind:'two-segments',unit:'mm',revision:4,
    filletRadius:3,geometry:{first:seg(-10,0,10,0),second:seg(0,-10,0,10)}},
   selection:{branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'},sheet}),
 ()=>({problem:{kind:'segment-circle',unit:'mm',revision:7,
   filletRadius:3,geometry:{segment:seg(-15,0,15,0),circle:circle(0,5,8)},options:{side:1}},
   selection:{branchId:'candidate-1',direction:'ccw',lineTravel:'forward',knownCircleTravel:'cw'},sheet}),
 ()=>({problem:{kind:'two-circles',unit:'mm',revision:8,filletRadius:10,
   geometry:{first:circle(0,0,5),second:circle(20,0,5)},
   options:{firstMode:'external',secondMode:'external'}},
   selection:{branchId:'center-1',direction:'cw',
    knownFirstTravel:'ccw',knownSecondTravel:'ccw'},sheet})
];
const decoder=new TextDecoder();
function readZip(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let offset=0;const files=[];
 while(offset+4<=bytes.byteLength&&view.getUint32(offset,true)===0x04034b50){
  assert.equal(view.getUint16(offset+8,true),0,'ZIP must be stored with no compression');
  const crc=view.getUint32(offset+14,true);
  const size=view.getUint32(offset+18,true);
  const namelen=view.getUint16(offset+26,true),extra=view.getUint16(offset+28,true);
  const name=decoder.decode(bytes.slice(offset+30,offset+30+namelen));
  const data=bytes.slice(offset+30+namelen+extra,offset+30+namelen+extra+size);
  assert.equal(data.length,size);
  files.push({name,data,crc});
  offset+=30+namelen+extra+size;
 }
 assert.equal(view.getUint32(offset,true),0x02014b50,'central directory required');
 const end=bytes.length-22;
 assert.equal(view.getUint32(end,true),0x06054b50,'end-of-central-directory required');
 assert.equal(view.getUint16(end+10,true),files.length);
 assert.equal(view.getUint32(end+16,true),offset);
 return files;
}
test('ZIP of three real G1 fillets contains a usable SVG at each verified step',()=>{
 for(const fixture of fixtures){
  const input=fixture(),expectedRevision=input.problem.revision;
  const archive=run(input,{expectedRevision});
  const originals=exportVerifiedFilletStepSheets(input,{expectedRevision});
  const files=readZip(archive.bytes);
  assert.equal(files.length,originals.sheets.length);
  assert.equal(archive.fileCount,originals.totalSteps+1);
  assert.equal(archive.revision,expectedRevision);
  assert.equal(archive.selectedBranchId,input.selection.branchId);
  assert.equal(archive.globallyUnique,null);
  for(const [index,file] of files.entries()){
   assert.equal(file.name,'draftai-step-'+String(index).padStart(2,'0')+'.svg');
   assert.equal(decoder.decode(file.data),originals.sheets[index].svg);
   assert.match(decoder.decode(file.data),/xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  }
  assert.equal(archive.uncompressedBytes,files.reduce((a,f)=>a+f.data.length,0));
 }
});
test('ZIP and filenames are deterministic, no external files or imports',()=>{
 const a=fixtures[0](),before=structuredClone(a),first=run(a,{expectedRevision:4});
 const second=run(structuredClone(a),{expectedRevision:4});
 assert.deepEqual(first.bytes,second.bytes);
 assert.deepEqual(a,before);
 assert.equal(new Set(first.filenames).size,first.filenames.length);
 assert.ok(readZip(first.bytes).every(f=>!/<script|<image|<foreignObject|xlink:href/i
  .test(decoder.decode(f.data))));
});
test('edited geometry creates a different export, old revision does not pass',()=>{
 const old=fixtures[0](),first=run(old,{expectedRevision:4});
 const updated=fixtures[0]();updated.problem.revision=5;updated.problem.filletRadius=4;
 assert.throws(()=>run(updated,{expectedRevision:4}),/current-revision/);
 const next=run(updated,{expectedRevision:5});
 assert.notDeepEqual(first.bytes,next.bytes);
 assert.match(decoder.decode(readZip(next.bytes).at(-1).data),/A 20 20 0 /);
});
test('incomplete or contradictory geometries cannot be zipped',()=>{
 const a=fixtures[0]();delete a.selection.branchId;
 assert.throws(()=>run(a,{expectedRevision:4}),/current-revision/);
 const b=fixtures[0]();b.selection.firstTravel='reverse';
 assert.throws(()=>run(b,{expectedRevision:4}),/current-revision/);
 const c=fixtures[2]();c.problem.geometry.second=circle(100,0,5);
 assert.throws(()=>run(c,{expectedRevision:8}),/current-revision/);
});
test('all process pages in ZIP retain stable viewBox and hold back final arc',()=>{
 const archive=run(fixtures[0](),{expectedRevision:4});
 const files=readZip(archive.bytes);
 const views=files.map(f=>decoder.decode(f.data).match(/viewBox="([^"]+)"/)?.[1]);
 assert.ok(views.every(v=>v===views[0]));
 for(const f of files.slice(0,-1))assert.doesNotMatch(
  decoder.decode(f.data),/<path[^>]+data-layer="result"/);
 assert.match(decoder.decode(files.at(-1).data),/<path d="M [^"]+ A /);
});
test('the ZIP has UTF-8 encoding flags, bounded sizes and honest stored CRC fields',()=>{
 const file=run(fixtures[1](),{expectedRevision:7});
 const bytes=file.bytes,view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 assert.equal(view.getUint16(6,true),0x0800);
 assert.equal(view.getUint32(18,true),view.getUint32(22,true));
 assert.ok(bytes.byteLength<10_100_000);
 assert.ok(readZip(bytes).every(f=>f.crc>0&&f.data.length<512001));
});
test('hiding auxiliary strokes never reintroduces them through ZIP archive',()=>{
 const data=run(fixtures[1](),{expectedRevision:7,includeGuides:false});
 const files=readZip(data.bytes);
 for(const f of files)assert.doesNotMatch(decoder.decode(f.data),/data-layer="guide"/);
 assert.match(decoder.decode(files.at(-1).data),/data-layer="result"/);
});
