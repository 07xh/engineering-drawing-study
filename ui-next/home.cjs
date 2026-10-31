'use strict';
const TOOLS=[
 ['finite-cylinder-intersection-live','圆柱相贯线','查看已确认圆柱的交点与辅助作图。','打开工具'],
 ['cylinder-cut-live','圆柱截切实验','圆柱截切及对应三视图逐笔绘制。','打开实验'],
 ['prism-cut-live','棱柱截切实验','棱柱截切与投影作图。','打开实验'],
 ['cone-cut-live','圆锥斜截','圆锥斜截与同纸三视图。','打开实验'],
 ['c2-native-cut-review','通孔视图检查','导入已确认的几何文件，查看已核对的线条。','打开局部审核'],
 ['recognition-qa','本地识图质量检查','本地图像质量和图元候选检查。','打开检查'],
 ['auto-fillet-live','二维自动解题','修改尺寸，查看连接弧作图。','开始解题'],
 ['polygon-live','正多边形','正三角形、正六边形逐笔作图。','打开动态作图'],
 ['two-point-v5-live','双点投影','已知双点坐标，绘制三面投影。','打开预验收'],
 ['solid-third-view-live','已确认基本体补第三视图','两个已知视图及人工确认拓扑，复算八个角点与全部棱的三视图。','打开几何预览'],
 ['c1-reviewed-dxf-live','教材两视图已知量本地审核','导入已知图形，查看三维形状和作图步骤。','打开私有原题审核'],
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
const CATEGORIES=[["平面几何",["auto-fillet-live","circle-fillet-live","polygon-live","tangent-constraint","paper-geometry"]],["投影与空间",["finite-cylinder-intersection-live","point-projection-live","two-point-v5-live","solid-third-view-live","c1-reviewed-dxf-live","cone-cut-live","cylinder-cut-live","prism-cut-live","c2-native-cut-review","composite-geometry","free-modeler","dof-lab-v2","point-coach","point-construction"]],["辅助与实验",["recognition-qa","constraints","analysis"]]];
function homeHTML(){return `
<section id="ai" class="v8-legacy-anchor"></section>
<section class="v7-workspace" id="project-workbench" aria-labelledby="v7-title">
 <div class="v7-head"><div><h1 id="v7-title">工程制图解题</h1>
 <p>导入题图或输入条件，核对后开始求解与逐步作图。</p></div>
 <span id="v7-save" role="status" aria-live="polite">本机存储检查中…</span></div>
 <div class="v7-bar" aria-label="项目操作">
  <span id="recent" class="v8-legacy-anchor"></span><span id="knowledge" class="v8-legacy-anchor"></span>
  <p id="v7-storage-warning" class="v7-warning" role="status" hidden>本机存储不可用，当前编辑不会自动保存；请导出项目。</p>
  <label>本机项目 <select id="v7-projects" aria-label="选择本机项目"><option value="">暂无记录</option></select></label>
  <button type="button" id="v7-open">打开项目</button><button type="button" id="v7-new">新建项目</button>
  <button type="button" id="v7-export">导出 .daiproject</button>
  <label class="v7-file-control">导入项目包<input id="v7-import" type="file" accept=".daiproject,application/x-draftai-project"></label>
  <button type="button" id="v7-delete" class="v7-danger">删除当前项目</button>
 </div>
 <nav class="v7-mobile-jump" aria-label="工作台快捷导航">
  <a href="#v7-input-section">填写条件</a><a href="#v7-paper-section">查看图纸</a><a href="#v7-step-list">作图步骤</a>
 </nav>
 <div class="v7-layout">
  <section id="v7-input-section" class="v7-card v7-input" aria-label="题图和条件审核"><h2>题目与条件</h2>
   <label>项目名称<input id="v7-title-input" maxlength="120" value="未命名项目" autocomplete="off"></label>
   <label class="v7-file-control">选择本机原题图片<input id="v7-image-input" type="file" accept="image/png,image/jpeg,image/webp"></label>
   <div id="v7-photo-box" class="v7-photo-box" hidden>
    <img id="v7-photo" alt="当前项目在设备内保存的原题参考图片，点击确定量测端点" hidden>
    <svg id="v7-photo-marks" viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet"
     aria-label="原图两组量测线段及端点" aria-hidden="true"></svg>
    <button type="button" id="v8-photo-zoom" class="v8-photo-zoom"
     aria-controls="v7-photo" aria-pressed="false"
     aria-label="放大原题图片以核对端点">放大原题</button>
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
    <option value="projection">单点三视图</option>
    <option value="planar">平面圆弧连接</option>
    <option value="exploration">长方体截切（预览）</option>
    <option value="composition">C2 组合体 · 已知形体</option>
    <option value="c1-third-view">C1 补第三视图 · 已确认单个凸体</option>
    <option value="c3-intersection">C3 相贯线 · 正交有限圆柱（部分结果）</option>
   </select></label>
   <p class="v7-note">已有条件时切换题型会新建项目，原项目保留；空项目可直接切换。</p>
   <fieldset data-v7-task="projection"><legend>空间点 P（模型 mm）</legend><div class="v7-xyz">
    <label>x <input id="v7-x" type="number" step="any" value="15"></label>
    <label>y <input id="v7-y" type="number" step="any" value="10"></label>
    <label>z <input id="v7-z" type="number" step="any" value="12"></label>
   </div><button type="button" id="v7-stage" hidden>保存条件</button>
   <button type="button" id="v7-confirm" hidden>确认条件</button>
   <button type="button" id="v7-solve" hidden class="v7-primary">开始求解与作图</button></fieldset>
   <div class="v7-nonpoint-actions" hidden><button type="button" id="v7-stage-other" hidden>保存条件</button>
    <button type="button" id="v7-confirm-other" hidden>核对并确认</button>
    <button type="button" id="v7-solve-other" hidden class="v7-primary">开始求解</button></div>

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
    <label>题目中的实体组合方式（不确定则保留未选择）
     <select id="v8-c3-solid-op">
      <option value="" selected>未选择 · 只计算原始相贯线来源</option>
      <option value="intersection">交集 · 保留两圆柱的共同体积</option>
      <option value="union">并集 · 保留两个圆柱的总体积</option>
     </select></label>
    <p class="v7-note">修改圆柱半径、位置或端盖后，原轴向与端盖勾选将自动取消，须重新对照原题确认；完整轮廓和虚实线仍需核对。</p>
    <label class="v8-review-agree"><input id="v8-c3-axes" type="checkbox">
     我已核对真实题目中两根圆柱的正交轴向、位置与毫米尺寸。</label>
    <label class="v8-review-agree"><input id="v8-c3-caps" type="checkbox">
     我已核对两个有限圆柱的端盖位置及截断范围。</label>
    <p class="v7-warning">当前显示交点和辅助作图；相贯线的虚实线尚未确定。</p>
   </fieldset>
   <fieldset data-v7-task="c1-third-view" hidden>
    <legend>C1 · 补第三视图（八角点闭合凸体）</legend>
    <p class="v7-note">先按原题核对八个对应点，输入模型毫米坐标。第一角法：V=(x,z)，H=(x,y)，W=(y,z)；
    同一角点在两张视图中共同的 x、y 或 z 必须一致。此处不从题图猜测顶点身份或拓扑。</p>
    <label>已知视图 <select id="v8-c1-pair">
     <option value="VH">正面 V + 水平 H</option>
     <option value="VW">正面 V + 侧面 W</option>
     <option value="HW">水平 H + 侧面 W</option>
    </select></label>
    <p id="v8-c1-columns" class="v7-note" role="status" aria-live="polite">当前列顺序：编号、正面 V 的 x,z、水平 H 的 x,y（mm）。</p>
    <label>八个角点（每行：编号, 第一视图 u,v, 第二视图 u,v；单位 mm）
     <textarea id="v8-c1-vertices" rows="9" spellcheck="false"
      aria-describedby="v8-c1-columns"
      placeholder="V000,0,0,0,0"></textarea></label>
    <button type="button" id="v8-c1-template" class="v8-c1-template" aria-controls="v8-c1-vertices">插入8行空白顶点编号</button>
    <p id="v8-c1-template-status" class="v7-note" role="status" aria-live="polite"></p>
    <p class="v7-note">修改角点或已知视图组合会取消原有拓扑勾选并撤销旧动画；请重新对照原题确认。坐标冲突或重合角点会提示具体编号。</p>
    <label class="v8-review-agree"><input id="v8-c1-topology" type="checkbox">
     我已经对照原题确认八个顶点 ID 的对应关系、单个八角点实体全部 12 条棱与 6 个面的闭合凸拓扑。</label>
    <p class="v7-warning">请确认八个对应角点和完整闭合形体；仅支持符合条件的凸体。</p>
   </fieldset>
   <fieldset data-v7-task="planar" hidden>
    <legend>二维圆弧连接 · 两条有限线段（模型 mm）</legend>
    <p class="v7-note">确认两条线段的端点、半径、分支及方向。</p>
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
    <p class="v7-warning">当前仅显示立体线框和三视图，截线与虚实线尚不支持。</p>
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
     <p id="v8-c2-preflight" class="v8-c2-preflight" data-state="blocked" role="status" aria-live="polite">请填写形体 A 和 B 的已知尺寸。</p>
     <button type="button" id="v8-c2-locate" class="v8-c2-locate" hidden>定位需要修改的尺寸</button>
     <button type="button" id="v8-c2-existing" class="v8-c2-locate" aria-controls="v8-c2-advanced" hidden>查看和编辑已有形体</button>
     <label class="v8-review-agree"><input id="v8-c2-ack" type="checkbox" aria-describedby="v8-c2-preflight" disabled>
      已按题图核对两个长方体的全部尺寸、位置和接触方式，确认这是当前项目的新输入。</label>
     <button type="button" id="v8-c2-build" class="v7-primary" aria-describedby="v8-c2-preflight" disabled>确认形体并计算组合关系</button>
     <p id="v8-c2-status" class="v7-note" role="status">只在空组合体项目中添加两形体，不覆盖已有对象。</p>
     <p class="v7-warning">当前显示已知形体的接触和投影；完整轮廓和虚实线尚未确定。</p>
    </section>
    <details class="v8-c2-advanced" id="v8-c2-advanced">
     <summary>更多：编辑单个对象、约束与未知点</summary>
    <p class="v7-warning">已有对象或更复杂的题目可在此逐个编辑和确认；当前不生成完整虚实线。</p>
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
    <p id="v7-c-stroke-proof" class="v7-note" role="status" aria-live="polite">尚未判定线条的虚实。</p>
    <fieldset class="v7-relation-editor">
     <legend>对象间约束 · M2 残差核验</legend>
     <p class="v7-warning">可检查距离、重合、等长、平行或垂直；暂不求未知点。</p>
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
     <summary>未知点求解（二维 / 三维）</summary>
     <p class="v7-warning">支持固定坐标、点重合、相对位移和中点；暂不支持距离、切线或角度。</p>
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
     <p id="v7-u-status" class="v7-note" role="status">确认条件后可检查解的情况。</p>
    </details>
    </details>

   </fieldset>
   <section class="v8-review-check" aria-labelledby="v8-review-title">
    <h3 id="v8-review-title">核对条件并解题</h3>
    <p class="v8-review-lead">以下内容取自当前填写的条件，并非自动识图结果。</p>
    <p id="v8-review-summary" class="v8-review-summary" role="status">请选择解题类型并检查输入。</p>
    <p id="v8-review-preflight" class="v8-review-preflight" data-state="pending" role="status" aria-live="polite">请先填写题目条件。</p>
    <button type="button" id="v8-review-edit" class="v8-review-edit" hidden>定位需要修改的条件</button>
    <input id="v8-review-ack" type="checkbox" hidden aria-hidden="true" tabindex="-1">
    <button type="button" id="v8-review-run" class="v7-primary" aria-describedby="v8-review-preflight" disabled>我已核对，开始求解</button>
    <p class="v8-review-help">确认后使用现有数学求解器；条件冲突或证据不足仍会阻止正式答案。</p>
   </section>
   <p id="v7-review" class="v7-note" role="status">等待人工确认。</p>
   <div class="v7-advanced"><strong>更多已存在专业工具</strong>
   <a href="labs/auto-fillet-live.html">二维圆弧</a><a href="labs/cone-cut-live.html">圆锥斜截</a>
   <a href="labs/recognition-qa.html">本机识图候选检查</a></div>
  </section>
  <section id="v7-paper-section" class="v7-card v7-paper" aria-label="统一几何视图"><div class="v7-line"><h2>工程图纸 · 第一角法</h2>
   <label>显示 <select id="v7-mode"><option value="split">二维 + 三维</option><option value="2d">仅二维</option><option value="3d">仅三维</option></select></label>
   <button type="button" id="v8-paper-focus" aria-pressed="false" aria-controls="v7-sheet">放大图纸</button></div>
   <svg id="v7-sheet" viewBox="0 0 720 460" role="img" aria-label="正面 V、水平 H、侧面 W 和作图步骤"></svg>
   <div class="v7-playback" aria-label="作图播放控制">
   <div class="v7-controls"><button id="v7-back" type="button">上一步</button><button id="v7-play" type="button">▶ 播放</button><button id="v7-next" type="button">下一步</button></div>
   <label>播放进度 <input id="v7-seek" type="range" min="0" max="1000" value="0"></label>
   <div class="v7-line"><label>速度 <select id="v7-speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option><option value="3">3×</option></select></label>
    <label><input type="checkbox" id="v7-guides" checked> 辅助线</label><label><input type="checkbox" id="v7-mono"> 黑白</label></div>
   </div>
   <div class="v7-spatial"><div class="v7-line"><strong>空间视图</strong><span id="v7-spatial-boundary">点投影 / 长方体仅线框</span>
    <button type="button" id="v9-three-reframe" class="v9-three-reframe" aria-controls="v9-three-space v7-3d">重新取景</button></div>
    <div id="v9-three-space" class="v9-three-space" role="group" aria-label="三维立体旋转与来源棱拾取" hidden></div>
    <svg id="v7-3d" viewBox="0 0 500 220" role="img" aria-label="可旋转的空间点与坐标轴"></svg>
    <div class="v7-xyz"><label>旋转 <input id="v7-yaw" type="range" min="-180" max="180" value="0"></label>
    <label>俯仰 <input id="v7-pitch" type="range" min="-70" max="70" value="25"></label></div></div>
   <p class="v7-note" id="v7-selection" role="status" aria-live="polite">点选 V/H/W 或三维点，同步高亮同一个对象。</p>
  </section>
  <section class="v7-card v7-steps" aria-label="作图步骤与播放"><h2>作图步骤</h2>
   <div id="v7-step-list" aria-label="可点选作图步骤"></div>
   <p id="v8-result-status" class="v8-result-status" role="status">尚未求解。请先确认条件。</p>
   <details class="v8-proof-details">
    <summary>查看数学验证与线型依据</summary>
    <p id="v7-proof" class="v7-note" role="status">未计算。恢复项目后必须重新求解，不能继承“已验证”。</p>
    <p id="v7-spatial-v5-readiness" class="v7-warning" role="status" hidden>空间实体的完整轮廓、端点及标准虚实线尚未签收。</p>
   </details>
   <p class="v7-warning">部分题型仅显示局部作图；未确认的完整轮廓和虚实线不能作为答案导出。</p>
  </section>

 </div>
 <section class="v7-course-entry" id="v7-course-entry" aria-labelledby="v7-course-title">
  <details class="v8-course-disclosure">
  <summary class="v8-course-summary">专项题型与支持范围</summary>
  <div class="v7-course-head"><h2 id="v7-course-title">C1 补第三视图 · C2 组合体 · C3 相贯线</h2>
   <p>这些入口在新标签打开，不会切换本机项目题型、删除已确认条件；未完成的预览不等于正式答案。</p></div>
  <div class="v7-course-grid" role="list">
   <article class="v7-course-card" role="listitem" data-course="intersection" data-capability="math-demo">
    <span class="v7-course-status">有限圆柱相贯线</span>
    <h3>相贯线</h3><p>对人工确认的两根有限正交圆柱，解析求交并在 V/H/W 中逐步绘制已验证的端点和内部辅助点；连续曲线仍为未签线型的预览。</p>
    <div class="v7-course-links"><a href="labs/finite-cylinder-intersection-live.html" target="_blank" rel="noopener noreferrer">打开相贯线作图 ↗</a>
     <a href="labs/composite-geometry.html?mode=intersection" target="_blank" rel="noopener noreferrer">查看曲面相交 ↗</a></div>
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
     <a href="labs/c1-reviewed-dxf-live.html" target="_blank" rel="noopener noreferrer">导入两视图 ↗</a>
     <a href="labs/two-point-v5-live.html" target="_blank" rel="noopener noreferrer">两视图 A/B 对应点与棱线预览 ↗</a>
     <a href="labs/point-projection-live.html" target="_blank" rel="noopener noreferrer">单点投影求解 ↗</a></div>
   </article>
  </div>
  <p class="v7-course-disclosure">部分题型仍待完整线型验证；未验证的结果不会作为正式答案。</p>
  </details>
 </section>
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
<footer class="next-footer"><a href="public-use.html">帮助</a></footer>
`;}
module.exports={homeHTML};
