'use strict';
/** Original first-angle GIVEN-only C1 paper. Source LINEs stay unsigned. */
const {buildC1DxfGivenFirstPaper}=require('../workbench/c1-dxf-given-first-paper.cjs');
const {VIEWS}=require('../core/projection/conventions.js');
function createC1OriginalGivenPaperSvg(packet,node){
 const paper=buildC1DxfGivenFirstPaper(packet);
 const outer=node('svg',{viewBox:'0 0 960 720',
  'data-c1-paper-mode':'given','data-missing-view':paper.missingView,
  'aria-label':'原题已知点；待补第三视图留白'});
 const labels={V:{x:130,y:38},H:{x:130,y:664},W:{x:640,y:38}};
 const blanks={V:{x:150,y:150},H:{x:150,y:510},W:{x:625,y:170}};
 for(const view of VIEWS){
  const source=paper.views[view],pos=labels[view];
  const group=node('g',{'data-view':view,'data-source-role':source.sourceRole});
  const title=node('text',{x:pos.x,y:pos.y,'font-size':18,
   fill:source.sourceRole==='GIVEN'?'#1b547c':'#8b5d24'});
  title.textContent=view+(source.sourceRole==='GIVEN'?' · 原题已知点':' · 待补空白');
  group.append(title);
  if(source.sourceRole==='UNKNOWN'){
   const blank=node('text',{x:blanks[view].x,y:blanks[view].y,
    fill:'#8d98a5','font-size':16,'data-c1-unanswered-view':view});
   blank.textContent='待求 · 未作答';group.append(blank);
  }else{
   // Original DXF source LINEs are GIVEN evidence, never formal GB/V5.
   for(const stroke of source.strokes){
    if(stroke.view!==view||stroke.authorizedV5Action!==false||
       stroke.officialEngineeringLineStyle!=='undetermined')
     throw new RangeError('unsigned original GIVEN LINE attempted to sign V5');
    const line=node('line',{x1:stroke.fromPaper.x,y1:stroke.fromPaper.y,
     x2:stroke.toPaper.x,y2:stroke.toPaper.y,
     stroke:'#466784','stroke-width':1.7,
     'data-original-given-stroke':'source-only',
     'data-source-handle':stroke.sourceHandle,
     'data-source-kind':stroke.sourceKind,
     'data-source-linetype':stroke.sourceLinetype,
     'data-official-line-style':'undetermined',
     'data-v5-action-authorized':'false'});
    const tip=node('title');
    tip.textContent=view+' CAD '+stroke.sourceHandle+' / '+
     stroke.sourceKind+' / '+stroke.sourceLinetype+
     '（仅原始图线，不是已签收的工程虚实线）';
    line.append(tip);group.append(line);
   }
   for(const point of source.points){
   group.append(node('circle',{cx:point.paper.x,cy:point.paper.y,r:4.3,
    fill:'#216b9b','data-given-point-index':point.index,
    'data-source-point-only':'true'}));
   const label=node('text',{x:point.paper.x+6,y:point.paper.y-7,
    fill:'#174f78','font-size':13,'data-original-point-label':point.index});
   label.textContent=String(point.index);group.append(label);
   }
  }
  outer.append(group);
 }
 return {paper,outer};
}
module.exports={createC1OriginalGivenPaperSvg};
