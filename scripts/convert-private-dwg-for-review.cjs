'use strict';
/**
 * 08 offline DWG -> ASCII DXF -> unconfirmed CAD review pipeline.
 * An independently installed trusted GNU LibreDWG dwgread executable
 * is invoked WITHOUT A SHELL and WITHOUT network transfer.
 *
 * No bundled converter, no parser pretending to decode DWG, no automatic
 * answer recognition, no automatic M3/ConstructionStep/V5 certification.
 */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const {privateCadReview}=require('./extract-cad-dxf-review.cjs');
const {preflightTextbookDwg}=require('./preflight-textbook-dwg.cjs');
const MAX_DWG=64*1024*1024,MAX_DXF=8*1024*1024;
function readableFile(file,extension,limit){
 if(typeof file!=='string'||!path.isAbsolute(file)||file.includes('\0')||
    path.extname(file).toLowerCase()!==extension)
  throw new TypeError('absolute private '+extension+' file path required');
 const real=fs.realpathSync(file),stat=fs.statSync(real);
 if(!stat.isFile()||stat.size<64||stat.size>limit)
  throw new RangeError('bounded regular '+extension+' source required');
 return real;
}
function convertPrivateDwg({dwgPath,dwgreadPath,encoding='auto'}={}){
 const source=readableFile(dwgPath,'.dwg',MAX_DWG);
 if(typeof dwgreadPath!=='string'||!path.isAbsolute(dwgreadPath)||
    dwgreadPath.includes('\0'))
  throw new TypeError('absolute installed dwgread executable path required');
 const executable=fs.realpathSync(dwgreadPath),stat=fs.statSync(executable);
 if(!stat.isFile()||!['dwgread','dwgread.exe'].includes(path.basename(executable)))
  throw new TypeError('only an independently installed LibreDWG dwgread executable is supported');
 const dwg=fs.readFileSync(source),check=preflightTextbookDwg(dwg);
 if(!['thumbnail-only','no-preview'].includes(check.status))
  throw new TypeError('unrecognized or unsupported original DWG version');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-private-cad-'));
 fs.chmodSync(temp,0o700);
 try{
  const out=path.join(temp,'cad-extract.dxf');
  try{
   execFileSync(executable,['--format','DXF','--file',out,source],{
    cwd:temp,timeout:45000,maxBuffer:128*1024,
    windowsHide:true,stdio:['ignore','ignore','ignore']});
  }catch(_error){
   throw new Error('offline DWG converter failed; no geometry was approved');
  }
  const target=readableFile(out,'.dxf',MAX_DXF);
  const data=fs.readFileSync(target);
  const result=privateCadReview(data,dwg,{encoding});
  return {
   ...result,
   source:{...result.source,conversionTool:'local-libredwg-dwgread',
    converterExecutedOffline:true,
    independentDwgToDxfEntityEquivalenceVerified:false},
   audit:{...result.audit,
    originalCadSourceLinkedBySha256:true,
    trustedConverterOutputRequiresEntityReview:true,
    trueGeometricConditionsIndependentlyConfirmed:false,
    readyForM3:false,readyForV5:false}
  };
 }finally{
  fs.rmSync(temp,{recursive:true,force:true});
 }
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=='--dwg'||args[2]!=='--dwgread')
  throw new TypeError('usage: node scripts/convert-private-dwg-for-review.cjs --dwg /private/original.dwg --dwgread /usr/local/bin/dwgread');
 process.stdout.write(JSON.stringify(convertPrivateDwg({
  dwgPath:args[1],dwgreadPath:args[3]}),null,2)+'\n');
}
module.exports={convertPrivateDwg};
