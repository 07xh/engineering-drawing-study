/* 教材练习方法识别、参考来源审核（不产生题目解答 SVG） */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingResearchCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const profiles={
 plane:{keywords:['投影','平面','第三','辅助','projection','plane','orthographic'],english:'orthographic projection third view plane',alternatives:['按同名顶点逐点转移','先识别特殊位置平面后求积聚投影'],pitfall:'顶点和投影轴如果未确认，45° 线不能自动得到唯一答案。'},
 pointLine:{keywords:['平面','直线','点','从属','projection','plane','point','line'],english:'descriptive geometry point on plane auxiliary line',alternatives:['过给定点构造面内辅助线','借助面内已知边的交点确定对应投影'],pitfall:'必须证明辅助线属于指定空间平面。'},
 prism:{keywords:['棱柱','棱锥','棱台','表面','三视图','prism','pyramid','projection'],english:'orthographic projection of prism pyramid surfaces',alternatives:['利用同名顶点与投影联系线','按面片积聚性定位表面点'],pitfall:'不能把棱柱、棱锥与棱台的形体条件互相代替。'},
 cylinder:{keywords:['圆柱','圆台','母线','表面','projection','cylinder','surface'],english:'cylinder surface point orthographic projections',alternatives:['积聚圆周定位','沿已确认的柱面母线传递'],pitfall:'圆周同一条投射线可能有前后两个候选点。'},
 cone:{keywords:['圆锥','素线','辅助圆','截平面','cone','generator','auxiliary circle'],english:'cone surface point auxiliary generator circle projection',alternatives:['辅助素线法：通过锥顶构造真实素线','辅助圆法：过点作与底面平行的截圆'],pitfall:'辅助素线和辅助圆的半径、交点分支及前后可见性均须由原图确定。'},
 sphere:{keywords:['圆球','球面','圆周','辅助圆','sphere','spherical'],english:'sphere surface point auxiliary circle descriptive geometry',alternatives:['按球面高度构造截圆','根据可见半球选取与联系线相交的候选点'],pitfall:'球面点通常存在对称分支，不应只凭一条投影线确定点。'},
 curvedUnknown:{keywords:['表面','投影','圆形','圆柱','圆锥','球面','圆','surface','projection','circle'],english:'descriptive geometry surface point circle cylinder sphere projection',alternatives:['先核对圆形投影表示何种回转体，再决定是否适用圆柱积聚线法','确认球面及辅助截圆条件后，再判断能否采用辅助圆法'],pitfall:'多个圆形投影不足以判断形体是圆柱还是圆球；若原题文字或点位模糊，不得选择某一形体生成答案。'}
};
const taskProfiles={};
function register(group,prefix,last){for(let i=1;i<=last;i++)taskProfiles[prefix+'-'+i]=group}
register('plane','2-6',6);
register('pointLine','2-7',6);
register('prism','2-8',8);
register('cylinder','2-9',8);
for(const id of ['2-9-3','2-9-4'])taskProfiles[id]='cone';
for(const id of ['2-9-7','2-9-8'])taskProfiles[id]='curvedUnknown';
function detect(id,original){
 const task=taskProfiles[id];if(!task)return null;
 const info=profiles[task],title=original&&typeof original.title==='string'?original.title:'';
 const special=['2-9-7','2-9-8'].includes(id);
 return {id,group:task,title,titleStatus:title?'部分扫描已标注':'缺失原图题意',query:(title?title.replace(/补全点的投影并判断空间位置/g,'曲面表面点的投影'):'工程制图 '+task)+' '+info.alternatives[0].replace(/：.*/,''),english:info.english,keywords:info.keywords,alternatives:info.alternatives,pitfall:info.pitfall,ambiguousShape:special,
  shapeWarning:special?'本题含多个圆形投影，尚不能仅据局部扫描确认形体类别；应先核实圆柱或球面等形体条件，不能直接选某种方法。':'题型识别来自现有教材部分描图，仍需逐项核验。',
  sourceStatus:original&&original.status==='partial'?'教材原图仅部分录入':'原图完整性未确认'};
}
function requirements(id,original){
 const profile=detect(id,original);if(!profile)return null;
 const checks=[
 {key:'source',label:'题图来源与题目文字',ok:!!original&&typeof original.source==='string'&&original.source.length>5,explain:'当前只能确认部分扫描来源；来源真实不等于题目完整。'},
 {key:'geometry',label:'全部已知几何图形',ok:!!original&&original.status==='verified-complete',explain:'28 道题目前都处于 partial；不能用未验证线条求解。'},
 {key:'coordinates',label:'关键点、线与尺寸坐标',ok:!!original&&original.coordinateAudit==='verified',explain:'描图坐标与真实尺寸/投影对应仍需原图逐项核对。'},
 {key:'occlusion',label:'隐藏线和可见性',ok:!!original&&original.visibilityAudit==='verified',explain:'重影点与曲面前后分支需由原题标记核实。'},
 {key:'solution',label:'逐步答案线经过独立验算',ok:!!original&&original.solutionAudit==='verified'&&Array.isArray(original.solutionSteps)&&original.solutionSteps.length>0,explain:'方法说明或网络引用并不构成已验算答案。'}
 ];
 return {profile,checks,pass:checks.every(x=>x.ok),animationAllowed:checks.every(x=>x.ok),status:checks.every(x=>x.ok)?'具备进一步审查资格':'待补充原题证据；禁止生成教材答案动画'};
}
function safeReference(x){
 if(!x||typeof x!=='object')return null;
 let url;try{url=new URL(String(x.url||''))}catch(_){return null}
 if(url.protocol!=='https:'||url.username||url.password)return null;
 const host=url.hostname.toLowerCase();
 if(!(host==='zh.wikipedia.org'||host==='en.wikipedia.org'||host==='doi.org'))return null;
 const title=String(x.title||'').replace(/<[^>]*>/g,'').slice(0,180).trim();
 if(!title)return null;
 return {title,provider:x.provider==='crossref'?'Crossref 文献元数据':'维基媒体条目',url:url.href,date:String(x.date||'').slice(0,12),snippet:String(x.snippet||'').replace(/<[^>]*>/g,'').slice(0,350)};
}
function scoreReference(raw,profile){
 const ref=safeReference(raw);if(!ref||!profile)return null;
 const text=(ref.title+' '+ref.snippet).toLowerCase();
 const matched=profile.keywords.filter(k=>text.includes(k.toLowerCase()));
 const score=matched.length;
 return {...ref,matchCount:score,relevance:score>=2?'标题主题较接近':'可能相关（仅供核查）',evidence:'仅审核链接/标题/元数据及关键词；未人工阅读、校核正文或原题解答。',verifiedForExercise:false};
}
function compareMethods(profile){
 if(!profile)return [];
 return profile.alternatives.map((name,index)=>({name,status:'通用方法待核对',reason:index===0?'与当前题型推定的常见作法较接近，仍需证明原图条件满足。':'可能作为替代或补充，需要额外判断其适用条件。',canDraw:false}));
}
return {detect,requirements,safeReference,scoreReference,compareMethods,taskProfiles,profiles};
});
