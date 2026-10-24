'use strict';
/**
 * M0 shape-only bridge: x/y/z model coordinates <-> the ONE Euclidean
 * Float64 array kernel. Does not change physical units, infer a projection,
 * select a tolerance, certify topology, or approve SolveResult/V5.
 *
 * Consumers must retain their own mm bounds and specialist degeneracy gates.
 * Intermediate overflow and nonzero-product underflow fail closed at M0.
 */
const kernel=require('./euclidean-kernel.cjs');
const axes=Object.freeze(['x','y','z']);
function modelVector3(p){
 if(!p||typeof p!=='object'||Array.isArray(p)||
    !axes.every(k=>Object.hasOwn(p,k)))
  throw new TypeError('explicit 3D x/y/z model vector required');
 return kernel.vector(axes.map(k=>p[k]),3);
}
function object3(v){return {x:v[0],y:v[1],z:v[2]};}
function addObject3(a,b){
 return object3(kernel.add(modelVector3(a),modelVector3(b)));
}
function scaleObject3(v,factor){
 return object3(kernel.scale(modelVector3(v),factor));
}
function subtractObject3(a,b){
 return object3(kernel.subtract(modelVector3(a),modelVector3(b)));
}
function dotObject3(a,b){return kernel.dot(modelVector3(a),modelVector3(b));}
function crossObject3(a,b){
 return object3(kernel.cross3(modelVector3(a),modelVector3(b)));
}
function normObject3(a){return kernel.norm(modelVector3(a));}
module.exports={modelVector3,addObject3,scaleObject3,subtractObject3,dotObject3,crossObject3,normObject3};
