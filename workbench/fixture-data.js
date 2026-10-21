/* Coordinates here are deliberately arbitrary SCREEN-SPACE layout markers.
 * Not textbook material, a geometric solution, a test of tangency or a model-space projection. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DA07SyntheticFixtures=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const point={
    synthetic:true,scope:'ui-only',id:'SYN-PROJ-UI',title:'合成界面样本 A｜V/H 已知点与联系线',solveResult:null,
    note:'仅测试点投影工作台布局。坐标是纸面示意位置，不表示第三视图已经算出。',
    shapes:[
      {id:'v-point',kind:'point',role:'given',label:"a′ (示意)",geometry:{x:185,y:118}},
      {id:'h-point',kind:'point',role:'given',label:'a (示意)',geometry:{x:185,y:310}},
      {id:'vh-link',kind:'line',role:'auxiliary',geometry:{x1:185,y1:118,x2:185,y2:310}},
      {id:'axis-vh',kind:'line',role:'axis',geometry:{x1:36,y1:222,x2:680,y2:222}}
    ],
    steps:[
      {id:'observe-vh',title:'辨认已有 V/H 点',explanation:'两个纸面标记是 synthetic 的已知层；不是从模型计算所得。',actionIds:[],dependsOn:[],hints:['观察两个标记属于哪两个视图。']},
      {id:'guide-vh',title:'示意投影联系线',explanation:'仅显示辅助联系线占位，实际项目必须消费 03 的经过校验的联系线坐标。',actionIds:['vh-link'],dependsOn:['observe-vh'],hints:['考虑投影联系线与已知点之间的关系。']}
    ]
  };
  const tangent={
    synthetic:true,scope:'ui-only',id:'SYN-TANGENT-UI',title:'合成界面样本 B｜偏移线与辅助圆',solveResult:null,
    note:'仅测试图元逐步出现。示意偏移线与圆不保证相切、半径正确或存在解。',
    shapes:[
      {id:'known-line',kind:'line',role:'given',geometry:{x1:70,y1:330,x2:640,y2:330}},
      {id:'known-circle',kind:'circle',role:'given',geometry:{cx:205,cy:155,r:58}},
      {id:'offset-line',kind:'line',role:'auxiliary',geometry:{x1:70,y1:290,x2:640,y2:290}},
      {id:'helper-circle',kind:'circle',role:'auxiliary',geometry:{cx:205,cy:155,r:95}}
    ],
    steps:[
      {id:'offset-preview',title:'偏移线示意占位',explanation:'只是 synthetic 的纸面偏移线；不代表真实输入半径的相切计算。',actionIds:['offset-line'],dependsOn:[],hints:['先确认哪些对象参与相切关系。']},
      {id:'helper-preview',title:'辅助圆示意占位',explanation:'显示辅助圆图层；尚无合法候选圆心、切点、G1 或残差。',actionIds:['helper-circle'],dependsOn:['offset-preview'],hints:['真实圆弧解必须由 02 计算和验证候选分支。']}
    ]
  };
  return Object.freeze([point,tangent]);
});
