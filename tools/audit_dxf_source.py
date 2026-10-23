#!/usr/bin/env python3
"""Read-only DXF provenance audit. No answer layer may become an M3 given."""
import argparse
import hashlib
import json
from pathlib import Path
import sys

def audit(path):
    import ezdxf
    raw = Path(path).read_bytes()
    if not (raw.lstrip().startswith((b'0\nSECTION', b'0\r\nSECTION')) or
            raw.startswith(b'AutoCAD Binary DXF')):
        raise ValueError('not a DXF export; DWG cannot be interpreted as DXF')
    doc = ezdxf.readfile(path)
    layers = {}
    for entity in doc.modelspace():
        layer = entity.dxf.layer
        kind = entity.dxftype()
        counts = layers.setdefault(layer, {})
        counts[kind] = counts.get(kind, 0) + 1
    return {
        'path': str(path), 'sha256': hashlib.sha256(raw).hexdigest(),
        'dxf_version': doc.dxfversion,
        'units_code': doc.header.get('$INSUNITS', 0),
        'modelspace_entity_count': sum(sum(c.values()) for c in layers.values()),
        'layers': layers,
        'blocks': [b.name for b in doc.blocks if not b.name.startswith('*')],
        'isolation': {'status': 'blocked',
            'given_layers': [], 'answer_layers': [],
            'unknown_layers': sorted(layers),
            'reason': 'Requires independently reviewed given/answer separation'},
        'm3_accepted': False, 'v5_accepted': False,
        'reference_residual_mm': None,
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('files', nargs='+')
    args = parser.parse_args()
    records = []
    for path in args.files:
        try:
            records.append(audit(path))
        except Exception as error:
            records.append({'path': path, 'status': 'rejected',
                            'reason': str(error), 'm3_accepted': False})
    print(json.dumps({'schema': 'draftai-dxf-source-audit/1',
                      'files': records}, ensure_ascii=False, indent=2))
    return int(any(x.get('status') == 'rejected' for x in records))

if __name__ == '__main__':
    sys.exit(main())
