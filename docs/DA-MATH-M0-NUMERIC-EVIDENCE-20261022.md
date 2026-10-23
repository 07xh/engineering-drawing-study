# DraftAI M0-B｜数值容差与浮点分辨率证据（可选诊断层）

> [数学基础任务 #203](https://github.com/07xh/engineering-drawing-study/issues/203) 的第二个独立增量。初始基线 main `0af76f1326a6c0a1ab38e84adfe769975cf0865f`。
> 这是新 **opt-in** 工具，不自动应用于任何已验收的点投影、圆弧和 V5 教学求解；应用到真实数学求解需要单独 PR 与前后数值对照。不得宣称本次已经统一了整个项目的 `EPS`。

## 为什么需要

旧算法含绝对阈值 `1e-8`、`1e-9`、比例容差、图纸像素等不同语义。若容差错误地随**整体坐标原点绝对值**放大，输入约 `1e12 mm` 的模型坐标时，10mm 实际矛盾也可能被误判为符合。同样，机器浮点数在该量级不能可靠表达微米级位置差。

这里区分：
1. **特征尺度**：例如圆弧半径、两个局部点间的实际尺寸，而非整个模型相对世界原点的距离；
2. **绝对公差**：与测量类型一致的 mm / deg / rad / unitless；
3. **相对公差**：无量纲乘以明确提供的局部尺度；
4. **浮点分辨率启发式**：用于对极大基准坐标下极小差异返回 `resolution-limited`，**不是经过区间算术证明的严格误差界**。

## API（未接生产求解器）

新文件 `core/numeric/residual-evidence.cjs`：

- `policy({absoluteTolerance, relativeTolerance, characteristicScale, unit})`
- `checkResidual({residual, absoluteTolerance, relativeTolerance, characteristicScale, unit})`
- `compareCoordinates({a,b,absoluteTolerance,relativeTolerance,characteristicScale,unit})`

设局部特征尺度为 `s`，判定误差门槛为：

```
allowedDifference = absoluteTolerance + relativeTolerance * characteristicScale
```

该值不依赖全局 x/y/z 位置。必须由调用者明确提供 `characteristicScale`，且单位必须为 `mm / rad / deg / unitless`。数值非法、负容差、零容差、溢出直接拒绝。**不支持自动单位换算；两侧数据必须事先具有同一单位**。

结果仅是局部数值证据：
- `within-tolerance`：输入偏差未超过所声明门槛，**不代表几何解存在或唯一**；
- `outside-tolerance` / `different`：明显超过容差；
- `resolution-limited`：双精度浮点数可能无法分辨这种量级上的差异，不能假装一致或矛盾已被证明。

`compareCoordinates` 采用约 `2*Number.EPSILON*max(1,|a|,|b|)` 的**保守量级估计**，不保证覆盖所有舍入误差、输入测量误差或数值消去误差，不能代替高精度运算、数值条件数分析或区间验证。

## 回归和验收

`node --test tests/math/m0-residual-evidence.test.cjs`；新增 11 个测试，覆盖：

- 极大坐标系中的 10mm 矛盾必须判为不同；
- 极大坐标位置的不可分辨微小偏差必须输出不确定诊断；
- 统一比例仍使用局部特征尺度；
- 正负残差、尺度与单位、非有限值、溢出、零容差；
- 即使残差=0，也不能宣称解存在或全局唯一。

测试通过后只能说**这一份未接入生产的数值诊断 API 满足其有限契约**；不能把 M0、M1 完全完成。接入已有求解器或替换 `EPS` 必须另立 PR，先做前后对照与独立数学测试。此 PR 无构建/Cloudflare/私密教材变更。

## 下一步

01、09 对 QR/SVD、Jacobian 近奇异秩、绝对+相对公差和条件数的真实算例做基准评估，再由 00 明确是否签收本 API 为跨模块标准；不得在本增量提前改动现有求解器。
