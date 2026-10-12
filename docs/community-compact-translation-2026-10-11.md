# Community: compact layout and automatic translation (Testnet)

Forms, developer replies and moderation controls start collapsed. Three category tabs share one row; sorting and refresh use a compact filter row. Posts show four preview lines with Read more / Show less only when needed. Votes show icons and counts in one row, retaining accessible names. Inputs retain 16px text and primary controls retain touch targets of at least 44px. All CSS is scoped to the feedback dialog.

Public post titles, descriptions, review comments and developer replies are translated when visible. Replies mount when expanded. Target language follows the existing locale preference: automatic device detection by default, or the user's explicit app language. Original text is never overwritten and can be displayed with Show original. Supported target languages match the existing 19 app locales. Added controls are fully localized for the release languages en/de/es/zh/vi; existing draft languages retain their fallback behavior.

The server reads stored public posts by ID and network, rejects hidden posts, and sends only authored text to MyMemory GET translation. Usernames, account IDs, authentication headers and private content are not sent. Translation cache keys include network, post/reply ID, target language and current source text, so editing invalidates previous translations. Native backend MongoDB cache entries expire after seven days. Public Testnet currently proxies its existing account/community backend, so its new gateway translation adapter reads the same public Testnet category/page/sort without forwarding authentication and uses the bounded in-memory translation cache. Persistent MongoDB translation caching becomes active when the native handler is deployed with a database. Mainnet does not need to be changed for this Testnet release. In-flight requests are deduplicated; provider requests are limited to three concurrently per server instance with a bounded queue and deadlines. Long text is split below the provider's 500 UTF-8 byte limit, preserving Unicode characters and preferring word boundaries.

Provider: https://mymemory.translated.net/doc/spec.php . Anonymous free usage has a 5,000-character daily quota per provider rules; this Testnet integration has no paid key. Quota errors, timeouts and service failures preserve the readable original and show a localized notice. Translation quality is machine-generated and needs human review; the original remains authoritative.

Validation performed:
- Frontend TypeScript/Vite build, 12 existing locale tests and release translation inventory passed.
- Backend TypeScript build passed.
- 67 backend gateway/translation/handler tests passed, including thirteen added translation tests: all locale codes, Unicode/byte chunks, cache identity, same-language skip, in-flight deduplication, provider concurrency, provider failures/quota, network/hidden-post checks, persistence/edit/reply/expiry behavior.
- Live synthetic Chinese → German and German → English translation succeeded. An initial cold Chinese request exceeded the old 4.5-second limit; the provider timeout was adjusted to eight seconds while retaining an overall 30-second deadline.
- Testnet gateway routing tests cover the deployed proxy topology, public source retrieval without cookies/tokens, invalid context, hidden/Mainnet exclusions, reply translation and cache reuse. Initial deployed translation returned 404 because the established upstream lacked the new route; the Testnet-only gateway adapter corrects that.
- ESLint passed for all three changed Community components.
- Existing write/vote/moderation permissions and gameplay persistence/purchase handler tests remain passing.

Pending real device QA: visual layout and scroll reduction on iPhone/Pi Browser, Android and tablet; keyboard and rotation behavior; opening/closing replies and Read more; switching original/translation and app/device language; perceived translation quality on real community posts. No browser or physical-device test is claimed.

Deploy only to Cryptoid Evolution Testnet. Preserve the full campaign combat preview, cockpit HUD and full-life boss Shard reward from the preceding commit. Do not merge or publish to the Mainnet production domain.
