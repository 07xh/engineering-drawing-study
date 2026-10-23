'use strict';
// Build-only enhancement: never execute app code or read user files.
const {parseHTML}=require('linkedom');
const path=require('node:path');
const fs=require('node:fs');
const {enhanceAuto,enhanceTeaching,enhanceDrawingLab}=require('./workbench-layout.cjs');
const {homeHTML}=require('./home.cjs');
const NAV=[['labs/auto-fillet-live.html','AI 解题'],['index.html#tools','题型中心'],['index.html#knowledge','我的题目'],['public-use.html','帮助与协议']];
const NAV_ICONS={
 'AI 解题':'<path d="M4 6h16v12H4z M7 3v3 M17 3v3 M7 18v3 M17 18v3 M9 10l2 2 4-4"/>',
 '题型中心':'<path d="M3 5h7l2 2h9v12H3z M8 11h8 M8 15h5"/>',
 '我的题目':'<path d="M8 3h8l4 4v14H4V3z M8 12l2 2 5-5 M8 18h8"/>',
 '帮助与协议':'<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.6 2.6 0 0 1 5.1.8c0 1.8-2.7 2-2.7 4 M12 17.5v.5"/>'
};
function iconFor(label){return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+NAV_ICONS[label]+'</svg>';}

function relative(page,target){
 const [file,hash]=target.split('#');
 return path.posix.relative(path.posix.dirname(page),file)+(hash?'#'+hash:'');
}
function fragment(document,html){const t=document.createElement('template');t.innerHTML=html;return t.content;}
function enhancePage(html,{page,preview=true}){
 const {document}=parseHTML(html);
 if(document.body.classList.contains('ui-next'))throw new Error('UI enhancement applied twice: '+page);
 const root=page.includes('/')?'../':'';
 document.body.classList.add('ui-next');
 const oldHeader=document.querySelector('header.site-topbar');
 oldHeader?.remove();
 const active=target=>page===target.split('#')[0]&&!target.includes('#');
 const links=NAV.map(([target,label])=>`<a class="next-rail-link" href="${relative(page,target)}" title="${label}" aria-label="${label}" data-ui-tip="${label}"${active(target)?' aria-current="page"':''}>${iconFor(label)}<span class="next-nav-label">${label}</span></a>`).join('');
 const main=document.querySelector('main')||document.createElement('main');
 if(!main.parentNode){
  for(const child of [...document.body.childNodes])if(child.nodeType!==1||!['SCRIPT','STYLE'].includes(child.tagName))main.append(child);
  document.body.prepend(main);
 }
 main.classList.add('next-main');
 if(!main.id)main.id='next-main';
 main.setAttribute('tabindex','-1');
 if(page==='index.html'){main.innerHTML=homeHTML();main.classList.add('next-home');}
 if(page==='labs/auto-fillet-live.html')enhanceAuto(document,main);
 if(page==='labs/point-projection-live.html')enhanceTeaching(document,main,{projection:true});
 if(page==='labs/circle-fillet-live.html')enhanceTeaching(document,main,{projection:false});
 if(['labs/cone-cut-live.html','labs/cylinder-cut-live.html','labs/prism-cut-live.html','labs/polygon-live.html'].includes(page))enhanceDrawingLab(document,main,{page});
 if(page==='public-use.html')main.classList.add('next-disclosure');
 document.body.prepend(fragment(document,`<a class="next-skip" href="#${main.id}">跳到主要内容</a>
 <header class="next-topbar"><a class="next-brand" href="${root}index.html"><span class="next-brand-emblem" aria-hidden="true">D</span> DraftAI<small>工程制图自动解题</small></a>${preview?'<span class="next-preview-badge">新版预览</span>':''}<details class="next-menu"><summary>导航菜单</summary><nav aria-label="移动端导航">${links}</nav></details></header>
 <aside class="next-sidebar"><a class="next-start" href="${root}labs/auto-fillet-live.html" aria-label="开始解题" title="开始解题" data-ui-tip="开始解题"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 4v16 M4 12h16"/></svg><span class="next-nav-label">开始解题</span></a><nav aria-label="工作区导航">${links}</nav><div class="next-sidebar-note"><a href="${root}index.html">返回首页</a></div></aside>`));
 for(const oldIcon of [...document.querySelectorAll('link[rel="icon"]')])oldIcon.remove();
 document.head.append(fragment(document,`<link rel="icon" type="image/svg+xml" href="${root}favicon.svg"><link rel="stylesheet" href="${root}ui-next.css"><script defer src="${root}ui-next.js"></script>`));
 const theme=document.querySelector('meta[name="theme-color"]');if(theme)theme.content='#f5f8fd';
  if(page==='index.html')document.head.append(fragment(document,'<meta name="draftai-ui-release" content="v6.1-home-20261023">'));
 return document.toString();
}
function applyPreview(out,{preview=true}={}){
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);
  if(e.isDirectory())walk(file);
  else if(e.name.endsWith('.html')){
   const page=path.relative(out,file).split(path.sep).join('/');
   fs.writeFileSync(file,enhancePage(fs.readFileSync(file,'utf8'),{page,preview}));
  }
 }}
 walk(out);
 for(const name of ['ui-next.css','ui-next.js'])fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
}
module.exports={enhancePage,applyPreview,relative};
