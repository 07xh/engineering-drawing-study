'use strict';
/**
 * 08 offline ASCII DXF candidate ingestion, for explicitly exported private
 * DWG files. No DWG entity decoder, OCR, image/answer import, solver or V5.
 * Every CAD primitive, annotation and CAD unit must be reviewed by the user.
 * Unsupported, block-derived or nonplanar geometry fails closed.
 */
const crypto=require('node:crypto');
const {TextDecoder}=require('node:util');
const SIZE_LIMIT=8*1024*1024,PAIRS_LIMIT=250000,ENTITY_LIMIT=3000;
const TYPES=new Set(['LINE','CIRCLE','ARC','LWPOLYLINE','TEXT','MTEXT','DIMENSION']);
const UNIT_NAMES={0:'unitless',1:'in',2:'ft',4:'mm',5:'cm',6:'m'};
const finite=n=>Number.isFinite(n)&&Math.abs(n)<=1e9;
const own=(x,k)=>Object.hasOwn(x,k);
const number=(x,k,required=true)=>{
 const items=x.filter(p=>p.code===k);
 if(!items.length){if(required)throw new TypeError('missing DXF group '+k);return null;}
 if(items.length>1)throw new TypeError('duplicate DXF group '+k);
 const raw=items[0].value.trim();
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?$/.test(raw))
  throw new TypeError('invalid numerical DXF group '+k);
 const value=Number(raw);
 if(!finite(value))throw new RangeError('nonfinite or overlarge DXF group '+k);
 return value;
};
const str=(groups,key)=>groups.find(p=>p.code===key)?.value??null;
const position=(g,codeX,codeY,codeZ)=>({
 x:number(g,codeX),y:number(g,codeY),z:number(g,codeZ,false)??0
});
const vector=(g,x,y,z)=>({
 x:number(g,x,false)??0,y:number(g,y,false)??0,
 z:number(g,z,false)??1
});
const near=(a,b)=>Math.abs(a-b)<=1e-10;
function decode(input,requested){
 if(!Buffer.isBuffer(input)||input.length===0||input.length>SIZE_LIMIT)
  throw new TypeError('nonempty bounded local DXF bytes required');
 if(input.subarray(0,18).toString('ascii').includes('AutoCAD Binary DXF'))
  throw new TypeError('binary DXF needs a trusted offline ASCII DXF export');
 if(input.subarray(0,6).toString('ascii').startsWith('AC10'))
  throw new TypeError('DWG is not ASCII DXF: export privately with a trusted CAD application');
 const latin=input.toString('latin1');
 const explicit=typeof requested==='string'&&requested!=='auto'?requested:null;
 const headerCodepage=/\n\s*9\n\$DWGCODEPAGE\n\s*3\n([^\n]+)/.exec('\n'+latin.replace(/\r\n?/g,'\n'));
 const cp=headerCodepage?.[1]?.trim()?.toUpperCase()||'';
 const encoding=explicit||(
  cp==='ANSI_936'||cp==='ANSI_949'||cp==='ANSI_950'?'gb18030':
  cp==='ANSI_1252'?'windows-1252':'utf-8');
 if(!['utf-8','gb18030','windows-1252'].includes(encoding))
  throw new TypeError('allowed encodings: utf-8, gb18030, windows-1252');
 let decoded;
 try{decoded=new TextDecoder(encoding,{fatal:true}).decode(input);}
 catch(e){throw new TypeError('DXF text does not decode with '+encoding);}
 if(decoded.includes('\u0000'))throw new TypeError('binary/NUL DXF rejected');
 return {decoded,encoding,codepage:cp||null};
}
function pairStream(content){
 const lines=content.replace(/\r\n?/g,'\n').split('\n');
 if(lines.at(-1)==='')lines.pop();
 if(lines.length%2!==0||lines.length/2>PAIRS_LIMIT)
  throw new RangeError('truncated or overlarge DXF group stream');
 const pairs=[];
 for(let i=0;i<lines.length;i+=2){
  const c=lines[i].trim(),v=lines[i+1];
  if(!/^-?\d{1,4}$/.test(c)||v.length>8192||lines[i].length>20)
   throw new TypeError('invalid DXF group line at '+i);
  pairs.push({code:Number(c),value:v});
 }
 return pairs;
}
function parseSections(pairs){
 let active=null,expectName=false,ended=false;
 const headers=[],entities=[],unsupportedSections=new Set();
 const blockDefinitions=[];
 let current=null,activeBlock=null,blockHeader=false,blockMemberCount=0;
 function flush(){if(current){entities.push(current);current=null;}}
 for(let i=0;i<pairs.length;i++){
  const p=pairs[i],v=p.value.trim().toUpperCase();
  if(ended){if(p.code===0&&v==='EOF')continue;
   throw new TypeError('content after DXF EOF');}
  if(p.code===0&&v==='SECTION'){
   if(active||expectName)throw new TypeError('nested DXF SECTION');
   expectName=true;continue;
  }
  if(expectName){
   if(p.code!==2)throw new TypeError('DXF section name missing');
   active=v;expectName=false;
   if(!['HEADER','ENTITIES'].includes(v))unsupportedSections.add(v);
   continue;
  }
  if(p.code===0&&v==='ENDSEC'){
   flush();if(!active)throw new TypeError('unpaired ENDSEC');
   if(active==='BLOCKS'&&activeBlock!==null)
    throw new TypeError('unclosed BLOCK definition in DXF');
   active=null;continue;
  }
  if(p.code===0&&v==='EOF'){
   flush();if(active||expectName)throw new TypeError('unclosed DXF section');
   ended=true;continue;
  }
  if(!active)throw new TypeError('DXF group outside SECTION');
  if(active==='HEADER'){headers.push(p);continue;}
  if(active==='BLOCKS'){
   // BLOCK definitions carry geometry that is NOT in ENTITIES. Do not
   // silently treat such a source as fully decoded without block expansion.
   if(p.code===0){
    if(v==='BLOCK'){
     if(activeBlock)throw new TypeError('nested BLOCK definition');
     if(blockDefinitions.length>=1000)throw new RangeError('too many CAD blocks');
     activeBlock={name:null,memberEntityTypes:[]};
     blockDefinitions.push(activeBlock);blockHeader=true;
    }else if(v==='ENDBLK'){
     if(!activeBlock)throw new TypeError('orphan CAD ENDBLK');
     activeBlock=null;blockHeader=false;
    }else{
     if(!activeBlock)throw new TypeError('entity outside BLOCK definition');
     blockHeader=false;blockMemberCount++;
     if(blockMemberCount>ENTITY_LIMIT)throw new RangeError('too many embedded block entities');
     activeBlock.memberEntityTypes.push(v);
    }
   }else if(blockHeader&&p.code===2){
    if(activeBlock.name!==null)throw new TypeError('duplicate BLOCK name');
    activeBlock.name=p.value.slice(0,160);
   }
   continue;
  }
  if(active!=='ENTITIES')continue;
  if(p.code===0){flush();current={kind:v,groups:[]};
   if(entities.length>=ENTITY_LIMIT)throw new RangeError('too many CAD entities');
  }else{
   if(!current)throw new TypeError('entity property without type');
   current.groups.push(p);
  }
 }
 if(!ended||active||!entities.length)throw new TypeError('incomplete/empty DXF ENTITIES stream');
 return {headers,entities,unsupportedSections:[...unsupportedSections],
  blockDefinitions:blockDefinitions.map(b=>({name:b.name,
   memberEntityTypes:b.memberEntityTypes})),
  blockMemberCount};
}
function headerValues(header){
 const vars={};let key=null;
 for(const p of header){
  if(p.code===9){key=p.value.trim();continue;}
  if(key&&p.code===70&&key==='$INSUNITS'){
   const n=Number(p.value.trim());
   if(!Number.isSafeInteger(n)||n<0||n>20)
    throw new TypeError('invalid CAD INSUNITS header');
   vars.insunits=n;
  }
 }
 const unitCode=vars.insunits??null;
 return {insunits:unitCode,
  displayUnit:own(UNIT_NAMES,unitCode)?UNIT_NAMES[unitCode]:'unknown',
  exactModelMmConfirmed:false,unitInterpretationSource:'DXF-header-only'};
}
function polyline(g){
 const vertices=[];
 let current=null;
 for(const p of g){
  if(p.code===10){
   if(current){
    if(!own(current,'y'))throw new TypeError('unpaired LWPOLYLINE vertex x');
    vertices.push(current);
   }
   current={x:number([{code:10,value:p.value}],10)};
  }else if(p.code===20){
   if(!current||own(current,'y'))throw new TypeError('unpaired LWPOLYLINE vertex y');
   current.y=number([{code:20,value:p.value}],20);
  }else if(p.code===42){
   if(!current||own(current,'bulge'))throw new TypeError('unpaired LWPOLYLINE bulge');
   current.bulge=number([{code:42,value:p.value}],42);
  }
 }
 if(current){
  if(!own(current,'y'))throw new TypeError('unpaired LWPOLYLINE final vertex');
  vertices.push(current);
 }
 const stated=number(g,90,false);
 if(vertices.length<2||vertices.length>1024||
   (stated!==null&&stated!==vertices.length))
  throw new RangeError('invalid LWPOLYLINE vertex count');
 const flags=number(g,70,false)??0;
 if(!Number.isSafeInteger(flags)||flags<0)throw new TypeError('invalid polyline flags');
 const elevation=number(g,38,false)??0;
 return {vertices:vertices.map(v=>({...v,bulge:v.bulge??0,z:elevation})),
  closed:Boolean(flags&1),
  hasCurvedBulges:vertices.some(v=>!near(v.bulge??0,0)),
  exactArcReconstructionVerified:false};
}
function annotation(raw,type){
 const text=type==='MTEXT'?
  raw.filter(p=>p.code===3).map(p=>p.value).join('')+(str(raw,1)||''):
  str(raw,1);
 if(text!==null&&text.length>2048)
  throw new RangeError('CAD annotation text exceeds local review limit');
 if(type==='DIMENSION'){
  const measured=number(raw,42,false);
  const dimType=number(raw,70,false);
  return {rawText:text,reportedMeasurement:measured,
   dimStyle:str(raw,3),blockName:str(raw,2),
   dimensionFlags:dimType,
   annotationMeasurementAccepted:false,definitionPointsReviewed:false,
   geometryRefs:[],userConfirmed:false};
 }
 return {rawText:text??'',insertion:position(raw,10,20,30),
  height:number(raw,40,false),
  canBeTrustedAsDimension:false};
}
function extractRecord(record,index){
 const g=record.groups,kind=record.kind;
 const handle=str(g,5),layer=str(g,8)||'0';
 const common={
  id:'cad-'+String(index+1).padStart(5,'0'),
  dxfType:kind,
  handle:handle&&/^[0-9A-Fa-f]{1,32}$/.test(handle)?handle:null,
  layer:layer.slice(0,160),layout:str(g,410)||null,
  paperSpace:(number(g,67,false)??0)!==0,
  lineType:str(g,6)||null,
  userRole:'unclassified',
  reviewStatus:'unconfirmed',
  sourceKnownOrAnswer:'undetermined'
 };
 if(!TYPES.has(kind))return {...common,geometry:null,annotation:null,
  status:'unsupported',reason:'unsupported CAD entity type'};
 if(common.paperSpace||(common.layout&&common.layout.toLowerCase()!=='model'))
  return {...common,geometry:null,annotation:null,status:'unsupported',
   reason:'paper-space CAD entity not part of unambiguous model conditions'};
 const ext=vector(g,210,220,230);
 if(!near(ext.x,0)||!near(ext.y,0)||!near(ext.z,1))
  return {...common,geometry:null,annotation:null,status:'unsupported',
   reason:'nondefault OCS requires a CAD extrusion transformation'};
 const thickness=number(g,39,false)??0;
 if(!near(thickness,0))return {...common,geometry:null,annotation:null,
  status:'unsupported',reason:'extruded geometry must be transformed first'};
 let geometry=null,ann=null;
 try{
  if(kind==='LINE'){
   const from=position(g,10,20,30),to=position(g,11,21,31);
   if(Math.hypot(from.x-to.x,from.y-to.y,from.z-to.z)<1e-10)
    throw new RangeError('zero-length LINE');
   geometry={kind:'segment3d',from,to};
  }else if(kind==='CIRCLE'||kind==='ARC'){
   const center=position(g,10,20,30),radius=number(g,40);
   if(radius<=0)throw new RangeError('invalid circle radius');
   geometry={kind:kind==='CIRCLE'?'circle3d':'arc3d',center,radius};
   if(kind==='ARC'){
    const startDeg=number(g,50),endDeg=number(g,51);
    if(Math.abs(startDeg)>1e5||Math.abs(endDeg)>1e5)
     throw new RangeError('unbounded CAD arc angle');
    geometry={...geometry,startDeg,endDeg,
     direction:'ccw-in-OCS',sweepAndBranchReviewed:false};
   }
  }else if(kind==='LWPOLYLINE'){
   geometry={kind:'polyline3d',...polyline(g)};
  }else ann=annotation(g,kind);
 }catch(e){
  return {...common,geometry:null,annotation:null,
   status:'unsupported',reason:'malformed or incomplete '+kind+': '+e.message.slice(0,160)};
 }
 return {...common,status:'candidate-only',geometry,annotation:ann,
  modelUnitConfirmedByUser:false};
}
function extractDxfForReview(bytes,{encoding='auto',sourceDwgSha256=null}={}){
 if(sourceDwgSha256!==null&&
    (typeof sourceDwgSha256!=='string'||!/^[a-f0-9]{64}$/.test(sourceDwgSha256)))
  throw new TypeError('source DWG fingerprint must be explicit lowercase SHA-256');
 const {decoded,codepage,encoding:used}=decode(bytes,encoding);
 const {headers,entities,unsupportedSections,blockDefinitions,blockMemberCount}=parseSections(pairStream(decoded));
 const rows=entities.map(extractRecord),counts={};
 for(const e of rows)counts[e.dxfType]=(counts[e.dxfType]||0)+1;
 const unsupported=rows.filter(e=>e.status==='unsupported').length;
 const dimensions=rows.filter(e=>e.dxfType==='DIMENSION'&&e.status==='candidate-only').length;
 const annotations=rows.filter(e=>e.annotation!==null).length;
 const insertReferences=rows.filter(e=>e.dxfType==='INSERT').length;
 const dimensionsWithAppearanceBlocks=rows.filter(e=>e.dxfType==='DIMENSION'&&
  e.annotation?.blockName).length;
 const blocksUnexpanded=blockMemberCount>0||insertReferences>0;
 return Object.freeze({
  schema:'draftai-cad-source-review/1.0.0',
  status:'requires-human-review',
  source:{kind:'ascii-dxf',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
   byteLength:bytes.length,encoding:used,sourceDwgSha256,
   cadConversionVerified:false,answerIsolationVerified:false},
  units:headerValues(headers),
  unsupportedSections,
  blockCoverage:{definitionCount:blockDefinitions.length,
   definitions:blockDefinitions,
   memberEntityCount:blockMemberCount,
   insertReferenceCount:insertReferences,
   dimensionAppearanceBlockCount:dimensionsWithAppearanceBlocks,
   blockGeometryExpansionVerified:false,
   sourceBlockGeometryUnexpanded:blocksUnexpanded,
   cadEntityExtractionComplete:false},
  counts,entities:rows,
  audit:{entityCount:rows.length,candidateCount:rows.length-unsupported,
   unsupportedCount:unsupported,annotationCount:annotations,
   unassociatedDimensionCount:dimensions,
   modelMmConfirmed:false,allGeometryReviewed:false,
   sourceKnownOrAnswerSeparated:false,
   allRequiredCadEntitiesSupported:unsupported===0&&!blocksUnexpanded,
   allRequiredBlockGeometryExpanded:!blocksUnexpanded,
   dimensionDefinitionAndAppearanceFullyChecked:false,
   unexpandedCADBlockEntityCount:blockMemberCount,
   insertionReferencesNeedingReview:insertReferences,
   readyForM3:false,readyForConstructionIntent:false,
   readyForV5:false,wholeTextbookProblemVerified:false}
 });
}
module.exports={extractDxfForReview};
