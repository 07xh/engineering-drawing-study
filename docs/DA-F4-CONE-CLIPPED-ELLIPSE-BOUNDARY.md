# DraftAI 04: clipped conical ellipse / base cap chord proof (Draft)

Stacked on PR #405 and governed by #372, #152 and #346. Reuses the original cone validator, shared M0 kernel and V/H/W projection. Does not create a second geometry core, versioned Intent or V5 player.

For a finite upright cone with radius R, height H and apex A, plane point Q and unit normal n, the full lateral conic has analytic polar radius rho(t)=d/(s-nx*cos(t)-ny*sin(t)), where d=(A-Q) dot n and s=nz*H/R. In the strict ellipse case |s|>m=hypot(nx,ny), the global radial interval is [|d|/(|s|+m),|d|/(|s|-m)].

For lower < R < upper (with numeric margins), clipping to 0<rho<=R is a single analytic circular-parameter arc. With u=sign(s), phi=atan2(u*ny,u*nx), limit=(|s|-|d|/R)/m, its exact interval is from phi+acos(limit) to phi+2*pi-acos(limit). Plane intersection with the BASE DISK boundary is recomputed independently as a straight chord using 2D signed line-circle intersection. Both cap endpoints must match the two analytic lateral-arc endpoints (either pairing), pass independent plane/cone residuals, and define a degree-two closed loop; midpoint must lie inside the finite base disk. Samples are visualization points only.

Excluded: filled section area, depth-based visibility, other conic regimes and general three-dimensional V5/Intent. Cap tangency, apex cut, disjoint and numerically unstable inputs reject positive proof. Complete ellipse is handled by unchanged conePlaneFullEllipse. The real model-mm source and first-angle project() convention remain intact. Rollback is to revert the isolated incremental commit.

Required release sequence stays #394 -> #395 -> #396 -> #397, then review #405 and this extension separately with 00/09 evidence and latest HEAD CI.
