'use strict';
/**
 * #372 / #377 F1: independent drawing-space check on the real G1 fillet
 * before its V5 animation is exposed. No solver, intent or renderer fork.
 *
 * Checks contact endpoints and sweep against independently verified model-mm
 * candidate. This is a runtime boundary check, NOT proof of global uniqueness.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const point=x=>x!==null&&typeof x==='object'&&finite(x.x)&&finite(x.y);
const tolerance=(scale)=>Math.max(1e-7,Math.abs(scale)*1e-7);
const near=(a,b,epsilon)=>finite(a)&&finite(b)&&Math.abs(a-b)<=epsilon;
const nearPoint=(a,b,epsilon)=>point(a)&&point(b)&&
 near(a.x,b.x,epsilon)&&near(a.y,b.y,epsilon);
function assertVerifiedArcParity({sourceArc,contacts,sheet,action}={}){
 if(!sourceArc||!point(sourceArc.center)||!finite(sourceArc.radius)||
    sourceArc.radius<=0||!finite(sourceArc.startAngle)||
    !finite(sourceArc.endAngle)||!['cw','ccw'].includes(sourceArc.direction)||
    !contacts||!point(contacts.first)||!point(contacts.second)||
    !sheet||!point(sheet.origin)||!finite(sheet.scale)||sheet.scale<=0||
    !action||action.kind!=='arc'||!action.geometry)
  throw new TypeError('model arc, contacts, transform and V5 arc required');
 const g=action.geometry, scale=sheet.scale;
 if(!point(g.center)||!finite(g.radius)||g.radius<=0||
    !finite(g.startRadians)||!finite(g.sweepRadians))
  throw new TypeError('invalid V5 arc geometry');
 const expected={
  center:{x:sheet.origin.x+scale*sourceArc.center.x,
   y:sheet.origin.y-scale*sourceArc.center.y},
  radius:sourceArc.radius*scale,
  startRadians:-sourceArc.startAngle*Math.PI/180,
  sweepRadians:-(sourceArc.endAngle-sourceArc.startAngle)*Math.PI/180
 };
 const tol=tolerance(scale);
 if(!nearPoint(g.center,expected.center,tol)||
    !near(g.radius,expected.radius,tol)||
    !near(g.startRadians,expected.startRadians,1e-10)||
    !near(g.sweepRadians,expected.sweepRadians,1e-10)||
    Math.abs(expected.sweepRadians)<1e-12||
    Math.abs(expected.sweepRadians)>=2*Math.PI||
    Math.sign(g.sweepRadians)!==(sourceArc.direction==='cw'?1:-1))
  throw new RangeError('V5 arc violates proven model direction/size');
 const toSheet=p=>({x:sheet.origin.x+scale*p.x,
  y:sheet.origin.y-scale*p.y});
 const endpoint=theta=>({x:g.center.x+g.radius*Math.cos(theta),
  y:g.center.y+g.radius*Math.sin(theta)});
 const first=endpoint(g.startRadians);
 const last=endpoint(g.startRadians+g.sweepRadians);
 if(!nearPoint(first,toSheet(contacts.first),tol)||
    !nearPoint(last,toSheet(contacts.second),tol))
  throw new RangeError('V5 arc endpoints differ from solver-proven contacts');
 return true;
}
module.exports={assertVerifiedArcParity};
