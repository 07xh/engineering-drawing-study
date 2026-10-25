#!/usr/bin/env node
/**
 * Isolated, real OpenCascade.js WebAssembly ABI/HLR smoke.
 * No exports, imports or dependencies from DraftAI production code.
 * Only actual CAD operations count as passing; missing exports fail CI.
 * Invocation: node tools/cad-oracle/probe-opencascade-js-hlr.mjs <isolated-package-root>
 */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFileSync, statSync} from 'node:fs';
import {performance} from 'node:perf_hooks';

const packageRoot = process.argv[2];
assert.ok(packageRoot, 'explicit isolated OpenCascade.js installation required');
const packageDir=resolve(packageRoot,'node_modules/opencascade.js');
const manifest=JSON.parse(readFileSync(resolve(packageDir,'package.json'),'utf8'));
const expected='2.0.0-beta.b5ff984';
assert.equal(manifest.version,expected,'unreviewed OCJS package version');
assert.equal(manifest.license,'LGPL-2.1-only','license must receive separate distribution review');
const wasm=resolve(packageDir,'dist/opencascade.full.wasm');
const bytes=statSync(wasm).size;
assert.ok(bytes>1024,'a real non-empty WASM engine is required');
const entry=pathToFileURL(resolve(packageDir,'dist/node.js')).href;
const {default:initOpenCascade}=await import(entry);
assert.equal(typeof initOpenCascade,'function','actual Node/WASM loader required');
const started=performance.now();
const oc=await initOpenCascade();
const initMs=performance.now()-started;
const allocated=[];
function hold(obj){
  assert.ok(obj&&typeof obj.delete==='function','OCJS RAII object must be explicitly releasable');
  allocated.push(obj);return obj;
}
function api(name){
  assert.equal(typeof oc[name],'function','required real HLR export missing: '+name);
  return oc[name];
}
for(const name of [
  'gp_Pnt_3','gp_Pnt2d_1','gp_Dir_4','gp_Ax2_2','BRepPrimAPI_MakeBox_4',
  'HLRBRep_Algo_1','Handle_HLRBRep_Algo_2','HLRAlgo_Projector_2',
  'HLRBRep_HLRToShape','TopExp_Explorer_2'
])api(name);
const box=hold(new (api('BRepPrimAPI_MakeBox_4'))(
  hold(new (api('gp_Pnt_3'))(-4,5,-9)),
  hold(new (api('gp_Pnt_3'))(24,18,31))
));
assert.equal(box.IsDone(),true,'real finite B-Rep construction failed');
const solid=hold(box.Shape());
assert.equal(solid.IsNull(),false);
const kind=oc.TopAbs_ShapeEnum?.TopAbs_EDGE??oc.TopAbs_EDGE;
const avoid=oc.TopAbs_ShapeEnum?.TopAbs_SHAPE??oc.TopAbs_SHAPE;
assert.ok(kind!==undefined&&avoid!==undefined,'actual TopAbs EDGE / SHAPE enum bindings required');
const frames={
  V:{normal:[0,1,0],xdir:[1,0,0],xyz:[9,5,11],uv:[9,11]},
  H:{normal:[0,0,-1],xdir:[1,0,0],xyz:[9,12,11],uv:[9,12]},
  W:{normal:[-1,0,0],xdir:[0,1,0],xyz:[9,12,11],uv:[12,11]}
};
const outputs={};
try{
  for(const [view,f] of Object.entries(frames)){
    const t0=performance.now();
    const axis=hold(new (api('gp_Ax2_2'))(
      hold(new (api('gp_Pnt_3'))(0,0,0)),
      hold(new (api('gp_Dir_4'))(...f.normal)),
      hold(new (api('gp_Dir_4'))(...f.xdir))
    ));
    const projector=hold(new (api('HLRAlgo_Projector_2'))(axis));
    const point=hold(new (api('gp_Pnt_3'))(...f.xyz));
    const flat=hold(new (api('gp_Pnt2d_1'))());
    projector.Project_1(point,flat);
    assert.ok(Math.abs(flat.X()-f.uv[0])<1e-7 &&
      Math.abs(flat.Y()+f.uv[1])<1e-7,
      'real OCCT projector disagrees with DraftAI first-angle '+view);
    const algorithm=hold(new (api('HLRBRep_Algo_1'))());
    algorithm.Add_2(solid,0);
    algorithm.Projector_1(projector);
    algorithm.Update();
    algorithm.Hide_1();
    const handle=hold(new (api('Handle_HLRBRep_Algo_2'))(algorithm));
    assert.equal(handle.IsNull(),false,'null real B-Rep HLR algorithm');
    const extracted=hold(new (api('HLRBRep_HLRToShape'))(handle));
    const visible=hold(extracted.VCompound_1());
    assert.equal(visible.IsNull(),false,'actual OCCT HLR yielded null visible geometry');
    const explorer=hold(new (api('TopExp_Explorer_2'))(visible,kind,avoid));
    let edgeCount=0;
    while(explorer.More()){
      edgeCount++;
      assert.ok(edgeCount<=128,'unbounded real HLR geometry');
      explorer.Next();
    }
    assert.ok(edgeCount>=4,'expected visible OCCT B-Rep line edges for '+view);
    outputs[view]={visibleBRepEdgeCount:edgeCount,elapsedMs:Math.round(performance.now()-t0)};
  }
}finally{
  // Reverse creation order so owned HLR shapes, projector handles and
  // working geometry remain valid until no consumers reference them.
  for(const obj of allocated.reverse())obj.delete();
}
const report={
  schema:'draftai-c1-opencascade-js-real-wasm-hlr-probe/1',
  package:'opencascade.js',version:manifest.version,license:manifest.license,
  wasmBytes:bytes,initMs:Math.round(initMs),views:outputs,
  isolatedOnly:true,productionRuntimeEnabled:false,
  m5Certified:false,officialLineStylesCertified:false,v5Authorized:false
};
assert.deepEqual(Object.keys(report.views).sort(),['H','V','W']);
process.stdout.write(JSON.stringify(report,null,2)+'\n');
