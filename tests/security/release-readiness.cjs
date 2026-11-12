'use strict';
const {verifyPullRequestDiff}=require('./verify-pr-diff.cjs');
/**
 * Read-only, fail-closed eligibility classifier for DA-09.
 * IMPORTANT: This function does not query GitHub, approve a PR, merge or deploy.
 * The future trusted CI controller must fetch its evidence independently.
 */
const REPOSITORY = '07xh/engineering-drawing-study';
const TARGET_BRANCH = 'main';
const SHA = /^[0-9a-f]{40}$/;
const VERSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Deliberately very narrow. Expanded paths require 00 + 09 review and tests.
const LOW_RISK_FILES = Object.freeze(['site-ui.css']);
// These check names are a design contract, NOT asserted to exist today.
const REQUIRED_CHECKS = Object.freeze([
  'validate', 'core-math', 'static-assets', 'secret-scan', 'preview-smoke'
]);
function validPath(p) {
  return typeof p === 'string' && p.length > 0 && p.length <= 500 &&
    !p.startsWith('/') && !p.includes('\\') && !p.includes('\u0000') &&
    p.split('/').every(part => part && part !== '.' && part !== '..');
}
function evaluateReleaseReadiness(context) {
  const blocked = [];
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return {eligible: false, status: 'blocked', reasons: ['release context missing']};
  }
  if (context.repository !== REPOSITORY || context.targetBranch !== TARGET_BRANCH)
    blocked.push('repository/target branch is not the verified production target');
  if (!SHA.test(context.headSha || '') || !SHA.test(context.artifactSha || '') ||
      context.headSha !== context.artifactSha)
    blocked.push('PR head and tested release artifact must have the same valid SHA');
  if (context.draft !== false || context.mergeConflicts !== false)
    blocked.push('draft or conflicting PR cannot auto-release');
  if (!Array.isArray(context.changedFiles) || context.changedFiles.length === 0 ||
      !context.changedFiles.every(validPath) ||
      new Set(context.changedFiles).size !== context.changedFiles.length) {
    blocked.push('changed file list must be a nonempty, unique set of safe relative paths');
  } else {
    const risky = context.changedFiles.filter(file => !LOW_RISK_FILES.includes(file));
    if (risky.length) blocked.push('unapproved change paths require human governance: ' + risky.join(', '));
  }
  if (context.mainProtected !== true || context.noAdminBypass !== true)
    blocked.push('protected main with no unreviewed bypass is required');
  if (context.productionBuildUploadsOnly !== true)
    blocked.push('Cloudflare production must be isolated from automatic activation');
  if (!VERSION_ID.test(context.previousActiveVersionId || ''))
    blocked.push('verified previous active Worker version is required for rollback');
  if (context.verifiedPreview !== true || context.privateRoutesDenied !== true)
    blocked.push('verified preview and sensitive-path denial are required');
  if (context.metadataFromTrustedApi !== true)
    blocked.push('CI must fetch PR, checks, SHA and deployment evidence from trusted APIs');
  // Only accept an exact, complete PR diff bound to the same tested commit.
  // Snapshot authenticity itself must be established by a privileged reader.
  const diff=verifyPullRequestDiff(context.diffEvidence);
  const reviewed=Array.isArray(context.changedFiles)?context.changedFiles:[];
  if(!diff.eligible || context.diffEvidence?.pullRequest?.head?.sha!==context.headSha ||
     diff.approvedFiles.length!==reviewed.length ||
     !reviewed.every(file=>diff.approvedFiles.includes(file)))
    blocked.push('unverified PR diff or incomplete changed-file provenance');
  const checks = Array.isArray(context.checks) ? context.checks : [];
  for (const name of REQUIRED_CHECKS) {
    const matches = checks.filter(c => c && c.name === name);
    if (matches.length !== 1 || matches[0].sha !== context.headSha ||
      matches[0].status !== 'completed' || matches[0].conclusion !== 'success')
      blocked.push('missing, duplicate, stale, or failing required check: ' + name);
  }
  return {
    eligible: blocked.length === 0,
    status: blocked.length ? 'blocked' : 'eligible-for-external-release-controller',
    reasons: blocked
  };
}
module.exports = {REPOSITORY,TARGET_BRANCH,LOW_RISK_FILES,REQUIRED_CHECKS,validPath,evaluateReleaseReadiness};
