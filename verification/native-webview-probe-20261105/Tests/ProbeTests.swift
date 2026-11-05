import XCTest

@MainActor
final class ProbeTests: XCTestCase {
    func testTrustedNativeControlAndDOMReadback() throws {
        continueAfterFailure = false
        executionTimeAllowance = 120
        let app = XCUIApplication()
        app.launchArguments = ["--control-only"]
        app.launch()
        defer { app.terminate() }
        let button = app.webViews.buttons["Native Kontrollberührung"]
        XCTAssertTrue(button.waitForExistence(timeout: 45))
        let result = app.textViews["native-observation"]
        XCTAssertTrue(result.waitForExistence(timeout: 10))
        func read() throws -> [String: Any] {
            let text = try XCTUnwrap(result.value as? String)
            return try XCTUnwrap(JSONSerialization.jsonObject(with: Data(text.utf8)) as? [String: Any])
        }
        let loaded = NSPredicate { _, _ in
            (try? read()["loaded"] as? Bool) == true
        }
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: loaded, object: nil)], timeout: 10), .completed)
        let before = try read()
        XCTAssertEqual(before["loaded"] as? Bool, true)
        XCTAssertEqual(before["clickCount"] as? Int, 0)
        // A visible page alone must not be accepted as a completed calibration.
        app.buttons["native-finish"].tap()
        XCTAssertEqual(try read()["controlComplete"] as? Bool, false)
        XCTAssertEqual(try read()["completionRejectedBeforeClick"] as? Bool, true)
        button.tap()
        let clicked = NSPredicate { _, _ in
            guard let data = try? read() else { return false }
            return data["clickCount"] as? Int == 1 && data["trustedClick"] as? Bool == true
        }
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: clicked, object: nil)], timeout: 10), .completed)
        app.buttons["native-read"].tap()
        let probed = NSPredicate { _, _ in
            guard let data = try? read(), let dom = data["readback"] as? [String: Any] else { return false }
            return dom["count"] as? Int == 1 && dom["visibilityState"] as? String == "visible"
        }
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: probed, object: nil)], timeout: 10), .completed)
        app.buttons["native-finish"].tap()
        let final = try read()
        XCTAssertEqual(final["controlComplete"] as? Bool, true)
        XCTAssertEqual(final["nativeContentTerminations"] as? Int, 0)
        XCTAssertEqual(final["navigationErrors"] as? Int, 0)
        XCTAssertEqual(final["gameLoaded"] as? Bool, false)
    }
}
