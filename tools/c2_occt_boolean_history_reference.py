#!/usr/bin/env python3
"""Independent OpenCascade TopoDS Boolean-edge history, C2 reference only.

Offline validation for TWO explicitly defined convex box components of a
composite/nonconvex BRep union. Reuses mature OCCT BRepAlgoAPI_Fuse and its
actual Generated/Modified/IsSame history; no guessed source correspondence.
This is never an alternative DraftAI M3/M5 solver or a V5 line signer.
"""
from __future__ import annotations

import argparse
import json
import math
import pathlib
import sys


def box_input(data: dict) -> list[dict]:
    components = data.get("components")
    if not isinstance(components, list) or len(components) != 2:
        raise ValueError("exactly two independent current box sources required")
    seen = set()
    for part in components:
        if not isinstance(part, dict) or part.get("type") != "box":
            raise ValueError("explicit BRep box component required")
        source_id = part.get("id")
        if not isinstance(source_id, str) or not source_id.isidentifier() or source_id in seen:
            raise ValueError("unique stable box source identity required")
        seen.add(source_id)
        lo, hi = part.get("min"), part.get("max")
        if not isinstance(lo, list) or not isinstance(hi, list) or len(lo) != 3 or len(hi) != 3:
            raise ValueError("three explicit min/max model-mm coordinates required")
        if any(not isinstance(x, (float, int)) or not math.isfinite(x) or abs(x) > 1e6
               for x in lo + hi):
            raise ValueError("finite bounded model-mm box coordinates required")
        if any(hi[i] - lo[i] <= 1e-7 for i in range(3)):
            raise ValueError("nondegenerate box dimensions required")
    return components


