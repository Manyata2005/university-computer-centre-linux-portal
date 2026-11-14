#!/usr/bin/env python3
"""Applies the dark-theme edits to your existing script.js.

Usage:  python3 patch_script.py /var/www/html/script.js

Every edit is checked first. If any expected text is not found the exact
number of times, NOTHING is written. A backup (script.js.bak) is made first.
All API calls, routes, page logic and handlers are left byte-for-byte intact.
"""
import sys, shutil

path = sys.argv[1] if len(sys.argv) > 1 else 'script.js'
src = open(path, encoding='utf-8').read()

# (old text, new text, expected occurrences)
EDITS = [
    ("const COLORS = ['#2f6fed','#0f2547','#6a9bf5','#1a8f5c'];",
     "const COLORS = ['#3b82f6','#22d3ee','#a78bfa','#34d399'];", 1),
    # grouped bar chart: allocated bar + legend swatch
    ("#c9d8f7", "#2a4577", 2),
    # grouped bar chart: used bar + legend swatch
    ('fill="#2f6fed"', 'fill="#3b82f6"', 1),
    ("background:#2f6fed", "background:#3b82f6", 1),
    # chart gridlines
    ('stroke="#e2e8f2"', 'stroke="rgba(120,155,230,.14)"', 2),
    # donut centre label must be light on dark
    ("fill:#0f2547", "fill:#ffffff", 1),
    # Escape also closes the mobile sidebar
    ("$('#scrim').onclick=closeMenu;",
     "$('#scrim').onclick=closeMenu;\n  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});", 1),
]

out = src
for old, new, n in EDITS:
    found = out.count(old)
    if found != n:
        sys.exit(f"ABORTED, nothing written. Expected {n} x {old!r}, found {found}.")
    out = out.replace(old, new)

shutil.copyfile(path, path + '.bak')
open(path, 'w', encoding='utf-8').write(out)
print(f"OK: {len(EDITS)} edits applied to {path} (backup: {path}.bak)")
