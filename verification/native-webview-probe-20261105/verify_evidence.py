"""Verify preserved CI originals and native control without starting any game."""
from pathlib import Path
import hashlib
import json
import zipfile
from run import validate_control


def main():
    root = Path(__file__).resolve().parent
    manifest = json.loads((root / "evidence/manifest.json").read_text())
    results = []
    for attempt in manifest["attempts"]:
        raw = (root / attempt["archive"]).read_bytes()
        assert len(raw) == attempt["bytes"]
        assert hashlib.sha256(raw).hexdigest() == attempt["sha256"]
        assert hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest() == attempt["gitSha"]
        with zipfile.ZipFile(root / attempt["archive"]) as z:
            assert z.testzip() is None
            assert sorted(z.namelist()) == sorted(item["name"] for item in attempt["files"])
            for item in attempt["files"]:
                value = z.read(item["name"])
                assert len(value) == item["bytes"]
                assert hashlib.sha256(value).hexdigest() == item["sha256"]
            data = json.loads(z.read("result.json"))
            assert data["source"] == attempt["source"]
            assert data["stage"] == attempt["stage"] and data["complete"] is attempt["complete"]
            assert data["gameLoaded"] is False and data["physicalDeviceTest"] is False
            assert data["whiteScreenFixed"] is False and data["nativeTerminationCallbackObserved"] is False
            if data["complete"]:
                control = json.loads(z.read("control.json"))
                validate_control(control)
                assert control == data["control"]
                assert data["xcode"] == "Xcode 16.4\nBuild version 16F6\n"
                assert data["runtime"]["version"] == "18.5"
                assert control["readback"]["width"] == 440 and control["readback"]["height"] == 652
                log = z.read("control.log").decode()
                assert "Executed 1 test, with 0 failures" in log
                assert "** TEST EXECUTE SUCCEEDED **" in log
                assert "** TEST BUILD SUCCEEDED **" in z.read("build.log").decode()
            results.append({"runId": attempt["runId"], "stage": data["stage"],
                            "complete": data["complete"], "originalArchiveVerified": True})
    assert [x["complete"] for x in results] == [False, False, True]
    print(json.dumps({"attempts": results, "physicalDeviceTest": False,
                      "gameLoaded": False, "whiteScreenFixProven": False}, indent=2))


if __name__ == "__main__":
    main()
