'use strict';
// Build-only enhancement: never execute app code or read user files.
const {parseHTML}=require('linkedom');
const path=require('node:path');
const fs=require('node:fs');
const {enhanceAuto,enhanceTeaching,enhanceDrawingLab}=require('./workbench-layout.cjs');
const {homeHTML}=require('./home.cjs');
const NAV=[
 ['index.html#project-workbench','解题'],
 ['index.html#tools','工具']
];

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
 const links=NAV.map(([target,label],i)=>`<a href="${page==='index.html'?'#'+target.split('#')[1]:relative(page,target)}" data-task-nav="${label}"${(page==='index.html'&&i===0)||(page.startsWith('labs/')&&i===1)?' aria-current="page"':''}>${label}</a>`).join('');
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
 <header class="next-topbar"><a class="next-brand" href="${root}index.html"><span class="next-brand-emblem" aria-hidden="true">D</span> DraftAI</a>${preview?'<span class="next-preview-badge">新版预览</span>':''}<nav class="next-task-nav" aria-label="主要导航">${links}</nav><a class="next-help-link" href="${root}public-use.html"${page==='public-use.html'?' aria-current="page"':''}>帮助</a></header>`));
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
