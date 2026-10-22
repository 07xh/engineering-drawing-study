'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {analyzeSegmentTopology}=require('../../core/geometry/segment-topology2d.cjs');
const mm=(a,b)=>({frame:'model-mm-2d',unit:'mm',
 from:{x:a[0],y:a[1]},to:{x:b[0],y:b[1]}});
const tri=(a,b,c)=>{
 const x=BigInt(b[0]-a[0])*BigInt(c[1]-a[1])-
  BigInt(b[1]-a[1])*BigInt(c[0]-a[0]);
 return x<0n?-1:x>0n?1:0;
};
const bounds=(a,b,p)=>p[0]>=Math.min(a[0],b[0])&&p[0]<=Math.max(a[0],b[0])&&
 p[1]>=Math.min(a[1],b[1])&&p[1]<=Math.max(a[1],b[1]);
function oracle(a,b,c,d){
 const [abC,abD,cdA,cdB]=[tri(a,b,c),tri(a,b,d),tri(c,d,a),tri(c,d,b)];
 if([abC,abD,cdA,cdB].every(v=>v===0)){
  const axis=a[0]===b[0]?1:0;
  const minA=Math.min(a[axis],b[axis]),maxA=Math.max(a[axis],b[axis]);
  const minB=Math.min(c[axis],d[axis]),maxB=Math.max(c[axis],d[axis]);
  const low=Math.max(minA,minB),high=Math.min(maxA,maxB);
  if(high<low)return 'disjoint';
  if(high===low)return 'endpoint-touch';
  const exactSame=(a[0]===c[0]&&a[1]===c[1]&&b[0]===d[0]&&b[1]===d[1])||
    (a[0]===d[0]&&a[1]===d[1]&&b[0]===c[0]&&b[1]===c[1]);
  return exactSame?'coincident':'collinear-overlap';
 }
 if(abC*abD<0&&cdA*cdB<0)return 'proper-crossing';
 if(abC===0&&bounds(a,b,c)||abD===0&&bounds(a,b,d)||
    cdA===0&&bounds(c,d,a)||cdB===0&&bounds(c,d,b))
  return 'endpoint-touch';
 return 'disjoint';
}
const actual=(a,b,c,d)=>analyzeSegmentTopology({first:mm(a,b),second:mm(c,d)});
test('09 independent integer BigInt topology oracle validates 1536 real M1 segment pairs',()=>{
 let seed=0x62371231;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return (seed%101)-50;};
 let count=0;
 for(let i=0;i<1536;i++){
  const a=[rand(),rand()],b=[rand(),rand()],c=[rand(),rand()],d=[rand(),rand()];
  if(a.every((v,j)=>v===b[j])||c.every((v,j)=>v===d[j]))continue;
  const expected=oracle(a,b,c,d),result=actual(a,b,c,d);
  assert.equal(result.relation,expected,'integer oracle iteration '+i);
  assert.equal(result.intersects,expected!=='disjoint','intersection flag iteration '+i);
  if(expected==='proper-crossing')assert.equal(result.intersectionPoint,null);
  count++;
 }
 assert.ok(count>1500);
});
test('09 independent overlap oracle tests all orientations and finite endpoint boundaries',()=>{
 const all=[
  [[0,0],[8,8],[3,3],[10,10]],
  [[8,8],[0,0],[10,10],[3,3]],
  [[2,0],[2,20],[2,10],[2,30]],
  [[4,4],[8,8],[8,8],[9,9]],
  [[4,4],[8,8],[9,9],[10,10]],
  [[2,0],[2,20],[2,0],[2,20]],
  [[8,8],[4,4],[4,4],[8,8]],
  [[-8,9],[3,4],[3,4],[3,4.5]]
 ];
 for(const [a,b,c,d] of all){
  if(![a,b,c,d].every(p=>Number.isInteger(p[0])&&Number.isInteger(p[1])))continue;
  assert.equal(actual(a,b,c,d).relation,oracle(a,b,c,d));
 }
});
test('09 finite powers-of-two scale and exact integer translations preserve topology',()=>{
 const cases=[
  [[0,0],[8,8],[0,8],[8,0]],
  [[0,0],[8,8],[4,4],[12,12]],
  [[0,0],[8,8],[9,9],[12,12]],
  [[0,0],[8,8],[8,8],[12,0]]
 ];
 for(const points of cases){
  const [a,b,c,d]=points,baseline=actual(a,b,c,d).relation;
  for(const scale of [2**-20,1,2**20]){
   const t=p=>[p[0]*scale+256*scale,p[1]*scale-512*scale];
   assert.equal(actual(t(a),t(b),t(c),t(d)).relation,baseline);
  }
 }
});
test('09 exact very small gap is not silently considered a contact',()=>{
 const eps=Number.MIN_VALUE;
 const r=actual([0,0],[eps,0],[0,eps],[eps,eps]);
 assert.equal(r.relation,'disjoint');
 assert.equal(r.globallyUnique,null);assert.equal(r.exactForBinary64Inputs,true);
 assert.equal(r.sourceGeometryVerified,false);
});
test('09 reject wrong coordinates and preserve source immutability under analysis',()=>{
 const first=mm([0,0],[10,10]),second=mm([0,10],[10,0]);
 const clone=structuredClone({first,second});
 assert.throws(()=>analyzeSegmentTopology({first:{...first,unit:'px'},second}),/model-mm/);
 assert.throws(()=>analyzeSegmentTopology({first,second:{...second,frame:'sheet-px'}}),/model-mm/);
 assert.equal(analyzeSegmentTopology({first,second}).relation,'proper-crossing');
 assert.deepEqual({first,second},clone);
});
