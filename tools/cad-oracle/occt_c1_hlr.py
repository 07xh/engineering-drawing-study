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

# HLRAlgo_Projector's axis direction is the observer direction. Reversing
# it preserves a convex 2D silhouette but swaps visible/hidden source edges.
# Match core/projection/conventions.js FIRST_ANGLE_OBSERVER_RAYS exactly.
# These Ax2 frames flatten directly to (paper u, paper v).
FRAMES = {
    "V": ((0, -1, 0), (1, 0, 0)),
    "H": ((0, 0, 1), (1, 0, 0)),
    "W": ((1, 0, 0), (0, 1, 0)),
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
    required = {"id", "geometry", "reference"}
    if not isinstance(case, dict) or set(case) not in (
        required, required | {"signedVisibleContourActions"}
    ):
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
    # Read-only checks of real already-signed C1 original V5 actions.
    # They are not input to either the CAD algorithm or DraftAI's M3/M5.
    actions = case.get("signedVisibleContourActions", [])
    if not isinstance(actions, list) or len(actions) > 128 or (
        "signedVisibleContourActions" in case and not actions
    ):
        reject("bounded nonempty signed V5 contour comparison required")
    real_edges = {
        g["id"] + "::" + "|".join(sorted(edge)): edge for edge in edges
    }
    seen = set()
    def paper(p, view):
        if view == "V":
            return (p["x"], p["z"])
        if view == "H":
            return (p["x"], p["y"])
        return (p["y"], p["z"])
    for row in actions:
        if not isinstance(row, dict) or set(row) != {
            "actionId", "view", "sourceEdgeId", "from", "to"
        } or not isinstance(row["actionId"], str) or (
            not row["actionId"].startswith("c1_hull_action_")
        ) or row["actionId"] in seen or row["view"] not in FRAMES or (
            row["sourceEdgeId"] not in real_edges
        ):
            reject("authentic unique C1 source-bound V5 line action required")
        seen.add(row["actionId"])
        points2 = []
        for key in ("from", "to"):
            pt = row[key]
            if not isinstance(pt, dict) or set(pt) != {"u", "v"} or any(
                type(pt[k]) not in (float, int) or not math.isfinite(pt[k])
                for k in ("u", "v")
            ):
                reject("finite first-angle V5 model-mm endpoint required")
            points2.append((pt["u"], pt["v"]))
        if math.dist(*points2) <= 1e-9:
            reject("collapsed V5 model-mm source is not an outline segment")
        src = real_edges[row["sourceEdgeId"]]
        a, b = (paper(points[i], row["view"]) for i in src)
        dx, dy = b[0] - a[0], b[1] - a[1]
        squared = dx * dx + dy * dy
        if squared <= 1e-18:
            reject("projected true source edge collapsed")
        for q in points2:
            cross = dx * (q[1] - a[1]) - dy * (q[0] - a[0])
            t = ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / squared
            if abs(cross) > 1e-8 * math.sqrt(squared) or not -1e-9 <= t <= 1 + 1e-9:
                reject("V5 action does not lie on its authentic original 3D source edge")
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
            pts.append((p.X(), p.Y()))
            verts.Next()
        if len(pts) != 2:
            reject("OCCT projected HLR edge not bounded by two vertices")
        if math.dist(pts[0], pts[1]) > 1e-9:
            strokes.append(pts)
        explorer.Next()
    if not strokes:
        reject("OCCT generated no visible HLR source strokes")
    return strokes



def unique_global_generated_edge_claim(claims, style, ordinal, source, scoped_ordinal):
    """Require one occurrence, not merely one unique source label.

    Repeated source-scoped edges from the SAME original source must not
    masquerade as distinct globally generated HLR edges. This cannot
    substitute for a real TopoDS.IsSame link or full-scene M5 proof.
    """
    return claims.get((style, ordinal)) == [(source, scoped_ordinal)]



def exact_binary64_source_scoped_hlr_paper_witness(original_from, original_to,
                                                  generated_from, generated_to):
    """Exact binary64-as-rational comparison, never a TopoDS lineage or M5 proof.

    Both received HLR paper axes are checked. Dominant-axis coverage alone
    cannot certify a line if the generated endpoint is transversely displaced.
    No epsilon, clamping or endpoint snapping is permitted here.
    """
    from fractions import Fraction

    def finite_pair(pair):
        if len(pair) != 2 or any(
            type(v) not in (int, float) or not math.isfinite(v) for v in pair
        ):
            reject("finite original and generated HLR paper endpoints required")
        return tuple(Fraction(v) for v in pair)

    a, b = finite_pair(original_from), finite_pair(original_to)
    g0, g1 = finite_pair(generated_from), finite_pair(generated_to)
    du, dv = b[0] - a[0], b[1] - a[1]
    if du == 0 and dv == 0:
        return {
            "projectedOriginalSourceCollapsedToPoint": True,
            "exactTransversePaperDriftDetected": False,
            "exactDominantAxisUncoveredPositiveSourceSubranges": [],
            "originalFullSourcePaperCoverageProven": False,
            "generated2DTopoDSHistoryCertified": False,
            "signedV5Action": False,
        }
    axis = 0 if abs(du) >= abs(dv) else 1
    direction = (du, dv)[axis]
    endpoint_rows = []
    for p in (g0, g1):
        cross = du * (p[1] - a[1]) - dv * (p[0] - a[0])
        t = (p[axis] - a[axis]) / direction
        endpoint_rows.append({
            "originalUnitParameterFromExactReceivedDominantAxis": str(t),
            "exactOriginalProjectionLineCrossResidual": str(cross),
            "exactlyCollinearWithOriginalProjectedSource": cross == 0,
            "insideOriginalUnitParameterDomain": 0 <= t <= 1,
        })
    t0, t1 = sorted(Fraction(row[
        "originalUnitParameterFromExactReceivedDominantAxis"
    ]) for row in endpoint_rows)
    gaps = []
    if t0 > 0:
        gaps.append(["0", str(min(t0, Fraction(1)))])
    if t1 < 1:
        gaps.append([str(max(t1, Fraction(0))), "1"])
    transverse = any(
        not row["exactlyCollinearWithOriginalProjectedSource"]
        for row in endpoint_rows
    )
    return {
        "projectedOriginalSourceCollapsedToPoint": False,
        "sourceDominantPaperAxis": ("u", "v")[axis],
        "receivedGeneratedPaperEndpoints": [
            list(generated_from), list(generated_to)
        ],
        "exactReceivedEndpointAffineWitnesses": endpoint_rows,
        "exactTransversePaperDriftDetected": transverse,
        "exactLongitudinalPaperSourceGapDetected": bool(gaps),
        "exactDominantAxisUncoveredPositiveSourceSubranges": gaps,
        "originalFullSourcePaperCoverageProven": (
            not transverse and not gaps and t0 >= 0 and t1 <= 1
        ),
        # The real original edge can be fully visible in HLR EdgeStatus
        # while output paper coordinates differ. This only audits numbers.
        "generated2DTopoDSHistoryCertified": False,
        "signedV5Action": False,
    }


def audit_exhaustive_native_hlr_global_source_filter_bijection(global_papers,
                                                                 scoped_claims):
    """Full, one-to-one HLR output attribution through SAME-RUN source filters.

    Proven: every whole-solid generated 2D edge has one exact binary64
    matching source-scoped generated edge of the same visibility class, and
    every scoped edge is accounted for. The source was already indexed by
    its ORIGINAL live TopoDS EdgeMap entry. No 2D-only coincidence is
    promoted to an original 3D identity: the native input EdgeMap, original
    BRep curve/domain and source filter are independent prerequisites.
    Not proven: direct generated IsSame, generated curve subparameter
    history, whole-scene continuous occlusion, signed engineering lines.
    """
    if not isinstance(global_papers, dict) or set(global_papers) != {"visible", "hidden"} or (
        not isinstance(scoped_claims, list) or len(scoped_claims) > 2048
    ):
        reject("complete bounded native HLR source/global inventories required")

    def signature(endpoints):
        if endpoints is None or len(endpoints) != 2 or any(
            len(p) != 3 or any(type(v) not in (float, int) or not math.isfinite(v)
                               for v in p) for p in endpoints
        ):
            return None
        return tuple(sorted(tuple(p) for p in endpoints))

    rows, holds = [], []
    # The independent HLR DataStructure EdgeMap must map each ORIGINAL
    # physical source to ONE native index and vice versa. An attacker may
    # supply distinct source names and exact paper without a real BRep.
    source_to_index, index_to_source = {}, {}
    for claim in scoped_claims:
        if not isinstance(claim, dict):
            reject("native source-scoped HLR claim must be a real indexed record")
        source = claim.get("originalSourceEdgeId")
        index = claim.get("originalEdgeMapIndex")
        if (not isinstance(source, str) or not source or
            type(index) is not int or index < 1):
            reject("native source identity/index must be nonempty and positive")
        if ((source in source_to_index and source_to_index[source] != index) or
            (index in index_to_source and index_to_source[index] != source)):
            reject("original TopoDS EdgeMap identity is not a source/index bijection")
        source_to_index[source] = index
        index_to_source[index] = source
    for klass in ("visible", "hidden"):
        global_edges = global_papers[klass]
        if not isinstance(global_edges, list) or len(global_edges) > 1024:
            reject("bounded actual native whole-solid HLR edges required")
        scoped = [c for c in scoped_claims if c.get("hlrClass") == klass]
        by_paper, scoped_ids = {}, set()
        for c in scoped:
            source, index, ordinal = (c.get("originalSourceEdgeId"),
                                       c.get("originalEdgeMapIndex"),
                                       c.get("sourceScopedOrdinal"))
            if (not isinstance(source, str) or not source or
                not isinstance(index, int) or index < 1 or
                not isinstance(ordinal, int) or ordinal < 1 or
                (source, ordinal) in scoped_ids):
                reject("invalid or duplicated original source-scoped HLR provenance")
            scoped_ids.add((source, ordinal))
            sig = signature(c.get("paper"))
            if sig is None:
                holds.append({"hlrClass": klass, "reason": "invalid-scoped-paper"})
                continue
            by_paper.setdefault(sig, []).append(c)
        global_ids = set()
        for ordinal, paper in enumerate(global_edges, 1):
            sig = signature(paper)
            if sig is None:
                holds.append({"hlrClass": klass, "globalOrdinal": ordinal,
                              "reason": "invalid-global-paper"})
                continue
            claims = by_paper.get(sig, [])
            if sig in global_ids or len(claims) != 1:
                holds.append({"hlrClass": klass, "globalOrdinal": ordinal,
                              "reason": "duplicate-or-ambiguous-scoped-owner",
                              "candidateCount": len(claims)})
                continue
            global_ids.add(sig)
            claim = claims[0]
            rows.append({
                "hlrClass": klass,
                "wholeSolidGeneratedHLREdgeOrdinal": ordinal,
                "originalSourceEdgeId": claim["originalSourceEdgeId"],
                "originalNativeEdgeMapIndex": claim["originalEdgeMapIndex"],
                "sourceScopedOrdinal": claim["sourceScopedOrdinal"],
                "sourceFilterProducesExactSameReceivedBinary64Paper": True,
                "generatedWholeEdgeDirectIsSameOriginalSource": False,
                "completeGeneratedTopoDSParameterHistoryCertified": False,
                "wholeSceneContinuousOcclusionCertified": False,
                "signedV5Action": False,
            })
        if len(global_edges) != len(scoped) or global_ids != set(by_paper):
            holds.append({"hlrClass": klass, "reason": "global-scoped-multiset-incomplete",
                          "globalEdgeCount": len(global_edges),
                          "scopedEdgeCount": len(scoped)})
    certified = len(holds) == 0 and len(rows) == sum(
        len(global_papers[k]) for k in ("visible", "hidden")
    )
    return {
        "wholeSolidGeneratedEdges": sum(len(global_papers[k]) for k in
                                        ("visible", "hidden")),
        "sourceScopedGeneratedEdges": len(scoped_claims),
        "exactSameRunCompleteUniqueSourceFilterPaperBijectionProven": certified,
        "originalTopoDSInputIndexedBeforeSourceFilteringRequired": True,
        "nativeGlobalSourceFilterAttributionOnlyNotGeneratedShapeIsSame": True,
        "unresolvedGlobalSourceFilterAttributionRows": holds,
        "attributedGlobalGeneratedEdges": rows if certified else [],
        "original3DCurveToGenerated2DSubparameterHistoryCertified": False,
        "allSceneContinuousOcclusionCertified": False,
        "formalM5Authorized": False,
        "signedV5ActionCount": 0,
    }


def audit_original_hlr_source_status(case, view):
    """Independent original TopoDS EdgeMap -> HLR EdgeStatus -> scoped output.

    Status intervals use ORIGINAL OCCT curve parameters, not rounded inverse
    paper t. A source-scoped generated edge is causal filter evidence, not
    native generated-edge IsSame, complete scene visibility, or V5 authority.
    """
    from OCP.BRepBuilderAPI import (
        BRepBuilderAPI_MakeFace, BRepBuilderAPI_MakePolygon, BRepBuilderAPI_Sewing
    )
    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.BRep import BRep_Tool
    from OCP.BRepAdaptor import BRepAdaptor_Curve
    from OCP.GeomAbs import GeomAbs_Line
    from OCP.HLRBRep import HLRBRep_Algo, HLRBRep_HLRToShape
    from OCP.HLRAlgo import HLRAlgo_Projector
    from OCP.TopExp import TopExp, TopExp_Explorer
    from OCP.TopTools import TopTools_IndexedMapOfShape
    from OCP.TopAbs import TopAbs_EDGE, TopAbs_VERTEX
    from OCP.TopoDS import TopoDS
    from OCP.gp import gp_Ax2, gp_Dir, gp_Pnt

    data = case["geometry"]["data"]
    points = {k: xyz(p) for k, p in data["points"].items()}
    expected = {"|".join(sorted(edge)) for edge in data["edges"]}
    sewing = BRepBuilderAPI_Sewing(1e-9)
    for ring in data["faces"]:
        polygon = BRepBuilderAPI_MakePolygon()
        for vertex in ring:
            polygon.Add(gp_Pnt(*points[vertex]))
        polygon.Close()
        sewing.Add(BRepBuilderAPI_MakeFace(polygon.Wire()).Face())
    sewing.Perform()
    if sewing.NbFreeEdges() or sewing.NbMultipleEdges():
        reject("native original HLR source faces did not sew into one manifold")
    shape = sewing.SewedShape()
    if not BRepCheck_Analyzer(shape).IsValid():
        reject("native original HLR source BRep failed topology validation")

    unique_edges = TopTools_IndexedMapOfShape()
    TopExp.MapShapes_s(shape, TopAbs_EDGE, unique_edges)
    originals, original_ids = {}, {}
    for index in range(1, unique_edges.Extent() + 1):
        edge = TopoDS.Edge_s(unique_edges.FindKey(index))
        explorer = TopExp_Explorer(edge, TopAbs_VERTEX)
        vertex_ids = []
        while explorer.More():
            p = BRep_Tool.Pnt_s(TopoDS.Vertex_s(explorer.Current()))
            native = (p.X(), p.Y(), p.Z())
            matches = [name for name, original in points.items() if native == original]
            if len(matches) != 1:
                reject("native original HLR vertex has no exact unique M0 identity")
            vertex_ids.append(matches[0])
            explorer.Next()
        if len(vertex_ids) != 2 or vertex_ids[0] == vertex_ids[1]:
            reject("native original HLR edge lacks two distinct physical endpoints")
        key = "|".join(sorted(vertex_ids))
        if key in originals or key not in expected:
            reject("native original HLR EdgeMap duplicates or invents M0 source")
        originals[key] = edge
        original_ids[key] = vertex_ids
    if set(originals) != expected:
        reject("native original HLR source inventory has a missing original edge")

    direction, xdir = FRAMES[view]
    algo = HLRBRep_Algo()
    algo.Add(shape)
    algo.Projector(HLRAlgo_Projector(
        gp_Ax2(gp_Pnt(0, 0, 0), gp_Dir(*direction), gp_Dir(*xdir))))
    algo.Update()
    algo.Hide()
    native_data = algo.DataStructure()
    edge_map = native_data.EdgeMap()
    status_array = native_data.EDataArray()
    if edge_map.Extent() != len(expected) or (
        status_array.Lower() > 1 or status_array.Upper() < len(expected)
    ):
        reject("HLR internal source EdgeMap and EdgeStatus inventory differ")
    filtered = HLRBRep_HLRToShape(algo)

    # Run the WHOLE-solid and original-source-scoped HLR extraction against
    # the SAME live HLRBRep_Algo. A paper-coordinate match is only a candidate:
    # HLRToShape may build fresh TopoDS edges on each extraction. Only a real
    # TopoDS.IsSame link can prove a particular global output TShape is the
    # one returned by the source-scoped extraction.
    def generated_edges(compound):
        explorer = TopExp_Explorer(compound, TopAbs_EDGE)
        result = []
        while explorer.More():
            result.append(TopoDS.Edge_s(explorer.Current()))
            explorer.Next()
        return result

    def exact_paper_vertices(edge):
        explorer = TopExp_Explorer(edge, TopAbs_VERTEX)
        coords = []
        while explorer.More():
            point = BRep_Tool.Pnt_s(TopoDS.Vertex_s(explorer.Current()))
            coords.append((point.X(), point.Y(), point.Z()))
            explorer.Next()
        if len(coords) != 2 or not all(
            math.isfinite(value) for p in coords for value in p
        ):
            return None
        return tuple(sorted(coords))

    global_edges = {
        "visible": generated_edges(filtered.VCompound()),
        "hidden": generated_edges(filtered.HCompound()),
    }
    global_papers = {
        kind: [exact_paper_vertices(edge) for edge in group]
        for kind, group in global_edges.items()
    }
    global_ordinal_claims = {}
    scoped_global_claims = []
    rows = []
    for key in sorted(expected):
        original = originals[key]
        index = edge_map.FindIndex(original)
        if index < 1 or not edge_map.FindKey(index).IsSame(original):
            reject("HLR internal EdgeMap lost original TopoDS source identity")
        status = status_array.Value(index).Status()
        lo, hi = status.Bounds(0.0, 0.0)
        if not (math.isfinite(lo) and math.isfinite(hi) and hi > lo):
            reject("HLR original source curve has no positive parameter interval")
        # Independent ORIGINAL native BRep curve, on the SAME live input
        # TopoDS edge that the HLR internal EdgeMap indexes. A complete
        # EdgeStatus source interval means nothing if it is not the real
        # original curve's parameter domain. Never infer that from paper.
        source_curve = BRepAdaptor_Curve(original)
        if source_curve.GetType() != GeomAbs_Line or (
            source_curve.FirstParameter() != lo or
            source_curve.LastParameter() != hi
        ):
            reject("native original 3D line domain contradicts HLR indexed EdgeStatus")
        def curve_xyz(t):
            pt = source_curve.Value(t)
            return (pt.X(), pt.Y(), pt.Z())
        curve_ends = [curve_xyz(lo), curve_xyz(hi)]
        physical_ends = [points[id] for id in original_ids[key]]
        residual = min(
            max(math.dist(p, q) for p, q in zip(curve_ends, order))
            for order in (physical_ends, physical_ends[::-1])
        )
        mid = curve_xyz((lo + hi) / 2)
        midpoint = tuple((a + b) / 2 for a, b in zip(*physical_ends))
        midpoint_residual = math.dist(mid, midpoint)
        if not all(math.isfinite(value) for point in curve_ends + [mid]
                   for value in point) or (
            residual > 1e-9 or midpoint_residual > 1e-9
        ):
            reject("native original 3D BRep curve does not pass reviewed physical endpoints/midpoint")
        visible = [status.VisiblePart(i, 0.0, 0.0)
                   for i in range(1, status.NbVisiblePart() + 1)]
        hidden, cursor = [], lo
        for start, end in visible:
            if not (math.isfinite(start) and math.isfinite(end) and
                    cursor <= start < end <= hi):
                reject("HLR original source visible interval overlaps or escapes bounds")
            if start > cursor:
                hidden.append([cursor, start])
            cursor = end
        if cursor < hi:
            hidden.append([cursor, hi])
        if status.AllVisible() != (len(hidden) == 0) or (
            status.AllHidden() != (len(visible) == 0)
        ):
            reject("HLR original source status contradicts exact interval partition")
        visible_edges = generated_edges(filtered.VCompound(original))
        hidden_edges = generated_edges(filtered.HCompound(original))
        scoped_visible, scoped_hidden = len(visible_edges), len(hidden_edges)
        # Independently project the ORIGINAL 3D BRep source endpoints using
        # the same first-angle Ax2 paper basis as this native HLR run.
        ydir = (direction[1] * xdir[2] - direction[2] * xdir[1],
                direction[2] * xdir[0] - direction[0] * xdir[2],
                direction[0] * xdir[1] - direction[1] * xdir[0])
        def source_paper(vertex):
            p = points[vertex]
            return (sum(p[i] * xdir[i] for i in range(3)),
                    sum(p[i] * ydir[i] for i in range(3)))
        original_paper = [source_paper(vertex) for vertex in original_ids[key]]
        generated_global_correspondence = []
        for style, scoped in (("visible", visible_edges),
                              ("hidden", hidden_edges)):
            for local_ordinal, generated in enumerate(scoped, 1):
                paper = exact_paper_vertices(generated)
                # Native 1-based IsSame and exact received binary64 paper
                # parity are independently recorded. Never synthesize IsSame
                # from geometric proximity or paper-coordinate equality.
                native = [
                    i for i, full in enumerate(global_edges[style], 1)
                    if generated.IsSame(full)
                ]
                matching_paper = [
                    i for i, received in enumerate(global_papers[style], 1)
                    if paper is not None and received == paper
                ]
                if any(i not in matching_paper for i in native):
                    reject("same generated TopoDS edge contradicts exact whole-solid paper")
                scoped_global_claims.append({
                    "hlrClass": style,
                    "sourceScopedOrdinal": local_ordinal,
                    "originalSourceEdgeId": key,
                    "originalEdgeMapIndex": index,
                    "paper": paper,
                })
                for i in matching_paper:
                    global_ordinal_claims.setdefault((style, i), []).append((key, local_ordinal))
                exact_affine = (
                    exact_binary64_source_scoped_hlr_paper_witness(
                        original_paper[0], original_paper[1],
                        paper[0][:2], paper[1][:2],
                    ) if paper is not None else None
                )
                generated_global_correspondence.append({
                    "exactReceivedBinary64SourceScopedHLRPaperWitness": exact_affine,
                    "hlrClass": style,
                    "sourceScopedOrdinal": local_ordinal,
                    "sameGlobalGeneratedTopoDSOrdinals": native,
                    "exactPaperGlobalGeneratedOrdinals": matching_paper,
                    "directGeneratedTopoDSShapeIsSameWholeSolid":
                        len(native) == 1 and len(matching_paper) == 1
                        and native == matching_paper,
                    "causalGlobalGeneratedTopoDSIdentityCertified": False,
                    "paperOnlyCorrespondenceDoesNotProveNativeIdentity": True,
                })
        # The original 3D edge has an exact M0 endpoint pair. The
        # generated 2D paper edge may NOT reproduce that pair bit-for-bit,
        # even when original HLR EdgeStatus covers the entire curve.
        # Record this drift without snapping either endpoint or source t.
        paper_exact = None
        if (status.AllVisible() and scoped_visible == 1 and not scoped_hidden) or (
            status.AllHidden() and scoped_hidden == 1 and not scoped_visible
        ):
            selected = (visible_edges if status.AllVisible() else hidden_edges)[0]
            vertex_explorer = TopExp_Explorer(selected, TopAbs_VERTEX)
            received = []
            while vertex_explorer.More():
                point = BRep_Tool.Pnt_s(TopoDS.Vertex_s(vertex_explorer.Current()))
                received.append((point.X(), point.Y()))
                vertex_explorer.Next()
            if len(received) != 2:
                reject("single native generated HLR paper edge lacks two endpoints")
            paper_exact = sorted(received) == sorted(original_paper)
        if (status.AllVisible() and scoped_hidden) or (
            status.AllHidden() and scoped_visible
        ):
            reject("native source-filtered generated HLR contradicts original EdgeStatus")
        rows.append({
            "sourceEdgeId": case["id"] + "::" + key,
            "nativeHLROriginalEdgeMapIndex": index,
            "originalCurveParameterBounds": [lo, hi],
            "nativeOriginalTopoDSCurveTypeLineAndHLRParameterDomainVerified": True,
            "nativeOriginalBRep3DEndpointResidualMm": residual,
            "nativeOriginalBRep3DMidpointResidualMm": midpoint_residual,
            "nativeOriginalBRepCurveAndEdgeStatusShareExactParameterDomain": True,
            "visibleOriginalCurveParameterIntervals": [list(x) for x in visible],
            "hiddenOriginalCurveParameterIntervals": hidden,
            "sourceScopedGeneratedVisibleEdgeCount": scoped_visible,
            "sourceScopedGeneratedHiddenEdgeCount": scoped_hidden,
            "sourceScopedToWholeSolidGeneratedHLREdges": generated_global_correspondence,
            "singleGeneratedFullEdgePaperEndpointsExactlyEqualOriginalM0": paper_exact,
            "originalTopoDSInputEdgeIsSameEdgeMapKey": True,
            "generated2DTopoDSEdgeHistoryCertified": False,
            "wholeSceneContinuousOcclusionCertified": False,
            "signedV5Action": False,
        })
    if len({row["nativeHLROriginalEdgeMapIndex"] for row in rows}) != len(expected):
        reject("HLR original source edge indices are not bijective")
    # This is a stronger exhaustive source-filtered CAUSAL ledger than
    # independent paper lookups: it reuses the live original EdgeMap and
    # requires a complete global/scoped multiset bijection in both classes.
    # It does not assert native generated-edge IsSame or M5 line readiness.
    exhaustive_source_bijection = audit_exhaustive_native_hlr_global_source_filter_bijection(
        global_papers, scoped_global_claims
    )
    # Even a real same-TShape witness is not unique source ownership until
    # all source-scoped claims in the same global HLR output are reconciled.
    unique_native = 0
    ambiguous_paper = 0
    for row in rows:
        source_key = row["sourceEdgeId"].split("::", 1)[1]
        for match in row["sourceScopedToWholeSolidGeneratedHLREdges"]:
            native = match["sameGlobalGeneratedTopoDSOrdinals"]
            paper = match["exactPaperGlobalGeneratedOrdinals"]
            claim_unique = len(paper) == 1 and (
                unique_global_generated_edge_claim(
                    global_ordinal_claims, match["hlrClass"], paper[0],
                    source_key, match["sourceScopedOrdinal"]
                )
            )
            match["globallyUniqueExactPaperSourceCandidate"] = claim_unique
            match["causalGlobalGeneratedTopoDSIdentityCertified"] = bool(
                claim_unique and match["directGeneratedTopoDSShapeIsSameWholeSolid"]
            )
            match["uniqueRealNativeGlobalSourceLink"] = (
                match["causalGlobalGeneratedTopoDSIdentityCertified"]
            )
            unique_native += int(match["uniqueRealNativeGlobalSourceLink"])
            ambiguous_paper += int(len(paper) != 1 or not claim_unique)
    return {
        "originalBRepSourcesChecked": len(rows),
        "nativeOriginalSourceEdgeMapBijectionVerified": True,
        "nativeOriginalCurveParameterPartitionVerified": True,
        "nativeOriginalBRepCurveAndHLREdgeStatusConcordanceVerified": True,
        "nativeOriginalSourcesAllVisible": sum(
            not row["hiddenOriginalCurveParameterIntervals"] for row in rows),
        "nativeOriginalSourcesAllHidden": sum(
            not row["visibleOriginalCurveParameterIntervals"] for row in rows),
        "sourceScopedGeneratedHLRClassCorroborated": True,
        "wholeSolidGeneratedVisibleEdgeCount": len(global_edges["visible"]),
        "wholeSolidGeneratedHiddenEdgeCount": len(global_edges["hidden"]),
        "uniqueSameTopoDSGlobalSourceScopedEdgeLinks": unique_native,
        "ambiguousOrUnmatchedGlobalPaperSourceCandidates": ambiguous_paper,
        "exhaustiveSameRunNativeGlobalSourceFilterBijection": exhaustive_source_bijection,
        "generated2DTopoDSEdgeHistoryCertified": False,
        "formalM5LineStyleAuthorized": False,
        "rows": rows,
    }


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
              "occtVolumeMm3":solid.Volume(), "views":{},
              "independentlyCoveredSignedV5ActionCount":0}
    for view in FRAMES:
        strokes = extract_occt_visible_hlr(solid, view)
        source_status = audit_original_hlr_source_status(case, view)
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
        signed = [row for row in case.get("signedVisibleContourActions", [])
                  if row["view"] == view]
        signed_gaps = [largest_uncovered_fraction(
            (row["from"]["u"], row["from"]["v"]),
            (row["to"]["u"], row["to"]["v"]), strokes, tolerance
        ) for row in signed]
        signed_agree = all(x <= tolerance for x in signed_gaps)
        answer["independentlyCoveredSignedV5ActionCount"] += len(signed)
        answer["views"][view] = {
            "occtVisibleHLREdgeCount":len(strokes),
            "independentOriginalHLRSourceStatus":source_status,
            "occtProjectedHullAreaMm2":measured_area,
            "currentM5HullAreaMm2":expected_area,
            "maxSourceSideUncoveredFraction":gap,
            "hullVerticesAgreement":vertex_agree,
            "hullAreasAgreement":area_agree,
            "occtVisibleHLRCoversWholeM5Hull":coverage_agree,
            "signedScopedV5ActionCount":len(signed),
            "maxSignedV5ActionUncoveredFraction":max(signed_gaps, default=0),
            "occtVisibleHLRCoversAllSignedScopedV5Actions":signed_agree,
        }
        if not all((vertex_agree, area_agree, coverage_agree, signed_agree)):
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
