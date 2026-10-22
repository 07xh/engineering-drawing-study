# DraftAI 04｜有限线段–平面与斜平面截圆柱侧面数学原型（V3.5）

本模块遵循 DraftAI 新定位：**为实际工程制图题提供可核验数学解和图元来源**，不是教材课程、固定题动画或 AI 猜图。该增量独立于正在开发的 08 OCR、01 M0/M1 求解器、07 V5 和 Cloudflare 公共页面。

## 接口与约束

```js
const {
  intersectFiniteSegmentPlane,intersectCylinderSidePlane
}=require('./engines/spatial/sections/axis-cylinder-plane.cjs');
const result=intersectCylinderSidePlane(
  {baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:30},
  {point:{x:0,y:0,z:15},normal:{x:1,y:0,z:1}},
  {samples:64}
);
```

所有点、圆柱半径、高度采用真实 **model-mm** 坐标；当前有限圆柱轴线仅支持世界坐标 **Z 轴**。并不假装这是通用旋转坐标系或复杂组合体求解器。平面通过三维点与非零法向量给出，内部将法向量归一化。

### 04-A｜线段与平面

`intersectFiniteSegmentPlane` 返回 `intersect`、`parallel`、`coincident`、`outside-segment`、`undetermined`。真正交点含线段参数 t、法向距离残差（mm）与 V/H/W 投影坐标；直线与平面相交但落在有限线段之外绝不作为有限实体上的交点。共线于平面的线段不是“唯一一点”。

### 04-B 的第一个数学消费者｜斜平面与圆柱侧面

当平面不与圆柱轴线平行，且推导的截线最高/最低 z 都在有限圆柱高度范围内时，模型先通过**解析参数方程**证明封闭圆/椭圆属于两个曲面交集，再给出采样作图点及每个点的圆柱侧面残差、平面残差、V/H/W 坐标投影。采样仅用于绘制，不是曲线正确性的唯一数学证据。

- 水平截面 → 侧面圆形截线。
- 普通斜截面 → 侧面椭圆截线，附完整解析参数、z 极值。
- 真正竖直截面 → 解析的一条相切母线 / 两条相交母线 / 无交。**圆柱端面与实体内部区域尚未求解**，不能将两条母线声称为完整实体截面轮廓。
- 如果普通斜平面与有限圆柱上/下端面相交，返回 `clipped`、空采样和 `requiresSolidCapAnalysis=true`；没有做端面拓扑时不能用“画出一整条椭圆”误导。
- 非零但极接近竖直的平面返回 `undetermined`，不能偷换成真正竖直平面。
- 不相交返回 `none`；错误法向、零长度线段、无效半径/高度、越界采样拒绝。

**重要边界**：模型返回的是圆柱**侧面**截交，不是有限实体切面的全部表面（面域/端盖）或真实遮挡线型。V/H/W 是模型坐标投影，不是同纸第一角法布局、45° 转移线，也不是 V5 已完成的 ConstructionStep。整体题目是否全局唯一仍保持 `globallyUnique:null`。后续须经 01/03 M2 空间契约签收、04 独立残差/可见性审核，再接 07 动态作图及 08 识图。

## 验收

增量测试路径：`tests/workbench/v35-cylinder-section-math.test.cjs`。复用现行 workbench CI `node --test tests/workbench/*.test.cjs`，覆盖普通斜截面解析残差、水平圆截面、竖直母线、切线、无交、端盖截断、近竖直边界、尺寸平移和旋转、投影不变量、退化输入以及有限线段与平面交点边界。

此批只新增独立 `engines/spatial/sections/**`、workbench 数学测试和文档；不更改共享 `core/**`、既有任何数学结论、网页、构建或生产配置。保留可单独 revert 的回退能力。
