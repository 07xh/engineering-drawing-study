'use strict';
/**
 * DA-07 V5 animation adapter.
 * Only projects geometry emitted by existing R1/02 verified teaching or
 * exploratory candidate solvers. Animation is never an extra math solution.
 */
const Timeline=require('./teaching-timeline-v5.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function build({kind,centers,chosen,teaching,verified,revision,origin,scale,max}){
 if(!['circles','segments','segment-circle'].includes(kind)||
    !Number.isSafeInteger(revision)||revision<0||
    !origin||!finite(origin.x)||!finite(origin.y)||
    !finite(scale)||scale<=0||
    !Number.isInteger(max)||max<0||max>64)
  throw new TypeError('invalid V5 geometry playback envelope');
 const sheet=p=>{
  if(!p||!finite(p.x)||!finite(p.y))throw new TypeError('invalid solver point');
  return {x:origin.x+p.x*scale,y:origin.y-p.y*scale};
 };
 const line=obj=>obj?.a&&obj?.b?{kind:'line',
  geometry:{from:sheet(obj.a),to:sheet(obj.b)}}:null;
 const circle=obj=>obj?.center&&finite(obj.radius)&&obj.radius>0?{
  kind:'circle',geometry:{center:sheet(obj.center),radius:obj.radius*scale}}:null;
 const point=obj=>obj?{kind:'point',geometry:{center:sheet(obj),radius:4.5}}:null;
 let steps;
 if(verified){
  if(teaching?.status!=='ready'||teaching.revision!==revision||
     teaching.mathematicallyVerified!==true||!Array.isArray(teaching.steps)||
     teaching.steps.length!==max||!teaching.steps.length||
     !teaching.steps.at(-1).actions.some(a=>a.kind==='arc'))
   throw new TypeError('no consistent verified V5 fillet plan');
  steps=teaching.steps.map(s=>({id:s.id,role:s.role,
   actions:s.actions.map(a=>({...a}))}));
 }else{
  const groups=Array.from({length:max},()=>[]);
  const add=(i,...items)=>{
   if(!groups[i])return;
   const keys=new Set(groups[i].map(x=>JSON.stringify(x)));
   for(const a of items){
    if(!a)continue;
    const id=JSON.stringify(a);
    if(!keys.has(id)){groups[i].push(a);keys.add(id)}
   }
  };
  if(kind==='circles'){
   add(0,circle(centers?.auxiliary?.firstLocus),
    circle(centers?.auxiliary?.secondLocus));
   for(const c of centers?.candidates??[])add(1,point(c.center));
   if(chosen?.contacts)
    add(2,point(chosen.contacts.first),point(chosen.contacts.second));
  }else if(kind==='segments'){
   for(const c of centers?.candidates??[]){
    add(0,line(c.steps?.[0]?.geometry));
    add(1,line(c.steps?.[1]?.geometry));
    add(2,point(c.center));
   }
   for(const f of centers?.continuousFamilies??[]){
    add(0,line(f.firstOffsetLine));
    add(1,line(f.secondOffsetLine));
    if(f.start?.center&&f.end?.center)
     add(2,line({a:f.start.center,b:f.end.center}));
   }
  }else{
   add(0,line(centers?.auxiliary?.offsetLine));
   if(centers?.auxiliary?.circleCenter&&finite(centers.auxiliary.centerLocusRadius))
    add(1,circle({center:centers.auxiliary.circleCenter,
     radius:centers.auxiliary.centerLocusRadius}));
   for(const c of centers?.candidates??[])add(2,point(c.center));
  }
  steps=groups.map((actions,i)=>({
   id:'explore-'+(i+1),role:'auxiliary',
   actions:actions.map((a,j)=>({...a,id:'explore-action-'+i+'-'+j}))
  }));
 }
 // Preserve the existing step rhythm while each real action within a step
 // takes its own chronological part. Never fabricate an unverified final arc.
 const timeline=Timeline.compileTimeline(steps.map((step,i)=>{
  const duration=i===steps.length-1&&verified?1600:1200;
  const acts=step.actions.length?step.actions:[{
   id:'explore-wait-'+i,kind:'hold'}];
  return {id:step.id,dependsOn:i?[steps[i-1].id]:[],
   actions:acts.map(a=>({id:a.id,kind:a.kind,durationMs:duration/acts.length}))};
 }),{gapMs:0});
 return {status:'ready',revision,verified,steps,timeline};
}
function completedSteps(timeline,snapshot){
 if(!timeline||!snapshot)throw new TypeError('V5 clock required');
 return timeline.steps.filter(step=>step.endMs<=snapshot.elapsedMs).length;
}
module.exports={build,completedSteps};
