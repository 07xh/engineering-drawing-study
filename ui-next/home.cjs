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
<section class="next-home-hero next-home-workbench next-home-v64" aria-label="工程制图解题首页">
 <section class="next-home-drawing" aria-labelledby="next-home-drawing-title">
  <div class="next-home-intro-block">
   <div class="next-home-intro-copy">
    <p class="next-home-kicker">DraftAI · 个人工程制图工作台</p>
    <h1 id="next-home-drawing-title">工程制图自动解题</h1>
    <p class="next-home-lead">确认题目条件，查看逐笔作图。图纸、步骤与投影关系都在同一工作台中。</p>
    <div class="next-home-hero-actions">
     <a class="next-home-edit" href="labs/auto-fillet-live.html">＋ 开始解题</a>
     <a class="next-home-example" href="labs/cone-cut-live.html">查看圆锥示例 →</a>
    </div>
    <p class="next-home-capability">当前提供部分题型的条件求解与动态作图；任意图片自动识别尚未开放。</p>
    <div class="next-home-strengths" aria-label="核心功能">
     <div><strong>按题型解答</strong><span>圆弧、投影、截切等</span></div>
     <div><strong>逐笔观看</strong><span>辅助线与作图步骤</span></div>
     <div><strong>投影对应</strong><span>同纸 V/H/W 视图</span></div>
    </div>
   </div>
   <div class="next-home-intro-sheet">
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

   </div>
  </div>
 </section>
 <aside class="next-home-workflow" aria-label="最近任务与我的题目">
  <section class="next-home-workflow-card next-home-continue" id="recent">
   <div class="next-home-card-heading"><h2>继续解题</h2><a href="labs/auto-fillet-live.html">进入工作台 →</a></div>
   <div class="next-home-empty-illustration" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="7" y="6" width="34" height="36" rx="5"/><path d="M14 16h20M14 23h15M14 30h10"/><path d="M32 30l4 4-4 4"/></svg></div>
   <p class="next-home-empty-title">暂无可恢复的解题记录</p>
   <p class="next-home-empty-note">历史进度同步尚未接入，不会在这里显示虚构的“上次编辑”。</p>
   <a class="next-home-continue-button" href="labs/auto-fillet-live.html">打开现有解题工具</a>
  </section>
  <section class="next-home-workflow-card next-home-library" id="knowledge">
   <div class="next-home-card-heading"><h2>我的题目</h2><a href="#tools">选择题型 →</a></div>
   <div class="next-home-library-empty"><span aria-hidden="true">▤</span><div><strong>题库尚未接入</strong><p>当前可先从下方题型中心进入已有的作图功能。</p></div></div>
  </section>
 </aside>
</section>
<section class="next-home-section next-home-categories" id="tools">
 <div class="next-section-heading"><h2>选择题型开始解题</h2><a href="#all-tools">查看全部工具 →</a></div>
 <div class="next-home-category-grid">
  <a class="next-home-category-card next-cat-plane" id="plane" href="labs/circle-fillet-live.html"><svg viewBox="0 0 72 72" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><rect x="14" y="17" width="42" height="39"/><path d="M14 56L56 17 M14 37l10 8 15-21"/></svg><span><strong>平面作图</strong><small>圆弧连接、正多边形与基本辅助作图</small></span><b aria-hidden="true">→</b></a>
  <a class="next-home-category-card next-cat-projection" id="projection" href="labs/point-projection-live.html"><svg viewBox="0 0 72 72" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M36 7l18 11v20L36 50 18 38V18z M36 7v22 M18 18l18 11 18-11 M36 29v21 M17 54l19 11 19-11"/></svg><span><strong>三视图与投影</strong><small>第一角法、对应关系与投影作图</small></span><b aria-hidden="true">→</b></a>
  <a class="next-home-category-card next-cat-section" id="section" href="labs/cone-cut-live.html"><svg viewBox="0 0 72 72" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 57V20a16 7 0 0 1 32 0v37a16 7 0 0 1-32 0 M20 20a16 7 0 0 0 32 0 M20 57a16 7 0 0 0 32 0"/><path d="M14 28L60 43" stroke-dasharray="5 4"/></svg><span><strong>截交与相贯</strong><small>圆锥、圆柱、棱柱等空间题型</small></span><b aria-hidden="true">→</b></a>
  <a class="next-home-category-card next-cat-composite" id="composite" href="labs/composite-geometry.html"><svg viewBox="0 0 72 72" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M13 27l23-13 23 13v27L36 67 13 54z M13 27l23 13 23-13 M36 40v27 M23 20v21"/></svg><span><strong>组合体作图</strong><small>组合体投影、识图与形体分析</small></span><b aria-hidden="true">→</b></a>
 </div>
 <details class="next-home-more-tools" id="all-tools"><summary>展开全部题型及辅助工具</summary>${CATEGORIES.map(([category,slugs])=>`<section class="next-home-tool-group"><h3>${category}</h3><div class="next-tool-grid">${TOOLS.filter(([slug])=>slugs.includes(slug)).map(([slug,label,description,action])=>`<a class="next-tool-card" href="labs/${slug}.html"><h3>${label}</h3><p>${description}</p><span class="next-tool-action">${action} →</span></a>`).join("")}</div></section>`).join("")}</details>
</section>
<footer class="next-footer"><span>DraftAI · 工程制图自动解题与动态作图</span><a href="public-use.html">帮助与用户协议 →</a></footer>
`;}
module.exports={homeHTML};
