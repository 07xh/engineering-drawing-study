"""Independent REAL OCCT C1 skew-tetra source/HLR identity counterexamples.

The synthetic B vertex is NOT a textbook blind problem and does not claim to
reproduce the exact positive gaps reported by the separate OCJS WASM run.
These native TopoDS witnesses cannot certify M5 or authorize V5.
"""
import math
import unittest
from fractions import Fraction

from OCP.BRep import BRep_Tool
from OCP.BRepAdaptor import BRepAdaptor_Curve
from OCP.BRepBuilderAPI import (
    BRepBuilderAPI_MakeFace, BRepBuilderAPI_MakePolygon,
    BRepBuilderAPI_MakeSolid, BRepBuilderAPI_Sewing,
)
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepLib import BRepLib
from OCP.HLRAlgo import HLRAlgo_Projector
from OCP.HLRBRep import HLRBRep_Algo, HLRBRep_HLRToShape
from OCP.gp import gp_Ax2, gp_Dir, gp_Pnt
from OCP.TopAbs import TopAbs_EDGE, TopAbs_VERTEX
from OCP.TopExp import TopExp_Explorer
from OCP.TopoDS import TopoDS

POINTS = {'A': (0, 0, 0), 'B': (20, 1, 1),
          'C': (3, 16, 2), 'D': (5, 6, 23)}
FACES = [('A', 'C', 'B'), ('A', 'B', 'D'),
         ('A', 'D', 'C'), ('B', 'C', 'D')]
FRAMES = {'H': ((0, 0, -1), (1, 0, 0)),
          'W': ((-1, 0, 0), (0, 1, 0))}


def explore(shape, kind):
    iterator = TopExp_Explorer(shape, kind)
    result = []
    while iterator.More():
        result.append(iterator.Current())
        iterator.Next()
    return result


def coords(vertex):
    p = BRep_Tool.Pnt_s(TopoDS.Vertex_s(vertex))
    return (p.X(), p.Y(), p.Z())


def build_solid():
    sewing = BRepBuilderAPI_Sewing(1e-9)
    for ring in FACES:
        wire = BRepBuilderAPI_MakePolygon()
        for key in ring:
            wire.Add(gp_Pnt(*POINTS[key]))
        wire.Close()
        sewing.Add(BRepBuilderAPI_MakeFace(wire.Wire()).Face())
    sewing.Perform()
    solid = BRepBuilderAPI_MakeSolid(TopoDS.Shell_s(sewing.SewedShape())).Solid()
    if not BRepLib.OrientClosedSolid_s(solid) or not BRepCheck_Analyzer(solid).IsValid():
        raise AssertionError('real native tetrahedron not a valid closed solid')
    return solid


def original_edges(solid):
    edges = []
    for shape in explore(solid, TopAbs_EDGE):
        edge = TopoDS.Edge_s(shape)
        if not any(edge.IsSame(other) for other in edges):
            edges.append(edge)
    return edges


def original_source(edges, name):
    matches = []
    for edge in edges:
        ids = [min(POINTS, key=lambda k: math.dist(POINTS[k], coords(v)))
               for v in explore(edge, TopAbs_VERTEX)]
        if len(ids) == 2 and set(ids) == set(name):
            matches.append(edge)
    if len(matches) != 1:
        raise AssertionError('nonunique real original TopoDS source')
    return matches[0]


def hlr_generated(solid, view):
    camera, xdir = FRAMES[view]
    algo = HLRBRep_Algo()
    algo.Add(solid)
    algo.Projector(HLRAlgo_Projector(gp_Ax2(
        gp_Pnt(0, 0, 0), gp_Dir(*camera), gp_Dir(*xdir))))
    algo.Update()
    algo.Hide()
    output = HLRBRep_HLRToShape(algo)
    edges = []
    for shape in (output.VCompound(), output.HCompound()):
        edges.extend(TopoDS.Edge_s(e) for e in explore(shape, TopAbs_EDGE))
    return edges


