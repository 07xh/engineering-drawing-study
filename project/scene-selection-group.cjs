'use strict';
/**
 * V7 presentation-only 2D/3D selection correspondence.
 *
 * The canonical Geometry Scene owns parentObjectId resolution and projection;
 * this module only groups the already-derived immutable object IDs for UI
 * highlighting. It MUST NOT alter geometry, result certification, V5 timing
 * or persist derived objects into confirmed project inputs.
 */
const {SCHEMA}=require('../core/projection/geometry-scene-views.cjs');

function sceneSelectionGroup(scene,selectedId,revision){
 if(!scene||scene.schema!==SCHEMA||!Array.isArray(scene.objects)||
    !Number.isSafeInteger(revision)||scene.revision!==revision||
    typeof selectedId!=='string'||!selectedId)
  return Object.freeze([]);
 const selected=scene.objects.find(o=>o.id===selectedId);
 if(!selected)return Object.freeze([]); // Stale or foreign selection is ignored.
 const owner=selected.selectionObjectId??selected.id;
 // The trusted Scene resolves ancestry; a missing owner is never inferred.
 if(!scene.objects.some(o=>o.id===owner))
  return Object.freeze([]);
 return Object.freeze(scene.objects.filter(o=>
  (o.selectionObjectId??o.id)===owner).map(o=>o.id));
}

module.exports={sceneSelectionGroup};
