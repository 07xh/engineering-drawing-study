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
<section class="v7-workspace" id="project-workbench" aria-labelledby="v7-title">
 <div class="v7-head"><div><p class="next-home-kicker">V7 · 同一份本机项目</p><h1 id="v7-title">统一项目工作台</h1>
 <p>本机原图 → 人工确认毫米条件 → 真实数学 → 第一角 V/H/W、空间视图与单一 V5</p></div>
 <span id="v7-save" role="status" aria-live="polite">本机存储检查中…</span></div>
 <div class="v7-bar" aria-label="项目操作">
  <label>本机项目 <select id="v7-projects" aria-label="选择本机项目"><option value="">暂无记录</option></select></label>
  <button type="button" id="v7-open">打开项目</button><button type="button" id="v7-new">新建项目</button>
  <button type="button" id="v7-export">导出 .daiproject</button>
  <label class="v7-file-control">导入项目包<input id="v7-import" type="file" accept=".daiproject,application/x-draftai-project"></label>
  <button type="button" id="v7-delete" class="v7-danger">删除当前项目</button>
 </div>
 <div class="v7-layout">
  <section class="v7-card v7-input" aria-label="题图和条件审核"><h2>原图与条件</h2>
   <label>项目名称<input id="v7-title-input" maxlength="120" value="未命名项目" autocomplete="off"></label>
   <label class="v7-file-control">选择本机原题图片<input id="v7-image-input" type="file" accept="image/png,image/jpeg,image/webp"></label>
   <img id="v7-photo" alt="当前项目在设备内保存的原题参考图片" hidden>
   <p id="v7-image-status" class="v7-note">无原图。可以手动填写数学条件。</p>
   <fieldset class="v7-source-calibration">
    <legend>原图双比例尺核对（人工量测）</legend>
    <p class="v7-note">对原图中两段独立的已知长度，分别录入对应像素长度和实际毫米长度；两次所得 mm/px 相差超过 2% 时拒绝确认。不上传图片，不自动识图。</p>
    <div class="v7-xyz">
     <label>第 1 段像素 <input id="v7-cal-px1" type="number" step="any" value="100"></label>
     <label>第 1 段毫米 <input id="v7-cal-mm1" type="number" step="any" value="20"></label>
     <label>第 2 段像素 <input id="v7-cal-px2" type="number" step="any" value="150"></label>
     <label>第 2 段毫米 <input id="v7-cal-mm2" type="number" step="any" value="30"></label>
    </div>
    <label>原图方向（只记录来源，不修改原始像素）
     <select id="v7-cal-rotation"><option value="0">0°</option>
      <option value="90">90°</option><option value="180">180°</option>
      <option value="270">270°</option></select>
    </label>
    <div class="v7-cal-actions">
     <button type="button" id="v7-cal-apply">核对并保存双比例</button>
     <button type="button" id="v7-cal-clear">清除已确认比例</button>
    </div>
    <p id="v7-cal-status" class="v7-note" role="status">没有完成双比例核对；不能把像素自动当作毫米坐标。</p>
   </fieldset>

   <p class="v7-warning">原图仅供人工读取：当前不自动识别未知题型、不读取教材答案。下面坐标必须自行核对。</p>
   <label>当前项目题型 <select id="v7-task" aria-label="切换同一项目的求解任务">
    <option value="projection">点的 V/H/W 三面投影</option>
    <option value="planar">二维两线段圆弧连接 · 正式 V5</option>
    <option value="exploration">长方体截平面 · 限定证据预览</option>
    <option value="composition">多对象几何编辑 · 人工确认的场景预览</option>
   </select></label>
   <p class="v7-note">更换题型会清除本项目旧对象和已确认条件，保留原题图片。所有步骤仍来自对应正式数学入口。</p>
   <fieldset data-v7-task="projection"><legend>空间点 P（模型 mm）</legend><div class="v7-xyz">
    <label>x <input id="v7-x" type="number" step="any" value="15"></label>
    <label>y <input id="v7-y" type="number" step="any" value="10"></label>
    <label>z <input id="v7-z" type="number" step="any" value="12"></label>
   </div><button type="button" id="v7-stage">提交待确认条件</button>
   <button type="button" id="v7-confirm">核对并确认条件</button>
   <button type="button" id="v7-solve" class="v7-primary">重新数学求解与作图</button></fieldset>
   <div class="v7-nonpoint-actions" hidden><button type="button" id="v7-stage-other">提交当前题型条件</button>
    <button type="button" id="v7-confirm-other">核对并确认</button>
    <button type="button" id="v7-solve-other" class="v7-primary">运行现有 M3 数学</button></div>

   <fieldset data-v7-task="planar" hidden>
    <legend>二维圆弧连接 · 两条有限线段（模型 mm）</legend>
    <p class="v7-note">分别确认两条线段端点、半径、求解分支及行进方向。实际圆心与切点由现有 02 M3 求解，不由页面写死。</p>
    <div class="v7-xyz">
     <label>线段 1 A.x <input id="v7-f-ax" type="number" value="-20" step="any"></label>
     <label>A.y <input id="v7-f-ay" type="number" value="0" step="any"></label>
     <label>B.x <input id="v7-f-bx" type="number" value="20" step="any"></label>
     <label>B.y <input id="v7-f-by" type="number" value="0" step="any"></label>
     <label>线段 2 C.x <input id="v7-f-cx" type="number" value="0" step="any"></label>
     <label>C.y <input id="v7-f-cy" type="number" value="-20" step="any"></label>
     <label>D.x <input id="v7-f-dx" type="number" value="0" step="any"></label>
     <label>D.y <input id="v7-f-dy" type="number" value="20" step="any"></label>
     <label>连接半径 R <input id="v7-f-radius" type="number" min="0" step="any" value="10"></label>
     <label>分支 <select id="v7-f-branch"><option value="s++">s++</option><option value="s+-">s+-</option><option value="s-+">s-+</option><option value="s--">s--</option></select></label>
     <label>圆弧方向 <select id="v7-f-direction"><option value="ccw">逆时针</option><option value="cw">顺时针</option></select></label>
     <label>线段 1 行进 <select id="v7-f-first"><option value="forward">正向</option><option value="reverse">反向</option></select></label>
     <label>线段 2 行进 <select id="v7-f-second"><option value="forward">正向</option><option value="reverse">反向</option></select></label>
    </div>
   </fieldset>
   <fieldset data-v7-task="exploration" hidden>
    <legend>长方体及任意截平面（模型 mm）</legend>
    <p class="v7-warning">空间 M3 目前仅输出限定几何证据：显示原立体线框和对应 V/H/W，不代表截线、遮挡或逐笔动画已经验收。</p>
    <div class="v7-xyz">
     <label>宽 X <input id="v7-p-width" type="number" step="any" value="10"></label>
     <label>深 Y <input id="v7-p-depth" type="number" step="any" value="10"></label>
     <label>高 Z <input id="v7-p-height" type="number" step="any" value="10"></label>
     <label>平面点 x <input id="v7-p-px" type="number" step="any" value="0"></label>
     <label>平面点 y <input id="v7-p-py" type="number" step="any" value="0"></label>
     <label>平面点 z <input id="v7-p-pz" type="number" step="any" value="12"></label>
     <label>法向 x <input id="v7-p-nx" type="number" step="any" value="1"></label>
     <label>法向 y <input id="v7-p-ny" type="number" step="any" value="1"></label>
     <label>法向 z <input id="v7-p-nz" type="number" step="any" value="1"></label>
    </div>
   </fieldset>

   <fieldset data-v7-task="composition" hidden>
    <legend>多对象几何 · 同一个本机项目</legend>
    <p class="v7-warning">这里整理人工核对的已知几何，并不是自动求解。每个对象必须确认；不生成已证明的虚实线或 V5 答案。</p>
    <label>已录入对象 <select id="v7-c-objects" aria-label="选择或编辑项目中的对象">
     <option value="">新增对象</option></select></label>
    <label>对象 ID（英文字母开头）<input id="v7-c-id" maxlength="80" value="ObjectA" autocomplete="off"></label>
    <label>数学几何类型 <select id="v7-c-kind">
     <option value="point2d">二维点</option><option value="point3d">空间点</option>
     <option value="segment2d">二维线段</option><option value="segment3d">空间线段</option>
     <option value="circle">二维圆</option><option value="arc">二维有向圆弧</option>
     <option value="polyline2d">二维有序折线</option>
     <option value="polyline3d">空间有序折线</option>
     <option value="prism">长方体网格（空间）</option>
    </select></label>
    <p class="v7-note">坐标 A 是点或起点、圆心、长方体最小角；B 是终点或长方体最大角。圆和圆弧使用半径与角度。</p>
    <div class="v7-xyz">
     <label>A.x <input id="v7-c-ax" type="number" step="any" value="0"></label>
     <label>A.y <input id="v7-c-ay" type="number" step="any" value="0"></label>
     <label>A.z <input id="v7-c-az" type="number" step="any" value="0"></label>
     <label>B.x <input id="v7-c-bx" type="number" step="any" value="10"></label>
     <label>B.y <input id="v7-c-by" type="number" step="any" value="10"></label>
     <label>B.z <input id="v7-c-bz" type="number" step="any" value="10"></label>
     <label>半径 (mm) <input id="v7-c-radius" type="number" min="0" step="any" value="8"></label>
     <label>起始角 (°) <input id="v7-c-start" type="number" step="any" value="0"></label>
     <label>终止角 (°) <input id="v7-c-end" type="number" step="any" value="90"></label>
     <label>圆弧方向 <select id="v7-c-direction"><option value="ccw">逆时针</option><option value="cw">顺时针</option></select></label>
    </div>
    <label>折线顶点（每行一顶点，二维 x,y；三维 x,y,z）
     <textarea id="v7-c-points" rows="4" spellcheck="false" placeholder="0,0
