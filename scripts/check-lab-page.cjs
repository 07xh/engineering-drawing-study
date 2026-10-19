'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('labs/constraints.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert(scripts.length>0,'lab script missing');
for(const [,code] of scripts)new vm.Script(code,{filename:'labs/constraints.html'});
for(const id of ['space','sheet','standardView','unfold','fold','sceneZoom','sceneState','showCoordinates','showAxes','showPlanes','showSpatialProjectors','show45','showProjectors','showSheetCoordinates','kx','ky','vertex','freeHeight','freeHeightOut','freeHeightControl','dragFeedback'])assert(html.includes('id="'+id+'"'),'missing control '+id);
for(const name of ['sheetPt','sheetDraw','isoPoint','projectionOf','isoPolygon','planePoly','animateUnfold','candidatePosition','planeMove','svgPointer'])assert(html.includes(name),'missing geometry function '+name);
console.log('PASS lab inline JS syntax and projection sheet controls');
