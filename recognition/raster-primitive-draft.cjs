'use strict';
/**
 * V3.5 08-B: detector output -> UNCONFIRMED ProblemDraft in original image
 * pixels. Pixel geometry is neither CAD model-mm nor an exact math proof.
 */
const {newDraft}=require('./problem-draft.cjs');
const {locateCandidate}=require('./source-candidate-link.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const goodPoint=(p,w,h)=>p&&finite(p.x)&&finite(p.y)&&
 p.x>=0&&p.y>=0&&p.x<=w&&p.y<=h;
function candidateDraftFromRaster({image,analysis,lines=[],curves=[]}={}){
 if(!image||!analysis||!Array.isArray(lines)||!Array.isArray(curves)||
  lines.length>30||curves.length>25||lines.length+curves.length>50)
  throw new TypeError('bounded raster source and candidate arrays required');
 const w=analysis.width,h=analysis.height;
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<24||h<24||
   w>900||h>900||!Number.isSafeInteger(image.width)||
   !Number.isSafeInteger(image.height))
  throw new RangeError('analysis/original pixel frame is invalid');
 const sx=image.width/w,sy=image.height/h;
 if(!finite(sx)||!finite(sy)||sx<=0||sy<=0)
  throw new RangeError('invalid pixel frame scale');
 const scale=(sx+sy)*.5;
 const mapped=p=>({x:p.x*sx,y:p.y*sy});
 const used=new Set(),candidates=[],provenance=[];
 for(const raw of [...lines,...curves]){
  const located=locateCandidate(raw,analysis,image);
  if(used.has(raw.id))throw new TypeError('duplicate detector candidate ID');
  used.add(raw.id);
  if(!finite(raw.confidence)||raw.confidence<0||raw.confidence>1||
    typeof raw.method!=='string'||raw.method.length>70)
   throw new TypeError('invalid detector confidence and source method');
  let kind,geometry;
  if(raw.kind==='line'){
   if(!/^line_[0-9]+$/.test(raw.id)||!goodPoint(raw.from,w,h)||
     !goodPoint(raw.to,w,h)||
     Math.hypot(raw.from.x-raw.to.x,raw.from.y-raw.to.y)<1)
    throw new TypeError('line requires valid image-pixel endpoints');
   kind='segment';
   geometry={frame:'drawing-px',from:mapped(raw.from),to:mapped(raw.to)};
  }else if(raw.kind==='circle'||raw.kind==='arc'){
   if(!/^curve_[0-9]+$/.test(raw.id)||!goodPoint(raw.center,w,h)||
      !finite(raw.radius)||raw.radius<=0||
      // Nonuniform resized photos cannot be silently treated as circles.
      Math.abs(sx-sy)>scale*.005)
    throw new RangeError('circle/arc requires finite geometry and uniform image scaling');
   kind=raw.kind;
   geometry={frame:'drawing-px',center:mapped(raw.center),
     radiusPx:raw.radius*scale};
   if(raw.kind==='circle'){
    if(raw.center.x-raw.radius<-1.5||raw.center.x+raw.radius>w+1.5||
      raw.center.y-raw.radius<-1.5||raw.center.y+raw.radius>h+1.5)
     throw new RangeError('cropped detector circle requires manual geometry reconstruction');
   }else{
    if(!finite(raw.startAngle)||!finite(raw.endAngle)||
      !finite(raw.sweepDeg)||raw.startAngle<0||raw.startAngle>=360||
      raw.endAngle<0||raw.endAngle>=360||
      raw.sweepDeg<55||raw.sweepDeg>330||
      raw.sweepDirection!=='cw-screen')
     throw new TypeError('incomplete screen-space arc proposal');
    const radians=Math.PI/180;
    Object.assign(geometry,{startRad:raw.startAngle*radians,
      endRad:raw.endAngle*radians,direction:'cw'});
   }
  }else throw new TypeError('unsupported raw raster primitive kind');
  const [x,y,width,height]=located.bbox;
  candidates.push({
   id:raw.id,kind,reviewStatus:'unconfirmed',method:'detector',
   confidence:raw.confidence,bbox:{x,y,width,height},geometry
  });
  provenance.push({
   candidateId:raw.id,sourceMethod:located.sourceMethod,
   sourceCoordinateFrame:'image-px',
   drawingCoordinateFrame:'original-image-px',
   confidence:raw.confidence,
   sourceBBox:[...located.bbox],
   mathematicallyVerified:false
  });
 }
 const draft=newDraft({image,candidates});
 return {
  draft,provenance,modelUnits:null,
  geometryVerified:false,sourceScaleMathematicallyProven:false,
  solverReady:false,globallyUnique:null,
  unsupportedToExistingFiniteSolver:candidates.filter(x=>x.kind==='arc').map(x=>x.id)
 };
}
module.exports={candidateDraftFromRaster};