10,0
10,10">0,0
10,0
10,10</textarea>
    </label>
    <label class="v7-closed-toggle"><input type="checkbox" id="v7-c-closed"> 首尾闭合（仅连接最后一点和第一点，不填充表面）</label>
    <div class="v7-compose-actions">
     <button id="v7-c-new" type="button">新对象</button>
     <button id="v7-c-stage" type="button">保存为待确认条件</button>
     <button id="v7-c-confirm" type="button">确认当前对象</button>
     <button id="v7-c-remove" type="button" class="v7-danger">删除选中对象</button>
     <button id="v7-c-render" type="button" class="v7-primary">显示已确认几何场景</button>
    </div>
    <p id="v7-c-status" class="v7-note" role="status">没有已确认对象。</p>
   </fieldset>
   <p id="v7-review" class="v7-note" role="status">等待人工确认。</p>
   <div class="v7-advanced"><strong>更多已存在专业工具</strong>
   <a href="labs/auto-fillet-live.html">二维圆弧</a><a href="labs/cone-cut-live.html">圆锥斜截</a>
   <a href="labs/recognition-qa.html">本机识图候选检查</a></div>
  </section>
  <section class="v7-card v7-paper" aria-label="统一几何视图"><div class="v7-line"><h2>工程图纸 · 第一角法</h2>
   <label>显示 <select id="v7-mode"><option value="split">二维 + 三维</option><option value="2d">仅二维</option><option value="3d">仅三维</option></select></label></div>
   <svg id="v7-sheet" viewBox="0 0 720 460" role="img" aria-label="统一求解结果的正面 V、水平 H、侧面 W 与 V5 作图"></svg>
   <div class="v7-spatial"><div class="v7-line"><strong>同一数学场景的空间视图</strong><span id="v7-spatial-boundary">点投影 / 长方体仅线框</span></div>
    <svg id="v7-3d" viewBox="0 0 500 220" role="img" aria-label="可旋转的空间点与坐标轴"></svg>
    <div class="v7-xyz"><label>旋转 <input id="v7-yaw" type="range" min="-180" max="180" value="0"></label>
    <label>俯仰 <input id="v7-pitch" type="range" min="-70" max="70" value="25"></label></div></div>
   <p class="v7-note" id="v7-selection">点选 V/H/W 或三维点，同步高亮同一个对象。</p>
  </section>
  <section class="v7-card v7-steps" aria-label="统一 V5 播放与数学证据"><h2>真实作图步骤 · V5</h2>
   <p id="v7-proof" class="v7-note" role="status">未计算。恢复项目后必须重新求解，不能继承“已验证”。</p>
   <div class="v7-controls"><button id="v7-back" type="button">上一步</button><button id="v7-play" type="button">▶ 播放</button><button id="v7-next" type="button">下一步</button></div>
   <label>播放进度 <input id="v7-seek" type="range" min="0" max="1000" value="0"></label>
   <div class="v7-line"><label>速度 <select id="v7-speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option><option value="3">3×</option></select></label>
    <label><input type="checkbox" id="v7-guides" checked> 辅助线</label><label><input type="checkbox" id="v7-mono"> 黑白</label></div>
   <div id="v7-step-list" aria-label="可点选作图步骤"></div>
   <p class="v7-warning">点投影与两线段圆弧连接可复用正式 V5。长方体仅呈现已确认原立体和局部数学证据，不推测截交线、虚实线或动画。</p>
  </section>
 </div>
