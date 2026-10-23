'use strict';
const TOOLS=[
 ['cylinder-cut-live','圆柱截切实验','圆柱截切及对应三视图逐笔绘制。','打开实验'],
 ['prism-cut-live','棱柱截切实验','棱柱截切与投影作图。','打开实验'],
 ['cone-cut-live','圆锥斜截 · 统一 V5 动态作图','圆锥斜截与同纸三视图。','打开实验'],
 ['recognition-qa','本地识图质量检查','本地图像质量和图元候选检查。','打开检查'],
 ['auto-fillet-live','二维自动解题','修改尺寸，查看连接弧作图。','开始解题'],
 ['polygon-live','正多边形 · V5 动态作图','正三角形、正六边形逐笔作图。','打开动态作图'],
 ['two-point-v5-live','双点投影 V5 预验收','已知双点坐标，绘制三面投影。','打开预验收'],
 ['point-projection-live','三面投影','给定坐标，求完整三面投影。','进入工作台'],
 ['circle-fillet-live','圆弧连接','圆弧连接与切点辅助作图。','进入工作台'],
 ['free-modeler','自由建模','建立几何模型并查看投影。','打开工具'],
 ['dof-lab-v2','自由度与三视图','查看几何条件与三视图。','打开工具'],
 ['point-coach','点投影陪练','补全点的第三面投影。','开始练习'],
 ['paper-geometry','尺规几何','查看尺规作图的辅助线。','打开工具'],
 ['tangent-constraint','相切实验','调整相切条件并观察结果。','打开工具'],
 ['point-construction','投影作图演示','逐步绘制点的投影。','打开工具'],
 ['composite-geometry','组合体实验','分析组合体及投影。','打开工具'],
 ['constraints','几何约束','查看几何条件的关系。','打开工具'],
 ['analysis','约束分析','核对几何条件。','打开工具']
];
function homeHTML(){return `
<section class="next-home-hero">
 <div><h1>工程制图 · <span>自动解题</span></h1>
 <p class="next-home-intro">选择题型，确认条件，查看逐笔作图。</p>
 <div class="next-home-actions"><a class="next-primary-link" href="labs/auto-fillet-live.html">开始二维解题 →</a><a href="labs/point-projection-live.html">打开三面投影</a></div>
 <p class="next-home-boundary">目前支持部分题型；图片自动识别尚未开放。</p></div>
 <figure class="next-home-sheet" data-next-illustration><figcaption>动态作图预览 <span>示意图 · 非计算结果</span></figcaption>
 <svg viewBox="0 0 600 400" role="img" aria-label="两条垂直线段与相切圆弧的构造示意，不代表当前题目计算结果">
 <defs><pattern id="next-demo-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dbe3f0" /></pattern></defs>
 <rect width="600" height="400" fill="url(#next-demo-dots)" />
 <path d="M130 70V310H510" fill="none" stroke="#21334c" stroke-width="3" />
 <path d="M250 40V340M100 190H530" stroke="#9eb7e7" stroke-width="1.5" stroke-dasharray="7 7" />
 <circle cx="250" cy="190" r="120" fill="none" stroke="#c4d4f3" stroke-width="1.5" />
 <path d="M130 190A120 120 0 0 0 250 310" stroke="#2865ea" fill="none" stroke-width="5" stroke-linecap="round" />
 <path d="M130 190H250V310" fill="none" stroke="#799ad9" stroke-width="1.5" />
 <g fill="#2865ea"><circle cx="250" cy="190" r="4"/><circle cx="130" cy="190" r="4"/><circle cx="250" cy="310" r="4"/>
 <text x="263" y="178" font-size="18">O</text><text x="97" y="181" font-size="16">T1</text><text x="262" y="332" font-size="16">T2</text><text x="175" y="255" font-size="18">R</text></g>
 </svg><div class="next-sheet-caption"><span>01 建立条件</span><span>02 求解并验证</span><strong>03 动态构造</strong></div></figure>
</section>
<section class="next-home-section next-home-shortflow" id="ai"><h2>从题目到作图</h2><p>确认条件 → 解题 → 逐笔作图</p></section>
<section class="next-home-section" id="tools"><div class="next-section-heading"><div><h2>选择解题工具</h2></div></div>
 <div class="next-tool-grid">${TOOLS.map(([slug,label,description,action],i)=>`<a class="next-tool-card" href="labs/${slug}.html"><span class="next-tool-number">${String(i+1).padStart(2,'0')}</span><h3>${label}</h3><p>${description}</p><span class="next-tool-action">${action} →</span></a>`).join('')}</div>
</section>
<section class="next-knowledge" id="knowledge"><div><h2>我的题目</h2><p>题库尚未接入。当前请先使用上方解题工具。</p></div><div class="next-knowledge-links"><a href="labs/auto-fillet-live.html">二维作图 →</a><a href="labs/circle-fillet-live.html">圆弧连接 →</a><a href="labs/point-projection-live.html">三面投影 →</a></div></section>
<footer class="next-footer"><span>DraftAI · 个人工程制图解题与动态作图</span><a href="public-use.html">当前能力、使用说明与隐私 →</a></footer>`;}
module.exports={homeHTML};