def occt_reference(data: dict) -> dict:
    components = box_input(data)
    try:
        from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox
        from OCP.BRepAlgoAPI import BRepAlgoAPI_Fuse
        from OCP.BRepCheck import BRepCheck_Analyzer
        from OCP.BRep import BRep_Tool
        from OCP.gp import gp_Pnt
        from OCP.TopExp import TopExp
        from OCP.TopAbs import TopAbs_FACE, TopAbs_EDGE, TopAbs_VERTEX
        from OCP.TopTools import TopTools_IndexedMapOfShape
        from OCP.TopoDS import TopoDS
    except ImportError as exc:
        raise RuntimeError("independent verified OCP/OpenCascade installation required") from exc

    def unique(shape, kind):
        items = TopTools_IndexedMapOfShape()
        TopExp.MapShapes_s(shape, kind, items)
        return [items.FindKey(i) for i in range(1, items.Extent() + 1)]

    built = {}
    for part in components:
        p, q = part["min"], part["max"]
        built[part["id"]] = BRepPrimAPI_MakeBox(gp_Pnt(*p), gp_Pnt(*q)).Shape()
    first, second = (built[p["id"]] for p in components)
    fuse = BRepAlgoAPI_Fuse(first, second)
    fuse.SetToFillHistory(True)
    fuse.Build()
    result_shape = fuse.Shape()
    if not fuse.IsDone() or result_shape.IsNull() or not BRepCheck_Analyzer(result_shape).IsValid():
        raise RuntimeError("OCCT union shape/topology not independently valid")

    source_history = []
    for part in components:
        original = built[part["id"]]
        for kind, face_type in (("edge", TopAbs_EDGE), ("face", TopAbs_FACE)):
            for ordinal, src in enumerate(unique(original, face_type), 1):
                source_history.append({
                    "sourceComponentId": part["id"], "sourceKind": kind,
                    "sourceOrdinal": ordinal, "original": src,
                    "generated": list(fuse.Generated(src)),
                    "modified": list(fuse.Modified(src)),
                    "deleted": bool(fuse.IsDeleted(src)),
                })

    def classify(final_edge):
        claims = []
        for source in source_history:
            common = {key: source[key] for key in
                      ("sourceComponentId", "sourceKind", "sourceOrdinal")}
            if source["sourceKind"] == "edge" and final_edge.IsSame(source["original"]):
                claims.append({**common, "relation": "same-original-topods-edge"})
            for relation, values in (("generated", source["generated"]),
                                     ("modified", source["modified"])):
                for value in values:
                    if value.ShapeType() == TopAbs_EDGE and final_edge.IsSame(value):
                        claims.append({**common, "relation": relation + "-original-" +
                                       source["sourceKind"]})
                    elif value.ShapeType() == TopAbs_FACE:
                        for inside_edge in unique(value, TopAbs_EDGE):
                            if final_edge.IsSame(inside_edge):
                                claims.append({**common,
                                               "relation": "supporting-" + relation +
                                               "-original-face-boundary"})
        unique_claims = {json.dumps(x, sort_keys=True): x for x in claims}
        return list(unique_claims.values())

    final_edges = unique(result_shape, TopAbs_EDGE)
    evidence = []
    for index, edge in enumerate(final_edges, 1):
        verts = unique(edge, TopAbs_VERTEX)
        if len(verts) != 2:
            raise RuntimeError("nonlinear/closed native result edge outside box scope")
        xyz = []
        for vertex in verts:
            point = BRep_Tool.Pnt_s(TopoDS.Vertex_s(vertex))
            xyz.append({"x": point.X(), "y": point.Y(), "z": point.Z()})
        claims = classify(edge)
        if not claims:
            raise RuntimeError("real native result edge lacks original BRep history support")
        evidence.append({
            "finalTopoDSEdgeOrdinal": index,
            "real3DModelMmEndpoints": xyz,
            "originalTopoDSHistory": claims,
            "exactOriginalTopoDSEdgeAncestry": any(c["sourceKind"] == "edge" and
                c["relation"] in ("same-original-topods-edge",
                                  "generated-original-edge",
                                  "modified-original-edge") for c in claims),
            "atLeastOneOriginalFaceHistorySupport": any(c["sourceKind"] == "face"
                                                         for c in claims),
            "standardEngineeringLineStyle": "undetermined",
            "formalV5LineActionSigned": False,
        })
    return {
        "schema": "draftai-independent-occt-boolean-topods-history-reference/1",
        "sourceRevision": data.get("revision"),
        "originalSourceIds": [p["id"] for p in components],
        "unit": "mm", "status": "valid-occt-boolean-history-reference-only",
        "resultFaceCount": len(unique(result_shape, TopAbs_FACE)),
        "resultEdgeCount": len(evidence),
        "resultVertexCount": len(unique(result_shape, TopAbs_VERTEX)),
        "allResultEdgesHaveSameRunActualTopoDSHistorySupport": True,
        "resultEdgesWithDirectOriginalEdgeHistory": sum(
            x["exactOriginalTopoDSEdgeAncestry"] for x in evidence),
        "resultEdgesSupportedByOriginalFaceHistory": sum(
            x["atLeastOneOriginalFaceHistorySupport"] for x in evidence),
        "outputEdges": evidence,
        "sourceBooleanIntersectionFeatureTopologicallyAccountedFor": True,
        "completeProjectedOcclusionAndGBLineStylesCertified": False,
        "ConstructionIntentAuthorized": False, "signedV5ActionCount": 0,
        "realTextbookBlindTestPassed": False,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_json", type=pathlib.Path)
    parser.add_argument("--output", type=pathlib.Path)
    args = parser.parse_args(argv)
    try:
        data = json.loads(args.source_json.read_text(encoding="utf-8"))
        answer = occt_reference(data)
        encoded = json.dumps(answer, ensure_ascii=False, indent=2)
        if args.output:
            if args.output.exists():
                raise FileExistsError("will not overwrite previous independent CAD proof")
            args.output.write_text(encoded, encoding="utf-8")
        else:
            print(encoded)
        return 0
    except (ValueError, RuntimeError, OSError) as exc:
        print(json.dumps({"status": "blocked", "reason": str(exc),
                          "signedV5ActionCount": 0}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
