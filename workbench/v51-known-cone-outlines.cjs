'use strict';
const {project,toSheet}=require('../core/projection/conventions.js');
function knownConeOutlines(cone,transforms){
 const b=cone.baseCenter,r=cone.radiusMm,h=cone.heightMm;
 const apex={x:b.x,y:b.y,z:b.z+h};
 return ['V','H','W'].map(view=>{
 const p=q=>toSheet(view,project(q)[view],transforms[view]);
 if(view==='H'){const c=p(b);return {id:'known_cone_H',kind:'circle',attrs:{cx:c.x,cy:c.y,r:r*transforms.H.scale}};}
 const axis=view==='V'?'x':'y';
 const a=p({...b,[axis]:b[axis]-r}),c=p({...b,[axis]:b[axis]+r}),top=p(apex);
 return {id:'known_cone_'+view,kind:'path',attrs:{d:`M ${a.x} ${a.y} L ${top.x} ${top.y} L ${c.x} ${c.y} Z`}};
 });
}
module.exports={knownConeOutlines};
