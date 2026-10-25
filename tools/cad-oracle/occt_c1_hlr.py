#!/usr/bin/env python3
"""Offline OCCT B-Rep HLR cross-check for reviewed DraftAI C1 projected hulls.

Read-only synthetic source geometry + independently produced unsigned M5
contour sides. Output is an isolated oracle report, NEVER a SolveResult,
ConstructionIntent, line-style certificate, generated answer, or V5 action.
Requires separately installed cadquery + cadquery-ocp; neither enters web CI
dependencies nor production JS bundles.
"""
import argparse
import hashlib
import importlib.metadata
import json
import math
import sys
import time
from pathlib import Path

# OCCT projector points INTO the object, opposite DraftAI model->observer.
# Local OCCT projection axes are (paper u, -paper v) in all three views.
FRAMES = {
    "V": ((0, 1, 0), (1, 0, 0)),
    "H": ((0, 0, -1), (1, 0, 0)),
    "W": ((-1, 0, 0), (0, 1, 0)),
}


def reject(message):
    raise ValueError(message)


def xyz(p):
    if not isinstance(p, dict) or set(p) != {"x", "y", "z"}:
        reject("3D source coordinate must be exactly x,y,z")
    out = tuple(p[k] for k in ("x", "y", "z"))
    if any(type(x) not in (int, float) or not math.isfinite(x) or abs(x) > 1e6 for x in out):
        reject("bounded finite model-mm source coordinates required")
    return out


def validate(case):
    if not isinstance(case, dict) or set(case) != {"id", "geometry", "reference"}:
        reject("explicit CAD comparison case fields required")
    g = case["geometry"]
    if not isinstance(g, dict) or g.get("id") != case["id"] or (
        g.get("kind"), g.get("space"), g.get("unit")
    ) != ("mesh", "model-3d", "mm"):
        reject("reviewed finite 3D mesh in millimetres required")
    data = g.get("data", {})
    points, edges, faces = data.get("points"), data.get("edges"), data.get("faces")
    if not isinstance(points, dict) or not (4 <= len(points) <= 128) or (
        not isinstance(edges, list) or not 6 <= len(edges) <= 256
    ) or not isinstance(faces, list) or not 4 <= len(faces) <= 64:
        reject("bounded closed mesh sources required")
    for p in points.values():
        xyz(p)
    if not all(isinstance(f, list) and 3 <= len(f) <= 64 and
               len(set(f)) == len(f) and
               all(isinstance(i, str) and i in points for i in f) for f in faces):
        reject("invalid source face ring")
    original = []
    for e in edges:
        if not isinstance(e, list) or len(e) != 2 or e[0] == e[1] or (
            not all(isinstance(i, str) and i in points for i in e)
        ):
            reject("invalid source mesh edge")
        original.append(tuple(sorted(e)))
    face_edges = [tuple(sorted((f[i], f[(i + 1) % len(f)])))
                  for f in faces for i in range(len(f))]
    if len(set(original)) != len(edges) or set(original) != set(face_edges) or (
        any(face_edges.count(e) != 2 for e in original) or
        len(points) - len(edges) + len(faces) != 2
    ):
        reject("nonmanifold/open/duplicated source mesh cannot be a CAD oracle")
    reference = case["reference"]
    if not isinstance(reference, dict) or set(reference) != set(FRAMES):
        reject("must provide all three first-angle unsigned reference views")
    for row in reference.values():
        if not isinstance(row, dict) or set(row) != {
            "boundarySides", "completePhysicalSourceCoverageVerified"
        } or row["completePhysicalSourceCoverageVerified"] is not True:
            reject("unsigned complete original 2D hull source coverage required")
        sides = row["boundarySides"]
        if not isinstance(sides, list) or not 3 <= len(sides) <= 128:
            reject("bounded finite projected boundary sides required")
        for side in sides:
            if not isinstance(side, dict) or set(side) != {"from", "to"}:
                reject("explicit projected segment endpoints required")
            for p in (side["from"], side["to"]):
                if not isinstance(p, dict) or set(p) != {"u", "v"} or any(
                    type(p[k]) not in (int, float) or not math.isfinite(p[k])
                    for k in ("u", "v")
                ):
                    reject("finite 2D projected endpoints required")
        for i, side in enumerate(sides):
            nxt = sides[(i + 1) % len(sides)]
            a, b = side["to"], nxt["from"]
            if math.dist((a["u"], a["v"]), (b["u"], b["v"])) > 1e-8:
                reject("C1 hull paper endpoints are not joined")
    return data


