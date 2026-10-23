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
<section class="next-home-hero next-home-workbench next-home-v64" id="ai" aria-label="工程制图解题首页">
 <section class="next-home-drawing" aria-labelledby="next-home-drawing-title">
  <div class="next-home-intro-block">
   <div class="next-home-intro-copy">
    <p class="next-home-kicker">DraftAI · 个人工程制图工作台</p>
    <h1 id="next-home-drawing-title">工程制图自动解题</h1>
    <p class="next-home-lead">确认题目条件，查看逐笔作图。图纸、步骤与投影关系都在同一工作台中。</p>
    <div class="next-home-hero-actions">
     <a class="next-home-edit" href="labs/auto-fillet-live.html">＋ 开始解题</a>
     <a class="next-home-example" href="labs/circle-fillet-live.html">查看圆弧连接 →</a>
    </div>
    <p class="next-home-capability">当前提供部分题型的条件求解与动态作图；任意图片自动识别尚未开放。</p>
    <div class="next-home-strengths" aria-label="核心功能">
     <div><strong>按题型解答</strong><span>圆弧、投影、截切等</span></div>
     <div><strong>逐笔观看</strong><span>辅助线与作图步骤</span></div>
     <div><strong>投影对应</strong><span>同纸 V/H/W 视图</span></div>
    </div>
   </div>
   <div class="next-home-intro-sheet">
  <div class="next-home-paper next-home-fillet-paper" data-next-illustration data-construction-example="right-angle-fillet" aria-label="R40 圆弧连接几何构造示例，解析几何关系计算">
   <div class="next-home-paper-top"><strong>圆弧连接 · R40</strong><span>直线相切构造 · 单位 mm</span></div>
   <svg viewBox="0 0 960 620" role="img" aria-label="两条互相垂直的直线以 R40 圆弧连接，显示圆心 O、切点 T1 T2 与辅助等距线">
    <rect x="9" y="9" width="942" height="602" fill="#fff" stroke="#cbd9e9" stroke-width="1.8" rx="4"/>
    <g stroke="#edf3fa" fill="none" stroke-width="1">
     <path d="M42 84H918 M42 515H918 M90 42V576 M869 42V576"/>
    </g>
    <g fill="#546985" font-family="system-ui,sans-serif" font-size="17">
     <text x="57" y="66">平面几何 · 两直线内圆角</text>
     <text x="709" y="66">几何构造步骤示例</text>
    </g>
    <!-- One drawing-unit model: four SVG units correspond to 1 mm.
         Fillet center (512,280), radius 160 SVG units = 40 mm.
         Horizontal line y=440, vertical line x=672.
         Tangency T1=(512,440), T2=(672,280). -->
    <g data-construction-extensions="true" fill="none" stroke="#a3b4ca" stroke-width="1.6" stroke-dasharray="9 8">
     <path d="M512 440H672 V280"/>
     <path d="M512 155V475"/>
     <path d="M385 280H710"/>
    </g>
    <g data-construction-guides="true" fill="none" stroke="#8db5e8" stroke-width="1.75" stroke-dasharray="7 6">
     <path data-radius-to-t1="true" d="M512 280V440"/>
     <path data-radius-to-t2="true" d="M512 280H672"/>
    </g>
    <g data-profile="true" fill="none" stroke="#1e304b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
     <path data-horizontal-line="true" d="M150 440H512"/>
     <path data-vertical-line="true" d="M672 280V123"/>
    </g>
    <path data-fillet-radius-mm="40" data-px-per-mm="4" data-fillet-arc="true"
       d="M512 440 A160 160 0 0 0 672 280" fill="none" stroke="#0871f5" stroke-width="5.5" stroke-linecap="round"/>
    <g stroke="#0871f5" stroke-width="1.7" fill="#fff">
     <circle data-fillet-center="true" cx="512" cy="280" r="5.5"/>
     <circle data-tangent="t1" cx="512" cy="440" r="5.5"/>
     <circle data-tangent="t2" cx="672" cy="280" r="5.5"/>
    </g>
    <g fill="#254f89" font-family="system-ui,sans-serif" font-size="19">
     <text x="486" y="258">O</text>
     <text x="465" y="474">T₁</text>
     <text x="690" y="274">T₂</text>
    </g>
    <g data-radius-mark="true" fill="none" stroke="#577fae" stroke-width="2.2" stroke-linecap="round">
     <path d="M512 280L625.137 393.137"/>
     <path d="M617 388L630 399L622 382"/>
    </g>
    <rect x="567" y="325" width="77" height="34" rx="7" fill="#eaf3ff" stroke="#c9defa"/>
    <text x="605" y="349" text-anchor="middle" fill="#0866ef" font-size="22" font-weight="650" font-family="system-ui,sans-serif">R40</text>
    <g font-family="system-ui,sans-serif" font-size="16" fill="#6b809d">
     <text x="575" y="473">原直角顶点</text>
     <text x="54" y="555">辅助等距线确定圆心，半径与两条直线均保持相切。</text>
    </g>
    <g fill="none" stroke="#cfdaea" stroke-width="1.2">
     <path d="M565 460L670 443"/>
    </g>
    <g fill="#5d7090" font-family="system-ui,sans-serif" font-size="15">
     <text x="733" y="559">示意尺寸 · mm</text>
    </g>
   </svg>
   <div class="next-home-paper-caption">解析几何构造示例，非上传题目答案。切点、圆心及 R40 半径关系一致。</div>
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
