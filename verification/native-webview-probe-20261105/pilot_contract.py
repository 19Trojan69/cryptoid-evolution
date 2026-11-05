"""Independent acceptance of native pilot stages and the normal UI report."""


def validate_pilot(native, report, source):
    assert native["mode"] == "pilot" and native["pilotComplete"] is True
    assert native["gameLoaded"] is True and native["reportExportObserved"] is True
    assert native["physicalDeviceTest"] is native["automaticReload"] is False
    assert native["nativeTerminationCallbackObserved"] is False
    assert native["nativeContentTerminations"] == native["navigationErrors"] == 0
    assert native["systemName"] == "iOS" and native["systemVersion"] == "18.5"
    for key in ("readbackFailed", "reportWriteFailed", "observationLimitReached", "documentProbeFailed"):
        assert key not in native, key
    points = native["observations"]
    assert len(points) == 11, "Every original pilot phase must be observed"
    assert points[0]["toggles"] == [False, True]
    assert points[1]["scene"]["status"] == "paused"
    token = points[0]["documentToken"]
    import uuid
    uuid.UUID(token)
    run = points[2]["clock"]["latest"]["id"]
    for i, point in enumerate(points):
        assert point["sequence"] == i+1 and point["timeOrigin"] > 0
        assert point["documentToken"] == token, "Isolated-world document changed"
        for key in ("mainDocumentStarts", "mainDocumentCommits", "mainDocumentFinishes"):
            assert point[key] == native[key] == 1, key
        assert point["hidden"] is False and point["secureContext"] is True
        assert point["origin"] == "http://127.0.0.1:4173" and "iPhone" in point["userAgent"]
        assert point["width"] > 0 and point["height"] > 0 and point["devicePixelRatio"] > 0
        if i < 2:
            continue
        clock = point["clock"]["latest"]
        assert clock["id"] == run and clock["source"] == source and clock["unobservedGaps"] == 0
        if i in (2, 3, 6, 8):
            assert clock["mode"] == "running"
            scene = point["scene"]
            assert point["mounted"] is True and scene["status"] == "playing"
            assert scene["technicalPause"] is False and scene["reactorOpen"] is True
            assert scene["encounter"] == "boss-fight" and scene["sector"] == 20
            assert scene["ownerDiagnostics"] is False
            assert scene["buildFlags"] == {"development": False, "production": True}
        elif i in (4, 5, 7):
            assert clock["mode"] == "paused"
        else:
            assert clock["mode"] == "ended" and point["mounted"] is False
    active, advanced, paused, held = [points[i] for i in (2, 3, 4, 5)]
    assert advanced["clock"]["latest"]["elapsedMs"] > active["clock"]["latest"]["elapsedMs"] + 8000
    assert advanced["scene"]["frameAt"] > active["scene"]["frameAt"]
    assert paused["clock"]["latest"]["elapsedMs"] == held["clock"]["latest"]["elapsedMs"]
    assert report["fullSession"] is None and report["isolatedGuest"] is True
    assert report["automaticTransmission"] is report["nativeTerminationCauseMeasured"] is False
    assert report["criticalMatchesLatestStopwatch"] is report["briefMatchesLatestStopwatch"] is True
    assert report["reportDocumentOrigin"] == points[0]["origin"]
    clock = report["stopwatch"]["latest"]
    assert clock["id"] == run and clock["source"] == source and clock["mode"] == "ended"
    assert clock == report["criticalDiagnostics"]["latest"]["clock"]
    assert clock == report["briefDiagnostics"]["latest"]["clock"]
    assert clock == points[-1]["clock"]["latest"]
    assert report["briefDiagnostics"]["latest"]["options"]["fullRecording"] is False
    events = report["criticalDiagnostics"]["latest"]["events"]
    assert "error" not in events and "unhandledrejection" not in events
    resource = report["briefDiagnostics"]["latest"]["resourceCheckpoint"]
    assert resource["clockId"] == run
    assert resource["visible"] is True and resource["at"] <= clock["updatedAt"]
    assert 0 <= resource["elapsedMs"] <= clock["elapsedMs"]
    assert resource["frameAt"] > 0 and resource["audioBufferBytes"] > 0
    assert resource["canvasFailureCount"] == 0
