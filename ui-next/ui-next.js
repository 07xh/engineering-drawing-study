/* Layout only. Mathematical state belongs to each existing application. */
(function(root){
 'use strict';
 function initUI(document){
  if(document.body.dataset.nextInitialized)return;
  document.body.dataset.nextInitialized='true';
  const tabs=[...document.querySelectorAll('[data-next-panel-button]')];
  const focusControl=document.querySelector('[data-next-focus]');
  const canvas=document.querySelector('.next-canvas');
  const workbench=document.querySelector('.next-workspace');
  const wide=!!document.defaultView?.matchMedia?.('(min-width: 1160px)')?.matches;
  const conditionPanel=document.querySelector('[data-next-panel="conditions"]');
  const stepPanel=document.querySelector('[data-next-panel="steps"]');
  const reviewPanel=document.querySelector('[data-next-panel="review"]');
  if(wide&&workbench&&conditionPanel&&stepPanel){
   workbench.dataset.nextSide='both';
   workbench.dataset.nextConditions='open';
   workbench.dataset.nextSteps='open';
   stepPanel.hidden=false;
  }
  let zoom=1;
  for(const button of document.querySelectorAll('[data-next-zoom]'))button.addEventListener('click',()=>{
   zoom=button.dataset.nextZoom==='fit'?1:Math.min(3,Math.max(1,zoom+(button.dataset.nextZoom==='in' ? 0.25 : -0.25)));
   canvas?.style.setProperty('--next-zoom',String(zoom));
   const label=document.querySelector('[data-next-zoom-label]');if(label)label.textContent=Math.round(zoom*100)+'%';
   for(const control of document.querySelectorAll('[data-next-zoom]'))control.disabled=control.dataset.nextZoom==='out'?zoom===1:control.dataset.nextZoom==='in'?zoom===3:false;
  });
  function setCanvasFocus(on){
   document.body.classList.toggle('next-focus-canvas',on);
   if(focusControl){focusControl.setAttribute('aria-pressed',String(on));const label=on?'退出专注图纸':'专注图纸';focusControl.setAttribute('aria-label',label);focusControl.setAttribute('title',label);focusControl.setAttribute('data-ui-tip',label);}
  }
  function syncRailButtons(){
   for(const control of document.querySelectorAll('[data-next-open-panel]')){
    const key=control.dataset.nextOpenPanel;
    const shown=wide&&workbench ? (key==='conditions'?workbench.dataset.nextConditions==='open':workbench.dataset.nextSteps==='open') : workbench?.dataset.nextSide===key;
    control.setAttribute('aria-expanded',String(shown));
   }
  }
  function showPanel(key,{exitFocus=true}={}){
   if(exitFocus)setCanvasFocus(false);
   if(wide&&workbench&&conditionPanel&&stepPanel){
    if(key==='conditions'){workbench.dataset.nextConditions='open';conditionPanel.hidden=false;}
    else if(key==='steps'||key==='review'){
     workbench.dataset.nextSteps='open';
     stepPanel.hidden=key!=='steps';
     if(reviewPanel)reviewPanel.hidden=key!=='review';
    }
    workbench.dataset.nextSide='both';
   }else{
    if(workbench)workbench.dataset.nextSide=key;
    for(const panel of document.querySelectorAll('[data-next-panel]'))panel.hidden=panel.dataset.nextPanel!==key;
   }
   for(const tab of tabs){const selected=tab.dataset.nextPanelButton===key;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
   syncRailButtons();
  }
  syncRailButtons();
  for(const control of document.querySelectorAll('[data-next-open-panel]'))control.addEventListener('click',()=>{
   const key=control.dataset.nextOpenPanel;
   if(wide&&workbench){
    const field=key==='conditions'?'nextConditions':'nextSteps';
    const now=workbench.dataset[field]==='open';
    workbench.dataset[field]=now?'closed':'open';
    if(!now)showPanel(key);
    else{
     if(key==='conditions')conditionPanel.hidden=true;
     if(key==='steps'){stepPanel.hidden=true;if(reviewPanel)reviewPanel.hidden=true;}
     workbench.dataset.nextSide=workbench.dataset.nextConditions==='closed'&&workbench.dataset.nextSteps==='closed'?'none':'both';
     syncRailButtons();
    }
   }else if(workbench?.dataset.nextSide===key){
    workbench.dataset.nextSide='none';syncRailButtons();
   }else showPanel(key);
  });
  for(const control of document.querySelectorAll('[data-next-close-panel]'))control.addEventListener('click',()=>{
   if(workbench)workbench.dataset.nextSide='none';
   if(wide&&workbench){workbench.dataset.nextConditions='closed';workbench.dataset.nextSteps='closed';}
   syncRailButtons();
  });
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
  // Show accessible labels for icon-only links on long press.
  for(const link of document.querySelectorAll('.next-sidebar [data-ui-tip]')){
   let hold=null,shown=false;
   link.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse')return;
    shown=false;
    hold=setTimeout(()=>{shown=true;link.classList.add('next-tip-visible');},520);
   });
   const clear=()=>{if(hold!==null){clearTimeout(hold);hold=null;}};
   link.addEventListener('pointerup',clear);
   link.addEventListener('pointercancel',()=>{clear();link.classList.remove('next-tip-visible');});
   link.addEventListener('pointerleave',clear);
   link.addEventListener('click',event=>{
    if(shown){event.preventDefault();shown=false;link.classList.remove('next-tip-visible');}
   });
   link.addEventListener('blur',()=>link.classList.remove('next-tip-visible'));
  }
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
