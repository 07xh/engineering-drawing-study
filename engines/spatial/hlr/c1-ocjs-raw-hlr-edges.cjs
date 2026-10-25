'use strict';
/**
 * Native OpenCascade.js BRep projected SHARP edge reader.
 * Shared by REAL visible VCompound and hidden HCompound. HLR output
 * TopoDS edges are 2D drawing geometry; surface pcurves are allowed.
 * The reader never asserts an original 3D TopoDS source or a GB line style.
 */
const {verifyOcjsHLRProjectedLineCurveWitness}=
 require('./c1-ocjs-output-curve-witness.cjs');
function readRealOcjsSharpHLREdge({oc,edge,view,vertexType,avoid,newObj,hold}={}){
 const method=(owner,key)=>{
  if(typeof owner?.[key]!=='function')
   throw new TypeError('pinned OCJS HLR missing '+key);
  return owner[key];
 };
 const vs=newObj('TopExp_Explorer_2',edge,vertexType,avoid);
 const coords=[];
 while(vs.More()){
  const shape=hold(vs.Current());
  const vertex=hold(method(oc.TopoDS,'Vertex_1')(shape));
  const p=hold(method(oc.BRep_Tool,'Pnt')(vertex));
  if(![p.X(),p.Y(),p.Z()].every(Number.isFinite)||Math.abs(p.Z())>1e-6)
   throw new RangeError('nonfinite or nonplanar real HLR BRep vertex');
  coords.push({u:p.X(),v:-p.Y()});
  if(coords.length>2)
   throw new RangeError('nonsegment HLR BRep source edge');
  vs.Next();
 }
 if(coords.length!==2)throw new RangeError('real HLR BRep sharp edge lacks two vertices');
 if(Math.hypot(coords[0].u-coords[1].u,coords[0].v-coords[1].v)<=1e-7)
  return null;
 const edgeType=hold(method(oc.TopoDS,'Edge_1')(edge));
 const adaptor=newObj('BRepAdaptor_Curve_2',edgeType);
 const kind=oc.GeomAbs_CurveType?.GeomAbs_Line??oc.GeomAbs_Line;
 const is3D=adaptor.Is3DCurve();
 if(kind===undefined||adaptor.GetType()!==kind||typeof is3D!=='boolean')
  throw new RangeError('measured real HLR output sharp edge is not a valid line curve');
 const first=adaptor.FirstParameter(),last=adaptor.LastParameter();
 if(![first,last].every(Number.isFinite)||last<=first)
  throw new RangeError('real HLR sharp edge has invalid curve parameter domain');
 const point=t=>{
  const p=hold(adaptor.Value(t));
  return {x:p.X(),y:p.Y(),z:p.Z()};
 };
 const witness=verifyOcjsHLRProjectedLineCurveWitness({
  view,projectedEndpoints:coords,parameterRange:[first,last],
  curveSamples:[0,0.25,0.5,0.75,1].map(f=>
   point(first+(last-first)*f)),curveKind:'line',curveIs3D:is3D
 });
 return {view,from:coords[0],to:coords[1],...witness};
}
module.exports={readRealOcjsSharpHLREdge};
