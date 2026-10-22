'use strict';
// Build-only enhancement: never execute app code or read user files.
const {parseHTML}=require('linkedom');
const path=require('node:path');
const fs=require('node:fs');
const {enhanceAuto,enhanceTeaching}=require('./workbench-layout.cjs');
const {homeHTML}=require('./home.cjs');
const NAV=[['labs/auto-fillet-live.html','解题工作台'],['index.html#knowledge','知识与方法'],['index.html#tools','几何工具'],['public-use.html','使用与隐私']];
function relative(page,target){
 const [file,hash]=target.split('#');
 return path.posix.relative(path.posix.dirname(page),file)+(hash?'#'+hash:'');
}
function fragment(document,html){const t=document.createElement('template');t.innerHTML=html;return t.content;}
function enhancePage(html,{page}){
 const {document}=parseHTML(html);
 if(document.body.classList.contains('ui-next'))throw new Error('UI enhancement applied twice: '+page);
 const root=page.includes('/')?'../':'';
 document.body.classList.add('ui-next');
 const oldHeader=document.querySelector('header.site-topbar');
 oldHeader?.remove();
 const active=target=>page===target.split('#')[0]&&!target.includes('#');
 const links=NAV.map(([target,label])=>`<a href="${relative(page,target)}"${active(target)?' aria-current="page"':''}>${label}</a>`).join('');
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
 if(page==='public-use.html')main.classList.add('next-disclosure');
 document.body.prepend(fragment(document,`<a class="next-skip" href="#${main.id}">跳到主要内容</a>
 <header class="next-topbar"><a class="next-brand" href="${root}index.html"><span aria-hidden="true">D /</span> DraftAI<small>工程制图 · 个人解题工作区</small></a><span class="next-preview-badge">新版预览</span><details class="next-menu"><summary>导航菜单</summary><nav aria-label="移动端导航">${links}</nav></details></header>
 <aside class="next-sidebar"><a class="next-start" href="${root}labs/auto-fillet-live.html">开始解题 →</a><nav aria-label="工作区导航">${links}</nav><div class="next-sidebar-note">图纸、条件、作图依据<br>在同一工作区查看。<a href="${root}index.html">返回开始页</a></div></aside>`));
 document.head.append(fragment(document,`<link rel="stylesheet" href="${root}ui-next.css"><script defer src="${root}ui-next.js"></script>`));
 const theme=document.querySelector('meta[name="theme-color"]');if(theme)theme.content='#f3f5f8';
 return document.toString();
}
function applyPreview(out){
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);
  if(e.isDirectory())walk(file);
  else if(e.name.endsWith('.html')){
   const page=path.relative(out,file).split(path.sep).join('/');
   fs.writeFileSync(file,enhancePage(fs.readFileSync(file,'utf8'),{page}));
  }
 }}
 walk(out);
 for(const name of ['ui-next.css','ui-next.js'])fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
}
module.exports={enhancePage,applyPreview,relative};
