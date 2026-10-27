#!/usr/bin/env python3
"""Extract a *source-authenticated* R2004 DWG's embedded PNG thumbnail.

This reads the original DWG preview header ONLY, without decoding the
proprietary CAD entity database. It is a faithful (usually tiny) screenshot,
NOT DXF geometry, an answer-free problem image, a solved view or V5 proof.
Reject changed textbook bytes rather than silently processing an answer DWG.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import struct
import sys
import zlib

from c1_textbook_dwg_evidence import source_preflight

SENTINEL = bytes.fromhex("1f256d07d43628289d57ca3f9d44102b")


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return (struct.pack(">I", len(data)) + kind + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF))


def r2004_preview_dib(binary: bytes) -> tuple[bytes, dict]:
    if not isinstance(binary, bytes) or binary[:6] != b"AC1018" or len(binary) < 128:
        raise ValueError("explicit bounded R2004 DWG source bytes required")
    offset = struct.unpack_from("<I", binary, 0x0D)[0]
    if offset < 64 or offset + 21 > len(binary):
        raise ValueError("missing valid R2004 preview section address")
    if binary[offset:offset + 16] != SENTINEL:
        raise ValueError("invalid original DWG preview sentinel")
    size = struct.unpack_from("<I", binary, offset + 16)[0]
    count = binary[offset + 20]
    if not (20 <= size <= 16 * 1024 * 1024 and 1 <= count <= 16):
        raise ValueError("invalid bounded DWG preview container")
    if offset + 21 + count * 9 > len(binary):
        raise ValueError("truncated DWG preview image descriptor table")
    found = []
    for i in range(count):
        kind = binary[offset + 21 + i * 9]
        start, length = struct.unpack_from("<II", binary, offset + 22 + i * 9)
        if kind == 2:
            if length < 40 or length > 16 * 1024 * 1024 or start + length > len(binary):
                raise ValueError("invalid DWG DIB preview bounds")
            found.append((start, length, binary[start:start + length]))
    if len(found) != 1:
        raise ValueError("exactly one original R2004 DIB thumbnail required")
    start, length, dib = found[0]
    return dib, {
        "previewStartByte": start, "previewByteCount": length,
        "dwgPreviewContainerStart": offset,
        "dwgPreviewContainerDeclaredSize": size,
        "imageDescriptorCount": count,
        "notVectorEntities": True,
    }


def convert_dib_to_png(dib: bytes) -> tuple[bytes, dict]:
    if len(dib) < 40:
        raise ValueError("truncated original DWG BITMAPINFOHEADER")
    hdr, width, height, planes, bpp, compression, image_size, _x, _y, used, _important = (
        struct.unpack_from("<IiiHHIIiiII", dib)
    )
    if hdr != 40 or planes != 1 or bpp not in (8, 24) or compression != 0:
        raise ValueError("unsupported original DWG DIB compression or palette")
    if width <= 0 or height == 0 or abs(height) > 4096 or width > 4096:
        raise ValueError("unsafe original DWG thumbnail dimensions")
    abs_height = abs(height)
    palette_size = (used if used else 256) if bpp == 8 else 0
    if palette_size > 256:
        raise ValueError("invalid original DWG palette count")
    palette_start = hdr
    pixels_start = hdr + palette_size * 4
    stride = ((width * bpp + 31) // 32) * 4
    if pixels_start + stride * abs_height > len(dib):
        raise ValueError("truncated DWG thumbnail palette or pixel buffer")
    if bpp == 8:
        palette = []
        for i in range(palette_size):
            blue, green, red, _ = dib[palette_start + 4 * i:
                                    palette_start + 4 * (i + 1)]
            palette.append((red, green, blue))
    scanlines = []
    for y in range(abs_height):
        source_y = y if height < 0 else abs_height - y - 1
        start = pixels_start + source_y * stride
        pixels = dib[start:start + stride]
        if bpp == 8:
            if any(index >= len(palette) for index in pixels[:width]):
                raise ValueError("DWG thumbnail pixel references missing palette entry")
            rgb = bytes(channel for index in pixels[:width] for channel in palette[index])
        else:
            rgb = bytes(channel for x in range(width) for channel in (
                pixels[x * 3 + 2], pixels[x * 3 + 1], pixels[x * 3]
            ))
        scanlines.append(b"\x00" + rgb)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, abs_height, 8, 2, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(b"".join(scanlines), level=9))
        + png_chunk(b"IEND", b"")
    )
    return png, {"width": width, "height": abs_height, "bitsPerPixel": bpp}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_dwg", type=pathlib.Path)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args(argv)
    try:
        identity = source_preflight(args.source_dwg)
        dib, provenance = r2004_preview_dib(args.source_dwg.read_bytes())
        png, dimensions = convert_dib_to_png(dib)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("xb") as out:
            out.write(png)
        print(json.dumps({
            "schema": "draftai-c1-textbook-original-dwg-preview/1",
            "source": identity, "preview": provenance,
            "dimensions": dimensions,
            "outputSha256": hashlib.sha256(png).hexdigest(),
            "thumbnailNotReliableForVectorGeometryOrBlindTest": True,
            "DXFConverted": False,
            "M3M5V5Verified": False,
            "realTextbookBlindTestPassed": False,
        }, ensure_ascii=False, sort_keys=True))
        return 0
    except (ValueError, OSError, struct.error) as exc:
        print(json.dumps({
            "status": "blocked", "reason": str(exc),
            "realTextbookBlindTestPassed": False
        }, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
