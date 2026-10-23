'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {newProject} = require('../../project/project-coordinator.cjs');
const {
  openLocalProjects, DB_NAME, DB_VERSION, MAX_IMAGE_BYTES
} = require('../../project/local-project-store.cjs');

function fakeIndexedDB() {
  const db = {
    data: {projects: new Map(), images: new Map()},
    failures: {},
    closed: false,
    objectStoreNames: {contains: name => Object.hasOwn(db.data, name)},
    createObjectStore(name) { db.data[name] = new Map(); },
    close() {db.closed = true;},
    transaction(names) {
      const copies = Object.fromEntries(names.map(name => [name, new Map(db.data[name])]));
      let pending = 0, aborted = false, completionScheduled = false;
      const tx = {
        error: null,
        abort() { if (aborted) return; aborted = true; setImmediate(() => tx.onabort?.()); },
        objectStore(name) {
          const map = copies[name];
          if (!map) throw new Error('unknown store ' + name);
          const request = fn => {
            const req = {};
            pending++;
            setImmediate(() => {
              if (aborted) return;
              try {
                req.result = fn();
                req.onsuccess?.();
              } catch (error) {
                tx.error = error;
                tx.abort();
              }
              pending--;
              if (!pending && !completionScheduled) {
                completionScheduled = true;
                setImmediate(() => {
                  completionScheduled = false;
                  if (!aborted && pending === 0) {
                    for (const item of names) db.data[item] = copies[item];
                    tx.oncomplete?.();
                  }
                });
              }
            });
            return req;
          };
          return {
            get: id => request(() => map.get(id)),
            getAll: () => request(() => [...map.values()]),
            put: record => request(() => {
              if (db.failures.put) {
                const error = new Error('storage full'); error.name = 'QuotaExceededError'; throw error;
              }
              map.set(record.id, record);
            }),
            delete: id => request(() => map.delete(id))
          };
        }
      };
      return tx;
    }
  };
  return {
    db,
    open(name, version) {
      assert.equal(name, DB_NAME); assert.equal(version, DB_VERSION);
      const req = {};
      setImmediate(() => {
        req.result = db;
        req.onupgradeneeded?.();
        req.onsuccess?.();
      });
      return req;
    }
  };
}

test('storage refusal never claims saved local data', async () => {
  await assert.rejects(() => openLocalProjects(null), /不可使用 IndexedDB/);
  await assert.rejects(() => openLocalProjects({open() {throw Object.assign(new Error('blocked'), {name: 'SecurityError'});}}),
    /禁止本地存储/);
});

test('original image is stored separately from JSON; opening never grants old verification', async () => {
  const factory = fakeIndexedDB();
  const store = await openLocalProjects(factory);
  const p = newProject({id: 'study1', task: 'planar'});
  p.source.imageId = 'imgOne';
  const png = new Blob(['photo bytes'], {type: 'image/png'});
  await store.putImage('imgOne', png);
  const saved = await store.saveProject(p);
  assert.equal(saved.id, 'study1');
  assert.equal(factory.db.data.projects.get('study1').project.source.imageId, 'imgOne');
  assert.equal(JSON.stringify(factory.db.data.projects.get('study1')).includes('photo bytes'), false);
  assert.equal((await store.readImage('imgOne')).size, png.size);
  const restored = await store.readProject('study1');
  assert.equal(restored.project.revision, 0);
  assert.equal(Object.hasOwn(restored.project, 'verified'), false);
  assert.equal((await store.listProjects())[0].title, '未命名项目');
  store.close();
  assert.equal(factory.db.closed, true);
});

test('deleting projects removes private image only when no remaining project uses it', async () => {
  const factory = fakeIndexedDB();
  const store = await openLocalProjects(factory);
  const p = newProject({id: 'study1'});p.source.imageId = 'sharedOne';
  const q = newProject({id: 'study2'});q.source.imageId = 'sharedOne';
  await store.putImage('sharedOne', new Blob(['png'], {type: 'image/png'}));
  await store.saveProject(p);
  await store.saveProject(q);
  assert.equal(await store.deleteProject('study1'), true);
  assert.ok(await store.readImage('sharedOne'));
  assert.equal(await store.deleteProject('study1'), false);
  assert.equal(await store.deleteProject('study2'), true);
  assert.equal(await store.readImage('sharedOne'), null);
  assert.deepEqual(await store.listProjects(), []);
});

test('full quota failure aborts writes and reports honest save failure', async () => {
  const factory = fakeIndexedDB();
  const store = await openLocalProjects(factory);
  factory.db.failures.put = true;
  await assert.rejects(() => store.saveProject(newProject({id: 'study1'})), /空间不足/);
  assert.equal(factory.db.data.projects.size, 0);
});

test('rejects dangerous image types, empty files and excessive image sizes', async () => {
  const factory = fakeIndexedDB();
  const store = await openLocalProjects(factory);
  await assert.rejects(() => store.putImage('imgBad', new Blob(['<svg/>'], {type: 'image/svg+xml'})), /PNG/);
  await assert.rejects(() => store.putImage('imgBad', new Blob([], {type: 'image/png'})), /PNG/);
  await assert.rejects(() => store.putImage('imgBad',
    new Blob([new Uint8Array(MAX_IMAGE_BYTES + 1)], {type: 'image/png'})), /25 MB/);
  assert.equal(factory.db.data.images.size, 0);
});

