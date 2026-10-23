'use strict';
/**
 * Local, private batch audit of textbook CAD sources. Does NOT solve any
 * textbook problem. Only consumes native DWG bytes through preflight, and
 * optionally reviewer-supplied exported ASCII DXF or local GNU LibreDWG.
 * Never uploads source files, stores bytes in git/dist, or guesses dimensions.
 */
const fs=require('node:fs');
const path=require('node:path');
const {preflightTextbookDwg}=require('./preflight-textbook-dwg.cjs');
const {privateCadReview}=require('./extract-cad-dxf-review.cjs');
const {convertPrivateDwg}=require('./convert-private-dwg-for-review.cjs');
const MAX_DWG=64*1024*1024,MAX_DXF=8*1024*1024;
function readPrivate(p,extension,max){
 if(typeof p!=='string'||!path.isAbsolute(p)||path.extname(p).toLowerCase()!==extension||
    p.includes('\0'))throw new TypeError('absolute private '+extension+' file required');
 const real=fs.realpathSync(p),s=fs.statSync(real);
 if(!s.isFile()||s.size<64||s.size>max)
  throw new RangeError('bounded '+extension+' source required');
 return fs.readFileSync(real);
}
function safeSummary(source,id){
 const status=source.audit?.status??source.status;
 return {
  id,sourceFormat:source.source?.dwgPreflightStatus??source.format??null,
  conversionKind:source.source?.conversionTool??null,
  stage:status==='thumbnail-only'||status==='no-preview'?'source-only':
   source.audit?.entityCount>=0?'cad-candidates-require-review':'blocked',
  // Do not duplicate coordinates/dimensions/annotations in the index.
  CADCount:source.audit?.entityCount??null,
  unsupportedCADCount:source.audit?.unsupportedCount??null,
  dimensionCount:source.audit?.unassociatedDimensionCount??null,
  sourceDwgSha256:source.source?.sourceDwgSha256??source.sourceSha256??null,
  exportEquivalentToDwg:false,knownInputsApproved:false,
  independentTextbookResultVerified:false,M3Verified:false,
  firstAngleProjectionVerified:false,cutSolidVerified:false,
  constructionDagVerified:false,singleV5Verified:false,
  reason:source.reason??null
 };
}
function auditPrivateCadBatch({items,outDir,dwgreadPath=null}={}){
 if(!Array.isArray(items)||items.length===0||items.length>20||
    !items.every(x=>x&&typeof x.dwgPath==='string'&&
      (x.dxfPath==null||typeof x.dxfPath==='string')))
  throw new TypeError('1–20 private DWG items with optional matching DXF required');
 if(typeof outDir!=='string'||!path.isAbsolute(outDir)||outDir.includes('\0'))
  throw new TypeError('private absolute output folder path required');
 if(fs.existsSync(outDir))
  throw new TypeError('private output folder must not already exist');
 const parents=fs.realpathSync(path.dirname(outDir));
 if(!fs.statSync(parents).isDirectory())throw new TypeError('output parent is not a directory');
 const seen=new Set(),sources=[];
 for(const item of items){
  const real=fs.realpathSync(item.dwgPath);
  if(seen.has(real))throw new TypeError('duplicated DWG source');
  seen.add(real);
  const dwg=readPrivate(real,'.dwg',MAX_DWG),signature=preflightTextbookDwg(dwg);
  if(!['thumbnail-only','no-preview'].includes(signature.status))
   throw new TypeError('unsupported DWG header');
  if(item.dxfPath&&dwgreadPath)
   throw new TypeError('choose private exported DXF OR local converter for each source');
  const dxfs=item.dxfPath?readPrivate(item.dxfPath,'.dxf',MAX_DXF):null;
  sources.push({dwgPath:real,dwg,dxf:dxfs,signature});
 }
 fs.mkdirSync(outDir,{mode:0o700});
 fs.chmodSync(outDir,0o700);
 const manifest={schema:'draftai-private-cad-batch/1.0.0',
  status:'input-evidence-only',count:sources.length,
  renderer:'single-existing-V5-only',
  sourceGeometryEntirelyDecoded:false,answerIsolationVerified:false,
  anyTextbookWholeProblemVerified:false,items:[]};
 for(let i=0;i<sources.length;i++){
  const entry=sources[i],id='source-'+String(i+1).padStart(3,'0');
  const review=entry.dxf?
   privateCadReview(entry.dxf,entry.dwg):
   dwgreadPath?convertPrivateDwg({dwgPath:entry.dwgPath,dwgreadPath}):
   entry.signature;
  const payload={id,sourceFilename:path.basename(entry.dwgPath),
   evidence:review,
   gates:{dwgSourceVerified:true,vectorEntitiesReviewed:false,
    knownAndReferenceIsolated:false,dimensionsAndUnitsApproved:false,
    M3SolverVerified:false,firstAngleXYZVerified:false,
    retainedSolidVerified:false,constructionStepDAGVerified:false,
    singleV5PlaybackVerified:false,referenceAnswerCompared:false,
    allStagesComplete:false}};
  // Privately stored derived content may include copyrighted geometry:
  // never put this directory under public repository, dist or git history.
  fs.writeFileSync(path.join(outDir,id+'.json'),
   JSON.stringify(payload,null,2)+'\n',{mode:0o600,flag:'wx'});
  manifest.items.push(safeSummary(review,id));
 }
 fs.writeFileSync(path.join(outDir,'audit-index.json'),
  JSON.stringify(manifest,null,2)+'\n',{mode:0o600,flag:'wx'});
 return manifest;
}
function cli(argv){
 let output=null,tool=null,files=[],dxf=null;
 for(let i=0;i<argv.length;i++){
  const opt=argv[i],value=argv[++i];
  if(typeof value!=='string'||value.startsWith('--'))
   throw new TypeError('missing value for '+opt);
  if(opt==='--out'){
   if(output!==null)throw new TypeError('repeat --out');
   output=value;
  }else if(opt==='--dwgread'){
   if(tool!==null)throw new TypeError('repeat --dwgread');
   tool=value;
  }else if(opt==='--dwg'){
   files.push({dwgPath:value,dxfPath:null});
  }else if(opt==='--dxf'){
   if(!files.length||files.at(-1).dxfPath)throw new TypeError('a DXF belongs to preceding --dwg');
   files.at(-1).dxfPath=value;
  }else throw new TypeError('unrecognized option '+opt);
 }
 return auditPrivateCadBatch({items:files,outDir:output,dwgreadPath:tool});
}
if(require.main===module)
 process.stdout.write(JSON.stringify(cli(process.argv.slice(2)),null,2)+'\n');
module.exports={auditPrivateCadBatch,cli};
