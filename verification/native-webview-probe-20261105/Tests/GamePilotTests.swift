import XCTest

@MainActor
final class GamePilotTests: XCTestCase {
    func testOriginalGuestPauseMenuExitAndNormalReport() throws {
        continueAfterFailure = false
        executionTimeAllowance = 300
        let app = XCUIApplication()
        app.launchArguments = ["--game-pilot"]
        app.launch()
        defer { app.terminate() }
        let result = app.textViews["native-observation"]
        XCTAssertTrue(result.waitForExistence(timeout: 15))
        func record() throws -> [String: Any] {
            let text = try XCTUnwrap(result.value as? String)
            return try XCTUnwrap(JSONSerialization.jsonObject(with: Data(text.utf8)) as? [String: Any])
        }
        func observe() throws -> [String: Any] {
            let before = ((try? record()["readback"] as? [String: Any])?["sequence"] as? Int) ?? 0
            app.buttons["native-read"].tap()
            let predicate = NSPredicate { _, _ in
                let point = (try? record()["readback"] as? [String: Any]) ?? [:]
                return (point["sequence"] as? Int ?? 0) > before
            }
            XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: predicate, object: nil)], timeout: 10), .completed)
            let data = try record()
            XCTAssertEqual(data["nativeContentTerminations"] as? Int, 0)
            XCTAssertEqual(data["navigationErrors"] as? Int, 0)
            XCTAssertNil(data["readbackFailed"])
            return try XCTUnwrap(data["readback"] as? [String: Any])
        }
        func clock(_ point: [String: Any]) -> [String: Any] {
            (point["clock"] as? [String: Any])?["latest"] as? [String: Any] ?? [:]
        }
        func scene(_ point: [String: Any]) -> [String: Any] { point["scene"] as? [String: Any] ?? [:] }
        func tap(_ name: String, last: Bool = false) {
            let matches = app.webViews.buttons.matching(identifier: name)
            let button = last ? matches.element(boundBy: max(0, matches.count-1)) : matches.firstMatch
            XCTAssertTrue(button.waitForExistence(timeout: 30), name)
            button.tap()
        }
        tap("Testszene vorbereiten")
        let menu = try observe()
        XCTAssertEqual(menu["toggles"] as? [Bool], [false, true])
        tap("Boss-2-Test öffnen")
        // Native wait allows the authored initial pause and fonts/layout to settle.
        XCTAssertTrue(app.webViews.buttons.matching(identifier: "Fortsetzen").firstMatch.waitForExistence(timeout: 30))
        let initial = try observe()
        XCTAssertEqual(scene(initial)["status"] as? String, "paused")
        tap("Fortsetzen", last: true)
        // No state injection or clock acceleration. Wait through the real countdown.
        Thread.sleep(forTimeInterval: 12)
        let active = try observe()
        XCTAssertEqual(clock(active)["mode"] as? String, "running")
        XCTAssertEqual(scene(active)["status"] as? String, "playing")
        XCTAssertEqual(scene(active)["reactorOpen"] as? Bool, true)
        Thread.sleep(forTimeInterval: 12)
        let advanced = try observe()
        XCTAssertEqual(clock(advanced)["mode"] as? String, "running")
        XCTAssertGreaterThan(try XCTUnwrap(clock(advanced)["elapsedMs"] as? Double),
                             try XCTUnwrap(clock(active)["elapsedMs"] as? Double) + 8000)
        XCTAssertGreaterThan(try XCTUnwrap(scene(advanced)["frameAt"] as? Double),
                             try XCTUnwrap(scene(active)["frameAt"] as? Double))
        // Second bounded active window for the external PID/RSS sampler.
        // Same native snapshot/clock and UI actions; no extra JS or time injection.
        Thread.sleep(forTimeInterval: 8)
        tap("Pause")
        let paused = try observe()
        XCTAssertEqual(clock(paused)["mode"] as? String, "paused")
        Thread.sleep(forTimeInterval: 2)
        let held = try observe()
        XCTAssertEqual(clock(held)["elapsedMs"] as? Double, clock(paused)["elapsedMs"] as? Double)
        tap("Fortsetzen", last: true)
        Thread.sleep(forTimeInterval: 5)
        let resumed = try observe()
        XCTAssertEqual(clock(resumed)["mode"] as? String, "running")
        let weapon = app.webViews.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Waffen ·")).firstMatch
        XCTAssertTrue(weapon.waitForExistence(timeout: 15))
        weapon.tap()
        let weaponPause = try observe()
        XCTAssertEqual(clock(weaponPause)["mode"] as? String, "paused")
        tap("Zurück ins Spiel")
        Thread.sleep(forTimeInterval: 5)
        let weaponResume = try observe()
        XCTAssertEqual(clock(weaponResume)["mode"] as? String, "running")
        tap("Zur Startseite")
        tap("Spiel verlassen")
        let ended = try observe()
        XCTAssertEqual(clock(ended)["mode"] as? String, "ended")
        XCTAssertEqual(ended["mounted"] as? Bool, false)
        tap("Letzten Testbericht vorbereiten")
        tap("Berichtstext in Teilen anzeigen")
        XCTAssertTrue(app.webViews.textViews["Diagnosebericht"].waitForExistence(timeout: 20))
        _ = try observe()
        XCTAssertEqual(try record()["reportExportObserved"] as? Bool, true)
        app.buttons["native-finish"].tap()
        XCTAssertEqual(try record()["pilotComplete"] as? Bool, true)
    }
}
