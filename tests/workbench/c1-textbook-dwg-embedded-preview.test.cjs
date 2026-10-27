'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const toolDir=path.resolve(__dirname,'../../tools');
function run(script){
 return spawnSync('python3',['-c',script,toolDir],{
  encoding:'utf8',timeout:20000
 });
}
test('actual AC1018 preview layout converts a bounded DIB to a valid standalone PNG',()=>{
 const src=[
  'import sys,struct,zlib,json',
  'sys.path.insert(0,sys.argv[1])',
  'from c1_textbook_dwg_preview import r2004_preview_dib,convert_dib_to_png,SENTINEL',
  'payload=bytearray(1024)',
  'payload[:6]=b"AC1018"',
  'struct.pack_into("<I",payload,13,448)',
  'payload[448:464]=SENTINEL',
  'struct.pack_into("<I",payload,464,100)',
  'payload[468]=1;payload[469]=2',
  'struct.pack_into("<II",payload,470,567,56)',
  'dib=struct.pack("<IiiHHIIiiII",40,2,2,1,8,0,8,0,0,2,0)',
  'dib+=bytes([0,0,0,0,255,255,255,0,0,1,0,0,1,0,0,0])',
  'payload[567:567+len(dib)]=dib',
  'raw,meta=r2004_preview_dib(bytes(payload))',
  'png,dimensions=convert_dib_to_png(raw)',
  'assert dimensions=={"width":2,"height":2,"bitsPerPixel":8}',
  'assert png.startswith(bytes.fromhex("89504e470d0a1a0a"))',
  'assert meta["notVectorEntities"] is True',
  'print(json.dumps({"bytes":len(png),"dimensions":dimensions}))'
 ].join('\n');
 const r=run(src);
 assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);
 assert.deepEqual(out.dimensions,{width:2,height:2,bitsPerPixel:8});
 assert(out.bytes>60);
});
test('corrupt preview pointer, malformed dimensions and unsupported compression fail',()=>{
 const src=[
  'import sys,struct',
  'sys.path.insert(0,sys.argv[1])',
  'from c1_textbook_dwg_preview import r2004_preview_dib,convert_dib_to_png',
  'try:r2004_preview_dib(b"AC1018"+bytes(128))',
  'except ValueError:pass',
  'else:raise AssertionError("preview pointer forged")',
  'dib=struct.pack("<IiiHHIIiiII",40,10000,2,1,8,0,8,0,0,2,0)',
  'try:convert_dib_to_png(dib)',
  'except ValueError:pass',
  'else:raise AssertionError("oversized width accepted")',
  'dib=struct.pack("<IiiHHIIiiII",40,2,2,1,8,1,8,0,0,2,0)',
  'try:convert_dib_to_png(dib)',
  'except ValueError:pass',
  'else:raise AssertionError("compressed preview treated as original")',
  'print("fail-closed-preview-passed")'
 ].join('\n');
 const r=run(src);
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/fail-closed-preview-passed/);
});
