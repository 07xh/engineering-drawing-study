#!/usr/bin/env python3
"""Optional, offline, reproducible Open CASCADE B-Rep oracle (never production).
Requires Python cadquery-ocp 7.9.3.1.1 on a separate CAD QA machine.
Only independently samples finite lateral-lateral section B-Spline edges.
Does not certify a full line, tangent topology, caps, occlusion or V5.
Run: python scripts/cad/c3-occt-geometry-oracle.py > /tmp/c3-occ.json
"""
import importlib.metadata
import json
from OCP.gp import gp_Ax2, gp_Dir, gp_Pnt
from OCP.BRepPrimAPI import BRepPrimAPI_MakeCylinder
from OCP.BRepAlgoAPI import BRepAlgoAPI_Section
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_EDGE
from OCP.TopoDS import TopoDS
from OCP.BRepAdaptor import BRepAdaptor_Curve

BASE = {
    "kind": "finite-orthogonal-cylinder-intersection",
    "unit": "mm", "sourceConfirmed": True,
    "zCylinder": {"radius": 12, "xCenter": 0, "yCenter": 0,
                  "zMin": -18, "zMax": 18},
    "yCylinder": {"radius": 9, "xCenter": 2, "zCenter": 0,
                  "yMin": -17, "yMax": 17}
}

def one(label, capped):
    inp = json.loads(json.dumps(BASE))
    z, y = inp["zCylinder"], inp["yCylinder"]
    if capped:
        z["zMin"] = 0
        y["yMin"] = 0
    cyl_z = BRepPrimAPI_MakeCylinder(
        gp_Ax2(gp_Pnt(z["xCenter"], z["yCenter"], z["zMin"]),
               gp_Dir(0, 0, 1)),
        z["radius"], z["zMax"] - z["zMin"]).Shape()
    cyl_y = BRepPrimAPI_MakeCylinder(
        gp_Ax2(gp_Pnt(y["xCenter"], y["yMin"], y["zCenter"]),
               gp_Dir(0, 1, 0)),
        y["radius"], y["yMax"] - y["yMin"]).Shape()
    sec = BRepAlgoAPI_Section(cyl_z, cyl_y)
    sec.Build()
    if not sec.IsDone() or sec.Shape().IsNull():
        raise RuntimeError("Open CASCADE B-Rep section unavailable")
    edge = TopExp_Explorer(sec.Shape(), TopAbs_EDGE)
    pieces = []
    edge_count = 0
    while edge.More():
        crv = BRepAdaptor_Curve(TopoDS.Edge_s(edge.Current()))
        lo, hi = crv.FirstParameter(), crv.LastParameter()
        sample = []
        for i in range(12):
            pos = crv.Value(lo + (hi - lo) * (i + 0.5) / 12)
            sample.append({"x": pos.X(), "y": pos.Y(), "z": pos.Z()})
        residuals = [
            max(abs((p["x"] - z["xCenter"]) ** 2 +
                    (p["y"] - z["yCenter"]) ** 2 - z["radius"] ** 2),
                abs((p["x"] - y["xCenter"]) ** 2 +
                    (p["z"] - y["zCenter"]) ** 2 - y["radius"] ** 2))
            for p in sample
        ]
        if (max(residuals) < .005 and
            all(z["zMin"] - 1e-6 <= p["z"] <= z["zMax"] + 1e-6 and
                y["yMin"] - 1e-6 <= p["y"] <= y["yMax"] + 1e-6
                for p in sample)):
            pieces.append({
                "edgeIndex": edge_count,
                "curveType": str(crv.GetType()).split(".")[-1],
                "points": [[round(p[k], 9) for k in ("x", "y", "z")]
                           for p in sample],
                "maxSurfaceResidual": round(max(residuals), 9)
            })
        edge_count += 1
        edge.Next()
    if not pieces:
        raise RuntimeError("No finite lateral-lateral OCC section edges")
    return {
        "id": label, "input": inp, "sectionEdgeCount": edge_count,
        "selectedLateralSectionEdgeCount": len(pieces),
        "lateralEdges": pieces, "allCapFeaturesCovered": False
    }

output = {
    "schema": "draftai-c3-open-cascade-independent-lateral-section-oracle/1",
    "cadKernel": "Open CASCADE via cadquery-ocp " +
                 importlib.metadata.version("cadquery-ocp"),
    "generator": "optional OCP BRepAlgoAPI_Section synthetic geometry",
    "modelUnit": "mm",
    "oracleScope": "finite-lateral-lateral-section-sampled-edges-not-continuous-proof",
    "versionNote": "Regenerate only with optional development CAD Python environment; do not ship to frontend",
    "cases": [
        one("unequal-offset-full", False),
        one("unequal-offset-positive-caps", True)
    ]
}
print(json.dumps(output, sort_keys=True, separators=(",", ":")))
