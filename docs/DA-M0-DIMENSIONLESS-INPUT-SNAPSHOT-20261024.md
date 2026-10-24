# M0 dimensionless Jacobian input integrity (2026-10-24)

Real defect repaired in existing M0 normalization: `Array#map()` can skip sparse derivative coordinates and leave a missing Jacobian coefficient in the returned matrix; repeated getter-backed values could change between validation and mathematical use. Replace skip-prone validation and repeated reads with a dense, indexed, single-snapshot validation of every variable, constraint and derivative before normalization. No new solver.

Keep the exact existing `normalizeLocalSystem` schema, input units (mm/mm2/rad/deg/unitless), tolerances, residual logic and conservative `rankEstimate:null`, `solutionCount:null`, `globallyUnique:null` and lack of existence/global proof. Caller-defined formulas and scales remain unverified. This hardening is used by any existing or future generic M2/M3 consumer; it is not a claim of globally complete nonlinear constraints.

Positive tests cover 3D full-rank-looking identity without falsely certifying rank, source immutability and checked units. Adversarial tests cover sparse derivative holes and inherited numeric indices, mutable getters for scale, units, derivative, residual, and sparse whole rows. All existing M0 tests and exact HEAD five CI suites must pass. Rollback isolated squash. No V5 or production/config changes.
