'use strict';

/** Image/paper transforms stay in pixel coordinates. They are NOT model-mm calibration. */
const finite = v => typeof v === 'number' && Number.isFinite(v);
const MAX_IMAGE_PIXELS = 32_000_000;
const MAX_SIDE = 12000;
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_MEDIA = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

function checkImage(image) {
  if (!image || typeof image !== 'object' || Array.isArray(image)) throw new TypeError('image metadata required');
  const {width, height, byteLength, mediaType} = image;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
      width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_IMAGE_PIXELS)
    throw new RangeError('image dimensions out of bounds');
  if (!Number.isInteger(byteLength) || byteLength < 1 || byteLength > MAX_BYTES)
    throw new RangeError('image byteLength out of bounds');
  if (!ALLOWED_MEDIA.has(mediaType)) throw new TypeError('unsupported image media type');
  // Metadata validation does not verify file magic, decode bytes, or protect a server upload.
  return {width, height, byteLength, mediaType};
}

function checkMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== 9 || matrix.some(v => !finite(v)))
    throw new TypeError('homography must be nine finite entries');
  if (Math.max(...matrix.map(Math.abs)) > 1e12) throw new RangeError('homography entries too large');
  const a = matrix;
  const det = a[0] * (a[4]*a[8]-a[5]*a[7]) -
              a[1] * (a[3]*a[8]-a[5]*a[6]) +
              a[2] * (a[3]*a[7]-a[4]*a[6]);
  const scale = Math.max(...a.map(Math.abs));
  if (scale === 0 || !finite(det) || Math.abs(det) <= 1e-13 * scale ** 3)
    throw new RangeError('singular or unstable homography');
  return matrix.slice();
}

const IDENTITY = Object.freeze([1,0,0, 0,1,0, 0,0,1]);

function mapPoint(matrix, point) {
  const m = checkMatrix(matrix);
  if (!point || !finite(point.x) || !finite(point.y)) throw new TypeError('finite point required');
  const w = m[6] * point.x + m[7] * point.y + m[8];
  const scale = Math.abs(m[6] * point.x) + Math.abs(m[7] * point.y) + Math.abs(m[8]);
  if (!finite(w) || Math.abs(w) <= 1e-13 * scale) throw new RangeError('point maps to infinity');
  const x = (m[0]*point.x + m[1]*point.y + m[2])/w;
  const y = (m[3]*point.x + m[4]*point.y + m[5])/w;
  if (!finite(x) || !finite(y)) throw new RangeError('transformed point not finite');
  return {x,y};
}

function invert(matrix) {
  const m = checkMatrix(matrix);
  const c = [m[4]*m[8]-m[5]*m[7],m[2]*m[7]-m[1]*m[8],m[1]*m[5]-m[2]*m[4],
    m[5]*m[6]-m[3]*m[8],m[0]*m[8]-m[2]*m[6],m[2]*m[3]-m[0]*m[5],
    m[3]*m[7]-m[4]*m[6],m[1]*m[6]-m[0]*m[7],m[0]*m[4]-m[1]*m[3]];
  const det = m[0]*c[0]+m[1]*c[3]+m[2]*c[6];
  return checkMatrix(c.map(v=>v/det));
}

function checkCorners(corners) {
  if (!Array.isArray(corners) || corners.length !== 4 || corners.some(p =>
    !p || !finite(p.x) || !finite(p.y) || Math.abs(p.x) > 1e6 || Math.abs(p.y) > 1e6))
    throw new TypeError('four ordered finite page corners required');
  // Check quadrilateral area and convex winding. Degenerate / crossed corners cannot calibrate perspective.
  let winding = 0;
  for (let i=0;i<4;i++) {
    const a = corners[i], b = corners[(i+1)%4], c = corners[(i+2)%4];
    const cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
    if (Math.abs(cross)<1e-9) throw new RangeError('degenerate page corners');
    const sign=Math.sign(cross);
    if (winding && sign!==winding) throw new RangeError('crossed or concave page corners');
    winding=sign;
  }
  return corners;
}

function homographyFromCorners(sourceCorners,targetCorners) {
  const from=checkCorners(sourceCorners),to=checkCorners(targetCorners);
  // Direct linear transform for 4 correspondences, h33 = 1. This is an
  // offline coordinate helper, not image warping/OCR or metric calibration.
  const A=[];
  for(let i=0;i<4;i++) {
    const {x,y}=from[i], {x:u,y:v}=to[i];
    A.push([x,y,1,0,0,0,-u*x,-u*y,u]);
    A.push([0,0,0,x,y,1,-v*x,-v*y,v]);
  }
  for (let col=0;col<8;col++) {
    let best=col;
    for (let row=col+1;row<8;row++) if (Math.abs(A[row][col])>Math.abs(A[best][col])) best=row;
    if (Math.abs(A[best][col])<1e-11) throw new RangeError('page transform ill-conditioned');
    [A[col],A[best]]=[A[best],A[col]];
    const pivot=A[col][col];
    for(let j=col;j<=8;j++) A[col][j]/=pivot;
    for(let row=0;row<8;row++) if(row!==col) {
      const v=A[row][col];
      for(let j=col;j<=8;j++) A[row][j]-=v*A[col][j];
    }
  }
  const m=A.map(r=>r[8]);m.push(1);
  checkMatrix(m);
  for(let i=0;i<4;i++) {
    const q=mapPoint(m,from[i]);
    if(Math.hypot(q.x-to[i].x,q.y-to[i].y)>1e-5)
      throw new RangeError('page corner residual too large');
  }
  return m;
}

function pageTransform(image, sourceCorners, outputWidth, outputHeight) {
  const metadata=checkImage(image);
  if (!Number.isInteger(outputWidth)||!Number.isInteger(outputHeight)||outputWidth<1||outputHeight<1||
      outputWidth>MAX_SIDE||outputHeight>MAX_SIDE||outputWidth*outputHeight>MAX_IMAGE_PIXELS)
    throw new RangeError('normalized drawing pixels out of bounds');
  const corners=checkCorners(sourceCorners);
  for(const p of corners) if(p.x<0||p.x>metadata.width||p.y<0||p.y>metadata.height)
    throw new RangeError('page corners outside the image');
  const target=[{x:0,y:0},{x:outputWidth,y:0},{x:outputWidth,y:outputHeight},{x:0,y:outputHeight}];
  const sourceToDrawing=homographyFromCorners(corners,target);
  return {coordinateFrame:'drawing-px',sourceToDrawing,drawingToSource:invert(sourceToDrawing),
    outputWidth,outputHeight,modelUnits:null,metricCalibrationVerified:false};
}

module.exports={IDENTITY,checkImage,checkMatrix,mapPoint,invert,homographyFromCorners,pageTransform};
