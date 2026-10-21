# DA-09-REL-AUTO-001 — conditional automatic release gate

**Status: PROPOSED ONLY. Production activation is not enabled.**
Owner: 09 (safety/QA). Governance and shared-file lock: 00.
Baseline main (2026-10-21): 55625e46efe933fb3c5a8a918a9bd32c5451c423.

## User goal and safety boundary

The user prefers **automatic approval and formal publication of routine, verified updates**, rather than personally clicking Deploy on each release. That does **not** mean unconditionally accepting AI-written code or releasing new, mathematically unverified solvers.

Cloudflare Workers separates **uploading an inactive version** (command: npx wrangler versions upload) from **activating a version** (command family: npx wrangler versions deploy). A future trusted release controller should activate a specific, immutable, tested Worker Version ID only after policy and CI checks pass; record the previous active version for rollback. Never give production deployment credentials to untrusted pull-request workflows or fork code.

## Stage 1: read-only policy and tests in this PR

- tests/security/release-readiness.cjs is a pure eligibility classifier. It **does not** fetch GitHub evidence, approve/merge PRs, deploy to Cloudflare, or control settings.
- tests/security/release-readiness.test.cjs contains 10 node:test cases including stale SHAs, missing/failed/pending checks, path traversal, high-risk diffs, absence of protected main, deployment isolation and rollback evidence.
- The initial low-risk change allowlist contains only site-ui.css. Every other file is **blocked** for automated release; this is a deliberately narrow starting point. CSS is not intrinsically trusted or guaranteed harmless: independent content/security checks remain mandatory.
- A positive *synthetic test fixture* means only that the decision logic accepts sufficient **asserted** evidence. It is not proof that the current GitHub or Cloudflare setup meets the policy.

Run independently with Node 22, no dependencies:

    node --test tests/security/release-readiness.test.cjs

### Eligibility requirements

A future controller must independently verify every item:
1. Repository is 07xh/engineering-drawing-study, target is main, PR is not draft and has no conflicts.
2. Tested artifact is bound to the exact full 40-character PR HEAD SHA; no mutable tags or unrelated SHA.
3. Every changed path is on the approved low-risk allowlist.
4. GitHub main has enforceable PR protections, no bypass and no direct unreviewed pushes.
5. The linked Cloudflare production branch is upload-only, not direct production activation.
6. Previous active Worker Version ID is known and rollback viability was exercised.
7. Preview was verified and private-resource URLs were denied.
8. All checks succeeded **for the same SHA**, each exactly once: validate, core-math, static-assets, secret-scan, preview-smoke.
9. PR metadata/check results/build Version ID are obtained independently via trusted GitHub/Cloudflare APIs, not supplied by the PR author.

**The five named checks are FUTURE CONTRACTS, not claims that the jobs currently exist.** The release-readiness function accepts evidence as input and therefore **must not** be used alone as an authorization token or a privileged deployment step.

## Stage 2: 00/09 must independently implement and validate

1. Set main branch protection/Rulesets: PR-only, no force push, no uncontrolled bypass, stable required checks. Existing core-math workflow on PR #144 is path-filtered; a path-filtered required check may remain Pending on unrelated PRs. Resolve this through authorized shared workflow modifications.
2. Verify the **saved** Cloudflare Settings → Build production command is upload-only (not merely typed into the form). Record current active version ID, Git SHA, deployed domain and previous configuration.
3. Implement stable required CI, actual static allowlist checks, secrets/privacy checks, test results tied to the exact artifact, and independent preview smoke checks.
4. Build a separately privileged release controller. It must fetch trusted evidence, serialize concurrent releases, promote only the tested immutable Worker Version ID and log who/what/when. Never run elevated cloud credentials on untrusted PR code.
5. Confirm post-deployment HTTP checks (public routes function; private paths return 404), and implement a tested rollback to the previous version. KV/R2/D1 state changes are not reverted by Worker code rollback.
6. Perform one controlled dress rehearsal and 00+09 signoff. Thereafter only eligible low-risk changes may auto-approve and auto-release; risky/failed/uncertain changes must stop and notify the project owner.

The first PR deliberately does **not** change .github/workflows, scripts/build-static.cjs, package.json, wrangler.jsonc, the production Worker, main, any math solver, or GitHub/Cloudflare settings. Any future shared-file modification needs a 00-approved lock and a separate audited PR.

## Verified current blockers

- main: protected=false; no repository rulesets.
- Cloudflare UI showed repository 07xh/engineering-drawing-study and production branch main; original deployment command was npx wrangler deploy. User showed an edited field npx wrangler versions upload, but its **saved state and current active production version are not confirmed**.
- Cloudflare's UI displayed a GitHub organization/user-details retrieval warning; integration health still requires verification.
- PR #144 (core math) is not merged or contract-frozen. 03 has flagged unresolved unknown-point declarations and solver-vs-alignment tolerance compatibility; a passing math CI does not solve those gaps.
- Independent production smoke tests, private resource 404 evidence, version-to-commit mapping, and rehearsed rollback are still outstanding.

Tracking: Issues #143, #152, #153; PR #144.
Cloudflare command source: https://developers.cloudflare.com/workers/wrangler/commands/workers/


## Stage 1B: actual packaged-file audit (implemented in the same draft PR)

- tests/security/audit-public-dist.cjs audits the **actual directory tree** produced by scripts/build-static.cjs; it requires exactly 39 audited static files and the generated labs/dof-lab-three-bundle.js (40 total). Unexpected files, private source directories, required-file omissions and symlinks fail closed.
- tests/security/audit-public-dist.test.cjs supplies eight additional positive/negative scenarios including unexpected knowledge/index.html and labs/verified-exercises.js.
- The reviewed 39-entry list was mechanically compared against the current main build script (main SHA 55625e46efe933fb3c5a8a918a9bd32c5451c423). No mismatch: 39 static files + 1 JS bundle = 40 expected files.
- Local isolated Node.js v22 run: node --test tests/security/*.test.cjs — **18/18 tests passed, 0 failed** (10 readiness cases and 8 artifact cases).
- After a real repository build, use: node tests/security/audit-public-dist.cjs dist. This checks the emitted directory tree and exits nonzero for mismatches. **It has not yet been added to existing GitHub Actions or run against the real dist from GitHub in this PR.**
- An exact path allowlist cannot detect unsafe JavaScript or sensitive strings inside an otherwise approved file. Static links, leak/secret scans, runtime 404, provenance review and production preview are additional independent required gates.

### 00/09 approval required for new CI integration

The current .github/workflows/check.yml is shared and its modification needs 00 approval / file lock. Do **not** silently change it as part of this isolated 09 branch. A later separate authorized workflow PR should invoke both commands:

    node --test tests/security/*.test.cjs
    node tests/security/audit-public-dist.cjs dist

Run the artifact command **after** node scripts/build-static.cjs, not before. Preserve the existing 09/00 production stop until Cloudflare upload-only configuration is confirmed saved, main is protected, and mathematical compatibility issues are closed.
