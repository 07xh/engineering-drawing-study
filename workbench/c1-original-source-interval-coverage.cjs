'use strict';
/**
 * Shared exact (represented binary64) original 3D source parameter union.
 * Positive gaps, including a one-ULP gap, NEVER close by tolerance.
 * Used by both canonical hidden HLR and independently checked front visible masks.
 */
const finite=Number.isFinite;
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
function exactCandidateIntervalCoverage(range,candidates){
 if(!Array.isArray(range)||range.length!==2||
    !range.every(finite)||!(range[0]>=0&&range[1]<=1&&range[1]>range[0])||
    !Array.isArray(candidates)||candidates.length>512)
  throw new TypeError('bounded exact physical source parameter interval required');
 const [from,to]=range,parts=[];
 for(const item of candidates){
  if(!Array.isArray(item)||item.length!==2||
     !item.every(finite)||!(item[0]>=0&&item[1]<=1&&item[1]>item[0]))
   throw new TypeError('verified finite native CAD source interval required');
  const start=Math.max(from,item[0]),end=Math.min(to,item[1]);
  if(end>start)parts.push([start,end]);
 }
 parts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const gaps=[],merged=[];let reach=from;
 for(const part of parts){
  if(part[0]>reach)gaps.push([reach,part[0]]);
  const end=Math.max(reach,part[1]);
  if(end>reach){
   if(merged.length&&part[0]<=merged.at(-1)[1]){
    merged.at(-1)[1]=Math.max(merged.at(-1)[1],end);
   }else merged.push([Math.max(reach,part[0]),end]);
   reach=end;
  }
 }
 if(reach<to)gaps.push([reach,to]);
 return frozen({originalParameterRange:[from,to],
  positiveLengthCoveredIntervals:merged,
  positiveLengthUncoveredIntervals:gaps,
  entireOriginalParameterIntervalCovered:gaps.length===0,
  originalSourceSubspanHasGenuinePositiveLengthGap:gaps.length>0,
  candidateIntervalsExamined:candidates.length
 });
}
/**
 * Visible/hidden paper HLR candidates can individually span the SAME
 * ORIGINAL 3D TopoDS source parameter interval. Complete UNION coverage
 * cannot make two contradictory visibility classes a certified stroke.
 * Take the exact (represented binary64) open-overlap of two class unions.
 * Endpoint-only contact is NOT positive-length overlap.
 */
function exactCandidateVisibilityClassOverlap(visible,hidden){
 const v=exactCandidateIntervalCoverage([0,1],visible).positiveLengthCoveredIntervals;
 const h=exactCandidateIntervalCoverage([0,1],hidden).positiveLengthCoveredIntervals;
 const overlaps=[];let i=0,j=0;
 while(i<v.length&&j<h.length){
  const from=Math.max(v[i][0],h[j][0]),
   to=Math.min(v[i][1],h[j][1]);
  if(to>from){
   if(overlaps.length&&from<=overlaps.at(-1)[1])
    overlaps.at(-1)[1]=Math.max(to,overlaps.at(-1)[1]);
   else overlaps.push([from,to]);
  }
  if(v[i][1]<h[j][1])i++;
  else if(v[i][1]>h[j][1])j++;
  else {i++;j++;}
 }
 return frozen({
  paperDerivedVisibleOriginalSourceParameterUnion:v,
  paperDerivedHiddenOriginalSourceParameterUnion:h,
  paperDerivedPositiveLengthVisibleHiddenConflictIntervals:overlaps,
  hasPositiveLengthVisibleHiddenClassConflict:overlaps.length>0,
  actualNativeOcctFullVisibilityCertification:false,
  officialEngineeringLineStyle:'undetermined'
 });
}
module.exports={exactCandidateIntervalCoverage,exactCandidateVisibilityClassOverlap};
