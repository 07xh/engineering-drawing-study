/* DraftFlow Cone Lab P1: offline model-file bridge.
 * Keep the upstream rendering/geometry implementation in index.html.
 * Imported state is always an unverified editable model; NEVER a certified
 * SolveResult, visibility claim, C2/C3 answer, or V5 construction.
 */
(function (root, make) {
  'use strict';
  var bridge = make();
  if (typeof module === 'object' && module.exports) module.exports = bridge;
  if (root) root.DraftFlowConeLabBridge = bridge;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  var SCHEMA = 'draftflow.conelab.model.v1';
  var SOURCE_REPO = 'gugugaga-design/cone-lab';
  var SOURCE_SHA = '6aae2535f267fdc32a813c196062f33aaf6bfe0b';
  var MAX_BYTES = 1024 * 1024;
  var SHAPES = ['cone','hemi','frustum5','prism5','pyr3','cyl','cylz','hcyl','lab'];
  var TYPES = ['frontal','fv','horiz','pv','lat','lv'];
  var PART_DIMS = {
    cone:['r','h'],sphere:['r'],hemi:['r'],box:['w','d','h'],
    cube:['a'],cyl:['r','h'],slot:['w','d','h'],
    pyr3:['r','h'],frustum:['r','rt','h']
  };
  var CUT_SHAPES = ['cyl','sq','rect','cone','sphere','hemi','slot','pyr3','frustum'];
  function own(o, k){ return Object.prototype.hasOwnProperty.call(o, k); }
  function fail(message){ throw new Error(message); }
  function object(v, name){
    if(!v || typeof v !== 'object' || Array.isArray(v)) fail(name + ' 必须是对象');
    return v;
  }
  function array(v, name, max){
    if(!Array.isArray(v) || v.length > max) fail(name + ' 格式错误或数量超限');
    return v;
  }
  function choice(v, items, name){
    if(typeof v !== 'string' || items.indexOf(v) === -1) fail(name + ' 不支持：' + String(v));
    return v;
  }
  function real(v, name, positive){
    if(typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v)>100000 ||
       (positive && v <= 0)) fail(name + ' 必须是有效' + (positive?'正':'') + '数');
    return v;
  }
  function flag(v, name, def){
    if(v === undefined) return def;
    if(typeof v !== 'boolean') fail(name + ' 必须是布尔值');
    return v;
  }
  function sourceId(v, name){
    if(v === undefined) return undefined;
    if(typeof v === 'number' && Number.isSafeInteger(v) && v >= 0) return v;
    if(typeof v === 'string' && /^[a-zA-Z0-9:_-]{1,64}$/.test(v)) return v;
    fail(name + ' 无效');
  }
  function coords(v,name){
    var out={};
    ['x','y','z'].forEach(function(k){out[k]=real(v[k],name+'.'+k,false);});
    return out;
  }
  function normalizePart(value, i){
    var name='parts['+i+']', p=object(value,name), kind=choice(p.k,Object.keys(PART_DIMS),name+'.k');
    var out={k:kind,type:choice(p.type,TYPES,name+'.type'),ang:real(p.ang,name+'.ang',false)};
    Object.assign(out,coords(p,name));
    PART_DIMS[kind].forEach(function(k){out[k]=real(p[k],name+'.'+k,true);});
    out.on=flag(p.on,name+'.on',true);
    out.open=flag(p.open,name+'.open',true);
    if(own(p,'locked')) out.locked=flag(p.locked,name+'.locked',false);
    if(own(p,'hidden')) out.hidden=flag(p.hidden,name+'.hidden',false);
    if(own(p,'_id')) out._id=sourceId(p._id,name+'._id');
    return out;
  }
  function normalizeFace(value,i){
    var name='faces['+i+']',p=object(value,name);
    var out={type:choice(p.type,TYPES,name+'.type'),ang:real(p.ang,name+'.ang',false)};
    Object.assign(out,coords(p,name));
    out.on=flag(p.on,name+'.on',true);
    out.flip=flag(p.flip,name+'.flip',false);
    if(own(p,'open')) out.open=flag(p.open,name+'.open',true);
    if(own(p,'_id')) out._id=sourceId(p._id,name+'._id');
    return out;
  }
  function normalizeCutter(value,i){
    var name='cyls['+i+']',p=object(value,name);
    var out={
      shape:choice(p.shape,CUT_SHAPES,name+'.shape'),
      type:choice(p.type,TYPES,name+'.type'),
      ang:real(p.ang,name+'.ang',false)
    };
    Object.assign(out,coords(p,name));
    var req = out.shape==='sq'||out.shape==='rect'?['w','h']:['r'];
    if(out.shape==='frustum') req.push('rt');
    req.forEach(function(k){out[k]=real(p[k],name+'.'+k,true);});
    // Preserve optional validated values used by several upstream cutter types.
    ['r','rt','w','h'].forEach(function(k){if(own(p,k)&&!own(out,k))out[k]=real(p[k],name+'.'+k,true);});
    out.len=real(p.len,name+'.len',false);
    if(out.len<0) fail(name+'.len 不能为负数');
    out.depth=own(p,'depth')?real(p.depth,name+'.depth',false):0;
    out.on=flag(p.on,name+'.on',true);
    out.open=flag(p.open,name+'.open',true);
    out.hole=flag(p.hole,name+'.hole',false);
    if(out.hole && ['cyl','sq','rect'].indexOf(out.shape)===-1) fail(name+' 不支持贯穿打孔');
    if(own(p,'_id')) out._id=sourceId(p._id,name+'._id');
    return out;
  }
  function normalizeState(raw){
    var s=object(raw,'model');
    var result={
      shape:choice(s.shape,SHAPES,'model.shape'),
      flipped:flag(s.flipped,'model.flipped',false),
      parts:array(s.parts,'model.parts',6).map(normalizePart),
      faces:array(s.faces,'model.faces',12).map(normalizeFace),
      cyls:array(s.cyls,'model.cyls',4).map(normalizeCutter)
    };
    var sel=object(s.pickSel === undefined?{}:s.pickSel,'model.pickSel');
    var keys=Object.keys(sel);
    if(keys.length>512) fail('model.pickSel 数量超限');
    result.pickSel=Object.create(null);
    keys.forEach(function(k){
      if(!/^[A-Za-z0-9_:|#.-]{1,160}$/.test(k)) fail('model.pickSel 包含非法区域标识');
      if(typeof sel[k]!=='boolean') fail('model.pickSel 必须是布尔值');
      result.pickSel[k]=sel[k];
    });
    return result;
  }
  function documentFromState(state){
    return {
      schema:SCHEMA,
      unit:'mm',
      source:{repository:SOURCE_REPO,commit:SOURCE_SHA},
      coordinates:{frame:'cone-lab',x:'right',y:'up',z:'toward-viewer'},
      verification:'unverified-preview',
      model:normalizeState(state)
    };
  }
  function parseDocument(content){
    if(typeof content !== 'string' || content.length>MAX_BYTES) fail('模型文件不支持或体积超过 1 MB');
    var data;
    try{data=JSON.parse(content);}catch(_){fail('模型文件不是有效 JSON');}
    object(data,'root');
    if(data.schema!==SCHEMA) fail('模型文件 Schema 版本不兼容');
    if(data.unit!=='mm') fail('模型单位不是 mm');
    var src=object(data.source,'source');
    if(src.repository!==SOURCE_REPO || src.commit!==SOURCE_SHA) fail('模型来源版本不匹配');
    var axis=object(data.coordinates,'coordinates');
    if(axis.frame!=='cone-lab'||axis.x!=='right'||axis.y!=='up'||axis.z!=='toward-viewer')
      fail('模型坐标约定不兼容');
    // Never trust a user-supplied proof/verification claim.
    if(data.verification!=='unverified-preview') fail('禁止导入伪造的已认证模型');
    return documentFromState(data.model);
  }
  function download(data, name){
    var blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});
    var url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download=name;
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }
  function mount(api, doc){
    if(!api || typeof api.getState!=='function' || typeof api.setState!=='function')fail('无法绑定原始模型状态');
    doc=doc||document;
    var panel=doc.getElementById('panel');
    if(!panel || doc.getElementById('df-conelab-io')) return;
    var bar=doc.createElement('div');
    bar.id='df-conelab-io';
    bar.style.cssText='display:flex;flex-wrap:wrap;gap:6px;padding:6px 10px;border-top:1px solid #28344a;background:#151d2c;align-items:center';
    function button(title){
      var el=doc.createElement('button');el.type='button';el.textContent=title;el.style.cssText='border:1px solid #3b5379;background:#23344f;color:#e8eef8;border-radius:8px;padding:5px 9px;font-size:12px;min-height:30px';bar.appendChild(el);return el;
    }
    var exportBtn=button('导出模型 JSON');
    var importBtn=button('导入模型 JSON');
    var pick=doc.createElement('input');
    pick.type='file';pick.accept='.json,.dfconelab.json,application/json';pick.hidden=true;bar.appendChild(pick);
    var status=doc.createElement('span');status.id='df-conelab-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    status.style.cssText='flex:1 1 160px;color:#a1b1ce;font-size:11px';
    status.textContent='本机文件交换 · 未验证几何草稿';bar.appendChild(status);
    panel.insertBefore(bar,panel.querySelector('.collapsible'));
    exportBtn.addEventListener('click',function(){
      try{download(documentFromState(api.getState()),'draftflow-cone-lab-model.json');status.textContent='已导出模型（未验证草稿）';}
      catch(e){status.textContent='导出失败：'+e.message;}
    });
    importBtn.addEventListener('click',function(){pick.click();});
    pick.addEventListener('change',async function(){
      var file=pick.files&&pick.files[0];
      if(!file)return;
      try{
        if(file.size>MAX_BYTES)fail('模型文件超过 1 MB');
        var next=parseDocument(await file.text());
        // Only mutate the upstream editor AFTER the entire file is validated.
        api.setState(next.model);
        status.textContent='已载入 '+next.model.parts.length+' 个拼装部件 · 未验证草稿';
      }catch(e){status.textContent='导入失败：'+e.message;}
      finally{pick.value='';}
    });
  }
  return {
    SCHEMA:SCHEMA,SOURCE_SHA:SOURCE_SHA,
    documentFromState:documentFromState,
    parseDocument:parseDocument,
    normalizeState:normalizeState,
    mount:mount
  };
});
