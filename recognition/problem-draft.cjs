'use strict';
const {checkImage,checkMatrix,IDENTITY,mapPoint}=require('./page-transforms.cjs');
const VERSION='draftai-recognition/v0.1';
const KINDS=new Set(['segment','circle','arc','dimension','note']);
const STATES=new Set(['unconfirmed','confirmed','rejected']);
const METHODS=new Set(['manual','detector','ocr','synthetic']);
const DIMENSIONS=new Set(['radius','diameter','length','angle','unknown']);
const UNITS=new Set(['mm','deg',null]);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const idOk=x=>typeof x==='string'&&/^[a-zA-Z][\w:-]{0,63}$/.test(x);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const boundedText=(x,n=240)=>typeof x==='string'&&x.length<=n&&!/[\x00-\x1f]/.test(x);
const point=p=>plain(p)&&finite(p.x)&&finite(p.y)&&Math.abs(p.x)<=1e7&&Math.abs(p.y)<=1e7;

function checkBbox(b,image){
  if(!plain(b)||!['x','y','width','height'].every(k=>finite(b[k]))||b.width<=0||b.height<=0||
    b.x<0||b.y<0||b.x+b.width>image.width+1e-6||b.y+b.height>image.height+1e-6)
    throw new RangeError('invalid source-image bbox');
  return {x:b.x,y:b.y,width:b.width,height:b.height};
}
function geometryOf(c){
  const g=c.geometry;
  if(c.kind==='segment'){
    if(!plain(g)||g.frame!=='drawing-px'||!point(g.from)||!point(g.to)||
      Math.hypot(g.from.x-g.to.x,g.from.y-g.to.y)<=1e-9)
      throw new TypeError('segment requires nondegenerate drawing-px endpoints');
    return {frame:'drawing-px',from:{x:g.from.x,y:g.from.y},to:{x:g.to.x,y:g.to.y}};
  }
  if(c.kind==='circle'||c.kind==='arc'){
    if(!plain(g)||g.frame!=='drawing-px'||!point(g.center)||!finite(g.radiusPx)||g.radiusPx<=0)
      throw new TypeError('circle requires positive drawing-px radius and center');
    const out={frame:'drawing-px',center:{x:g.center.x,y:g.center.y},radiusPx:g.radiusPx};
    if(c.kind==='arc'){
      if(!finite(g.startRad)||!finite(g.endRad)||!['cw','ccw'].includes(g.direction)||
        Math.abs(g.startRad)>2*Math.PI||Math.abs(g.endRad)>2*Math.PI)
        throw new TypeError('arc requires explicit direction and finite radians');
      Object.assign(out,{startRad:g.startRad,endRad:g.endRad,direction:g.direction});
    }
    return out;
  }
  if(g!==null&&g!==undefined)throw new TypeError('dimension/note cannot carry unverified geometry');
  return null;
}
function dimensionOf(c){
  if(c.kind!=='dimension'){
    if(c.dimension!==null&&c.dimension!==undefined)throw new TypeError('dimension applies only to dimension candidates');
    return null;
  }
  const d=c.dimension;
  if(!plain(d)||!DIMENSIONS.has(d.kind)||!UNITS.has(d.unit)||!boundedText(d.rawText,80)||
    (d.value!==null&&(!finite(d.value)||d.value<=0))||
    !Array.isArray(d.refs)||d.refs.length>8||d.refs.some(x=>!idOk(x)))
    throw new TypeError('dimension needs bounded text, unit, refs and a positive value or null');
  if(d.kind==='unknown'&&(d.value!==null||d.unit!==null))
    throw new TypeError('unknown R/diameter interpretation must remain unresolved');
  if(d.kind==='angle'&&d.unit!==null&&d.unit!=='deg')throw new TypeError('angle uses deg or unresolved unit');
  if(d.kind!=='angle'&&d.unit==='deg')throw new TypeError('non-angle dimension cannot use degrees');
  if(c.reviewStatus==='confirmed'&&(
    d.kind==='unknown'||d.value===null||d.unit===null||d.refs.length===0))
    throw new TypeError('incomplete dimension cannot be confirmed');
  return {kind:d.kind,rawText:d.rawText,value:d.value,unit:d.unit,refs:[...d.refs]};
}
function validateDraft(input){
  if(!plain(input)||input.version!==VERSION||!Number.isSafeInteger(input.revision)||input.revision<0)
    throw new TypeError('invalid draft version/revision');
  const image=checkImage(input.image);
  const sourceToDrawing=checkMatrix(input.sourceToDrawing||IDENTITY);
  if(!Array.isArray(input.candidates)||input.candidates.length>512)
    throw new RangeError('invalid candidate collection');
  const ids=new Set();
  const candidates=input.candidates.map(c=>{
    if(!plain(c)||!idOk(c.id)||ids.has(c.id)||!KINDS.has(c.kind)||!STATES.has(c.reviewStatus)||
      !METHODS.has(c.method)||!finite(c.confidence)||c.confidence<0||c.confidence>1)
      throw new TypeError('invalid candidate id, kind, status, origin or confidence');
    ids.add(c.id);
    if(c.reviewStatus==='confirmed'&&c.reviewedBy!=='user')
      throw new TypeError('confirmed candidate requires explicit user review');
    const bbox=checkBbox(c.bbox,image);
    const geometry=geometryOf(c);
    const dimension=dimensionOf(c);
    if(c.kind==='note'&&!boundedText(c.text,240))throw new TypeError('invalid bounded note');
    // Never interpret text as instructions or pass it to a solver as a constraint.
    return {id:c.id,kind:c.kind,reviewStatus:c.reviewStatus,method:c.method,
      confidence:c.confidence,bbox,geometry,dimension,
      text:c.kind==='note'?c.text:null,reviewedBy:c.reviewStatus==='confirmed'?'user':null};
  });
  for(const c of candidates)if(c.dimension){
    if(c.dimension.refs.some(id=>!ids.has(id)||id===c.id))
      throw new TypeError('dimension reference missing or self-referential');
  }
  return {version:VERSION,revision:input.revision,image,sourceToDrawing,candidates,
    // This is only a candidate draft; neither solve nor animation proofs exist here.
    solverRevision:null,constructionRevision:null,proofOfCorrectness:false};
}

