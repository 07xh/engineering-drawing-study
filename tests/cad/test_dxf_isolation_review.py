import importlib.util
from pathlib import Path
import unittest

SCRIPT=Path(__file__).resolve().parents[2]/"tools"/"review_dxf_isolation.py"
spec=importlib.util.spec_from_file_location("review_dxf_isolation", SCRIPT)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.audit={"schema":"draftai-dxf-source-audit/1",
                    "files":[{"sha256":"abc123","layers":{"source":{"LINE":2},
                    "reference":{"ARC":1}}}]}
        self.decision={"source_sha256":"abc123","reviewer":"independent reviewer",
                       "evidence":"manual CAD inspection of original and answer sheets",
                       "layers":{"source":"given","reference":"reference"}}
    def test_review_never_grants_math_or_v5_acceptance(self):
        r=mod.review(self.audit,self.decision)
        self.assertEqual(r["status"],"reviewed")
        self.assertEqual(r["given_layers"],["source"])
        self.assertEqual(r["reference_layers"],["reference"])
        self.assertFalse(r["m3_accepted"])
        self.assertFalse(r["v5_accepted"])
        self.assertIsNone(r["reference_residual_mm"])
    def test_stale_fingerprint_is_rejected(self):
        self.decision["source_sha256"]="stale"
        with self.assertRaisesRegex(ValueError,"fingerprint"):
            mod.review(self.audit,self.decision)
    def test_missing_layer_is_rejected(self):
        del self.decision["layers"]["reference"]
        with self.assertRaisesRegex(ValueError,"every modelspace layer"):
            mod.review(self.audit,self.decision)
    def test_unknown_layer_blocks(self):
        self.decision["layers"]["reference"]="unknown"
        self.assertEqual(mod.review(self.audit,self.decision)["status"],"blocked")
    def test_no_given_blocks(self):
        self.decision["layers"]["source"]="reference"
        self.assertEqual(mod.review(self.audit,self.decision)["status"],"blocked")
    def test_no_reviewer_rejected(self):
        self.decision["reviewer"]=""
        with self.assertRaisesRegex(ValueError,"reviewer"):
            mod.review(self.audit,self.decision)

if __name__=="__main__":
    unittest.main()