def build_occt_solid(data):
    import cadquery as cq
    points = data["points"]
    faces = [cq.Face.makeFromWires(cq.Wire.makePolygon(
        [cq.Vector(*xyz(points[k])) for k in ring], close=True))
        for ring in data["faces"]]
    solid = cq.Solid.makeSolid(cq.Shell.makeShell(faces))
    if not solid.isValid() or not math.isfinite(solid.Volume()) or solid.Volume() <= 1e-8:
        reject("OCCT B-Rep topology or closed positive volume rejected")
    return solid


def extract_occt_visible_hlr(shape, view):
    from OCP.HLRBRep import HLRBRep_Algo, HLRBRep_HLRToShape
    from OCP.HLRAlgo import HLRAlgo_Projector
    from OCP.gp import gp_Ax2, gp_Pnt, gp_Dir
    from OCP.TopExp import TopExp_Explorer
    from OCP.TopAbs import TopAbs_EDGE, TopAbs_VERTEX
    from OCP.BRep import BRep_Tool
    from OCP.TopoDS import TopoDS
    camera, xdir = FRAMES[view]
    algo = HLRBRep_Algo()
    algo.Add(shape.wrapped)
    algo.Projector(HLRAlgo_Projector(
        gp_Ax2(gp_Pnt(0, 0, 0), gp_Dir(*camera), gp_Dir(*xdir))))
    algo.Update()
    algo.Hide()
    output = HLRBRep_HLRToShape(algo).VCompound()
    explorer = TopExp_Explorer(output, TopAbs_EDGE)
    strokes = []
    while explorer.More():
        verts = TopExp_Explorer(TopoDS.Edge_s(explorer.Current()), TopAbs_VERTEX)
        pts = []
        while verts.More():
            p = BRep_Tool.Pnt_s(TopoDS.Vertex_s(verts.Current()))
            pts.append((p.X(), -p.Y()))
            verts.Next()
        if len(pts) != 2:
            reject("OCCT projected HLR edge not bounded by two vertices")
        if math.dist(pts[0], pts[1]) > 1e-9:
            strokes.append(pts)
        explorer.Next()
    if not strokes:
        reject("OCCT generated no visible HLR source strokes")
    return strokes


def hull(points):
    # Independent hull of OCCT's VISIBLE B-Rep HLR results. OCCT's
    # binary-float projected split vertices can differ by ~1e-15 even
    # at a shared 3D location. Coalesce only at strict 1e-9 mm.
    raw = sorted(set(points))
    unique = []
    for p in raw:
        if not any(math.dist(p, q) <= 1e-9 for q in unique):
            unique.append(p)
    if len(unique) < 3:
        reject("CAD HLR has no area-bearing visible contour")
    def cross(a, b, c):
        return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
    def half(seq):
        out = []
        for p in seq:
            while len(out) >= 2 and cross(out[-2], out[-1], p) <= 0:
                out.pop()
            out.append(p)
        return out
    return half(unique)[:-1] + half(list(reversed(unique)))[:-1]


def area(poly):
    return abs(sum(p[0]*q[1]-p[1]*q[0] for p, q in
                   zip(poly, poly[1:]+poly[:1])) / 2)


