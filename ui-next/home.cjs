'use strict';
const TOOLS=[
 ['cylinder-cut-live','圆柱截切实验','圆柱截切及对应三视图逐笔绘制。','打开实验'],
 ['prism-cut-live','棱柱截切实验','棱柱截切与投影作图。','打开实验'],
 ['cone-cut-live','圆锥斜截 · 统一 V5 动态作图','圆锥斜截与同纸三视图。','打开实验'],
 ['c2-native-cut-review','C2 通孔 · 真实 OCCT 局部 V5','从 GitHub Actions 下载真实 CAD 证明，手机本机导入已签发线条，其他线不绘制。','打开局部审核'],
 ['recognition-qa','本地识图质量检查','本地图像质量和图元候选检查。','打开检查'],
 ['auto-fillet-live','二维自动解题','修改尺寸，查看连接弧作图。','开始解题'],
 ['polygon-live','正多边形 · V5 动态作图','正三角形、正六边形逐笔作图。','打开动态作图'],
 ['two-point-v5-live','双点投影 V5 预验收','已知双点坐标，绘制三面投影。','打开预验收'],
 ['solid-third-view-live','已确认基本体补第三视图','两个已知视图及人工确认拓扑，复算八个角点与全部棱的三视图。','打开几何预览'],
 ['c1-reviewed-dxf-live','教材两视图已知量本地审核','本机导入已隔离的可信 CAD 已知量，复核三维凸体并使用原有 V5。','打开私有原题审核'],
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
const CATEGORIES=[["平面几何",["auto-fillet-live","circle-fillet-live","polygon-live","tangent-constraint","paper-geometry"]],["投影与空间",["point-projection-live","two-point-v5-live","solid-third-view-live","c1-reviewed-dxf-live","cone-cut-live","cylinder-cut-live","prism-cut-live","c2-native-cut-review","composite-geometry","free-modeler","dof-lab-v2","point-coach","point-construction"]],["辅助与实验",["recognition-qa","constraints","analysis"]]];
function homeHTML(){return `
<section class="v7-workspace" id="project-workbench" aria-labelledby="v7-title">
 <div class="v7-head"><div><h1 id="v7-title">工程制图解题</h1>
 <p>导入题图或输入条件，核对后开始求解与逐步作图。</p></div>
 <span id="v7-save" role="status" aria-live="polite">本机存储检查中…</span></div>
 <section class="v7-course-entry" id="v7-course-entry" aria-labelledby="v7-course-title">
  <details class="v8-course-disclosure">
  <summary class="v8-course-summary">专项题型与支持范围</summary>
  <div class="v7-course-head"><h2 id="v7-course-title">C1 补第三视图 · C2 组合体 · C3 相贯线</h2>
   <p>这些入口在新标签打开，不会切换本机项目题型、删除已确认条件；未完成的预览不等于正式答案。</p></div>
  <div class="v7-course-grid" role="list">
   <article class="v7-course-card" role="listitem" data-course="intersection" data-capability="math-demo">
    <span class="v7-course-status">有限圆柱解析求解 · 已证明辅助点 V5</span>
    <h3>相贯线</h3><p>对人工确认的两根有限正交圆柱，解析求交并在 V/H/W 中逐步绘制已验证的端点和内部辅助点；连续曲线仍为未签线型的预览。</p>
    <div class="v7-course-links"><a href="labs/finite-cylinder-intersection-live.html" target="_blank" rel="noopener noreferrer">打开有限圆柱解析求点 V5 ↗</a>
     <a href="labs/composite-geometry.html?mode=intersection" target="_blank" rel="noopener noreferrer">旧无限曲面数学实验 ↗</a></div>
   </article>
   <article class="v7-course-card" role="listitem" data-course="composition" data-capability="confirmed-scene-only">
    <span class="v7-course-status">已知形体预览 · 非组合体标准答案</span>
    <h3>组合体</h3><p>在本项目用“多对象几何编辑”确认长方体并共享三视图；另一实验仅展示基座和凸台的简单组合。</p>
    <div class="v7-course-links"><a href="#v7-task">定位本项目题型选择 ↓</a>
     <a href="labs/composite-geometry.html?mode=composite" target="_blank" rel="noopener noreferrer">打开原创组合体实验 ↗</a></div>
   </article>
   <article class="v7-course-card" role="listitem" data-course="third-view" data-capability="identified-point-only">
    <span class="v7-course-status">已确认基本体几何预览 · 非标准虚实线答案</span>
    <h3>补第三视图</h3><p>人工确认两视图中的对应点 A/B，可计算第三投影与已知 AB 线段的投影预览；虚实线和未知实体仍不自动推测。</p>
    <div class="v7-course-links"><a href="labs/solid-third-view-live.html" target="_blank" rel="noopener noreferrer">已确认长方体的第三视图 ↗</a>
     <a href="labs/c1-reviewed-dxf-live.html" target="_blank" rel="noopener noreferrer">本机教材两视图已知量审核与唯一 V5 ↗</a>
     <a href="labs/two-point-v5-live.html" target="_blank" rel="noopener noreferrer">两视图 A/B 对应点与棱线预览 ↗</a>
     <a href="labs/point-projection-live.html" target="_blank" rel="noopener noreferrer">单点投影求解 ↗</a></div>
   </article>
  </div>
  <p class="v7-course-disclosure">部分题型仍待完整线型验证；未验证的结果不会作为正式答案。</p>
  </details>
 </section>
 <div class="v7-bar" aria-label="项目操作">
  <label>本机项目 <select id="v7-projects" aria-label="选择本机项目"><option value="">暂无记录</option></select></label>
  <button type="button" id="v7-open">打开项目</button><button type="button" id="v7-new">新建项目</button>
  <button type="button" id="v7-export">导出 .daiproject</button>
  <label class="v7-file-control">导入项目包<input id="v7-import" type="file" accept=".daiproject,application/x-draftai-project"></label>
  <button type="button" id="v7-delete" class="v7-danger">删除当前项目</button>
 </div>
 <div class="v7-layout">
  <section class="v7-card v7-input" aria-label="题图和条件审核"><h2>题目与条件</h2>
   <label>项目名称<input id="v7-title-input" maxlength="120" value="未命名项目" autocomplete="off"></label>
   <label class="v7-file-control">选择本机原题图片<input id="v7-image-input" type="file" accept="image/png,image/jpeg,image/webp"></label>
   <div id="v7-photo-box" class="v7-photo-box" hidden>
    <img id="v7-photo" alt="当前项目在设备内保存的原题参考图片，点击确定量测端点" hidden>
    <svg id="v7-photo-marks" viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet"
     aria-label="原图两组量测线段及端点" aria-hidden="true"></svg>
   </div>
   <p id="v7-image-status" class="v7-note" role="status">尚未上传原图，可手动输入条件。</p>
   <details class="v8-source-advanced"><summary>原图标注与尺寸校准（按需展开）</summary>
   <label>在原图上量测 <select id="v7-photo-segment">
    <option value="0">第 1 段：点选两个端点</option>
    <option value="1">第 2 段：点选两个端点</option></select>
   </label>
   <button type="button" id="v7-photo-clear">重选当前段的两个端点</button>
   <p id="v7-photo-point-status" class="v7-note" role="status">选择原图后，依次点击两端点，像素长度会自动填写；毫米长度仍需人工确认。</p>
   <fieldset class="v7-source-candidates">
    <legend>原图线段与尺寸标注</legend>
    <p class="v7-note">需要标注时，在原图选择端点并核对对应尺寸。</p>
    <label>候选 ID <input id="v7-candidate-id" value="SourceLine1" maxlength="64" autocomplete="off"></label>
    <button type="button" id="v7-candidate-stage">添加待确认线段</button>
    <label>候选与关联条件 <select id="v7-source-link" aria-label="选择原图候选以定位对应条件">
     <option value="">不关联候选</option></select></label>
    <div class="v7-candidate-actions">
     <button type="button" id="v7-candidate-accept">人工确认候选</button>
     <button type="button" id="v7-candidate-reject">拒绝候选</button>
     <button type="button" id="v7-candidate-locate">定位候选关联条件</button>
    </div>
    <p id="v7-candidate-status" class="v7-note" role="status">当前没有原图候选。上传或选择原图后进行人工标注。</p>
   </fieldset>
   <fieldset class="v7-source-calibration">
    <legend>校准原图比例</legend>
    <p class="v7-note">用两段已知尺寸核对比例；两次结果偏差超过 2% 时不能确认。</p>
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
   </details>

   <p class="v7-warning">题图尚不能自动完整解答；请核对下方几何条件。</p>
   <label>解题类型 <select id="v7-task" aria-label="选择解题类型">
    <option value="projection">点的 V/H/W 三面投影</option>
    <option value="planar">二维两线段圆弧连接 · 正式 V5</option>
    <option value="exploration">长方体截平面 · 限定证据预览</option>
    <option value="composition">C2 组合体 · 已知形体与关系核验</option>
    <option value="c1-third-view">C1 补第三视图 · 已确认长方体（限定结果）</option>
    <option value="c3-intersection">C3 相贯线 · 两根有限正交圆柱（解析预览）</option>
   </select></label>
   <p class="v7-note">已有条件时切换题型会新建项目，原项目保留；空项目可直接切换。</p>
   <fieldset data-v7-task="projection"><legend>空间点 P（模型 mm）</legend><div class="v7-xyz">
    <label>x <input id="v7-x" type="number" step="any" value="15"></label>
    <label>y <input id="v7-y" type="number" step="any" value="10"></label>
    <label>z <input id="v7-z" type="number" step="any" value="12"></label>
   </div><button type="button" id="v7-stage">保存条件</button>
   <button type="button" id="v7-confirm">确认条件</button>
   <button type="button" id="v7-solve" class="v7-primary">开始求解与作图</button></fieldset>
   <div class="v7-nonpoint-actions" hidden><button type="button" id="v7-stage-other">保存条件</button>
    <button type="button" id="v7-confirm-other">核对并确认</button>
    <button type="button" id="v7-solve-other" class="v7-primary">开始求解</button></div>

   <fieldset data-v7-task="c3-intersection" hidden>
    <legend>C3 · 已确认的两根正交有限圆柱</legend>
    <p class="v7-note">输入两根圆柱的半径、中心轴位置和有限端盖范围（mm）。
     Z 轴圆柱与 Y 轴圆柱互相正交；不适用于任意倾斜圆柱或未知实体。</p>
    <div class="v8-c3-grid">
     <fieldset><legend>沿 Z 轴的圆柱</legend><div class="v7-xyz">
      <label>半径<input id="v8-c3-zRadius" type="number" step="any"></label>
      <label>中心 x<input id="v8-c3-zX" type="number" step="any"></label>
      <label>中心 y<input id="v8-c3-zY" type="number" step="any"></label>
      <label>端盖 z 最小<input id="v8-c3-zMin" type="number" step="any"></label>
      <label>端盖 z 最大<input id="v8-c3-zMax" type="number" step="any"></label>
     </div></fieldset>
     <fieldset><legend>沿 Y 轴的圆柱</legend><div class="v7-xyz">
      <label>半径<input id="v8-c3-yRadius" type="number" step="any"></label>
      <label>中心 x<input id="v8-c3-yX" type="number" step="any"></label>
      <label>中心 z<input id="v8-c3-yZ" type="number" step="any"></label>
      <label>端盖 y 最小<input id="v8-c3-yMin" type="number" step="any"></label>
      <label>端盖 y 最大<input id="v8-c3-yMax" type="number" step="any"></label>
     </div></fieldset>
    </div>
    <label class="v8-review-agree"><input id="v8-c3-axes" type="checkbox">
     我已核对真实题目中两根圆柱的正交轴向、位置与毫米尺寸。</label>
    <label class="v8-review-agree"><input id="v8-c3-caps" type="checkbox">
     我已核对两个有限圆柱的端盖位置及截断范围。</label>
    <p class="v7-warning">仅复用已证明的解析求交点、V/H/W 辅助求点和现有唯一 V5。数学曲线预览不等于整条相贯线已取得工程实虚线资格。</p>
   </fieldset>
   <fieldset data-v7-task="c1-third-view" hidden>
    <legend>C1 · 已确认单个闭合长方体补第三视图</legend>
    <p class="v7-note">填写两张已知视图中全部八个对应角点的模型毫米坐标。
    请依据真实题目人工确认棱与面的固定拓扑，不识别任意照片中的未知实体。</p>
    <label>已知视图 <select id="v8-c1-pair">
     <option value="VH">正面 V + 水平 H</option>
     <option value="VW">正面 V + 侧面 W</option>
     <option value="HW">水平 H + 侧面 W</option>
    </select></label>
    <label>角点表（每行：ID, 第一视图 u,v, 第二视图 u,v）
     <textarea id="v8-c1-vertices" rows="9" spellcheck="false"
      placeholder="V000,0,0,0,0"></textarea></label>
    <label class="v8-review-agree"><input id="v8-c1-topology" type="checkbox">
     我已经对照原题确认八个顶点 ID 的对应关系、长方体全部 12 条棱与 6 个面的闭合凸拓扑。</label>
    <p class="v7-warning">仅支持已知拓扑的单个凸长方体。已证明的顶点与部分来源轮廓可进入唯一 V5；隐藏线和完整实体解答仍待认证。</p>
   </fieldset>
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
    <label>截切后保留材料侧（必须人工确认）
     <select id="v7-p-kept" aria-label="截平面保留材料侧">
      <option value="unreviewed">未确认：虚实线全部不确定</option>
      <option value="positive">保留平面法向正侧</option>
      <option value="negative">保留平面法向负侧</option>
     </select>
    </label>
    <p class="v7-warning">保留侧仅用于已有长方体截交边开区间射线证明，不证明端点、整条虚实线或完整切后实体。</p>
   </fieldset>

   <fieldset data-v7-task="composition" hidden>
    <legend>组合体 · 同一个本机项目</legend>
    <section class="v8-c2-entry" aria-labelledby="v8-c2-title">
     <h3 id="v8-c2-title">C2 · 两个已知长方体</h3>
     <p class="v7-note">按原题填写两个长方体的最小角与最大角（x、y、z，单位 mm）。
      确认后直接计算同一几何场景的投影与接触关系，不自动推导未知轮廓。</p>
     <div class="v8-c2-grid">
      <fieldset><legend>形体 A</legend><div class="v7-xyz">
       <label>最小 x<input id="v8-c2-a-x0" type="number" step="any"></label>
       <label>最小 y<input id="v8-c2-a-y0" type="number" step="any"></label>
       <label>最小 z<input id="v8-c2-a-z0" type="number" step="any"></label>
       <label>最大 x<input id="v8-c2-a-x1" type="number" step="any"></label>
       <label>最大 y<input id="v8-c2-a-y1" type="number" step="any"></label>
       <label>最大 z<input id="v8-c2-a-z1" type="number" step="any"></label>
      </div></fieldset>
      <fieldset><legend>形体 B</legend><div class="v7-xyz">
       <label>最小 x<input id="v8-c2-b-x0" type="number" step="any"></label>
       <label>最小 y<input id="v8-c2-b-y0" type="number" step="any"></label>
       <label>最小 z<input id="v8-c2-b-z0" type="number" step="any"></label>
       <label>最大 x<input id="v8-c2-b-x1" type="number" step="any"></label>
       <label>最大 y<input id="v8-c2-b-y1" type="number" step="any"></label>
       <label>最大 z<input id="v8-c2-b-z1" type="number" step="any"></label>
      </div></fieldset>
     </div>
     <label class="v8-review-agree"><input id="v8-c2-ack" type="checkbox">
      已按题图核对两个长方体的全部尺寸、位置和接触方式，确认这是当前项目的新输入。</label>
     <button type="button" id="v8-c2-build" class="v7-primary" disabled>确认形体并计算组合关系</button>
     <p id="v8-c2-status" class="v7-note" role="status">仅支持空组合体项目；已有对象请使用下方编辑器，避免覆盖原有条件。</p>
     <p class="v7-warning">结果仅证明已知形体的空间接触、投影及局部来源；实体并集、内部接缝、全部端点与标准虚实线尚未签收，不生成完整 V5 答案。</p>
    </section>
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
    <p id="v7-c-contacts" class="v7-note" role="status">空间组合关系尚未计算；必须确认至少两个闭合实体。相接或重叠也不代表已完成实体并集或虚实线证明。</p>
    <p id="v7-c-stroke-proof" class="v7-note" role="status" aria-live="polite">正式 V5 线条证据尚未计算；所有未经签收的工程实线、虚线仍保持未判定。</p>
    <fieldset class="v7-relation-editor">
     <legend>对象间约束 · M2 残差核验</legend>
     <p class="v7-warning">仅检查已确认几何的距离、重合、等长、平行或垂直；不能自动求未知点、证明唯一解或生成 V5。</p>
     <label>关系 ID <input id="v7-r-id" value="Relation1" maxlength="80" autocomplete="off"></label>
     <label>已存关系列表 <select id="v7-r-list"><option value="">新关系</option></select></label>
     <label>对象 A <select id="v7-r-a"><option value="">选择对象</option></select></label>
     <label>对象 B <select id="v7-r-b"><option value="">选择另一对象</option></select></label>
     <label>关系 <select id="v7-r-kind">
      <option value="distance">点间距离</option><option value="coincident">点重合</option>
      <option value="equal-length">线段等长</option><option value="parallel">平行</option>
      <option value="perpendicular">垂直</option></select></label>
     <label>目标长度（mm，仅点间距离） <input id="v7-r-distance" type="number" step="any" value="10"></label>
     <div class="v7-compose-actions">
      <button type="button" id="v7-r-stage">保存待确认关系</button>
      <button type="button" id="v7-r-confirm">人工确认关系</button>
      <button type="button" id="v7-r-remove" class="v7-danger">删除关系</button>
     </div>
     <p id="v7-r-status" role="status" class="v7-note">关系必须经人工确认后核对数值残差。</p>
    </fieldset>
    <details class="v7-unknowns">
     <summary>通用 M3 未知点求解（二维 / 三维）</summary>
     <p class="v7-warning">独立仿射点约束：仅适用于固定坐标、单轴数值、点重合、相对位移和中点。与上方非线性 M2 关系不能自动合并，距离、切线、角度暂不支持。结果无原图自动识别或 V5 证明。</p>
     <label>空间维度 <select id="v7-u-frame">
      <option value="model-mm-2d">二维模型 mm</option>
      <option value="model-mm-3d">三维模型 mm</option>
     </select></label>
     <label>未知点 IDs（以逗号分隔）<input id="v7-u-points" value="A,B" maxlength="250" autocomplete="off"></label>
     <label>约束 ID <input id="v7-u-id" value="AnchorA" maxlength="80" autocomplete="off"></label>
     <label>已有约束 <select id="v7-u-list"><option value="">添加新约束</option></select></label>
     <label>约束类型 <select id="v7-u-kind">
      <option value="fixed">固定点坐标</option>
      <option value="axis">单轴坐标</option>
      <option value="coincident">两个点重合</option>
      <option value="offset">两点相对位移</option>
      <option value="midpoint">三点中点关系</option>
      <option value="distance">两点距离（非线性）</option>
      <option value="angle">三点夹角（非线性）</option>
     </select></label>
     <div class="v7-unknown-grid">
      <label>A（固定点 / 起点）<input id="v7-u-a" value="A" maxlength="80"></label>
      <label>B（对应点 / 终点）<input id="v7-u-b" value="B" maxlength="80"></label>
      <label>M（中点）<input id="v7-u-m" value="M" maxlength="80"></label>
      <label>单轴方向 <select id="v7-u-axis"><option value="x">X</option><option value="y">Y</option><option value="z">Z</option></select></label>
      <label>X / 距离 mm / 角度 ° <input id="v7-u-x" type="number" step="any" value="0"></label>
      <label>Y / ΔY mm <input id="v7-u-y" type="number" step="any" value="0"></label>
      <label>Z / ΔZ mm <input id="v7-u-z" type="number" step="any" value="0"></label>
     </div>
     <label>非线性数值初值（仅含距离或夹角关系时需要，每行一个分支猜测）
      <textarea id="v7-u-seeds" rows="3" spellcheck="false" placeholder="0,0;4,0;2,2
0,0;4,0;2,-2"></textarea>
     </label>
     <p class="v7-warning">每行依照“未知点 IDs”顺序输入各点坐标，点之间用分号、轴之间用逗号。多行代表不同的人工初始猜测；最多 4 个点、6 行。候选根仅供数学核对，不显示成正式作图或答案。</p>
     <div class="v7-compose-actions">
      <button type="button" id="v7-u-append">保存待确认约束</button>
      <button type="button" id="v7-u-remove" class="v7-danger">删除选中约束</button>
      <button type="button" id="v7-u-confirm">人工确认整组条件</button>
      <button type="button" id="v7-u-solve" class="v7-primary">计算未知点</button>
      <button type="button" id="v7-u-reset" class="v7-danger">清空未知点系统</button>
     </div>
     <p id="v7-u-status" class="v7-note" role="status">手工确认后：仿射方程可给出唯一性证明；非线性仅报告局部候选与残差，不授予 V5。</p>
    </details>


   </fieldset>
   <section class="v8-review-check" aria-labelledby="v8-review-title">
    <h3 id="v8-review-title">核对条件并解题</h3>
    <p class="v8-review-lead">以下内容取自当前填写的条件，并非自动识图结果。</p>
    <p id="v8-review-summary" class="v8-review-summary" role="status">请选择解题类型并检查输入。</p>
    <label class="v8-review-agree"><input id="v8-review-ack" type="checkbox">
     我已逐项核对题目、尺寸、单位及必要的解题分支。</label>
    <button type="button" id="v8-review-run" class="v7-primary" disabled>确认并开始计算</button>
    <p class="v8-review-help">确认后使用现有数学求解器；条件冲突或证据不足仍会阻止正式答案。</p>
   </section>
   <p id="v7-review" class="v7-note" role="status">等待人工确认。</p>
   <div class="v7-advanced"><strong>更多已存在专业工具</strong>
   <a href="labs/auto-fillet-live.html">二维圆弧</a><a href="labs/cone-cut-live.html">圆锥斜截</a>
   <a href="labs/recognition-qa.html">本机识图候选检查</a></div>
  </section>
  <section class="v7-card v7-paper" aria-label="统一几何视图"><div class="v7-line"><h2>工程图纸 · 第一角法</h2>
   <label>显示 <select id="v7-mode"><option value="split">二维 + 三维</option><option value="2d">仅二维</option><option value="3d">仅三维</option></select></label>
   <button type="button" id="v8-paper-focus" aria-pressed="false" aria-controls="v7-sheet">放大图纸</button></div>
   <svg id="v7-sheet" viewBox="0 0 720 460" role="img" aria-label="统一求解结果的正面 V、水平 H、侧面 W 与 V5 作图"></svg>
   <div class="v7-spatial"><div class="v7-line"><strong>同一数学场景的空间视图</strong><span id="v7-spatial-boundary">点投影 / 长方体仅线框</span></div>
    <svg id="v7-3d" viewBox="0 0 500 220" role="img" aria-label="可旋转的空间点与坐标轴"></svg>
    <div class="v7-xyz"><label>旋转 <input id="v7-yaw" type="range" min="-180" max="180" value="0"></label>
    <label>俯仰 <input id="v7-pitch" type="range" min="-70" max="70" value="25"></label></div></div>
   <p class="v7-note" id="v7-selection">点选 V/H/W 或三维点，同步高亮同一个对象。</p>
  </section>
  <section class="v7-card v7-steps" aria-label="统一 V5 播放与数学证据"><h2>真实作图步骤 · V5</h2>
   <p id="v8-result-status" class="v8-result-status" role="status">尚未求解。请先确认条件。</p>
   <details class="v8-proof-details">
    <summary>查看数学验证与线型依据</summary>
    <p id="v7-proof" class="v7-note" role="status">未计算。恢复项目后必须重新求解，不能继承“已验证”。</p>
    <p id="v7-spatial-v5-readiness" class="v7-warning" role="status" hidden>空间实体的完整轮廓、端点及标准虚实线尚未签收。</p>
   </details>
   <div class="v7-controls"><button id="v7-back" type="button">上一步</button><button id="v7-play" type="button">▶ 播放</button><button id="v7-next" type="button">下一步</button></div>
   <label>播放进度 <input id="v7-seek" type="range" min="0" max="1000" value="0"></label>
   <div class="v7-line"><label>速度 <select id="v7-speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option><option value="3">3×</option></select></label>
    <label><input type="checkbox" id="v7-guides" checked> 辅助线</label><label><input type="checkbox" id="v7-mono"> 黑白</label></div>
   <div id="v7-step-list" aria-label="可点选作图步骤"></div>
   <p class="v7-warning">正式解题仅限当前已通过 M3/M5 验收的数学范围。C1、C2、C3 只展示已证明的局部几何与辅助作图；未认证的整体轮廓、隐藏线及相贯曲线不能作为标准答案导出。</p>
  </section>
 </div>
</section>
<section class="next-home-hero next-home-workbench next-home-v64 v8-project-strip" id="ai" aria-label="工程制图解题首页">
  <details class="v8-optional-illustration"><summary>查看圆弧连接示例图纸</summary>
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
  </details>
<aside class="next-home-workflow" aria-label="最近任务与我的题目">
  <section class="next-home-workflow-card next-home-continue" id="recent">
   <div class="next-home-card-heading"><h2>继续解题</h2><a href="#project-workbench">进入工作台 →</a></div>
   <div class="next-home-empty-illustration" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="7" y="6" width="34" height="36" rx="5"/><path d="M14 16h20M14 23h15M14 30h10"/><path d="M32 30l4 4-4 4"/></svg></div>
   <p class="next-home-empty-title">暂无可恢复的解题记录</p>
   <p class="next-home-empty-note">历史进度同步尚未接入，不会在这里显示虚构的“上次编辑”。</p>
   <a class="next-home-continue-button" href="#project-workbench">返回解题工作台</a>
  </section>
  <section class="next-home-workflow-card next-home-library" id="knowledge">
   <div class="next-home-card-heading"><h2>我的题目</h2><a href="#tools">选择题型 →</a></div>
   <div class="next-home-library-empty"><span aria-hidden="true">▤</span><div><strong>本机项目</strong><p>已保存项目可从上方工作台打开。</p></div></div>
  </section>
 </aside>
</section>
<section class="next-home-section next-home-categories" id="tools">
 <div class="next-section-heading"><h2>更多专项题型</h2><a href="#all-tools">查看全部工具 →</a></div>
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
