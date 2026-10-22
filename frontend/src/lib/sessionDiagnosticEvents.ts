// Inert outside a verified owner's recorder. No payload, header or URL is read here.
export type SessionSignal = 'resource' | 'boundary' | 'request' | 'weapon' | 'queue' | 'lifecycle';
type Listener = (kind: SessionSignal, details: Record<string, unknown>) => void;
const listeners = new Set<Listener>();
export function observeSessionDiagnostics(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function sessionDiagnostic(kind: SessionSignal, details: Record<string, unknown>) {
  for (const listener of listeners) {
    try { listener(kind, details); } catch { /* Diagnostics must never affect the operation. */ }
  }
}
export const sessionDiagnosticsActive = () => listeners.size > 0;
