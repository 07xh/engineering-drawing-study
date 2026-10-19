'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const engine=require('../labs/constraint-engine.js');
const source=fs.readFileSync('labs/constraint-explorer.js','utf8');
new vm.Script(source,{filename:'labs/constraint-explorer.js'});
const html=fs.readFileSync('labs/constraints.html','utf8');
for(const id of ['constraintH','constraintP','constraintZ','constraintAll','constraintNone','constraintReset','explorerDof','explorerLocus','explorerSteps','explorerStrategy','space','sheet'])assert(html.includes('id="'+id+'"'),id);
assert(source.includes('engine.analyze(conditions)'),'must use shared engine');
assert(source.includes('window.renderUnifiedConstraintLab?.()'),'must redraw original geometry');
assert(!html.includes('id="explorerSpace"')&&!html.includes('id="explorerViews"'),'duplicate visualizations must be removed');
assert(html.includes('window.ConstraintExplorerState'),'original renderer must consume shared state');
assert(html.includes('window.renderUnifiedConstraintLab=render'),'original renderer must be exported');
const H={type:'projection',plane:'H',value:[35,35]};
const P={type:'plane',normal:{x:-.3,y:-.4,z:1},offset:10};
const Z=z=>({type:'coordinate',axis:'z',value:z});
for(const [cs,degrees] of [[[],3],[[H],1],[[P],2],[[H,P],0],[[H,Z(65)],0],[[P,Z(65)],1],[[H,P,Z(34.5)],0],[[H,P,Z(65)],null]]){
 const result=engine.analyze(cs).result;assert.equal(result.degrees,degrees,'unexpected DOF for '+JSON.stringify(cs));
}
const result=engine.analyze([H,P]).result;
assert.deepEqual(result.particular.map(x=>Math.round(x*10)/10),[35,35,34.5]);
assert.equal(engine.analyze([H,P,Z(34.5)]).steps[2].status,'redundant');
assert.equal(engine.analyze([H,P,Z(65)]).steps[2].status,'contradiction');
console.log('PASS shared engine 3D/three-view explorer: all condition subsets, redundancy, contradictions and wiring');
