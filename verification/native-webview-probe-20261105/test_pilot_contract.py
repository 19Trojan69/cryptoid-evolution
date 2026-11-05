import copy
import unittest
from pilot_contract import validate_pilot


class PilotAcceptance(unittest.TestCase):
    def fixture(self):
        source = "a" * 40
        clock = dict(id="one", source=source, unobservedGaps=0, elapsedMs=20000, mode="ended", updatedAt=100000)
        scene = dict(status="playing", technicalPause=False, reactorOpen=True, encounter="boss-fight", sector=20,
                     ownerDiagnostics=False, buildFlags=dict(development=False, production=True), frameAt=10)
        points = []
        for i in range(11):
            point = dict(sequence=i+1, timeOrigin=1, hidden=False, secureContext=True, origin="http://127.0.0.1:4173",
                         userAgent="iPhone", width=440, height=652, devicePixelRatio=3, toggles=[False, True],
                         mounted=i < 9, scene=copy.deepcopy(scene), clock={"latest": copy.deepcopy(clock)})
            point["clock"]["latest"]["mode"] = "paused" if i in (1,4,5,7) else "running" if i in (2,3,6,8) else "ended"
            if i == 1: point["scene"]["status"] = "paused"
            points.append(point)
        points[2]["clock"]["latest"]["elapsedMs"] = 1000
        points[3]["scene"]["frameAt"] = 20
        native = dict(mode="pilot", pilotComplete=True, gameLoaded=True, reportExportObserved=True,
                      physicalDeviceTest=False, automaticReload=False, nativeTerminationCallbackObserved=False,
                      nativeContentTerminations=0, navigationErrors=0, systemName="iOS", systemVersion="18.5", observations=points)
        report = dict(fullSession=None, isolatedGuest=True, automaticTransmission=False, nativeTerminationCauseMeasured=False,
                      criticalMatchesLatestStopwatch=True, briefMatchesLatestStopwatch=True, reportDocumentOrigin=points[0]["origin"],
                      stopwatch={"latest": clock}, criticalDiagnostics={"latest": {"clock":copy.deepcopy(clock),"events":{}}},
                      briefDiagnostics={"latest": {"clock": copy.deepcopy(clock), "options": {"fullRecording":False},
                        "resourceCheckpoint": dict(clockId="one", visible=True, at=90000, elapsedMs=19000, frameAt=10, audioBufferBytes=100, canvasFailureCount=0)}})
        return native, report, source

    def test_complete_synthetic_flow_can_pass_without_claiming_physical_test(self):
        validate_pilot(*self.fixture())

    def test_rejects_termination_hidden_replaced_document_and_gaps(self):
        mutations = [lambda n,r:n.update(nativeContentTerminations=1),
                     lambda n,r:n["observations"][3].update(hidden=True),
                     lambda n,r:n["observations"][3].update(timeOrigin=2),
                     lambda n,r:n["observations"][3]["clock"]["latest"].update(unobservedGaps=1),
                     lambda n,r:n["observations"][3]["clock"]["latest"].update(mode="paused")]
        for mutation in mutations:
            native, report, source = self.fixture()
            mutation(native, report)
            with self.assertRaises(AssertionError): validate_pilot(native, report, source)

    def test_rejects_stale_or_failed_normal_report(self):
        mutations = [lambda n,r:r["criticalDiagnostics"]["latest"]["clock"].update(elapsedMs=0),
                     lambda n,r:r["criticalDiagnostics"]["latest"]["events"].update(error={}),
                     lambda n,r:r["criticalDiagnostics"]["latest"]["events"].update(unhandledrejection={}),
                     lambda n,r:r["briefDiagnostics"]["latest"]["resourceCheckpoint"].update(clockId="old"),
                     lambda n,r:r.update(criticalMatchesLatestStopwatch=False)]
        for mutation in mutations:
            native, report, source = self.fixture()
            mutation(native, report)
            with self.assertRaises(AssertionError): validate_pilot(native, report, source)
