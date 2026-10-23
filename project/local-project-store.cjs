'use strict';
/*
 * Private local persistence for DraftAI projects. No network, cloud or solver
 * results are stored here. Project JSON and original raster Blobs live in
 * separate IndexedDB stores; transactions determine actual save success.
 */
const {importProject, exportProject} = require('./project-coordinator.cjs');
const DB_NAME = 'draftai-local-projects';
const DB_VERSION = 1;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ID = /^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const isId = x => typeof x === 'string' && ID.test(x);
function reason(error) {
  if (error?.name === 'QuotaExceededError') return '本机存储空间不足，未保存成功；请导出项目备份';
  if (error?.name === 'SecurityError' || error?.name === 'NotAllowedError')
    return '当前浏览器禁止本地存储，请使用项目文件备份';
  return '本机项目存储失败：' + (error?.message || '请检查浏览器存储权限');
}
function ensureImage(blob) {
  if (typeof Blob === 'undefined' || !(blob instanceof Blob) ||
      !TYPES.has(blob.type) || blob.size === 0 || blob.size > MAX_IMAGE_BYTES)
    throw new Error('仅接受 25 MB 以内的 PNG/JPEG/WebP 原图');
}

const BUNDLE_MAGIC = 'DAIPROJECT/1\n';
const BUNDLE_FORMAT = 'draftai-project-bundle';
const MAX_HEADER_BYTES = 2 * 1024 * 1024;
const MAX_BUNDLE_BYTES = MAX_IMAGE_BYTES + MAX_HEADER_BYTES + 64;
const codec = () => new TextEncoder();
async function digestImage(blob) {
  const subtle = typeof globalThis !== 'undefined' && globalThis.crypto?.subtle;
  if (!subtle) throw new Error('本机缺少安全摘要能力，不能验证项目原图完整性');
  const hash = new Uint8Array(await subtle.digest('SHA-256', await blob.arrayBuffer()));
  return Array.from(hash, x => x.toString(16).padStart(2, '0')).join('');
}
async function createProjectBundle(project, image = null) {
  const safe = importProject(exportProject(project));
  if (safe.source.imageId === null && image !== null)
    throw new Error('未关联原图的项目不可额外夹带图片');
  if (safe.source.imageId !== null) ensureImage(image);
  const info = image === null ? null : {
    id: safe.source.imageId, type: image.type, size: image.size,
    sha256: await digestImage(image)
  };
  const header = codec().encode(JSON.stringify({
    format: BUNDLE_FORMAT, version: 1, project: safe, image: info
  }));
  if (header.byteLength > MAX_HEADER_BYTES) throw new Error('项目元数据过大');
  const pieces = [BUNDLE_MAGIC, String(header.byteLength), '\n', header];
  if (image !== null) pieces.push(image);
  const bundle = new Blob(pieces, {type: 'application/x-draftai-project'});
  if (bundle.size > MAX_BUNDLE_BYTES) throw new Error('项目包超出大小限制');
  return bundle;
}
async function parseProjectBundle(bundle) {
  if (typeof Blob === 'undefined' || !(bundle instanceof Blob) ||
      bundle.size > MAX_BUNDLE_BYTES || bundle.size < BUNDLE_MAGIC.length + 3)
    throw new Error('项目包大小或类型无效');
  const prefix = await bundle.slice(0, 64).text();
  const match = /^DAIPROJECT\/1\n([1-9]\d{0,6})\n/.exec(prefix);
  if (!match) throw new Error('不支持的项目包格式');
  const length = Number(match[1]);
  if (length > MAX_HEADER_BYTES || match[0].length + length > bundle.size)
    throw new Error('项目包元数据长度无效');
  const offset = match[0].length + length;
  let header;
  try {
    header = JSON.parse(new TextDecoder('utf-8', {fatal: true})
      .decode(await bundle.slice(match[0].length, offset).arrayBuffer()));
  } catch { throw new Error('项目包元数据损坏'); }
  if (!header || header.format !== BUNDLE_FORMAT || header.version !== 1)
    throw new Error('不支持的项目包版本');
  const project = importProject(JSON.stringify(header.project));
  if (header.image === null) {
    if (project.source.imageId !== null || offset !== bundle.size)
      throw new Error('项目包缺少原图或存在多余数据');
    return {project, image: null};
  }
  const meta = header.image;
  if (!meta || meta.id !== project.source.imageId ||
      !TYPES.has(meta.type) || !Number.isSafeInteger(meta.size) ||
      meta.size < 1 || meta.size > MAX_IMAGE_BYTES ||
      !/^[a-f0-9]{64}$/.test(meta.sha256) ||
      bundle.size - offset !== meta.size)
    throw new Error('项目原图 ID、格式、大小或摘要信息无效');
  const image = new Blob([bundle.slice(offset)], {type: meta.type});
  ensureImage(image);
  if (await digestImage(image) !== meta.sha256)
    throw new Error('项目原图摘要不一致，拒绝导入损坏图片');
  return {project, image};
}

