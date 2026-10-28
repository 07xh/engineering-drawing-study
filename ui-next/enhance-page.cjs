'use strict';
// Build-only enhancement: never execute app code or read user files.
const {parseHTML}=require('linkedom');
const path=require('node:path');
const fs=require('node:fs');
const {enhanceAuto,enhanceTeaching,enhanceDrawingLab}=require('./workbench-layout.cjs');
const {homeHTML}=require('./home.cjs');
const NAV=[
 ['index.html','工作台'],
 ['index.html#recent','我的项目'],
 ['index.html#tools','题型工具'],
 ['public-use.html','帮助']
];
const NAV_ICONS={
 '工作台':'<path d="M4 5h16v14H4z M8 10l3 3 5-6"/>',
 '我的项目':'<path d="M7 3h9l4 4v14H4V3z M8 12l3 3 5-6"/>',
 '题型工具':'<path d="M5 19V5h14v14z M5 19L19 5 M8 10l3 3"/>',
 '帮助':'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 1c0 2-3 2-3 4 M12 18h.01"/>'
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
 <aside class="next-sidebar"><a class="next-start" href="${root}index.html#project-workbench" aria-label="开始解题" title="开始解题" data-ui-tip="开始解题"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 4v16 M4 12h16"/></svg><span class="next-nav-label">开始解题</span></a><nav aria-label="工作区导航">${links}</nav><div class="next-sidebar-note"><a href="${root}index.html">返回首页</a></div></aside>`));
 for(const oldIcon of [...document.querySelectorAll('link[rel="icon"]')])oldIcon.remove();
 document.head.append(fragment(document,`<link rel="icon" type="image/svg+xml" href="${root}favicon.svg"><link rel="stylesheet" href="${root}ui-next.css"><script defer src="${root}ui-next.js"></script>`));
 const theme=document.querySelector('meta[name="theme-color"]');if(theme)theme.content='#f5f8fd';
  if(page==='index.html')document.head.append(fragment(document,
   '<meta name="draftai-ui-release" content="v6.6-home-20261023">'+
   '<meta name="draftai-project-workbench" content="v7-real-20261024">'+
   '<link rel="stylesheet" href="project/workbench-ui.css">'+
   '<script defer src="project/linked-three-scene-bundle.js"></script>'+
   '<script defer src="project/unified-workbench-bundle.js"></script>'));
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
