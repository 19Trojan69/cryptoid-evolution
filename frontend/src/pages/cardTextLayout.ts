/** Word wrapping shared by measurement and paint. Long words are split, never clipped. */
export function wrapCardText(text: string, maxWidth: number, measure: (text: string) => number): string[] {
  if (!(maxWidth > 0)) throw new Error('Card text width must be positive');
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (measure(next) <= maxWidth) { line = next; continue; }
      if (line) { lines.push(line); line = ''; }
      for (const character of word) {
        if (line && measure(line + character) > maxWidth) { lines.push(line); line = ''; }
        line += character;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}
