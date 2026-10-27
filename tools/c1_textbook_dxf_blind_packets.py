#!/usr/bin/env python3
"""Blind C1 textbook CAD source handoff after authenticated DWG -> DXF conversion.

The converter/sha256 preflight is owned by c1_textbook_dwg_evidence.py.
This module ONLY consumes that already converted original DXF. A human must
select the two ORIGINAL GIVEN view vertices and the separate ANSWER handles,
calibrate each paper frame, and explicitly mark the single-convex-complete-
extreme-vertex hypothesis for independent review. No DXF solution line may
ever appear in the solver's given packet.

These outputs are not source-image recognition or a passed textbook problem.
"""
from __future__ import annotations

import hashlib
import json
import math
import pathlib

VISIBLE = "gb-t-4457.4-continuous-wide-visible-outline"
HIDDEN = "gb-t-4457.4-thin-dashed-hidden-edge"
VIEWS = frozenset(("V", "H", "W"))
MAX_ABS = 100000.0


def hash_file(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _number(n: object) -> float:
    if type(n) not in (int, float) or not math.isfinite(n) or abs(n) > MAX_ABS:
        raise ValueError("bounded finite CAD millimetre coordinate required")
    return float(n)


def _xy(value: object) -> tuple[float, float]:
    if not isinstance(value, (tuple, list)) or len(value) != 3:
        raise ValueError("original finite 3D CAD entity coordinate required")
    x, y, z = map(_number, value)
    if z != 0.0:
        raise ValueError("original two-view source is not planar CAD geometry")
    return x, y


def _frame(frame: object) -> dict:
    if not isinstance(frame, dict) or set(frame) != {
        "originCad", "scaleMmPerCadUnit", "uSign", "vSign"
    }:
        raise ValueError("fully reviewed first-angle CAD-to-model frame required")
    origin = frame["originCad"]
    if not isinstance(origin, list) or len(origin) != 2:
        raise ValueError("CAD first-angle frame origin required")
    ox, oy = map(_number, origin)
    scale = _number(frame["scaleMmPerCadUnit"])
    if not 1e-9 <= scale <= 10000:
        raise ValueError("explicit positive model-mm calibration required")
    if type(frame["uSign"]) is not int or frame["uSign"] not in (-1, 1) or (
        type(frame["vSign"]) is not int or frame["vSign"] not in (-1, 1)
    ):
        raise ValueError("first-angle CAD projection direction must be signed")
    return {
        "originCad": [ox, oy], "scaleMmPerCadUnit": scale,
        "uSign": frame["uSign"], "vSign": frame["vSign"],
    }


def _project(xy: tuple[float, float], frame: dict) -> dict:
    ox, oy = frame["originCad"]
    u = (xy[0] - ox) * frame["scaleMmPerCadUnit"] * frame["uSign"]
    v = (xy[1] - oy) * frame["scaleMmPerCadUnit"] * frame["vSign"]
    return {"u": _number(u), "v": _number(v)}


def inspect_geometry_entities(dxf: pathlib.Path) -> dict:
    """Read original converted DXF, not a solution supplied by a user."""
    try:
        import ezdxf
    except ImportError as exc:
        raise RuntimeError("ezdxf required for actual original DXF entity coordinates") from exc
    doc = ezdxf.readfile(str(dxf))
    rows = {}
    for layout in doc.layouts:
        for e in layout:
            handle = e.dxf.get("handle", None)
            if not isinstance(handle, str) or not handle or handle in rows:
                raise ValueError("nonunique actual source DXF entity handle")
            kind = e.dxftype()
            if kind == "POINT":
                rows[handle] = {
                    "type": kind, "layout": layout.name,
                    "location": tuple(e.dxf.location)
                }
            elif kind == "LINE":
                rows[handle] = {
                    "type": kind, "layout": layout.name,
                    "start": tuple(e.dxf.start), "end": tuple(e.dxf.end)
                }
            else:
                rows[handle] = {"type": kind, "layout": layout.name}
    return rows


def _pick(row: object, selector: object) -> tuple[float, float]:
    if not isinstance(selector, dict) or set(selector) != {"handle", "endpoint"}:
        raise ValueError("original CAD point endpoint selection required")
    endpoint = selector["endpoint"]
    if not isinstance(row, dict) or row.get("layout") != "Model":
        raise ValueError("source vertex outside the original DXF modelspace")
    if row.get("type") == "POINT" and endpoint == "point":
        return _xy(row.get("location"))
    if row.get("type") == "LINE" and endpoint in ("start", "end"):
        return _xy(row.get(endpoint))
    raise ValueError("unsupported original CAD vertex source type or endpoint")


def build_blind_packets(*, source_sha256: str, dxf_sha256: str, partition: dict,
                        review: dict, entities: dict) -> tuple[dict, dict]:
    """Produce DISJOINT packets. No reference coordinates enter the given packet.

    The caller must already have authenticated source SHA and freshly converted
    DXF SHA. No arbitrary reference from a separately supplied drawing.
    """
    if len(source_sha256) != 64 or len(dxf_sha256) != 64 or (
        review.get("sourceSha256") != source_sha256 or
        review.get("convertedDxfSha256") != dxf_sha256 or
        partition.get("status") != "manually-partitioned-handle-inventories-only"
    ):
        raise ValueError("original DWG/DXF and reviewed partition provenance mismatch")
    given = partition.get("givenHandles")
    answer = partition.get("referenceHandles")
    if not isinstance(given, list) or not isinstance(answer, list) or (
        not given or not answer or set(given) & set(answer)
    ) or set(given) - set(entities) or set(answer) - set(entities):
        raise ValueError("complete, disjoint actual original DXF handle sets required")
    if (review.get("originalSourceAssumption") !=
        "all-extreme-vertices-of-one-closed-convex-solid" or
        review.get("originalSourceAssumptionReviewed") is not True):
        raise ValueError("explicit source completeness/convexity assumption review required")
    selected = review.get("givenViewVertices")
    frames = review.get("viewFrames")
    if not isinstance(selected, dict) or not isinstance(frames, dict) or (
        len(selected) != 2 or set(selected) != set(frames) or
        not set(selected) < VIEWS
    ):
        raise ValueError("exactly two calibrated original first-angle views required")
    view_points = {}
    given_provenance = {}
    used_given = set()
    for view in sorted(selected):
        selectors = selected[view]
        if not isinstance(selectors, list) or not 4 <= len(selectors) <= 64:
            raise ValueError("4..64 explicit original extreme CAD vertex selectors required")
        frame = _frame(frames[view])
        values = []
        sources = []
        seen = set()
        for sel in selectors:
            if not isinstance(sel, dict):
                raise ValueError("CAD vertex source selector required")
            handle = sel.get("handle")
            index = (handle, sel.get("endpoint"))
            if handle not in given or index in seen:
                raise ValueError("unassigned, duplicate or answer-leaking given vertex selector")
            seen.add(index)
            used_given.add(handle)
            xy = _pick(entities.get(handle), sel)
            values.append(_project(xy, frame))
            sources.append({"handle": handle, "endpoint": sel["endpoint"]})
        # Duplicate paper points are ambiguous 3D correspondences; never invent
        # a second vertex from a collapsed or repeated source paper point.
        if len(set((p["u"], p["v"]) for p in values)) != len(values):
            raise ValueError("duplicate or collapsed CAD source view vertex")
        view_points[view] = values
        given_provenance[view] = sources
    # Two projections of a real box have only FOUR DISTINCT paper corners
    # each, yet can correspond to EIGHT different 3D original corners.
    # A human can review the 2D vertex INDEX pairs (alphabetical view order)
    # without inventing duplicate CAD entities or accepting answer geometry.
    reviewed_pairs = review.get("reviewedCorrespondences")
    if reviewed_pairs is None:
        if len(set(map(len, view_points.values()))) != 1:
            raise ValueError("different original extreme vertex counts in two views")
    else:
        first, second = sorted(view_points)
        if not isinstance(reviewed_pairs, list) or not 4 <= len(reviewed_pairs) <= 32:
            raise ValueError("4..32 explicit original 3D correspondence pairs required")
        seen_pairs, seen_first, seen_second = set(), set(), set()
        for pair in reviewed_pairs:
            if not isinstance(pair, dict) or set(pair) != {"firstIndex", "secondIndex"}:
                raise ValueError("reviewed first-angle pair index record required")
            i, j = pair["firstIndex"], pair["secondIndex"]
            if type(i) is not int or type(j) is not int or (
                i < 0 or i >= len(view_points[first]) or
                j < 0 or j >= len(view_points[second])
            ):
                raise ValueError("reviewed original CAD pair indices out of bounds")
            if (i, j) in seen_pairs:
                raise ValueError("repeated original three-dimensional corner index pair")
            seen_pairs.add((i, j))
            seen_first.add(i)
            seen_second.add(j)
        if len(seen_first) != len(view_points[first]) or (
            len(seen_second) != len(view_points[second])
        ):
            raise ValueError("reviewed mapping leaves original two-dimensional CAD vertex unassigned")
    if set(given) != used_given:
        raise ValueError("unaccounted given CAD handles require review, not silent omission")
    missing_view = next(v for v in ("V", "H", "W") if v not in selected)
    refs = review.get("referenceStrokes")
    if not isinstance(refs, list) or not 1 <= len(refs) <= 512:
        raise ValueError("explicit isolated answer strokes required")
    frame = _frame(review.get("referenceFrame"))
    strokes = []
    used_answer = set()
    for sel in refs:
        if not isinstance(sel, dict) or set(sel) != {"handle", "style"} or (
            sel["style"] not in (VISIBLE, HIDDEN) or sel["handle"] not in answer
        ):
            raise ValueError("unreviewed or answer-leaking C1 line-style selection")
        handle = sel["handle"]
        if handle in used_answer:
            raise ValueError("reference line duplicates an original CAD handle")
        used_answer.add(handle)
        row = entities.get(handle)
        if not isinstance(row, dict) or row.get("type") != "LINE" or (
            row.get("layout") != "Model"
        ):
            raise ValueError("reference answer is not an explicit original CAD LINE")
        a, b = _project(_xy(row["start"]), frame), _project(_xy(row["end"]), frame)
        if math.hypot(a["u"]-b["u"], a["v"]-b["v"]) <= 1e-9:
            raise ValueError("degenerate original DXF reference stroke")
        strokes.append({"from": a, "to": b,
                        "standardLineStyle": sel["style"],
                        "originalReferenceHandle": handle})
    if set(answer) != used_answer:
        raise ValueError("unaccounted reference CAD handles require independent review")
    given_packet = {
        "schema": "draftai-c1-authenticated-dxf-reviewed-given/1",
        "sourceSha256": source_sha256,
        "convertedDxfSha256": dxf_sha256,
        "views": view_points,
        "givenOriginalHandleEndpoints": given_provenance,
        **({"reviewedCorrespondences": reviewed_pairs}
           if reviewed_pairs is not None else {}),
        "missingView": missing_view,
        "assumedScope": "all-extreme-vertices-of-one-closed-convex-opaque-solid",
        "humanSelectedFullExtremeVertexSet": True,
        "originalSourceCompletenessIndependentlyProved": False,
        "sourceImageRecognitionVerified": False,
        "referenceWasNotExportedAsSolverInput": True,
        "sourceIsNotYetConfirmedForProduction": True,
        "textbookBlindSolveAccepted": False
    }
    reference_packet = {
        "schema": "draftai-c1-isolated-dxf-answer-strokes/1",
        "sourceSha256": source_sha256,
        "convertedDxfSha256": dxf_sha256,
        "view": missing_view,
        "referenceStrokes": strokes,
        "engineeringStylesExplicitlyReviewed": True,
        "wasUsedAsM3Input": False,
        "actualIndependentModelSolverRun": False,
        "textbookBlindSolveAccepted": False
    }
    return given_packet, reference_packet


def write_isolated_packets(given_path: pathlib.Path, answer_path: pathlib.Path,
                           given: dict, reference: dict, forbidden: list[pathlib.Path]) -> None:
    paths = [p.resolve() for p in [given_path, answer_path, *forbidden]]
    if len(paths) != len(set(paths)) or given_path.exists() or answer_path.exists():
        raise ValueError("given, answer, DWG, DXF and review paths must never overlap or overwrite")
    if "referenceStrokes" in json.dumps(given) or "givenOriginalHandleEndpoints" in json.dumps(reference):
        raise ValueError("answer/given output packet information-flow boundary violated")
    # Require destinations to exist so both exclusive opens do not partially
    # mutate parent directory on a mistaken path.
    if not given_path.parent.is_dir() or not answer_path.parent.is_dir():
        raise ValueError("output directories must exist before isolated export")
    encoded = [json.dumps(o, indent=2, ensure_ascii=False, sort_keys=True)+"\n"
               for o in (given, reference)]
    try:
        with given_path.open("x", encoding="utf-8") as g:
            g.write(encoded[0])
        with answer_path.open("x", encoding="utf-8") as a:
            a.write(encoded[1])
    except Exception:
        # Only the newly-created files may be deleted: the preflight above
        # already established these paths did not exist.
        given_path.unlink(missing_ok=True)
        answer_path.unlink(missing_ok=True)
        raise
