# M0/03 first-angle projection: single source snapshot and stable paper transform

Existing ONE `core/projection/conventions.js` defines true first-angle V/H/W model directions, explicit observer rays, and 45-degree sheet transfer; neither M0 nor M3 is permitted to substitute a separately sorted camera orientation or a second projection engine.

Prior to this change, `project`, `validateFirstAngleObserverRays`, `aligned`, `toSheet`, `fromSheet`, and `sheetPoint` validated caller-owned 2D/3D coordinates or transforms and **re-read the same getter-backed numeric source** when constructing the mathematical/sheet result. `sheetPoint` additionally read the original `point.y` again after V/H/W construction and called `config(transform)` anew for each sheet view, so different branches could consume different origin/scale values. These are dangerous data-integrity problems for "one XYZ → first-angle three views."

The existing projection contract now snapshots finite XYZ or UV, explicit V/H/W observer source references, as well as a single sheet origin/scale. All views and the M transfer point use the same copied numbers. Aligned model-mm view consistency keeps the original absolute tolerance (not relative to 1e12 coords). All existing first-angle signs and legacy sheet-coordinate formulas remain identical; malformed source or overflowing pixel conversion still fail closed.

Independent tests verify dynamic getters may emit Infinity, inverted ray signs, wildly changed sheet origin and negative scale on hypothetical subsequent reads, yet each real mathematical input is only read ONCE. Verify actual V/H/W and 45-degree M coordinates against explicit independent paper formulas, and that true 10mm V/H disagreement at x=1e12 is not hidden. No source-photo authenticity, unique M3 solve, full contour, official CAD line style or ConstructionIntent→DAG→V5 certification is implied by projection correctness. This change does not touch numerical solvers, math proof flags, or Cloudflare deployment.

Follow #152: FIVE exact final PR HEAD workflows completed/success, all four workbench shards+stable aggregate success and mergeable=true before squash.
