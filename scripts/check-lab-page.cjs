'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('labs/constraints.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert(scripts.length>0,'lab script missing');
for(const [,code] of scripts)new vm.Script(code,{filename:'labs/constraints.html'});
for(const id of ['space','sheet','viewFront','viewSide','viewTop','viewExplanation','coordinateSummary','coordinateTitle','coordinateMeaning','coordX','coordY','coordZ','kxLabel','kyLabel','unfold','fold','sceneZoom','sceneState','showCoordinates','showAxes','showPlanes','showSpatialProjectors','show45','showProjectors','showSheetCoordinates','kx','ky','vertex','freeHeight','freeHeightOut','freeHeightControl','dragFeedback'])assert(html.includes('id="'+id+'"'),'missing control '+id);
for(const name of ['sheetPt','sheetDraw','isoPoint','projectionOf','isoPolygon','planePoly','animateUnfold','coordinateState','VIEW_PRESETS','useView','candidatePosition','planeMove','svgPointer'])assert(html.includes(name),'missing geometry function '+name);

assert(!html.includes('id="standardView"'),'obsolete free-rotation reset button should be removed');
assert(!html.includes("drag.mode==='camera'"),'free camera rotation must be disabled');
for(const id of ['viewFront','viewSide','viewTop'])assert(html.includes("$(\'"+id+"\').onclick"),'missing fixed view handler '+id);
for(const id of ['constraintExplorer','constraintH','constraintP','constraintZ','explorerDof','explorerLocus','explorerSteps','explorerStrategy'])assert(html.includes('id="'+id+'"'),'missing shared-engine explorer '+id);
assert(html.includes('src="constraint-engine.js"')&&html.includes('src="constraint-explorer.js"'),'shared engine scripts must be loaded');
assert(!html.includes('id="explorerSpace"')&&!html.includes('id="explorerViews"'),'duplicated visualizations must be removed');
console.log('PASS lab inline JS syntax, fixed-view controls and coordinate explanation elements');
