'use strict';
const TOOLS=[
 ['cylinder-cut-live','圆柱截切实验','手动设置有限圆柱与截平面，查看受支持范围的截线和 V5 作图。','打开实验'],
 ['recognition-qa','本地识图质量检查','在本机检查图像质量与候选检测结果，供人工复核。','打开检查'],
 ['auto-fillet-live','二维自动解题','确认线段、圆和连接半径，选定解分支后查看真实数学作图。','开始解题'],
 ['point-projection-live','三面投影','从空间坐标或两面投影求第三投影，理解 V / H / W 对应关系。','进入工作台'],
 ['circle-fillet-live','圆弧连接','有限线段、圆和有限圆弧的连接，支持尺规构造与数学检查。','进入工作台'],
 ['free-modeler','自由建模','建立简单空间点、线与面，观察几何模型及对应投影。','打开工具'],
 ['dof-lab-v2','自由度与三视图','观察约束如何影响几何对象，以及同纸投影之间的联系。','打开工具'],
 ['point-coach','点投影陪练','自己定位投影点，在反馈中理解投影关系。','开始练习'],
 ['paper-geometry','尺规几何','探索辅助线、交点和几何构造关系。','打开工具'],
 ['tangent-constraint','相切实验','观察半径、候选圆心与切点之间的关系。','打开工具'],
 ['point-construction','投影作图演示','逐步查看点的投影构造，并检验约束。','打开工具'],
 ['composite-geometry','组合体实验','观察组合体的空间关系和可视化分析。','打开工具'],
 ['constraints','几何约束','探索几何关系与约束条件。','打开工具'],
 ['analysis','约束分析','通过已有数学工具检查几何条件。','打开工具']
];
function homeHTML(){return `
<section class="next-home-hero">
 <div><p class="next-eyebrow">DRAFTAI / ENGINEERING GEOMETRY</p><h1>看懂条件。<br>算清几何。<br><span>一步步画出来。</span></h1>
 <p class="next-home-intro">面向个人学习的工程制图解题工具。确认几何条件，用数学引擎求解，再跟随动态作图理解每一步。</p>
 <div class="next-home-actions"><a class="next-primary-link" href="labs/auto-fillet-live.html">开始二维解题 →</a><a href="labs/point-projection-live.html">打开三面投影</a></div>
 <p class="next-home-boundary">当前支持限定题型的手动条件求解、本地图像参照与 SVG 核对。通用 AI 识图尚未开放。</p></div>
 <figure class="next-home-sheet" data-next-illustration><figcaption>从条件到作图依据 <span>流程示意 · 非计算结果</span></figcaption>
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
<section class="next-home-section" id="ai"><div class="next-section-heading"><div><p class="next-eyebrow">ONE CONTINUOUS WORKSPACE</p><h2>从一道题开始，在同一张图纸里完成。</h2></div><span class="next-capability">数学求解驱动作图</span></div>
 <ol class="next-flow">${[['导入与参照','本地图片或 SVG，也可直接输入条件。'],['确认条件','核对图元、尺寸、单位与对应关系。'],['求解与选解','区分有效分支、无解和条件不足。'],['动态作图','查看辅助线、切点与目标轮廓。'],['复核与导出','依据当前验证结果下载图纸与步骤。']].map(([a,b],i)=>`<li><span>0${i+1}</span><h3>${a}</h3><p>${b}</p></li>`).join('')}</ol>
</section>
<section class="next-home-section" id="tools"><div class="next-section-heading"><div><p class="next-eyebrow">TOOLS FOR YOUR DRAWING</p><h2>选择适合当前问题的工具</h2></div><p>题型支持范围以各工具说明为准</p></div>
 <div class="next-tool-grid">${TOOLS.map(([slug,label,description,action],i)=>`<a class="next-tool-card" href="labs/${slug}.html"><span class="next-tool-number">${String(i+1).padStart(2,'0')}</span><h3>${label}</h3><p>${description}</p><span class="next-tool-action">${action} →</span></a>`).join('')}</div>
</section>
<section class="next-knowledge" id="knowledge"><div><p class="next-eyebrow">UNDERSTAND THE CONSTRUCTION</p><h2>不只看结果，也理解为什么。</h2><p>在工具的步骤解释中查看相切、圆心轨迹与投影联系等数学依据。题库用于后续知识支持与能力验证，题库导入及检索尚未接入。</p></div><div class="next-knowledge-links"><a href="labs/auto-fillet-live.html">二维作图的步骤与依据 →</a><a href="labs/circle-fillet-live.html">圆弧连接的数学核验 →</a><a href="labs/point-projection-live.html">三面投影的构造关系 →</a></div></section>
<footer class="next-footer"><span>DraftAI · 个人工程制图解题与动态作图</span><a href="public-use.html">当前能力、使用说明与隐私 →</a></footer>`;}
module.exports={homeHTML};
