import { FULL_SESSION_LIMITS } from './fullSessionFormat.ts';

export const FULL_SESSION_TEXT_PART_CHARS = 96_000;
export type FullSessionText = { id: string; text: string; offsets: number[] };
type ShareHost = { share?: (data: ShareData) => Promise<void>; canShare?: (data: ShareData) => boolean };

export function fullSessionFileName(id: string) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('invalid_diagnostic_id');
  return `cryptoid-full-session-${id}.json`;
}

// Preparation follows the fresh owner check. The OS picker needs a second,
// direct user click, without an intervening await or automatic upload.
export function shareableFullSessionFile(blob: Blob, id: string, host: ShareHost): File | null {
  const name = fullSessionFileName(id);
  if (typeof File !== 'function' || typeof host.share !== 'function' || typeof host.canShare !== 'function') return null;
  for (const [filename, type] of [[name, 'application/json'], [name + '.txt', 'text/plain']]) {
    const file = new File([blob], filename, { type });
    try { if (host.canShare({ files: [file] })) return file; } catch { /* Download and text stay available. */ }
  }
  return null;
}

// Read only, outside combat. Mount one bounded part in the mobile textarea.
export async function fullSessionText(blob: Blob, id: string): Promise<FullSessionText> {
  fullSessionFileName(id);
  if (blob.size > FULL_SESSION_LIMITS.bytes + 65_536) throw new Error('diagnostic_capture_too_large');
  const text = await blob.text(), offsets = [0];
  while (offsets.at(-1)! < text.length) {
    let end = Math.min(text.length, offsets.at(-1)! + FULL_SESSION_TEXT_PART_CHARS);
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1]) && /[\uDC00-\uDFFF]/.test(text[end])) end--;
    offsets.push(end);
  }
  return { id, text, offsets };
}

export function fullSessionTextPart(capture: FullSessionText, index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= capture.offsets.length - 1) throw new Error('invalid_diagnostic_part');
  return JSON.stringify({ version: 1, format: 'cryptoid-full-session-text-part', session: capture.id,
    part: index + 1, total: capture.offsets.length - 1, characters: capture.text.length,
    data: capture.text.slice(capture.offsets[index], capture.offsets[index + 1]) });
}
