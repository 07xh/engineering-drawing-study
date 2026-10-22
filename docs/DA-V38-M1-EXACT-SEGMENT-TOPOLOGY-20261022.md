# V3.8 M1 exact finite model-mm segment topology

Related to #340, #342, #343. Uses existing core/numeric/orientation2d-exact.cjs rather than creating another predicate. Distinguishes disjoint, endpoint-touch, proper-crossing, collinear-overlap and coincident finite segments, with explicit model-mm-2d/mm input and immutable evidence.

Proof domain: mathematical topology of already-rounded finite binary64 endpoints only. Does not validate source OCR/image coordinates, tolerance-based nearness, G1 tangency, exact proper-crossing intersection coordinates, global uniqueness, complete SolveResult, arbitrary arcs, V5, or production solver behavior. In particular, a small nonzero determinant may fall beneath an engineering tolerance; preserve independent residual-evidence policy. Do not infer globally unique solution from a crossing relation.

Parity/negative tests: 8 Node test cases including 256 deterministic reversal/swap properties, subnormal determinant, vertical and collinear overlap, zero-length and wrong-frame inputs. Local Node v22 completed 9/9 in the longer preflight suite; this committed subset is 8 tests, whose GitHub core-math run is authoritative. Existing specialized 02/04 solvers remain unchanged. No production consumer, workflows, secrets or Cloudflare updates.

Math risk: high-risk core geometry requires independent 00/09 signoff, latest-main comparison and CI exact-head success before merge. Revert isolated commit to roll back. Later M2/02 integration must compare against legacy solvers on crossing, overlap, degenerate and near-tolerance cases before enabling a consumer.
