# 02-A — planar tangency foundation (independent internal API)

**Implementation status:** stage 02-A only; **not** the frozen `DA-GEOM-CONTRACT-v1`, not integrated with a player or the production site.

## Inputs and coordinate policy

`externalLineCircleFillets({ line, circle, filletRadius, side, epsilon })`

- `line = { a:{x,y}, b:{x,y} }`: **infinite** mathematical line defined by distinct endpoints, not a finite segment.
- `circle = { center:{x,y}, radius:R }` with `R > 0`.
- `filletRadius = r > 0`.
- `side = +1 | -1`: signed relative to the normal `(-dy,dx)/length` of the directed input line; reversing endpoint order reverses the sign.
- All `x/y/r` values must be finite JavaScript numbers in **one shared mathematical unit**, such as mm. No SVG pixels or image coordinates. Tolerance defaults to `1e-9` in a scale-relative check.

## Exact geometry used

Let `t` be the unit tangent of the line, `n` its left unit normal, and `P` a point on the line. The fillet center `Q` satisfies both

- `dot(Q-P,n) = side*r` (signed offset locus);
- `||Q-C|| = R+r` (external tangency to the known circle).

Project `C` onto the offset line to obtain `F`, let `d=||C-F||`, `D=R+r`. If `d>D`, no solution exists. If `d=D`, one center exists at `F`. If `d<D`, two centers exist: `Q = F ± t*sqrt((D-d)(D+d))`. The tolerance interval around the tangent case is handled explicitly.

For each center:

- Line touchpoint: `T_line = Q - side*r*n`.
- Known-circle touchpoint: `T_circle = C + (Q-C)*R/(R+r)`.

The return value **enumerates all candidate centers** and supplies independent residuals for the signed offset, center distance, both radii and line contact. It never silently picks one of the two branches. `status=unique` means unique **under the stated fixed line, chosen side, external tangency assumptions only**; it is not a claim of a globally unique textbook solution or finite-arc orientation.

## Test matrix / boundaries

`tests/planar/offset-tangency.test.cjs` covers 20 tests: two centers, exact and near tangency, separation with no solution, invalid/missing inputs, signed normals, diagonal line, negative side, zero/tiny line, radius validation, residuals, input immutability, translation, scaling and reversed line orientation.

Standalone Node 22 command:

```sh
node --test tests/planar/offset-tangency.test.cjs
```

The legacy `.github/workflows/check.yml` does **not** yet execute this newly introduced test path; integration of a stable always-running math job requires an explicit 00 workflow file lock and a separate PR. Do not confuse existing site CI success with the new independent math test results.

## 02-B / 02-C / 07 future boundary

- 02-B will introduce line-line, line-circle **internal** tangency, circle-circle fillets and branch conventions *after* the shared contract is frozen.
- 02-C will validate finite segments, arc intervals, clockwise/counterclockwise orientation, true G1 continuous joins, near-singular cases and units.
- 07 will only render a confirmed `SolveResult/ConstructionStep` adapter **after** mathematical and schema review.

This module does not contain, reproduce or infer any copyrighted textbook exercise, original publisher diagram or unverified exercise answer. It is not included in the public `dist` static publishing allowlist.
