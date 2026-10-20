'use strict';
/* Verify actual build output, not merely repository source files. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist'),broken=[];
function scan(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);
  if(e.isDirectory()){scan(file);continue}
  if(!e.isFile()||!e.name.endsWith('.html'))continue;
  const rel=path.relative(root,file).split(path.sep).join('/');
  const html=fs.readFileSync(file,'utf8');
  for(const match of html.matchAll(/<(?:script|link|a)\b[^>]*>/gi)){
   const tag=match[0],attr=tag.match(/\b(?:src|href)=["']([^"']+)["']/i);
   if(!attr)continue;
   const url=attr[1].trim();
   if(!url||/^(?:#|\/\/|https?:|mailto:|tel:|data:|javascript:)/i.test(url))continue;
   const basename=url.split(/[?#]/,1)[0];
   if(!/\.(?:html?|js|css|svg|png|jpe?g|webp|ico)$/i.test(basename))continue;
   const target=path.posix.normalize(basename.startsWith('/')?basename.slice(1):path.posix.join(path.posix.dirname(rel),basename));
   if(target==='..'||target.startsWith('../')){broken.push(rel+' -> '+url+' (out of build root)');continue}
   if(!fs.existsSync(path.join(root,target)))broken.push(rel+' -> '+url+' (expected '+target+')');
  }
 }
}
assert(fs.existsSync(path.join(root,'knowledge/drawing-player.html')),'linked drawing player was not packaged');
assert(!fs.existsSync(path.join(root,'knowledge/drawing-player-demo.js')),'internal demo should never ship');
scan(root);
assert.deepEqual(broken,[],'broken local links/assets in static build');
console.log('PASS: every local JS/CSS/page/image link in packaged HTML resolves inside dist');
