#!/usr/bin/env python3
"""Independent OpenCascade TopoDS Boolean-edge history, C2 reference only.

Offline validation for TWO explicitly defined convex box components of a
composite/nonconvex BRep union. Reuses mature OCCT BRepAlgoAPI_Fuse and its
actual Generated/Modified/IsSame history; no guessed source correspondence.
This is never an alternative DraftAI M3/M5 solver or a V5 line signer.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import pathlib
import struct
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


def source_manifest_fingerprint(data: dict) -> str:
    """Bound EVERY original source coordinate, not just source IDs/revision.

    Hash IEEE754 binary64 model-mm bits, not rounded JSON decimal strings.
    The same construction is repeated by the actual JS M0/M5 consumer.
    It catches stale/mismatched geometries, not malicious input or a fake
    native execution; only the same-run OCC process can establish that.
    """
    components = box_input(data)
    revision = data.get("revision")
    if type(revision) is not int or revision < 1 or revision > 2**53 - 1:
        raise ValueError("safe positive source revision required")
    if data.get("unit") != "mm":
        raise ValueError("explicit millimetre source unit required")
    h = hashlib.sha256()
    h.update(b"DraftAI-C2-actual-TopoDS-source-v1\\0")
    h.update(str(revision).encode("ascii") + b"\\0")
    for p in components:
        h.update(p["id"].encode("utf-8") + b"\\0")
        for value in p["min"] + p["max"]:
            h.update(struct.pack(">d", float(value)))
    return h.hexdigest()


def occt_reference(data: dict) -> dict:
    components = box_input(data)
    fingerprint = source_manifest_fingerprint(data)
    if not isinstance(data.get("revision"), int) or data["revision"] < 1:
        raise ValueError("current positive source geometry revision required")
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
        from OCP.TopAbs import TopAbs_REVERSED
        from OCP.TopTools import TopTools_IndexedDataMapOfShapeListOfShape
        from OCP.BRepAdaptor import BRepAdaptor_Curve, BRepAdaptor_Surface
        from OCP.GeomAbs import GeomAbs_Line, GeomAbs_Plane
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

    # Actual result-shape topology, not inferred from projection coincidence:
    # the two incident native BRep faces decide whether the edge is a true
    # physical crease or only a planar meshing/Boolean subdivision.
    incidence = TopTools_IndexedDataMapOfShapeListOfShape()
    TopExp.MapShapesAndAncestors_s(
        result_shape, TopAbs_EDGE, TopAbs_FACE, incidence
    )
    final_edges = unique(result_shape, TopAbs_EDGE)
    # All vertex identities are TopoDS_IsSame references from THIS specific
    # successful Boolean result. Two edges meeting at the same PAPER point
    # are never treated as joined unless they have the exact same native
    # TopoDS vertex in this final result.
    final_vertices = unique(result_shape, TopAbs_VERTEX)
    vertex_incident_edges = {i: [] for i in range(1, len(final_vertices) + 1)}

    def native_vertex_ordinal(vertex):
        matched = [i for i, original in enumerate(final_vertices, 1)
                   if vertex.IsSame(original)]
        if len(matched) != 1:
            raise RuntimeError("unmatched or non-unique native TopoDS vertex identity")
        return matched[0]

    if incidence.Extent() != len(final_edges):
        raise RuntimeError("Boolean edge/incident-face inventory is incomplete")

    def native_face_normal(face):
        surface = BRepAdaptor_Surface(TopoDS.Face_s(face))
        if surface.GetType() != GeomAbs_Plane:
            raise RuntimeError("native Boolean result has unsupported curved face")
        normal = surface.Plane().Axis().Direction()
        sign = -1 if face.Orientation() == TopAbs_REVERSED else 1
        return [sign * normal.X(), sign * normal.Y(), sign * normal.Z()]

    evidence = []
    for index, edge in enumerate(final_edges, 1):
        verts = unique(edge, TopAbs_VERTEX)
        if len(verts) != 2:
            raise RuntimeError("nonlinear/closed native result edge outside box scope")
        xyz = []
        vertex_ordinals = []
        for vertex in verts:
            vertex_ordinal = native_vertex_ordinal(vertex)
            vertex_ordinals.append(vertex_ordinal)
            vertex_incident_edges[vertex_ordinal].append(index)
            point = BRep_Tool.Pnt_s(TopoDS.Vertex_s(vertex))
            xyz.append({"x": point.X(), "y": point.Y(), "z": point.Z()})
        if vertex_ordinals[0] == vertex_ordinals[1]:
            raise RuntimeError("native result edge endpoints are the same TopoDS vertex")
        native_curve = BRepAdaptor_Curve(TopoDS.Edge_s(edge))
        if native_curve.GetType() != GeomAbs_Line:
            raise RuntimeError("native Boolean edge is not a verified straight segment")
        position = incidence.FindIndex(edge)
        if position < 1:
            raise RuntimeError("result edge has no native face incidence")
        adjacent = list(incidence.FindFromIndex(position))
        if len(adjacent) != 2 or adjacent[0].IsSame(adjacent[1]):
            raise RuntimeError("result edge is not a two-face solid manifold")
        normals = [native_face_normal(face) for face in adjacent]
        cosine = max(-1, min(1, sum(x * y for x, y in zip(*normals))))
        angle = math.acos(cosine)
        if not math.isfinite(angle):
            raise RuntimeError("invalid native BRep dihedral")
        physical_crease = angle > 1e-6 and abs(math.pi - angle) > 1e-6
        planar_seam = angle <= 1e-6
        claims = classify(edge)
        if not claims:
            raise RuntimeError("real native result edge lacks original BRep history support")
        evidence.append({
            "finalTopoDSEdgeOrdinal": index,
            "actualNativeTopoDSVertexOrdinals": vertex_ordinals,
            "nativeTopologicalEndpointJoinSource":
                "same-run-result-TopoDS-vertex-IsSame",
            "real3DModelMmEndpoints": xyz,
            "currentNativeResultEdgeHasExactlyTwoIncidentFaces": True,
            "currentNativeResultFaceOutwardNormals": normals,
            "currentNativeResultDihedralAngleRad": angle,
            "currentNativeResultPhysicalCreaseVerified": physical_crease,
            "currentNativeResultCoplanarSubdivisionVerified": planar_seam,
            "currentNativeResultFeatureStatus":
                "physical-crease" if physical_crease else (
                    "coplanar-subdivision" if planar_seam else
                    "undetermined-dihedral"),
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
    if not vertex_incident_edges or any(
        len(incident) < 2 for incident in vertex_incident_edges.values()
    ):
        raise RuntimeError("open or unaccounted native result BRep vertex incidence")
    final_vertex_evidence = []
    for vertex_ordinal, vertex in enumerate(final_vertices, 1):
        point = BRep_Tool.Pnt_s(TopoDS.Vertex_s(vertex))
        final_vertex_evidence.append({
            "actualNativeTopoDSVertexOrdinal": vertex_ordinal,
            "real3DModelMm": {
                "x": point.X(), "y": point.Y(), "z": point.Z()
            },
            "incidentFinalTopoDSEdgeOrdinals":
                sorted(vertex_incident_edges[vertex_ordinal]),
            "genuineTopoDSIsSameJunctionProven": True,
        })
    return {
        "schema": "draftai-independent-occt-boolean-topods-history-reference/1",
        "sourceRevision": data.get("revision"),
        "canonicalOriginalComponentGeometrySHA256": fingerprint,
        "sourceFingerprintScope": "ordered-ID-box-bounds-IEEE754-binary64-mm-v1",
        "actualNativeSourceBoxBoundsMm": [
            {"id": p["id"], "min": list(p["min"]), "max": list(p["max"])}
            for p in components
        ],
        "originalSourceIds": [p["id"] for p in components],
        "unit": "mm", "status": "valid-occt-boolean-history-reference-only",
        "resultFaceCount": len(unique(result_shape, TopAbs_FACE)),
        "resultEdgeCount": len(evidence),
        "resultVertexCount": len(final_vertices),
        "allFinalGeneratedEdgeEndpointsMappedToSameRunNativeTopoDSVertices": True,
        "allResultNativeVertexIncidenceAccountedFor": True,
        "resultVertexIncidence": final_vertex_evidence,
        "allResultEdgesHaveExactlyTwoRealNativeIncidentFaces": True,
        "certifiedNativePhysicalCreaseEdgeCount": sum(
            x["currentNativeResultPhysicalCreaseVerified"] for x in evidence),
        "certifiedNativeCoplanarSubdivisionEdgeCount": sum(
            x["currentNativeResultCoplanarSubdivisionVerified"] for x in evidence),
        "ambiguousNativeDihedralEdgeCount": sum(
            x["currentNativeResultFeatureStatus"] == "undetermined-dihedral"
            for x in evidence),
        "allResultEdgesHaveSameRunActualTopoDSHistorySupport": True,
        "resultEdgesWithDirectOriginalEdgeHistory": sum(
            x["exactOriginalTopoDSEdgeAncestry"] for x in evidence),
        "resultEdgesSupportedByOriginalFaceHistory": sum(
            x["atLeastOneOriginalFaceHistorySupport"] for x in evidence),
        "outputEdges": evidence,
        "sourceBooleanIntersectionFeatureTopologicallyAccountedFor": any(
            c["sourceKind"] == "face" and c["relation"] == "generated-original-face"
            for edge in evidence for c in edge["originalTopoDSHistory"]),
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
