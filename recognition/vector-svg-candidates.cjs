'use strict';

/** V3.1 08-B1: strictly offline SVG-vector import, NOT bitmap/OCR recognition. */
const {newDraft, draftReadiness} = require('./problem-draft.cjs');
const {checkImage} = require('./page-transforms.cjs');
const MAX_SOURCE_BYTES = 250_000;
const MAX_GEOMETRIES = 128;
const MAX_LABELS = 48;
const ALLOWED = Object.freeze({
  svg: new Set(['xmlns','width','height','viewBox']),
  g: new Set(['fill','stroke','stroke-width','stroke-dasharray','opacity','font-family','font-size']),
  rect: new Set(['x','y','width','height','fill','stroke']),
  line: new Set(['x1','y1','x2','y2','stroke','stroke-width','fill']),
  circle: new Set(['cx','cy','r','stroke','stroke-width','fill']),
  path: new Set(['d','stroke','stroke-width','stroke-dasharray','fill']),
  text: new Set(['x','y','font-family','font-size','fill'])
});
const finite = x => typeof x === 'number' && Number.isFinite(x);
const number = (x,key) => {
  if(typeof x!=='string'||!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(x))
    throw new TypeError('missing or invalid SVG '+key);
  const n=Number(x);
  if(!finite(n)||Math.abs(n)>1e7)throw new RangeError('SVG '+key+' outside bounded range');
  return n;
};
function attrs(raw,tag){
  const a={};let rest=raw;
  const re=/\s+([A-Za-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for(const m of raw.matchAll(re)){
    const key=m[1];
    if(!ALLOWED[tag].has(key)||Object.hasOwn(a,key))throw new TypeError('unsupported SVG '+tag+' attribute');
    a[key]=m[2]===undefined?m[3]:m[2];
  }
  rest=raw.replace(re,'').trim();
  if(rest)throw new TypeError('invalid SVG attributes');
  return a;
}
function clampBBox(x,y,width,height,img){
  const left=Math.max(0,Math.min(x,img.width)),top=Math.max(0,Math.min(y,img.height));
  const right=Math.min(img.width,Math.max(left+0.5,x+width));
  const bottom=Math.min(img.height,Math.max(top+0.5,y+height));
  if(![left,top,right,bottom].every(finite)||right<=left||bottom<=top)
    throw new RangeError('SVG shape outside image');
  return {x:left,y:top,width:right-left,height:bottom-top};
}
function shapeBox(points,img){
  if(points.some(p=>!finite(p.x)||!finite(p.y)||p.x<0||p.y<0||p.x>img.width||p.y>img.height))
    throw new RangeError('SVG geometry must lie within the source image');
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const x=Math.min(...xs),y=Math.min(...ys);
  return clampBBox(Math.max(0,x-1),Math.max(0,y-1),Math.max(...xs)-x+2,Math.max(...ys)-y+2,img);
}
function pathSegments(d){
  if(typeof d!=='string'||d.length>8192)throw new TypeError('bounded SVG path required');
  const re=/[MmLlHhVvZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
  const tokens=[...d.matchAll(re)].map(x=>x[0]);
  if(!tokens.length||d.replace(re,'').replace(/[\s,]/g,'')!=='')
    throw new TypeError('unsupported SVG path syntax');
  const isCmd=t=>/^[MmLlHhVvZz]$/.test(t);
  const count={M:2,L:2,H:1,V:1,Z:0};
  let i=0,cmd=null,here=null,start=null;
  const segments=[];
  while(i<tokens.length){
    if(isCmd(tokens[i]))cmd=tokens[i++];
    if(!cmd)throw new TypeError('SVG path missing command');
    const key=cmd.toUpperCase(),n=count[key];
    if(key==='Z'){
      if(!here||!start)throw new TypeError('SVG path has no subpath to close');
      if(Math.hypot(here.x-start.x,here.y-start.y)>1e-9)segments.push({from:here,to:start});
      here=start;cmd=null;continue;
    }
    if(i+n>tokens.length||tokens.slice(i,i+n).some(isCmd))
      throw new TypeError('SVG path has incomplete coordinates');
    const values=tokens.slice(i,i+n).map((v,j)=>number(v,'path-'+j));i+=n;
    let next;
    if(key==='M'||key==='L')next={x:values[0],y:values[1]};
    else if(key==='H')next={x:values[0],y:here?.y};
    else next={x:here?.x,y:values[0]};
    if(!here&&key!=='M')throw new TypeError('SVG path must start with move');
    if(cmd===cmd.toLowerCase()&&here){
      if(key==='H')next.x+=here.x;
      else if(key==='V')next.y+=here.y;
      else {next.x+=here.x;next.y+=here.y;}
    }
    if(key==='M'){here=next;start=next;cmd=(cmd==='m'?'l':'L');}
    else {
      if(Math.hypot(here.x-next.x,here.y-next.y)>1e-9)
        segments.push({from:here,to:next});
      here=next;
    }
    if(segments.length>MAX_GEOMETRIES)throw new RangeError('too many SVG path segments');
  }
  if(!segments.length)throw new RangeError('zero-length SVG segment');
  return segments;
}
function parseVectorLabel(value){
  if(typeof value!=='string'||value.length>80)throw new TypeError('bounded SVG label required');
  const text=value.trim();
  const match=/^([RrΦØ⌀])\s*(\d+(?:\.\d+)?)$/.exec(text);
  if(match){
    const n=Number(match[2]);
    return {kind:match[1].toUpperCase()==='R'?'radius':'diameter',value:finite(n)&&n>0?n:null,
      unit:null,rawText:text,refs:[]};
  }
  const angle=/^(\d+(?:\.\d+)?)\s*°$/.exec(text);
  if(angle){
    const n=Number(angle[1]);
    return {kind:'angle',value:finite(n)&&n>0?n:null,unit:'deg',rawText:text,refs:[]};
  }
  return null;
}
function extractSvgCandidates(source){
  if(typeof source!=='string'||Buffer.byteLength(source,'utf8')>MAX_SOURCE_BYTES)
    throw new RangeError('offline SVG source exceeds limit');
  if(/<!|<\?|&(?:#|[a-zA-Z])|[\x00-\x08\x0b-\x1f]/.test(source))
    throw new TypeError('unsupported SVG declarations, entities or control characters');
  const tokens=source.match(/<[^>]*>|[^<]+/g)||[];
  if(tokens.join('')!==source)throw new TypeError('malformed SVG source');
  const stack=[],geometries=[],labels=[];
  let img=null,rootClosed=false;
  const addSegment=(a,b)=>{
    if(geometries.length>=MAX_GEOMETRIES)throw new RangeError('too many SVG shapes');
    if(Math.hypot(a.x-b.x,a.y-b.y)<=1e-9)throw new RangeError('zero-length SVG segment');
    const index=geometries.length+1;
    geometries.push({id:'segment-'+index,kind:'segment',reviewStatus:'unconfirmed',method:'detector',
      confidence:0.9,bbox:shapeBox([a,b],img),geometry:{frame:'drawing-px',from:a,to:b}});
  };
  for(const token of tokens){
    if(!token.startsWith('<')){
      if(stack.at(-1)?.name==='text')stack.at(-1).body+=token;
      else if(token.trim())throw new TypeError('unexpected SVG text');
      continue;
    }
    if(/^<\//.test(token)){
      const name=token.slice(2,-1).trim();
      const top=stack.pop();
      if(!top||top.name!==name)throw new TypeError('mismatched SVG tags');
      if(name==='svg'){rootClosed=true;continue;}
      if(name==='text'){
        if(labels.length>=MAX_LABELS)throw new RangeError('too many SVG labels');
        const label=top.body.trim(), x=number(top.attrs.x,'text x'), y=number(top.attrs.y,'text y');
        const size=top.attrs['font-size']===undefined?16:number(top.attrs['font-size'],'font-size');
        if(size<=0||size>200)throw new RangeError('unsupported font size');
        const dim=parseVectorLabel(label);
        const b=clampBBox(x,Math.max(0,y-size),Math.max(4,label.length*size*.7),size+2,img);
        const id='label-'+(labels.length+1);
        labels.push(dim?{id,kind:'dimension',reviewStatus:'unconfirmed',method:'detector',
          confidence:.7,bbox:b,dimension:dim}:{id,kind:'note',reviewStatus:'unconfirmed',
          method:'detector',confidence:.5,bbox:b,text:label});
      }
      continue;
    }
    if(rootClosed)throw new TypeError('SVG trailing content');
    const match=/^<([a-z]+)([\s\S]*?)(\/?)>$/.exec(token);
    if(!match||!Object.hasOwn(ALLOWED,match[1]))throw new TypeError('SVG element is unsupported');
    const [,tag,raw,short]=match;
    const a=attrs(raw,tag);
    if(stack.some(item=>item.name==='text'))throw new TypeError('nested text markup unsupported');
    if(!img){
      if(tag!=='svg')throw new TypeError('SVG root missing');
      const width=number(a.width,'width'),height=number(a.height,'height');
      const v=a.viewBox?.split(/[ ,]+/).map(Number);
      if(v&&(v.length!==4||v.some(x=>!finite(x))||v[0]!==0||v[1]!==0||v[2]!==width||v[3]!==height))
        throw new TypeError('SVG viewBox transform not supported');
      img=checkImage({width,height,byteLength:Buffer.byteLength(source,'utf8'),mediaType:'image/svg+xml'});
    } else if(tag==='svg')throw new TypeError('nested SVG not supported');
    if(tag==='line')addSegment({x:number(a.x1,'x1'),y:number(a.y1,'y1')},{x:number(a.x2,'x2'),y:number(a.y2,'y2')});
    if(tag==='circle'){
      const center={x:number(a.cx,'cx'),y:number(a.cy,'cy')},radiusPx=number(a.r,'r');
      if(radiusPx<=0)throw new RangeError('circle radius must be positive');
      if(geometries.length>=MAX_GEOMETRIES)throw new RangeError('too many SVG shapes');
      const c={x:center.x-radiusPx,y:center.y-radiusPx},q={x:center.x+radiusPx,y:center.y+radiusPx};
      geometries.push({id:'circle-'+(geometries.length+1),kind:'circle',reviewStatus:'unconfirmed',
        method:'detector',confidence:.9,bbox:shapeBox([c,q],img),geometry:{frame:'drawing-px',center,radiusPx}});
    }
    if(tag==='path')for(const seg of pathSegments(a.d))addSegment(seg.from,seg.to);
    // 'rect' is used only for background and not interpreted as engineering geometry.
    if(!short)stack.push({name:tag,attrs:a,body:''});
    else if(tag==='svg'||tag==='text')throw new TypeError('SVG root and text must have explicit closing tag');
  }
  if(stack.length||!rootClosed||!img)throw new TypeError('incomplete SVG document');
  const draft=newDraft({image:img,candidates:[...geometries,...labels]});
  return {format:'svg-vector-subset-v1',draft,readiness:draftReadiness(draft),
    metadata:{geometryCandidates:geometries.length,labelCandidates:labels.length,
      actualOcrPerformed:false,rasterDecoded:false,dimensionAssociationsVerified:false,
      sourceCoordinateFrame:'drawing-px'}};
}
module.exports={extractSvgCandidates,parseVectorLabel,pathSegments};
