"""Bounded direct XCTest control or unchanged local guest pilot; never a phone test."""
from __future__ import annotations
import argparse
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
from collector import Collector, atomic_json

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


def package_manifest(site):
    return [{"path": str(p.relative_to(site)), "bytes": p.stat().st_size,
             "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
            for p in sorted(site.rglob("*")) if p.is_file()]


def main() -> int:
    mode = argparse.ArgumentParser()
    mode.add_argument("--mode", choices=("control", "pilot"), default="control")
    pilot = mode.parse_args().mode == "pilot"
    out = FOLDER / "results"
    out.mkdir(exist_ok=True)
    status = {"complete": False, "gameLoaded": False, "physicalDeviceTest": False,
              "nativeTerminationCallbackObserved": False, "whiteScreenFixed": False,
              "startedAt": time.time(), "base": BASE, "stage": "scope"}
    simulator = None
    server = None
    collector = Collector(out, status, ROOT)
    status["mode"] = "pilot" if pilot else "control"
    collector.checkpoint()
    run = collector.run
    try:
        scope()
        status["source"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        collector.checkpoint("tools")
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
        schemes = list((FOLDER / "CryptoidNativeProbe.xcodeproj/xcshareddata/xcschemes").glob("NativeProbe.xcscheme"))
        assert len(schemes) == 1
        shutil.copyfile(schemes[0], out / "NativeProbe.xcscheme")
        import xml.etree.ElementTree as ET
        test_action = ET.parse(schemes[0]).getroot().find("TestAction")
        # XcodeGen 2.44.1 maps captureScreenshotsAutomatically:false to the
        # documented systemAttachmentLifetime=keepNever, not an invented
        # disableAutomaticScreenCapture field. Retention is not a proof that
        # XCTest internally never captures a screen. No explicit screenshot is requested.
        assert test_action is not None
        assert test_action.get("systemAttachmentLifetime") == "keepNever"
        assert test_action.get("preferredScreenCaptureFormat") == "screenshots"
        status["automaticScreenAttachmentsRetained"] = False
        status["screenRecordingRequested"] = False
        collector.checkpoint("simulator")
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
        collector.checkpoint("build")
        run(arguments + ["build-for-testing"], timeout=300, log="build.log")
        if pilot:
            collector.checkpoint("guest-package")
            package = FOLDER / "guest-package"
            manifest = json.loads((package / "manifest.json").read_text())
            assert manifest["source"] == status["source"] and manifest["base"] == BASE
            assert manifest["buildOS"] == "Linux"
            assert manifest["files"] == package_manifest(package / "site")
            site = ROOT / "verification/boss2-forensics-20261028/results/device-preview/site"
            assert not site.exists(), "Do not overwrite any pre-existing guest build"
            shutil.copytree(package / "site", site)
            info = json.loads((site / "device-preview-info.json").read_text())
            assert info["sourceCommit"] == status["source"] and info["criticalFailureJournal"]
            assert info["guestOnly"] is True
            for key in ("liveBackend", "actualPiAuthentication", "payments", "automaticResume", "automaticUpload"):
                assert info[key] is False, key
            shutil.copyfile(site / "device-preview-info.json", out / "build-info.json")
            before = package_manifest(site)
            atomic_json(out / "served-manifest.json", before)
            # Authored guest-only server; no access to any hosted deployment.
            server_log = (out / "guest-server.log").open("wb")
            server = subprocess.Popen(["node", "--experimental-strip-types", str(FOLDER / "serve.mjs")],
                                      cwd=ROOT, stdout=server_log, stderr=subprocess.STDOUT,
                                      start_new_session=True)
            origin_file = out / "guest-origin.txt"
            for _ in range(100):
                if origin_file.exists(): break
                assert server.poll() is None, "local guest server exited"
                time.sleep(.1)
            assert origin_file.read_text().strip() == "http://127.0.0.1:4173"
            status["guestBuildVerified"] = True
            status["guestBuildOS"] = "Linux"
            status["restoredPackageMatchesLinuxBuild"] = before == manifest["files"]
            assert status["restoredPackageMatchesLinuxBuild"] is True
            status["gameLoaded"] = None
        collector.checkpoint("native-pilot" if pilot else "native-control")
        test_class = "GamePilotTests" if pilot else "ProbeTests"
        run(arguments + ["test-without-building", "-only-testing:NativeProbeUITests/"+test_class,
                         "-resultBundlePath", str(temp / "test.xcresult")],
            timeout=360 if pilot else 240, log="pilot.log" if pilot else "control.log")
        # Collection runs in finally even if XCTest fails or its deadline expires.
        status["nativeTestSucceeded"] = True

    except Exception as error:
        status["error"] = {"kind": type(error).__name__, "detail": str(error)[:1000]}
    finally:
        if simulator:
            collector.collect_native(
                lambda: run(["xcrun", "simctl", "get_app_container", simulator, "org.cryptoid.nativeprobe", "data"], timeout=20, log="container.log"),
                [("probe-result.json", "pilot.json" if pilot else "control.json")] +
                ([("normal-report.json", "normal-report.json")] if pilot else []))
        if "error" not in status:
            try:
                if pilot:
                    from pilot_contract import validate_pilot
                    receipt = json.loads((out / "pilot.json").read_text())
                    report = json.loads((out / "normal-report.json").read_text())
                    validate_pilot(receipt, report, status["source"])
                    assert before == package_manifest(site), "Served bytes changed during native test"
                    status.update(gameLoaded=True, normalReportVerified=True)
                else:
                    receipt = json.loads((out / "control.json").read_text())
                    validate_control(receipt)
                    status["control"] = receipt
                scope()
                status.update(complete=True, stage="complete")
            except Exception as error:
                status["error"] = {"kind": type(error).__name__, "detail": str(error)[:1000]}
        elif pilot and (out / "pilot.json").exists():
            try:
                status["gameLoaded"] = json.loads((out / "pilot.json").read_text()).get("gameLoaded")
            except Exception:
                pass
        if server:
            server.terminate()
            try: server.wait(timeout=5)
            except subprocess.TimeoutExpired: server.kill(); server.wait(timeout=5)
            server_log.close()
        status["endedAt"] = time.time()
        collector.checkpoint()
        print("CRYPTOID_NATIVE_WEBVIEW_RESULT "+json.dumps(status), flush=True)
        if simulator:
            for operation in ("shutdown", "delete"):
                try:
                    subprocess.run(["xcrun", "simctl", operation, simulator], capture_output=True, timeout=20)
                except subprocess.TimeoutExpired:
                    pass
    return 0 if status["complete"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
