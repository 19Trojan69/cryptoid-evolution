import { backupTrace, BACKUP_MAX_BYTES } from "../src/pages/traceBackupFormat.ts";
type Prepared = { bind: (...values: unknown[]) => Prepared; first: <T>() => Promise<T | null> };
export type DiagnosticDB = { prepare: (sql: string) => Prepared; batch: (statements: Prepared[]) => Promise<unknown> };
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
export async function handleDiagnostics(request: Request, db: DiagnosticDB, now = Date.now()) {
  // The hosting platform enforces the unchanged owner-private Site audience.
  // This shared private record contains no identity, account or wallet fields.
  if (request.method === "GET") {
    await db.batch([db.prepare("DELETE FROM diagnostic_runs WHERE received_at < ?").bind(now - 7 * 86400000)]);
    const id = new URL(request.url).searchParams.get("runId");
    if (id && !/^[\w-]{8,80}$/.test(id)) return response({ error: "invalid id" }, 400);
    const row = await (
      id
        ? db.prepare("SELECT id, revision, received_at, trace_json FROM diagnostic_runs WHERE id = ?").bind(id)
        : db.prepare(
            "SELECT id, revision, received_at, trace_json FROM diagnostic_runs WHERE client_version != 'server-qa' ORDER BY received_at DESC LIMIT 1"
          )
    ).first<{ id: string; revision: number; received_at: number; trace_json: string }>();
    return response({
      ready: true,
      latest: row
        ? { runId: row.id, revision: row.revision, savedAt: row.received_at, trace: JSON.parse(row.trace_json) }
        : null,
    });
  }
  if (request.method !== "POST") return response({ error: "method" }, 405);
  if (request.headers.get("sec-fetch-site") === "cross-site") return response({ error: "origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return response({ error: "content type" }, 415);
  const reader = request.body?.getReader();
  if (!reader) return response({ error: "body" }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > BACKUP_MAX_BYTES + 1024) {
      await reader.cancel();
      return response({ error: "size" }, 413);
    }
    chunks.push(part.value);
  }
  let body;
  try {
    const bytes = new Uint8Array(size);
    let at = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, at);
      at += chunk.length;
    }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return response({ error: "json" }, 400);
  }
  if (
    !/^[\w-]{8,80}$/.test(body?.runId) ||
    !Number.isSafeInteger(body.revision) ||
    body.revision < 1 ||
    body.revision > 1e9
  )
    return response({ error: "packet" }, 400);
  const trace = backupTrace(body.trace);
  if (!trace) return response({ error: "trace" }, 400);
  const version = body.clientVersion === "server-qa" ? "server-qa" : "V4";
  await db.batch([
    db
      .prepare(
        "INSERT INTO diagnostic_runs (id, revision, received_at, client_version, trace_json) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision, received_at=excluded.received_at, client_version=excluded.client_version, trace_json=excluded.trace_json WHERE excluded.revision > diagnostic_runs.revision"
      )
      .bind(body.runId, body.revision, now, version, JSON.stringify(trace)),
    db.prepare("DELETE FROM diagnostic_runs WHERE received_at < ?").bind(now - 7 * 86400000),
    db.prepare(
      "DELETE FROM diagnostic_runs WHERE id NOT IN (SELECT id FROM diagnostic_runs ORDER BY received_at DESC LIMIT 8)"
    ),
  ]);
  const stored = await db
    .prepare("SELECT revision, received_at FROM diagnostic_runs WHERE id = ?")
    .bind(body.runId)
    .first<{ revision: number; received_at: number }>();
  if (!stored) return response({ error: "not retained" }, 503);
  return response({
    runId: body.runId,
    revision: stored.revision,
    savedAt: stored.received_at,
  });
}