test('damaged project records must fail closed rather than appear in Continue', async () => {
  const factory = fakeIndexedDB();
  const store = await openLocalProjects(factory);
  const forged = {...newProject({id: 'study1'}), verified: true};
  factory.db.data.projects.set('study1', {id: 'study1', savedAt: 'now', project: forged});
  await assert.rejects(() => store.readProject('study1'), /损坏/);
  await assert.rejects(() => store.listProjects(), /损坏/);
  assert.equal(factory.db.data.projects.size, 1, 'do not silently destroy originals');
});

test('unsupported project versions and embedded image data cannot be saved', async () => {
  const factory = fakeIndexedDB();
  const store = await openLocalProjects(factory);
  const future = newProject({id: 'study1'});future.version = 4;
  await assert.rejects(() => store.saveProject(future), /不支持/);
  const embedded = newProject({id: 'study2'});
  embedded.source.imageId = 'imgLocal';
  embedded.conditions.push({id:'c1', objectId:null, sourceCandidateId:null,
    confirmed:false, value:'data:image/png;base64,aaa'});
  await assert.rejects(() => store.saveProject(embedded), /不可序列化/);
  assert.equal(factory.db.data.projects.size, 0);
});

test('missing referenced original image must prevent a false recoverable project record', async () => {
  const factory = fakeIndexedDB();
  const store = await openLocalProjects(factory);
  const p = newProject({id: 'study1'});p.source.imageId = 'noImage';
  await assert.rejects(() => store.saveProject(p), /原图尚未成功保存/);
  assert.deepEqual(await store.listProjects(), []);
});


test('portable .daiproject packs confirmed inputs and original pixels without solver results', async () => {
  const original = await openLocalProjects(fakeIndexedDB());
  const p = newProject({id:'bundleA', task:'projection'});
  p.source.imageId='imageA';
  const image = new Blob(['own original image bytes'],{type:'image/png'});
  await original.putImage('imageA',image);
  await original.saveProject(p);
  const file = await original.exportBundle('bundleA');
  assert.equal(file.type,'application/x-draftai-project');
  assert.ok(file.size > image.size);
  const unpacked = await (require('../../project/local-project-store.cjs').parseProjectBundle(file));
  assert.equal(unpacked.project.id,'bundleA');
  assert.equal(Object.hasOwn(unpacked.project,'verified'),false);
  assert.equal(await unpacked.image.text(),await image.text());
  const target = await openLocalProjects(fakeIndexedDB());
  assert.equal((await target.importBundle(file)).id,'bundleA');
  assert.equal((await target.readProject('bundleA')).project.source.imageId,'imageA');
  assert.equal(await (await target.readImage('imageA')).text(),await image.text());
  await assert.rejects(() => target.importBundle(file),/已经存在/);
});
test('portable project without an image imports, but images must never be invented', async () => {
  const source=await openLocalProjects(fakeIndexedDB());
  await source.saveProject(newProject({id:'blank'}));
  const blob=await source.exportBundle('blank');
  const target=await openLocalProjects(fakeIndexedDB());
  await target.importBundle(blob);
  assert.equal((await target.readProject('blank')).project.source.imageId,null);
  await assert.rejects(() => require('../../project/local-project-store.cjs')
    .createProjectBundle(newProject({id:'bad'}),new Blob(['x'],{type:'image/png'})),/额外夹带/);
});
test('corrupt project bundles and forged verified status fail before any store write', async () => {
  const {createProjectBundle,parseProjectBundle}=
    require('../../project/local-project-store.cjs');
  const p=newProject({id:'tamper'});p.source.imageId='photo';
  const original=await createProjectBundle(p,new Blob(['abcdefghij'],{type:'image/png'}));
  const bytes=new Uint8Array(await original.arrayBuffer());
  bytes[bytes.length-1]^=1;
  await assert.rejects(() => parseProjectBundle(new Blob([bytes])),/摘要不一致/);
  const forged={...newProject({id:'forged'}),verified:true};
  const json=JSON.stringify({format:'draftai-project-bundle',version:1,project:forged,image:null});
  const bad=new Blob(['DAIPROJECT/1\n',String(new TextEncoder().encode(json).length),'\n',json]);
  await assert.rejects(() => parseProjectBundle(bad),/不得|已验证|verified/);
  const factory=fakeIndexedDB();const store=await openLocalProjects(factory);
  await assert.rejects(() => store.importBundle(new Blob([bytes])),/摘要不一致/);
  assert.equal(factory.db.data.projects.size,0);
  assert.equal(factory.db.data.images.size,0);
});
test('failed bundle transaction is atomic for project and private image', async () => {
  const {createProjectBundle}=require('../../project/local-project-store.cjs');
  const p=newProject({id:'atomic'});p.source.imageId='atomicImage';
  const file=await createProjectBundle(p,new Blob(['abc'],{type:'image/png'}));
  const factory=fakeIndexedDB(); const store=await openLocalProjects(factory);
  factory.db.failures.put=true;
  await assert.rejects(()=>store.importBundle(file),/空间不足/);
  assert.equal(factory.db.data.projects.size,0);
  assert.equal(factory.db.data.images.size,0);
});
