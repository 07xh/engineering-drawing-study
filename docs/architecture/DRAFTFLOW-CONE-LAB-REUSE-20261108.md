# 绘序 DraftFlow × Cone Lab 复用与分层接入（2026-11-08）

## 0. 目标与基线

- 绘序仓库：`07xh/engineering-drawing-study`；本分支从 2026-11-08 当时的 `main` `51bec7b43d755fbffbb336466aed5b0ffb94ecd7` 开始。
- 源仓库：`gugugaga-design/cone-lab`；固定源提交 `6aae2535f267fdc32a813c196062f33aaf6bfe0b`。
- 原项目 LICENSE：MIT，保留在 `labs/cone-lab/LICENSE.txt`；其内置 Three.js r160 的 MIT 许可证保留在 `THREE-LICENSE.txt`。
- 目标不是第二套 DraftFlow 求解器或 V5；优先保留上游的 **自由拼装、尺寸编辑、自动吸附、截切、相贯线、点选分块、正交视图** 全部体验。
- 现有 `labs/free-modeler.html` 的点、线、三角面自由几何编辑保留，功能互补，不替换、不删旧入口。

## P0：隔离式、可回退的完整拼装实验室（本 PR）

- 原封保留上游 `src/index.html`、`src/lib/three.min.js`、`src/lib/OrbitControls.js`；以 `labs/cone-lab/` 静态独立页面运行，避免 Three.js 运行时或全局变量与绘序已有 V5/场景混用。
- 加入 `scripts/build-static.cjs` 的 **五个明确白名单文件**，不发布上游 APK、README、测试、截图等额外内容。
- `ui-next/enhance-page.cjs` 对该独立路径跳过通用 body/main 改写，否则可能破坏原版全屏 `#stage` 和首页 `#home` 的交互。
- 首页 `ui-next/home.cjs` 专项工具和 C2 组合体卡片增加入口；既有点线面编辑页增加关联入口。
- `scripts/check-cone-lab-vendor.cjs` 验证 dist 和 dist-ui-next 均原样包含上游五文件、依赖离线、几何功能入口存在、导航链接可达；在既有 GitHub CI 中调用。
- P0 的“通过”仅说明静态资产、构建及页面入口通过，**不代表** WebGL 真机交互或几何正确性验收完成。

### P0 交互验收（Android/浏览器）

1. 从首页「实体自由拼装」打开，确保不跳外站、不请求 CDN；能正常返回绘序。
2. 进入自由拼装，添加圆柱和长方体，能够独立调整尺寸、位置、角度，旋转/缩放场景。
3. 拖动两个相邻部件，验证缓慢与跨帧越过目标的吸附路径（参考上游 v33.35 修复）。
4. 两部件相交时打开相贯线；切换点选保留，点击棱锥顶只隐藏对应分区，其他区域不误消失。
5. 主视/俯视/左视和对面视图方向及遮挡符合当前实验室规则；小屏、横竖屏、返回恢复无卡死。
6. 将上述场景记为上游展示能力，而非绘序正式制图答案；不赋予虚实线/几何证明标志。

## P1：模型数据桥接（本 PR 新增文件交换能力）

**已实现：** `labs/cone-lab/model-bridge.js` 使用上游自身的 `snapState()/applySnapshot()` 在原编辑器中提供「导出模型 JSON」「导入模型 JSON」，保留主体形状、倒放、拼装部件、面、相贯体和可选分块。原版 HTML 仅增加依赖脚本和状态桥接钩子，不接管 Three.js 几何计算。成功导入后重置撤销栈，避免撤销回上一份用户模型。

