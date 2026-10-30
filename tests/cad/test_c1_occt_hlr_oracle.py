"""Independent local/opt-in CI OCCT CAD HLR oracle vs C1 current M5.

Runs with the real CAD engine; no fake or monkeypatched B-Rep/HLR results.
These tests deliberately cannot sign SolveResult, engineering line style or V5.
"""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "tools/cad-oracle/occt_c1_hlr.py"
spec = importlib.util.spec_from_file_location("draftai_occt_c1_oracle", SCRIPT)
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)


class C1CADOracleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        raw = subprocess.run(
            ["node", str(ROOT / "tools/cad-oracle/export-c1-cases.cjs")],
            cwd=ROOT, check=True, capture_output=True, text=True
        ).stdout
        cls.corpus = json.loads(raw)
        assert cls.corpus["schema"] == "draftai-c1-occt-offline-cases/1"
        assert len(cls.corpus["cases"]) == 6

    def test_18_genuine_hlr_view_comparisons_are_read_only(self):
        cases = self.corpus["cases"]
        results = [oracle.cross_check(item) for item in cases]
        self.assertEqual(len(results), 6)
        self.assertTrue(any(row["id"] == "C1Tetrahedron" for row in results))
        self.assertTrue(all(row["occtBRepValid"] and row["occtVolumeMm3"] > 0
                            for row in results))
        self.assertEqual(results[0]["independentlyCoveredSignedV5ActionCount"], 12)
        self.assertTrue(all(
            row["independentlyCoveredSignedV5ActionCount"] == 0
            for row in results[1:]
        ))
        for row in results:
            self.assertEqual(set(row["views"]), {"V", "H", "W"})
            for v in row["views"].values():
                self.assertGreater(v["occtVisibleHLREdgeCount"], 0)
                source = v["independentOriginalHLRSourceStatus"]
                self.assertTrue(source["nativeOriginalSourceEdgeMapBijectionVerified"])
                self.assertTrue(source["nativeOriginalCurveParameterPartitionVerified"])
                self.assertTrue(source["nativeOriginalBRepCurveAndHLREdgeStatusConcordanceVerified"])
                self.assertTrue(source["sourceScopedGeneratedHLRClassCorroborated"])
                # Actual global-vs-original-scoped identity is measured from
                # one live native HLR engine. Identical paper coordinates do
                # not create TopoDS.IsSame identity or authorize M5.
                self.assertGreater(source["wholeSolidGeneratedVisibleEdgeCount"], 0)
                self.assertGreaterEqual(source["wholeSolidGeneratedHiddenEdgeCount"], 0)
                native_links = 0
                paper_holds = 0
                for original in source["rows"]:
                    for match in original["sourceScopedToWholeSolidGeneratedHLREdges"]:
                        self.assertIn(match["hlrClass"], ("visible", "hidden"))
                        self.assertGreater(match["sourceScopedOrdinal"], 0)
                        self.assertTrue(match["paperOnlyCorrespondenceDoesNotProveNativeIdentity"])
                        # Real same-run source-filtered paper geometry is
                        # compared to the original 3D source by exact
                        # rational binary64 coordinates, not a tolerance.
                        affine = match["exactReceivedBinary64SourceScopedHLRPaperWitness"]
                        if affine is not None:
                            self.assertFalse(affine["generated2DTopoDSHistoryCertified"])
                            self.assertFalse(affine["signedV5Action"])
                            self.assertEqual(
                                affine["originalFullSourcePaperCoverageProven"],
                                not affine["projectedOriginalSourceCollapsedToPoint"] and
                                not affine["exactTransversePaperDriftDetected"] and
                                not affine["exactLongitudinalPaperSourceGapDetected"] and
                                all(p["insideOriginalUnitParameterDomain"]
                                    for p in affine["exactReceivedEndpointAffineWitnesses"])
                            )
                        self.assertTrue(set(match["sameGlobalGeneratedTopoDSOrdinals"])
                                        <= set(match["exactPaperGlobalGeneratedOrdinals"]))
                        if match["uniqueRealNativeGlobalSourceLink"]:
                            self.assertTrue(match["causalGlobalGeneratedTopoDSIdentityCertified"])
                            self.assertTrue(match["globallyUniqueExactPaperSourceCandidate"])
                            self.assertEqual(len(match["sameGlobalGeneratedTopoDSOrdinals"]), 1)
                            native_links += 1
                        if not match["globallyUniqueExactPaperSourceCandidate"]:
                            paper_holds += 1
                self.assertEqual(native_links, source["uniqueSameTopoDSGlobalSourceScopedEdgeLinks"])
                # Native EdgeMap-indexed ORIGINAL source filters plus a
                # complete whole-solid HLR output give an independently
                # auditable source-ownership bijection, not IsSame/history.
                bijection = source["exhaustiveSameRunNativeGlobalSourceFilterBijection"]
                self.assertTrue(bijection[
                    "originalTopoDSInputIndexedBeforeSourceFilteringRequired"])
                self.assertTrue(bijection[
                    "nativeGlobalSourceFilterAttributionOnlyNotGeneratedShapeIsSame"])
                self.assertFalse(bijection[
                    "original3DCurveToGenerated2DSubparameterHistoryCertified"])
                self.assertFalse(bijection["allSceneContinuousOcclusionCertified"])
                self.assertFalse(bijection["formalM5Authorized"])
                self.assertEqual(bijection["signedV5ActionCount"], 0)
                if bijection["exactSameRunCompleteUniqueSourceFilterPaperBijectionProven"]:
                    self.assertEqual(
                        bijection["wholeSolidGeneratedEdges"],
                        bijection["sourceScopedGeneratedEdges"])
                    self.assertEqual(
                        len(bijection["attributedGlobalGeneratedEdges"]),
                        bijection["wholeSolidGeneratedEdges"])
                    self.assertEqual(
                        len({(x["hlrClass"], x["wholeSolidGeneratedHLREdgeOrdinal"])
                             for x in bijection["attributedGlobalGeneratedEdges"]}),
                        bijection["wholeSolidGeneratedEdges"])
                    self.assertEqual(bijection[
                        "unresolvedGlobalSourceFilterAttributionRows"], [])
                    self.assertTrue(all(
                        x["sourceFilterProducesExactSameReceivedBinary64Paper"] and
                        not x["completeGeneratedTopoDSParameterHistoryCertified"] and
                        not x["signedV5Action"]
                        for x in bijection["attributedGlobalGeneratedEdges"]))
                self.assertEqual(paper_holds,
                                 source["ambiguousOrUnmatchedGlobalPaperSourceCandidates"])
                self.assertFalse(source["generated2DTopoDSEdgeHistoryCertified"])
                self.assertFalse(source["formalM5LineStyleAuthorized"])
                self.assertEqual(source["originalBRepSourcesChecked"], len(source["rows"]))
                self.assertEqual(
                    len({x["nativeHLROriginalEdgeMapIndex"] for x in source["rows"]}),
                    len(source["rows"])
                )
                for edge in source["rows"]:
                    lo, hi = edge["originalCurveParameterBounds"]
                    self.assertTrue(edge["nativeOriginalTopoDSCurveTypeLineAndHLRParameterDomainVerified"])
                    self.assertTrue(edge["nativeOriginalBRepCurveAndEdgeStatusShareExactParameterDomain"])
                    self.assertLessEqual(edge["nativeOriginalBRep3DEndpointResidualMm"], 1e-9)
                    self.assertLessEqual(edge["nativeOriginalBRep3DMidpointResidualMm"], 1e-9)
                    pieces = sorted(edge["visibleOriginalCurveParameterIntervals"] +
                                    edge["hiddenOriginalCurveParameterIntervals"])
                    self.assertEqual(pieces[0][0], lo)
                    self.assertEqual(pieces[-1][1], hi)
                    self.assertTrue(all(a[1] == b[0]
                                        for a, b in zip(pieces, pieces[1:])))
                    self.assertFalse(edge["generated2DTopoDSEdgeHistoryCertified"])
                    self.assertFalse(edge["wholeSceneContinuousOcclusionCertified"])
                    self.assertFalse(edge["signedV5Action"])
                    self.assertIn(edge["singleGeneratedFullEdgePaperEndpointsExactlyEqualOriginalM0"], (None, True, False))
                self.assertTrue(v["hullVerticesAgreement"])
                self.assertTrue(v["hullAreasAgreement"])
                self.assertTrue(v["occtVisibleHLRCoversWholeM5Hull"])
                self.assertLessEqual(v["maxSourceSideUncoveredFraction"], 1e-6)
                self.assertTrue(v["occtVisibleHLRCoversAllSignedScopedV5Actions"])
                self.assertLessEqual(v["maxSignedV5ActionUncoveredFraction"], 1e-6)
        # Counts and coverage evidence are allowed; never return action
        # payloads or claim CAD has signed an engineering line style.
        self.assertFalse(any("signedVisibleContourActions" in str(r) or
                             "officialLineStyle" in str(r) for r in results))

    def test_generated_global_source_ownership_rejects_duplicate_scoped_claims(self):
        # The adversary can claim a generated HLR edge twice using the SAME
        # original source ID; a set-of-source-IDs would silently erase that.
        claim = ("visible", 3)
        good = {claim: [("A|C", 1)]}
        self.assertTrue(oracle.unique_global_generated_edge_claim(
            good, "visible", 3, "A|C", 1))
        for forged in (
            {claim: [("A|C", 1), ("A|C", 1)]},
            {claim: [("A|C", 1), ("A|D", 1)]},
            {claim: [("A|C", 2)]},
            {},
        ):
            self.assertFalse(oracle.unique_global_generated_edge_claim(
                forged, "visible", 3, "A|C", 1))
        # Paper correspondence never grants native 2D TopoDS identity.
        self.assertFalse(oracle.unique_global_generated_edge_claim(
            good, "hidden", 3, "A|C", 1))

    def test_skew_tetra_w_positive_paper_tails_are_not_original_hlr_source_gaps(self):
        # Public synthetic regression: OCCT's received W paper endpoints
        # drift in binary64, but the internal ORIGINAL EdgeStatus still
        # contains the complete positive 3D source curve for A|C and A|D.
        # This does not authorize generated TopoDS lineage, M5 or V5.
        points = {"A": (0, 0, 0), "B": (17, 1, 3),
                  "C": (3, 16, 2), "D": (5, 6, 23)}
        faces = [["A", "C", "B"], ["A", "B", "D"],
                 ["A", "D", "C"], ["B", "C", "D"]]
        edges = sorted({tuple(sorted((face[i], face[(i + 1) % len(face)])))
                        for face in faces for i in range(len(face))})
        case = {"id": "C1SkewTetra", "geometry": {"data": {
            "points": {k: dict(zip(("x", "y", "z"), v))
                       for k, v in points.items()},
            "faces": faces, "edges": [list(edge) for edge in edges]
        }}}
        witness = oracle.audit_original_hlr_source_status(case, "W")
        self.assertEqual(witness["originalBRepSourcesChecked"], 6)
        self.assertEqual(witness["nativeOriginalSourcesAllVisible"], 6)
        by_source = {r["sourceEdgeId"]: r for r in witness["rows"]}
        for source in ("A|C", "A|D"):
            row = by_source["C1SkewTetra::" + source]
            self.assertEqual(row["visibleOriginalCurveParameterIntervals"],
                             [row["originalCurveParameterBounds"]])
            self.assertEqual(row["hiddenOriginalCurveParameterIntervals"], [])
            self.assertTrue(row["nativeOriginalBRepCurveAndEdgeStatusShareExactParameterDomain"])
            self.assertEqual(row["nativeOriginalBRep3DEndpointResidualMm"], 0)
            self.assertEqual(row["nativeOriginalBRep3DMidpointResidualMm"], 0)
            self.assertGreater(row["sourceScopedGeneratedVisibleEdgeCount"], 0)
            self.assertFalse(row["generated2DTopoDSEdgeHistoryCertified"])
            self.assertFalse(row["wholeSceneContinuousOcclusionCertified"])
            self.assertFalse(row["singleGeneratedFullEdgePaperEndpointsExactlyEqualOriginalM0"])
            matches = row["sourceScopedToWholeSolidGeneratedHLREdges"]
            self.assertEqual(len(matches), 1)
            affine = matches[0]["exactReceivedBinary64SourceScopedHLRPaperWitness"]
            self.assertFalse(affine["projectedOriginalSourceCollapsedToPoint"])
            self.assertFalse(affine["originalFullSourcePaperCoverageProven"])
            self.assertFalse(affine["generated2DTopoDSHistoryCertified"])
            self.assertFalse(affine["signedV5Action"])
            if source == "A|C":
                self.assertFalse(affine["exactTransversePaperDriftDetected"])
                self.assertTrue(affine["exactLongitudinalPaperSourceGapDetected"])
                self.assertEqual(affine["exactDominantAxisUncoveredPositiveSourceSubranges"],
                                 [["9007199254740991/9007199254740992", "1"]])
                self.assertTrue(all(p["exactlyCollinearWithOriginalProjectedSource"]
                                    for p in affine["exactReceivedEndpointAffineWitnesses"]))
            else:
                self.assertTrue(affine["exactTransversePaperDriftDetected"])
                self.assertFalse(affine["exactLongitudinalPaperSourceGapDetected"])
                self.assertEqual(affine["exactDominantAxisUncoveredPositiveSourceSubranges"], [])
                self.assertTrue(any(p["exactOriginalProjectionLineCrossResidual"] != "0"
                                    for p in affine["exactReceivedEndpointAffineWitnesses"]))
        self.assertTrue(witness[
            "exhaustiveSameRunNativeGlobalSourceFilterBijection"
        ]["exactSameRunCompleteUniqueSourceFilterPaperBijectionProven"])
        self.assertEqual(witness[
            "exhaustiveSameRunNativeGlobalSourceFilterBijection"
        ]["wholeSolidGeneratedEdges"], 6)
        forged = copy.deepcopy(case)
        forged["geometry"]["data"]["edges"][0] = ["A", "D"]
        with self.assertRaisesRegex(ValueError, "missing original edge|duplicates"):
            oracle.audit_original_hlr_source_status(forged, "W")

    def test_exact_source_scoped_paper_affine_rejects_transverse_and_one_ulp_gaps(self):
        audit = oracle.exact_binary64_source_scoped_hlr_paper_witness
        exact = audit((0, 0), (16, 2), (0, 0), (16, 2))
        self.assertTrue(exact["originalFullSourcePaperCoverageProven"])
        self.assertFalse(exact["signedV5Action"])
        near = audit((0, 0), (16, 2), (0, 0),
                     (15.999999999999998, 1.9999999999999998))
        self.assertTrue(near["exactLongitudinalPaperSourceGapDetected"])
        self.assertFalse(near["exactTransversePaperDriftDetected"])
        self.assertFalse(near["originalFullSourcePaperCoverageProven"])
        transverse = audit((0, 0), (6, 23), (8.881784197001252e-16, 0),
                           (6, 23))
        self.assertTrue(transverse["exactTransversePaperDriftDetected"])
        self.assertFalse(transverse["exactLongitudinalPaperSourceGapDetected"])
        self.assertFalse(transverse["originalFullSourcePaperCoverageProven"])
        # Complete dominant-axis coverage does not excuse transverse error.
        off_line = audit((0, 0), (16, 2), (0, 0), (16, 3))
        self.assertTrue(off_line["exactTransversePaperDriftDetected"])
        self.assertFalse(off_line["originalFullSourcePaperCoverageProven"])
        collapsed = audit((0, 0), (0, 0), (0, 0), (0, 0))
        self.assertTrue(collapsed["projectedOriginalSourceCollapsedToPoint"])
        self.assertFalse(collapsed["originalFullSourcePaperCoverageProven"])
        for forged in ((float("nan"), 0), (float("inf"), 0)):
            with self.assertRaisesRegex(ValueError, "finite"):
                audit((0, 0), (16, 2), forged, (16, 2))

    def test_native_global_original_source_bijection_requires_exact_unique_complete_match(self):
        fn = oracle.audit_exhaustive_native_hlr_global_source_filter_bijection
        a = ((0.0, 0.0, 0.0), (16.0, 2.0, 0.0))
        b = ((0.0, 0.0, 0.0), (6.0, 23.0, 0.0))
        global_paper = {"visible": [a, b], "hidden": []}
        claims = [
            {"hlrClass": "visible", "sourceScopedOrdinal": 1,
             "originalSourceEdgeId": "A|C", "originalEdgeMapIndex": 1,
             "paper": a},
            {"hlrClass": "visible", "sourceScopedOrdinal": 1,
             "originalSourceEdgeId": "A|D", "originalEdgeMapIndex": 2,
             "paper": b},
        ]
        good = fn(global_paper, claims)
        self.assertTrue(good["exactSameRunCompleteUniqueSourceFilterPaperBijectionProven"])
        self.assertEqual(good["wholeSolidGeneratedEdges"], 2)
        self.assertEqual(len(good["attributedGlobalGeneratedEdges"]), 2)
        self.assertFalse(good["original3DCurveToGenerated2DSubparameterHistoryCertified"])
        self.assertFalse(good["formalM5Authorized"])
        self.assertEqual(good["signedV5ActionCount"], 0)
        # A repeated genuine source-scoped ordinal is a malformed
        # inventory and must be REJECTED (not merely marked ambiguous).
        with self.assertRaisesRegex(ValueError, "duplicated"):
            fn(global_paper, [claims[0], claims[0]])
        for forged in (
            claims[:1],
            [{**claims[0], "hlrClass": "hidden"}, claims[1]],
            [claims[0], {**claims[1], "paper": a}],
            [claims[0], {**claims[1], "paper":
                         ((0.0, 0.0, 0.0), (6.0, 23.0 + 2**-48, 0.0))}],
        ):
            witness = fn(global_paper, forged)
            self.assertFalse(witness[
                "exactSameRunCompleteUniqueSourceFilterPaperBijectionProven"])
            self.assertEqual(witness["attributedGlobalGeneratedEdges"], [])
            self.assertFalse(witness["formalM5Authorized"])
        # Repeating a global generated edge cannot manufacture a unique
        # global edge ordinal even if the paper geometries are identical.
        dup = fn({"visible": [a, a], "hidden": []},
                 [claims[0], {**claims[0], "sourceScopedOrdinal": 2}])
        self.assertFalse(dup["exactSameRunCompleteUniqueSourceFilterPaperBijectionProven"])
        with self.assertRaisesRegex(ValueError, "duplicated"):
            fn(global_paper, [claims[0], claims[0], claims[1]])

    def test_source_face_deletion_is_refused(self):
        x = copy.deepcopy(self.corpus["cases"][0])
        x["geometry"]["data"]["faces"].pop()
        with self.assertRaisesRegex(ValueError, "nonmanifold|open"):
            oracle.cross_check(x)

    def test_forged_m5_hull_side_endpoint_is_refused(self):
        x = copy.deepcopy(self.corpus["cases"][0])
        x["reference"]["V"]["boundarySides"][0]["to"]["u"] += 3
        with self.assertRaisesRegex(ValueError, "not joined"):
            oracle.cross_check(x)

    def test_translation_of_complete_m5_paper_reference_does_not_fake_occt_agreement(self):
        x = copy.deepcopy(self.corpus["cases"][0])
        for side in x["reference"]["V"]["boundarySides"]:
            side["from"]["u"] += 3
            side["to"]["u"] += 3
        with self.assertRaisesRegex(ValueError, "disagrees"):
            oracle.cross_check(x)

    def test_signed_original_v5_source_edge_forgery_is_refused(self):
        x = copy.deepcopy(self.corpus["cases"][0])
        assert len(x["signedVisibleContourActions"]) == 12
        x["signedVisibleContourActions"][0]["sourceEdgeId"] = x["id"] + "::fake|edge"
        with self.assertRaisesRegex(ValueError, "authentic unique"):
            oracle.cross_check(x)

    def test_signed_v5_contour_coordinate_forgery_is_refused(self):
        x = copy.deepcopy(self.corpus["cases"][0])
        x["signedVisibleContourActions"][0]["to"]["v"] += 0.01
        with self.assertRaisesRegex(ValueError, "does not lie"):
            oracle.cross_check(x)

    def test_duplicate_signed_action_identity_is_refused(self):
        x = copy.deepcopy(self.corpus["cases"][0])
        x["signedVisibleContourActions"][1]["actionId"] = (
            x["signedVisibleContourActions"][0]["actionId"]
        )
        with self.assertRaisesRegex(ValueError, "authentic unique"):
            oracle.cross_check(x)

    def test_nonfinite_source_and_wrong_units_are_refused(self):
        x = copy.deepcopy(self.corpus["cases"][0])
        x["geometry"]["data"]["points"][next(iter(x["geometry"]["data"]["points"]))]["x"] = float("nan")
        with self.assertRaisesRegex(ValueError, "finite"):
            oracle.cross_check(x)
        x = copy.deepcopy(self.corpus["cases"][0])
        x["geometry"]["unit"] = "cm"
        with self.assertRaisesRegex(ValueError, "millimetres"):
            oracle.cross_check(x)


if __name__ == "__main__":
    unittest.main()
