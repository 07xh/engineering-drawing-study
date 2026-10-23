"""DXF audit security regressions, using a stub decoder (no ezdxf dependency in CI)."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[2] / "tools" / "audit_dxf_source.py"
spec = importlib.util.spec_from_file_location("audit_dxf_source", SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class Entity:
    def __init__(self, layer, kind):
        self.dxf = types.SimpleNamespace(layer=layer)
        self.kind = kind
    def dxftype(self):
        return self.kind

class DXF:
    dxfversion = "AC1027"
    header = {"$INSUNITS": 4}
    blocks = [types.SimpleNamespace(name="SOURCE_BLOCK"),
              types.SimpleNamespace(name="*MODEL_SPACE")]
    def modelspace(self):
        return [Entity("题目", "LINE"), Entity("答案", "ARC"),
                Entity("题目", "DIMENSION")]

class AuditTests(unittest.TestCase):
    def test_dwg_cannot_be_falsely_accepted_as_dxf(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "original.dwg"
            path.write_bytes(b"AC1018" + bytes(64))
            with patch.dict(sys.modules, {"ezdxf": types.SimpleNamespace(readfile=lambda p: self.fail("decoder called"))}):
                with self.assertRaisesRegex(ValueError, "not a DXF"):
                    audit.audit(path)

    def test_all_layers_remain_untrusted_even_if_named_given(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "export.dxf"
            path.write_bytes(b"0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF\n")
            with patch.dict(sys.modules, {"ezdxf": types.SimpleNamespace(readfile=lambda p: DXF())}):
                result = audit.audit(path)
            self.assertEqual(result["modelspace_entity_count"], 3)
            self.assertEqual(result["layers"]["题目"]["DIMENSION"], 1)
            self.assertEqual(result["layers"]["答案"]["ARC"], 1)
            self.assertEqual(result["units_code"], 4)
            self.assertEqual(result["blocks"], ["SOURCE_BLOCK"])
            self.assertEqual(result["isolation"]["status"], "blocked")
            self.assertEqual(result["isolation"]["given_layers"], [])
            self.assertEqual(result["isolation"]["answer_layers"], [])
            self.assertEqual(set(result["isolation"]["unknown_layers"]), {"题目", "答案"})
            self.assertIs(result["m3_accepted"], False)
            self.assertIs(result["v5_accepted"], False)
            self.assertIsNone(result["reference_residual_mm"])

    def test_cli_rejects_dwg_without_ezdxf(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "original.dwg"
            path.write_bytes(b"AC1018" + bytes(64))
            process = subprocess.run([sys.executable, str(SCRIPT), str(path)],
                                     capture_output=True, text=True)
            self.assertNotEqual(process.returncode, 0)
            report = json.loads(process.stdout)
            self.assertEqual(report["files"][0]["status"], "rejected")
            self.assertIs(report["files"][0]["m3_accepted"], False)

if __name__ == "__main__":
    unittest.main()