function newDraft({image,sourceToDrawing=IDENTITY,candidates=[]}={}){
  return validateDraft({version:VERSION,revision:0,image,sourceToDrawing,candidates});
}

function reviewCandidate(draft,{id,expectedRevision,patch={},decision}={}){
  const checked=validateDraft(draft);
  if(checked.revision!==expectedRevision)throw new RangeError('stale draft revision');
  if(!idOk(id)||!STATES.has(decision)||decision==='unconfirmed')
    throw new TypeError('review requires id and confirmed/rejected decision');
  if(!plain(patch)||Object.keys(patch).some(key=>!['bbox','geometry','dimension','text'].includes(key)))
    throw new TypeError('only editable geometry/dimension/bbox/text fields allowed');
  const index=checked.candidates.findIndex(c=>c.id===id);
  if(index<0)throw new RangeError('unknown candidate id');
  const candidates=checked.candidates.map((c,i)=>i!==index?c:{...c,...patch,
    reviewStatus:decision,reviewedBy:decision==='confirmed'?'user':null});
  return validateDraft({...checked,revision:checked.revision+1,candidates});
}

function draftReadiness(draft){
  const d=validateDraft(draft);
  const pending=d.candidates.filter(c=>c.reviewStatus==='unconfirmed').map(c=>c.id);
  const unresolved=d.candidates.filter(c=>c.reviewStatus!=='rejected'&&c.kind==='dimension'&&
    (c.dimension.kind==='unknown'||c.dimension.value===null||c.dimension.unit===null||
      c.dimension.refs.some(id=>d.candidates.find(x=>x.id===id)?.reviewStatus!=='confirmed'))).map(c=>c.id);
  const accepted=d.candidates.filter(c=>c.reviewStatus==='confirmed');
  const conflicts=[];
  const resolved=accepted.filter(c=>c.kind==='dimension');
  for(let i=0;i<resolved.length;i++)for(let j=i+1;j<resolved.length;j++){
    const a=resolved[i],b=resolved[j];
    if(a.dimension.refs.length!==1||b.dimension.refs.length!==1||
       a.dimension.refs[0]!==b.dimension.refs[0])continue;
    const da=a.dimension, db=b.dimension;
    const radius=dim=>dim.kind==='radius'?dim.value:
      dim.kind==='diameter'?dim.value/2:null;
    const ar=radius(da),br=radius(db);
    if(da.unit==='mm'&&db.unit==='mm'&&ar!==null&&br!==null&&
      Math.abs(ar-br)>1e-8*Math.max(1,ar,br))conflicts.push([a.id,b.id]);
    if(da.kind===db.kind&&da.unit===db.unit&&da.value!==null&&db.value!==null&&
      (ar===null||br===null)&&Math.abs(da.value-db.value)>1e-8*Math.max(1,da.value,db.value))
      conflicts.push([a.id,b.id]);
  }
  return {status:d.candidates.length&&accepted.length&&!pending.length&&!unresolved.length&&!conflicts.length?
      'candidate-reviewed':'needs-confirmation',
    revision:d.revision,confirmedCount:accepted.length,pendingIds:pending,unresolvedIds:unresolved,
    conflictingIds:conflicts,
    // Explicit 01 adapter + metric calibration + math solver remain required.
    modelUnitsVerified:false,solverReady:false,geometryVerified:false,globallyUnique:null};
}

function sourceBBoxToDrawingCorners(draft,id){
  const d=validateDraft(draft),c=d.candidates.find(x=>x.id===id);
  if(!c)throw new RangeError('unknown candidate');
  const {x,y,width,height}=c.bbox;
  return [{x,y},{x:x+width,y},{x:x+width,y:y+height},{x,y:y+height}]
    .map(p=>mapPoint(d.sourceToDrawing,p));
}
module.exports={VERSION,newDraft,validateDraft,reviewCandidate,draftReadiness,sourceBBoxToDrawingCorners};
