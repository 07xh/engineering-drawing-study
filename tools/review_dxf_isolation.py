"""Reviewable, fail-closed separation of CAD given and reference layers.

The output is an audit record, NOT solver input or a correctness certificate.
An independent human must explicitly classify every modelspace layer.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

def review(audit, decisions):
    if audit.get("schema") != "draftai-dxf-source-audit/1":
        raise ValueError("unrecognized DXF audit schema")
    files = audit.get("files")
    if not isinstance(files, list) or len(files) != 1:
        raise ValueError("review one DXF audit file at a time")
    source = files[0]
    if source.get("status") == "rejected" or not source.get("sha256"):
        raise ValueError("source DXF is not accepted by provenance audit")
    if decisions.get("source_sha256") != source["sha256"]:
        raise ValueError("source fingerprint mismatch; re-audit converted DXF")
    classifications = decisions.get("layers")
    if not isinstance(classifications, dict):
        raise ValueError("explicit layer classifications required")
    known = set(source.get("layers", {}))
    if set(classifications) != known:
        raise ValueError("every modelspace layer must be classified exactly once")
    if any(value not in ("given", "reference", "unknown") for value in classifications.values()):
        raise ValueError("invalid layer role")
    if not isinstance(decisions.get("reviewer"), str) or not decisions["reviewer"].strip():
        raise ValueError("named reviewer required")
    if not isinstance(decisions.get("evidence"), str) or not decisions["evidence"].strip():
        raise ValueError("review evidence required")
    given = sorted(k for k,v in classifications.items() if v == "given")
    reference = sorted(k for k,v in classifications.items() if v == "reference")
    unknown = sorted(k for k,v in classifications.items() if v == "unknown")
    return {
        "schema": "draftai-cad-source-isolation/1",
        "source_sha256": source["sha256"],
        "review_sha256": hashlib.sha256(json.dumps(decisions, sort_keys=True, ensure_ascii=False).encode()).hexdigest(),
        "reviewer": decisions["reviewer"],
        "evidence": decisions["evidence"],
        "given_layers": given,
        "reference_layers": reference,
        "unknown_layers": unknown,
        "status": "reviewed" if given and not unknown else "blocked",
        "m3_accepted": False,
        "v5_accepted": False,
        "reference_residual_mm": None,
        "note": "Review establishes provenance roles only; never proves mathematical correctness."
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument("audit_json")
    p.add_argument("review_json")
    args=p.parse_args()
    try:
        audit=json.loads(Path(args.audit_json).read_text(encoding="utf-8"))
        decisions=json.loads(Path(args.review_json).read_text(encoding="utf-8"))
        result=review(audit, decisions)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["status"] == "reviewed" else 2
    except (OSError, ValueError, TypeError, KeyError) as error:
        print(json.dumps({"status":"rejected","reason":str(error),"m3_accepted":False},
                         ensure_ascii=False), file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
