export type PendingSave = { path: '/rewards/event' | '/leaderboard/score' | '/progress/checkpoint'; body: Record<string, unknown> & { runId: string } };

// Replace only a consecutive unsent checkpoint for the same combat phase.
// Reward/score entries are ordering barriers and are never removed. The entry
// currently uploading is immutable, including when its request is retried.
export function appendPendingSave(entries: PendingSave[], entry: PendingSave, uploading: PendingSave | null) {
  const tail = entries.at(-1);
  const combat = entry.body.combat as { stage?: number; encounter?: string } | undefined;
  const previous = tail?.body.combat as { stage?: number; encounter?: string } | undefined;
  if (entry.path === '/progress/checkpoint' && tail?.path === entry.path && tail !== uploading
    && tail.body.runId === entry.body.runId && combat && previous
    && combat.stage === previous.stage && combat.encounter === previous.encounter) entries[entries.length - 1] = entry;
  else entries.push(entry);
}
