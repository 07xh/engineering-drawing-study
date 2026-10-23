'use strict';
/**
 * Offline private export:
 *   node scripts/extract-cad-dxf-review.cjs --dxf /private/export.dxf \
 *     --dwg /private/source.dwg > /private/geometry-review.json
 * Never writes raw textbook data to dist/GitHub/cloud.
 */
const fs=require('node:fs');
const path=require('node:path');
const {extractDxfForReview}=
 require('../recognition/offline-dxf-review.cjs');
const {preflightTextbookDwg}=
 require('./preflight-textbook-dwg.cjs');
const MAX_DWG=64*1024*1024,MAX_DXF=8*1024*1024;
function file(arg,extension,max){
 if(typeof arg!=='string'||path.extname(arg).toLowerCase()!==extension)
  throw new TypeError('explicit local '+extension+' path required');
 const stat=fs.statSync(arg);
 if(!stat.isFile()||stat.size<1||stat.size>max)
  throw new RangeError('invalid bounded '+extension+' local source');
 return fs.readFileSync(arg);
}
function privateCadReview(dxf,sourceDwg=null,options={}){
 const original=sourceDwg===null?null:preflightTextbookDwg(sourceDwg);
 if(original&&original.status!=='thumbnail-only'&&
    original.status!=='no-preview')
  throw new TypeError('DWG association must pass original signature preflight');
 const manifest=extractDxfForReview(dxf,{
  encoding:options.encoding||'auto',
  sourceDwgSha256:original?.sourceSha256||null
 });
 return {...manifest,
  source:{...manifest.source,
   dwgPreflightStatus:original?.status||'not-provided',
   originalDwgConversionProven:false,
   privacyLocation:'only caller-controlled local files'},
  audit:{...manifest.audit,
   exactOriginalDwgGeometryVerified:false,
   exportToDwgEquivalenceVerified:false,
   independentTextbookResultComparison:false}};
}
if(require.main===module){
 const args=process.argv.slice(2),parsed={};
 if(args.length%2!==0)throw new TypeError('expected --dxf file [--dwg file] [--encoding name]');
 for(let i=0;i<args.length;i+=2){
  const key=args[i];
  if(!['--dxf','--dwg','--encoding'].includes(key)||Object.hasOwn(parsed,key))
   throw new TypeError('unexpected/repeated input option '+key);
  parsed[key]=args[i+1];
 }
 const dxf=file(parsed['--dxf'],'.dxf',MAX_DXF);
 const dwg=parsed['--dwg']?file(parsed['--dwg'],'.dwg',MAX_DWG):null;
 const data=privateCadReview(dxf,dwg,{encoding:parsed['--encoding']||'auto'});
 process.stdout.write(JSON.stringify(data,null,2)+'\n');
}
module.exports={privateCadReview};
