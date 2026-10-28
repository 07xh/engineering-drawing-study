'use strict';
// C3 is a manually-reviewed model-mm input, never a guessed photo solution.
const KEYS=Object.freeze(['zRadius','zX','zY','zMin','zMax','yRadius','yX','yZ','yMin','yMax']);
function makeReviewedC3Input(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||
   Object.keys(value).sort().join(',')!==KEYS.slice().sort().join(','))
  throw new TypeError('C3 需要两个正交有限圆柱的十项已确认毫米参数');
 const a=Object.fromEntries(KEYS.map(k=>[k,value[k]]));
 if(Object.values(a).some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>100000)||
    a.zRadius<=0||a.yRadius<=0||
    a.zMin>=a.zMax||a.yMin>=a.yMax)
  throw new RangeError('半径必须为正数，轴向上下界必须递增且所有量为有限毫米数值');
 return {kind:'finite-orthogonal-cylinder-intersection',sourceConfirmed:true,unit:'mm',
  zCylinder:{radius:a.zRadius,xCenter:a.zX,yCenter:a.zY,zMin:a.zMin,zMax:a.zMax},
  yCylinder:{radius:a.yRadius,xCenter:a.yX,zCenter:a.yZ,yMin:a.yMin,yMax:a.yMax}};
}
function c3SheetTransforms(input){
 const Z=input.zCylinder,Y=input.yCylinder;
 const range=Math.max(1,Math.abs(Z.xCenter)+Z.radius,Math.abs(Y.xCenter)+Y.radius,
  Math.abs(Z.yCenter)+Z.radius,Math.abs(Y.yMin),Math.abs(Y.yMax),
  Math.abs(Y.zCenter)+Y.radius,Math.abs(Z.zMin),Math.abs(Z.zMax));
 const scale=Math.min(4,75/range);
 return {V:{origin:{x:215,y:125},scale},
  H:{origin:{x:215,y:325},scale},
  W:{origin:{x:510,y:125},scale}};
}
module.exports={KEYS,makeReviewedC3Input,c3SheetTransforms};