- `documentFromState(state)` 负责生成草稿；`parseDocument(json)` 是无 DOM 副作用的校验解析接口，可供下一步现有 Geometry Scene 消费者复用。
- 严格 Schema：`draftflow.conelab.model.v1`、`unit=mm`、固定上游 commit/坐标系；`model` 内保留 `shape/flipped/parts/faces/cyls/pickSel`，其中每项只接收上游支持的参数。
- 导入限制 1 MB、部件最多 6、相贯体最多 4、切割面最多 12、选择记忆最多 512 项；拒绝无效尺寸、NaN/非数值坐标、未知形状/角度类型、伪造认证状态与不兼容 Schema。
- 不传送个人数据到服务端，用户手动导出文件并在本机选择导入。浏览器下载 JSON 不是自动持久化到绘序当前项目；刷新后需重新导入文件。
- 所有模型一律标记为 **`unverified-preview`**，不能因“能在 3D 中画出来”升级到 M4/M5 的正式标准线型和答案。
- **尚未实现：** 导入到绘序统一项目存储或自动变换到 Geometry Scene，属于 P2 首项，不能宣称与 V5 已联动。

实际序列化示例（不代表已经可由正式求解器消费）：

```json
{
  "schema": "draftflow.conelab.model.v1",
  "unit": "mm",
  "source": {
    "repository": "gugugaga-design/cone-lab",
    "commit": "6aae2535f267fdc32a813c196062f33aaf6bfe0b"
  },
  "coordinates": {"frame":"cone-lab","x":"right","y":"up","z":"toward-viewer"},
  "verification": "unverified-preview",
  "model": {
    "shape":"lab",
    "flipped":false,
    "parts":[{"k":"box","type":"horiz","ang":0,"x":0,"y":0,"z":0,"w":40,"d":25,"h":20,"on":true,"open":true}],
    "faces":[],
    "cyls":[],
    "pickSel":{}
  }
}
```

注意坐标变换尚未执行：原版的 `(X,Y,Z)` = 右、上、前；绘序通常用 `(x,y,z)` = 右、前、上。待使用非对称参照模型及投影方向检验，才确定目标轴符号与三视图镜像关系。不得通过简单轴交换把相贯线直接认证为绘序答案。

## P2：映射到共享 Geometry Scene / C2、C3

### P2.1 + P2.2a 已提交（精确多面体导入到同一个组合体工作台）

- 使用 `project/cone-lab-geometry-adapter.cjs`，先调用现有 `labs/cone-lab/model-bridge.js` 的 Schema 验证器；只允许 `lab` 自由拼装模式中**完整、启用、未切割**的 `box/cube/pyr3`。
-  复用绘序现有 `prismMesh` 创建盒体 8 顶点/12 棱/6 面精确拓扑，按上游 `THREE.CylinderGeometry(0,r,h,3)` 的数学参数给三棱锥创建 4 顶点/6 棱/4 面（3 个正三角底面顶点+顶点）；按上游 `Quaternion.setFromUnitVectors(Y,n)` 同义旋转每个部件，不凭屏幕截图反求几何。
- 坐标转换固定为 `(x,y,z)_DraftFlow = (X,-Z,Y)_ConeLab`，这是一种保持右手系的正交旋转；**W 观测方向映射到 Cone Lab 的右视 +X，不能冒称其左视 -X**。在非对称、斜向模型测试中核查 V/H/W 投影。
- 通过现有 `validateGeometry` → `deriveGeometryScene` → `compileGeometryScene` 输出与绘序主线**完全同一 Schema** 的三视图/空间预览；场景的 visibility 必须是 `undetermined`，math/V5 仍待正式证据。
- 绘序首页 `组合体` 任务中增加 `v8-conelab-file` 模型文件入口，调用现有 `project-coordinator` / `local-project-store` 创建**独立本机新项目**，全部条件初始 `confirmed:false`。整份 JSON、所有对象和项目先在内存通过检查，再保存并打开；禁止部分导入。
- 用户通过已经存在的「选择对象→确认几何→显示组合体」流程手动核对后，才允许 existing session 根据同一数学场景建立投影；即使所有条件已确认，也只能生成 `composition-evidence`，不可获得 `verified`、正式 V5 播放时钟或标准线型导出。
- 含任一 `cone/cyl/sphere/frustum/slot/hemi` 曲面部件、主立体、截切面、相贯体、隐藏块或禁用部件时**明确拒绝 P2.1/P2.2a 导入**；原 Cone Lab 实验室仍能原样编辑这些配置，保存/导入 JSON 不受影响。
- P2.1 自动化必须覆盖原版六种方向四元数、非对称顶点、首角法观察光线、网格拓扑、兼容项目结构、未确认→显式确认→依然未获得 V5 的真实主线验收。

