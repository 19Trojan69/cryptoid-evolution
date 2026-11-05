"""Build the unchanged isolated guest on a case-sensitive Linux filesystem."""
import os
from pathlib import Path
import shutil
import subprocess
import time
from collector import Collector, atomic_json
from run import FOLDER, ROOT, BASE, scope, package_manifest

assert os.uname().sysname == "Linux"
out = FOLDER / "results"
out.mkdir(exist_ok=True)
status = {"complete": False, "gameLoaded": False, "physicalDeviceTest": False,
          "whiteScreenFixed": False, "stage": "guest-build", "startedAt": time.time()}
collector = Collector(out, status, ROOT)
try:
    scope()
    source = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    status["source"] = source
    os.environ["VERCEL_ENV"] = "preview"
    collector.run(["node", "verification/direct-boss-style-device-20261102/installDevicePreview.mjs", "--ignore-scripts"], timeout=240, log="guest-install.log")
    collector.run(["node", "verification/critical-failure-journal-20261104/build.mjs"], timeout=180, log="guest-build.log")
    scope()
    site = ROOT / "verification/boss2-forensics-20261028/results/device-preview/site"
    package = FOLDER / "guest-package"
    assert not package.exists(), "A fresh CI checkout must not contain an older build"
    package.mkdir()
    shutil.copytree(site, package / "site")
    manifest = {"version": 1, "source": source, "base": BASE, "buildOS": "Linux", "files": package_manifest(site)}
    atomic_json(package / "manifest.json", manifest)
    status.update(complete=True, stage="complete", files=len(manifest["files"]))
except Exception as error:
    status["error"] = {"kind": type(error).__name__, "detail": str(error)[:1000]}
finally:
    status["endedAt"] = time.time()
    collector.checkpoint()
    print("CRYPTOID_NATIVE_GUEST_PACKAGE", status, flush=True)
raise SystemExit(0 if status["complete"] else 1)
