'use strict';
// Switching to a different solver task must not destroy already entered geometry.
// The new project may reuse the immutable local source image, but must re-confirm
// dimensions and derive its own mathematics, scene, and V5 proof.
const {newProject}=require('./project-coordinator.cjs');
function hasTaskInputs(project){
 return !!(project && (
  (Array.isArray(project.objects)&&project.objects.length)||
  (Array.isArray(project.conditions)&&project.conditions.length)||
  (Array.isArray(project.relations)&&project.relations.length)||
  project.affineProblem
 ));
}
function forkTaskProject(previous,task,id){
 if(!previous||typeof previous!=='object')throw new Error('没有可切换的项目');
 const project=newProject({id,task});
 if(previous.source?.imageId){
  project.source.imageId=previous.source.imageId;
  project.source.rotationDeg=previous.source.rotationDeg;
 }
 // Pixel measurements and confirmed constraints are NOT portable solver evidence.
 // The source image is shared through the existing reference-counted image store.
 project.view.mode=task==='planar'?'2d':'split';
 return project;
}
module.exports={hasTaskInputs,forkTaskProject};
