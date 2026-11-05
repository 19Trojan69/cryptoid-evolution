import UIKit
import WebKit

// This first calibration deliberately loads no game, account, deployment or URL.
// WebContent termination is recorded by the native delegate, never auto-reloaded.
@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = ProbeController()
        self.window = window
        window.makeKeyAndVisible()
        return true
    }
}

final class ProbeController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    private var webView: WKWebView!
    private let output = UITextView()
    private var record: [String: Any] = [
        "version": 1, "gameLoaded": false, "controlComplete": false,
        "nativeContentTerminations": 0, "navigationErrors": 0,
        "completionRejectedBeforeClick": false, "loaded": false,
        "clickCount": 0, "trustedClick": false, "readback": [:],
        "nativeTerminationCallbackObserved": false,
        "physicalDeviceTest": false, "automaticReload": false
    ]

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        record["systemVersion"] = UIDevice.current.systemVersion
        record["systemName"] = UIDevice.current.systemName
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.userContentController.add(self, name: "control")
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.accessibilityIdentifier = "native-control-webview"
        output.accessibilityIdentifier = "native-observation"
        output.isEditable = false
        output.font = .monospacedSystemFont(ofSize: 10, weight: .regular)
        let read = UIButton(type: .system)
        read.setTitle("Native Probe lesen", for: .normal)
        read.accessibilityIdentifier = "native-read"
        read.addTarget(self, action: #selector(readControl), for: .touchUpInside)
        let finish = UIButton(type: .system)
        finish.setTitle("Kontrolle abschließen", for: .normal)
        finish.accessibilityIdentifier = "native-finish"
        finish.addTarget(self, action: #selector(finishControl), for: .touchUpInside)
        let buttons = UIStackView(arrangedSubviews: [read, finish])
        buttons.distribution = .fillEqually
        for child in [webView!, buttons, output] {
            child.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(child)
        }
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: buttons.topAnchor),
            buttons.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            buttons.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            buttons.heightAnchor.constraint(equalToConstant: 48),
            buttons.bottomAnchor.constraint(equalTo: output.topAnchor),
            output.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            output.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            output.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            output.heightAnchor.constraint(equalToConstant: 160)
        ])
        persist()
        guard ProcessInfo.processInfo.arguments.contains("--control-only") else {
            record["launchRejected"] = true
            persist()
            return
        }
        webView.loadHTMLString(Self.controlPage, baseURL: nil)
    }

    private func persist() {
        record["savedAt"] = Date().timeIntervalSince1970 * 1000
        guard let data = try? JSONSerialization.data(withJSONObject: record, options: [.sortedKeys]),
              data.count <= 12_288 else { return }
        output.text = String(data: data, encoding: .utf8)
        let path = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("probe-result.json")
        try? data.write(to: path, options: .atomic)
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame,
              let data = message.body as? [String: Any],
              data["kind"] as? String == "click",
              let count = data["count"] as? Int, count == 1,
              let trusted = data["trusted"] as? Bool else { return }
        record["clickCount"] = count
        record["trustedClick"] = trusted
        persist()
    }

    @objc private func readControl() {
        // Fixed read-only DOM/native-page metadata. No game globals or state writes.
        let script = """
        (() => ({count:Number(document.querySelector('#control-count')?.textContent),
          title:document.querySelector('h1')?.textContent,
          timeOrigin:performance.timeOrigin, readyState:document.readyState,
          visibilityState:document.visibilityState, userAgent:navigator.userAgent,
          width:innerWidth,height:innerHeight,devicePixelRatio:devicePixelRatio}))()
        """
        webView.evaluateJavaScript(script) { [weak self] value, error in
            guard let self = self else { return }
            if let data = value as? [String: Any], error == nil { self.record["readback"] = data }
            else { self.record["readbackFailed"] = true }
            self.persist()
        }
    }

    @objc private func finishControl() {
        let readback = record["readback"] as? [String: Any] ?? [:]
        let complete = record["loaded"] as? Bool == true
            && record["clickCount"] as? Int == 1 && record["trustedClick"] as? Bool == true
            && readback["count"] as? Int == 1
            && readback["title"] as? String == "Native WebView-Kontrolle"
            && readback["visibilityState"] as? String == "visible"
            && record["nativeContentTerminations"] as? Int == 0
            && record["navigationErrors"] as? Int == 0 && record["readbackFailed"] == nil
        record["controlComplete"] = complete
        if !complete && record["clickCount"] as? Int == 0 { record["completionRejectedBeforeClick"] = true }
        persist()
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        record["loaded"] = true
        persist()
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        recordNavigationError(error)
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        recordNavigationError(error)
    }
    private func recordNavigationError(_ error: Error) {
        let native = error as NSError
        record["navigationErrors"] = (record["navigationErrors"] as? Int ?? 0) + 1
        record["lastNavigationError"] = ["domain": native.domain, "code": native.code]
        persist()
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        record["nativeContentTerminations"] = (record["nativeContentTerminations"] as? Int ?? 0) + 1
        record["nativeTerminationCallbackObserved"] = true
        record["controlComplete"] = false
        persist()
    }

    private static let controlPage = """
    <!doctype html><html lang="de"><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font:18px system-ui;padding:24px}button{font:inherit;padding:24px}output{display:block;margin:20px}</style>
    <h1>Native WebView-Kontrolle</h1><button id="control">Native Kontrollberührung</button>
    <output id="control-count">0</output><script>
    document.querySelector('#control').addEventListener('click',event=>{
      const count=Number(document.querySelector('#control-count').textContent)+1;
      document.querySelector('#control-count').textContent=String(count);
      window.webkit.messageHandlers.control.postMessage({kind:'click',count,trusted:event.isTrusted});
    });
    </script></html>
    """
}
