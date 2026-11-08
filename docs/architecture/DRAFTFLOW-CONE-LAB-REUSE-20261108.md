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

## P1：模型数据桥接（后续独立改动，先定接口）

使用 **显式用户导出/导入**，不自动读取其他项目会话。不采用 DOM 抓取或渲染截图反推几何。

提议只读草稿 Schema（待按实际上游字段核验）：

```json
{
  "schema": "draftflow.conelab.model.v1",
  "unit": "mm",
  "source": {"project": "gugugaga-design/cone-lab", "commit": "6aae2535f267fdc32a813c196062f33aaf6bfe0b"},
  "revision": 1,
  "parts": [
    {"id": "p1", "kind": "box", "size": {"width": 40, "depth": 25, "height": 20},
     "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0]}}
  ],
  "cutters": [],
  "faces": []
}
```

- 此处是 **提议** 而非已实现 API，尤其 `kind`、尺寸和旋转参数需对照 Cone Lab 对象类型及方向进行双向映射。
- 候选坐标轴映射：上游 `(X,Y,Z)`（Y 竖直、Z 朝观察者）→ 绘序 `(x,y,z)=(X,Z,Y)`（目标三视图使用 V=(x,z)、H=(x,y)、W=(y,z)）。但相机左右手系与第一角法朝向需利用非对称测试件验证后再确定轴符号。
- 导入只创建 **未证明** 模型草稿；源对象 ID 和 revision 必须明确，修改后原证明失效；未确认单位不可按 mm 静默使用。
- P1 基本验收：两种不同形状/尺寸/旋转的实体及截平面都能往返序列化；原模型不变；丢字段、未知类型、版本不匹配均显式报错。

## P2：映射到共享 Geometry Scene / C2、C3

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
