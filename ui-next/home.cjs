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
const CATEGORIES=[["平面几何",["auto-fillet-live","circle-fillet-live","polygon-live","tangent-constraint","paper-geometry"]],["投影与空间",["point-projection-live","two-point-v5-live","cone-cut-live","cylinder-cut-live","prism-cut-live","composite-geometry","free-modeler","dof-lab-v2","point-coach","point-construction"]],["辅助与实验",["recognition-qa","constraints","analysis"]]];
function homeHTML(){return `
<section class="next-home-hero next-home-workbench" aria-label="DraftAI 开始解题">
 <section class="next-home-drawing" aria-labelledby="next-home-drawing-title">
  <div class="next-home-drawing-top"><div><span class="next-home-release" data-draftai-release="v6.1-home">V6.1</span><h1 id="next-home-drawing-title">工程制图自动解题</h1><p>打开题型，确认条件，查看逐笔作图。</p></div><a class="next-home-edit" href="labs/auto-fillet-live.html">开始解题 →</a></div>
  <div class="next-home-paper" data-next-illustration data-projection-example="right-circular-cone" aria-label="正圆锥三视图，同纸第一角法；无斜截曲线">
   <div class="next-home-paper-top"><strong>正圆锥三视图</strong><span>第一角法 · V / H / W</span></div>
   <svg viewBox="0 0 960 620" role="img" aria-label="正圆锥三视图：V 主视图在左上、H 俯视图在左下、W 左视图在右上；投影对应并带45度宽度转移线">
    <rect x="9" y="9" width="942" height="602" fill="#fff" stroke="#c8d5e5" stroke-width="1.8"/>
    <!-- Construction lines have geometric correspondence. Horizontal length
         x(V)=x(H); height y(V)=y(W); depth on H maps to x(W)
         across the 45-degree miter at (550,335). -->
    <g data-projection-guides="true" fill="none" stroke="#b2c5dd" stroke-width="1.15" stroke-linecap="round">
     <!-- Height correspondence -->
     <path d="M245 82H685 M345 300H785"/>
     <!-- Long alignment, V to H -->
     <path d="M145 300V470 M345 300V470"/>
     <!-- Width/depth transfers, H to 45-degree miter to W -->
     <path d="M245 370H585V300 M345 470H685V300 M245 570H785V300"/>
     <path data-miter="45-degree" d="M550 335L785 570"/>
    </g>
    <!-- Standard thin chain centerlines, distinct from construction and object edges -->
    <g data-projection-axes="true" fill="none" stroke="#9aabc2" stroke-width="1.1" stroke-dasharray="12 5 2 5">
     <path d="M245 62V316 M685 62V316"/>
     <path d="M245 348V585 M128 470H363"/>
    </g>
    <g fill="#516985" font-family="system-ui,sans-serif" font-size="19">
     <text x="52" y="52">V 主视图</text>
     <text x="52" y="356">H 俯视图</text>
     <text x="558" y="52">W 左视图</text>
     <text x="801" y="574" font-size="16">45°</text>
    </g>
    <!-- All three projections come from ONE upright cone of radius 100
         and projected height 218. No unverified oblique-section curves. -->
    <g data-projection-view="V" fill="none" stroke="#1c304b" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
     <path d="M245 82L145 300H345Z"/>
    </g>
    <g data-projection-view="H" fill="none" stroke="#1c304b" stroke-width="2.8">
     <circle cx="245" cy="470" r="100"/>
    </g>
    <g data-projection-view="W" fill="none" stroke="#1c304b" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
     <path d="M685 82L585 300H785Z"/>
    </g>
   </svg>
   <div class="next-home-paper-caption">规范三视图示例 · 非题目计算结果。斜截线须进入求解工作台计算，不在首页编造。</div>
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
  <section class="next-home-workflow-card next-home-library" id="knowledge"><h2>我的题目</h2><p>题库尚未接入，可先使用已开放的作图工具。</p><a href="labs/auto-fillet-live.html">进入解题工作台 →</a><p class="next-home-boundary">任意图片自动识别尚未开放。</p></section>
 </aside>
</section>
<section class="next-home-section next-home-shortflow" id="ai"><strong>解题流程</strong><span>输入条件 → 计算 → 动态作图</span></section>
<section class="next-home-section" id="tools">
 <div class="next-section-heading"><h2>更多作图工具</h2><span>按需要打开</span></div>
 <details class="next-home-more-tools"><summary>按类别查看题型与辅助工具</summary>${CATEGORIES.map(([category,slugs])=>`<section class="next-home-tool-group"><h3>${category}</h3><div class="next-tool-grid">${TOOLS.filter(([slug])=>slugs.includes(slug)).map(([slug,label,description,action])=>`<a class="next-tool-card" href="labs/${slug}.html"><h3>${label}</h3><p>${description}</p><span class="next-tool-action">${action} →</span></a>`).join("")}</div></section>`).join("")}</details>
</section>

<footer class="next-footer"><span>DraftAI · 工程制图自动解题与动态作图</span><a href="public-use.html">帮助与用户协议 →</a></footer>
`;}
module.exports={homeHTML};
