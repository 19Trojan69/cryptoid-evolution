import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const diagnosticRuns = sqliteTable("diagnostic_runs", {
  id: text("id").primaryKey(),
  revision: integer("revision").notNull(),
  receivedAt: integer("received_at").notNull(),
  clientVersion: text("client_version").notNull(),
  traceJson: text("trace_json").notNull(),
});
