'use strict';
/**
 * Read-only capability probe for the pinned OpenCascade.js HLR EdgeStatus ABI.
 *
 * OCCT's native HLRAlgo_EdgeStatus exposes Bounds/VisiblePart through C++
 * output-reference parameters. Some generated JS bindings do not marshal
 * those references. This probe never guesses intervals and never upgrades
 * an ABI surface inspection into generated 2D ancestry, M5 visibility,
 * engineering line style, ConstructionIntent or V5 authority.
 */
function methodNames(value,limit=64){
 const names=new Set();
 for(let p=value,depth=0;p&&depth<5;p=Object.getPrototypeOf(p),depth++){
  for(const key of Object.getOwnPropertyNames(p))
   if(key!=='constructor'&&typeof value?.[key]==='function')names.add(key);
 }
 return [...names].sort().slice(0,limit);
}
function pair(value){
 if(Array.isArray(value)&&value.length===2&&value.every(Number.isFinite))
  return [value[0],value[1]];
 if(value&&typeof value==='object'){
  for(const keys of [['first','second'],['start','end'],['lower','upper']]){
   if(keys.every(k=>Number.isFinite(value[k])))return [value[keys[0]],value[keys[1]]];
  }
 }
 return null;
}
function invokePair(owner,name,argSets){
 if(typeof owner?.[name]!=='function')return {readable:false,reason:'method-not-exposed'};
 let last='output-reference-not-marshalled';
 for(const args of argSets){
  try{
   const value=owner[name](...args),interval=pair(value);
   if(interval)return {readable:true,interval};
   if(value!==undefined)last='unsupported-return-shape';
  }catch(error){last=String(error?.message??error).slice(0,180);}
 }
 return {readable:false,reason:last};
}
function callBoolean(owner,name){
 if(typeof owner?.[name]!=='function')return null;
 const value=owner[name]();
 return typeof value==='boolean'?value:null;
}
function callCount(owner,name){
 if(typeof owner?.[name]!=='function')return null;
 const value=owner[name]();
 return Number.isSafeInteger(value)&&value>=0?value:null;
}
function probeRealOcjsHLREdgeStatusABI({oc,dataStructure,edgeMapExtent,indexedOriginalSources}={}){
 if(!oc||typeof oc!=='object'||!dataStructure||typeof dataStructure!=='object'||
    !Number.isSafeInteger(edgeMapExtent)||edgeMapExtent<1||edgeMapExtent>512||
    !Array.isArray(indexedOriginalSources)||indexedOriginalSources.length!==edgeMapExtent||
    indexedOriginalSources.some((x,i)=>!x||x.hlrDataStructureOneBasedEdgeIndex!==i+1||
      typeof x.originalPhysicalSourceEdgeId!=='string'||!x.originalPhysicalSourceEdgeId))
  throw new TypeError('same-run real OCJS HLR data structure and complete original source index required');
 const dsMethods=methodNames(dataStructure);
 const statusExports=Object.keys(oc).filter(k=>/HLR.*(EdgeStatus|EdgeData|Array1OfEData)/i.test(k)).sort();
 const arrayMethod=dsMethods.find(k=>/^EDataArray(?:_\d+)?$/.test(k));
 const base={
  schema:'draftai-c1-ocjs-edgestatus-abi-probe/1',
  scope:'same-run-original-HLR-EdgeStatus-parameter-diagnostics-only',
  dataStructureMethodNames:dsMethods,
  statusRelatedExports:statusExports,
  originalSourceRows:edgeMapExtent,
  generated2DHLRTopoDSHistoryCertified:false,
  globalContinuousOcclusionCertified:false,
  engineeringLineStyle:'undetermined',
  signedV5ActionCount:0
 };
 if(!arrayMethod)return {...base,availability:'edge-data-array-not-exposed',
  readableSourceStatusRows:0,rows:[]};
 let array;
 try{array=dataStructure[arrayMethod]();}
 catch(error){return {...base,availability:'edge-data-array-call-failed',
  failure:String(error?.message??error).slice(0,180),readableSourceStatusRows:0,rows:[]};}
 if(!array||typeof array.Value!=='function')
  return {...base,availability:'edge-data-array-value-not-exposed',
   arrayMethodNames:methodNames(array),readableSourceStatusRows:0,rows:[]};
 const rows=[];
 for(let index=1;index<=edgeMapExtent;index++){
  let edgeData;
  try{edgeData=array.Value(index);}
  catch(error){return {...base,availability:'edge-data-index-unreadable',
   failure:String(error?.message??error).slice(0,180),readableSourceStatusRows:rows.length,rows};}
  if(!edgeData||typeof edgeData!=='object')
   return {...base,availability:'edge-data-entry-null',
    readableSourceStatusRows:rows.length,rows};
  const edgeDataMethods=methodNames(edgeData);
  const statusMethod=edgeDataMethods.find(k=>/^(?:Status|EdgeStatus)(?:_\d+)?$/.test(k));
  const status=statusMethod?edgeData[statusMethod]():edgeData;
  if(!status||typeof status!=='object')
   return {...base,availability:'edge-status-object-not-exposed',
    readableSourceStatusRows:rows.length,rows};
  const statusMethods=methodNames(status);
  const bounds=invokePair(status,'Bounds',[[0,0],[]]);
  const count=callCount(status,'NbVisiblePart');
  const allVisible=callBoolean(status,'AllVisible');
  const allHidden=callBoolean(status,'AllHidden');
  const visibleParts=[];
  let partFailure=null;
  if(count!==null){
   for(let part=1;part<=count;part++){
    const result=invokePair(status,'VisiblePart',[[part,0,0],[part]]);
    if(!result.readable){partFailure=result.reason;break;}
    visibleParts.push(result.interval);
   }
  }
  const row={
   sourceEdgeId:indexedOriginalSources[index-1].originalPhysicalSourceEdgeId,
   oneBasedEdgeIndex:index,
   edgeDataMethodNames:edgeDataMethods,
   statusMethodNames:statusMethods,
   bounds:bounds.readable?bounds.interval:null,
   visiblePartCount:count,
   visibleParts,
   allVisible,allHidden,
   boundsReadFailure:bounds.readable?null:bounds.reason,
   visiblePartReadFailure:partFailure,
   parameterPartitionValidated:false
  };
  if(!bounds.readable||count===null||allVisible===null||allHidden===null||partFailure){
   rows.push(row);
   return {...base,availability:!bounds.readable?'bounds-output-not-readable':
    count===null?'visible-part-count-not-readable':
    allVisible===null||allHidden===null?'visibility-class-not-readable':
    'visible-part-output-not-readable',
    readableSourceStatusRows:rows.filter(x=>x.bounds!==null&&x.visiblePartCount!==null).length,
    rows};
  }
  const [lo,hi]=bounds.interval;
  if(!(lo<hi)||allVisible&&allHidden||
     visibleParts.some(([a,b])=>!(lo<=a&&a<b&&b<=hi))||
     visibleParts.some((p,i)=>i>0&&visibleParts[i-1][1]>p[0])||
     allVisible&&(visibleParts.length!==1||visibleParts[0][0]!==lo||visibleParts[0][1]!==hi)||
     allHidden&&visibleParts.length!==0)
   throw new RangeError('native HLR EdgeStatus bounds/visible-part partition is contradictory');
  row.parameterPartitionValidated=true;
  rows.push(row);
 }
 return {...base,availability:'all-original-edge-status-intervals-readable',
  readableSourceStatusRows:rows.length,rows,
  originalEdgeStatusParameterIntervalsRead:true,
  generated2DHLRHistoryStillUnproven:true};
}
module.exports={probeRealOcjsHLREdgeStatusABI};
