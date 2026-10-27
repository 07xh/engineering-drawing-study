#!/usr/bin/env python3
"""DraftAI C1 textbook DWG -> DXF input/reference isolation.

Only deterministic ORIGINAL textbook file hashes are accepted. A converter
is required; the source DWG is never modified. DXF inspection uses ezdxf.
No supplied answer entity is ever passed to a geometry solver. A conversion
is NOT a blind C1 solution, a V5 signoff or a proof of source/answer split.
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

# Source packet processing is intentionally separate from the independent
# reference: neither an answer handle nor an answer coordinate may be sent
# to the source C1 M3 input consumer.
from c1_textbook_dxf_blind_packets import (
    hash_file, inspect_geometry_entities, build_blind_packets,
    write_isolated_packets,
)

FIXTURES = {
    "图3-50 补画支架的左视图.dwg":
        "12ff96f3bbcb3fc71ca759dabec0c025b6bae594754f7913d2e1fc3d03509a5c",
    "图3-52 补画机座的左视图.dwg":
        "622917cc2d79035b5915ccf8e3bccd2a52502e5f3578668e90e731461f1d2281",
}
DWG_SIGNATURES = {"AC1018": "AutoCAD 2004/2005/2006"}
ALLOWED_CAD_TYPES = frozenset({
    "LINE", "ARC", "CIRCLE", "LWPOLYLINE", "POLYLINE",
    "ELLIPSE", "SPLINE", "POINT", "TEXT", "MTEXT",
    "DIMENSION", "INSERT", "HATCH",
})


def source_preflight(source: pathlib.Path) -> dict:
    if not source.is_file() or source.name not in FIXTURES:
        raise ValueError("not an identified original C1 textbook DWG")
    binary = source.read_bytes()
    digest = hashlib.sha256(binary).hexdigest()
    if digest != FIXTURES[source.name]:
        raise ValueError("original textbook file hash mismatch: altered or unverified DWG")
    version = binary[:6].decode("ascii", errors="replace")
    if version not in DWG_SIGNATURES:
        raise ValueError("unsupported original DWG format signature")
    return {
        "name": source.name, "sha256": digest, "sizeBytes": len(binary),
        "dwgSignature": version, "format": DWG_SIGNATURES[version],
        "originalImmutable": True, "converted": False,
        "textbookBlindSolveAccepted": False,
    }


def converter_command() -> tuple[str, str] | None:
    for binary, mode in (("dwg2dxf", "libredwg"),
                         ("ODAFileConverter", "oda")):
        candidate = shutil.which(binary)
        if candidate:
            return candidate, mode
    return None


def trustworthy_convert(source: pathlib.Path, destination: pathlib.Path,
                        converter: tuple[str, str]) -> dict:
    binary, mode = converter
    if destination.exists():
        raise FileExistsError("never overwrite existing trusted DXF evidence")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="draftai-c1-dwg-") as root:
        tmp = pathlib.Path(root)
        staged_dxf = tmp / (source.stem + ".dxf")
        if mode == "libredwg":
            cmd = [binary, "--as", "r2004", "--file",
                   str(staged_dxf), str(source)]
        elif mode == "oda":
            source_dir, target_dir = tmp / "source", tmp / "target"
            source_dir.mkdir()
            target_dir.mkdir()
            shutil.copy2(source, source_dir / source.name)
            cmd = [binary, str(source_dir), str(target_dir),
                   "ACAD2004", "DXF", "0", "0", "*.dwg"]
            staged_dxf = target_dir / (source.stem + ".dxf")
        else:
            raise ValueError("unrecognized converter")
        completed = subprocess.run(cmd, capture_output=True, text=True,
                                   timeout=120, check=False)
        if completed.returncode != 0:
            raise RuntimeError("DWG converter failed without accepted DXF output")
        if not staged_dxf.is_file() or staged_dxf.stat().st_size < 100:
            raise RuntimeError("no nonempty converted DXF from trusted source")
        # Preserve only freshly created converter output. Do NOT load
        # a previous, renamed or separately supplied answer drawing.
        shutil.copyfile(staged_dxf, destination)
    return {
        "converter": mode, "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "dxfSha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
    }


def inspect_dxf(path: pathlib.Path) -> tuple[dict, list[dict]]:
    try:
        import ezdxf
    except ImportError as exc:
        raise RuntimeError("ezdxf required for independent DXF entity inspection") from exc
    doc = ezdxf.readfile(str(path))
    records: list[dict] = []
    types: collections.Counter[str] = collections.Counter()
    layers: collections.Counter[str] = collections.Counter()
    for layout in doc.layouts:
        for entity in layout:
            kind = entity.dxftype()
            handle = entity.dxf.get("handle", None)
            layer = entity.dxf.get("layer", "0")
            if not isinstance(handle, str) or not handle:
                raise ValueError("DXF entity missing source handle provenance")
            if not isinstance(layer, str):
                raise ValueError("non-string DXF layer")
            types[kind] += 1
            layers[layer] += 1
            records.append({
                "handle": handle, "type": kind, "layer": layer,
                "layout": layout.name,
            })
    handles = [r["handle"] for r in records]
    if not handles or len(set(handles)) != len(handles):
        raise ValueError("missing/duplicate DXF entity handles")
    inventory = {
        "entityCount": len(records), "typeCounts": dict(types),
        "layerCounts": dict(layers),
        "unsupportedEntityTypes": sorted(set(types) - ALLOWED_CAD_TYPES),
        "containsPotentiallyUnresolvedCadGeometry": bool(
            set(types) - {"LINE", "LWPOLYLINE", "POLYLINE", "ARC", "CIRCLE", "POINT"}
        ),
        "originalReferenceMustNotBecomeSolverInput": True,
    }
    return inventory, records


def partition_reference(inventory: dict, records: list[dict],
                        source_sha256: str, partition: pathlib.Path | None) -> dict:
    if partition is None:
        return {"status": "source-vs-answer-not-separated",
                "blindIndependentTextbookTestPassed": False}
    data = json.loads(partition.read_text(encoding="utf-8"))
    if data.get("sourceSha256") != source_sha256:
        raise ValueError("manual partition is not bound to current original DWG hash")
    given, answer = data.get("givenHandles"), data.get("referenceHandles")
    if not isinstance(given, list) or not isinstance(answer, list) or not given or not answer:
        raise ValueError("explicit nonempty original given and reference handle sets required")
    if len(given) != len(set(given)) or len(answer) != len(set(answer)):
        raise ValueError("duplicate handles in given/answer partition")
    if set(given).intersection(answer):
        raise ValueError("answer geometry may never leak into given conditions")
    all_handles = {r["handle"] for r in records}
    if not set(given).issubset(all_handles) or not set(answer).issubset(all_handles):
        raise ValueError("unrecognized original DXF entity handle")
    return {
        "status": "manually-partitioned-handle-inventories-only",
        "givenHandles": given, "referenceHandles": answer,
        "unassignedHandles": sorted(all_handles-set(given)-set(answer)),
        "blindIndependentTextbookTestPassed": False,
        "note": "This is not a validated ProblemDraft or geometry-based answer residual.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dwg", type=pathlib.Path)
    parser.add_argument("--mode", choices=("probe", "convert"), default="probe")
    parser.add_argument("--output", type=pathlib.Path)
    parser.add_argument("--partition", type=pathlib.Path)
    parser.add_argument("--review", type=pathlib.Path)
    parser.add_argument("--given-packet", type=pathlib.Path)
    parser.add_argument("--reference-packet", type=pathlib.Path)
    args = parser.parse_args(argv)
    try:
        result = source_preflight(args.dwg)
        converter = converter_command()
        result["converterAvailable"] = bool(converter)
        result["converterKind"] = converter[1] if converter else None
        result["state"] = "authenticated-source-only"
        packet_args = [args.review, args.given_packet, args.reference_packet]
        if any(x is not None for x in packet_args) and (
            args.mode != "convert" or any(x is None for x in packet_args)
            or args.partition is None
        ):
            raise ValueError("both isolated packets, current review and handle partition require trusted convert mode")
        if args.mode == "convert":
            if args.output is None:
                raise ValueError("--output is required for conversion")
            if converter is None:
                raise RuntimeError("no LibreDWG dwg2dxf or ODAFileConverter executable available")
            conversion = trustworthy_convert(args.dwg, args.output, converter)
            inventory, records = inspect_dxf(args.output)
            reviewed_partition = partition_reference(inventory, records,
                result["sha256"], args.partition)
            result.update({
                "state": "converted-reference-inventory-only", "converted": True,
                "conversion": conversion, "inventory": inventory,
                "partition": reviewed_partition,
            })
            if args.review:
                review = json.loads(args.review.read_text(encoding="utf-8"))
                entities = inspect_geometry_entities(args.output)
                if set(entities) != {row["handle"] for row in records}:
                    raise ValueError("actual converted DXF entity inventory changed between reads")
                given, reference = build_blind_packets(
                    source_sha256=result["sha256"],
                    dxf_sha256=hash_file(args.output),
                    partition=reviewed_partition, review=review,
                    entities=entities,
                )
                write_isolated_packets(
                    args.given_packet, args.reference_packet, given, reference,
                    [args.dwg, args.output, args.partition, args.review],
                )
                # CLI stdout is only an attestation. Keep actual reference
                # handle inventory and answer coordinates in the separate
                # private reference packet, never in the solver's stdout.
                result["partition"] = {
                    "status": "isolated-given-and-reference-packets",
                    "givenHandleCount": len(reviewed_partition["givenHandles"]),
                    "isolatedAnswerHandleCount": len(reviewed_partition["referenceHandles"]),
                    "unassignedHandleCount": len(reviewed_partition["unassignedHandles"]),
                    "blindIndependentTextbookTestPassed": False,
                }
                result["state"] = "separately-reviewed-C1-given-and-answer-unsolved"
                result["blindPacketExport"] = {
                    "givenPath": str(args.given_packet),
                    "isolatedReferencePath": str(args.reference_packet),
                    "knownViews": sorted(given["views"]),
                    "givenVertexCountPerView": len(next(iter(given["views"].values()))),
                    "independentBlindC1SolutionAccepted": False,
                }
        print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
        return 0
    except (ValueError, OSError, RuntimeError, subprocess.TimeoutExpired) as exc:
        print(json.dumps({"state": "blocked", "reason": str(exc),
             "blindIndependentTextbookTestPassed": False},
            ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
