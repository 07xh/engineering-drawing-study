'use strict';
const {project}=require('../../../core/projection/conventions.js');
const {binary64OrderedStepDistance}=
 require('../../../core/geometry/binary64-ordered-step-distance.cjs');
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
// OpenCascade.js marshals C++ built-in output references as mutable
// {current: value} objects. Bounds/VisiblePart use Standard_Real and
// Standard_ShortReal output refs; passing numeric placeholders silently
// loses the values. Preserve both interval endpoints and OCCT tolerances.
function invokeCurrentReferencePair(owner,name,argSets){
 const methods=resolveMethods(owner,name);
 if(!methods.length)return {readable:false,reason:'method-not-exposed'};
 let last='output-reference-not-marshalled';
 for(const method of methods)for(const args of argSets){
  const refs=Array.from({length:4},()=>({current:0}));
  try{
   const value=owner[method](...args,...refs);
   const returned=pair(value);
   if(returned)return {readable:true,interval:returned,
    endpointTolerances:null,readABI:'return-value',method};
   const [start,tolStart,end,tolEnd]=refs.map(ref=>ref.current);
   if([start,tolStart,end,tolEnd].every(Number.isFinite)&&
      start<end&&tolStart>=0&&tolEnd>=0)
    return {readable:true,interval:[start,end],
     endpointTolerances:[tolStart,tolEnd],
     readABI:'mutable-current-reference',method};
   if(refs.some(ref=>ref.current!==0))
    last='invalid-output-reference-values';
   else if(value!==undefined)last='unsupported-return-shape';
  }catch(error){last=String(error?.message??error).slice(0,180);}
 }
 return {readable:false,reason:last};
}
function invokeInterval(owner,name,returnArgSets,referenceArgSets){
 const returned=invokePair(owner,name,returnArgSets);
 if(returned.readable)
  return {...returned,endpointTolerances:null,readABI:'return-value'};
 return invokeCurrentReferencePair(owner,name,referenceArgSets);
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
   if(value&&typeof value.delete==='function'){
    try{value.delete();}catch{/* preserve the diagnostic result on cleanup errors */}
   }
  }
 }
 return {readable:false,coordinates:null,method:null};
}
function inspectCurveParameterMap(curve,range,view){
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
  // OCCT HLRBRep_Curve::Value(U) delegates to the underlying 3D
  // BRepAdaptor_Curve at U, then projects it. Parameter2d(P3d) is the
  // separate generated-2D-edge parameter conversion, not Value's input.
  const projectedPoint2D=callPointOneArg(curve,'Value',parameter3d,2);
  const residual=back.readable?Math.abs(back.value-parameter3d):null;
  const sourceXYZ=sourcePoint3D.readable?sourcePoint3D.coordinates:null;
  const expected=view&&sourceXYZ?project({x:sourceXYZ[0],y:sourceXYZ[1],z:sourceXYZ[2]})[view]:null;
  const actual2D=projectedPoint2D.readable?projectedPoint2D.coordinates:null;
  // The pinned HLR projector uses its local right-handed Y axis,
  // opposite the canonical paper V axis. The existing raw HLR reader
  // normalizes this as {u:X,v:-Y}; compare both frames explicitly.
  const projectorLocalExpected=expected?[expected.u,-expected.v]:null;
  const projectionResidual=expected&&actual2D?
   Math.hypot(actual2D[0]-projectorLocalExpected[0],
    actual2D[1]-projectorLocalExpected[1]):null;
  const canonicalResidual=expected&&actual2D?
   Math.hypot(actual2D[0]-expected.u,-actual2D[1]-expected.v):null;
  return {parameter3d,parameter2d:parameter2d.value,
   parameter3dRoundTrip:back.readable?back.value:null,
   roundTripResidual:residual,
   sourcePoint3D:sourceXYZ,
   projectedPoint2D:actual2D,
   expectedCanonicalProjectedPoint2D:expected?[expected.u,expected.v]:null,
   expectedProjectorLocalPoint2D:projectorLocalExpected,
   projectorLocalProjectionResidual:projectionResidual,
   canonicalProjectionResidual:canonicalResidual,
   readable:back.readable&&sourcePoint3D.readable&&projectedPoint2D.readable};
 });
 const tolerance=1e-10*Math.max(1,Math.abs(range[0]),Math.abs(range[1]));
 const projected=rows.map(x=>x.projectedPoint2D);
 const projectionCollapsed=projected.length===3&&
  projected.every(x=>x&&x[0]===projected[0][0]&&x[1]===projected[0][1]);
 const roundTripApplicable=!projectionCollapsed;
 const coordinateResiduals=rows.map(x=>x.canonicalProjectionResidual);
 const canonicalProjectionCoordinatesMatch=
  coordinateResiduals.every(x=>x!==null&&x<=1e-8);
 return {
  view:view??null,
  readable:rows.every(x=>x.readable),
  projectionCollapsed,
  roundTripApplicable,
  parameter2dMethodArities:methodArities(curve,'Parameter2d'),
  parameter3dMethodArities:methodArities(curve,'Parameter3d'),
  value3dMethodArities:methodArities(curve,'Value3D'),
  value2dMethodArities:methodArities(curve,'Value'),
  roundTripTolerance:tolerance,
  roundTripWithinDiagnosticTolerance:roundTripApplicable?
   rows.every(x=>x.roundTripResidual!==null&&x.roundTripResidual<=tolerance):null,
  canonicalProjectionCoordinatesMatch:coordinateResiduals.every(x=>x!==null)?
   canonicalProjectionCoordinatesMatch:null,
  maximumCanonicalProjectionResidual:coordinateResiduals.every(x=>x!==null)?
   Math.max(...coordinateResiduals):null,
  samples:rows
 };
}
function inspectOriginalEdgeData({edgeData,sourceEdgeId,originalNativeEdgeHandles,
 view,nativeCurveHandlesBySourceId}){
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
 let curveParameters=null,curveParameterMap=null,identityMatches=[],
  identityHandleMatches=[],originalBRepParameterRange=null,
  originalBRepParameterRangeMatches=false;
 // Multiple TopoDS handles may legitimately refer to the same physical
 // edge occurrence. A single matching handle cannot certify provenance if
 // another handle bearing the SAME source ID is a different native TShape.
 const sameSourceHandles=(originalNativeEdgeHandles??[]).filter(
  candidate=>candidate?.sourceEdgeId===sourceEdgeId);
 let sameSourceNativeHandleIdentityConsistent=false;
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
    curveParameterMap=inspectCurveParameterMap(geometry,curveParameters,view);
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
     if(forward&&reverse){
      if(!identityMatches.includes(candidate.sourceEdgeId))
       identityMatches.push(candidate.sourceEdgeId);
      if(candidate.sourceEdgeId===sourceEdgeId)
       identityHandleMatches.push(candidate);
     }
    }
   }
  }
 }
 if(edge){
  sameSourceNativeHandleIdentityConsistent=sameSourceHandles.length>0&&
   sameSourceHandles.every(candidate=>
    typeof candidate.edge?.IsSame==='function'&&
    edge.IsSame(candidate.edge)===true&&
    candidate.edge.IsSame(edge)===true);
 }
 if(identityMatches.length===1&&identityMatches[0]===sourceEdgeId&&
    identityHandleMatches.length>0&&sameSourceNativeHandleIdentityConsistent){
  const ranges=identityHandleMatches.map(x=>x.parameterRange);
  const firstRange=ranges[0];
  const allRangesValid=ranges.every(range=>Array.isArray(range)&&
   range.length===2&&range.every(Number.isFinite)&&
   range[0]===firstRange?.[0]&&range[1]===firstRange?.[1]);
  if(allRangesValid){
   originalBRepParameterRange=[...firstRange];
   originalBRepParameterRangeMatches=Array.isArray(curveParameters)&&
    curveParameters.length===2&&
    curveParameters[0]===originalBRepParameterRange[0]&&
    curveParameters[1]===originalBRepParameterRange[1];
  }
 }
 if(nativeCurveHandlesBySourceId instanceof Map&&curveParameters&&
    geometryResult.readable){
  const prior=nativeCurveHandlesBySourceId.get(sourceEdgeId);
  if(prior)throw new RangeError('duplicate original HLR curve handle for physical source edge');
  nativeCurveHandlesBySourceId.set(sourceEdgeId,{
   curve:geometryResult.value,
   parameterRange:[...curveParameters],
   originalBRepParameterRange:originalBRepParameterRange?
    [...originalBRepParameterRange]:null,
   originalBRepParameterRangeMatches,
   tolerance:scalars.Tolerance.readable?scalars.Tolerance.value:null,
   directOriginalTopoDSEdgeIdentityProven:
    identityMatches.length===1&&identityMatches[0]===sourceEdgeId&&
    sameSourceNativeHandleIdentityConsistent
  });
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
  sameSourceNativeHandleIdentityConsistent,
  directOriginalTopoDSEdgeIdentityProven:
   identityMatches.length===1&&identityMatches[0]===sourceEdgeId&&
   sameSourceNativeHandleIdentityConsistent,
  originalBRepSourceParameterRange:originalBRepParameterRange,
  originalBRepParameterRangeMatches,
  generated2DHLRTopoDSHistoryProven:false
 };
}
function probeRealOcjsHLREdgeStatusABI({oc,dataStructure,edgeMapExtent,
 indexedOriginalSources,originalNativeEdgeHandles,view,
 nativeCurveHandlesBySourceId}={}){
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
 // EdgeMap/source-ID cardinality alone cannot detect two different native
 // TShapes labeled with one original edge ID. Repeated occurrences are
 // legitimate only when their native identity AND BRep parameter domain agree.
 const firstNativeHandleBySource=new Map();
 const sameSourceNativeHandleLedgerConsistent=
  originalNativeEdgeHandles!==undefined&&
  originalNativeEdgeHandles.every(handle=>{
   const first=firstNativeHandleBySource.get(handle.sourceEdgeId);
   if(!first){firstNativeHandleBySource.set(handle.sourceEdgeId,handle);return true;}
   try{
    return first.edge?.IsSame(handle.edge)===true&&
     handle.edge?.IsSame(first.edge)===true&&
     Array.isArray(first.parameterRange)&&
     Array.isArray(handle.parameterRange)&&
     first.parameterRange.length===2&&handle.parameterRange.length===2&&
     first.parameterRange.every((v,i)=>
      Number.isFinite(v)&&v===handle.parameterRange[i]);
   }catch{return false;}
  });
 // A unique *string* source ID is not a unique physical TopoDS edge.
 // Different original M0 edges must not borrow the SAME native TShape.
 // Check both directions on actual native handles, not projected paper.
 // A single malformed/non-reflexive handle is also not a valid ledger.
 const nativeHandleShapeAndDomainValid=
  originalNativeEdgeHandles!==undefined&&
  originalNativeEdgeHandles.every(handle=>{
   const range=handle.parameterRange;
   if(typeof handle.edge?.IsSame!=='function'||
      !Array.isArray(range)||range.length!==2||
      !range.every(Number.isFinite)||!(range[1]>range[0]))return false;
   try{return handle.edge.IsSame(handle.edge)===true;}
   catch{return false;}
  });
 const distinctSourceNativeHandleIdentityConsistent=
  nativeHandleShapeAndDomainValid&&
  [...firstNativeHandleBySource.values()].every((left,i,all)=>
   all.slice(i+1).every(right=>{
    try{return left.edge.IsSame(right.edge)===false&&
     right.edge.IsSame(left.edge)===false;}
    catch{return false;}
   }));
 const originalNativeEdgeHandleLedgerComplete=
  nativeHandleShapeAndDomainValid&&
  sameSourceNativeHandleLedgerConsistent&&
  distinctSourceNativeHandleIdentityConsistent&&
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
   edgeData,sourceEdgeId,originalNativeEdgeHandles,view,
   nativeCurveHandlesBySourceId
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
  const bounds=invokeInterval(status,'Bounds',[[],[0,0,0,0]],[[]]);
  const count=callCount(status,'NbVisiblePart');
  const allVisible=callBoolean(status,'AllVisible');
  const allHidden=callBoolean(status,'AllHidden');
  // A corrupt or incompatible native ABI must not create an unbounded
  // synchronous JS loop on the workbench/Android UI thread.
  if(count!==null&&count>4096)
   throw new RangeError('native HLR EdgeStatus visible-part count exceeds diagnostic budget');
  const visibleParts=[],visiblePartEndpointTolerances=[],visiblePartReadABIs=[];
  let partFailure=null;
  if(count!==null){
   for(let part=1;part<=count;part++){
    const result=invokeInterval(status,'VisiblePart',
     [[part],[part,0,0,0,0]],[[part]]);
    if(!result.readable){partFailure=result.reason;break;}
    visibleParts.push(result.interval);
    visiblePartEndpointTolerances.push(result.endpointTolerances);
    visiblePartReadABIs.push(result.readABI);
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
   boundsEndpointTolerances:bounds.readable?bounds.endpointTolerances:null,
   boundsReadABI:bounds.readable?bounds.readABI:null,
   visiblePartCount:count,
   visibleParts,
   visiblePartEndpointTolerances,
   visiblePartReadABIs,
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
  original3DToProjected2DCurveParameterMap:
   x.originalEdgeData.original3DToProjected2DCurveParameterMap,
  projectedCurveCollapsed:
   x.originalEdgeData.original3DToProjected2DCurveParameterMap?.projectionCollapsed??null,
  nativeEdgeStatusBounds:x.bounds,
  nativeEdgeStatusBoundsEndpointTolerances:x.boundsEndpointTolerances,
  nativeEdgeStatusBoundsReadABI:x.boundsReadABI,
  nativeEdgeStatusVisiblePartCount:x.visiblePartCount,
  nativeEdgeStatusVisibleParts:x.visibleParts,
  nativeEdgeStatusVisiblePartEndpointTolerances:x.visiblePartEndpointTolerances,
  nativeEdgeStatusVisiblePartReadABIs:x.visiblePartReadABIs,
  parameterRoundTripApplicable:
   x.originalEdgeData.original3DToProjected2DCurveParameterMap?.roundTripApplicable??false,
  parameterRoundTripWithinDiagnosticTolerance:
   x.originalEdgeData.original3DToProjected2DCurveParameterMap?.roundTripWithinDiagnosticTolerance??null,
  canonicalProjectionCoordinatesMatch:
   x.originalEdgeData.original3DToProjected2DCurveParameterMap?.canonicalProjectionCoordinatesMatch??null,
  directOriginalTopoDSEdgeIdentityProven:
   x.originalEdgeData.directOriginalTopoDSEdgeIdentityProven,
  originalBRepSourceParameterRange:
   x.originalEdgeData.originalBRepSourceParameterRange,
  originalBRepParameterRangeMatches:
   x.originalEdgeData.originalBRepParameterRangeMatches,
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
  sameSourceNativeHandleLedgerConsistent,
  nativeHandleShapeAndDomainValid,
  distinctSourceNativeHandleIdentityConsistent,
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
  sameSourceNativeHandleLedgerConsistent,
  nativeHandleShapeAndDomainValid,
  distinctSourceNativeHandleIdentityConsistent,
  originalNativeEdgeHandleOccurrenceCount:originalNativeEdgeHandles?.length??0,
  originalNativeEdgeHandleUniqueSourceCount:originalHandleIds.size,
  original3DEdgeDataInspectionComplete:rows.every(x=>
   x.originalEdgeData&&Array.isArray(x.originalEdgeData.directOriginalTopoDSEdgeIsSameMatches)),
  directOriginalTopoDSEdgeIdentityRows:rows.filter(x=>
   x.originalEdgeData.directOriginalTopoDSEdgeIdentityProven).length};
}

/**
 * After a genuinely native Parameter3d inverse exceeds the original BRep
 * domain, independently sample the ORIGINAL same-run OCCT HLR curve FORWARD.
 * Never clamp the rejected inverse, substitute line interpolation for Value(),
 * or reinterpret these 5 discrete observations as generated TopoDS ancestry,
 * a continuous curve equality proof, occlusion, or an official V5 stroke.
 */
function auditRejectedOriginalBRepNativeForwardSamples({segment,source,p2Range}={}){
 const original=source?.parameterRange,generated=segment?.actualOCCTHLRCurveParameterRange,
  paper=segment?.actualOCCTHLRCurveSamplesProjectedMm,
  tolerance=segment?.actualOCCTHLRCurveSampleToleranceMm;
 if(!Array.isArray(original)||original.length!==2||
    !original.every(Number.isFinite)||!(original[1]>original[0])||
    !Array.isArray(generated)||generated.length!==2||
    !generated.every(Number.isFinite)||!(generated[1]>generated[0])||
    !Array.isArray(p2Range)||p2Range.length!==2||
    !p2Range.every(Number.isFinite)||
    !Array.isArray(paper)||paper.length!==5||
    !paper.every(p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v))||
    !Number.isFinite(tolerance)||tolerance<0)
  throw new TypeError('actual original and generated native HLR curve domain required');
 const fullForwardDomainExact=generated[0]===p2Range[0]&&
  generated[1]===p2Range[1];
 const p2First=callFiniteOneArg(source.curve,'Parameter2d',original[0]),
  p2Last=callFiniteOneArg(source.curve,'Parameter2d',original[1]);
 const forward=p2First.readable&&p2Last.readable;
 const ascending=forward&&p2Last.value>p2First.value;
 const samples=[];
 let previous=null,fullyReadable=true,gridExact=true,monotonic=true,
  insideNativePaperTolerance=true,paperExactlySame=true,
  gridWithinOneBinary64ULP=true,maxPaperResidualMm=0,
  maximumParameterGridULPs=0n;
 for(let i=0;i<5;i++){
  const f=i/4;
  const p3=ascending?original[0]+(original[1]-original[0])*f:
   original[1]+(original[0]-original[1])*f;
  const p2=callFiniteOneArg(source.curve,'Parameter2d',p3),
   native=callPointOneArg(source.curve,'Value',p3,2);
  const target=generated[0]+(generated[1]-generated[0])*f;
  if(!p2.readable||!native.readable){
   fullyReadable=false;
   samples.push({originalNative3DParameter:p3,
    generated2DGridParameter:target,nativeOriginal2DParameter:null,
    nativeOriginalProjectedMm:null,
    nativeGeneratedPaperResidualMm:null,exactGenerated2DGridParameter:false,
    generated2DParameterGridDriftULPs:null});
   continue;
  }
  const originalPaper={u:native.coordinates[0],v:-native.coordinates[1]},
   measured=paper[i],
   residual=Math.hypot(originalPaper.u-measured.u,
    originalPaper.v-measured.v);
  const exact=p2.value===target,
   ulps=binary64OrderedStepDistance(p2.value,target);
  if(!exact)gridExact=false;
  if(ulps>1n)gridWithinOneBinary64ULP=false;
  if(ulps>maximumParameterGridULPs)maximumParameterGridULPs=ulps;
  if(residual!==0)paperExactlySame=false;
  if(previous!==null&&!(p2.value>previous))monotonic=false;
  previous=p2.value;
  if(!(residual<=tolerance))insideNativePaperTolerance=false;
  maxPaperResidualMm=Math.max(maxPaperResidualMm,residual);
  samples.push({originalNative3DParameter:p3,
   generated2DGridParameter:target,nativeOriginal2DParameter:p2.value,
   nativeOriginalProjectedMm:originalPaper,
   nativeGeneratedPaperResidualMm:residual,
   exactGenerated2DGridParameter:exact,
   generated2DParameterGridDriftULPs:String(ulps)});
 }
 return {
  schema:'draftai-c1-inverse-rejected-original-native-forward-samples/1',
  fullOriginalForward2DParameterDomainExact:fullForwardDomainExact,
  originalNativeForwardFiveSamplesReadable:fullyReadable,
  originalNativeForwardFive2DParametersMatchGeneratedGridExactly:
   fullyReadable&&gridExact&&monotonic,
  originalNativeForwardFivePaperSamplesWithinGeneratedNativeTolerance:
   fullyReadable&&insideNativePaperTolerance,
  originalNativeForwardFivePaperSamplesExactlyMatchGenerated:
   fullyReadable&&paperExactlySame,
  originalNativeForwardFive2DParametersWithinOneULPOfGeneratedGrid:
   fullyReadable&&monotonic&&gridWithinOneBinary64ULP,
  maximumNativeForward2DParameterGridDriftULPs:
   fullyReadable?String(maximumParameterGridULPs):null,
  originalNativeForwardFivePointDiscreteConcordance:
   fullForwardDomainExact&&forward&&fullyReadable&&gridExact&&monotonic&&
   insideNativePaperTolerance,
  originalNativeForwardMaximumPaperResidualMm:
   fullyReadable?maxPaperResidualMm:null,
  samples,
  rejectedNativeInverseStillOutOfOriginalBRepDomain:true,
  generated2DTopoDSHistoryProven:false,
  wholeSceneOcclusionCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 };
}
function matchGeneratedOutputEdgeToOriginalSourceCurve(segment,source){
 if(!source?.directOriginalTopoDSEdgeIdentityProven||
    !source.curve||!Array.isArray(source.parameterRange)||
    source.parameterRange.length!==2||
    !source.parameterRange.every(Number.isFinite)||
    !(source.parameterRange[1]>source.parameterRange[0]))
  return {matched:false,reason:'original-source-edge-identity-or-range-unproven'};
 if(!source.originalBRepParameterRangeMatches||
    !Array.isArray(source.originalBRepParameterRange)||
    source.originalBRepParameterRange.length!==2||
    source.originalBRepParameterRange[0]!==source.parameterRange[0]||
    source.originalBRepParameterRange[1]!==source.parameterRange[1])
  return {matched:false,reason:'original-brep-parameter-domain-not-identical'};
 const outputRange=segment?.actualOCCTHLRCurveParameterRange;
 const outputSamples=segment?.actualOCCTHLRCurveSamplesProjectedMm;
 const sampleTolerance=segment?.actualOCCTHLRCurveSampleToleranceMm;
 if(!Array.isArray(outputRange)||outputRange.length!==2||
    !outputRange.every(Number.isFinite)||!(outputRange[1]>outputRange[0])||
    !Array.isArray(outputSamples)||outputSamples.length!==5||
    !outputSamples.every(p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v))||
    !Number.isFinite(sampleTolerance)||sampleTolerance<0)
  return {matched:false,reason:'generated-output-curve-witness-incomplete'};
 const [sourceFirst,sourceLast]=source.parameterRange;
 const p2First=callFiniteOneArg(source.curve,'Parameter2d',sourceFirst);
 const p2Last=callFiniteOneArg(source.curve,'Parameter2d',sourceLast);
 if(!p2First.readable||!p2Last.readable)
  return {matched:false,reason:'source-3d-to-2d-parameter-map-unreadable'};
 const p2Range=[Math.min(p2First.value,p2Last.value),
  Math.max(p2First.value,p2Last.value)];
 const parameterTolerance=1e-10*Math.max(1,...p2Range,
  Math.abs(outputRange[0]),Math.abs(outputRange[1]));
 // Parameter tolerances are diagnostics for floating curve round trips,
 // NEVER authority to extend a generated edge beyond the original source.
 // Even a one-ULP positive overhang is a real source-domain obligation.
 if(outputRange[0]<p2Range[0]||outputRange[1]>p2Range[1])
  return {matched:false,reason:'generated-parameter-range-outside-source-projection'};
 const samples=[];
 // An original physical line has an injective native parameter map on a
 // noncollapsed projected fragment. Five close paper samples cannot certify
 // source correspondence if Parameter3d folds back or collapses a positive
 // generated 2D interval to the same original BRep parameter.
 const sourceParameterAscending=p2Last.value>p2First.value;
 let previousGeneratedParameter=null,previousSourceParameter=null;
 for(let i=0;i<5;i++){
  const fraction=i/4;
  // Preserve the ACTUAL native output endpoint at fraction 0/1. A generic
  // first+(last-first)*1 can land one ULP before last (e.g. 0.2..0.9),
  // silently losing an original BRep terminal parameter witness.
  const p2=i===0?outputRange[0]:i===4?outputRange[1]:
   outputRange[0]+(outputRange[1]-outputRange[0])*fraction;
  const p3=callFiniteOneArg(source.curve,'Parameter3d',p2);
  if(!p3.readable)
   return {matched:false,reason:'generated-2d-to-source-3d-parameter-map-unreadable'};
  // The original 3D BRep parameter domain is an exact provenance boundary.
  // A diagnostic round-trip tolerance cannot absorb positive source overrun.
  if(p3.value<sourceFirst||p3.value>sourceLast)
   return {matched:false,reason:'generated-source-3d-parameter-outside-original-brep-domain',
    samples,firstRejectedGenerated2DParameter:p2,
    firstRejectedOriginal3DParameter:p3.value,
    // Genuine original TopoDS identity and forward Parameter2d evidence are
    // retained strictly under MATCHED:false; never normalize the overrun.
    originalTopoDSEdgeIdentityProven:true,
    originalBRepSourceParameterRange:[...source.originalBRepParameterRange],
    original3DCurveParameterRange:[...source.parameterRange],
    sourceProjected2DParameterRange:[p2First.value,p2Last.value],
    sourceProjected2DParameterRangeSorted:[...p2Range],
    generated2DParameterRange:[...outputRange],
    originalInverseStillOutsideBRepDomain:true,
    nativeOriginalForwardFiveSampleConcordance:
     auditRejectedOriginalBRepNativeForwardSamples({segment,source,p2Range}),
    generated2DTopoDSHistoryProven:false,
    engineeringLineStyle:'undetermined',signedV5Action:false};
  const p2Back=callFiniteOneArg(source.curve,'Parameter2d',p3.value);
  const point=callPointOneArg(source.curve,'Value',p3.value,2);
  if(!p2Back.readable||!point.readable)
   return {matched:false,reason:'source-projected-curve-evaluation-unreadable'};
  const sourceP2=[point.coordinates[0],-point.coordinates[1]];
  const outputP2=[outputSamples[i].u,outputSamples[i].v];
  const residual=Math.hypot(sourceP2[0]-outputP2[0],
   sourceP2[1]-outputP2[1]);
  if(previousGeneratedParameter!==null&&
     (!(p2>previousGeneratedParameter)||
      (sourceParameterAscending?
       !(p3.value>previousSourceParameter):
       !(p3.value<previousSourceParameter))))
   return {matched:false,reason:'generated-source-parameter-order-not-injective',
    samples,firstRejectedGenerated2DParameter:p2,
    firstRejectedOriginal3DParameter:p3.value};
  previousGeneratedParameter=p2;
  previousSourceParameter=p3.value;
  samples.push({
   generated2DParameter:p2,source3DParameter:p3.value,
   parameterRoundTripResidual:Math.abs(p2Back.value-p2),
   sourceProjectedPointMm:sourceP2,generatedProjectedPointMm:outputP2,
   projectedPointResidualMm:residual
  });
  if(Math.abs(p2Back.value-p2)>parameterTolerance||
     residual>sampleTolerance)
   return {matched:false,reason:'source-parameterized-curve-does-not-match-generated-edge',
    samples,maximumProjectedPointResidualMm:Math.max(...samples.map(x=>x.projectedPointResidualMm))};
 }
 return {
  matched:true,
  // This curve was admitted to the same-run map only after symmetric
  // native TopoDS IsSame matched its EdgeData geometry to one original M0 edge.
  originalTopoDSEdgeIdentityProven:true,
  originalBRepParameterRangeMatches:true,
  originalBRepSourceParameterRange:[...source.originalBRepParameterRange],
  original3DCurveParameterRange:[...source.parameterRange],
  sourceProjected2DParameterRange:[p2First.value,p2Last.value],
  sourceProjected2DParameterRangeSorted:[...p2Range],
  sourceProjected2DParameterRangeMatchesGeneratedOutputRange:
   p2Range[0]===outputRange[0]&&p2Range[1]===outputRange[1],
  sourceProjected2DParameterEndpointResiduals:[
   outputRange[0]-p2Range[0],outputRange[1]-p2Range[1]
  ],
  source3DParameterRange:[samples[0].source3DParameter,samples[4].source3DParameter],
  generated2DParameterRange:[...outputRange],
  maximumProjectedPointResidualMm:Math.max(...samples.map(x=>x.projectedPointResidualMm)),
  maximumParameterRoundTripResidual:Math.max(...samples.map(x=>x.parameterRoundTripResidual)),
  samples,
  generated2DTopoDSHistoryProven:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 };
}
function auditGeneratedOutputEdgesAgainstOriginalSourceCurves({
 segments,nativeCurveHandlesBySourceId
}={}){
 if(!Array.isArray(segments)||!(nativeCurveHandlesBySourceId instanceof Map))
  throw new TypeError('generated HLR segments and same-run original HLR curve map required');
 const rows=segments.map((segment,ordinal)=>{
  const candidateSourceMatches=[];
  const rejectedSourceCandidates=[];
  for(const [sourceEdgeId,source] of nativeCurveHandlesBySourceId){
   const match=matchGeneratedOutputEdgeToOriginalSourceCurve(segment,source);
   if(match.matched)candidateSourceMatches.push({sourceEdgeId,...match});
   else if(match.reason==='generated-source-3d-parameter-outside-original-brep-domain')
    rejectedSourceCandidates.push({sourceEdgeId,...match});
   else rejectedSourceCandidates.push({sourceEdgeId,reason:match.reason});
  }
  return {
   ordinal,
   candidateSourceMatchCount:candidateSourceMatches.length,
   candidateSourceMatches,
   rejectedSourceCandidateCount:rejectedSourceCandidates.length,
   // Preserve per-original-edge native rejection reasons for the actual M4
   // consumer and C1 source-gap diagnosis; no candidate is upgraded to
   // generated TopoDS ancestry or a signed engineering stroke.
   rejectedSourceCandidates,
   uniqueOriginalSourceEdgeId:candidateSourceMatches.length===1?
    candidateSourceMatches[0].sourceEdgeId:null,
   status:candidateSourceMatches.length===1?
    'unique-parameterized-source-curve-match':
    candidateSourceMatches.length>1?
     'ambiguous-parameterized-source-curve-match':
     'no-parameterized-source-curve-match',
   generated2DTopoDSHistoryProven:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  };
 });
 return {
  schema:'draftai-c1-ocjs-generated-2d-source-parameter-match/1',
  sourceCurveCandidateCount:nativeCurveHandlesBySourceId.size,
  topoDSIdentityBoundSourceCurveCount:[...nativeCurveHandlesBySourceId.values()]
   .filter(source=>source.directOriginalTopoDSEdgeIdentityProven===true).length,
  topoDSParameterDomainBoundSourceCurveCount:[...nativeCurveHandlesBySourceId.values()]
   .filter(source=>source.directOriginalTopoDSEdgeIdentityProven===true&&
    source.originalBRepParameterRangeMatches===true&&
    Array.isArray(source.parameterRange)&&source.parameterRange.length===2&&
    Array.isArray(source.originalBRepParameterRange)&&
    source.originalBRepParameterRange.length===2&&
    source.originalBRepParameterRange[0]===source.parameterRange[0]&&
    source.originalBRepParameterRange[1]===source.parameterRange[1]).length,
  generatedOutputEdgeCount:rows.length,
  uniqueParameterizedSourceMatchCount:rows.filter(x=>x.candidateSourceMatchCount===1).length,
  ambiguousParameterizedSourceMatchCount:rows.filter(x=>x.candidateSourceMatchCount>1).length,
  unmatchedGeneratedOutputEdgeCount:rows.filter(x=>x.candidateSourceMatchCount===0).length,
  rows,
  generated2DTopoDSHistoryProven:false,
  globalContinuousVisibilityProven:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0
 };
}

