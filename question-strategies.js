(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingQuestionStrategies=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const c=(axis,value)=>({type:'coordinate',axis,value});
const projection=(plane,a,b)=>({type:'projection',plane,value:[a,b]});
const items={
Q009:{title:'正面投影与空间坐标',conditions:[c('x',45),c('y',20),c('z',35)],focus:'题干已给完整空间坐标，点的位置自由度为零；V 面投影只读取 x 和 z。',paper:'在 V 面按 x=45、z=35 定位 a′。'},
Q010:{title:'水平投影与深度',conditions:[c('x',45),c('y',20),c('z',35)],focus:'已知完整空间坐标，点已经确定。H 面只保留 x、y，距 OX 轴的距离是 y=20 mm。',paper:'先画 OX，再沿深度方向量取 20 mm。'},
Q011:{title:'侧面投影与深度',conditions:[c('x',60),c('y',35),c('z',48)],focus:'空间点已确定；W 面投影保留 y、z，距 OZ 轴的距离是 y=35 mm。',paper:'在 W 面按 y=35、z=48 定位 b″。'},
Q012:{title:'同一空间点的三面投影',conditions:[c('x',30),c('y',20),c('z',40)],focus:'完整坐标使空间点唯一。V、H、W 三个投影只是读取同一个点的不同坐标对。',paper:'V 取 (30,40)，H 取 (30,20)，W 取 (20,40)，再画投影联系线。'},
Q013:{title:'由两个投影求第三投影',illustrative:true,conditions:[projection('V',30,40),projection('H',30,20)],focus:'原题没有具体数值；这里以 a′=(30,40)、a=(30,20) 作演示。V 已固定 x、z，H 再确定 y；重复的 x 不重复减少自由度。',paper:'由正面投影确定 z，由水平投影确定 y，再利用 45° 转移线求侧面投影。'},
Q014:{title:'正面投影的高度',conditions:[c('x',18),c('y',42),c('z',65)],focus:'三个坐标均已知，空间点自由度为零。正面投影距 OX 的距离是 z=65 mm。',paper:'在 V 面按 x=18、z=65 定位 c′。'},
Q015:{title:'重影点的水平投影',conditions:[projection('H',30,15),c('z',60)],focus:'A 和 B 的 H 投影重合是因为 x、y 相同；B 还需高度 z=60 才能确定完整空间位置。',paper:'在 H 面使 a、b 重合；在 V 面根据不同高度区分 A、B。'}
};
function forQuestion(q){return q&&Object.prototype.hasOwnProperty.call(items,q.id)?{...items[q.id],questionId:q.id}:null}
function analyzeQuestion(q,engine){const item=forQuestion(q);return item?{...item,analysis:engine.analyze(item.conditions)}:null}
return {forQuestion,analyzeQuestion,items};
});
