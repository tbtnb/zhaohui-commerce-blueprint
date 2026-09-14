#!/usr/bin/env python3
"""Refresh the scene bundle and publish the full-screen guided entry point."""
from pathlib import Path
import subprocess
import sys
root = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(root / 'build-journey.py')], cwd=root, check=True)
subprocess.run(['node', str(root / 'export-journey-handbook.mjs')], cwd=root, check=True)
(root / 'index.html').write_bytes((root / 'guided-template.html').read_bytes())
print('Built guided homepage: 60 scenes, 15 full-screen steps per journey.')