function createStore(db) {
  if (!db || typeof db.transaction !== 'function') throw new Error('IndexedDB 未连接');
  function operation(names, mode, work) {
    return new Promise((resolve, reject) => {
      let tx, value, recordedError = null, settled = false;
      function settle(error, result) {
        if (settled) return;
        settled = true;
        if (error) reject(error); else resolve(result);
      }
      try { tx = db.transaction(names, mode); }
      catch (error) { settle(new Error(reason(error))); return; }
      tx.oncomplete = () => settle(null, value);
      tx.onabort = () => settle(recordedError || new Error(reason(tx.error)));
      tx.onerror = () => { /* tx.onabort carries the transaction's final error */ };
      const fail = error => {
        recordedError = error instanceof Error ? error : new Error(String(error));
        try { tx.abort(); } catch { settle(recordedError); }
      };
      try {
        work(name => tx.objectStore(name), result => {value = result;}, fail);
      } catch (error) { fail(error); }
    });
  }
  function readProject(id) {
    if (!isId(id)) return Promise.reject(new Error('项目 ID 无效'));
    return operation(['projects'], 'readonly', (store, done, fail) => {
      const req = store('projects').get(id);
      req.onsuccess = () => {
        if (!req.result) { done(null); return; }
        try {
          const project = importProject(JSON.stringify(req.result.project));
          done({...req.result, project});
        } catch (error) { fail(new Error('本机项目已损坏，拒绝恢复旧计算结果：' + error.message)); }
      };
    });
  }
  function listProjects() {
    return operation(['projects'], 'readonly', (store, done, fail) => {
      const req = store('projects').getAll();
      req.onsuccess = () => {
        try {
          const items = req.result.map(row => {
            const p = importProject(JSON.stringify(row.project));
            return {id: p.id, title: p.title, task: p.task, imageId: p.source.imageId,
              revision: p.revision, savedAt: row.savedAt};
          });
          done(items.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt))));
        } catch (error) { fail(new Error('本机项目索引存在损坏记录：' + error.message)); }
      };
    });
  }
  function saveProject(project) {
    // Synchronous validation precedes the transaction, avoiding corrupted records.
    let safe;
    try { safe = importProject(exportProject(project)); }
    catch (error) { return Promise.reject(error); }
    const record = {id: safe.id, savedAt: new Date().toISOString(), project: safe};
    return operation(['projects', 'images'], 'readwrite', (store, done, fail) => {
      const persist = () => {
        store('projects').put(record);
        done({id: safe.id, savedAt: record.savedAt});
      };
      if (safe.source.imageId === null) { persist(); return; }
      const image = store('images').get(safe.source.imageId);
      image.onsuccess = () => {
        if (!image.result) {
          fail(new Error('原图尚未成功保存，拒绝创建无法完整恢复的项目')); return;
        }
        try { ensureImage(image.result.blob); persist(); }
        catch (error) { fail(new Error('原图无法恢复：' + error.message)); }
      };
    });
  }
  function putImage(id, blob) {
    if (!isId(id)) return Promise.reject(new Error('图片 ID 无效'));
    try { ensureImage(blob); } catch (error) { return Promise.reject(error); }
    // Image IDs identify immutable originals. Overwriting the same ID would
    // silently change a reviewed project's source without changing revision,
    // leaving stale confirmed dimensions and V5 steps attached to new pixels.
    return operation(['images'], 'readwrite', (store, done, fail) => {
      const images = store('images');
      const existing = images.get(id);
      existing.onsuccess = () => {
        if (existing.result) {
          fail(new Error('原图 ID 已存在；请选择新 ID 并使旧项目审核失效'));
          return;
        }
        images.put({id, blob, type: blob.type, size: blob.size});
        done({id, type: blob.type, size: blob.size});
      };
    });
  }
  function readImage(id) {
    if (!isId(id)) return Promise.reject(new Error('图片 ID 无效'));
    return operation(['images'], 'readonly', (store, done, fail) => {
      const req = store('images').get(id);
      req.onsuccess = () => {
        if (!req.result) { done(null); return; }
        try {
          ensureImage(req.result.blob);
          if (req.result.type !== req.result.blob.type || req.result.size !== req.result.blob.size)
            throw new Error('图片存储元信息不一致');
          done(req.result.blob);
        } catch (error) { fail(new Error('本机原图已损坏：' + error.message)); }
      };
    });
  }
  function deleteProject(id) {
    if (!isId(id)) return Promise.reject(new Error('项目 ID 无效'));
    // One transaction protects image shared by multiple local projects.
    return operation(['projects', 'images'], 'readwrite', (store, done, fail) => {
      const projects = store('projects');
      const all = projects.getAll();
      all.onsuccess = () => {
        try {
          const rows = all.result;
          const row = rows.find(x => x.id === id);
          if (!row) { done(false); return; }
          const imageId = row.project?.source?.imageId;
          projects.delete(id);
          if (isId(imageId) && !rows.some(x => x.id !== id && x.project?.source?.imageId === imageId))
            store('images').delete(imageId);
          done(true);
        } catch (error) { fail(error); }
      };
    });
  }

  async function exportBundle(id) {
    const row = await readProject(id);
    if (!row) throw new Error('需要导出的本机项目不存在');
    const imageId = row.project.source.imageId;
    const image = imageId === null ? null : await readImage(imageId);
    if (imageId !== null && !image) throw new Error('项目原图丢失，拒绝不完整导出');
    return createProjectBundle(row.project, image);
  }
  async function importBundle(bundle) {
    // Validate the entire archive and its digest before opening a write tx.
    const {project, image} = await parseProjectBundle(bundle);
    const row = {id: project.id, savedAt: new Date().toISOString(), project};
    return operation(['projects','images'], 'readwrite', (store, done, fail) => {
      const prior = store('projects').get(project.id);
      prior.onsuccess = () => {
        if (prior.result) { fail(new Error('同 ID 项目已存在，拒绝覆盖本机记录')); return; }
        const finish = () => {
          if (image !== null) store('images').put({
            id: project.source.imageId, blob: image, type: image.type, size: image.size
          });
          store('projects').put(row);
          done({id: project.id, savedAt: row.savedAt});
        };
        if (image === null) {finish();return;}
        const existing = store('images').get(project.source.imageId);
        existing.onsuccess = () => {
          if (existing.result) {fail(new Error('图片 ID 已存在，拒绝覆盖其他项目原图'));return;}
          finish();
        };
      };
    });
  }
  return {readProject, listProjects, saveProject, putImage, readImage, deleteProject,
    exportBundle, importBundle,
    close() { db.close(); }};
}
function openLocalProjects(factory = typeof globalThis !== 'undefined' ? globalThis.indexedDB : null) {
  if (!factory || typeof factory.open !== 'function')
    return Promise.reject(new Error('当前环境不可使用 IndexedDB；可继续临时操作，勿声称已保存'));
  return new Promise((resolve, reject) => {
    let req, settled = false;
    const fail = error => {
      if (settled) return;
      settled = true;
      reject(new Error(reason(error)));
    };
    try { req = factory.open(DB_NAME, DB_VERSION); }
    catch (error) { fail(error); return; }
    req.onupgradeneeded = () => {
      try {
        const db = req.result;
        if (!db.objectStoreNames.contains('projects'))
          db.createObjectStore('projects', {keyPath: 'id'});
        if (!db.objectStoreNames.contains('images'))
          db.createObjectStore('images', {keyPath: 'id'});
      } catch (error) { fail(error); }
    };
    req.onerror = () => fail(req.error);
    req.onblocked = () => fail(new Error('旧页面仍占用本机项目数据库'));
    req.onsuccess = () => {
      if (settled) { req.result.close(); return; }
      settled = true;
      req.result.onversionchange = () => req.result.close();
      resolve(createStore(req.result));
    };
  });
}
module.exports = {DB_NAME, DB_VERSION, MAX_IMAGE_BYTES, ensureImage,
  openLocalProjects, createStore, createProjectBundle, parseProjectBundle};
