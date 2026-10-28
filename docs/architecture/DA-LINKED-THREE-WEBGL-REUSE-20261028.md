# DraftAI 第 2 批｜直接复用 Three.js 的 2D↔3D 空间拾取

当前版本仅实现**显示层 WebGL**，不重建几何求解、三视图、M5 可见性或唯一 V5。第一角法 V/H/W 仍由 `core/projection` 计算，3D 顶点、解析曲线和原始源棱来自现有 Geometry Scene。

## 已接线

- 直接复用项目原有固定版本的 **Three.js、OrbitControls、Raycaster**（已在 `labs/dof-lab-three-entry.js` 中验证），只在静态打包阶段导入，正式页面无运行时 CDN 请求；
- `project/linked-three-scene-entry.js` 只消费 `draftai-geometry-scene-views/1.0.0`，使用和既有 SVG consumer 同一 `sourceFeatureKey`，为原始 3D 网格棱、折线段、三维线段及解析曲线提供 3D 拾取；
- WebGL 中选中的线回传原有协调器 `selectSceneGeometry`，V/H/W 同源线同步高亮；二维点击原有源棱也能反向高亮 3D；
- 三维旋转与缩放由成熟的 OrbitControls 提供，投影视图仍严格按照第一角法作图，且不受摄像机的显示变化干扰；
- 屏蔽非凸/非共面面片伪三角化，只为已经由 Scene 提供的平面凸多边形绘制透明的显示面；不能把透明面理解为遮挡证明；
- 浏览器不支持 WebGL2、未能初始化渲染器或无受支持 scene 时仍走已经验收的 SVG 3D 线框视图；
- 安全门禁：`certifiedEngineeringStroke:false`，禁止凭渲染器深度缓存、射线拾取或显示的可见像素推导国标实虚线，无法授权 C1/C2/C3 正式 ConstructionIntent/DAG/V5。

## 验收边界和后续

构建检测本地 bundle 与脚本加载顺序；单元/DOM 检测不存在第二数学系统并验证无 WebGL 环境下 SVG 兜底。实际 Android/ColorOS GPU、WebGL2 兼容与触控拾取还需实机手测。

后续继续复用 OCP/OCCT 的真实 B-Rep / HLR 与源棱历史映射，完成 C1 原始 HLR 参数覆盖、C2 Boolean 新生棱/接缝、C3 有限圆柱曲线的 M0/M3/M4/M5 正向证明后，才能进入唯一 V5 标准线型；不能把本批 WebGL 交互当成整题签收。
