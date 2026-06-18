"""
Auto-push to GitHub whenever a file changes.
Run once: python watch_and_push.py
Stop with: Ctrl+C
"""

import time
import subprocess
import os
import sys
from pathlib import Path

WATCH_DIR = Path(__file__).parent
DEBOUNCE_SECONDS = 5  # Wait 5s after last change before pushing

IGNORE = {
    '__pycache__', '.git', 'instance', '.gitignore',
    'watch_and_push.py', 'push.bat'
}

def get_snapshot(directory):
    """Return a dict of {filepath: modified_time} for all tracked files."""
    snapshot = {}
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in IGNORE]
        for f in files:
            if any(ig in f for ig in IGNORE):
                continue
            path = Path(root) / f
            try:
                snapshot[str(path)] = path.stat().st_mtime
            except FileNotFoundError:
                pass
    return snapshot

def run(cmd):
    result = subprocess.run(cmd, cwd=WATCH_DIR, capture_output=True, text=True, shell=True)
    return result.stdout.strip(), result.stderr.strip()

def push():
    print("\n  Detected changes — pushing to GitHub...")
    out, err = run("git add -A")
    
    # Check if there's actually anything to commit
    status, _ = run("git status --porcelain")
    if not status:
        print("  Nothing new to commit.")
        return

    out, err = run('git commit -m "Auto-update"')
    print(f"  Committed: {out or err}")

    out, err = run("git push origin master")
    if err and "error" in err.lower():
        print(f"  Push failed: {err}")
    else:
        print(f"  Pushed to https://github.com/realxuo/IT-ticketing")
    print(f"  Watching for changes...\n")

def main():
    print()
    print("  ┌─────────────────────────────────────────┐")
    print("  │   Auto-push watcher — IT Ticketing       │")
    print("  │   github.com/realxuo/IT-ticketing        │")
    print("  │   Press Ctrl+C to stop                   │")
    print("  └─────────────────────────────────────────┘")
    print()
    print("  Watching for file changes...")
    print()

    last_snapshot = get_snapshot(WATCH_DIR)
    last_change_time = None

    while True:
        time.sleep(1)
        current_snapshot = get_snapshot(WATCH_DIR)

        if current_snapshot != last_snapshot:
            last_snapshot = current_snapshot
            last_change_time = time.time()

        if last_change_time and (time.time() - last_change_time >= DEBOUNCE_SECONDS):
            last_change_time = None
            push()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  Watcher stopped.")
        sys.exit(0)
