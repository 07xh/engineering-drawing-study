'use strict';
// Restructure only presentation containers; app-owned nodes are moved, never copied.
function element(document,tag,attrs={},text){
 const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);
 if(text)n.textContent=text;return n;
}
function createContext(document,sections){
 const context=element(document,'aside',{class:'next-context','aria-label':'条件、作图步骤与验证'});
 const tabs=element(document,'div',{class:'next-tabs',role:'tablist','aria-label':'工作区面板'});
 sections.forEach(([key,label,panel],i)=>{
  const id='next-panel-'+key,tab='next-tab-'+key;
  const button=element(document,'button',{type:'button',id,role:'tab','aria-controls':id,'aria-selected':i===0?'true':'false',tabindex:i===0?'0':'-1','data-next-panel-button':key},label);
  button.id=tab;tabs.append(button);
  panel.id=id;panel.classList.add('next-context-panel');panel.setAttribute('data-next-panel',key);
  panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab);
  panel.hidden=i!==0;
 });
 context.append(tabs);for(const [, ,panel] of sections)context.append(panel);
 return context;
}
function addTools(document,main,layout,title){
 const header=element(document,'div',{class:'next-workspace-title'});
 header.append(element(document,'p',{class:'next-workspace-caption'},title));
 const tools=element(document,'div',{class:'next-canvas-tools','aria-label':'画布显示控制'});
 for(const [action,label,aria] of [['out','−','缩小图纸'],['fit','适合画布','恢复图纸大小'],['in','＋','放大图纸']])
  tools.append(element(document,'button',{type:'button','data-next-zoom':action,'aria-label':aria},label));
 tools.querySelector('[data-next-zoom=out]').disabled=true;
 tools.append(element(document,'output',{'data-next-zoom-label':'','aria-live':'polite'},'100%'));
 tools.append(element(document,'button',{type:'button','data-next-focus':'','aria-pressed':'false'},'专注画布'));
 header.append(tools);
 main.insertBefore(header,layout);
}
function scopeDetails(document,main){
 const intro=[...main.children].find(n=>n.matches('p.intro,p.muted'));
 if(!intro)return;
 const details=element(document,'details',{class:'next-scope'});
 details.append(element(document,'summary',{},'支持范围与操作说明'));
 intro.before(details);details.append(intro);
}
function enhanceAuto(document,main){
 const layout=main.querySelector('.layout');
 const [conditions,canvas]=[...layout.children];
 layout.className='next-workspace';canvas.classList.add('next-canvas');
 conditions.classList.add('next-condition-content');
 for(const [id,label] of [['problemPhoto','原图参照与候选检测'],['rasterDraftPanel','照片图元校正与毫米比例'],['vectorSvg','SVG 图元与尺寸确认']]){
  const source=document.getElementById(id);if(!source)continue;
  const content=source.closest('.local-photo');
  const details=element(document,'details',{class:'next-source-group','data-next-source':id});
  details.append(element(document,'summary',{},label));content.before(details);details.append(content);
 }
 const conditionPanel=element(document,'section');conditions.replaceWith(conditionPanel);conditionPanel.append(conditions);
 const stepPanel=element(document,'section');stepPanel.append(element(document,'h2',{},'数学构造步骤'));
 for(const id of ['stepList','stepDetail'])stepPanel.append(document.getElementById(id));
 stepPanel.append(element(document,'p',{class:'next-hint'},'选择步骤或已绘图元，查看对应的几何依据。步骤与结果由当前数学验证生成。'));
 const reviewPanel=element(document,'section');reviewPanel.append(element(document,'h2',{},'复核与导出'));
 reviewPanel.append(element(document,'p',{class:'next-hint'},'仅当前条件和所选分支通过数学验证后，才可导出。所选分支不代表全局唯一解。'));
 reviewPanel.append(document.getElementById('result'));
 reviewPanel.append(document.getElementById('saveVerifiedSvg').closest('.local-photo'));
 const playback=element(document,'section',{class:'next-playback','aria-label':'动态作图播放控制'});
 for(const node of [document.getElementById('play').closest('.controls'),document.getElementById('progress').closest('.seek'),document.getElementById('speed').closest('.fields')])playback.append(node);
 const statusArea=element(document,'div',{class:'next-status-area'});statusArea.append(document.getElementById('status'));
 const context=createContext(document,[['conditions','条件与来源',conditionPanel],['steps','作图步骤',stepPanel],['review','复核导出',reviewPanel]]);
 // Only the drawing heading remains in the central canvas.
 for(const h of [...canvas.querySelectorAll(':scope > h2')].slice(1))h.remove();
 canvas.querySelector('h2').textContent='作图画布';
 layout.append(canvas,context,playback);
 const stages=element(document,'nav',{class:'next-stages','aria-label':'解题阶段导航（不表示已完成）'});
 [['导入题目','conditions','problemPhoto'],['确认条件','conditions','kind'],['求解与选解','conditions','branch'],['动态作图','steps','stepList'],['复核与导出','review','saveVerifiedSvg']].forEach(([label,panel,focus],i)=>{
  stages.append(element(document,'button',{type:'button','data-next-stage':panel,'data-next-target':focus},(i+1)+'  '+label));
 });
 layout.before(stages,statusArea);
 addTools(document,main,layout,'二维图纸 · 模型 mm / 画纸 px');
 scopeDetails(document,main);
}
module.exports={enhanceAuto,element,createContext,addTools,scopeDetails};

function enhanceTeaching(document,main,{projection}){
 const layout=main.querySelector(projection?'.frame':'.workspace');
 const [canvas,conditions]=[...layout.children];
 layout.className='next-workspace';canvas.classList.add('next-canvas');
 const conditionPanel=element(document,'section');conditions.replaceWith(conditionPanel);conditionPanel.append(conditions);
 const steps=element(document,'section');
 const headings=[...conditions.querySelectorAll(':scope > h2')];
 const start=headings[1];
 if(!start)throw new Error('Missing teaching controls boundary');
 let node=start;while(node){const next=node.nextSibling;steps.append(node);node=next;}
 const playback=element(document,'section',{class:'next-playback','aria-label':'动态作图播放控制'});
 playback.append(steps.querySelector('#fullControls'));
 const scrub=steps.querySelector('#filletScrubBar');if(scrub)playback.append(scrub);
 const status=element(document,'div',{class:'next-status-area'});
 status.append(conditions.querySelector(projection?'#solveStatus':'#status'));
 const context=createContext(document,[['conditions','条件与求解',conditionPanel],['steps','步骤与自主作图',steps]]);
 layout.append(canvas,context,playback);layout.before(status);
 const title=canvas.querySelector('h2');if(!projection)title.textContent='几何图纸与辅助构造';
 addTools(document,main,layout,projection?'同纸 V / H / W · 模型 mm / 画纸 px':'圆弧连接 · 分支、有限边界与有向相切');
 scopeDetails(document,main);
}
module.exports.enhanceTeaching=enhanceTeaching;
