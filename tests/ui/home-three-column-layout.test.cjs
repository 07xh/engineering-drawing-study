'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {parseHTML}=require('linkedom');const {homeHTML}=require('../../ui-next/home.cjs');
test('home keeps one input, drawing, steps and player in distinct task regions',()=>{
 const {document}=parseHTML('<main>'+homeHTML()+'</main>');const layout=document.querySelector('.v7-layout');
 const input=document.getElementById('v7-input-section'),paper=document.getElementById('v7-paper-section'),steps=document.querySelector('.v7-steps');
 assert.ok(input.parentElement===layout);assert.ok(paper.parentElement===layout);assert.ok(steps.parentElement===layout);
 assert.ok(paper.querySelector('#v7-sheet'));assert.ok(paper.querySelector('#v7-play'));assert.ok(steps.querySelector('#v7-step-list'));
 for(const id of ['v7-sheet','v7-step-list','v7-play','v7-seek','v7-speed','v7-confirm','v7-solve'])assert.equal(document.querySelectorAll('#'+id).length,1,id);
});
