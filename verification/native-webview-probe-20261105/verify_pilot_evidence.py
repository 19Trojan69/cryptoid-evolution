"""Offline audit of original CI archives; failures never become passed pilots."""
import hashlib
import json
from pathlib import Path
import zipfile
from pilot_contract import validate_pilot

folder = Path(__file__).resolve().parent
manifest = json.loads((folder / "evidence/pilot-manifest.json").read_text())
summary = []
for expected in manifest["attempts"]:
    directory = folder / "evidence" / f"attempt-{expected['runId']}"
    receipt = json.loads((directory / "artifact-receipt.json").read_text())
    assert receipt == expected
    raw = (directory / "original.zip").read_bytes()
    assert len(raw) == expected["archiveBytes"]
    assert hashlib.sha256(raw).hexdigest() == expected["archiveSha256"]
    assert hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest() == expected["archiveGitBlob"]
    with zipfile.ZipFile(directory / "original.zip") as archive:
        assert archive.testzip() is None
        for name in archive.namelist():
            assert not name.startswith("/") and ".." not in Path(name).parts
        assert sorted(archive.namelist()) == [member["path"] for member in expected["members"]]
        for member in expected["members"]:
            data = archive.read(member["path"])
            assert len(data) == member["bytes"] and hashlib.sha256(data).hexdigest() == member["sha256"]
        status = json.loads(archive.read("result.json"))
        assert status["source"] == expected["source"]
        assert status["complete"] is expected["complete"]
        assert status["stage"] == expected["stage"]
        assert status["gameLoaded"] is expected["gameLoaded"]
        assert status["physicalDeviceTest"] is status["whiteScreenFixed"] is False
        for command in status["commands"]:
            if not command["finished"]:
                continue
            content = archive.read(command["log"])
            if "logBytes" not in command:
                assert expected["runId"] == 41974173048
                assert command["log"] in expected["logMetadataMissing"]
                assert command["timedOut"] is True and command["exitCode"] is None
                continue
            assert len(content) == command["logBytes"]
            assert hashlib.sha256(content).hexdigest() == command["logSha256"]
        if status["complete"]:
            native = json.loads(archive.read("pilot.json"))
            report = json.loads(archive.read("normal-report.json"))
            validate_pilot(native, report, expected["source"])
            assert status["nativeTestSucceeded"] is status["normalReportVerified"] is True
            log = archive.read("pilot.log").decode()
            assert "** TEST EXECUTE SUCCEEDED **" in log
            assert "Executed 1 test, with 0 failures" in log
        else:
            assert "error" in status
            if status.get("nativeTestSucceeded") is True:
                # An observed ordinary cycle is preserved without retroactively
                # approving the failed independent document-continuity gate.
                log = archive.read("pilot.log").decode()
                assert "Executed 1 test, with 0 failures" in log
                native = json.loads(archive.read("pilot.json"))
                report = json.loads(archive.read("normal-report.json"))
                assert native["gameLoaded"] is native["pilotComplete"] is True
                assert len(native["observations"]) == 11
                assert report["criticalMatchesLatestStopwatch"] is True
                clock = report["stopwatch"]["latest"]
                assert clock == report["criticalDiagnostics"]["latest"]["clock"]
                assert clock == report["briefDiagnostics"]["latest"]["clock"]
                assert clock["mode"] == "ended" and clock["unobservedGaps"] == 0
                assert not ({"error", "unhandledrejection"} & report["criticalDiagnostics"]["latest"]["events"].keys())
    summary.append({"runId": expected["runId"], "complete": status["complete"],
                    "stage": status["stage"], "gameLoaded": status["gameLoaded"], "originalArchiveVerified": True})
for expected in manifest["guestBuilds"]:
    directory = folder / "evidence" / f"guest-build-{expected['runId']}"
    assert json.loads((directory / "artifact-receipt.json").read_text()) == expected
    raw = (directory / "original.zip").read_bytes()
    assert len(raw) == expected["archiveBytes"]
    assert hashlib.sha256(raw).hexdigest() == expected["archiveSha256"]
    assert hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest() == expected["archiveGitBlob"]
    with zipfile.ZipFile(directory / "original.zip") as archive:
        assert archive.testzip() is None
        assert sorted(archive.namelist()) == [member["path"] for member in expected["members"]]
        for member in expected["members"]:
            data = archive.read(member["path"])
            assert len(data) == member["bytes"] and hashlib.sha256(data).hexdigest() == member["sha256"]
        state = json.loads(archive.read("result.json"))
        assert state["source"] == expected["source"] and state["complete"] is True
        assert state["gameLoaded"] is state["physicalDeviceTest"] is state["whiteScreenFixed"] is False
        assert state["files"] == 2217
        for command in state["commands"]:
            data = archive.read(command["log"])
            assert command["exitCode"] == 0 and command["timedOut"] is False
            assert len(data) == command["logBytes"]
            assert hashlib.sha256(data).hexdigest() == command["logSha256"]
for expected in manifest.get("sourceChecks", []):
    directory = folder / "evidence" / f"check-{expected['runId']}"
    assert json.loads((directory / "receipt.json").read_text()) == expected
    raw = (directory / "unit-errors.log").read_bytes()
    assert len(raw) == expected["excerptBytes"]
    assert hashlib.sha256(raw).hexdigest() == expected["excerptSha256"]
    assert b"SyntaxError" in raw and expected["nativeJobSkipped"] is True
print(json.dumps({"attempts": summary, "physicalDeviceTest": False, "whiteScreenFixProven": False}, indent=2))
