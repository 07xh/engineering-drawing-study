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
<section class="next-home-hero next-home-workbench" aria-label="DraftAI 开始解题">
 <section class="next-home-drawing" aria-labelledby="next-home-drawing-title">
  <div class="next-home-drawing-top"><div><span class="next-home-release" data-draftai-release="v6.1-home">V6.1</span><h1 id="next-home-drawing-title">工程制图自动解题</h1><p>打开题型，确认条件，查看逐笔作图。</p></div><a class="next-home-edit" href="labs/auto-fillet-live.html">开始解题 →</a></div>
  <div class="next-home-paper" data-next-illustration aria-label="第一角法三视图布局示意，不是求解器计算结果">
   <div class="next-home-paper-top"><strong>工程图纸</strong><span>第一角法 V / H / W · 布局示意</span></div>
   <svg viewBox="0 0 960 620" role="img" aria-label="同一张纸上的圆锥主视图、俯视图和左视图位置示意，非题目计算结果">
    <rect x="9" y="9" width="942" height="602" fill="#fff" stroke="#c8d5e5" stroke-width="1.8" rx="5"/>
    <g fill="none" stroke="#c0d1e5" stroke-width="1.4" stroke-dasharray="7 7">
     <path d="M31 336H926 M470 28V591 M250 48V584 M690 48V324"/>
     <path d="M470 350L705 585 M145 470H795"/>
    </g>
    <g fill="#526886" font-family="system-ui,sans-serif" font-size="19">
     <text x="55" y="54">V 主视图</text><text x="55" y="372">H 俯视图</text><text x="524" y="54">W 左视图</text><text x="765" y="575" font-size="16">45°</text>
    </g>
    <g fill="none" stroke="#182b47" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
     <path d="M250 83L142 306H358Z M690 83L582 306H798Z"/>
     <circle cx="250" cy="472" r="109"/>
    </g>
    <g fill="none" stroke="#e09a45" stroke-width="3" stroke-linecap="round">
     <path d="M140 212L366 172 M580 212L806 172"/>
    </g>
    <g fill="none" stroke="#007fca" stroke-width="3.2" stroke-linecap="round">
     <path d="M181 203Q250 245 319 184 M621 203Q690 245 759 184"/>
     <ellipse cx="250" cy="472" rx="79" ry="35"/>
    </g>
    <g fill="none" stroke="#90add2" stroke-width="1.5" stroke-dasharray="8 6">
     <path d="M181 203V472 M319 184V472 M621 203V321 M759 184V321"/>
     <path d="M140 306H359 M580 306H800"/>
     <path d="M141 472H361"/>
    </g>
   </svg>
   <div class="next-home-paper-caption">示意图仅说明三视图排布。实际图形须由真实求解器计算。</div>
  </div>
  <div class="next-home-drawing-actions">
   <a class="next-primary-link" href="labs/cone-cut-live.html">打开圆锥斜截</a>
   <a href="labs/point-projection-live.html">三面投影</a>
   <a href="labs/circle-fillet-live.html">圆弧连接</a>
  </div>
 </section>
 <aside class="next-home-workflow" aria-label="解题操作">
  <div class="next-home-workflow-card"><h2>选择题型</h2><div class="next-home-quick-links">
   <a href="labs/auto-fillet-live.html"><span class="next-home-quick-icon">01</span><span>二维自动解题</span><span aria-hidden="true">›</span></a>
   <a href="labs/cone-cut-live.html"><span class="next-home-quick-icon">02</span><span>圆锥斜截</span><span aria-hidden="true">›</span></a>
   <a href="labs/point-projection-live.html"><span class="next-home-quick-icon">03</span><span>点的三面投影</span><span aria-hidden="true">›</span></a>
   <a href="labs/polygon-live.html"><span class="next-home-quick-icon">04</span><span>正多边形作图</span><span aria-hidden="true">›</span></a>
  </div></div>
  <div class="next-home-workflow-card"><h2>操作步骤</h2><ol class="next-home-guide-steps">
   <li><span>1</span><div><strong>输入题目条件</strong><small>选择已有题型并核对尺寸</small></div></li>
   <li><span>2</span><div><strong>计算并确认结果</strong><small>存在多个解时自行选择</small></div></li>
   <li><span>3</span><div><strong>逐笔观看作图</strong><small>支持上一笔、下一笔与调速</small></div></li>
  </ol><p class="next-home-boundary">目前支持部分题型；任意图片自动识别尚未开放。</p></div>
 </aside>
</section>
<section class="next-home-section next-home-shortflow" id="ai"><strong>解题流程</strong><span>输入条件 → 计算 → 动态作图</span></section>
<section class="next-home-section" id="tools">
 <div class="next-section-heading"><h2>更多作图工具</h2><span>按需要打开</span></div>
 <details class="next-home-more-tools"><summary>查看全部工具</summary><div class="next-tool-grid">${TOOLS.map(([slug,label,description,action],i)=>`<a class="next-tool-card" href="labs/${slug}.html"><span class="next-tool-number">${String(i+1)}</span><h3>${label}</h3><p>${description}</p><span class="next-tool-action">${action} →</span></a>`).join("")}</div></details>
</section>
<section class="next-knowledge" id="knowledge"><div><h2>我的题目</h2><p>题库尚未接入。当前请使用上面的真实解题工具。</p></div><div class="next-knowledge-links"><a href="labs/auto-fillet-live.html">二维作图 →</a><a href="labs/circle-fillet-live.html">圆弧连接 →</a><a href="labs/point-projection-live.html">三面投影 →</a></div></section>
<footer class="next-footer"><span>DraftAI · 工程制图自动解题与动态作图</span><a href="public-use.html">支持范围与隐私说明 →</a></footer>
`;}
module.exports={homeHTML};
