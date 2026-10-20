/* Source-scoped explanations for the normalized SVG constructions.
 * This is an authored geometric explanation layer, not publisher artwork, and
 * a single picked line is NEVER assigned the global/local DOF change of a frame.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TextbookShapeInspector=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const make=(name,role,reason,effect)=>({name,role,reason,effect});
const shared={
 'example-1-1':{
  'AB':make('已知线段 AB','题目已知','A、B 是已知端点，所有求得的等分点最终必须落在 AB 上。','已知直线限定目标分点只能沿这条线取位置；等分比例尚未给出。'),
  'A':make('端点 A','题目已知','由 A 发出辅助射线并沿 AB 确定分点的起始基准。','A 是固定基准点，不是新求的自由变量。'),
  'B':make('端点 B','题目已知','把辅助射线上第七点与 B 相连，给后续平行线设定方向。','B 是已知边界，不单独决定六个内部等分点。'),
  'AM':make('辅助射线 AM','构造辅助','射线方向可以任选，重要的是在它上面连续截取七段等长距离。','任选辅助射线不会给 AB 上待求点添加最终位置约束。'),
  '7B':make('第七辅助分点至 B 的连接线','构造辅助','把辅助射线的第七个等距点与 B 连接，建立平行转移的方向。','仅连接基准线尚未唯一确定各个 AB 分点；还需作平行线求交。')
 },
 'example-2-2':{
  'X / YW':make('水平参考轴 X / YW','投影基准','三面投影展开后的轴线，用于比较已知投影的相对位置。','坐标轴是参照，不是另一个未知点的独立定位条件。'),
  'Z / YH':make('竖直参考轴 Z / YH','投影基准','标识高度与深度的展开方向，辅助读出 V、H 与 W 的关系。','参考轴不直接减少待求侧投影的自由度。'),
  'a′':make('正面投影 a′','题目已知','a′ 提供点 A 的高度信息，侧面投影必须与它等高。','在侧视纸面上，“等高”是一条定位条件，只限定一个方向。'),
  'a':make('水平投影 a','题目已知','a 提供点 A 的深度信息，可以通过 45° 线转移至侧视图。','深度与高度是两个独立坐标；转移并没有凭空创造信息。'),
  'a′ 的等高联系线':make('正侧投影等高线','定位辅助','通过 a′ 作水平联系线，侧投影 a″ 必须落在这条线上。','固定侧投影的高度，还需深度条件才能求唯一交点。'),
  '45°深度转移':make('45° 深度转移线','坐标转移','按第一角投影的展开关系将俯视深度对应到侧视横向距离。','这是一种作图转移手段，不是新测得的空间约束。'),
  'H面深度移交':make('水平面深度联系线','坐标转移','由水平投影 a 水平送出同一深度，在 45° 转移区域寻找对应位置。','提供已有深度的纸面转移路径；需与侧面竖向定位配合。'),
  'W面深度定位线':make('侧投影深度定位线','定位辅助','从转移得到的深度位置向上作竖向联系线，与等高线相交。','竖向线与等高线提供两个独立方向的纸面约束，交点定位 a″。'),
  'a″':make('待求侧面投影 a″','构造结果','由正视的高度与俯视的深度确定第三面投影。','两个已知坐标的纸面定位交点唯一；应再校验同高、同深。')
 },
 'example-2-3':{
  'X / YW':make('水平参考轴 X / YW','投影基准','确定 x 的量取方向以及正视与俯视的展开基准。','参考坐标轴并不生成新的待求坐标。'),
  'Z / YH':make('竖直参考轴 Z / YH','投影基准','用于区分正视高度 z 与俯视深度 y 的纸面方向。','参考轴本身不代表新增独立条件。'),
  '45°':make('45° 方向基准','坐标转移','为俯视深度到侧面深度的距离转移提供纸面方向。','45° 线只传递既定的 y 值，不改变空间点给定坐标。'),
  'aₓ':make('投影联系线足点 aₓ','定位基准','由 x=15 mm 在 X 轴上确定，用它建立正视与俯视的同一竖向联系线。','给定 x 坐标决定联系线位置；空间点 A 的坐标已知，空间自由度原本就为零。'),
  '向下 y=10':make('水平投影 y=10 的量取线','尺寸定位','由 aₓ 沿俯视方向取 y=10 mm，以得到 a 的深度。','已知 y 值使俯视投影在该联系线上取得确定位置。'),
  'a':make('水平投影 a','构造结果','a 由 x=15 与 y=10 共同确定，并为侧投影提供相同深度。','表示已给定的 x、y；不应把完成一幅视图算作新增空间约束。'),
  '向上 z=12':make('正面投影 z=12 的量取线','尺寸定位','由 aₓ 量取 z=12 mm 确定 a′ 的高度。','已知高度可限制侧投影的一个纸面方向。'),
  'a′':make('正面投影 a′','构造结果','a′ 由 x=15 与 z=12 共同确定，为侧投影传递高度。','相同高度是侧面投影必须满足的一个定位条件。'),
  '同高联系线':make('正侧等高联系线','定位辅助','从 a′ 沿水平方向向侧视区作出，约束 a″ 的高度位置。','在侧视纸面留下一个尚未确定的深度方向。'),
  'H面深度转移':make('俯视深度转移线','坐标转移','把 a 表示的 y=10 mm 转到侧视图区。','转移深度不增加已知空间信息，为另一方向的定位提供坐标。'),
  'W面深度定位':make('侧视深度定位线','定位辅助','与等高联系线相交，确定 a″ 的纸面坐标。','高度和深度两方向都被独立固定后，侧投影位置唯一。'),
  'a″':make('侧面投影 a″','构造结果','同时满足 z=12 的等高关系与 y=10 的同深关系。','这是两条纸面定位条件的交点，不是额外的空间自由度。'),
  'aYw':make('侧面深度轴足点','定位基准','标明侧视深度在轴线上的投影位置，用来核对横向距离。','用于校验给定深度，没有新增未知坐标。'),
  '高平齐':make('正侧等高结果线','核对结果','最终确认 a′ 与 a″ 的高度相同。','这是已有高度条件的复核，不应重复计数。'),
  '宽相等':make('俯侧同深结果线','核对结果','最终确认侧视深度与俯视所给深度相同。','这是已有深度条件的复核，不应重复计数。')
 }
};
function explain(exampleId,shape){
 if(!shape||typeof shape.label!=='string'||!shape.label)return null;
 const catalog=shared[exampleId];if(!catalog)return null;
 const hit=catalog[shape.label];if(hit)return {...hit,label:shape.label};
 if(exampleId==='example-1-1'){
  if(/^[1-7]$/.test(shape.label)&&shape.type==='point'){
   const n=Number(shape.label);
   return {...make('辅助射线第 '+n+' 等距点','构造辅助',
    '在射线 AM 上从 A 起按相同步长量取，这是第 '+n+' 个辅助分点。',
    '等间距辅助点用于建立 '+n+'/7 的相似比例；它本身不是 AB 上目标点的位置。'),label:shape.label};
  }
  const parallel=/^过 ([1-6]) 作平行线$/.exec(shape.label);
  if(parallel&&shape.type==='line'){
   const n=parallel[1];
   return {...make('第 '+n+' 条等分转移线','定位辅助',
    '过辅助射线上第 '+n+' 个等距点作平行于 7B 的线，与 AB 相交得到 Q'+n+'。',
    '已知 AB 与这条非重合的转移线相交，使该待求等分点在纸面上唯一确定。'),label:shape.label};
  }
  const target=/^Q([1-6])$/.exec(shape.label);
  if(target&&shape.type==='point'){
   const n=target[1];
   return {...make('AB 上的分点 Q'+n,'构造结果',
    '第 '+n+' 条平行转移线与已知 AB 相交得到它；由相似三角形得到位置比例 '+n+'/7。',
    '这里仅讨论当前分点在 AB 上的定位，不代表整道图形所有变量的总自由度。'),label:shape.label};
  }
  const segment=/^第([1-7])等分段$/.exec(shape.label);
  if(segment&&shape.type==='line'){
   return {...make('第 '+segment[1]+' 段等分结果','核对结果',
    '这是 AB 的七段等长线段之一，结果阶段应核对每段长度等于 AB 的七分之一。',
    '显示结果线是复核，不能重复计算为新增约束。'),label:shape.label};
  }
 }
 return null;
}
return {explain};
});
