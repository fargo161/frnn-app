import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

class FakeElement {
  constructor(tagName='div') {
    this.tagName=tagName.toLowerCase();
    this.children=[];
    this.dataset={};
    this.className='';
    this.value='';
    this.disabled=false;
    this.listeners={};
    this._textContent='';
    this.classList={add(){},remove(){},toggle(){}};
  }

  set textContent(value) {
    this._textContent=String(value);
    if(value==='') this.children=[];
  }

  get textContent() {
    return this._textContent;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  append(...children) {
    this.children.push(...children);
  }

  addEventListener(type,handler) {
    this.listeners[type]=handler;
  }

  querySelectorAll(selector) {
    const matches=[];
    const match=element=>{
      if(selector==='input,select') return element.tagName==='input'||element.tagName==='select';
      if(selector==='[data-program-row]') return Object.hasOwn(element.dataset,'programRow');
      const field=selector.match(/^\[data-program-field="([^"]+)"\]$/);
      return field?element.dataset.programField===field[1]:false;
    };
    const visit=element=>{
      for(const child of element.children) {
        if(match(child)) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0]||null;
  }
}

async function createPackagerHarness() {
  const html=await fs.readFile(new URL('../public/admin.html',import.meta.url),'utf8');
  const inlineScript=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inlineScript,'Mission Control inline script should exist');
  const elements=new Map();
  const document={
    createElement:tagName=>new FakeElement(tagName),
    getElementById:id=>{
      if(!elements.has(id)) elements.set(id,new FakeElement());
      return elements.get(id);
    }
  };
  const calls=[];
  const responses=[];
  const fetch=async(url,options={})=>{
    calls.push({url,options});
    const response=responses.shift();
    if(!response) throw new Error(`No fake response queued for ${url}`);
    return {ok:response.ok??true,status:response.status??200,json:async()=>response.body??{}};
  };
  const source=inlineScript.replace(/restoreSession\(\);\s*$/,'')+`
globalThis.__packager={
  defaultProgram,renderProgramRows,setProgramControls,markProgramQueueDirty,readProgramRows,
  loadPrograms,savePrograms,startBroadcast,stopBroadcast,
  elements:{programEditor,saveProgramsButton,startBroadcastButton,stopBroadcastButton,programStatus,broadcastPackagerState}
};`;
  const context={document,fetch,window:{confirm:()=>true,open(){},location:{reload(){}}},navigator:{clipboard:{writeText(){}}},console,Date,JSON,Number,String,Set,Promise,encodeURIComponent};
  vm.runInNewContext(source,context,{filename:'public/admin.html'});
  return {packager:context.__packager,calls,responses,html};
}

const queue=[
  {id:'program-a',title:'Program A',program_type:'test_card',media_ref:'',duration_ms:12000,queue_position:1},
  {id:'program-b',title:'Program B',program_type:'test_card',media_ref:'',duration_ms:12000,queue_position:2},
  {id:'program-c',title:'Program C',program_type:'test_card',media_ref:'',duration_ms:12000,queue_position:3}
];

test('Packager exposes exactly three safe fixture rows and explicit transport controls',async()=>{
  const {packager,html}=await createPackagerHarness();
  packager.renderProgramRows([]);
  const rows=packager.elements.programEditor.querySelectorAll('[data-program-row]');
  assert.equal(rows.length,3);
  assert.deepEqual(rows.map(row=>row.querySelector('[data-program-field="title"]').value),['Program A','Program B','Program C']);
  assert.deepEqual(rows.map(row=>row.querySelector('[data-program-field="duration_ms"]').value),['12000','12000','12000']);
  assert.match(html,/id="savePrograms"/);
  assert.match(html,/id="startBroadcast"/);
  assert.match(html,/id="stopBroadcast"/);
  const renderer=html.slice(html.indexOf('function renderProgramRows'),html.indexOf('function setProgramControls'));
  assert.doesNotMatch(renderer,/innerHTML/);
});

test('loading and refresh recovery only read Program state and never start the broadcast',async()=>{
  const {packager,calls,responses,html}=await createPackagerHarness();
  responses.push({body:{status:'off_air',started_at:null,programs:queue}});
  await packager.loadPrograms();
  assert.deepEqual(calls.map(call=>[call.url,call.options.method||'GET']),[['/api/admin/programs','GET']]);
  assert.equal(packager.elements.startBroadcastButton.disabled,false);
  assert.equal(packager.elements.stopBroadcastButton.disabled,true);
  const restorePaths=html.slice(html.indexOf('async function connectAdmin'),html.indexOf('async function issueNextCode'));
  assert.match(restorePaths,/loadPrograms\(\)/);
  assert.doesNotMatch(restorePaths,/startBroadcast\(\)/);
});

test('on-air state locks queue fields and Save/Start while leaving Stop available',async()=>{
  const {packager,responses}=await createPackagerHarness();
  responses.push({body:{status:'on_air',started_at:'2026-08-24T08:00:00.000Z',programs:queue}});
  await packager.loadPrograms();
  assert.equal(packager.elements.broadcastPackagerState.textContent,'ON AIR');
  assert.ok(packager.elements.programEditor.querySelectorAll('input,select').every(control=>control.disabled));
  assert.equal(packager.elements.saveProgramsButton.disabled,true);
  assert.equal(packager.elements.startBroadcastButton.disabled,true);
  assert.equal(packager.elements.stopBroadcastButton.disabled,false);
});

test('editing requires a separate Save before Start and Save sends the complete queue contract',async()=>{
  const {packager,calls,responses}=await createPackagerHarness();
  packager.renderProgramRows(queue);
  packager.setProgramControls('off_air');
  packager.markProgramQueueDirty();
  assert.equal(packager.elements.startBroadcastButton.disabled,true);
  assert.match(packager.elements.programStatus.textContent,/UNSAVED PROGRAM CHANGES/);
  responses.push(
    {body:{programs:queue}},
    {body:{status:'off_air',started_at:null,programs:queue}}
  );
  await packager.savePrograms();
  assert.equal(calls[0].url,'/api/admin/programs');
  assert.equal(calls[0].options.method,'PUT');
  assert.deepEqual(JSON.parse(calls[0].options.body),{programs:queue});
  assert.equal(packager.elements.startBroadcastButton.disabled,false);
  assert.ok(calls.every(call=>call.url!=='/api/admin/broadcast/start'));
});

test('client validation rejects duplicate order without making a mutation request',async()=>{
  const {packager,calls}=await createPackagerHarness();
  packager.renderProgramRows(queue);
  const rows=packager.elements.programEditor.querySelectorAll('[data-program-row]');
  rows[1].querySelector('[data-program-field="queue_position"]').value='1';
  await packager.savePrograms();
  assert.equal(calls.length,0);
  assert.match(packager.elements.programStatus.textContent,/PROGRAM QUEUE IS INVALID/);
});

test('Start and Stop are separate explicit POST actions followed by authoritative reloads',async()=>{
  const {packager,calls,responses}=await createPackagerHarness();
  responses.push(
    {body:{status:'on_air'}},
    {body:{status:'on_air',started_at:'2026-08-24T08:00:00.000Z',programs:queue}},
    {body:{status:'off_air'}},
    {body:{status:'off_air',started_at:null,programs:queue}}
  );
  await packager.startBroadcast();
  await packager.stopBroadcast();
  assert.deepEqual(calls.map(call=>[call.url,call.options.method||'GET']),[
    ['/api/admin/broadcast/start','POST'],
    ['/api/admin/programs','GET'],
    ['/api/admin/broadcast/stop','POST'],
    ['/api/admin/programs','GET']
  ]);
});