/**
 * Same-run native ORIGINAL HLR EdgeStatus vs ORIGINAL source-scoped 3D
 * Sharp V/H intervals. Both are indexed by the real input TopoDS edge.
 * Split at every observed binary64 endpoint and inspect the whole open
 * interval; there is no epsilon, guessed midpoint, or rounded M0 inversion.
 *
 * This checks two representations of the original HLR's visibility state.
 * It does NOT establish generated 2D TopoDS ancestry, depth ordering
 * against all faces, engineering line styles, or official V5 permission.
 */
function auditOriginalEdgeStatusVsSourceScoped3DSharp({
 sourceEdgeId,originalNativeParameterRange,statusRow,
 visibleNativeIntervals,hiddenNativeIntervals
}={}){
 const held=reason=>({
  schema:'draftai-c1-original-edgestatus-vs-native-3d-sharp/1',
  sourceEdgeId,comparable:false,reason,
  nativeOriginalStatusClassAgreesWith3DSharp:false,
  generated2DTopoDSHistoryCertified:false,
  wholeSceneM5Certified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
 if(typeof sourceEdgeId!=='string'||!sourceEdgeId||
    !Array.isArray(originalNativeParameterRange)||
    originalNativeParameterRange.length!==2||
    !originalNativeParameterRange.every(Number.isFinite)||
    !(originalNativeParameterRange[1]>originalNativeParameterRange[0]))
  throw new TypeError('finite original OCCT source parameter domain required');
 if(statusRow?.sourceEdgeId!==sourceEdgeId||
    statusRow.parameterPartitionValidated!==true||
    !Array.isArray(statusRow.bounds)||!Array.isArray(statusRow.visibleParts))
  return held('original-native-edgestatus-unavailable-or-not-validated');
 const [first,last]=originalNativeParameterRange;
 const validInterval=range=>Array.isArray(range)&&range.length===2&&
  range.every(Number.isFinite)&&range[0]>=first&&range[1]<=last&&
  range[1]>range[0];
 if(!validInterval(statusRow.bounds)||statusRow.bounds[0]!==first||
    statusRow.bounds[1]!==last)
  return held('original-edgestatus-bounds-not-identical-to-brep-domain');
 if(!Array.isArray(visibleNativeIntervals)||
    !Array.isArray(hiddenNativeIntervals)||
    [statusRow.visibleParts,visibleNativeIntervals,hiddenNativeIntervals]
     .some(items=>items.length>128||!items.every(validInterval)))
  return held('native-status-or-scoped-3d-interval-invalid');
 // A claimed validated status partition is not a substitute for checking
 // the received intervals. Repeated same-class subspans can make a simple
 // pointwise membership comparison appear concordant while representing
 // two competing native pieces for one original physical parameter span.
 // Keep the evidence held rather than silently unioning overlapping parts.
 const hasPositiveSelfOverlap=intervals=>{
  const ordered=intervals.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  for(let i=1;i<ordered.length;i++)
   if(ordered[i][0]<ordered[i-1][1])return true;
  return false;
 };
 if(hasPositiveSelfOverlap(statusRow.visibleParts)||
    hasPositiveSelfOverlap(visibleNativeIntervals)||
    hasPositiveSelfOverlap(hiddenNativeIntervals))
  return held('positive-same-class-original-native-parameter-overlap');
 const cuts=[first,last,
  ...statusRow.visibleParts.flat(),
  ...visibleNativeIntervals.flat(),...hiddenNativeIntervals.flat()];
 const ordered=[...new Set(cuts)].sort((a,b)=>a-b);
 const contains=(intervals,a,b)=>intervals.some(([x,y])=>x<=a&&y>=b);
 const mismatches=[],gaps=[],overlaps=[],aligned=[];
 for(let i=0;i<ordered.length-1;i++){
  const a=ordered[i],b=ordered[i+1];
  if(!(b>a))continue;
  const statusVisible=contains(statusRow.visibleParts,a,b),
   nativeVisible=contains(visibleNativeIntervals,a,b),
   nativeHidden=contains(hiddenNativeIntervals,a,b);
  const row={originalNativeParameterRange:[a,b],statusVisible,
   statusHidden:!statusVisible,nativeVisible,nativeHidden};
  if(nativeVisible&&nativeHidden)overlaps.push(row);
  else if(!nativeVisible&&!nativeHidden)gaps.push(row);
  else if(statusVisible!==nativeVisible||
          !statusVisible!==nativeHidden)mismatches.push(row);
  else aligned.push(row);
 }
 const agree=mismatches.length===0&&gaps.length===0&&overlaps.length===0;
 return {
  schema:'draftai-c1-original-edgestatus-vs-native-3d-sharp/1',
  sourceEdgeId,comparable:true,
  originalNativeParameterRange:[first,last],
  statusVisiblePartCount:statusRow.visibleParts.length,
  sourceScoped3DVisiblePartCount:visibleNativeIntervals.length,
  sourceScoped3DHiddenPartCount:hiddenNativeIntervals.length,
  exactBinary64OpenSubintervalsChecked:ordered.length-1,
  exactAlignedSubintervals:aligned.length,
  mismatchedNativeVisibilitySubintervals:mismatches,
  uncoveredSourceScoped3DSubintervals:gaps,
  overlappingNative3DClassSubintervals:overlaps,
  nativeOriginalStatusClassAgreesWith3DSharp:agree,
  sourceOnlyNativeConcordanceCannotReplaceGenerated2DHistory:true,
  generated2DTopoDSHistoryCertified:false,
  wholeSceneM5Certified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 };
}

module.exports={probeRealOcjsHLREdgeStatusABI,
 auditGeneratedOutputEdgesAgainstOriginalSourceCurves,
 auditOriginalEdgeStatusVsSourceScoped3DSharp};
