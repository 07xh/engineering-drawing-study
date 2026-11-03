'use strict';
// Public landing regression: opening the public site must never imply a live AI uploader
// or a protected owner-only area when only static pages have been deployed.
const assert=require('node:assert/strict'),fs=require('node:fs');
const home=fs.readFileSync('index.html','utf8');
const guide=fs.readFileSync('public-use.html','utf8');
const build=fs.readFileSync('scripts/build-static.cjs','utf8');
const files=['labs/point-coach.html','labs/dof-lab-v2.html','labs/free-modeler.html','labs/tangent-constraint.html','labs/paper-geometry.html','labs/composite-geometry.html'];
assert(home.includes('绘序 · DraftFlow'),'public DraftFlow name missing');
assert(home.includes('选择几何解题工具')&&home.includes('让工程制图的每一步'),'DraftFlow solver landing missing');
for(const f of files){
 assert(fs.existsSync(f),'public learning page missing: '+f);
 assert(home.includes('href="'+f+'"'),'public learning entry missing: '+f);
}
assert(home.includes('任意图片 AI 自动解题功能仍在开发中')&&home.includes('通用图片上传、任意新题自动识别'),'AI capability must be clearly marked as not launched');
assert(!/<input\b[^>]*type=["']file["']/i.test(home),'no AI upload UI should appear before secure backend');
assert(!/<form\b/i.test(home),'public homepage must not pretend to accept private submissions');
assert(home.includes('href="public-use.html"'),'public use disclosure missing');
assert(guide.includes('公开')&&guide.includes('个人资料')&&guide.includes('尚未向公众开放'),'public use and private boundary text missing');
assert(build.includes("'public-use.html'"),'public use page must be packaged');
assert(!home.includes('第三版教材 · 唯一课程体系'),'textbook course cannot remain the product home');
const enhanced=require('../ui-next/home.cjs').homeHTML();
const enhancer=fs.readFileSync('ui-next/enhance-page.cjs','utf8');
assert(enhanced.includes('df-live-hero')&&enhanced.includes('id="v7-input-section"')&&enhanced.includes('id="v7-sheet"'),'production V7 workbench lost under rebrand');
assert(enhancer.includes('绘序 · DraftFlow')&&enhancer.includes("if(page==='welcome.html')continue"),'built page must retain branded shell and nonblocking splash');
assert(build.includes("'welcome.html'")&&build.includes("'draftflow-brand.css'"),'public DraftFlow assets missing from allowlist');
console.log('PASS public DraftFlow entry: original geometry tools and V7 workbench preserved; AI gated; brand assets whitelisted');
