# DraftAI 04 V4.1｜已验证长方棱柱截面边的空间射线可见性

在已经合并的 PR #302/#304/#306/#307 棱柱求交、V5 动态构造和独立浏览器实验页基础上，继续构建**真实数学可见性**，以替换目前所有截交线被保守标记 `undetermined` 的底层原因。

## 输入

```js
const {classifyPrismSectionVisibility}=require(
 './engines/spatial/sections/rectangular-prism-cut-visibility.cjs'
);
const result=classifyPrismSectionVisibility(
 {min:{x:0,y:0,z:0},max:{x:10,y:10,z:10}},
 {point:{x:0,y:0,z:12},normal:{x:1,y:1,z:1}},
 {
   retainedHalfspace:'negative',
   observerDirection:{x:0,y:0,z:1}
 }
);
```

必须由上层明确给定“保留平面法向哪一侧材料”和**从图元指向观察者**的空间方向。仅对一个已知轴对齐有限长方棱柱与单个已知平面成立。

数学判断：内部重新运行 #302 的真实 12 棱解析求交、单环闭合及凸多边形残差验证，拒绝任何外部伪造的 `verified:true` 标签。对每条**截面边开区间**，用相邻两个真实截点的中点找到其所在唯一的原长方棱柱面；如果属于整棱/多个面导致无法独立定位，则拒绝分类。观察射线 `p+t·d`：

- 若射线进入已切除的平面半空间，则不可能被这个保留实体遮挡，标记 `visible`；
- 若进入保留半空间，并且朝该实际凸棱柱面的外法向，标记 `visible`；朝实体内部标记 `hidden`；
- 射线与截平面近乎平行、与所在线面切向、数值残差不能证明时，保留 `undetermined`，不盲猜虚实线。

每段携带 `sourceEdgeId`、所在真实盒体面 `boxFace`、空间起点/中点/终点、V/H/W 原数学模型投影、残差及明确的原因。**严格只证明截线开区间**：端点交接、切向轮廓、其他遮挡物、正式国标第一角法法向映射不予保证。

输出 `edgeInteriorsVerified` / `visibilityVerified` 只表示对用户明确给出的具体射线与保留半空间，所有开区间都获得确定结果，仍是 `boundaryEndpointsVerified:false`、`standardViewMappingVerified:false`、`v5LineStylesReady:false`。必须由后续专项验证三视法向与标准线型，再接入 V5/网页，不在此 PR 篡改现在显示的待审核线型。

只新增 `engines/spatial/sections/rectangular-prism-cut-visibility.cjs`、`tests/workbench/v41-prism-cut-ray-visibility.test.cjs` 和本文档。自动由既有 workbench CI 扫描，不改 03/07/08/09、静态构建、Cloudflare 或线上页面。
