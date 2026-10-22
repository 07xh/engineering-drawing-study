# DraftAI 04 V3.9｜数学来源图线点选、准确步骤映射与画面自动聚焦底座

本阶段只实现可验算的 **SVG 图线交互底座**，不改变现有解析圆柱求交、射线可见性判断或原生 07 V5 播放器。

## 实现

- **稳定动作识别**：04 自有的真实实线/虚线/待判渲染器在结果 `line/circle` 中增加经正则验证的 `data-action="vis-..."`，和既有已知图/辅助图元 `data-action` 一致；保留此前 `data-visibility`、`data-source` 和 `stroke-dasharray` 顺序，避免影响既有 V5/测试。
- **`scene.inspectAt({x,y,elapsedMs,expectedRevision,tolerancePx})`**：根据真实可信几何和原 V5 每笔 fraction 检查是否已经实际画出；用点到线段最近距离、点到已知整圆半径的距离和点半径，返回经过证明的 actionId、来源边、所属 V5 步骤与这一动作的真正播放时刻 `seekMs`。不会允许提前点选尚未绘制的答案；没有命中时返回 null；默认 12 像素触控容差，最多 32 像素。
- **`scene.focusOnAction` / `scene.focusOnStep`**：只从内部数学图元的真实空间变换后坐标求 bounding box，生成比例恒定、不会超出 960×680 图纸区域的自动聚焦 `viewBox`。分辨率/安全边界不能被上传字符串覆盖。
- **版本守卫**：与 V3.8 整张 SVG 帧合成器同样要求 `expectedRevision` 严格等于本次数学版本，且圆柱/截平面/观察方向输入不可被就地篡改；否则拒绝图线查找和聚焦，避免过期的几何结论仍然被选择。

## 适用边界与下一环节

这是 **04 私有的交互查询 API**，不是已上线的点选 UI。需由独立的浏览器工作台 PR 接入 pointer 坐标映射、点选高亮、自动聚焦按钮/开关与辅助线显示状态，再对 Android 平板实际触控验收。

不宣称已通过工程制图第一角法国标观察方向签收；仍为单一已知 Z 轴有限圆柱/明确非竖直截平面/明确半空间和真实观察方向的实验，`firstAngleObserverConventionsSignedOff:false`、`completeEngineeringDrawingVerified:false`。

## CI

新增 `tests/workbench/v39-cylinder-svg-action-inspection.test.cjs`，覆盖真 SVG stable ID、结果图线点选至 V5 真实步骤、0 时刻不能提前选结果、已知圆点选、精确图纸边界与纵横比聚焦、失效版本/模型输入篡改、确定性与无副作用。仅改动 04 `engines/spatial/sections/**` 和新测试、文档，避免与 07 播放器、08 OCR、09 CI 和全站 UI 重构冲突。
