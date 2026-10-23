'use strict';
/**
 * Auditable SHA-256 inventory for a DraftAI public build. Read only.
 * Callers must bind sourceSha to a trusted GitHub commit; a self-generated
 * manifest is never, by itself, proof of a trusted publication.
 */
const fs = require('node:fs');
const path = require('node:path');
const {createHash, timingSafeEqual} = require('node:crypto');
const {auditPublicDist} = require('./audit-public-dist.cjs');
const SCHEMA = 'draftai-public-artifact-sha256-v1';
const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^[0-9a-f]{64}$/;
const MAX_FILE_BYTES = 16 * 1024 * 1024;
const MAX_TOTAL_BYTES = 64 * 1024 * 1024;
// Intentionally narrow high-confidence signatures, not a substitute for
// credential review, static-code audit or a dedicated secrets scanner.
const SECRET_MARKERS = Object.freeze([
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i,
  /\bgh(?:p|o|u|s|r)_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\b(?:sk|rk)-[A-Za-z0-9_-]{24,}\b/,
  /\b(?:CF_API_TOKEN|CLOUDFLARE_API_TOKEN)\s*[:=]\s*["'][^"'\r\n]{8,}["']/i
]);
function digest(data) { return createHash('sha256').update(data).digest('hex'); }
function canonicalBody(sourceSha,assets) { return {schema:SCHEMA,sourceSha,assets}; }
function buildArtifactManifest({root,sourceSha}={}) {
  if (!SHA.test(sourceSha || '')) throw Error('trusted full source SHA is required');
  if (typeof root !== 'string' || !root.trim()) throw Error('public dist directory missing');
  const report = auditPublicDist(root);
  if (!report.ok) throw Error('public dist inventory failed: '+report.errors.join('; '));
  const base = fs.realpathSync(root);
  let total=0;
  const assets=[];
  for (const relative of report.files) {
    const full = path.join(base,relative);
    const real = fs.realpathSync(full);
    if (!real.startsWith(base + path.sep) || real !== full)
      throw Error('public asset outside audited directory');
    const stat=fs.lstatSync(real);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size>MAX_FILE_BYTES)
      throw Error('unexpected public asset type or size: '+relative);
    total+=stat.size;
    if (total>MAX_TOTAL_BYTES) throw Error('public dist exceeds allowed total size');
    const bytes=fs.readFileSync(real);
    if (bytes.length!==stat.size) throw Error('public asset changed during audit: '+relative);
    const contents=bytes.toString('utf8');
    if (SECRET_MARKERS.some(pattern=>pattern.test(contents)))
      throw Error('potential secret material in public asset: '+relative);
    assets.push({path:relative,bytes:bytes.length,sha256:digest(bytes)});
  }
  assets.sort((a,b)=>a.path<b.path?-1:(a.path>b.path?1:0));
  const body=canonicalBody(sourceSha,assets);
  return {...body,digest:digest(JSON.stringify(body))};
}
function verifyArtifactManifest({root,sourceSha,expected}={}) {
  if (!expected || typeof expected!=='object' || Array.isArray(expected) ||
      expected.schema!==SCHEMA || expected.sourceSha!==sourceSha ||
      !DIGEST.test(expected.digest||'') || !Array.isArray(expected.assets))
    return {ok:false,reason:'invalid or mismatched trusted manifest'};
  let actual;
  try { actual=buildArtifactManifest({root,sourceSha}); }
  catch (error) { return {ok:false,reason:String(error.message||'artifact audit failed')}; }
  const equal=timingSafeEqual(Buffer.from(actual.digest,'hex'),Buffer.from(expected.digest,'hex'));
  if (!equal || JSON.stringify(actual.assets)!==JSON.stringify(expected.assets))
    return {ok:false,reason:'public build does not match trusted SHA-256 artifact manifest'};
  return {ok:true,sourceSha,files:actual.assets.length,digest:actual.digest};
}
module.exports={SCHEMA,buildArtifactManifest,verifyArtifactManifest};
