'use strict';
// Public landing regression: opening the public site must never imply a live AI uploader
// or a protected owner-only area when only static pages have been deployed.
const assert=require('node:assert/strict'),fs=require('node:fs');
const home=fs.readFileSync('index.html','utf8');
const guide=fs.readFileSync('public-use.html','utf8');
const build=fs.readFileSync('scripts/build-static.cjs','utf8');
const files=['labs/point-coach.html','labs/dof-lab-v2.html','labs/free-modeler.html','labs/tangent-constraint.html','labs/paper-geometry.html','labs/composite-geometry.html'];
assert(home.includes('DraftAI'),'public product name missing');
assert(home.includes('现有数学与作图基础组件')&&home.includes('产品主流程：识图 → 求解 → 自动作图'),'V3.1 AI geometry solving landing sections missing');
for(const f of files){
 assert(fs.existsSync(f),'public learning page missing: '+f);
 assert(home.includes('href="'+f+'"'),'public learning entry missing: '+f);
}
assert(home.includes('AI 识图尚未开放'),'AI capability must be clearly marked as not launched');
assert(!/<input\b[^>]*type=["']file["']/i.test(home),'no AI upload UI should appear before secure backend');
assert(!/<form\b/i.test(home),'public homepage must not pretend to accept private submissions');
assert(home.includes('href="public-use.html"'),'public use disclosure missing');
assert(guide.includes('公开')&&guide.includes('个人资料')&&guide.includes('尚未向公众开放'),'public use and private boundary text missing');
assert(build.includes("'public-use.html'"),'public use page must be packaged');
assert(!home.includes('第三版教材 · 唯一课程体系'),'textbook course cannot remain the product home');
console.log('PASS public DraftAI entry: existing geometry tools linked, AI gated, public/private disclosure present');
