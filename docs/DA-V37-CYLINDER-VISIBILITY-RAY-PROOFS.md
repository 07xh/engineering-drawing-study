# DraftAI 04｜截切圆柱的三维视线遮挡数学内核（V3.7）

这一批承接已经合并的 #283（圆柱实体截切的**一维闭合周界**）与 #285（内部三视 V5 作图），独立开发**真正的观察射线—保留实体内点相交判断**。不能再根据曲线的位置、颜色或固定截图猜测是否为虚线。

## 为什么必须显式指定保留实体的一侧

同一个圆柱、同一个斜截平面，如果保留平面法向量的正侧与负侧，截交线的遮挡可以相反。因此使用者必须明确提供：

- `retainedHalfspace:'positive'|'negative'`：数学平面 `n·(x-plane.point)>=0` 或 `<=0` 一侧作为保留下来的圆柱实体；
- `observerDirection:{x,y,z}`：**从截交点朝向观察者**的空间单位方向（代码负责归一化）；不能擅自从 W 图的命名推断左视、右视方向；
- 原始毫米尺度的 Z 轴有限圆柱和已知截平面。

```js
const {classifyCylinderSectionVisibility}=require(
 './engines/spatial/sections/cylinder-cut-ray-visibility.cjs'
);
const result=classifyCylinderSectionVisibility(
 {baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:30},
 {point:{x:0,y:0,z:3},normal:{x:1,y:0,z:1}},
 {retainedHalfspace:'negative',
  observerDirection:{x:-1,y:0,z:0.2},samplesPerTurn:64}
);
```

## 具体数学证明

1. 内部重新执行 #283 的圆柱侧面截弧、端盖圆盘弦、单环拓扑残差验证。**不接受外部自行标记的 visible 或 Verified。**
2. 对空间截交点 `p` 的观察射线 `p+t·d`（`t>0`），先判断射线是否进入被切除的一侧；若进入，则不可能被单个保留实体挡住，因此该截线开区间可标记 `visible`。
3. 射线朝保留实体时，侧面点用圆柱径向法向导数 `cosθ*d_x+sinθ*d_y` 判断射线向圆柱内部还是外部行进。**不是采样猜可见性分界**：导数为 0 的两个轮廓母线角度从观察方向的极角解析求得，并把原截弧切成可视/不可视的开区间。
4. 端盖圆盘内的真实弦线用观察射线的 `d_z` 与端盖方向判断向实体内部（遮挡）还是外部（可见）；输出来源、端点、弦中点、V/H/W 坐标及残差。
5. 与截平面几乎平行的观察方向、圆柱径向切向观察、端盖边界接合端点，以及观察方向未确认的情况**保持 undetermined**。不会用猜测实线、虚线遮蔽不确定性。

输出 `runs[]` 中每段都有 `edgeId`、`kind`、`visibility:'visible'|'hidden'|'undetermined'`、几何三维位置、三视原始毫米坐标和证明来源。`visibilityVerified:true` 仅在所有**开区间**均已确定时出现；端点可见性单独保持 `boundaryEndpointVisibilityVerified:false`。

## 严格限制

- 当前只适用于**已知一个 Z 轴有限圆柱**被**一个明确非竖直平面**截切、明确移除哪侧材料、相机正交投影，且不包含其它实体的遮挡。不能处理任意工程图、任意旋转圆柱或相贯线。
- V/H/W 模型正投影坐标是既有数学事实；正式第一角法左视/右视的实际**观察方向和二维符号约定**尚需 03 的独立审定。没有通过审定前不能声称“三视图标准虚实线”已经上线。
- 每段的证明仅覆盖**开区间**，端点、轮廓切线的虚实变化边界没有被赋予虚构的线型。
- `standardViewMappingVerified:false`、`v5StrokeStyleReady:false`。当前不修改 V5 绘制核心，不通过 CSS 添加假虚线。需后续 03/07/09 审核后，以真实几何分类给 V5 线型与逐步动画应用样式。
- 没有对剖面区域填充、工程规范、人工上传的题图解析和生产站点部署作出已完成声明。

## 自动回归 / 并行隔离

新增 `engines/spatial/sections/cylinder-cut-ray-visibility.cjs`、`tests/workbench/v37-cylinder-cut-ray-visibility.test.cjs` 和本说明。回归覆盖保留半空间反转、观察者沿不同方向、侧面导数解析分割、上下端盖弦遮挡、切面平行/切向不可判定、三投影不变量、采样精度独立性、无解/病态 fail-closed 与参数不变性。通过既有 workbench CI 的 test glob 验收。

整批只写入 04 新文件，不改共享 core、08 识图、03 投影、07 动画播放器/页面、GitHub Actions 或 Cloudflare；便于并行开发和独立回退。
