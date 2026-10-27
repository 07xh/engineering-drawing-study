'use strict';
/**
 * Single-source acceptance bridge, NOT a solver or stroke signer:
 * current reviewed 3D Geometry -> existing M3 first-angle Scene -> genuine
 * M0 whole-original ray runs -> existing M4 cut partitions -> M5 preview.
 *
 * A C1 M5 signed physical source stroke may be optionally reconciled here,
 * but unsigned M0/M4 diagnostics can NEVER mint a GB engineering line or V5.
 * Each argument is bound back to actual original three-dimensional vertices,
 * current revision, projections and independent M0 numeric recomputation.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {auditReviewedM0ScenePartitions}=
 require('./m0-reviewed-scene-continuous-partitions.cjs');
const {auditC1ReviewedConvexPhysicalEdgeStrokes}=
 require('./m5-c1-reviewed-convex-physical-edge-strokes.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
const dist=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
const interp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const key=(g,e)=>g.id+'::'+[...e].sort().join('|');
const overlap=(a,b)=>Math.min(a[1],b[1])-Math.max(a[0],b[0])>1e-10;
const fail=s=>{throw new RangeError('M0/M3/M4/M5 original-source acceptance: '+s);};
const held=(revision,reason)=>freeze({
 schema:'draftai-m0-m3-m4-m5-original-source-acceptance/1',
 revision,status:'not-covered',reason,sourceGeometryIds:[],
 originalEdgeViewCount:0,m3BoundSourceEdgeViews:0,
 m4WholeSourcePartitionCount:0,m4UnresolvedSourcePartitionCount:0,
 independentlyPositiveM0M4Intervals:0,mutuallyContradictoryIntervals:0,
 physicalM5CandidateCount:0,physicalM5SourceCorroboratedCount:0,
 physicalM5UnresolvedComparisonCount:0,views:{V:[],H:[],W:[]},
 fullSceneVerified:false,completeEngineeringLineStylesVerified:false,
 constructionIntentAuthorized:false,v5VerifiedExportReady:false
});
function auditM0M3M4M5OriginalSources({
 geometry,scene,sceneDepthEvidence,revision,physicalM5Proof=null
}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current original 3D source revision required');
 if(!Array.isArray(geometry)||!geometry.length||geometry.length>8||
    geometry.some(g=>g?.kind!=='mesh'||g?.space!=='model-3d'||g?.unit!=='mm'))
  return held(revision,'only finite reviewed closed 3D meshes covered');
 if(scene?.revision!==revision||scene.viewMethod!=='first-angle-orthographic'||
    !Array.isArray(scene.objects)||scene.objects.length!==geometry.length)
  fail('M3 scene revision, first-angle convention or source membership changed');
 for(const [i,g] of geometry.entries()){
  const obj=scene.objects[i];
  if(obj?.id!==g.id||obj.kind!=='mesh'||obj.space!=='model-3d'||
     JSON.stringify(obj.model)!==JSON.stringify(g))
   fail('M3 reconstructed model geometry differs from original reviewed 3D source');
 }
 if(sceneDepthEvidence?.revision!==revision||
    sceneDepthEvidence?.schema!=='draftai-reviewed-mesh-scene-ray-audit/1'||
    sceneDepthEvidence.status!=='scoped-face-probes-only'||
    JSON.stringify(sceneDepthEvidence.sourceGeometryIds)!==
     JSON.stringify(geometry.map(g=>g.id)))
  return held(revision,'actual reviewed M5 spatial depth scene unavailable');
 const m0=sceneDepthEvidence.m0SceneContinuousPartitions;
 const fresh=auditReviewedM0ScenePartitions({geometry,revision});
 if(fresh.status!=='actual-reviewed-source-open-interval-evidence')
  return held(revision,'true M0 closed original source interval budget or proof unavailable');
 if(JSON.stringify(m0)!==JSON.stringify(fresh))
  fail('M0 source intervals or original depth order are stale, forged or altered');
 const m4=sceneDepthEvidence.projectedStrokePartitions;
 if(m4?.status!=='preview-partition-evidence-only'||m4.revision!==revision||
    m4.officialLineStylesVerified!==false||m4.v5Ready!==false||
    !Array.isArray(m4.segments))
  return held(revision,'existing M4 original-source partition not available');
 const edgeMap=new Map();
 for(const g of geometry)for(const e of g.data.edges){
  const id=key(g,e);
  if(edgeMap.has(id))fail('duplicate original 3D source edge');
  edgeMap.set(id,{g,e,a:g.data.points[e[0]],b:g.data.points[e[1]]});
 }
 const total=edgeMap.size*VIEWS.length;
 if(total!==m0.originalSourceEdgeViewCount||
    m4.segments.length>10000||total>120)
  return held(revision,'original first-angle source evaluation budget exceeded');
 const m4ByKey=new Map();
 for(const row of m4.segments){
  const id=row.view+'|'+row.sourceEdgeId;
  if(!VIEWS.includes(row.view)||!edgeMap.has(row.sourceEdgeId)||
     edgeMap.get(row.sourceEdgeId).g.id!==row.sourceGeometryId||
     !Array.isArray(row.sourceParameterRange)||
     row.sourceParameterRange.length!==2)
   fail('M4 source owner, view or parameter interval invalid');
  const [a,b]=row.sourceParameterRange;
  if(!Number.isFinite(a)||!Number.isFinite(b)||!(a>=0&&b<=1&&b>a))
   fail('M4 current original source parameter is outside [0,1]');
  if(!m4ByKey.has(id))m4ByKey.set(id,[]);
  m4ByKey.get(id).push(row);
 }
 const views={V:[],H:[],W:[]};
 let m3Count=0,complete=0,incomplete=0,positives=0;
 const verifiedM4=new Map(),positiveRows=[];
 for(const view of VIEWS){
  const m0Rows=m0.views?.[view]?.edges;
  if(!Array.isArray(m0Rows)||m0Rows.length!==edgeMap.size)
   fail('M0 original source V/H/W inventory incomplete');
  const seen=new Set();
  for(const row of m0Rows){
   const original=edgeMap.get(row.sourceEdgeId);
   const k=view+'|'+row.sourceEdgeId;
   if(!original||seen.has(k)||row.sourceGeometryId!==original.g.id||
      JSON.stringify(row.sourceVertexIds)!==JSON.stringify(original.e))
    fail('M0 original physical edge owner or vertices changed');
   seen.add(k);
   const rep=scene.objects.find(obj=>obj.id===original.g.id)
    ?.representations?.[view];
   const from=project(original.a)[view],to=project(original.b)[view];
   if(rep?.kind!=='mesh-projection'||
      dist(rep.points?.[original.e[0]],from)>1e-8||
      dist(rep.points?.[original.e[1]],to)>1e-8||
      dist(row.fromProjectedModelMm,from)>1e-8||
      dist(row.toProjectedModelMm,to)>1e-8)
    fail('M0 source projections disagree with independently solved M3 view');
   m3Count++;
   const m4Segments=(m4ByKey.get(k)||[]).slice().sort((a,b)=>
    a.sourceParameterRange[0]-b.sourceParameterRange[0]);
   const collapsed=dist(from,to)<=1e-8;
   if(collapsed){
    if(row.status!=='collapsed-projection'||m4Segments.length>0)
     fail('collapsed 3D source was rendered as a physical 2D stroke');
    views[view].push({sourceEdgeId:row.sourceEdgeId,
     sourceGeometryId:original.g.id,status:'collapsed-projection',
     m3SourceMatched:true,m4PartitionComplete:false,
     positiveM0M4Intervals:0,officialLineStyle:'undetermined'});
    continue;
   }
   if(row.status!=='audited-open-intervals')
    fail('M0 noncollapsed projected edge lost its source ray partitions');
   const m0Runs=row.runs;
   if(!Array.isArray(m0Runs))fail('missing authentic M0 source intervals');
   let cursor=0,positive=0;
   for(const segment of m4Segments){
    const [a,b]=segment.sourceParameterRange;
    if(a!==cursor)break;
    cursor=b;
    const p=project(interp(original.a,original.b,a))[view];
    const q=project(interp(original.a,original.b,b))[view];
    if(dist(segment.projectedFromModelMm,p)>1e-7||
       dist(segment.projectedToModelMm,q)>1e-7||
       segment.officialLineStyleVerified!==false||
       segment.v5ActionApproved!==false)
     fail('M4 generated source segment mismatches M3 original physical projection');
    for(const run of m0Runs){
     const range=run.originalSourceParameterRange;
     if(!Array.isArray(range)||range.length!==2)fail('M0 positive ray range missing');
     if(!overlap([a,b],range))continue;
     const left=run.visibilityEvidence,right=segment.openInteriorVisibility;
     if((left==='hidden-within-supplied-solids'&&right==='visible')||
        (left==='clear-within-supplied-solids'&&right==='hidden'))
      fail('M0 positive whole-open ray contradicts M4/M5 current stroke classification');
     if((left==='hidden-within-supplied-solids'&&right==='hidden')||
        (left==='clear-within-supplied-solids'&&right==='visible')){
      positive++;positives++;
      positiveRows.push({view,sourceEdgeId:row.sourceEdgeId,
       originalParameterRange:[Math.max(a,range[0]),Math.min(b,range[1])],
       certifiedOpenVisibility:right});
     }
    }
   }
   const full=cursor===1&&m4Segments.length>0&&
    m4Segments.at(-1).sourceParameterRange[1]===1;
   if(full)complete++;else incomplete++;
   verifiedM4.set(k,{m0Runs,m4Segments,full});
   views[view].push({sourceEdgeId:row.sourceEdgeId,
    sourceGeometryId:original.g.id,status:full?
     'original-M3-M4-partition-complete':'original-M4-partition-undetermined',
    m3SourceMatched:true,m4PartitionComplete:full,
    positiveM0M4Intervals:positive,officialLineStyle:'undetermined'});
  }
 }
 let physicalCount=0,physicalCorroborated=0,physicalUnknown=0;
 if(physicalM5Proof!==null){
  if(geometry.length!==1||physicalM5Proof.sourceGeometryId!==geometry[0].id||
     physicalM5Proof.revision!==revision||
     physicalM5Proof.schema!==
      'draftai-c1-single-reviewed-convex-physical-edge-stroke-proof/1')
   fail('actual C1 M5 line proof not bound to current one-solid M3 geometry');
  const recomputed=auditC1ReviewedConvexPhysicalEdgeStrokes({
   geometry:geometry[0],revision});
  if(JSON.stringify(recomputed)!==JSON.stringify(physicalM5Proof))
   fail('signed M5 physical edge candidates do not match real M0/M4/M5');
  for(const line of physicalM5Proof.signedCandidates){
   physicalCount++;
   const hit=verifiedM4.get(line.view+'|'+line.sourceEdgeId);
   const expected=line.officialEngineeringLineStyle===
    'gb-t-4457.4-continuous-wide-visible-outline'?'visible':
    line.officialEngineeringLineStyle===
    'gb-t-4457.4-thin-dashed-hidden-edge'?'hidden':null;
   if(!expected||!hit)fail('signed M5 3D physical source has no M0/M4 ledger');
   let agreed=false;
   for(const run of hit.m0Runs){
    if(!overlap(run.originalSourceParameterRange,line.originalParameterRange))
     continue;
    if((expected==='visible'&&run.visibilityEvidence===
        'hidden-within-supplied-solids')||
       (expected==='hidden'&&run.visibilityEvidence===
        'clear-within-supplied-solids'))
     fail('existing M5 certified engineering line contradicts actual M0 depth');
    if((expected==='visible'&&run.visibilityEvidence===
        'clear-within-supplied-solids')||
       (expected==='hidden'&&run.visibilityEvidence===
        'hidden-within-supplied-solids'))agreed=true;
   }
   if(agreed)physicalCorroborated++;
   else physicalUnknown++;
  }
 }
 return freeze({schema:'draftai-m0-m3-m4-m5-original-source-acceptance/1',
  revision,status:'bounded-original-source-math-acceptance',
  sourceGeometryIds:geometry.map(g=>g.id),
  originalEdgeViewCount:total,m3BoundSourceEdgeViews:m3Count,
  m4WholeSourcePartitionCount:complete,
  m4UnresolvedSourcePartitionCount:incomplete,
  independentlyPositiveM0M4Intervals:positives,
  mutuallyContradictoryIntervals:0,
  physicalM5CandidateCount:physicalCount,
  physicalM5SourceCorroboratedCount:physicalCorroborated,
  physicalM5UnresolvedComparisonCount:physicalUnknown,views,
  // A geometric consistency check does not replace C1/C2/C3 line-style
  // proofs, original exercise provenance, or the sole Intent->DAG->V5.
  fullSceneVerified:false,completeEngineeringLineStylesVerified:false,
  constructionIntentAuthorized:false,v5VerifiedExportReady:false
 });
}
module.exports={auditM0M3M4M5OriginalSources};
