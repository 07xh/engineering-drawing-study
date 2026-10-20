'use strict';
/* Regression: white text on a light hero must never ship again. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('knowledge/index.html','utf8');
const css=fs.readFileSync('knowledge/knowledge-ui.css','utf8');
const builder=fs.readFileSync('scripts/build-static.cjs','utf8');
function declarations(selector){
 const start=css.indexOf(selector+'{');
 assert(start>=0,'Missing scoped visual selector: '+selector);
 const end=css.indexOf('}',start);
 assert(end>start,'Unclosed CSS rule '+selector);
 return css.slice(start+selector.length+1,end);
}
function hex(block,key){
 const regex=new RegExp('(?:^|;)\\s*'+key.replace(/[.*+?^\u0024{}()|[\]\\]/g,'\\$&')+'\\s*:\\s*(#[0-9a-fA-F]{6})\\s*(?:;|$)');
 const match=block.match(regex);
 assert(match,'Missing explicit '+key+' color in '+block.slice(0,75));
 return match[1];
}
function luminance(color){
 const v=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255)
   .map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
 return .2126*v[0]+.7152*v[1]+.0722*v[2];
}
function contrast(fg,bg){
 const a=luminance(fg),b=luminance(bg);
 return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
const base=declarations('body.ui-refresh .kb-hero');
const headline=declarations('body.ui-refresh .kb-hero h1');
const copy=declarations('body.ui-refresh .kb-hero p');
const eyebrow=declarations('body.ui-refresh .kb-hero .eyebrow');
const stat=declarations('body.ui-refresh .kb-hero .kb-hero-stats .stat');
assert(base.includes('background:linear-gradient('),'hero must not inherit an unsuitable global background');
const bgcolors=['#f3faf4','#e2f1e7','#edf7f0'];
for(const background of bgcolors){
 for(const [name,foreground,min] of [
  ['title',hex(headline,'color'),7],
  ['description',hex(copy,'color'),4.5],
  ['eyebrow',hex(eyebrow,'color'),4.5]
 ]){
  assert(contrast(foreground,background)>=min,
    name+' contrast too weak on '+background+': '+contrast(foreground,background).toFixed(2));
 }
}
assert(contrast(hex(stat,'color'),'#ffffff')>=7,'stats on white too light');
assert(!/background:\s*#fff(?:fff)?\b/i.test(headline),'white headline would be illegible');
assert(html.includes('class="hero kb-hero"')&&html.includes('id="knowledgeHeading"'),'new high contrast compact hero missing');
assert(html.includes('class="stats kb-hero-stats"'),'new compact statistics missing');
assert(html.includes('class="kb-source-note"'),'long source disclaimer must remain available');
assert(html.includes('class="toolbar kb-filterbar"'),'aligned filters missing');
assert(html.includes('id="knowledgeWorkspace"')&&html.includes('href="#knowledgeWorkspace"'),'first-screen jump must target knowledge');
assert(html.includes('href="knowledge-ui.css"'),'page stylesheet not linked');
assert(html.includes('id="knowledgeCards"')&&html.includes('id="knowledgeDetail"')&&html.includes('id="visualLesson"'),'core knowledge and animation not preserved');
for(const id of ['totalCards','completedCards','knowledgeSearch','chapterSelect','progressSelect','resetFilters']){
 assert(html.includes('id="'+id+'"'),'lost interactive UI control '+id);
}
for(const selector of ['body.ui-refresh .kb-filterbar','body.ui-refresh .kb-filterbar label',
 'body.ui-refresh .kb-filterbar :is(input,select)',
 'body.ui-refresh .kb-hero .kb-hero-stats .stat']){
 assert(css.includes(selector+'{'),'missing UI layout selector '+selector);
}
assert(css.includes('@media (max-width:980px)')&&css.includes('@media (max-width:760px)')
 &&css.includes('@media (max-width:440px)'),'desktop / tablet / mobile breakpoints missing');
assert(builder.includes("'knowledge/knowledge-ui.css'"),'static builder will not publish knowledge UI CSS');
console.log('PASS knowledge UI: title/eyebrow/body contrast, compact layout, original knowledge app controls, tablet breakpoints, static asset');
