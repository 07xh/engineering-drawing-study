'use strict';
/**
 * Independent C3 M5 cross-audit: legacy geometric V/H/W open-volume ray
 * certificates versus the selected Boolean solid's analytic open-ray theorem.
 *
 * The legacy test asks whether EITHER source cylinder contains strict volume
 * ahead, independently of the selected Boolean model. Hence:
 * - a legacy CLEAR ray cannot be opaque for either Boolean operation;
 * - a legacy OPAQUE ray must stay opaque for UNION (not for INTERSECTION).
 *
 * The two calculations may split the same M3 branch at DIFFERENT exact x
 * parameters. Repartition at every boundary and compare positive open cells,
 * without a tolerance, midpoint-only guess, or promoting closed endpoints.
 * C3 contours, overlap-depth ordering, national line styles and V5 remain
 * outside this evidence layer.
 */
const VIEWS=['V','H','W'];
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))freeze(x);Object.freeze(o);
}return o;};
function auditC3BooleanRayM5Concordance({
 revision,sourceBranches,legacyIntervals,selectedRayEvidence
}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    !Array.isArray(sourceBranches)||sourceBranches.length===0||
    sourceBranches.length>512||!Array.isArray(legacyIntervals)||
    !selectedRayEvidence||selectedRayEvidence.revision!==revision||
    selectedRayEvidence.schema!=='draftai-c3-boolean-VHW-open-rays/1')
  throw new TypeError('current independent C3 M3, V/H/W and Boolean ray evidence required');
 const operation=selectedRayEvidence.solidOperation;
 const ready=selectedRayEvidence.fullSourceOpenEdgeRayCoverageVerified===true;
 if(!ready){
  if(selectedRayEvidence.intervals?.length||selectedRayEvidence.finalV5CurveAuthorized!==false)
   throw new RangeError('unverified Boolean source rays must remain unsigned');
  return freeze({schema:'draftai-c3-boolean-M5-independent-ray-concordance/1',
   revision,solidOperation:operation,status:'boolean-ray-proof-not-available',
   checkedOpenCells:0,viewCounts:[],allAnalyticSourceBranchOpenCellsCrossChecked:false,
   sourceRayContradictions:0,closedEndpointContinuityCertified:false,
   completeProjectedFeatureOcclusionCertified:false,officialLineStylesVerified:false,
   constructionIntentAuthorized:false,finalV5CurveAuthorized:false});
 }
 if(!['intersection','union'].includes(operation)||
    selectedRayEvidence.officialLineStylesVerified!==false||
    selectedRayEvidence.finalV5CurveAuthorized!==false||
    selectedRayEvidence.undeterminedCount!==0||
    !Array.isArray(selectedRayEvidence.intervals))
  throw new RangeError('current unsigned selected Boolean M5 theorem required');
 const sourceIds=new Set();
 for(const b of sourceBranches){
  if(typeof b?.id!=='string'||!b.id||sourceIds.has(b.id)||
     !Array.isArray(b.xRange)||b.xRange.length!==2||
     !b.xRange.every(Number.isFinite)||!(b.xRange[1]>b.xRange[0]))
   throw new RangeError('nonunique positive C3 M3 source branches required');
  sourceIds.add(b.id);
 }
 const selected=selectedRayEvidence.intervals.filter(row=>row.sourceKind==='analytic-curve');
 if(legacyIntervals.length>sourceBranches.length*3*512||
    selected.length>sourceBranches.length*3*512)
  throw new RangeError('C3 independent ray interval budget exceeded');
 if(selectedRayEvidence.intervals.some(row=>
   !VIEWS.includes(row.view)||row.standardLineStyle!=='undetermined'||
   row.finalV5StrokeAuthorized!==false||
   !['analytic-curve','line'].includes(row.sourceKind)||
   (row.sourceKind==='analytic-curve'&&!sourceIds.has(row.sourceId))))
  throw new RangeError('non-current or signed C3 Boolean source ray');
 const inspect=(parts,range,kind)=>{
  if(parts.length===0||parts.length>512)
   throw new RangeError('C3 '+kind+' original branch has no bounded intervals');
  const sorted=[...parts].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  if(sorted[0][0]!==range[0]||
     sorted.at(-1)[1]!==range[1]||
     sorted.some(([a,b],i)=>!Number.isFinite(a)||!Number.isFinite(b)||
      !(b>a)||(i>0&&a!==sorted[i-1][1])))
   throw new RangeError('C3 '+kind+' exact source x partition is incomplete or overlaps');
  return sorted;
 };
 let checked=0;
 const viewCounts=VIEWS.map(view=>{
  let cells=0,provedClear=0,provedOpaque=0,legacyUnknown=0;
  for(const b of sourceBranches){
   const l=legacyIntervals.filter(row=>row.view===view&&row.branchId===b.id);
   const s=selected.filter(row=>row.view===view&&row.sourceId===b.id);
   if(l.some(row=>row.sourceM3AnalyticBranchVerified!==true||
      row.physicalGraphBranchAccountedFor!==true||
      !['clear','occluded','undetermined'].includes(row.openInteriorStatus)||
      row.standardLineStyle!=='undetermined'||row.v5ActionAuthorized!==false)||
      s.some(row=>row.parameterKind!=='x'||
       row.sourceFirstAngleRayEntireIntervalProven!==true||
       !['strict-interior-ray-clear','opaque-interior-ahead']
        .includes(row.openInteriorVolumeRayStatus)))
    throw new RangeError('C3 selected/legacy M5 source identity or proof scope mismatch');
   inspect(l.map(x=>x.xOpenRange),b.xRange,'legacy');
   inspect(s.map(x=>x.openParameterRange),b.xRange,'Boolean');
   const cuts=[...new Set([...l.flatMap(x=>x.xOpenRange),
     ...s.flatMap(x=>x.openParameterRange)])].sort((a,b)=>a-b);
   for(let i=1;i<cuts.length;i++){
    const [lo,hi]=[cuts[i-1],cuts[i]];
    if(!(hi>lo))throw new RangeError('C3 zero-length cross-audit cell');
    const covers=(rows,access)=>rows.filter(row=>{
     const [a,z]=access(row);
     return a<=lo&&hi<=z;
    });
    const L=covers(l,row=>row.xOpenRange),S=covers(s,row=>row.openParameterRange);
    if(L.length!==1||S.length!==1)
     throw new RangeError('C3 independent M5 open-ray evidence has ambiguous x coverage');
    const known=L[0].openInteriorStatus,choice=S[0].openInteriorVolumeRayStatus;
    // A strict UNION ray is opaque if either finite cylinder is opaque.
    // A strict INTERSECTION ray cannot be opaque when neither cylinder is.
    const conflict=(known==='clear'&&choice==='opaque-interior-ahead')||
     (operation==='union'&&known==='occluded'&&
      choice==='strict-interior-ray-clear');
    if(conflict)
     throw new RangeError('C3 independent Boolean and geometric M5 rays contradict at '+
       view+'/'+b.id+' x=('+lo+','+hi+')');
    cells++;checked++;
    if(known==='undetermined')legacyUnknown++;
    if(choice==='opaque-interior-ahead')provedOpaque++;
    else provedClear++;
   }
  }
  return {view,checkedOpenCells:cells,selectedOpaqueOpenCells:provedOpaque,
   selectedClearOpenCells:provedClear,legacyUndeterminedOpenCells:legacyUnknown};
 });
 if(viewCounts.some(v=>v.checkedOpenCells===0)||checked===0)
  throw new RangeError('C3 current first-angle source ray coverage empty');
 return freeze({schema:'draftai-c3-boolean-M5-independent-ray-concordance/1',
  revision,solidOperation:operation,status:'scoped-boolean-versus-geometric-open-ray-concordance',
  checkedOpenCells:checked,viewCounts,
  allAnalyticSourceBranchOpenCellsCrossChecked:true,
  sourceRayContradictions:0,closedEndpointContinuityCertified:false,
  completeProjectedFeatureOcclusionCertified:false,officialLineStylesVerified:false,
  constructionIntentAuthorized:false,finalV5CurveAuthorized:false});
}
module.exports={auditC3BooleanRayM5Concordance};
