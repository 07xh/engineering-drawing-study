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
// Embind can expose several overloads for the same C++ method. Probe all
// actual exports, never assume the lexicographically first suffix is callable.
function resolveMethods(owner,name){
 return methodNames(owner).filter(key=>
  key===name||(key.startsWith(name+'_')&&
   /^\d+$/.test(key.slice(name.length+1)))).sort((a,b)=>
    a===name?-1:b===name?1:
    Number(a.slice(name.length+1))-Number(b.slice(name.length+1)));
}
function resolveMethod(owner,name){return resolveMethods(owner,name)[0]??null;}
function methodArities(owner,name){
 return resolveMethods(owner,name).map(key=>({
  name:key,length:typeof owner[key]==='function'?owner[key].length:null
 }));
}
function invokePair(owner,name,argSets){
 const methods=resolveMethods(owner,name);
 if(!methods.length)return {readable:false,reason:'method-not-exposed'};
 let last='output-reference-not-marshalled';
 for(const method of methods)for(const args of argSets){
  try{
   const value=owner[method](...args),interval=pair(value);
   if(interval)return {readable:true,interval};
   if(value!==undefined)last='unsupported-return-shape';
  }catch(error){last=String(error?.message??error).slice(0,180);}
 }
 return {readable:false,reason:last};
}
function callBoolean(owner,name){
 for(const method of resolveMethods(owner,name)){
  try{
   const value=owner[method]();
   if(typeof value==='boolean')return value;
  }catch{/* incompatible binding overload: try next real export */}
 }
 return null;
}
function callCount(owner,name){
 for(const method of resolveMethods(owner,name)){
  try{
   const value=owner[method]();
   if(Number.isSafeInteger(value)&&value>=0)return value;
  }catch{/* incompatible binding overload: try next real export */}
 }
 return null;
}
function callNoArg(owner,name,predicate){
 for(const method of resolveMethods(owner,name)){
  if(owner[method].length!==0)continue;
  try{
   const value=owner[method]();
   if(predicate(value))return {readable:true,value,method};
  }catch{/* try the next actual zero-argument overload */}
 }
 return {readable:false,value:null,method:null};
}
function methodInventory(owner,names){
 return Object.fromEntries(names.map(name=>[name,methodArities(owner,name)]));
}
function callFiniteOneArg(owner,name,arg){
 for(const method of resolveMethods(owner,name)){
  if(owner[method].length!==1)continue;
  try{
   const value=owner[method](arg);
   if(Number.isFinite(value))return {readable:true,value,method};
  }catch{/* try next exact one-argument overload */}
 }
 return {readable:false,value:null,method:null};
}
function callPointOneArg(owner,name,arg,dimension){
 for(const method of resolveMethods(owner,name)){
  if(owner[method].length!==1)continue;
  let value;
  try{
   value=owner[method](arg);
   if(!value||typeof value!=='object')continue;
   const keys=dimension===3?['X','Y','Z']:['X','Y'];
   const coords=keys.map(key=>typeof value[key]==='function'?value[key]():NaN);
   if(coords.every(Number.isFinite))
    return {readable:true,coordinates:coords,method};
  }catch{/* try next exact one-argument overload */}
  finally{
   // Value/Value3D return gp_Pnt values by value; release only wrappers
   // that expose an owning delete(), never borrowed Geometry/Edge handles.
   if(value&&typeof value.delete==='function')value.delete();
  }
 }
 return {readable:false,coordinates:null,method:null};
}
function inspectCurveParameterMap(curve,range){
 if(!Array.isArray(range)||range.length!==2||
    !range.every(Number.isFinite)||!(range[1]>range[0]))
  return {readable:false,reason:'original-3d-curve-range-unreadable',samples:[]};
 const samples=[range[0],range[0]+(range[1]-range[0])/2,range[1]];
 const rows=samples.map(parameter3d=>{
  const parameter2d=callFiniteOneArg(curve,'Parameter2d',parameter3d);
  if(!parameter2d.readable)return {parameter3d,parameter2d:null,
   parameter3dRoundTrip:null,roundTripResidual:null,
   sourcePoint3D:null,projectedPoint2D:null,readable:false};
  const back=callFiniteOneArg(curve,'Parameter3d',parameter2d.value);
  const sourcePoint3D=callPointOneArg(curve,'Value3D',parameter3d,3);
  const projectedPoint2D=callPointOneArg(curve,'Value',parameter2d.value,2);
  const residual=back.readable?Math.abs(back.value-parameter3d):null;
  return {parameter3d,parameter2d:parameter2d.value,
   parameter3dRoundTrip:back.readable?back.value:null,
   roundTripResidual:residual,
   sourcePoint3D:sourcePoint3D.readable?sourcePoint3D.coordinates:null,
   projectedPoint2D:projectedPoint2D.readable?projectedPoint2D.coordinates:null,
   readable:back.readable&&sourcePoint3D.readable&&projectedPoint2D.readable};
 });
 const tolerance=1e-10*Math.max(1,Math.abs(range[0]),Math.abs(range[1]));
 return {
  readable:rows.every(x=>x.readable),
  parameter2dMethodArities:methodArities(curve,'Parameter2d'),
  parameter3dMethodArities:methodArities(curve,'Parameter3d'),
  value3dMethodArities:methodArities(curve,'Value3D'),
  value2dMethodArities:methodArities(curve,'Value'),
  roundTripTolerance:tolerance,
  roundTripWithinDiagnosticTolerance:rows.every(x=>
   x.roundTripResidual!==null&&x.roundTripResidual<=tolerance),
  samples:rows
 };
}
function inspectOriginalEdgeData({edgeData,sourceEdgeId,originalNativeEdgeHandles}){
 const scalarMethods={
  VSta:value=>Number.isSafeInteger(value)&&value>=0,
  VEnd:value=>Number.isSafeInteger(value)&&value>=0,
  HideCount:value=>Number.isSafeInteger(value)&&value>=0,
  Tolerance:Number.isFinite
 };
 const scalars={};
 for(const [name,predicate] of Object.entries(scalarMethods))
  scalars[name]=callNoArg(edgeData,name,predicate);
 const flags={};
 for(const name of ['OutLVSta','OutLVEnd','CutAtSta','CutAtEnd',
  'VerAtSta','VerAtEnd','Rg1Line','RgNLine','Used','Selected',
  'Simple','AutoIntersectionDone'])
  flags[name]=callNoArg(edgeData,name,value=>typeof value==='boolean');
 const geometryResult=callNoArg(edgeData,'Geometry',value=>
  value&&typeof value==='object');
 let curve=null,edge=null;
 let geometryMethods=[],adaptorMethods=[],edgeMethods=[];
 let curveParameters=null,curveParameterMap=null,identityMatches=[];
 if(geometryResult.readable){
  const geometry=geometryResult.value;
  geometryMethods=methodNames(geometry);
  const curveResult=callNoArg(geometry,'GetCurve',value=>
   value&&typeof value==='object');
  const fallbackCurve=curveResult.readable?curveResult:
   callNoArg(geometry,'Curve',value=>value&&typeof value==='object');
  if(fallbackCurve.readable){
   curve=fallbackCurve.value;
   adaptorMethods=methodNames(curve);
   const first=callNoArg(curve,'FirstParameter',Number.isFinite);
   const last=callNoArg(curve,'LastParameter',Number.isFinite);
   if(first.readable&&last.readable&&last.value>first.value){
    curveParameters=[first.value,last.value];
    curveParameterMap=inspectCurveParameterMap(geometry,curveParameters);
   }
   const edgeResult=callNoArg(curve,'Edge',value=>
    value&&typeof value==='object'&&typeof value.IsSame==='function');
   if(edgeResult.readable){
    edge=edgeResult.value;
    edgeMethods=methodNames(edge);
    for(const candidate of originalNativeEdgeHandles??[]){
     if(!candidate||typeof candidate.sourceEdgeId!=='string'||
        typeof candidate.edge?.IsSame!=='function')continue;
     const forward=edge.IsSame(candidate.edge)===true;
     const reverse=candidate.edge.IsSame(edge)===true;
     if(forward&&reverse&&!identityMatches.includes(candidate.sourceEdgeId))
      identityMatches.push(candidate.sourceEdgeId);
    }
   }
  }
 }
 return {
  scalarMethodArities:methodInventory(edgeData,Object.keys(scalarMethods)),
  flagMethodArities:methodInventory(edgeData,Object.keys(flags)),
  geometryMethodArities:methodInventory(edgeData,['Geometry']),
  geometryMethods:geometryMethods.slice(0,64),
  adaptorMethods:adaptorMethods.slice(0,64),
  edgeMethods:edgeMethods.slice(0,64),
  scalarValues:Object.fromEntries(Object.entries(scalars).map(([k,v])=>
   [k,v.readable?v.value:null])),
  flagValues:Object.fromEntries(Object.entries(flags).map(([k,v])=>
   [k,v.readable?v.value:null])),
  original3DCurveParameterRange:curveParameters,
  original3DToProjected2DCurveParameterMap:curveParameterMap,
  directOriginalTopoDSEdgeIsSameMatches:identityMatches,
  directOriginalTopoDSEdgeIdentityProven:
   identityMatches.length===1&&identityMatches[0]===sourceEdgeId,
  generated2DHLRTopoDSHistoryProven:false
 };
}
function probeRealOcjsHLREdgeStatusABI({oc,dataStructure,edgeMapExtent,
 indexedOriginalSources,originalNativeEdgeHandles}={}){
 if(!oc||typeof oc!=='object'||!dataStructure||typeof dataStructure!=='object'||
    !Number.isSafeInteger(edgeMapExtent)||edgeMapExtent<1||edgeMapExtent>512||
    !Array.isArray(indexedOriginalSources)||indexedOriginalSources.length!==edgeMapExtent||
    indexedOriginalSources.some((x,i)=>!x||x.hlrDataStructureOneBasedEdgeIndex!==i+1||
      typeof x.originalPhysicalSourceEdgeId!=='string'||!x.originalPhysicalSourceEdgeId)||
    new Set(indexedOriginalSources.map(x=>x.originalPhysicalSourceEdgeId)).size!==edgeMapExtent||
    (originalNativeEdgeHandles!==undefined&&
     (!Array.isArray(originalNativeEdgeHandles)||
      originalNativeEdgeHandles.length>512||
      originalNativeEdgeHandles.some(x=>!x||
       typeof x.sourceEdgeId!=='string'||!x.sourceEdgeId))))
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
 const valueMethod=resolveMethod(array,'Value');
 if(!array||!valueMethod)
  return {...base,availability:'edge-data-array-value-not-exposed',
   arrayMethodNames:methodNames(array),readableSourceStatusRows:0,rows:[]};
 const originalHandleIds=new Set((originalNativeEdgeHandles??[]).map(x=>x.sourceEdgeId));
 const indexedSourceIds=new Set(indexedOriginalSources.map(x=>x.originalPhysicalSourceEdgeId));
 const originalNativeEdgeHandleLedgerComplete=
  originalNativeEdgeHandles!==undefined&&
  originalNativeEdgeHandles.every(x=>typeof x.edge?.IsSame==='function')&&
  originalHandleIds.size===edgeMapExtent&&
  [...indexedSourceIds].every(id=>originalHandleIds.has(id));
 const rows=[];
 let firstUnavailable=null;
 for(let index=1;index<=edgeMapExtent;index++){
  let edgeData;
  try{edgeData=array[valueMethod](index);}
  catch(error){return {...base,availability:'edge-data-index-unreadable',
   failure:String(error?.message??error).slice(0,180),readableSourceStatusRows:rows.length,rows};}
  if(!edgeData||typeof edgeData!=='object')
   return {...base,availability:'edge-data-entry-null',
    readableSourceStatusRows:rows.length,rows};
  const edgeDataMethods=methodNames(edgeData);
  const sourceEdgeId=indexedOriginalSources[index-1].originalPhysicalSourceEdgeId;
  const originalEdgeData=inspectOriginalEdgeData({
   edgeData,sourceEdgeId,originalNativeEdgeHandles
  });
  const statusMethod=edgeDataMethods.find(k=>/^(?:Status|EdgeStatus)(?:_\d+)?$/.test(k));
  const status=statusMethod?edgeData[statusMethod]():edgeData;
  if(!status||typeof status!=='object')
   return {...base,availability:'edge-status-object-not-exposed',
    readableSourceStatusRows:rows.length,rows};
  const statusMethods=methodNames(status);
  // Some generated Embind builds wrap C++ output-reference methods as
  // zero-argument tuple/object returns; others expose numeric placeholder
  // arguments, and some expose neither. Probe both actual call shapes,
  // accepting only a finite ordered pair and never manufacturing defaults.
  const bounds=invokePair(status,'Bounds',[[],[0,0,0,0]]);
  const count=callCount(status,'NbVisiblePart');
  const allVisible=callBoolean(status,'AllVisible');
  const allHidden=callBoolean(status,'AllHidden');
  // A corrupt or incompatible native ABI must not create an unbounded
  // synchronous JS loop on the workbench/Android UI thread.
  if(count!==null&&count>4096)
   throw new RangeError('native HLR EdgeStatus visible-part count exceeds diagnostic budget');
  const visibleParts=[];
  let partFailure=null;
  if(count!==null){
   for(let part=1;part<=count;part++){
    const result=invokePair(status,'VisiblePart',[[part],[part,0,0,0,0]]);
    if(!result.readable){partFailure=result.reason;break;}
    visibleParts.push(result.interval);
   }
  }
  const row={
   sourceEdgeId:indexedOriginalSources[index-1].originalPhysicalSourceEdgeId,
   oneBasedEdgeIndex:index,
   edgeDataMethodNames:edgeDataMethods,
   originalEdgeData,
   statusMethodNames:statusMethods,
   statusGetterMethod:statusMethod,
   boundsMethodArities:methodArities(status,'Bounds'),
   visiblePartMethodArities:methodArities(status,'VisiblePart'),
   visiblePartCountMethodArities:methodArities(status,'NbVisiblePart'),
   visibilityMethodArities:{
    allVisible:methodArities(status,'AllVisible'),
    allHidden:methodArities(status,'AllHidden')
   },
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
   firstUnavailable??=!bounds.readable?'bounds-output-not-readable':
    count===null?'visible-part-count-not-readable':
    allVisible===null||allHidden===null?'visibility-class-not-readable':
    'visible-part-output-not-readable';
   continue;
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
 const readableSourceStatusRows=rows.filter(x=>
  x.bounds!==null&&x.visiblePartCount!==null&&
  x.allVisible!==null&&x.allHidden!==null&&
  x.visiblePartReadFailure===null).length;
 const edgeDataSummary=rows.map(x=>({
  sourceEdgeId:x.sourceEdgeId,
  vertexStartIndex:x.originalEdgeData.scalarValues.VSta,
  vertexEndIndex:x.originalEdgeData.scalarValues.VEnd,
  original3DCurveParameterRange:x.originalEdgeData.original3DCurveParameterRange,
  directOriginalTopoDSEdgeIdentityProven:
   x.originalEdgeData.directOriginalTopoDSEdgeIdentityProven,
  directOriginalTopoDSEdgeIsSameMatches:
   x.originalEdgeData.directOriginalTopoDSEdgeIsSameMatches,
  outOfLimitAtStart:x.originalEdgeData.flagValues.OutLVSta,
  outOfLimitAtEnd:x.originalEdgeData.flagValues.OutLVEnd,
  cutAtStart:x.originalEdgeData.flagValues.CutAtSta,
  cutAtEnd:x.originalEdgeData.flagValues.CutAtEnd
 }));
 if(firstUnavailable)return {...base,availability:firstUnavailable,
  readableSourceStatusRows,rows,
  diagnostic:{
   firstUnavailableSourceEdgeId:rows.find(x=>
    x.bounds===null||x.visiblePartCount===null||
    x.allVisible===null||x.allHidden===null||
    x.visiblePartReadFailure!==null)?.sourceEdgeId??null,
   firstStatusDiagnostic:rows.find(x=>
    x.bounds===null||x.visiblePartCount===null||
    x.allVisible===null||x.allHidden===null||
    x.visiblePartReadFailure!==null)??null,
   statusGetterMethod:rows.find(x=>
    x.bounds===null||x.visiblePartCount===null||
    x.allVisible===null||x.allHidden===null||
    x.visiblePartReadFailure!==null)?.statusGetterMethod??null
  },
  edgeDataSummary,
  originalNativeEdgeHandleLedgerComplete,
  originalNativeEdgeHandleOccurrenceCount:originalNativeEdgeHandles?.length??0,
  originalNativeEdgeHandleUniqueSourceCount:originalHandleIds.size,
  original3DEdgeDataInspectionComplete:rows.every(x=>
   x.originalEdgeData&&Array.isArray(x.originalEdgeData.directOriginalTopoDSEdgeIsSameMatches)),
  directOriginalTopoDSEdgeIdentityRows:rows.filter(x=>
   x.originalEdgeData.directOriginalTopoDSEdgeIdentityProven).length,
  generated2DHLRHistoryStillUnproven:true};
 return {...base,availability:'all-original-edge-status-intervals-readable',
  readableSourceStatusRows,rows,edgeDataSummary,
  originalEdgeStatusParameterIntervalsRead:true,
  generated2DHLRHistoryStillUnproven:true,
  originalNativeEdgeHandleLedgerComplete,
  originalNativeEdgeHandleOccurrenceCount:originalNativeEdgeHandles?.length??0,
  originalNativeEdgeHandleUniqueSourceCount:originalHandleIds.size,
  original3DEdgeDataInspectionComplete:rows.every(x=>
   x.originalEdgeData&&Array.isArray(x.originalEdgeData.directOriginalTopoDSEdgeIsSameMatches)),
  directOriginalTopoDSEdgeIdentityRows:rows.filter(x=>
   x.originalEdgeData.directOriginalTopoDSEdgeIdentityProven).length};
}
module.exports={probeRealOcjsHLREdgeStatusABI};
