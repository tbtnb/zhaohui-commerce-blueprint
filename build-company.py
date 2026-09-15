#!/usr/bin/env python3
"""Build only the new company journey. Legacy scene generators are not invoked."""
from pathlib import Path
import subprocess
root = Path(__file__).resolve().parent
subprocess.run(['node', str(root / 'company/build-research.mjs')], cwd=root, check=True)
(root / 'index.html').write_bytes((root / 'company/index.html').read_bytes())
print('Built company journey and research: 8 independently authored solution templates.')