</section>
<section class="next-home-hero next-home-workbench next-home-v64" id="ai" aria-label="工程制图解题首页">
 <section class="next-home-drawing" aria-labelledby="next-home-drawing-title">
  <div class="next-home-intro-block">
   <div class="next-home-intro-copy">
    <p class="next-home-kicker">DraftAI · 个人工程制图工作台</p>
    <h1 id="next-home-drawing-title">工程制图自动解题</h1>
    <p class="next-home-lead">确认条件，查看逐笔作图和完整工程图纸。</p>
    <div class="next-home-hero-actions">
     <a class="next-home-edit" href="#project-workbench">＋ 开始解题</a>
     <a class="next-home-example" href="labs/circle-fillet-live.html">查看圆弧连接 →</a>
    </div>
    <p class="next-home-capability">当前提供部分题型的条件求解与动态作图；任意图片自动识别尚未开放。</p>
    <div class="next-home-strengths" aria-label="核心功能">
     <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 20V5h14v15H5z M5 20 19 5"/></svg><strong>按题型解答</strong><span>圆弧、投影、截切</span></div>
     <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/></svg><strong>逐笔观看</strong><span>辅助线与作图步骤</span></div>
     <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 2 20 6v12l-8 4-8-4V6z M4 6l8 4 8-4 M12 10v12"/></svg><strong>投影对应</strong><span>同纸 V/H/W 视图</span></div>
    </div>
   </div>
   <div class="next-home-intro-sheet">
  <div class="next-home-paper next-home-fillet-paper" data-next-illustration data-construction-example="right-angle-fillet" aria-label="R40 圆弧连接几何构造示例，解析几何关系计算">
   <div class="next-home-paper-top"><strong>圆弧连接 · R40</strong><span>直线相切构造 · 单位 mm</span></div>
   <svg viewBox="260 106 525 387" role="img" preserveAspectRatio="xMidYMid meet" aria-label="放大的 R40 圆弧连接工程作图：水平线、竖直线、圆心 O、切点 T1 与 T2 及辅助构造线">
    <rect x="266" y="111" width="513" height="377" fill="#fff" stroke="#dce6f3" stroke-width="1.5" rx="3"/>
    <g stroke="#edf3fa" fill="none" stroke-width="1">
     <path d="M280 440H762 M280 280H762"/>
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
     <path data-horizontal-line="true" d="M290 440H512"/>
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
    <g font-family="system-ui,sans-serif" font-size="15" fill="#667d99">
     <text x="575" y="473">原直角顶点</text>
    </g>
    <g fill="none" stroke="#cfdaea" stroke-width="1.2">
     <path d="M570 454L670 443"/>
    </g>
   </svg>
   <div class="next-home-paper-caption">R40 圆弧连接 · 圆心与两个切点经过几何核算。非上传题目答案。</div>
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
