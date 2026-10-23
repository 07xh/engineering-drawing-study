'use strict';
/* Single downloadable local project archive: versioned JSON manifest + raw image.
   Imported files never contain verified solver status or executable source. */
const {importProject, exportProject} = require('./project-coordinator.cjs');
const {ensureImage, MAX_IMAGE_BYTES} = require('./local-project-store.cjs');
const MAGIC = new TextEncoder().encode('DAIPRJ1\n');
const MAX_MANIFEST = 2 * 1024 * 1024;
const MAX_BUNDLE = MAGIC.length + 4 + MAX_MANIFEST + MAX_IMAGE_BYTES;
function packProject(project, image = null) {
  const safe = importProject(exportProject(project));
  if (safe.source.imageId !== null) {
    if (!image) throw new Error('项目包含原图引用，导出时必须附带原图');
    ensureImage(image);
  } else if (image !== null) throw new Error('项目未引用原图，拒绝额外打包未知文件');
  const manifest = new TextEncoder().encode(JSON.stringify({
    project: safe, image: image ? {type: image.type, size: image.size} : null
  }));
  if (manifest.byteLength > MAX_MANIFEST) throw new Error('项目条件过多，超出导出限制');
  const size = new Uint8Array(4);
  new DataView(size.buffer).setUint32(0, manifest.byteLength, true);
  return new Blob([MAGIC, size, manifest, ...(image ? [image] : [])],
    {type: 'application/octet-stream'});
}
async function unpackProject(file) {
  if (typeof Blob === 'undefined' || !(file instanceof Blob) ||
      file.size < MAGIC.length + 4 || file.size > MAX_BUNDLE)
    throw new Error('不是受支持的 DraftAI 项目文件，或体积超限');
  const header = new Uint8Array(await file.slice(0, MAGIC.length + 4).arrayBuffer());
  if (MAGIC.some((v, i) => header[i] !== v)) throw new Error('项目文件头无效');
  const length = new DataView(header.buffer).getUint32(MAGIC.length, true);
  if (!length || length > MAX_MANIFEST || MAGIC.length + 4 + length > file.size)
    throw new Error('项目索引长度不正确');
  const offset = MAGIC.length + 4 + length;
  let data;
  try {
    data = JSON.parse(new TextDecoder('utf-8', {fatal: true})
      .decode(await file.slice(MAGIC.length + 4, offset).arrayBuffer()));
  } catch { throw new Error('项目索引损坏或 UTF-8 格式错误'); }
  if (!data || typeof data !== 'object') throw new Error('项目索引不是对象');
  const project = importProject(JSON.stringify(data.project));
  const payload = data.image;
  if (project.source.imageId === null) {
    if (payload !== null || file.size !== offset) throw new Error('项目存在未声明的文件尾数据');
    return {project, image: null};
  }
  if (!payload || !['image/png', 'image/jpeg', 'image/webp'].includes(payload.type) ||
      !Number.isSafeInteger(payload.size) || payload.size < 1 ||
      payload.size > MAX_IMAGE_BYTES || file.size !== offset + payload.size)
    throw new Error('原图索引大小或类型不匹配');
  const image = file.slice(offset, file.size, payload.type);
  ensureImage(image);
  return {project, image};
}
module.exports = {MAGIC, packProject, unpackProject};
