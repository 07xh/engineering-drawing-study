# DraftAI 04 V4.0｜有限长方棱柱与斜平面真实求交第一批

这次新增另一个明确的工程制图真实题型——**轴线与模型 XYZ 平行的有限长方棱柱（长方体）与非退化平面求交**。不是固定三角形示意或预制 SVG，而是从**真实 12 条有限空间棱边**逐条计算截点，经独立残差与闭合拓扑校验后输出截面多边形。

## 输入/输出

```js
const {prismPlaneSection}=require(
 './engines/spatial/sections/rectangular-prism-plane.cjs'
);
const result=prismPlaneSection(
 {min:{x:0,y:0,z:0},max:{x:10,y:10,z:10}},
 {point:{x:0,y:0,z:12},normal:{x:1,y:1,z:1}}
);
```

这个实际例题给出**六边形**截面。平面 x+y+z=3 得到三角形；平面 x=5 或 z=5 得到矩形。

- 每条截面顶点均携带来自哪条棱边的 `sourceEdgeIds`，无人工编造或 AI 猜点。
- 截点要求落在盒体有限边界、截平面上，并满足独立毫米级平面残差、范围残差。
- 去除一个顶点被三条棱边重复记载的情况，使用正交平面局部坐标将真正截点排序并检验有向面积、凸性、边长和每个截面中点是否位于盒体内部及截平面。
- 在一个简单凸长方棱柱里，普通非退化单截平面应产生 3–6 个唯一截面顶点；出现其他不合规情况会阻断而不是猜曲线。
- 输出每个空间截点的 V/H/W 模型坐标、相邻点的真实连接线和截面面积/周长，单位分别为 mm、mm²。
- 对单切点、无交、退化平面、端面与截平面共面、整条棱边重合等尚未单独验收的特殊边界返回 `none/degenerate/boundary-degenerate/undetermined`，不将退化结果当成完成的工程图。

## 安全边界和下一步

只支持已知轴向有限**长方棱柱**，还不支持任意旋转棱柱、棱锥、圆锥或复杂组合实体。顶点的 `sourceEdgeIds` 是**模型棱边**而非照片来源标注；图片 AI 识别需要独立验证。输出的 V/H/W 暂为模型投影坐标，不是正式第一角法布局；**尚未**求解真实视线遮挡/虚线/剖面填充、ConstructionStep/V5 动作和公开工作台。

接口明确 `perimeterVerified:true` 仅在一维截面周界真正验证后出现；`visibilityVerified:false`、`sectionInteriorVerified:false`、`firstAngleConventionVerified:false`、`v5StepsReady:false`、`globallyUnique:null`。

## 交付

仅新增 `engines/spatial/sections/rectangular-prism-plane.cjs`、`tests/workbench/v40-rectangular-prism-section.test.cjs` 及本说明。workbench 原 CI glob 自动纳入测试，涵盖斜截 3/4/6 边形、共面/过棱、平移/尺度不变量、不同法向尺度、实际面积和 V/H/W 投影。与此前合并的圆柱浏览器互动 PR #300 及并行 07/08/09 任务互不覆盖。
