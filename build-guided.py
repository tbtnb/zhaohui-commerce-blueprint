#!/usr/bin/env python3
"""Compatibility entry: rebuild the company-guided homepage."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).resolve().with_name('build-company.py')), run_name='__main__')
