/* 浏览器按需联网查找参考资料。仅查百科与学术元数据，结果永不写入原题 SVG。 */
(function(){'use strict';
const $=id=>document.getElementById(id),core=window.DrawingResearchCore;
if(!core||!$('researchPanel'))return;
let current='',latest=0,controller=null,lastRun=0;
const make=(tag,content,cls)=>{
 const n=document.createElement(tag);if(content!==undefined)n.textContent=content;
 if(cls)n.className=cls;return n
};
function referenceLink(label,url){const a=make('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a}
function render(id){
 const original=window.VerifiedExerciseGeometry&&window.VerifiedExerciseGeometry.get(id);
 const profile=core.detect(id,original);if(!profile)return;
 current=id;latest++;if(controller){controller.abort();controller=null}
 $('researchTitle').textContent=id+' · '+(profile.title||'待核对原题');
 $('researchClassification').textContent='题型初判：'+profile.group+'。'+profile.shapeWarning;
 $('researchQuery').value=profile.query;
 $('researchStatus').textContent='尚未检索。点击“联网查找”后才向公开资料接口发出查询。';
 $('researchResults').replaceChildren();
 const checks=core.requirements(id,original),list=$('researchAudit');list.replaceChildren();
 for(const item of checks.checks){
  const li=make('li',(item.ok?'✓ 已有部分资料 · ':'待核对 · ')+item.label+'：'+item.explain,item.ok?'audit-partial':'audit-pending');
  list.append(li);
 }
 $('researchGate').textContent=checks.status+'。检索结果不能取消这项限制。';
 const alternatives=$('researchAlternatives');alternatives.replaceChildren();
 for(const method of core.compareMethods(profile)){
  const li=make('li');
  li.append(make('strong',method.name),make('p',method.reason+'（'+method.status+'）'));
  alternatives.append(li);
 }
 $('researchCaution').textContent=profile.pitfall;
}
function getJSON(url,signal){
 return fetch(url,{method:'GET',mode:'cors',credentials:'omit',redirect:'follow',signal,headers:{Accept:'application/json'}}).then(r=>{
  if(!r.ok)throw Error('HTTP '+r.status);
  return r.json();
 });
}
async function wikipedia(q,signal){
 const params=new URLSearchParams({action:'query',list:'search',srsearch:q,srlimit:'5',format:'json',formatversion:'2',origin:'*'});
 const data=await getJSON('https://zh.wikipedia.org/w/api.php?'+params,signal);
 const items=data&&data.query&&data.query.search;
 if(!Array.isArray(items))throw Error('搜索返回数据格式无法识别');
 return items.slice(0,5).map(x=>({provider:'wikimedia',title:x.title,url:'https://zh.wikipedia.org/wiki/'+encodeURIComponent(x.title.replace(/ /g,'_')),snippet:x.snippet||'',date:x.timestamp||''}));
}
async function crossref(query,signal){
 const params=new URLSearchParams({'query.bibliographic':query,rows:'5',select:'DOI,title,published'});
 const json=await getJSON('https://api.crossref.org/works?'+params,signal);
 const arr=json&&json.message&&json.message.items;
 if(!Array.isArray(arr))throw Error('学术元数据格式无法识别');
 return arr.map(r=>{
  const doi=String(r.DOI||'');
  if(!/^10\.\d{4,9}\/[a-z0-9._;()/:+-]+$/i.test(doi))return null;
  const title=Array.isArray(r.title)?r.title[0]:null;
  return {provider:'crossref',title,url:'https://doi.org/'+doi,snippet:'Crossref 书目信息（非解题步骤）',date:(r.published&&r.published['date-parts']&&r.published['date-parts'][0]||[]).join('-')};
 }).filter(Boolean);
}
function appendResults(items,profile){
 const list=$('researchResults');
 for(const candidate of items){
  const ref=core.scoreReference(candidate,profile);if(!ref)continue;
  const li=make('li');
  const headline=referenceLink(ref.title,ref.url);
  li.append(headline,make('p',ref.provider+' · '+ref.relevance+' · '+(ref.date||'日期不详')));
  li.append(make('p',ref.snippet||'仅获得标题或元数据，正文未核验。'));
  li.append(make('p',ref.evidence,'review-caution'));
  list.append(li);
 }
}
async function search(){
 const id=current,profile=core.detect(id,window.VerifiedExerciseGeometry&&window.VerifiedExerciseGeometry.get(id));if(!profile)return;
 const raw=$('researchQuery').value.trim();if(raw.length<2||raw.length>110){$('researchStatus').textContent='请填写 2～110 字的检索主题，不要输入私密信息。';return}
 const now=Date.now();if(now-lastRun<4000){$('researchStatus').textContent='请求过于频繁，稍后再试。';return}
 lastRun=now;const serial=++latest;controller=new AbortController();
 const timer=setTimeout(()=>controller&&controller.abort(),11500);
 $('researchSearch').disabled=true;$('researchResults').replaceChildren();
 $('researchStatus').textContent='正在检索公开条目与文献元数据，不传输教材 PDF 或个人笔迹……';
 try{
  const found=await Promise.allSettled([wikipedia(raw,controller.signal),crossref(profile.english,controller.signal)]);
  if(serial!==latest)return;
  let count=0;const messages=[];
  for(let i=0;i<found.length;i++){
   const type=i===0?'维基媒体':'Crossref';
   if(found[i].status==='fulfilled'){appendResults(found[i].value,profile);count+=found[i].value.length;messages.push(type+'已返回 '+found[i].value.length+' 条')}
   else messages.push(type+'不可用：'+(found[i].reason&&found[i].reason.name==='AbortError'?'超时':String(found[i].reason?.message||'网络限制').slice(0,100)));
  }
  $('researchStatus').textContent=messages.join('；')+'。'+(count?'请逐条阅读原始来源并核对适用条件。':'可改用下面的外部检索入口。');
  if(!$('researchResults').children.length) $('researchResults').append(make('li','没有获得可展示的安全参考链接。'));
 }finally{
  clearTimeout(timer);
  if(serial===latest){controller=null;$('researchSearch').disabled=false}
 }
}
$('researchSearch').addEventListener('click',()=>{search().catch(e=>{$('researchStatus').textContent='联网检索失败：'+String(e.message||'未知网络错误');$('researchSearch').disabled=false})});
$('researchExternalWiki').addEventListener('click',()=>{
 const q=$('researchQuery').value.trim()||'工程制图 投影';window.open('https://zh.wikipedia.org/w/index.php?search='+encodeURIComponent(q),'_blank','noopener,noreferrer');
});
$('researchExternalCrossref').addEventListener('click',()=>{
 const p=core.detect(current,window.VerifiedExerciseGeometry&&window.VerifiedExerciseGeometry.get(current));if(!p)return;
 window.open('https://search.crossref.org/?q='+encodeURIComponent(p.english),'_blank','noopener,noreferrer');
});
window.DrawingResearchUI={render};
})();
