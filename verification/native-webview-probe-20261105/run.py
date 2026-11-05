"""Bounded direct XCTest calibration, without Appium, Safari or game loading."""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import urllib.request
import zipfile

BASE = "b092f6462a623c3ad2c12e634963028d462c5fcf"
FOLDER = Path(__file__).resolve().parent
ROOT = FOLDER.parent.parent
XCODEGEN_URL = "https://github.com/yonaskolb/XcodeGen/releases/download/2.44.1/xcodegen.zip"
XCODEGEN_SHA = "a2e905fb68446e9bb4008cdfe2e13e3f176d0cbcca828b71770f8e53fca91b73"


def validate_control(value: dict) -> None:
    assert value.get("version") == 1
    for key in ("loaded", "controlComplete", "trustedClick", "completionRejectedBeforeClick"):
        assert value.get(key) is True, key
    for key in ("gameLoaded", "physicalDeviceTest", "automaticReload", "nativeTerminationCallbackObserved"):
        assert value.get(key) is False, key
    assert value.get("clickCount") == 1
    assert value.get("nativeContentTerminations") == value.get("navigationErrors") == 0
    assert value.get("systemName") == "iOS" and value.get("systemVersion") == "18.5"
    dom = value["readback"]
    assert dom["title"] == "Native WebView-Kontrolle" and dom["count"] == 1
    assert dom["visibilityState"] == "visible" and dom["readyState"] == "complete"
    assert "iPhone" in dom["userAgent"] and dom["timeOrigin"] > 0
    assert dom["width"] > 0 and dom["height"] > 0 and dom["devicePixelRatio"] > 0


def scope():
    for path in ("frontend", "backend", "api", "assets", "private-preview", "vercel.json"):
        old = subprocess.check_output(["git", "rev-parse", f"{BASE}:{path}"], cwd=ROOT).strip()
        new = subprocess.check_output(["git", "rev-parse", f"HEAD:{path}"], cwd=ROOT).strip()
        assert old == new, path
    subprocess.run(["git", "diff", "--exit-code", "--", "frontend", "backend", "api", "assets", "private-preview", "vercel.json"], cwd=ROOT, check=True)


def main() -> int:
    out = FOLDER / "results"
    out.mkdir(exist_ok=True)
    status = {"complete": False, "gameLoaded": False, "physicalDeviceTest": False,
              "nativeTerminationCallbackObserved": False, "whiteScreenFixed": False,
              "startedAt": time.time(), "base": BASE, "stage": "scope"}
    simulator = None
    def run(args, *, timeout=120, log=None, cwd=ROOT):
        started = time.monotonic()
        result = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        if log:
            (out / log).write_text(result.stdout + result.stderr)
        status.setdefault("commands", []).append({"command": args[0:2], "exitCode": result.returncode,
                                                  "elapsedMs": round((time.monotonic()-started)*1000)})
        if result.returncode:
            raise RuntimeError(f"{args[0]} failed ({result.returncode}); log={log}")
        return result.stdout
    try:
        scope()
        status["source"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        status["stage"] = "tools"
        status["xcode"] = run(["xcodebuild", "-version"])
        temp = Path(os.environ["RUNNER_TEMP"]) / "cryptoid-native-probe"
        temp.mkdir(exist_ok=True)
        archive = temp / "xcodegen.zip"
        with urllib.request.urlopen(XCODEGEN_URL, timeout=60) as response:
            data = response.read(6_000_001)
        assert len(data) < 6_000_001 and hashlib.sha256(data).hexdigest() == XCODEGEN_SHA
        archive.write_bytes(data)
        with zipfile.ZipFile(archive) as z:
            assert z.testzip() is None
            for name in z.namelist():
                assert not name.startswith("/") and ".." not in Path(name).parts
            z.extractall(temp / "xcodegen")
        bins = list((temp / "xcodegen").rglob("bin/xcodegen"))
        assert len(bins) == 1
        binary = bins[0]
        binary.chmod(0o755)
        status["xcodegen"] = run([str(binary), "version"])
        assert "2.44.1" in status["xcodegen"]
        run([str(binary), "generate", "--spec", str(FOLDER / "project.yml")], cwd=FOLDER)
        schemes = list(FOLDER.rglob("NativeProbe.xcscheme"))
        assert len(schemes) == 1
        shutil.copyfile(schemes[0], out / "NativeProbe.xcscheme")
        import xml.etree.ElementTree as ET
        test_action = ET.parse(schemes[0]).getroot().find("TestAction")
        # XcodeGen 2.44.1 maps captureScreenshotsAutomatically:false to the
        # documented systemAttachmentLifetime=keepNever, not an invented
        # disableAutomaticScreenCapture field. Retention is not a proof that
        # XCTest internally never captures a screen. This control loads no game.
        assert test_action is not None
        assert test_action.get("systemAttachmentLifetime") == "keepNever"
        assert test_action.get("preferredScreenCaptureFormat") == "screenshots"
        status["automaticScreenAttachmentsRetained"] = False
        status["screenRecordingRequested"] = False
        status["stage"] = "simulator"
        catalogue = json.loads(run(["xcrun", "simctl", "list", "--json"], timeout=150))
        runtime = next(r for r in catalogue["runtimes"] if r.get("isAvailable") and r["version"] == "18.5")
        status["runtime"] = {k: runtime[k] for k in ("version", "identifier", "buildversion")}
        device = "com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro-Max"
        assert any(d["identifier"] == device for d in catalogue["devicetypes"])
        simulator = run(["xcrun", "simctl", "create", "Cryptoid native control", device, runtime["identifier"]]).strip()
        run(["xcrun", "simctl", "boot", simulator])
        run(["xcrun", "simctl", "bootstatus", simulator, "-b"], timeout=180, log="boot.log")
        arguments = ["xcodebuild", "-project", str(FOLDER / "CryptoidNativeProbe.xcodeproj"),
                     "-scheme", "NativeProbe", "-destination", "id="+simulator,
                     "-derivedDataPath", str(temp / "derived"), "-parallel-testing-enabled", "NO",
                     "CODE_SIGNING_ALLOWED=NO"]
        status["stage"] = "build"
        run(arguments + ["build-for-testing"], timeout=300, log="build.log")
        status["stage"] = "native-control"
        run(arguments + ["test-without-building", "-resultBundlePath", str(temp / "control.xcresult")],
            timeout=240, log="control.log")
        container = run(["xcrun", "simctl", "get_app_container", simulator, "org.cryptoid.nativeprobe", "data"]).strip()
        raw = (Path(container) / "Documents/probe-result.json").read_bytes()
        assert 0 < len(raw) <= 12_288
        (out / "control.json").write_bytes(raw)
        control = json.loads(raw)
        validate_control(control)
        scope()
        status.update(complete=True, stage="complete", control=control)
    except Exception as error:
        status["error"] = {"kind": type(error).__name__, "detail": str(error)[:1000]}
    finally:
        status["endedAt"] = time.time()
        (out / "result.json").write_text(json.dumps(status, indent=2)+"\n")
        print("CRYPTOID_NATIVE_WEBVIEW_CONTROL "+json.dumps(status), flush=True)
        if simulator:
            for operation in ("shutdown", "delete"):
                try:
                    subprocess.run(["xcrun", "simctl", operation, simulator], capture_output=True, timeout=20)
                except subprocess.TimeoutExpired:
                    pass
    return 0 if status["complete"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
