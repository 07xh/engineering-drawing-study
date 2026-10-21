'use strict';
// Exercise the actual reader with real course records and an in-memory DOM/storage adapter.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('knowledge/index.html','utf8');
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.value='';this.hidden=false;this.dataset={};this.attributes={};this.listeners={};this.classList={toggle(){}};}
 get options(){return this.children;}
 append(...nodes){this.children.push(...nodes);if(this.tag==='select'&&!this.value&&nodes[0])this.value=nodes[0].value;}
 add(node){this.append(node);}
 replaceChildren(...nodes){this.children=[];if(this.tag==='select')this.value='';this.append(...nodes);}
 setAttribute(name,value){this.attributes[name]=value;}
 addEventListener(name,handler){this.listeners[name]=handler;}
 fire(name){if(this.listeners[name])this.listeners[name]();}
 scrollIntoView(){}
 focus(){}
}
function reader({hash='',search='',denyStorage=false}={}){
 const nodes={};
 for(const match of html.matchAll(/<([\w-]+)[^>]*\bid="([^"]+)"[^>]*>/g))nodes[match[2]]=new Element(match[1]);
 for(const id of ['chapterSelect','sectionSelect','coverageSelect','progressSelect'])nodes[id].value='all';
 const memory=new Map(),events={};
 const context={console,URLSearchParams,location:{hash,search},history:{replaceState(){}},
  Option:function(text,value){const node=new Element('option');node.textContent=text;node.value=value;return node;},
  localStorage:{getItem:key=>memory.get(key)||null,setItem(key,value){if(denyStorage)throw Error('storage denied');memory.set(key,value);}},
  document:{getElementById:id=>nodes[id]||null,createElement:tag=>new Element(tag),querySelector:()=>null,querySelectorAll:()=>nodes.knowledgeCards.children.filter(node=>node.dataset.id)},
  matchMedia:()=>({matches:false}),addEventListener:(name,handler)=>{events[name]=handler;}};
 context.window=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync('knowledge/knowledge-data.js','utf8'),context);
 vm.runInContext(fs.readFileSync('knowledge/knowledge-app.js','utf8'),context);
 return {nodes,context,memory,events};
}
const r=reader(),n=r.nodes,book=r.context.DrawingKnowledge;
const reviewed=book.entries.filter(entry=>entry.contentStatus==='page-reviewed');
assert.equal(n.topicSelect.options.length,54);
assert.equal(n.previousTopic.disabled,true);
n.nextTopic.onclick();assert.equal(n.detailTitle.textContent,reviewed[1].title);
n.previousTopic.onclick();assert.equal(n.detailTitle.textContent,reviewed[0].title);
n.progressSelect.value='unread';n.progressSelect.fire('input');n.markRead.onclick();
assert.equal(n.detailTitle.textContent,reviewed[1].title,'completed lesson leaves the unread view');
assert.equal(n.topicSelect.options.length,53);
n.knowledgeSearch.value='no-such-topic-xyz';n.knowledgeSearch.fire('input');
assert.equal(n.empty.hidden,false);assert.equal(n.knowledgeDetail.hidden,true);
assert(html.indexOf('id="empty"')<html.indexOf('id="knowledgeIndex"'),'empty result must be outside collapsed directory');
n.clearEmptyFilters.onclick();assert.equal(n.topicSelect.options.length,54);assert.equal(n.empty.hidden,true);
const pending=book.entries.find(entry=>entry.contentStatus==='toc-only');
r.context.location.hash='#'+pending.id;r.events.hashchange();
assert.equal(n.detailTitle.textContent,pending.title);assert.equal(n.topicSelect.value,pending.id);assert.equal(n.markRead.disabled,true);
const deep=reader({hash:'#'+pending.id});assert.equal(deep.nodes.topicSelect.value,pending.id);
const later=reader({search:'?chapter=ch04'});assert(later.nodes.topicSelect.options.length>0);assert.equal(later.nodes.coverageSelect.value,'all');
const denied=reader({denyStorage:true});denied.nodes.markRead.onclick();
assert(denied.nodes.markStatus.textContent.includes('无法保存'),'storage failure must remain visible');
assert.equal(r.memory.get('drawing-textbook-3e-last-topic'),pending.id);
console.log('PASS reader navigation: reviewed default, adjacent topics, unread completion, visible empty recovery, deep links, pending chapters, storage failure');
