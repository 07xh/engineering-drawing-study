/* Layout only. Mathematical state belongs to each existing application. */
(function(root){
 'use strict';
 function initUI(document){
  if(document.body.dataset.nextInitialized)return;
  document.body.dataset.nextInitialized='true';
  const tabs=[...document.querySelectorAll('[data-next-panel-button]')];
  const focusControl=document.querySelector('[data-next-focus]');
  const canvas=document.querySelector('.next-canvas');let zoom=1;
  for(const button of document.querySelectorAll('[data-next-zoom]'))button.addEventListener('click',()=>{
   zoom=button.dataset.nextZoom==='fit'?1:Math.min(3,Math.max(1,zoom+(button.dataset.nextZoom==='in' ? 0.25 : -0.25)));
   canvas?.style.setProperty('--next-zoom',String(zoom));
   const label=document.querySelector('[data-next-zoom-label]');if(label)label.textContent=Math.round(zoom*100)+'%';
   for(const control of document.querySelectorAll('[data-next-zoom]'))control.disabled=control.dataset.nextZoom==='out'?zoom===1:control.dataset.nextZoom==='in'?zoom===3:false;
  });
  function setCanvasFocus(on){
   document.body.classList.toggle('next-focus-canvas',on);
   if(focusControl){focusControl.setAttribute('aria-pressed',String(on));focusControl.textContent=on?'退出专注画布':'专注画布';}
  }
  function showPanel(key,{exitFocus=true}={}){
   if(exitFocus)setCanvasFocus(false);
   for(const tab of tabs){const selected=tab.dataset.nextPanelButton===key;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
   for(const panel of document.querySelectorAll('[data-next-panel]'))panel.hidden=panel.dataset.nextPanel!==key;
  }
  for(const tab of tabs){
   tab.addEventListener('click',()=>showPanel(tab.dataset.nextPanelButton));
   tab.addEventListener('keydown',event=>{
    const i=tabs.indexOf(tab);let next;
    if(event.key==='ArrowRight')next=(i+1)%tabs.length;
    if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;
    if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();showPanel(tabs[next].dataset.nextPanelButton);tabs[next].focus();}
   });
  }
  // Playback and diagram picking update explanations in the app; reveal them
  // without altering its state or overriding a user's dedicated canvas view.
  const revealSteps=()=>showPanel('steps',{exitFocus:false});
  for(const control of document.querySelectorAll('.next-playback button'))control.addEventListener('click',revealSteps);
  for(const slider of document.querySelectorAll('.next-playback input[type=range]'))slider.addEventListener('input',revealSteps);
  document.addEventListener('click',event=>{
   if(event.target.closest?.('.next-canvas [data-action],.next-canvas [data-v5-pick]'))revealSteps();
  });
  focusControl?.addEventListener('click',()=>setCanvasFocus(!document.body.classList.contains('next-focus-canvas')));
  for(const button of document.querySelectorAll('[data-next-stage]'))button.addEventListener('click',()=>{
   showPanel(button.dataset.nextStage);
   const target=document.getElementById(button.dataset.nextTarget);
   if(!target)return;
   const details=target.closest('details');if(details)details.open=true;
   // Focus a panel when the requested app control is disabled; never enable it.
   const focusTarget=target.disabled?target.closest('[data-next-panel]'):target;
   if(!focusTarget.hasAttribute('tabindex')&&!focusTarget.matches('button,input,select,textarea,a'))focusTarget.setAttribute('tabindex','-1');
   focusTarget.focus({preventScroll:true});focusTarget.scrollIntoView?.({block:'nearest',behavior:'auto'});
  });
  document.addEventListener('keydown',event=>{
   if(event.key!=='Escape')return;
   if(document.body.classList.contains('next-focus-canvas')){setCanvasFocus(false);focusControl?.focus();}
   for(const menu of document.querySelectorAll('.next-menu[open]')){
    menu.open=false;menu.removeAttribute('open');menu.querySelector('summary').focus();
   }
  });
 }
 if(typeof module==='object'&&module.exports)module.exports={initUI};
 else if(root.document){
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>initUI(root.document),{once:true});
  else initUI(root.document);
 }
})(typeof window==='object'?window:this);