### P2.2a 精确正三棱锥 + 来源身份 + 防止误改（本 PR 新增）

- `pyr3` 的上游渲染实际为 `THREE.CylinderGeometry(0,r,h,3)`，**是有限平面棱面体**：顶点为 `(0,+h/2,0)`，底面 `(r sin(2πi/3),-h/2,r cos(2πi/3))`，`i=0,1,2`。输入映射保持上游角度方向和源几何身份；不使用三角网格来伪装圆锥表面。
- 绘序正式模型中的 `importedFromConeLab` 仅用于来源/只读编辑判断，不是 `verified` 数学证明。提供上游真实 `_id` 时用 `ConePartSrc_...` 稳定 ID；旧文件缺少 `_id` 才回退索引 ID，重复 `_id` 禁止导入。
- **重要防误改修复：** 原组合体高级编辑器只会编辑轴对齐长方体；对于任意导入的旋转盒体、三棱锥，选中只允许核对、确认或删除，不能把它重算成 AABB 后覆盖，修改几何必须在原实验室重新导出。
- CI 应核验独立三角底面半径、棱长、四面、方向与真实主线 `composition-evidence` 的未认证状态。

### P2.2b 后续曲面解析实体、截交和相贯（不伪称已完成）

- 为圆柱、圆锥、球、棱锥、圆台、复杂槽体建立与现有可信 CAD/解析库对应的几何来源表示；上游曲面细分不应默认为真实解析求交。
- 与真实切割面和相贯体映射后，使用当前 M0–M5 数学门禁证明区间、端点和可见性；通过证明前一律 `undetermined`。
- 完成浏览器及 Android 真机交互、保存重新打开、非对称左右视图镜像的实测，不将 CI 结果等同生产验收。



- 只提取上游可复用的表面/体内判定、截交线、相贯线、分块连通与吸附算法，放入第三方适配层；不要直接复制到绘序 M0–M5 内。
- 保留 CAD/OCCT 或独立解析计算作为 oracle；对照原始对象拓扑、三维端点和接触/交线残差。**采样的多段线不是数学证明**。
- 使用现有 M0–M5、`SolveResult` 和共享 Geometry Scene；所有未知实体/退化条件/不稳定交线都保持 undetermined。
- 精度与符号验证需覆盖擦边相切、异形相贯、共面、退化长度、分离和相交、多对象遮挡。

## P3：唯一 V5 动画与第一角法标准作图

- 从 M4/M5 已签收的边/点/区间生成原有 `ConstructionIntent`/`ConstructionStep` DAG，由唯一 V5 播放器消费。
- 未签收的拓扑与连续可见性不得输出正式实线、虚线或答案动画；第一帧必须遵守 GIVEN-first 的无答案泄漏规则。
- 正式验收必须使用陌生教材整题 GIVEN、答案封存对照与浏览器/Android 真机记录。

## CI、发布与回退

- 先 P0 独立 PR，确认静态与主线检查完成，再合并；不可将 PR 创建或 CI 通过当作 Cloudflare 已上线。
- 不修改生产自动部署开关、密钥或域名；Cloudflare Production Active SHA 另查。
- 回退仅需删除白名单条目、首页链接和 `labs/cone-lab/`，不触碰现有 M0–M5/C1/C2/C3/V5。
- 原版代码高度单文件化，后续拆模块 **仅在上游整套行为与测试均得到保留时** 进行。
