import copy
import unittest
from memory_probe import services, rss, renderers, active_anchor, validate_memory


class ProcessQualification(unittest.TestCase):
    def fixture(self):
        native = {"gameLoaded": True, "nativeContentTerminations": 0, "navigationErrors": 0,
            "readback": {"sequence": 3, "mounted": True, "hidden": False, "documentToken": "doc-one",
                "observedAt": 10000, "scene": {"status": "playing", "technicalPause": False, "frameAt": 100},
                "clock": {"latest": {"id": "run", "source": "a"*40, "mode": "running", "unobservedGaps": 0, "elapsedMs": 5000}}}}
        anchor = active_anchor(native, "a"*40, 11000)
        renderer = {"pid": 42, "rssKiB": 10000, "started": "Thu Nov 5 10:00:00 2026"}
        samples = []
        for i in range(2):
            point = anchor | {"sequence": 3+i, "nativeFrameAt": 100+i}
            samples.append({"qualified": True, "before": point, "after": copy.deepcopy(point), "renderer": copy.deepcopy(renderer)})
        return native, {"source": "a"*40, "baselineWebContentPids": [], "samples": samples}

    def test_selects_only_live_scoped_services_and_readable_renderer(self):
        selected = services("PID Status Label\n- 0 com.apple.WebKit.WebContent\n42 0 com.apple.WebKit.WebContent.instance\n43 0 UIKitApplication:org.cryptoid.nativeprobe\n99 0 unrelated\n")
        self.assertEqual([row["pid"] for row in selected], [42,43])
        rows = rss("42 1 123456 Thu Nov  5 10:00:00 2026 /Runtime/com.apple.WebKit.WebContent\n43 1 5000 Thu Nov 5 10:00:01 2026 /App/NativeProbe\n99 1 9000 Thu Nov 5 10:00:00 2026 /unrelated\n", selected)
        self.assertEqual(len(rows),2)
        self.assertEqual(renderers(rows)[0]["pid"],42)
        self.assertEqual(renderers(rows)[0]["rssKiB"],123456)

    def test_accepts_two_new_renderer_observations_without_claiming_total_memory(self):
        _, state = self.fixture()
        validate_memory(state)

    def test_rejects_stale_paused_or_wrong_source_anchors(self):
        native, _ = self.fixture()
        for change in (lambda n:n["readback"].update(observedAt=0),
                       lambda n:n["readback"].update(hidden=True),
                       lambda n:n["readback"]["scene"].update(technicalPause=True),
                       lambda n:n["readback"]["clock"]["latest"].update(mode="paused"),
                       lambda n:n["readback"]["clock"]["latest"].update(source="b"*40)):
            value = copy.deepcopy(native); change(value)
            with self.assertRaises(AssertionError): active_anchor(value,"a"*40,11000)

    def test_rejects_ambiguous_or_recycled_and_nonadvancing_identity(self):
        _, original = self.fixture()
        mutations = (lambda s:s.update(baselineWebContentPids=[42]),
                     lambda s:s["samples"][1]["renderer"].update(started="recycled PID"),
                     lambda s:s["samples"][1]["renderer"].update(pid=50),
                     lambda s:s["samples"][1]["after"].update(documentToken="replaced"),
                     lambda s:s["samples"][1]["before"].update(nativeFrameAt=100),
                     lambda s:s["samples"][1].update(qualified=False))
        for mutate in mutations:
            state = copy.deepcopy(original); mutate(state)
            with self.assertRaises(AssertionError): validate_memory(state)