def largest_uncovered_fraction(a, b, strokes, tolerance):
    du, dv = b[0]-a[0], b[1]-a[1]
    squared = du*du+dv*dv
    length = math.sqrt(squared)
    if length <= tolerance:
        reject("degenerate source contour side")
    spans = []
    for p, q in strokes:
        if abs(du*(p[1]-a[1])-dv*(p[0]-a[0])) > tolerance*length or (
            abs(du*(q[1]-a[1])-dv*(q[0]-a[0])) > tolerance*length
        ):
            continue
        t = lambda x: ((x[0]-a[0])*du+(x[1]-a[1])*dv)/squared
        lo, hi = sorted((t(p), t(q)))
        lo, hi = max(0, lo), min(1, hi)
        if hi > lo:
            spans.append((lo, hi))
    spans.sort()
    covered = 0.0
    gap = 0.0
    for lo, hi in spans:
        if lo > covered:
            gap = max(gap, lo-covered)
        covered = max(covered, hi)
    return max(gap, 1-covered)


def cross_check(case, tolerance=1e-6):
    data = validate(case)
    solid = build_occt_solid(data)
    answer = {"id":case["id"], "occtBRepValid":True,
              "occtVolumeMm3":solid.Volume(), "views":{}}
    for view in FRAMES:
        strokes = extract_occt_visible_hlr(solid, view)
        observed = hull([p for edge in strokes for p in edge])
        ref = case["reference"][view]["boundarySides"]
        expected_poly = [(s["from"]["u"], s["from"]["v"]) for s in ref]
        expected_hull = hull(expected_poly)
        expected_area, measured_area = area(expected_poly), area(observed)
        vertex_agree = len(observed) == len(expected_hull) and all(
            any(math.dist(p, q) <= tolerance for q in observed)
            for p in expected_hull)
        area_agree = abs(measured_area-expected_area) <= (
            tolerance * max(1, math.sqrt(expected_area)))
        gap = max(largest_uncovered_fraction(
            (s["from"]["u"], s["from"]["v"]),
            (s["to"]["u"], s["to"]["v"]), strokes, tolerance
        ) for s in ref)
        coverage_agree = gap <= tolerance
        answer["views"][view] = {
            "occtVisibleHLREdgeCount":len(strokes),
            "occtProjectedHullAreaMm2":measured_area,
            "currentM5HullAreaMm2":expected_area,
            "maxSourceSideUncoveredFraction":gap,
            "hullVerticesAgreement":vertex_agree,
            "hullAreasAgreement":area_agree,
            "occtVisibleHLRCoversWholeM5Hull":coverage_agree,
        }
        if not all((vertex_agree, area_agree, coverage_agree)):
            reject(f"{case['id']} {view}: OCCT HLR disagrees with DraftAI C1 contour")
    return answer


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True,
                        help="sanitized source+unsigned C1 M5 reference file")
    parser.add_argument("--out", help="optional JSON oracle report")
    args = parser.parse_args()
    raw = Path(args.input).read_bytes()
    packet = json.loads(raw)
    if not isinstance(packet, dict) or packet.get("schema") != (
        "draftai-c1-occt-offline-cases/1"
    ) or not isinstance(packet.get("cases"), list) or (
        not 1 <= len(packet["cases"]) <= 32
    ):
        reject("bounded, versioned independent C1 CAD corpus required")
    started = time.perf_counter()
    cases = [cross_check(c) for c in packet["cases"]]
    report = {
        "schema":"draftai-c1-occt-hlr-comparison/1",
        "inputSha256":hashlib.sha256(raw).hexdigest(),
        "localOnly":True, "notASolver":True,
        "notAnOfficialLineStyleCertificate":True,
        "notAV5ReleaseGate":True,
        "engine":"Open CASCADE Technology via CadQuery OCP",
        "versions":{p:importlib.metadata.version(p) for p in
                    ("cadquery", "cadquery-ocp")},
        "runtimeSeconds":round(time.perf_counter()-started, 6),
        "cases":cases,
    }
    encoded = json.dumps(report, sort_keys=True, indent=2)
    if args.out:
        Path(args.out).write_text(encoded+"\n", encoding="utf-8")
    print(encoded)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, TypeError, KeyError) as error:
        print("OCCT independent C1 oracle REFUSED:", error, file=sys.stderr)
        sys.exit(2)
