'use strict';
/**
 * Private, local-only textbook DWG source preflight.
 * AC1018 header and the embedded DIB thumbnail are independently checked.
 * DOES NOT decode DWG entities, geometry, dimensions, projection, or answer.
 * No source file is copied into git/public dist, no network interaction.
 */
const fs=require('node:fs');
const crypto=require('node:crypto');
const MAX=64*1024*1024;
function preflightTextbookDwg(buf){
 if(!Buffer.isBuffer(buf)||buf.length<64||buf.length>MAX)
  throw new TypeError('bounded raw CAD DWG buffer required');
 const revision=buf.toString('ascii',0,6);
 if(revision!=='AC1018')
  return {status:'unsupported-dwg',format:revision,
   realGeometryVerified:false,wholeProblemVerified:false,
   reason:'only AC1018 embedded preview preflight is implemented'};
 const pointer=buf.readUInt32LE(13);
 if(pointer<32||pointer>buf.length-22)
  throw new RangeError('DWG preview header pointer out of bounds');
 const count=buf[pointer+20];
 if(!Number.isInteger(count)||count<1||count>8||
    pointer+21+count*9>buf.length)
  throw new RangeError('invalid bounded DWG preview record table');
 let bitmap=null;
 for(let i=0;i<count;i++){
  const at=pointer+21+i*9,kind=buf[at];
  const off=buf.readUInt32LE(at+1),size=buf.readUInt32LE(at+5);
  if(off<0||size<1||off>buf.length||size>buf.length-off)
   throw new RangeError('DWG preview section escaped file bounds');
  if(kind===2&&bitmap===null)bitmap={off,size};
 }
 if(!bitmap)
  return {status:'no-preview',format:revision,sourceSha256:
   crypto.createHash('sha256').update(buf).digest('hex'),
   realGeometryVerified:false,wholeProblemVerified:false};
 const {off,size}=bitmap;
 if(size<40||buf.readUInt32LE(off)!==40)
  throw new TypeError('unsupported non-BITMAPINFOHEADER DWG preview');
 const width=buf.readInt32LE(off+4),height=buf.readInt32LE(off+8);
 const planes=buf.readUInt16LE(off+12),bpp=buf.readUInt16LE(off+14);
 if(width<1||height===0||Math.abs(height)>16384||
    width>16384||planes!==1||![1,4,8,16,24,32].includes(bpp))
  throw new RangeError('untrusted DWG DIB dimensions or depth');
 return Object.freeze({
  status:'thumbnail-only',format:revision,
  sourceSha256:crypto.createHash('sha256').update(buf).digest('hex'),
  sourceBytes:buf.length,
  embeddedPreview:{width,height:Math.abs(height),bitsPerPixel:bpp},
  previewCanRevealExactMM:false,
  dwgVectorEntitiesDecoded:false,
  trueDimensionsVerified:false,
  solveResultComparedWithReference:false,
  threeDimensionalSolidCompared:false,
  constructionStepsCompared:false,
  singleV5PlaybackCompared:false,
  realGeometryVerified:false,
  wholeProblemVerified:false,
  nextIndependentEvidence:'trusted DWG vector/annotation extraction + answer-isolated problem conditions'
 });
}
if(require.main===module){
 const input=process.argv[2];
 if(!input)throw new TypeError('usage: node scripts/preflight-textbook-dwg.cjs /private/path.dwg');
 const s=fs.statSync(input);
 if(!s.isFile()||s.size>MAX)throw new TypeError('bounded CAD file required');
 process.stdout.write(JSON.stringify(preflightTextbookDwg(fs.readFileSync(input)),null,2)+'\n');
}
module.exports={preflightTextbookDwg};
