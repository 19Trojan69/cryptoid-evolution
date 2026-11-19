# Live connection status in the owner Admin

Prepared from the released Mainnet source `7716dcd8f011e11464f32b7f2270e07d15e96d2c` on 19 November 2026.

The owner requested automatic updates and a green-to-red assessment of good and bad response times, with a bar in addition to the numeric value. The owner was advised to retain a 15-second interval for normal monitoring.

The existing owner-only read endpoint is queried immediately on opening and 15 seconds after each completed request. Only one request or next-cycle timeout is active. Manual refresh uses the same controller. Hidden, page-hidden, offline and unmounted views cancel requests and timers. Returning to the visible page or reconnecting checks immediately. Obsolete replies cannot replace a current report. A transient failure retains the previous report with neutral, explicitly stale readings and retries after 15 seconds. HTTP 401/403 clears the report and stops automatic requests until an explicit refresh or a new session.

| Response time | Color | Label |
| --- | --- | --- |
| 0–500 ms | Green | Schnell |
| More than 500 through 1,000 ms | Yellow | Normal |
| More than 1,000 through 2,500 ms | Orange | Langsam |
| More than 2,500 ms | Red with a static glow | Sehr langsam |

These are application display guidelines, not Pi service-level guarantees. Existing service warnings are at least orange, and service errors are red even if the request failed quickly. Unknown evidence, including the payment service without an existing completed Mainnet receipt, remains neutral. Missing or invalid timings are not presented as fast connections. Bars show elapsed request time on a 0–4,000 ms scale, with longer bars meaning slower responses; the exact uncapped milliseconds remain visible. Color is accompanied by status, timing and rating text plus accessible meter values. No blinking animation is added.

The backend probes, owner authorization, payment/NFT release gates, game, assets, prices and saved accounts are unchanged. This feature adds no background service, health history, transaction, mint or reservation. It does not establish NFT readiness or the Core Team's application approval status.

Validation: the full frontend build passed 529 tests, localization checks, TypeScript and Vite. The nine added cases execute threshold boundaries, actual component output and lifecycle scheduling, including overlap, aborts, obsolete replies, offline recovery, stale readings and authorization denial. The unchanged backend passed 210 tests with one pre-existing skipped case. Changed TypeScript/TSX modules pass ESLint; the patch passes whitespace checks. The hull generator retains its existing output with no tracked manifest change.

Native browser validation could not be completed in this environment: a terminal-launched Chromium failed on a denied local socket, and the available cloud browser could not connect to the workspace's localhost. No physical iPhone/Pi Browser result, native visual acceptance or live owner-session probe is claimed. Temporary synthetic UI fixtures were removed from the release source. The work branch has automatic deployments disabled.
