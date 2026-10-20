(function(){'use strict';
const audit=window.ChapterFidelityAudit,library=window.VerifiedExerciseGeometry,$=id=>document.getElementById(id);
if(!audit||!library){$('found').textContent='数据暂时不可用，请检查站点构建。';return}
const entries=audit.scan(id=>library.get(id)),stats=audit.totals(entries);
function el(tag,value,cls){
 const d=document.createElement(tag);if(value!==undefined)d.textContent=value;
 if(cls)d.className=cls;return d;
}
for(const [n,label] of [[stats.tasks,'章节习题'],[stats.partial,'部分已录入'],[stats.rawObjects,'原图数据对象'],[stats.blocked,'尚未开放标准答案']]){
 const d=el('div',undefined,'stat');d.append(el('strong',String(n)),el('span',label));$('statistics').append(d);
}
function find(){
 const s=$('section').value,q=$('query').value.trim().toLowerCase(),f=$('filter').value;
 return entries.filter(e=>(s==='all'||e.id.startsWith(s+'-'))&&(!q||[e.id,e.title,e.description].join(' ').toLowerCase().includes(q))&&(f==='all'||(f==='flags'?e.findings.some(x=>x.severity!=='blocker'):e.status===f)));
}
function render(){
 const rows=find(),box=$('list');box.replaceChildren();
 $('found').textContent='显示 '+rows.length+' / '+entries.length+' 道；检测到的结构警告需要与原始图像逐项比较，不代表教材有错。';
 for(const e of rows){
  const card=el('article',undefined,'card'),top=el('div',undefined,'row');
  top.append(el('h3',e.id),el('span',e.status==='partial'?'原图部分录入':'原图未录入','status'));
  const sub=el('p',e.title);
  const count=el('p','已登记 '+Object.values(e.displayElements).reduce((a,b)=>a+b,0)+' 个图形对象 · 未满足 '+e.blockers+' 项自动审核条件');
  const buttons=el('div',undefined,'row'),button=el('button','查看核验详情');
  button.type='button';button.addEventListener('click',()=>show(e.id,true));
  const link=el('a','进入本题 →','action');link.href='chapter-drawing.html#'+encodeURIComponent(e.id);
  buttons.append(button,link);card.append(top,sub,count,buttons);box.append(card);
 }
}
function list(target,items,fn){
 const root=$(target);root.replaceChildren();for(const it of items)root.append(fn(it));
}
function show(id,scroll=false){
 const report=entries.find(x=>x.id===id);if(!report)return;
 $('detail').hidden=false;
 $('detailStatus').textContent=report.status==='partial'?'原图部分录入':'尚无有效录入';
 $('detailSource').textContent='仓库标注来源：'+report.sourceName+'（来源标注未经过完整扫描复验）';
 $('detailTitle').textContent=report.id+' · '+report.title;
 $('detailDescription').textContent=report.description;
 list('detailGeometry',Object.entries(report.displayElements),([k,v])=>el('span',({lines:'线段',circles:'圆',dots:'点',labels:'文字'}[k]||k)+' '+v,'status'));
 list('detailChecks',report.procedural,c=>el('div','待核对 · '+c.label,'check'));
 list('detailFindings',report.findings,i=>el('li',i.message,'issue '+i.severity));
 list('detailActions',audit.nextActions(report),a=>el('li',a,'issue'));
 $('detailVerdict').textContent=report.verdict;
 $('toExercise').href='chapter-drawing.html#'+encodeURIComponent(id);
 $('toKnowledge').href='../knowledge/index.html?exercise='+encodeURIComponent(id);
 if(scroll){$('detail').scrollIntoView({behavior:'smooth',block:'start'});$('detail').focus({preventScroll:true})}
}
for(const id of ['query','section','filter'])$(id).addEventListener('input',render);
render();
const anchor=decodeURIComponent(location.hash.slice(1));if(audit.ids.includes(anchor))show(anchor,false);
})();