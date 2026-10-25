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