class NativeC1GapTopoDSIdentity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.solid = build_solid()
        cls.original = original_edges(cls.solid)

    def test_real_original_topods_source_curve_not_paper_candidate(self):
        self.assertEqual(len(self.original), 6)
        for name in (('A', 'C'), ('A', 'D')):
            edge = original_source(self.original, name)
            curve = BRepAdaptor_Curve(edge)
            self.assertGreater(curve.LastParameter(), curve.FirstParameter())
            self.assertAlmostEqual(curve.LastParameter() - curve.FirstParameter(),
                                   math.dist(POINTS[name[0]], POINTS[name[1]]),
                                   places=12)
            first = curve.Value(curve.FirstParameter())
            last = curve.Value(curve.LastParameter())
            actual = [(first.X(), first.Y(), first.Z()),
                      (last.X(), last.Y(), last.Z())]
            self.assertEqual({tuple(round(v, 9) for v in p) for p in actual},
                             {POINTS[name[0]], POINTS[name[1]]})

    def test_generated_hlr_edges_and_vertices_do_not_inherit_original_issame(self):
        for view, name in [('H', ('A', 'C')),
                           ('W', ('A', 'C')),
                           ('W', ('A', 'D'))]:
            with self.subTest(view=view, source=name):
                source = original_source(self.original, name)
                original_vertices = explore(source, TopAbs_VERTEX)
                generated = hlr_generated(self.solid, view)
                self.assertGreater(len(generated), 0)
                self.assertFalse(any(edge.IsSame(source) for edge in generated))
                near_a = []
                for edge in generated:
                    for vertex in explore(edge, TopAbs_VERTEX):
                        x, y, _ = coords(vertex)
                        paper = (x, -y)
                        if math.dist(paper, (0, 0)) <= 1e-12:
                            near_a.append((vertex, paper))
                self.assertTrue(near_a)
                self.assertFalse(any(vertex.IsSame(v) for vertex, _ in near_a
                                     for v in original_vertices))
                self.assertTrue(any(p != (0, 0) for _, p in near_a))

    def test_exact_dyadic_transverse_paper_drift_is_not_source_history(self):
        generated = hlr_generated(self.solid, 'W')
        found = False
        for edge in generated:
            for vertex in explore(edge, TopAbs_VERTEX):
                x, y, _ = coords(vertex)
                paper = (Fraction.from_float(x), Fraction.from_float(-y))
                if 0 < paper[0] < Fraction(1, 10**12) and paper[1] == 0:
                    # Original W A-C paper vector is (16,-2).
                    cross = Fraction(16) * paper[1] + Fraction(2) * paper[0]
                    self.assertGreater(cross, 0)
                    found = True
        self.assertTrue(found, 'expected real noncollinear near-A W HLR endpoint')


    def test_native_source_scoped_hlr_matches_global_paper_not_global_identity(self):
        # VCompound(original TopoDS edge) is real source-scoped extraction.
        # Its generated edge is NEW even if whole-solid paper coordinates match.
        for view, name, visible in [
            ('H', ('A', 'C'), True),
            ('H', ('A', 'D'), False),
            ('W', ('A', 'C'), True),
            ('W', ('A', 'D'), True),
        ]:
            with self.subTest(view=view, source=name):
                camera, xdir = FRAMES[view]
                algo = HLRBRep_Algo()
                algo.Add(self.solid)
                algo.Projector(HLRAlgo_Projector(gp_Ax2(
                    gp_Pnt(0, 0, 0), gp_Dir(*camera), gp_Dir(*xdir))))
                algo.Update()
                algo.Hide()
                extractor = HLRBRep_HLRToShape(algo)
                source = original_source(self.original, name)
                scoped_shape = (extractor.VCompound(source) if visible
                                else extractor.HCompound(source))
                global_shape = (extractor.VCompound() if visible
                                else extractor.HCompound())
                scoped = [TopoDS.Edge_s(e) for e in explore(scoped_shape, TopAbs_EDGE)]
                global_edges = [TopoDS.Edge_s(e)
                                for e in explore(global_shape, TopAbs_EDGE)]
                self.assertEqual(len(scoped), 1)
                self.assertGreater(len(global_edges), 0)

                def paper(edge):
                    return sorted((coords(v)[0], coords(v)[1])
                                  for v in explore(edge, TopAbs_VERTEX))

                for edge in scoped:
                    self.assertTrue(any(paper(edge) == paper(other)
                                        for other in global_edges))
                    self.assertFalse(any(edge.IsSame(other)
                                         for other in global_edges))
                    self.assertFalse(edge.IsSame(source))
        # Negative control: A-D is hidden, not visible, in H.
        camera, xdir = FRAMES['H']
        algo = HLRBRep_Algo()
        algo.Add(self.solid)
        algo.Projector(HLRAlgo_Projector(gp_Ax2(
            gp_Pnt(0, 0, 0), gp_Dir(*camera), gp_Dir(*xdir))))
        algo.Update()
        algo.Hide()
        extractor = HLRBRep_HLRToShape(algo)
        self.assertFalse(explore(
            extractor.VCompound(original_source(self.original, ('A', 'D'))),
            TopAbs_EDGE))


    def test_first_angle_native_edgestatus_parameter_bounds(self):
        """Real +Z H / +X W observer rays, not the opposite-camera controls.

        OCP returns Bounds(tolStart,tolEnd) and VisiblePart(index,tolStart,
        tolEnd) as pairs. A source-scoped 3D interval is not generated 2D
        TopoDS history and cannot sign an M5 line or a V5 action.
        """
        first_angle = {'H': ((0, 0, 1), (1, 0, 0)),
                       'W': ((1, 0, 0), (0, 1, 0))}
        for view, (camera, xdir) in first_angle.items():
            with self.subTest(view=view):
                algo = HLRBRep_Algo()
                algo.Add(self.solid)
                algo.Projector(HLRAlgo_Projector(gp_Ax2(
                    gp_Pnt(0, 0, 0), gp_Dir(*camera), gp_Dir(*xdir))))
                algo.Update()
                algo.Hide()
                ds = algo.DataStructure()
                edge_map, statuses = ds.EdgeMap(), ds.EDataArray()
                self.assertEqual(edge_map.Extent(), len(self.original))
                self.assertLessEqual(statuses.Lower(), 1)
                self.assertGreaterEqual(statuses.Upper(), edge_map.Extent())
                for name in (('A', 'C'), ('A', 'D')):
                    with self.subTest(source=name):
                        source = original_source(self.original, name)
                        indices = [i for i in range(1, edge_map.Extent() + 1)
                                   if TopoDS.Edge_s(edge_map.FindKey(i)).IsSame(source)]
                        self.assertEqual(len(indices), 1)
                        status = statuses.Value(indices[0]).Status()
                        bounds = status.Bounds(0.0, 0.0)
                        curve = BRepAdaptor_Curve(source)
                        self.assertEqual(bounds, (curve.FirstParameter(),
                                                  curve.LastParameter()))
                        self.assertGreater(bounds[1], bounds[0])
                        parts = [status.VisiblePart(j, 0.0, 0.0)
                                 for j in range(1, status.NbVisiblePart() + 1)]
                        self.assertTrue(all(bounds[0] <= lo < hi <= bounds[1]
                                            for lo, hi in parts))
                        self.assertTrue(all(parts[j - 1][1] <= parts[j][0]
                                            for j in range(1, len(parts))))
                        if status.AllVisible():
                            self.assertEqual(parts, [bounds])
                        if status.AllHidden():
                            self.assertEqual(parts, [])

    def test_first_angle_full_original_status_does_not_close_generated_w_paper(self):
        """Real native counterexamples to status-only source/HLR signoff.

        W/A-C has a strictly positive dyadic terminal paper residual even
        though the native original source is fully visible. W/A-D has a
        generated endpoint strictly off its original W paper line. These
        are different failures; neither may be snapped, rounded away or
        upgraded to original-to-generated TopoDS history / official V5.
        """
        camera, xdir = (1, 0, 0), (0, 1, 0)
        algo = HLRBRep_Algo()
        algo.Add(self.solid)
        algo.Projector(HLRAlgo_Projector(gp_Ax2(
            gp_Pnt(0, 0, 0), gp_Dir(*camera), gp_Dir(*xdir))))
        algo.Update()
        algo.Hide()
        ds = algo.DataStructure()
        extractor = HLRBRep_HLRToShape(algo)
        for name in (('A', 'C'), ('A', 'D')):
            with self.subTest(source=name):
                source = original_source(self.original, name)
                indices = [i for i in range(1, ds.EdgeMap().Extent() + 1)
                           if TopoDS.Edge_s(ds.EdgeMap().FindKey(i)).IsSame(source)]
                self.assertEqual(len(indices), 1)
                status = ds.EDataArray().Value(indices[0]).Status()
                curve = BRepAdaptor_Curve(source)
                original_bounds = (curve.FirstParameter(), curve.LastParameter())
                self.assertTrue(status.AllVisible())
                self.assertFalse(status.AllHidden())
                self.assertEqual(status.Bounds(0.0, 0.0), original_bounds)
                self.assertEqual(status.NbVisiblePart(), 1)
                self.assertEqual(status.VisiblePart(1, 0.0, 0.0), original_bounds)
                generated = [TopoDS.Edge_s(edge) for edge in
                             explore(extractor.VCompound(source), TopAbs_EDGE)]
                self.assertEqual(len(generated), 1)
                paper = [(Fraction.from_float(coords(vertex)[0]),
                          Fraction.from_float(coords(vertex)[1]))
                         for vertex in explore(generated[0], TopAbs_VERTEX)]
                self.assertEqual(len(paper), 2)
                start = (Fraction(POINTS['A'][1]), Fraction(POINTS['A'][2]))
                end = (Fraction(POINTS[name[1]][1]),
                       Fraction(POINTS[name[1]][2]))
                if name == ('A', 'C'):
                    terminal = min(paper, key=lambda p: abs(p[0] - end[0]))
                    t = (terminal[0] - start[0]) / (end[0] - start[0])
                    self.assertGreater(t, 0)
                    self.assertLess(t, 1)
                    self.assertEqual(Fraction(1) - t,
                                     Fraction(1, 9007199254740992))
                    # The endpoint is on the source's exact paper line,
                    # but its positive terminal interval is still missing.
                    cross = ((end[0] - start[0]) * (terminal[1] - start[1]) -
                             (end[1] - start[1]) * (terminal[0] - start[0]))
                    self.assertEqual(cross, 0)
                else:
                    near_a = min(paper, key=lambda p: abs(p[0] - start[0]))
                    cross = ((end[0] - start[0]) * (near_a[1] - start[1]) -
                             (end[1] - start[1]) * (near_a[0] - start[0]))
                    self.assertEqual(cross, Fraction(-23, 1125899906842624))
                    # Off-line paper drift cannot become a native source
                    # interval by a single-axis inverse parameter.
                    self.assertNotEqual(cross, 0)

    def test_opposite_camera_status_is_not_first_angle_source_evidence(self):
        """Negative control: reversing W camera changes a real source class.

        The legacy opposite-camera HLR identity experiments must not be
        silently substituted for the pinned first-angle WASM/M5 evidence.
        """
        source = original_source(self.original, ('B', 'C'))
        classes = []
        for camera in ((1, 0, 0), (-1, 0, 0)):
            algo = HLRBRep_Algo()
            algo.Add(self.solid)
            algo.Projector(HLRAlgo_Projector(gp_Ax2(
                gp_Pnt(0, 0, 0), gp_Dir(*camera), gp_Dir(0, 1, 0))))
            algo.Update()
            algo.Hide()
            ds = algo.DataStructure()
            indices = [i for i in range(1, ds.EdgeMap().Extent() + 1)
                       if TopoDS.Edge_s(ds.EdgeMap().FindKey(i)).IsSame(source)]
            self.assertEqual(len(indices), 1)
            status = ds.EDataArray().Value(indices[0]).Status()
            classes.append((status.AllVisible(), status.AllHidden(),
                            status.NbVisiblePart()))
        self.assertNotEqual(classes[0], classes[1])

if __name__ == '__main__':
    unittest.main()
