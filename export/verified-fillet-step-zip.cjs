'use strict';
/**
 * Offline ZIP (stored entries, no dependencies) for the existing verified
 * SVG construction-step exporter. Inputs are always recomputed through the
 * mathematical proof gate: no caller-supplied SVG files or answer fixtures.
 */
const {exportVerifiedFilletStepSheets} = require('./verified-fillet-step-sheets.cjs');
const encoder = new TextEncoder();
const MAX_FILE_BYTES = 512_000;
const MAX_TOTAL_BYTES = 10_000_000;
const UTF8_FLAG = 0x800;
const DOS_DATE = 0x21; // 1980-01-01, timestamp-free deterministic output
const finiteInt = x => Number.isSafeInteger(x) && x >= 0;
function crc32(bytes){
  let crc=0xffffffff;
  for(const b of bytes){
    crc^=b;
    for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function header(length,signature){
  const bytes=new Uint8Array(length);
  new DataView(bytes.buffer).setUint32(0,signature,true);
  return {bytes,view:new DataView(bytes.buffer)};
}
const u16=(view,offset,value)=>view.setUint16(offset,value,true);
const u32=(view,offset,value)=>view.setUint32(offset,value,true);
function join(chunks,length){
  const out=new Uint8Array(length);let p=0;
  for(const chunk of chunks){out.set(chunk,p);p+=chunk.length;}
  if(p!==length)throw new RangeError('ZIP byte accounting mismatch');
  return out;
}
function makeStoredZip(sheets){
  if(!Array.isArray(sheets)||sheets.length<2||sheets.length>65)
    throw new RangeError('verified step-sheet count must be in 2..65');
  const local=[],central=[];let localBytes=0,centralBytes=0,uncompressedBytes=0;
  const names=[];
  for(const page of sheets){
    if(typeof page.svg!=='string'||!finiteInt(page.completedSteps))
      throw new TypeError('verified numbered SVG step sheet required');
    const filename='draftai-step-'+String(page.completedSteps).padStart(2,'0')+'.svg';
    const name=encoder.encode(filename),body=encoder.encode(page.svg);
    if(body.length===0||body.length>MAX_FILE_BYTES)
      throw new RangeError('individual SVG step exceeds safe archive limit');
    uncompressedBytes+=body.length;
    if(uncompressedBytes>MAX_TOTAL_BYTES)throw new RangeError('SVG archive exceeds safe size');
    const checksum=crc32(body);
    const localHeader=header(30,0x04034b50),l=localHeader.view;
    u16(l,4,20);u16(l,6,UTF8_FLAG);u16(l,8,0);
    u16(l,10,0);u16(l,12,DOS_DATE);u32(l,14,checksum);
    u32(l,18,body.length);u32(l,22,body.length);
    u16(l,26,name.length);u16(l,28,0);
    local.push(localHeader.bytes,name,body);
    const directory=header(46,0x02014b50),d=directory.view;
    u16(d,4,20);u16(d,6,20);u16(d,8,UTF8_FLAG);u16(d,10,0);
    u16(d,12,0);u16(d,14,DOS_DATE);u32(d,16,checksum);
    u32(d,20,body.length);u32(d,24,body.length);
    u16(d,28,name.length);u16(d,30,0);u16(d,32,0);
    u16(d,34,0);u16(d,36,0);u32(d,38,0);u32(d,42,localBytes);
    central.push(directory.bytes,name);names.push(filename);
    localBytes+=30+name.length+body.length;
    centralBytes+=46+name.length;
  }
  const end=header(22,0x06054b50),v=end.view;
  u16(v,4,0);u16(v,6,0);
  u16(v,8,sheets.length);u16(v,10,sheets.length);
  u32(v,12,centralBytes);u32(v,16,localBytes);u16(v,20,0);
  const byteLength=localBytes+centralBytes+22;
  if(byteLength>MAX_TOTAL_BYTES+100_000)
    throw new RangeError('ZIP overhead exceeds safe limit');
  return {bytes:join([...local,...central,end.bytes],byteLength),names,
    uncompressedBytes};
}
function exportVerifiedFilletStepZip(input,options={}){
  const pages=exportVerifiedFilletStepSheets(input,options);
  const archive=makeStoredZip(pages.sheets);
  return {bytes:archive.bytes,filenames:archive.names,
    fileCount:pages.sheets.length,revision:pages.revision,
    selectedBranchId:pages.selectedBranchId,
    globallyUnique:pages.globallyUnique,
    uncompressedBytes:archive.uncompressedBytes};
}
module.exports={exportVerifiedFilletStepZip};
